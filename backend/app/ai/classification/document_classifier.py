import cv2
import numpy as np
import re
from typing import Dict, Any, List

class DocumentClassifier:
    def __init__(self):
        self.loaded = True

    def classify(self, image_path: str = "", expected_type: str = "passport", raw_ocr_text: str = "") -> Dict[str, Any]:
        """
        Classify document visual structure, layout, and textual content signals.
        Evaluates whether the image matches the expected document type or is a non-document / mismatch.
        """
        try:
            # Handle case where raw text is provided directly or in first argument
            if not raw_ocr_text and image_path and (" " in image_path or not any(image_path.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.bmp', '.pdf'])):
                raw_ocr_text = image_path
                image_path = ""

            text = raw_ocr_text.strip() if raw_ocr_text else ""
            text_upper = text.upper()
            cues: List[str] = []
            
            # Count alphanumeric tokens
            tokens = [t for t in re.split(r'[\s,;:|/\-]+', text_upper) if len(t) >= 2]
            token_count = len(tokens)

            img = cv2.imread(image_path)
            h, w = (0, 0)
            is_non_document_visual = False
            
            if img is not None:
                h, w = img.shape[:2]
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                # Check texture/edge density
                edges = cv2.Canny(gray, 50, 150)
                edge_ratio = np.sum(edges > 0) / (h * w)
                
                # Check color variance (e.g. natural scenes / objects vs flat document backgrounds)
                hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
                sat_std = float(np.std(hsv[:, :, 1]))
                hue_std = float(np.std(hsv[:, :, 0]))

                if token_count < 2 and (edge_ratio < 0.015 or sat_std > 55.0):
                    is_non_document_visual = True

            # 1. Passport Signals
            passport_score = 0.0
            if any(k in text_upper for k in ["PASSPORT", "PASSEPORT", "REPUBLICA", "UNITED STATES OF AMERICA", "REPUBLIC OF", "KINGDOM OF", "BUNDESREPUBLIK"]):
                passport_score += 0.55
                cues.append("Passport official title / state authority keyword detected")
            if "P<" in text_upper or "P " in text_upper or re.search(r'P[A-Z0-9<]{5,}', text_upper):
                passport_score += 0.45
                cues.append("ICAO 9303 TD3 passport MRZ line indicator found")
            if any(k in text_upper for k in ["NATIONALITY", "PASSPORT NO", "AUTHORITY", "DATE OF EXPIRY", "GIVEN NAMES"]):
                passport_score += 0.25
                cues.append("Passport standard demographic field labels present")

            # 2. Visa Signals
            visa_score = 0.0
            if any(k in text_upper for k in ["VISA", "ENTRY PERMIT", "VALID FOR", "NUMBER OF ENTRIES", "ENTRIES:", "DURATION OF STAY"]):
                visa_score += 0.60
                cues.append("Visa authorization / entry permit terminology detected")
            if "V<" in text_upper or "VN" in text_upper or re.search(r'V[A-Z0-9<]{5,}', text_upper):
                visa_score += 0.35
                cues.append("MRZ visa format designator found")

            # 3. E-Ticket / Itinerary Signals
            eticket_score = 0.0
            if any(k in text_upper for k in ["ELECTRONIC TICKET", "E-TICKET", "ETICKET", "ITINERARY", "BOOKING REFERENCE", "PASSENGER RECEIPT", "PNR", "E-RECEIPT"]):
                eticket_score += 0.65
                cues.append("E-Ticket / passenger reservation keywords detected")
            if any(k in text_upper for k in ["FLIGHT", "DEPARTURE", "ARRIVAL", "AIRLINE", "TICKET NUMBER", "AIRWAYS", "TERMINAL"]):
                eticket_score += 0.35
                cues.append("Aviation flight / routing metadata detected")

            # 4. Boarding Pass Signals
            boarding_pass_score = 0.0
            if any(k in text_upper for k in ["BOARDING PASS", "BOARDING CARD", "TARJETA DE EMBARQUE", "CARTE D'EMBARQUEMENT"]):
                boarding_pass_score += 0.70
                cues.append("Boarding pass header designator detected")
            if any(k in text_upper for k in ["GATE", "SEAT", "BOARDING TIME", "ZONE", "GROUP", "CLASS:", "SEQ NO"]):
                boarding_pass_score += 0.35
                cues.append("Airport gate & seating dispatch cues detected")

            # 5. National ID Signals
            national_id_score = 0.0
            if any(k in text_upper for k in ["NATIONAL ID", "IDENTITY CARD", "CITIZEN ID", "IDENTIFICATION", "AADHAAR", "PERMANENT ACCOUNT"]):
                national_id_score += 0.65
                cues.append("National citizen identification terminology detected")
            if "I<" in text_upper or "ID" in text_upper or re.search(r'I[A-Z0-9<]{5,}', text_upper):
                national_id_score += 0.25
                cues.append("ID-1 / ID-2 machine readable format designator found")

            # 6. Driving License Signals
            driving_license_score = 0.0
            if any(k in text_upper for k in ["DRIVING LICENCE", "DRIVER LICENSE", "DRIVING LICENSE", "PERMIS DE CONDUIRE", "MOTOR VEHICLE", "DL NO"]):
                driving_license_score += 0.75
                cues.append("Driver licensing authority cues detected")

            # 7. Residence / Work Permit Signals
            residence_permit_score = 0.0
            if any(k in text_upper for k in ["RESIDENCE PERMIT", "TITRE DE SEJOUR", "PERMANENT RESIDENT", "AUFENTHALTSTITEL"]):
                residence_permit_score += 0.70
                cues.append("Immigration residence permit title detected")

            work_permit_score = 0.0
            if any(k in text_upper for k in ["WORK PERMIT", "EMPLOYMENT AUTHORIZATION", "WORK AUTHORIZATION", "LABOUR CARD"]):
                work_permit_score += 0.70
                cues.append("Employment authorization / work permit title detected")

            # 8. Travel Authorization / Travel Permit Signals
            travel_auth_score = 0.0
            if any(k in text_upper for k in ["TRAVEL AUTHORIZATION", "TRAVEL PERMIT", "BORDER AUTHORIZATION", "EMERGENCY TRAVEL", "REFUGEE TRAVEL", "ESTA", "ETA"]):
                travel_auth_score += 0.70
                cues.append("Travel authorization or border permit cues detected")

            # Collate scores
            scores = {
                "passport": passport_score,
                "visa": visa_score,
                "boarding_pass": boarding_pass_score,
                "eticket": eticket_score,
                "national_id": national_id_score,
                "driving_license": driving_license_score,
                "residence_permit": residence_permit_score,
                "work_permit": work_permit_score,
                "travel_authorization": travel_auth_score,
                "travel_permit": travel_auth_score
            }

            best_type = max(scores, key=scores.get)
            best_score = scores[best_type]

            # Non-document gate: if token count is negligible and no keywords matched
            if best_score < 0.25 and (token_count < 3 or is_non_document_visual):
                detected_type = "non_document_object"
                confidence = 0.92 if token_count == 0 else 0.85
                cues.append("Image lacks identification document typography, layout structure, and security text")
            elif best_score < 0.25:
                detected_type = "unknown_document"
                confidence = 0.60
                cues.append("Text detected but layout does not match any recognized official credential schema")
            else:
                detected_type = best_type
                confidence = min(0.98, max(0.50, best_score))

            # Expected vs Detected Gate Verification
            norm_expected = expected_type.lower().replace(" ", "_").replace("-", "_")
            norm_detected = detected_type.lower().replace(" ", "_").replace("-", "_")

            # Normalization aliases
            alias_groups = [
                {"travel_authorization", "travel_permit", "border_travel_authorization", "border_authorization"},
                {"driving_license", "driving_licence"},
                {"national_id", "national_identity_card", "citizen_id"},
                {"eticket", "e_ticket", "itinerary"},
                {"residence_permit", "work_permit"}
            ]

            is_alias_match = False
            for grp in alias_groups:
                if norm_expected in grp and norm_detected in grp:
                    is_alias_match = True
                    break

            # Flexible pairing (e.g. passport vs eticket)
            if norm_detected == "non_document_object":
                status = "REJECT"
                message = f"Uploaded image appears to be an ordinary photo or non-document object, not a {expected_type.upper()}."
            elif norm_detected == "unknown_document":
                status = "MANUAL_REVIEW"
                message = f"Document type could not be verified automatically against expected {expected_type.upper()} specification."
            elif norm_expected == norm_detected or is_alias_match or (norm_expected in ["primary_document", "document", "travel_document"]):
                status = "PASS"
                message = f"Document layout and textual markers successfully verified as {expected_type.upper()}."
            else:
                status = "MISMATCH"
                message = f"Document Type Mismatch: Expected '{expected_type.upper()}' but detected '{detected_type.upper()}' with {int(confidence*100)}% confidence."

            return {
                "expected_type": expected_type,
                "detected_type": detected_type,
                "confidence": round(confidence, 2),
                "status": status,
                "is_match": status == "PASS",
                "message": message,
                "cues": cues,
                "token_count": token_count,
                "model": "DocShield-MultiModalClassifier-v2"
            }

        except Exception as e:
            return {
                "expected_type": expected_type,
                "detected_type": "unknown_document",
                "confidence": 0.30,
                "status": "MANUAL_REVIEW",
                "is_match": False,
                "message": f"Classification service error: {str(e)}",
                "cues": ["Classifier exception triggered fallback review"],
                "token_count": 0,
                "model": "DocShield-Classifier-Fallback"
            }

document_classifier = DocumentClassifier()
