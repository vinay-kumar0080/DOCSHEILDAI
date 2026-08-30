# DocShield AI — Open Source Model & Forensics Registry

This document records the open-source neural networks, algorithms, and forensic pipelines integrated into **DocShield AI**.

---

## 1. Optical Character Recognition (OCR) & Text Localization

| Parameter | Specification |
|---|---|
| **Text Detector** | **PaddleOCR PP-OCRv3 DB (Differentiable Binarization)** |
| **Model Weights** | `backend/app/ai/weights/text_detection_en_ppocrv3_2023may.onnx` (~2.4 MB) |
| **Text Recognizer** | **CRNN ResNet-CTC (Convolutional Recurrent Neural Network)** |
| **Model Weights** | `backend/app/ai/weights/text_recognition_CRNN_EN_2021sep.onnx` (~33.8 MB) |
| **Source / Repo** | [PaddlePaddle / PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) |
| **License** | **Apache 2.0** (Commercial & Production Allowed) |
| **Input Format** | RGB Image Tensor `[1, 3, H, W]` (Normalized) |
| **Output Format** | Bounding box polygon coordinates + Alphanumeric text token stream with character confidence scores |
| **Hardware** | CPU / ONNXRuntime (< 120ms latency per standard 1080p document) |

---

## 2. Document Type Verification & Multi-Modal Classification Gate

| Parameter | Specification |
|---|---|
| **Classifier** | **DocShield Multi-Modal Rule-Layout Classifier v2** |
| **Module** | `backend/app/ai/classification/document_classifier.py` |
| **Classes Supported**| `passport`, `visa`, `eticket`, `boarding_pass`, `national_id`, `residence_permit`, `work_permit`, `driving_license`, `non_document_object`, `unknown_document` |
| **Source / Repo** | Native OpenCV Texture Energy + Semantic Field & MRZ Tokenizer |
| **License** | **MIT / Apache 2.0** |
| **Input Format** | Image Path + Expected Document Type + Raw OCR Text Buffer |
| **Output Format** | `expected_type`, `detected_type`, `confidence`, `status` (`PASS` / `MISMATCH` / `REJECT` / `MANUAL_REVIEW`), `cues` |
| **Fail-Closed Behavior** | Gating: Rejects random photographs, product images (shoes, landscapes, furniture) and returns `UNABLE_TO_DETERMINE` rather than false `LOW_RISK`. |

---

## 3. Image Quality & Forensic Pre-Inspection Gate

| Parameter | Specification |
|---|---|
| **Module** | **DocShield Image Quality Analyzer** (`backend/app/ai/quality/image_quality.py`) |
| **Techniques** | Laplacian 64F Variance (Blur), Luminance Mean/Std (Exposure & Contrast), Specular Glare Thresholding (>248), Canny Structure Density |
| **Input Format** | Document Image |
| **Output Format** | `status` (`PASS` / `LOW_QUALITY` / `UNACCEPTABLE`), `sharpness_index`, `glare_percentage`, `issues`, `recommendation` |
| **License** | **MIT / Apache 2.0** |

---

## 4. Machine Readable Zone (MRZ) Engine & Checksum Verification

| Parameter | Specification |
|---|---|
| **Standard** | **ICAO Document 9303 (Parts 4, 7, 9, 10, 11)** |
| **Module** | `backend/app/ai/mrz/mrz_engine.py` |
| **Checksum Algorithm** | Cyclic weighted Modulo-10 with weights `[7, 3, 1]` |
| **Supported Formats** | TD1 (3-line ID card), TD2 (2-line visa/id), TD3 (2-line 44-char passport) |
| **Verification Checks** | Document Number check digit, Date of Birth check digit, Expiry check digit, Optional data check digit, Composite overall check digit |
| **License** | **Public Standard / Apache 2.0** |

---

## 5. Multi-Signal Image Tampering & Forensic Analysis

| Parameter | Specification |
|---|---|
| **Model 1 (Deep Learning)** | **Hugging Face Vision Transformer (ViT-Base-Patch16-224 Quantized ONNX)** |
| **Model Weights** | `backend/app/ai/weights/huggingface_vit_quantized.onnx` (~88.2 MB) |
| **Source / Repo** | [Hugging Face / google/vit-base-patch16-224](https://huggingface.co/google/vit-base-patch16-224) |
| **License** | **Apache 2.0** |
| **Forensic Signal 2** | **PIL Error Level Analysis (ELA)** at 90% re-compression quantization scale |
| **Forensic Signal 3** | **SciPy 2D Fast Fourier Transform (FFT)** for high-frequency splicing and periodic rescreening detection |
| **Forensic Signal 4** | **PyWavelets Multi-Resolution Wavelet Residuals** (Laplacian noise variance) |
| **Output** | `tampering_detected`, `score` (0.0-1.0), `confidence`, `status` (`CLEAR`, `SUSPICIOUS`, `ANOMALOUS`), `suspicious_regions` heatmap |

---

## 6. Biometric Face Detection & 1:1 Cosine Recognition

| Parameter | Specification |
|---|---|
| **Face Detector** | **OpenCV Zoo YuNet (5 Facial Landmarks)** |
| **Detector Weights** | `backend/app/ai/weights/face_detection_yunet_2023mar.onnx` (~232 KB) |
| **Face Recognizer** | **SFace (128-Dimensional Deep Cosine Recognizer)** |
| **Recognizer Weights** | `backend/app/ai/weights/face_recognition_sface_2021dec.onnx` (~38.7 MB) |
| **Source / Repo** | [OpenCV Model Zoo / SFace](https://github.com/opencv/opencv_zoo) |
| **License** | **Apache 2.0** |
| **Input Format** | Document Crop & Live Webcam Selfie `[112, 112]` |
| **Output Format** | 128-d unit vector, Cosine similarity metric (0.0–1.0), Status (`MATCH_SIGNAL` / `MISMATCH_SIGNAL` / `UNABLE_TO_VERIFY`) |
| **Threshold** | Cosine Distance $\ge 0.65$ indicates biometric correspondence |

---

## 7. Explainable Fail-Closed Risk Engine

| Parameter | Specification |
|---|---|
| **Module** | `backend/app/ai/risk/risk_engine.py` |
| **Scoring Range** | $0.0$ to $100.0$ (Explainable Ledger) |
| **4-Tier Levels** | `LOW_RISK` (0–29), `REVIEW_RECOMMENDED` (30–59), `HIGH_RISK` (60–100), `UNABLE_TO_DETERMINE` |
| **Fail-Closed Rule** | Rejects missing evidence, random objects, severe blur, or classification mismatches with `UNABLE_TO_DETERMINE` instead of false `LOW_RISK`. |
| **License** | **MIT** |
