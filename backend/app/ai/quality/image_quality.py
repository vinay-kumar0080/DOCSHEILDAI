import cv2
import numpy as np
from typing import Dict, Any, List

class ImageQualityAnalyzer:
    def analyze(self, image_path: str) -> Dict[str, Any]:
        """
        Analyze input image quality including resolution, blur (Laplacian variance), 
        brightness, contrast, glare, and boundary visibility.
        """
        try:
            img = cv2.imread(image_path)
            if img is None:
                return {
                    "is_usable": False,
                    "status": "UNACCEPTABLE",
                    "score": 0.0,
                    "issues": ["Failed to decode image file (corrupt or unsupported format)"],
                    "recommendation": "Please upload a valid JPEG, PNG, or WebP document image.",
                    "details": {}
                }

            h, w = img.shape[:2]
            total_pixels = h * w
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

            # 1. Resolution Check
            is_critically_low_res = (w < 350 or h < 250) or total_pixels < (350 * 250)
            is_suboptimal_res = (w < 640 or h < 400) or total_pixels < (640 * 400)
            is_optimal_res = (w >= 1280 and h >= 720) or total_pixels >= (1280 * 720)

            # 2. Blur detection via Laplacian Variance
            laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
            is_severely_blurry = laplacian_var < 35.0
            is_moderately_blurry = 35.0 <= laplacian_var < 65.0

            # 3. Brightness & Contrast
            mean_brightness = float(np.mean(gray))
            contrast_std = float(np.std(gray))

            is_too_dark = mean_brightness < 40.0
            is_too_bright = mean_brightness > 225.0
            is_low_contrast = contrast_std < 22.0

            # 4. Glare hotspot detection (pixels > 248)
            glare_pixels = int(np.sum(gray > 248))
            glare_ratio = float(glare_pixels / max(1, total_pixels))
            has_severe_glare = glare_ratio > 0.15
            has_moderate_glare = 0.06 < glare_ratio <= 0.15

            # 5. Edge / Structure Density (Canny)
            edges = cv2.Canny(gray, 50, 150)
            edge_density = float(np.sum(edges > 0) / max(1, total_pixels))
            is_blank_or_textureless = edge_density < 0.003

            # Quality Assessment
            issues: List[str] = []
            score = 100.0

            if is_critically_low_res:
                issues.append(f"Image resolution critically low ({w}x{h}). Minimum 400x300 required.")
                score -= 45.0
            elif is_suboptimal_res:
                issues.append(f"Image resolution below optimal standard ({w}x{h}).")
                score -= 15.0

            if is_severely_blurry:
                issues.append(f"Severe motion blur / out of focus (sharpness variance: {int(laplacian_var)}).")
                score -= 40.0
            elif is_moderately_blurry:
                issues.append("Moderate softness detected; fine text may be degraded.")
                score -= 15.0

            if is_too_dark:
                issues.append("Severe underexposure / lighting too dim.")
                score -= 30.0
            elif is_too_bright:
                issues.append("Severe overexposure / washed out lighting.")
                score -= 30.0

            if is_low_contrast:
                issues.append("Low contrast between text and document background.")
                score -= 20.0

            if has_severe_glare:
                issues.append(f"Severe specular reflection / glare covering {int(glare_ratio*100)}% of surface.")
                score -= 25.0
            elif has_moderate_glare:
                issues.append("Moderate surface glare detected.")
                score -= 10.0

            if is_blank_or_textureless:
                issues.append("Image appears almost blank or lacks document structure.")
                score -= 50.0

            score = max(0.0, min(100.0, score))

            if score < 40.0 or is_severely_blurry or is_critically_low_res or is_blank_or_textureless:
                status = "UNACCEPTABLE"
                is_usable = False
                recommendation = "Capture quality is insufficient for forensic screening. Please retake the document with the full card/page flat, in bright lighting, without glare."
            elif score < 70.0 or len(issues) > 0:
                status = "LOW_QUALITY"
                is_usable = True
                recommendation = "Document image has minor quality defects. Verification may proceed with manual review."
            else:
                status = "PASS"
                is_usable = True
                recommendation = "Image clarity, illumination, and resolution meet international inspection standards."

            return {
                "is_usable": is_usable,
                "status": status,
                "score": round(score / 100.0, 2),
                "sharpness_index": round(laplacian_var, 1),
                "brightness": round(mean_brightness, 1),
                "contrast": round(contrast_std, 1),
                "glare_percentage": round(glare_ratio * 100, 1),
                "resolution": f"{w}x{h}",
                "issues": issues,
                "recommendation": recommendation,
                "details": {
                    "width": w,
                    "height": h,
                    "laplacian_variance": round(laplacian_var, 2),
                    "mean_brightness": round(mean_brightness, 2),
                    "contrast_std": round(contrast_std, 2),
                    "glare_ratio": round(glare_ratio, 4),
                    "edge_density": round(edge_density, 4)
                }
            }

        except Exception as e:
            return {
                "is_usable": False,
                "status": "UNACCEPTABLE",
                "score": 0.0,
                "issues": [f"Image quality assessment error: {str(e)}"],
                "recommendation": "Please re-upload a clear document image.",
                "details": {"error": str(e)}
            }

image_quality_analyzer = ImageQualityAnalyzer()
