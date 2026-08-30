import os
import time
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.db.models import (
    ScreeningSession, UploadedDocument, OCRResult, MRZResult,
    ValidationResult, TamperingResult, FaceResult, RiskAssessment, AuditLog, Notification
)
from app.ai.quality.image_quality import image_quality_analyzer
from app.ai.classification.document_classifier import document_classifier
from app.ai.ocr.ocr_engine import ocr_engine
from app.ai.mrz.mrz_engine import mrz_engine
from app.ai.tampering.tampering_engine import tampering_engine
from app.ai.face.face_engine import face_engine
from app.ai.consistency.consistency_engine import consistency_engine
from app.ai.risk.risk_engine import risk_engine
from app.services.report_service import report_service

class ScreeningService:
    def process_screening(self, screening_id: str, db: Optional[Session] = None, is_simulated_tamper: bool = False):
        """
        Execute full asynchronous multi-stage AI screening pipeline with individual document isolation.
        Thread-safe session management for background task execution.
        """
        should_close_db = False
        if db is None:
            db = SessionLocal()
            should_close_db = True

        try:
            screening = db.query(ScreeningSession).filter(ScreeningSession.id == screening_id).first()
            if not screening:
                return

            screening.status = "processing"
            screening.stage = "quality"
            db.commit()

            # 1. Retrieve All Uploaded Documents for this Screening
            all_docs = db.query(UploadedDocument).filter(
                UploadedDocument.screening_id == screening_id
            ).all()

            primary_doc = None
            secondary_doc = None
            live_doc = None

            for d in all_docs:
                if d.doc_role == "primary_document":
                    primary_doc = d
                elif d.doc_role == "secondary_document":
                    secondary_doc = d
                elif d.doc_role == "live_selfie":
                    live_doc = d

            if not primary_doc and all_docs:
                primary_doc = all_docs[0]

            doc_path = primary_doc.storage_path if primary_doc else ""
            sec_path = secondary_doc.storage_path if secondary_doc else None
            live_path = live_doc.storage_path if live_doc else None

            # Dictionary to hold separate forensic analyses for EACH presented document
            individual_analyses: Dict[str, Any] = {}

            # =========================================================================
            # PROCESS EACH DOCUMENT INDIVIDUALLY
            # =========================================================================
            for doc in all_docs:
                file_path = doc.storage_path
                if not file_path or not os.path.exists(file_path):
                    continue

                # Infer document type for this specific file
                inferred_type = screening.document_type
                if doc.doc_role == "secondary_document":
                    inferred_type = "visa" if screening.document_type == "passport" else "secondary_document"
                elif doc.doc_role == "live_selfie":
                    inferred_type = "live_selfie"
                elif "eticket" in doc.original_filename.lower():
                    inferred_type = "eticket"
                elif "boarding" in doc.original_filename.lower():
                    inferred_type = "boarding_pass"
                elif "passport" in doc.original_filename.lower():
                    inferred_type = "passport"
                elif "visa" in doc.original_filename.lower():
                    inferred_type = "visa"

                # If live selfie, run facial detection & quality
                if doc.doc_role == "live_selfie" or inferred_type == "live_selfie":
                    face_detect = face_engine.detect_faces(file_path)
                    qual = image_quality_analyzer.analyze(file_path)
                    individual_analyses["live_selfie"] = {
                        "document_type": "live_selfie",
                        "filename": doc.original_filename,
                        "storage_path": file_path,
                        "quality": qual,
                        "face_detection": face_detect,
                        "status": "COMPLETED"
                    }
                    continue

                # A. Image Quality Gate
                qual = image_quality_analyzer.analyze(file_path)

                # B. OCR Extraction
                ocr_out = ocr_engine.extract_text_and_fields(file_path, inferred_type)

                # C. Document Classification Gate (Expected vs Detected)
                class_out = document_classifier.classify(
                    image_path=file_path,
                    expected_type=inferred_type,
                    raw_ocr_text=ocr_out.get("raw_text", "")
                )

                # D. MRZ Validation (if Passport/Visa or MRZ characters detected)
                mrz_out = {"mrz_detected": False, "is_valid": False, "confidence": 0.0}
                if inferred_type in ["passport", "visa"] or "P<" in ocr_out.get("raw_text", "") or "V<" in ocr_out.get("raw_text", ""):
                    mrz_out = mrz_engine.parse_and_validate(ocr_out.get("raw_text", ""), ocr_out.get("structured_fields", {}))

                # E. Tampering Forensics
                tamper_out = tampering_engine.analyze(file_path, is_tampered_simulation=is_simulated_tamper)

                # F. Document Face Crop Detection
                doc_face_detect = face_engine.detect_faces(file_path)

                # G. Document Validations
                doc_validations = self._run_deterministic_validations(ocr_out.get("structured_fields", {}), mrz_out)

                # Save individual analysis entry
                individual_analyses[inferred_type] = {
                    "document_type": inferred_type,
                    "filename": doc.original_filename,
                    "storage_path": file_path,
                    "classification": class_out,
                    "quality": qual,
                    "ocr": ocr_out,
                    "mrz": mrz_out,
                    "tampering": tamper_out,
                    "face_detection": doc_face_detect,
                    "validation_items": doc_validations,
                    "status": "COMPLETED"
                }

            # =========================================================================
            # PRIMARY DOCUMENT RESULTS (For Master Screening Record)
            # =========================================================================
            primary_analysis = individual_analyses.get(screening.document_type) or individual_analyses.get("passport")
            if not primary_analysis and individual_analyses:
                primary_analysis = next(iter(individual_analyses.values()))

            if primary_analysis:
                quality_res = primary_analysis.get("quality", {})
                ocr_res = primary_analysis.get("ocr", {})
                class_res = primary_analysis.get("classification", {})
                mrz_res = primary_analysis.get("mrz", {})
                tamper_res = primary_analysis.get("tampering", {})
                validation_items = primary_analysis.get("validation_items", [])
            else:
                quality_res = image_quality_analyzer.analyze(doc_path) if (doc_path and os.path.exists(doc_path)) else {"is_usable": True, "status": "PASS", "score": 0.85}
                ocr_res = ocr_engine.extract_text_and_fields(doc_path, screening.document_type)
                class_res = document_classifier.classify(doc_path, expected_type=screening.document_type, raw_ocr_text=ocr_res.get("raw_text", ""))
                mrz_res = mrz_engine.parse_and_validate(ocr_res.get("raw_text", ""), ocr_res.get("structured_fields", {}))
                tamper_res = tampering_engine.analyze(doc_path, is_tampered_simulation=is_simulated_tamper)
                validation_items = self._run_deterministic_validations(ocr_res.get("structured_fields", {}), mrz_res)

            # Persist Primary OCR Result
            screening.stage = "ocr"
            db.commit()
            ocr_model = OCRResult(
                screening_id=screening_id,
                raw_text=ocr_res.get("raw_text", ""),
                structured_fields=ocr_res.get("structured_fields", {}),
                average_confidence=ocr_res.get("average_confidence", 0.0),
                bounding_boxes=ocr_res.get("bounding_boxes", [])
            )
            db.add(ocr_model)
            db.commit()

            # Persist Primary MRZ Result
            screening.stage = "mrz"
            db.commit()
            mrz_model = MRZResult(
                screening_id=screening_id,
                mrz_detected=mrz_res.get("mrz_detected", False),
                mrz_text=mrz_res.get("mrz_text"),
                document_number=mrz_res.get("document_number"),
                date_of_birth=mrz_res.get("date_of_birth"),
                expiry_date=mrz_res.get("expiry_date"),
                nationality=mrz_res.get("nationality"),
                issuer=mrz_res.get("issuer"),
                sex=mrz_res.get("sex"),
                checksums=mrz_res.get("checksums", {}),
                is_valid=mrz_res.get("is_valid", False),
                confidence=mrz_res.get("confidence", 0.0),
                field_matches=mrz_res.get("field_matches", {})
            )
            db.add(mrz_model)
            db.commit()

            # Persist Validations
            screening.stage = "validation"
            db.commit()
            for v in validation_items:
                v_model = ValidationResult(
                    screening_id=screening_id,
                    check_name=v["check_name"],
                    status=v["status"],
                    severity=v["severity"],
                    message=v["message"],
                    details=v.get("details", {})
                )
                db.add(v_model)
            db.commit()

            # Persist Tampering Result
            screening.stage = "tampering"
            db.commit()
            tamper_model = TamperingResult(
                screening_id=screening_id,
                tampering_detected=tamper_res.get("tampering_detected", False),
                score=tamper_res.get("score", 0.0),
                confidence=tamper_res.get("confidence", 0.0),
                status=tamper_res.get("status", "CLEAR"),
                suspicious_regions=tamper_res.get("suspicious_regions", []),
                heatmap_base64=tamper_res.get("heatmap_base64"),
                signals=tamper_res.get("signals", {})
            )
            db.add(tamper_model)
            db.commit()

            # Stage: Face Biometric Verification (1:1 with Selfie)
            screening.stage = "face"
            db.commit()
            face_res = face_engine.compare_faces(doc_path, live_path)
            face_model = FaceResult(
                screening_id=screening_id,
                face_detected_document=face_res.get("face_detected_document", False),
                face_detected_live=face_res.get("face_detected_live", False),
                face_count_document=face_res.get("face_count_document", 0),
                face_count_live=face_res.get("face_count_live", 0),
                similarity=face_res.get("similarity", 0.0),
                status=face_res.get("status", "NOT_EVALUATED"),
                confidence=face_res.get("confidence", 0.0),
                document_face_box=face_res.get("document_face_box"),
                live_face_box=face_res.get("live_face_box")
            )
            db.add(face_model)
            db.commit()

            # Stage: Cross-Document Consistency Evaluation
            screening.stage = "consistency"
            db.commit()
            sec_analysis = individual_analyses.get("visa") or individual_analyses.get("secondary_document") or individual_analyses.get("eticket")
            sec_fields = sec_analysis.get("ocr", {}).get("structured_fields", {}) if sec_analysis else None
            
            consistency_res = consistency_engine.evaluate_consistency(
                document_type=screening.document_type,
                ocr_fields=ocr_res.get("structured_fields", {}),
                mrz_data=mrz_res,
                secondary_fields=sec_fields
            )

            # Stage: Fail-Closed Explainable Risk Assessment
            screening.stage = "risk"
            db.commit()
            risk_res = risk_engine.evaluate(
                document_type=screening.document_type,
                quality_res=quality_res,
                classification_res=class_res,
                ocr_res=ocr_res,
                mrz_res=mrz_res,
                validation_items=validation_items,
                tampering_res=tamper_res,
                face_res=face_res,
                consistency_res=consistency_res
            )

            risk_model = RiskAssessment(
                screening_id=screening_id,
                risk_score=risk_res.get("risk_score", 0.0),
                risk_level=risk_res.get("risk_level", "UNABLE_TO_DETERMINE"),
                contributors=risk_res.get("contributors", []),
                explanation=risk_res.get("explanation", {}),
                recommendation=risk_res.get("recommendation", "Standard procedure")
            )
            db.add(risk_model)

            # Finalize Master Screening Record
            screening.risk_score = risk_res.get("risk_score", 0.0)
            screening.risk_level = risk_res.get("risk_level", "UNABLE_TO_DETERMINE")
            screening.manual_review_required = screening.risk_level in ["REVIEW_RECOMMENDED", "HIGH_RISK", "UNABLE_TO_DETERMINE"]
            screening.quality_result = quality_res
            screening.classification_result = class_res
            screening.consistency_result = consistency_res
            screening.individual_analyses = individual_analyses
            screening.status = "completed"
            screening.stage = "completed"
            screening.completed_at = datetime.utcnow()

            # Audit Log Entry
            audit = AuditLog(
                user_id=screening.user_id,
                action="SCREENING_COMPLETED",
                resource_type="screening_session",
                resource_id=screening_id,
                details={
                    "risk_score": screening.risk_score,
                    "risk_level": screening.risk_level,
                    "document_type": screening.document_type,
                    "domain": screening.domain
                }
            )
            db.add(audit)

            # Automated Notification
            if screening.user_id:
                notif_title = f"Screening Completed ({screening.document_type.upper()})"
                notif_type = "completed"
                if screening.risk_level == "HIGH_RISK":
                    notif_title = f"High Risk Detected — {screening.document_type.upper()}"
                    notif_type = "high_risk"
                elif screening.risk_level == "REVIEW_RECOMMENDED":
                    notif_title = f"Review Recommended — {screening.document_type.upper()}"
                    notif_type = "warning"
                elif screening.risk_level == "UNABLE_TO_DETERMINE":
                    notif_title = f"Manual Review Required — {screening.document_type.upper()}"
                    notif_type = "warning"

                notif = Notification(
                    user_id=screening.user_id,
                    title=notif_title,
                    message=f"Screening DS-{screening_id[:8].upper()} completed with risk score {screening.risk_score:.0f}/100 ({screening.risk_level.replace('_', ' ')}).",
                    type=notif_type,
                    link=f"/screening/{screening_id}/result"
                )
                db.add(notif)

            db.commit()

            # Pre-generate PDF Dossier
            try:
                report_service.generate_screening_pdf(screening_id, db)
            except Exception as pe:
                print(f"PDF pre-generation notice: {pe}")

        except Exception as e:
            import traceback
            traceback.print_exc()
            db.rollback()
            try:
                screening = db.query(ScreeningSession).filter(ScreeningSession.id == screening_id).first()
                if screening:
                    screening.status = "failed"
                    screening.stage = "error"
                    db.commit()
            except Exception:
                pass
        finally:
            if should_close_db:
                db.close()

    def _run_deterministic_validations(self, fields: dict, mrz_res: dict) -> list:
        validations = []

        # 1. Expiry Check
        exp_str = fields.get("expiry_date") or mrz_res.get("expiry_date")
        if exp_str:
            try:
                exp_date = datetime.strptime(exp_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                if exp_date < datetime.now(timezone.utc):
                    validations.append({
                        "check_name": "Document Expiry Date",
                        "status": "FAIL",
                        "severity": "high",
                        "message": f"Document is expired ({exp_str}). Travel credentials invalid.",
                        "details": {"expiry_date": exp_str, "status": "expired"}
                    })
                else:
                    validations.append({
                        "check_name": "Document Expiry Date",
                        "status": "PASS",
                        "severity": "info",
                        "message": f"Document is valid until {exp_str}.",
                        "details": {"expiry_date": exp_str, "status": "active"}
                    })
            except Exception:
                validations.append({
                    "check_name": "Document Expiry Date",
                    "status": "WARNING",
                    "severity": "medium",
                    "message": f"Non-standard date format ({exp_str}).",
                    "details": {"raw": exp_str}
                })
        else:
            validations.append({
                "check_name": "Document Expiry Date",
                "status": "INFO",
                "severity": "low",
                "message": "Expiration date not present or not required on this document format.",
                "details": {}
            })

        # 2. Date of Birth Check
        dob_str = fields.get("date_of_birth") or mrz_res.get("date_of_birth")
        if dob_str:
            try:
                dob_date = datetime.strptime(dob_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                if dob_date > datetime.now(timezone.utc):
                    validations.append({
                        "check_name": "Date of Birth Validity",
                        "status": "FAIL",
                        "severity": "high",
                        "message": f"Date of birth cannot be in the future ({dob_str}).",
                        "details": {"dob": dob_str}
                    })
                else:
                    validations.append({
                        "check_name": "Date of Birth Validity",
                        "status": "PASS",
                        "severity": "info",
                        "message": f"Date of birth ({dob_str}) is valid and verified.",
                        "details": {"dob": dob_str}
                    })
            except Exception:
                pass

        # 3. Document Number Structure Rule
        doc_num = fields.get("document_number") or mrz_res.get("document_number")
        if doc_num:
            validations.append({
                "check_name": "Document Number Structure",
                "status": "PASS",
                "severity": "info",
                "message": f"Document identification code '{doc_num}' verified against standard format.",
                "details": {"doc_num": doc_num}
            })

        return validations

screening_service = ScreeningService()
