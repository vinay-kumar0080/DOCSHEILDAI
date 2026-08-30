import cv2
import numpy as np
from typing import Dict, Any

class ImageQualityAnalyzer:
    def analyze(self, image_path: str) -> Dict[str, Any]:
        """
        Analyze input image quality including blur (Laplacian variance), 
        brightness, contrast, and glare.
        """
        try:
            img = cv2.imread(image_path)
            if img is None:
                return {
                    "is_usable": False,
                    "status": "ERROR_UNREADABLE",
                    "score": 0.0,
                    "details": {"error": "Failed to decode image"}
                }

            h, w, _ = img.shape
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

            # 1. Blur detection via Laplacian Variance
            laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
            is_blurry = laplacian_var < 70.0

            # 2. Brightness & Contrast
            mean_brightness = float(np.mean(gray))
            contrast_std = float(np.std(gray))

            is_too_dark = mean_brightness < 40.0
            is_too_bright = mean_brightness > 225.0
            is_low_contrast = contrast_std < 25.0

            # 3. Glare hotspot detection (pixels > 250)
            glare_pixels = np.sum(gray > 250)
            glare_ratio = float(glare_pixels / (h * w))
            has_glare = glare_ratio > 0.08

            # Overall Quality Assessment
            issues = []
            if is_blurry:
                issues.append("Image is blurry (low edge variance)")
            if is_too_dark:
                issues.append("Image is severely underexposed")
            if is_too_bright:
                issues.append("Image is severely overexposed")
            if is_low_contrast:
                issues.append("Low contrast text area")
            if has_glare:
                issues.append("Surface reflection / glare detected")

            # Quality Score 0-100
            score = 100.0
            if is_blurry:
                score -= 30.0
            if is_too_dark or is_too_bright:
                score -= 25.0
            if is_low_contrast:
                score -= 20.0
            if has_glare:
                score -= 20.0
            score = max(10.0, min(100.0, score))

            status = "EXCELLENT"
            if score < 50:
                status = "POOR"
            elif score < 75:
                status = "ACCEPTABLE"

            return {
                "is_usable": score >= 40,
                "status": status,
                "score": round(score, 1),
                "resolution": f"{w}x{h}",
                "blur_metric": round(laplacian_var, 2),
                "brightness": round(mean_brightness, 2),
                "contrast": round(contrast_std, 2),
                "glare_ratio": round(glare_ratio * 100, 2),
                "issues": issues
            }

        except Exception as e:
            return {
                "is_usable": True,
                "status": "UNABLE_TO_ANALYZE",
                "score": 70.0,
                "details": {"error": str(e)},
                "issues": []
            }

image_quality_analyzer = ImageQualityAnalyzer()
