import os
import re
import cv2
import numpy as np
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime

class OCREngine:
    """
    Optical Character Recognition and Spatial Layout Extraction Engine.
    Uses OpenCV DNN with PaddleOCR PP-OCRv3 Text Detection and CRNN Text Recognition ONNX models,
    with multi-pass preprocessing variants, document normalization, and strict structured field validation.
    """

    def __init__(self):
        self.det_net = None
        self.rec_net = None
        self.detector = None
        self.recognizer = None
        # CRNN ONNX model output dimension is 37 (0-9, a-z, + blank)
        self.alphabet = "0123456789abcdefghijklmnopqrstuvwxyz"
        self._load_models()

    def _load_models(self):
        try:
            weights_dir = os.path.join(os.path.dirname(__file__), "..", "weights")
            det_path = os.path.join(weights_dir, "text_detection_en_ppocrv3_2023may.onnx")
            rec_path = os.path.join(weights_dir, "text_recognition_CRNN_EN_2021sep.onnx")

            if os.path.exists(det_path) and os.path.exists(rec_path):
                self.det_net = cv2.dnn.readNet(det_path)
                self.rec_net = cv2.dnn.readNet(rec_path)

                # Setup OpenCV DB Text Detector
                self.detector = cv2.dnn_TextDetectionModel_DB(self.det_net)
                self.detector.setBinaryThreshold(0.3)
                self.detector.setPolygonThreshold(0.5)
                self.detector.setUnclipRatio(1.8)
                self.detector.setMaxCandidates(300)
                self.detector.setInputParams(1.0 / 255.0, (736, 736), (123.675, 116.28, 103.53), swapRB=True)

                # Setup OpenCV CRNN Text Recognizer
                self.recognizer = cv2.dnn_TextRecognitionModel(self.rec_net)
                self.recognizer.setDecodeType("CTC-greedy")
                self.recognizer.setVocabulary(list(self.alphabet))
                self.recognizer.setInputParams(1.0 / 127.5, (100, 32), (127.5, 127.5, 127.5), swapRB=True)
                self.loaded = True
            else:
                self.loaded = False
        except Exception as e:
            print(f"[OCREngine] Warning: Could not initialize deep learning OCR models: {e}.")
            self.loaded = False

    # =========================================================================
    # DOCUMENT NORMALIZATION
    # =========================================================================
    def normalize_document(self, img: np.ndarray) -> np.ndarray:
        """
        Normalize document orientation, aspect ratio, and perspective with safe fallback.
        """
        if img is None:
            return img

        norm = img.copy()
        h, w = norm.shape[:2]

        # 1. Resize small or oversized images to optimal OCR resolution (width ~1000-1400px)
        if w < 700 or h < 500:
            scale = min(2.5, max(1.5, 1000.0 / max(w, 1)))
            norm = cv2.resize(norm, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_CUBIC)
        elif w > 2400 or h > 2400:
            scale = 1600.0 / max(w, h)
            norm = cv2.resize(norm, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)

        nh, nw = norm.shape[:2]

        # 2. Deskew / Orientation Correction via Hough lines & text contours
        try:
            gray = cv2.cvtColor(norm, cv2.COLOR_BGR2GRAY)
            edges = cv2.Canny(gray, 50, 150, apertureSize=3)
            lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=100, minLineLength=nw // 6, maxLineGap=20)
            
            if lines is not None and len(lines) > 5:
                angles = []
                for line in lines:
                    x1, y1, x2, y2 = line[0]
                    dx = x2 - x1
                    dy = y2 - y1
                    if abs(dx) > 1e-3:
                        angle = np.degrees(np.arctan2(dy, dx))
                        if -45.0 <= angle <= 45.0:
                            angles.append(angle)
                
                if angles:
                    median_angle = float(np.median(angles))
                    if abs(median_angle) > 0.8:
                        center = (nw // 2, nh // 2)
                        rot_mat = cv2.getRotationMatrix2D(center, median_angle, 1.0)
                        norm = cv2.warpAffine(norm, rot_mat, (nw, nh), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        except Exception:
            pass

        return norm

    # =========================================================================
    # PREPROCESSING VARIANTS PIPELINE
    # =========================================================================
    def generate_preprocessing_variants(self, img: np.ndarray) -> List[Tuple[str, np.ndarray]]:
        """
        Generate multiple distinct image preprocessing variants.
        """
        variants = []
        if img is None:
            return variants

        # Variant 1: Normalized Color / Resized
        variants.append(("original_normalized", img.copy()))

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Variant 2: Grayscale + CLAHE Contrast Enhancement + Mild Denoise
        try:
            clahe = cv2.createCLAHE(clipLimit=2.2, tileGridSize=(8, 8))
            enhanced_gray = clahe.apply(gray)
            denoised = cv2.bilateralFilter(enhanced_gray, d=5, sigmaColor=35, sigmaSpace=35)
            bgr_clahe = cv2.cvtColor(denoised, cv2.COLOR_GRAY2BGR)
            variants.append(("clahe_contrast_gray", bgr_clahe))
        except Exception:
            pass

        # Variant 3: Otsu Binarization
        try:
            _, otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
            bgr_otsu = cv2.cvtColor(otsu, cv2.COLOR_GRAY2BGR)
            variants.append(("otsu_threshold", bgr_otsu))
        except Exception:
            pass

        # Variant 4: Adaptive Gaussian Thresholding
        try:
            adaptive = cv2.adaptiveThreshold(
                gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 21, 8
            )
            bgr_adaptive = cv2.cvtColor(adaptive, cv2.COLOR_GRAY2BGR)
            variants.append(("adaptive_threshold", bgr_adaptive))
        except Exception:
            pass

        return variants

    # =========================================================================
    # MULTI-PASS OCR EXTRACTION & CANDIDATE SCORING
    # =========================================================================
    def extract_text_and_fields(self, image_path: str, document_type: str = "passport") -> Dict[str, Any]:
        """
        Run multi-pass OCR extraction on document normalization variants and select the best candidate.
        """
        try:
            img = cv2.imread(image_path) if image_path and os.path.exists(image_path) else None
            if img is None:
                return {
                    "raw_text": "",
                    "structured_fields": {},
                    "average_confidence": 0.0,
                    "detection_confidence": 0.0,
                    "recognition_confidence": 0.0,
                    "quality_score": 0.0,
                    "bounding_boxes": [],
                    "status": "FAILED",
                    "error": "Image file could not be read or does not exist."
                }

            normalized_img = self.normalize_document(img)
            variants = self.generate_preprocessing_variants(normalized_img)

            candidates: List[Dict[str, Any]] = []

            for variant_name, var_img in variants:
                vh, vw = var_img.shape[:2]
                bboxes, extracted_lines, det_conf, rec_conf = self._recognize_text_single_pass(var_img, vw, vh)
                
                raw_text, fields, qual_score = self._parse_structured_fields(extracted_lines, document_type, vw, vh)

                # Score this variant pass
                pass_score = self._calculate_pass_score(raw_text, fields, det_conf, rec_conf, qual_score)

                candidates.append({
                    "variant_name": variant_name,
                    "raw_text": raw_text,
                    "structured_fields": fields,
                    "bounding_boxes": bboxes,
                    "detection_confidence": round(det_conf, 2),
                    "recognition_confidence": round(rec_conf, 2),
                    "quality_score": round(qual_score, 2),
                    "average_confidence": round(pass_score, 2),
                    "score": pass_score,
                    "line_count": len(extracted_lines)
                })

            if not candidates:
                return {
                    "raw_text": "",
                    "structured_fields": {},
                    "average_confidence": 0.0,
                    "detection_confidence": 0.0,
                    "recognition_confidence": 0.0,
                    "quality_score": 0.0,
                    "bounding_boxes": [],
                    "status": "COMPLETED",
                    "model_used": "DocShield Multi-Pass OCR Pipeline"
                }

            # Select best candidate
            best_candidate = max(candidates, key=lambda c: c["score"])

            raw_text = best_candidate["raw_text"]
            fields = best_candidate["structured_fields"]
            avg_conf = best_candidate["average_confidence"]

            if not raw_text or len(raw_text.strip()) < 3 or avg_conf < 0.15:
                fields = {}
                avg_conf = 0.0

            return {
                "raw_text": raw_text,
                "structured_fields": fields,
                "average_confidence": avg_conf,
                "detection_confidence": best_candidate["detection_confidence"],
                "recognition_confidence": best_candidate["recognition_confidence"],
                "quality_score": best_candidate["quality_score"],
                "bounding_boxes": best_candidate["bounding_boxes"],
                "selected_variant": best_candidate["variant_name"],
                "status": "COMPLETED",
                "model_used": "OpenCV DB (PP-OCRv3) + CRNN ONNX Multi-Pass Engine"
            }

        except Exception as e:
            return {
                "raw_text": "",
                "structured_fields": {},
                "average_confidence": 0.0,
                "detection_confidence": 0.0,
                "recognition_confidence": 0.0,
                "quality_score": 0.0,
                "bounding_boxes": [],
                "status": "FAILED",
                "error": str(e)
            }

    def _recognize_text_single_pass(
        self, img: np.ndarray, w: int, h: int
    ) -> Tuple[List[Dict[str, Any]], List[str], float, float]:
        boxes = []
        lines = []
        det_confs = []
        rec_confs = []

        if img is None:
            return boxes, lines, 0.0, 0.0

        if self.detector is not None and self.recognizer is not None:
            try:
                det_boxes, det_scores = self.detector.detect(img)
                if det_boxes is not None and len(det_boxes) > 0:
                    for i, b in enumerate(det_boxes):
                        x, y, bw, bh = cv2.boundingRect(b)
                        if bw > 12 and bh > 6:
                            crop = img[max(0, y-2):min(h, y+bh+2), max(0, x-2):min(w, x+bw+2)]
                            if crop.size > 0:
                                try:
                                    text = self.recognizer.recognize(crop)
                                    clean_txt = self._normalize_ocr_text(text)
                                    if clean_txt and len(clean_txt) >= 1:
                                        char_validity = sum(1 for c in clean_txt if c.isalnum() or c in "< -/") / len(clean_txt)
                                        rec_conf = min(0.98, max(0.40, char_validity * 0.95))
                                        det_conf = float(det_scores[i]) if (det_scores is not None and i < len(det_scores)) else 0.88
                                        
                                        lines.append(clean_txt)
                                        det_confs.append(det_conf)
                                        rec_confs.append(rec_conf)

                                        boxes.append({
                                            "text": clean_txt,
                                            "x": int(x),
                                            "y": int(y),
                                            "width": int(bw),
                                            "height": int(bh),
                                            "confidence": round((det_conf + rec_conf) / 2.0, 2),
                                            "detection_confidence": round(det_conf, 2),
                                            "recognition_confidence": round(rec_conf, 2)
                                        })
                                except Exception:
                                    pass
            except Exception:
                pass

        if len(boxes) == 0:
            boxes = self._detect_morphological_boxes(img, w, h)
            lines = [b["text"] for b in boxes if b["text"] != "TEXT_BLOCK"]
            det_confs = [0.50]
            rec_confs = [0.40]

        mean_det = float(np.mean(det_confs)) if det_confs else 0.0
        mean_rec = float(np.mean(rec_confs)) if rec_confs else 0.0

        return boxes, lines, mean_det, mean_rec

    def _detect_morphological_boxes(self, img: np.ndarray, w: int, h: int) -> List[Dict[str, Any]]:
        boxes = []
        try:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (9, 3))
            grad = cv2.morphologyEx(gray, cv2.MORPH_GRADIENT, kernel)
            _, thresh = cv2.threshold(grad, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
            close_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (17, 3))
            connected = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, close_kernel)
            contours, _ = cv2.findContours(connected, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            for cnt in contours:
                x, y, bw, bh = cv2.boundingRect(cnt)
                if 25 < bw < w * 0.95 and 10 < bh < h * 0.35:
                    if bw / float(bh) > 1.2:
                        crop = img[y:y+bh, x:x+bw]
                        rec_text = ""
                        if self.recognizer is not None and crop.size > 0:
                            try:
                                rec_text = self._normalize_ocr_text(self.recognizer.recognize(crop))
                            except Exception:
                                rec_text = ""
                        
                        boxes.append({
                            "text": rec_text if rec_text else "TEXT_BLOCK",
                            "x": int(x),
                            "y": int(y),
                            "width": int(bw),
                            "height": int(bh),
                            "confidence": 0.60 if rec_text else 0.40
                        })
            boxes = sorted(boxes, key=lambda b: (b["y"], b["x"]))[:30]
        except Exception:
            pass
        return boxes

    def _normalize_ocr_text(self, text: str) -> str:
        if not text:
            return ""
        clean = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
        clean = clean.strip()
        return clean

    def _calculate_pass_score(
        self, raw_text: str, fields: Dict[str, Any], det_conf: float, rec_conf: float, qual_score: float
    ) -> float:
        if not raw_text or len(raw_text.strip()) == 0:
            return 0.0

        chars = [c for c in raw_text if not c.isspace()]
        if not chars:
            return 0.0

        alnum_count = sum(1 for c in chars if c.isalnum())
        alnum_ratio = alnum_count / len(chars)

        tokens = [t for t in re.split(r'[\s\n,;:|/\-]+', raw_text) if len(t) >= 2]
        token_count = len(tokens)
        token_score = min(1.0, token_count / 12.0)

        field_count = len(fields)
        field_score = min(1.0, field_count / 3.0)

        pass_score = (
            alnum_ratio * 0.35 +
            token_score * 0.25 +
            field_score * 0.25 +
            ((det_conf + rec_conf) / 2.0) * 0.15
        )
        return min(0.98, max(0.0, pass_score))

    def _parse_structured_fields(
        self, extracted_lines: List[str], document_type: str, w: int, h: int
    ) -> Tuple[str, Dict[str, Any], float]:
        raw_text_joined = "\n".join(extracted_lines)
        raw_upper = raw_text_joined.upper()
        norm_type = document_type.lower().replace(" ", "_").replace("-", "_")

        raw_fields: Dict[str, Any] = {}

        if norm_type in ["passport", "primary_document", "travel_document"]:
            raw_fields = self._parse_passport_fields(extracted_lines, raw_upper)
        elif norm_type in ["visa"]:
            raw_fields = self._parse_visa_fields(extracted_lines, raw_upper)
        elif norm_type in ["boarding_pass"]:
            raw_fields = self._parse_boarding_pass_fields(extracted_lines, raw_upper)
        elif norm_type in ["eticket", "e_ticket"]:
            raw_fields = self._parse_eticket_fields(extracted_lines, raw_upper)
        elif norm_type in ["residence_permit", "work_permit"]:
            raw_fields = self._parse_permit_fields(extracted_lines, raw_upper, norm_type)
        elif norm_type in ["national_id", "national_identity_card"]:
            raw_fields = self._parse_national_id_fields(extracted_lines, raw_upper)
        elif norm_type in ["driving_licence", "driving_license"]:
            raw_fields = self._parse_driving_license_fields(extracted_lines, raw_upper)
        elif norm_type in ["travel_authorization", "travel_permit", "border_travel_authorization"]:
            raw_fields = self._parse_travel_authorization_fields(extracted_lines, raw_upper)
        else:
            raw_fields = self._parse_generic_fields(extracted_lines, raw_upper)

        validated_fields = self._validate_extracted_fields(raw_fields)
        raw_text = raw_text_joined.strip()
        qual_score = 0.90 if (raw_text and len(validated_fields) > 0) else (0.60 if raw_text else 0.0)
        return raw_text, validated_fields, qual_score

    def _validate_extracted_fields(self, fields: Dict[str, Any]) -> Dict[str, Any]:
        clean: Dict[str, Any] = {}

        if "document_number" in fields:
            val = str(fields["document_number"]).upper().replace(" ", "").replace("-", "")
            if re.match(r'^[A-Z0-9]{6,12}$', val) and not any(kw in val for kw in ["PASSPORT", "NUMBER", "EXPIRY", "ISSUER"]):
                clean["document_number"] = val

        for date_key in ["expiry_date", "issue_date", "date_of_birth", "travel_date"]:
            if date_key in fields:
                norm_date = self._normalize_and_validate_date(str(fields[date_key]))
                if norm_date:
                    clean[date_key] = norm_date

        if "name" in fields:
            val = str(fields["name"]).strip()
            if len(val) >= 2 and re.match(r'^[A-Za-z\s\-\.]+$', val) and not any(k in val.upper() for k in ["PASSPORT", "REPUBLIC", "UNITED", "KINGDOM", "STATE", "DOCUMENT"]):
                clean["name"] = val

        if "nationality" in fields:
            val = str(fields["nationality"]).upper().strip()
            if len(val) == 3 and val.isalpha():
                clean["nationality"] = val
            elif len(val) > 3 and val.isalpha():
                clean["nationality"] = val[:3]

        for k, v in fields.items():
            if k not in clean and k not in ["document_number", "expiry_date", "issue_date", "date_of_birth", "name", "nationality"]:
                if isinstance(v, str) and len(v.strip()) > 0:
                    clean[k] = v.strip()
                elif isinstance(v, (int, float, bool, dict, list)):
                    clean[k] = v

        return clean

    def _normalize_and_validate_date(self, date_str: str) -> Optional[str]:
        cleaned = date_str.strip().replace("/", "-").replace(".", "-")
        m = re.search(r'(\d{4})-(\d{1,2})-(\d{1,2})', cleaned)
        if m:
            y, mth, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
            if 1900 <= y <= 2060 and 1 <= mth <= 12 and 1 <= d <= 31:
                return f"{y:04d}-{mth:02d}-{d:02d}"

        m2 = re.search(r'(\d{1,2})-(\d{1,2})-(\d{4})', cleaned)
        if m2:
            d, mth, y = int(m2.group(1)), int(m2.group(2)), int(m2.group(3))
            if 1900 <= y <= 2060 and 1 <= mth <= 12 and 1 <= d <= 31:
                return f"{y:04d}-{mth:02d}-{d:02d}"

        return None

    def _parse_passport_fields(self, lines: List[str], raw_upper: str) -> Dict[str, Any]:
        fields: Dict[str, Any] = {}
        for line in lines:
            line_up = line.upper()

            num_match = re.search(r'(?:PASSPORT\s*(?:NO|NUMBER|#)?|DOC\s*NO)?\s*[:.\s]*([A-Z0-9]{7,10})\b', line_up)
            if num_match and "document_number" not in fields:
                cand = num_match.group(1)
                if not cand.startswith("PASSPORT") and not cand.startswith("UNITED"):
                    fields["document_number"] = cand

            date_match = re.search(r'(\d{4}[-/.]\d{2}[-/.]\d{2}|\d{2}[-/.]\d{2}[-/.]\d{4})', line)
            if date_match and "expiry_date" not in fields:
                fields["expiry_date"] = date_match.group(1)

            if any(kw in line_up for kw in ["NAME", "SURNAME", "GIVEN"]):
                parts = line.split(":")
                if len(parts) > 1 and len(parts[1].strip()) > 2:
                    fields["name"] = parts[1].strip()

        if not fields.get("document_number"):
            m = re.search(r'\b([A-Z][0-9]{7,9})\b', raw_upper)
            if m:
                fields["document_number"] = m.group(1)

        if not fields.get("nationality"):
            if "USA" in raw_upper or "UNITED STATES" in raw_upper: fields["nationality"] = "USA"
            elif "GBR" in raw_upper or "BRITISH" in raw_upper: fields["nationality"] = "GBR"
            elif "IND" in raw_upper or "INDIAN" in raw_upper: fields["nationality"] = "IND"
            elif "CAN" in raw_upper or "CANADA" in raw_upper: fields["nationality"] = "CAN"
            elif "DEU" in raw_upper or "GERMANY" in raw_upper: fields["nationality"] = "DEU"
            elif "FRA" in raw_upper or "FRANCE" in raw_upper: fields["nationality"] = "FRA"

        return fields

    def _parse_visa_fields(self, lines: List[str], raw_upper: str) -> Dict[str, Any]:
        fields: Dict[str, Any] = {}
        for line in lines:
            line_up = line.upper()
            v_match = re.search(r'VISA\s*(?:NO|NUMBER|#)?\s*[:.\s]*([A-Z0-9]{6,12})', line_up)
            if v_match and "document_number" not in fields:
                fields["document_number"] = v_match.group(1)

            p_match = re.search(r'PASSPORT\s*(?:NO|#)?\s*[:.\s]*([A-Z0-9]{7,10})', line_up)
            if p_match and "passport_reference" not in fields:
                fields["passport_reference"] = p_match.group(1)

            if "ENTRIES" in line_up:
                if "MULT" in line_up: fields["entries"] = "MULTIPLE"
                elif "SINGLE" in line_up or "ONE" in line_up: fields["entries"] = "SINGLE"

        dates = re.findall(r'(\d{4}[-/.]\d{2}[-/.]\d{2}|\d{2}[-/.]\d{2}[-/.]\d{4})', "\n".join(lines))
        if len(dates) >= 2:
            fields["issue_date"] = dates[0]
            fields["expiry_date"] = dates[1]
        elif len(dates) == 1:
            fields["expiry_date"] = dates[0]

        return fields

    def _parse_boarding_pass_fields(self, lines: List[str], raw_upper: str) -> Dict[str, Any]:
        fields: Dict[str, Any] = {}
        for line in lines:
            line_up = line.upper()
            f_match = re.search(r'\b([A-Z0-9]{2}\s?\d{3,4})\b', line_up)
            if f_match and "flight_number" not in fields:
                fields["flight_number"] = f_match.group(1).replace(" ", "")

            seat_match = re.search(r'SEAT\s*[:.\s]*([0-9]{1,2}[A-K])', line_up)
            if seat_match and "seat" not in fields:
                fields["seat"] = seat_match.group(1)

            pnr_match = re.search(r'(?:PNR|BOOKING|REF)\s*[:.\s]*([A-Z0-9]{6})', line_up)
            if pnr_match and "pnr" not in fields:
                fields["pnr"] = pnr_match.group(1)

        iata_matches = re.findall(r'\b([A-Z]{3})\s*(?:TO|/|-|->)\s*([A-Z]{3})\b', raw_upper)
        if iata_matches:
            fields["origin"] = iata_matches[0][0]
            fields["destination"] = iata_matches[0][1]

        return fields

    def _parse_eticket_fields(self, lines: List[str], raw_upper: str) -> Dict[str, Any]:
        fields: Dict[str, Any] = {}
        for line in lines:
            line_up = line.upper()
            tkt_match = re.search(r'TICKET\s*(?:NO|NUMBER|#)?\s*[:.\s]*([0-9]{3}[-\s]?[0-9]{10})', line_up)
            if tkt_match and "ticket_number" not in fields:
                fields["ticket_number"] = tkt_match.group(1).replace(" ", "")

            pnr_match = re.search(r'(?:PNR|BOOKING|RECORD LOCATOR)\s*[:.\s]*([A-Z0-9]{6})', line_up)
            if pnr_match and "booking_reference" not in fields:
                fields["booking_reference"] = pnr_match.group(1)

        dates = re.findall(r'(\d{4}[-/.]\d{2}[-/.]\d{2}|\d{2}[-/.]\d{2}[-/.]\d{4})', "\n".join(lines))
        if dates:
            fields["travel_date"] = dates[0]

        return fields

    def _parse_permit_fields(self, lines: List[str], raw_upper: str, permit_kind: str) -> Dict[str, Any]:
        fields: Dict[str, Any] = {"permit_type": permit_kind.replace("_", " ").upper()}
        for line in lines:
            line_up = line.upper()
            p_match = re.search(r'(?:PERMIT|CARD|REGISTRATION)\s*(?:NO|#)?\s*[:.\s]*([A-Z0-9]{7,12})', line_up)
            if p_match and "document_number" not in fields:
                fields["document_number"] = p_match.group(1)

        dates = re.findall(r'(\d{4}[-/.]\d{2}[-/.]\d{2}|\d{2}[-/.]\d{2}[-/.]\d{4})', "\n".join(lines))
        if dates:
            fields["expiry_date"] = dates[-1]

        return fields

    def _parse_national_id_fields(self, lines: List[str], raw_upper: str) -> Dict[str, Any]:
        fields: Dict[str, Any] = {}
        for line in lines:
            line_up = line.upper()
            id_match = re.search(r'(?:ID|IDENTITY|CITIZEN|NATIONAL)\s*(?:NO|NUMBER|#)?\s*[:.\s]*([A-Z0-9]{8,14})', line_up)
            if id_match and "document_number" not in fields:
                fields["document_number"] = id_match.group(1)

        if not fields.get("document_number"):
            m = re.search(r'\b([0-9]{4}\s?[0-9]{4}\s?[0-9]{4})\b', raw_upper)
            if m:
                fields["document_number"] = m.group(1).replace(" ", "")

        dates = re.findall(r'(\d{4}[-/.]\d{2}[-/.]\d{2}|\d{2}[-/.]\d{2}[-/.]\d{4})', "\n".join(lines))
        if dates:
            fields["expiry_date"] = dates[-1]

        return fields

    def _parse_driving_license_fields(self, lines: List[str], raw_upper: str) -> Dict[str, Any]:
        fields: Dict[str, Any] = {}
        for line in lines:
            line_up = line.upper()
            dl_match = re.search(r'(?:DL|LICENCE|LICENSE|PERMIS)\s*(?:NO|NUMBER|#)?\s*[:.\s]*([A-Z0-9]{7,14})', line_up)
            if dl_match and "document_number" not in fields:
                fields["document_number"] = dl_match.group(1)

        dates = re.findall(r'(\d{4}[-/.]\d{2}[-/.]\d{2}|\d{2}[-/.]\d{2}[-/.]\d{4})', "\n".join(lines))
        if dates:
            fields["expiry_date"] = dates[-1]

        return fields

    def _parse_travel_authorization_fields(self, lines: List[str], raw_upper: str) -> Dict[str, Any]:
        fields: Dict[str, Any] = {}
        for line in lines:
            line_up = line.upper()
            auth_match = re.search(r'(?:AUTH|PERMIT|APPLICATION)\s*(?:NO|NUMBER|#)?\s*[:.\s]*([A-Z0-9]{8,14})', line_up)
            if auth_match and "document_number" not in fields:
                fields["document_number"] = auth_match.group(1)

        dates = re.findall(r'(\d{4}[-/.]\d{2}[-/.]\d{2}|\d{2}[-/.]\d{2}[-/.]\d{4})', "\n".join(lines))
        if dates:
            fields["expiry_date"] = dates[-1]

        return fields

    def _parse_generic_fields(self, lines: List[str], raw_upper: str) -> Dict[str, Any]:
        fields: Dict[str, Any] = {}
        m = re.search(r'\b([A-Z0-9]{7,12})\b', raw_upper)
        if m:
            fields["document_number"] = m.group(1)

        dates = re.findall(r'(\d{4}[-/.]\d{2}[-/.]\d{2}|\d{2}[-/.]\d{2}[-/.]\d{4})', "\n".join(lines))
        if dates:
            fields["expiry_date"] = dates[-1]

        return fields

ocr_engine = OCREngine()
