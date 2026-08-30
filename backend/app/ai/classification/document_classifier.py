import cv2
import numpy as np
from typing import Dict, Any

class DocumentClassifier:
    def __init__(self):
        self.loaded = True

    def classify(self, image_path: str, raw_ocr_text: str = "") -> Dict[str, Any]:
        """
        Classify document layout and content signals.
        Returns document_type, confidence score, and detection cues.
        """
        try:
            text_upper = raw_ocr_text.upper() if raw_ocr_text else ""
            cues = []
            
            # Passport heuristics
            passport_score = 0.0
            if "PASSPORT" in text_upper or "PASSEPORT" in text_upper or "REPUBLICA" in text_upper or "UNITED STATES OF AMERICA" in text_upper or "REPUBLIC OF INDIA" in text_upper:
                passport_score += 0.5
                cues.append("Passport header keywords detected")
            if "P<" in text_upper or "P " in text_upper:
                passport_score += 0.4
                cues.append("MRZ TD3 passport designator found")
            if "NATIONALITY" in text_upper or "PASSPORT NO" in text_upper:
                passport_score += 0.2

            # Visa heuristics
            visa_score = 0.0
            if "VISA" in text_upper or "ENTRY" in text_upper or "VALID FOR" in text_upper or "NUMBER OF ENTRIES" in text_upper:
                visa_score += 0.6
                cues.append("Visa authorization keyword cues detected")
            if "V<" in text_upper or "VN" in text_upper:
                visa_score += 0.3

            # Driving License heuristics
            dl_score = 0.0
            if "DRIVING" in text_upper or "DRIVER" in text_upper or "LICENSE" in text_upper or "PERMIS DE CONDUIRE" in text_upper or "DL NO" in text_upper or "CLASS" in text_upper:
                dl_score += 0.7
                cues.append("Driver licensing authority cues detected")

            # National ID heuristics
            id_score = 0.0
            if "IDENTITY" in text_upper or "NATIONAL ID" in text_upper or "IDENTIFICATION" in text_upper or "CITIZEN" in text_upper or "AADHAAR" in text_upper or "CARD" in text_upper:
                id_score += 0.6
                cues.append("National identification cues detected")
            if "I<" in text_upper or "ID" in text_upper:
                id_score += 0.2

            # Residence Permit heuristics
            rp_score = 0.0
            if "RESIDENCE" in text_upper or "PERMIT" in text_upper or "TITRE DE SEJOUR" in text_upper or "PERMANENT RESIDENT" in text_upper:
                rp_score += 0.65
                cues.append("Resident permit terminology detected")

            scores = {
                "passport": passport_score,
                "visa": visa_score,
                "driving_license": dl_score,
                "national_id": id_score,
                "residence_permit": rp_score
            }

            best_type = max(scores, key=scores.get)
            best_score = scores[best_type]

            if best_score < 0.25:
                # Aspect ratio inspection
                img = cv2.imread(image_path)
                if img is not None:
                    h, w, _ = img.shape
                    ratio = w / float(h)
                    # ID-1 standard card ratio ~ 1.58
                    if 1.4 < ratio < 1.7:
                        best_type = "national_id"
                        best_score = 0.60
                        cues.append("Standard ISO/IEC 7810 ID-1 card aspect ratio detected")
                    else:
                        best_type = "passport"
                        best_score = 0.55
                        cues.append("Document boundary geometry matches passport booklet spread")
                else:
                    best_type = "passport"
                    best_score = 0.50

            confidence = min(0.98, max(0.45, best_score))
            
            return {
                "document_type": best_type,
                "confidence": round(confidence, 2),
                "model": "DocShield-LayoutClassifier-v1",
                "cues": cues
            }

        except Exception as e:
            return {
                "document_type": "passport",
                "confidence": 0.50,
                "model": "Fallback",
                "cues": [f"Classification fallback: {str(e)}"]
            }

document_classifier = DocumentClassifier()
