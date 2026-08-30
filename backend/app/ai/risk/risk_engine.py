from datetime import datetime
from typing import Dict, Any, List, Tuple
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
        face_res: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Evaluate weighted risk signals and construct explainable audit breakdown.
        """
        score = 0.0
        contributors = []
        checks_passed = []
        checks_failed = []

        # 1. Tampering Assessment
        if tampering_res.get("tampering_detected"):
            pts = self.weights["tampering"]
            score += pts
            contributors.append({
                "title": "Potential Document Manipulation Detected",
                "points": +pts,
                "severity": "high",
                "description": f"Forensic analysis detected regional anomalies (score: {tampering_res.get('score')}). Manual physical verification recommended."
            })
            checks_failed.append("Forensic Image Integrity")
        else:
            score -= 5.0
            contributors.append({
                "title": "Clean Forensic Image Integrity",
                "points": -5.0,
                "severity": "positive",
                "description": "No significant compression, noise, or ELA anomalies detected across document regions."
            })
            checks_passed.append("Forensic Image Integrity")

        # 2. MRZ Validation (if applicable)
        if mrz_res.get("mrz_detected"):
            if not mrz_res.get("is_valid", False):
                pts = self.weights["mrz_failure"]
                score += pts
                contributors.append({
                    "title": "MRZ ICAO 9303 Checksum Anomaly",
                    "points": +pts,
                    "severity": "high",
                    "description": "One or more mathematical checksums (Doc Number, DOB, Expiry, or Composite) failed verification."
                })
                checks_failed.append("ICAO 9303 MRZ Checksums")
            else:
                score -= 8.0
                contributors.append({
                    "title": "Valid ICAO 9303 MRZ Checksums",
                    "points": -8.0,
                    "severity": "positive",
                    "description": "Document number, date of birth, and expiration checksums mathematically validated."
                })
                checks_passed.append("ICAO 9303 MRZ Checksums")

            # MRZ vs Visible OCR field cross-check
            field_matches = mrz_res.get("field_matches", {})
            if field_matches and not all(field_matches.values()):
                pts = self.weights["field_mismatch"]
                score += pts
                contributors.append({
                    "title": "MRZ & Visual Text Mismatch",
                    "points": +pts,
                    "severity": "medium",
                    "description": "Discrepancy detected between visual OCR document number / nationality and MRZ line characters."
                })
                checks_failed.append("Cross-Field Consistency")
            else:
                checks_passed.append("Cross-Field Consistency")

        # 3. Document Validation Rules (Expiration, Dates)
        has_expired = False
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
                pts = 10.0
                score += pts
                contributors.append({
                    "title": f"Warning: {v.get('check_name')}",
                    "points": +pts,
                    "severity": "medium",
                    "description": v.get("message", "Potential inconsistency noted")
                })
                checks_failed.append(v.get("check_name"))
            else:
                checks_passed.append(v.get("check_name"))

        # 4. Face Verification Signals
        face_status = face_res.get("status", "")
        if face_status == "MISMATCH_SIGNAL":
            pts = self.weights["face_mismatch"]
            score += pts
            contributors.append({
                "title": "Face Comparison Low Match Signal",
                "points": +pts,
                "severity": "high",
                "description": f"Facial feature similarity ({int(face_res.get('similarity', 0)*100)}%) is below acceptable threshold."
            })
            checks_failed.append("Biometric Face Comparison")
        elif face_status == "MATCH_SIGNAL":
            score -= 10.0
            contributors.append({
                "title": "Strong Face Match Signal",
                "points": -10.0,
                "severity": "positive",
                "description": f"Live face presentation strongly correlates with document portrait ({int(face_res.get('similarity', 0)*100)}% match)."
            })
            checks_passed.append("Biometric Face Comparison")
        elif face_status == "UNABLE_TO_VERIFY":
            score += 10.0
            contributors.append({
                "title": "Face Verification Inconclusive",
                "points": +10.0,
                "severity": "medium",
                "description": "Document portrait was unresolvable or obscured."
            })
            checks_failed.append("Biometric Face Detection")

        # 5. Image Quality Assessment
        if quality_res.get("status") == "POOR":
            pts = self.weights["poor_quality"]
            score += pts
            contributors.append({
                "title": "Sub-optimal Image Quality",
                "points": +pts,
                "severity": "low",
                "description": "Blur, low contrast, or glare reduced optical feature confidence."
            })
            checks_failed.append("Image Optical Quality")
        elif quality_res.get("status") == "EXCELLENT":
            score -= 5.0
            contributors.append({
                "title": "High Resolution & Contrast",
                "points": -5.0,
                "severity": "positive",
                "description": "Sharp edge variance and optimal exposure for AI inference."
            })
            checks_passed.append("Image Optical Quality")

        # Normalize score into [0, 100]
        final_score = max(5.0, min(95.0, score))
        final_score = round(final_score, 1)

        # Determine Risk Level
        if not quality_res.get("is_usable", True):
            risk_level = "UNABLE_TO_DETERMINE"
            recommendation = "Reject image & request higher quality document capture."
        elif final_score <= settings.RISK_THRESHOLD_LOW:
            risk_level = "LOW_RISK"
            recommendation = "AI signals indicate low risk. Standard operational procedures apply."
        elif final_score <= settings.RISK_THRESHOLD_REVIEW:
            risk_level = "REVIEW_RECOMMENDED"
            recommendation = "Secondary physical inspection & field validation recommended by authorized officer."
        else:
            risk_level = "HIGH_RISK"
            recommendation = "High risk anomaly signals detected. Mandatory manual forensic verification required."

        explanation = {
            "summary": f"Overall AI Risk Assessment generated {final_score}/100. Evaluated {len(checks_passed) + len(checks_failed)} multi-modal signals.",
            "checks_passed": checks_passed,
            "checks_failed": checks_failed,
            "legal_disclaimer": "AI outputs are probabilistic decision-support signals, not definitive legal or authenticity determinations."
        }

        return {
            "risk_score": final_score,
            "risk_level": risk_level,
            "contributors": contributors,
            "explanation": explanation,
            "recommendation": recommendation
        }

risk_engine = RiskEngine()
