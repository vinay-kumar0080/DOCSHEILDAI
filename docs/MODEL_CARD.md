# DocShield AI — Real-World Machine Learning Model Card & Pipeline Architecture

This document specifies all real-world pretrained deep learning models and algorithms integrated into the DocShield AI multi-modal screening pipeline.

---

## Integrated Models Summary

| Subsystem | Model / Algorithm | Source / Hub | Parameter Size | Execution Device | Output Metric |
|---|---|---|---|---|---|
| **Deep Feature Authenticity & Patch Artifacts** | Vision Transformer (ViT-Base-Patch16-224 Quantized) | [Hugging Face Hub (`Xenova/vit-base-patch16-224`)](https://huggingface.co/Xenova/vit-base-patch16-224) | 88.2 MB | CPU (ONNXRuntime) | Shannon entropy, patch continuity & anomaly score |
| **Face Detection & Localization** | YuNet 5-Landmark Deep Neural Network | [OpenCV Model Zoo / GitHub](https://github.com/opencv/opencv_zoo) | 232 KB | CPU (`cv2.FaceDetectorYN`) | 5 Facial landmarks & Bounding box confidence |
| **Face Recognition & Biometrics** | SFace 128-d Biometric Recognizer | [OpenCV Model Zoo / GitHub](https://github.com/opencv/opencv_zoo) | 38.6 MB | CPU (`cv2.FaceRecognizerSF`) | 128-d embeddings & Cosine similarity (Threshold 0.363) |
| **Text Line Detection** | PP-OCRv3 Text Detector | [OpenCV Model Zoo / PaddlePaddle](https://github.com/opencv/opencv_zoo) | 2.42 MB | CPU (`cv2.dnn.readNet`) | Spatial candidate bounding boxes |
| **Text Recognition** | CRNN English Alphanumeric Recognizer | [OpenCV Model Zoo / PyTorch](https://github.com/opencv/opencv_zoo) | 33.8 MB | CPU (`cv2.dnn.readNet`) | Character sequences & token confidence |
| **MRZ Checksum Validation** | ICAO 9303 Modulo-10 Cyclic Weighted CodeChecker | PyPI / GitHub `mrz` | Deterministic Algorithm | CPU (`mrz.checker`) | Modulo-10 Check digits (`[7, 3, 1]`) for TD1/TD2/TD3 |
| **Error Level Analysis (ELA)** | Recompression Gradient Analysis | PIL / Pillow ImageChops | Forensic Delta | CPU | JPEG quantization gradient score (0.0–1.0) |
| **Spectral Frequency Forensics** | 2D Fast Fourier Transform (2D-FFT) | `scipy.fft` | Frequency Spectrum | CPU | High-frequency energy discontinuity ratio |
| **Wavelet Residual Variance** | Multi-Scale Wavelet Noise Estimation | `scikit-image.restoration.estimate_sigma` | Wavelet Coefficients | CPU | Variance inconsistency score across grid tiles |
| **Cross-Document Consistency** | DocShield Consistency Engine | Centralized Logic Service | Deterministic Evaluator | CPU | Cross-field alignment badges (`CONSISTENT` / `INCONSISTENT`) |
| **Explainable Risk Assessment** | DocShield Explainable Risk Engine | Rule-Based Weighted Scorer | 14 Audited Rules | CPU | 0–100 Risk Score + Itemized Points Ledger |

---

## 1. Hugging Face Vision Transformer (ViT) Authenticity Engine
- **Repository**: `Xenova/vit-base-patch16-224` (quantized ONNX).
- **Function**: Divides document images into $16 \times 16$ pixel non-overlapping patches, passing through a multi-head self-attention transformer to compute deep spatial feature representations.
- **Forgery Detection**: Detects patch boundary dislocations, unnatural pixel interpolations, and generative/synthetic artifacts across the image.

---

## 2. OpenCV Model Zoo YuNet Face Detector
- **Weights File**: `backend/app/ai/weights/face_detection_yunet_2023mar.onnx`
- **Inference**: Dynamically resized input canvas via `cv2.FaceDetectorYN`. Detects bounding box and 5 facial landmarks (left eye, right eye, nose tip, left mouth corner, right mouth corner).

---

## 3. OpenCV Model Zoo SFace Biometric Recognizer
- **Weights File**: `backend/app/ai/weights/face_recognition_sface_2021dec.onnx`
- **Inference**: Extracts a 128-dimensional L2-normalized floating point vector from aligned facial crops.
- **Metric**: Cosine Similarity via `cv2.FaceRecognizerSF_FR_COSINE` (values $> 0.363$ indicate strong biometric identity match).

---

## 4. Multi-Signal Forensics: ELA, 2D-FFT, and Wavelets
- **Error Level Analysis**: Computes difference between the original and a 90% recompressed copy to identify regions saved at different compression levels.
- **2D-FFT Spectral Energy**: Masks low frequencies to evaluate the high-frequency spectral discontinuity ratio.
- **Wavelet Noise Residual**: Applies multi-scale wavelets across grid tiles to detect spliced text or spliced portrait photos with mismatched noise signatures.
