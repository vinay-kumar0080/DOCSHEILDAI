from datetime import datetime
from typing import Dict, Any, List
from app.core.config import settings

class RiskEngine:
    def __init__(self):
        self.weights = {
            "tampering": settings.WEIGHT_TAMPERING,
            "mrz_failure": settings.WEIGHT_MRZ_FAILURE,
            "field_mismatch": settings.WEIGHT_FIELD_MISMATCH,
            "face_mismatch": settings.WEIGHT_FACE_MISMATCH,
            "expired_doc": settings.WEIGHT_EXPIRED_DOC,
            "poor_quality": settings.WEIGHT_POOR_QUALITY,
            "low_classification_conf": settings.WEIGHT_CLASSIFICATION_LOW_CONF
        }

    def evaluate(
        self,
        document_type: str,
        quality_res: Dict[str, Any],
        classification_res: Dict[str, Any],
        ocr_res: Dict[str, Any],
        mrz_res: Dict[str, Any],
        validation_items: List[Dict[str, Any]],
        tampering_res: Dict[str, Any],
        face_res: Dict[str, Any],
        consistency_res: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Evaluate weighted risk signals, enforce fail-closed document gates, 
        and construct an itemized explainable audit ledger.
        """
        score = 0.0
        contributors: List[Dict[str, Any]] = []
        checks_passed: List[str] = []
        checks_failed: List[str] = []

        is_fail_closed = False
        fail_closed_reason = ""

        # =========================================================================
        # 1. GATE 1: IMAGE QUALITY EVALUATION
        # =========================================================================
        q_status = quality_res.get("status", "PASS")
        q_score = quality_res.get("score", 1.0)
        
        if q_status == "UNACCEPTABLE":
            is_fail_closed = True
            fail_closed_reason = "Image quality is too low for reliable biometric and forensic screening."
            score += 45.0
            contributors.append({
                "title": "Severe Image Quality Defect",
                "points": +45.0,
                "severity": "high",
                "description": f"Image quality unacceptable (sharpness: {quality_res.get('sharpness_index', 0)}). {quality_res.get('recommendation', '')}"
            })
            checks_failed.append("Image Quality Gate")
        elif q_status == "LOW_QUALITY":
            score += self.weights["poor_quality"]
            contributors.append({
                "title": "Degraded Image Quality Warning",
                "points": +self.weights["poor_quality"],
                "severity": "medium",
                "description": "Image quality is suboptimal (blur or glare detected). Manual inspection recommended."
            })
            checks_failed.append("Image Quality Gate")
        else:
            checks_passed.append("Image Quality Gate")

        # =========================================================================
        # 2. GATE 2: DOCUMENT TYPE CLASSIFICATION & VALIDATION
        # =========================================================================
        c_status = classification_res.get("status", "PASS")
        c_detected = classification_res.get("detected_type", "unknown_document")
        c_conf = classification_res.get("confidence", 0.0)

        if c_status == "REJECT" or c_detected == "non_document_object":
            is_fail_closed = True
            fail_closed_reason = f"Uploaded image is a non-document object or random photo, not a {document_type.upper()}."
            score += 60.0
            contributors.append({
                "title": "Non-Document Object Detected",
                "points": +60.0,
                "severity": "high",
                "description": f"Classification rejected: Image does not contain recognized {document_type.upper()} security features or typography."
            })
            checks_failed.append("Document Type Gate")
        elif c_status == "MISMATCH":
            score += 40.0
            contributors.append({
                "title": "Document Type Mismatch",
                "points": +40.0,
                "severity": "high",
                "description": classification_res.get("message", f"Expected {document_type.upper()} but detected {c_detected.upper()}.")
            })
            checks_failed.append("Document Type Gate")
        elif c_status == "MANUAL_REVIEW":
            score += 20.0
            contributors.append({
                "title": "Inconclusive Document Classification",
                "points": +20.0,
                "severity": "medium",
                "description": "Document layout does not cleanly match expected credential template."
            })
            checks_failed.append("Document Type Gate")
        else:
            checks_passed.append("Document Type Gate")

        # =========================================================================
        # 3. GATE 3: OCR & PRIMARY CREDENTIAL EVIDENCE
        # =========================================================================
        ocr_text = ocr_res.get("raw_text", "")
        ocr_fields = ocr_res.get("structured_fields", {})
        ocr_conf = ocr_res.get("confidence", 0.0)

        if not ocr_text or len(ocr_text.strip()) < 5:
            if not is_fail_closed:
                is_fail_closed = True
                fail_closed_reason = "No readable text or identification data could be extracted by OCR."
            score += 35.0
            contributors.append({
                "title": "OCR Text Extraction Failure",
                "points": +35.0,
                "severity": "high",
                "description": "No machine-readable or visual characters could be resolved from document image."
            })
            checks_failed.append("Text & Field Extraction")
        else:
            checks_passed.append("Text & Field Extraction")

        # =========================================================================
        # 4. MRZ VALIDATION (Passport / Visa)
        # =========================================================================
        norm_type = document_type.lower()
        if norm_type in ["passport", "visa"]:
            if mrz_res.get("mrz_detected"):
                if not mrz_res.get("is_valid", False):
                    pts = self.weights["mrz_failure"]
                    score += pts
                    contributors.append({
                        "title": "MRZ ICAO 9303 Checksum Anomaly",
                        "points": +pts,
                        "severity": "high",
                        "description": "One or more mathematical checksums (Doc Number, DOB, Expiry, or Composite check digit) failed verification."
                    })
                    checks_failed.append("ICAO 9303 MRZ Checksums")
                else:
                    if not is_fail_closed:
                        score -= 10.0
                        contributors.append({
                            "title": "Valid ICAO 9303 MRZ Checksums",
                            "points": -10.0,
                            "severity": "positive",
                            "description": "Document number, date of birth, and expiration checksums mathematically validated."
                        })
                    checks_passed.append("ICAO 9303 MRZ Checksums")

                # Field cross-check between MRZ and Visual OCR
                field_matches = mrz_res.get("field_matches", {})
                if field_matches and not all(field_matches.values()):
                    pts = self.weights["field_mismatch"]
                    score += pts
                    contributors.append({
                        "title": "MRZ & Visual Text Discrepancy",
                        "points": +pts,
                        "severity": "medium",
                        "description": "Discrepancy detected between visual OCR document number/name and MRZ line characters."
                    })
                    checks_failed.append("Cross-Field Consistency")
                else:
                    checks_passed.append("Cross-Field Consistency")
            else:
                # If expected passport has no MRZ and was not fail-closed
                if norm_type == "passport" and not is_fail_closed:
                    score += 25.0
                    contributors.append({
                        "title": "Missing ICAO 9303 MRZ Zone",
                        "points": +25.0,
                        "severity": "medium",
                        "description": "Standard 2-line machine readable zone was not detected on passport spread."
                    })
                    checks_failed.append("ICAO 9303 MRZ Checksums")

        # =========================================================================
        # 5. DETERMINISTIC RULE VALIDATIONS (Dates, Expiry, Future DOB)
        # =========================================================================
        for v in validation_items:
            if v.get("status") == "FAIL":
                pts = self.weights["expired_doc"]
                score += pts
                contributors.append({
                    "title": f"Rule Failure: {v.get('check_name')}",
                    "points": +pts,
                    "severity": "high",
                    "description": v.get("message", "Document validation rule failed")
                })
                checks_failed.append(v.get("check_name"))
            elif v.get("status") == "WARNING":
                score += 10.0
                contributors.append({
                    "title": f"Warning: {v.get('check_name')}",
                    "points": +10.0,
                    "severity": "medium",
                    "description": v.get("message", "Potential anomaly noted")
                })
                checks_failed.append(v.get("check_name"))
            else:
                checks_passed.append(v.get("check_name"))

        # =========================================================================
        # 6. TAMPERING & FORENSIC IMAGE INTEGRITY
        # =========================================================================
        if tampering_res.get("tampering_detected"):
            pts = self.weights["tampering"]
            score += pts
            contributors.append({
                "title": "Potential Document Manipulation Detected",
                "points": +pts,
                "severity": "high",
                "description": f"Forensic analysis detected regional anomalies (score: {tampering_res.get('score', 0)}). Manual physical verification recommended."
            })
            checks_failed.append("Forensic Image Integrity")
        else:
            # Only award clean forensic bonus if document actually passed classification & quality gates!
            if not is_fail_closed and c_status == "PASS" and q_status == "PASS":
                score -= 5.0
                contributors.append({
                    "title": "Clean Forensic Image Integrity",
                    "points": -5.0,
                    "severity": "positive",
                    "description": "No significant compression, noise, or ELA anomalies detected across document regions."
                })
                checks_passed.append("Forensic Image Integrity")

        # =========================================================================
        # 7. BIOMETRIC FACE VERIFICATION
        # =========================================================================
        face_status = face_res.get("status", "")
        if face_status == "MISMATCH_SIGNAL":
            pts = self.weights["face_mismatch"]
            score += pts
            contributors.append({
                "title": "Biometric Face Mismatch Signal",
                "points": +pts,
                "severity": "high",
                "description": f"Facial feature similarity ({int(face_res.get('similarity', 0)*100)}%) is below acceptable security threshold."
            })
            checks_failed.append("Biometric Face Match")
        elif face_status == "MATCH_SIGNAL":
            if not is_fail_closed:
                score -= 10.0
                contributors.append({
                    "title": "Biometric Facial Verification Match",
                    "points": -10.0,
                    "severity": "positive",
                    "description": f"Live selfie facial geometry matches document portrait (similarity: {int(face_res.get('similarity', 0)*100)}%)."
                })
            checks_passed.append("Biometric Face Match")

        # =========================================================================
        # 8. CROSS-DOCUMENT CONSISTENCY (If multi-doc present)
        # =========================================================================
        if consistency_res and not consistency_res.get("is_consistent", True):
            score += self.weights["field_mismatch"]
            contributors.append({
                "title": "Cross-Document Discrepancy",
                "points": +self.weights["field_mismatch"],
                "severity": "high",
                "description": consistency_res.get("summary", "Cross-document field mismatch detected.")
            })
            checks_failed.append("Cross-Document Consistency")

        # Final Score Normalization (0 - 100)
        final_score = max(0.0, min(100.0, score))

        # Determine Risk Level & Explanations (Fail-Closed Hierarchy)
        if is_fail_closed:
            risk_level = "UNABLE_TO_DETERMINE"
            recommendation = f"MANUAL REVIEW REQUIRED: {fail_closed_reason}"
        elif final_score >= settings.RISK_THRESHOLD_REVIEW:
            risk_level = "HIGH_RISK"
            recommendation = "HIGH RISK DETECTED: Escalation to secondary security inspection recommended."
        elif final_score >= settings.RISK_THRESHOLD_LOW:
            risk_level = "REVIEW_RECOMMENDED"
            recommendation = "REVIEW RECOMMENDED: Document exhibits warning flags requiring manual officer verification."
        else:
            risk_level = "LOW_RISK"
            recommendation = "STANDARD PROCEDURE: All automated security and forensic checks passed."

        return {
            "risk_score": round(final_score, 1),
            "risk_level": risk_level,
            "is_fail_closed": is_fail_closed,
            "fail_closed_reason": fail_closed_reason,
            "contributors": contributors,
            "checks_passed": list(set(checks_passed)),
            "checks_failed": list(set(checks_failed)),
            "recommendation": recommendation,
            "category_scores": {
                "quality": round(q_score * 100, 1),
                "classification": round(c_conf * 100, 1),
                "ocr": round(ocr_conf * 100, 1),
                "tampering": round(float(tampering_res.get("score", 0)) * 100, 1),
                "face_similarity": round(float(face_res.get("similarity", 0)) * 100, 1)
            },
            "explanation": {
                "summary": recommendation,
                "passed_count": len(set(checks_passed)),
                "failed_count": len(set(checks_failed)),
                "flags": [c["title"] for c in contributors if c.get("severity") in ["high", "medium"]]
            }
        }

risk_engine = RiskEngine()
