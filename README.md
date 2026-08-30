# DocShield AI — AI-Based Fake Identity & Document Screening System

**DocShield AI** is an enterprise AI-assisted document and identity screening platform designed for **Airport Security Authorities**, **Airlines**, and **Immigration Border Control**.

It provides multi-modal forensic inspection of Passports, Visas, National IDs, Driving Licenses, Residence Permits, and Live Biometric Face Verification with an explainable rule-based risk engine.

---

## 🌟 Key Capabilities

1. **OCR & Text Line Recognition**: Pretrained PaddleOCR PP-OCRv3 DB and CRNN ONNX neural networks for field extraction (Names, Document Numbers, DOB, Expiration, Nationality).
2. **ICAO 9303 MRZ Engine**: Modulo-10 cyclic weighted `[7, 3, 1]` checksum verification for TD1, TD2, TD3 passports and visas.
3. **Deep Learning & Multi-Signal Forensics**: Hugging Face Vision Transformer (ViT-Base-Patch16-224 Quantized ONNX), Error Level Analysis (ELA), 2D Fast Fourier Transform (FFT) frequency spectrum, and Wavelet noise residuals.
4. **1:1 Biometric Face Match**: OpenCV Zoo YuNet 5-landmark face detection and SFace 128-d cosine recognizer vs live selfie.
5. **Cross-Document Consistency**: Cross-checks OCR vs MRZ and Passport vs Visa / Boarding Pass pairs.
6. **Explainable Risk Engine**: 14-rule transparent 0–100 risk score with itemized point ledger (`LOW RISK`, `REVIEW RECOMMENDED`, `HIGH RISK`).
7. **ReportLab PDF Reports**: Real-time generation of 11-section PDF screening dossiers with official disclaimer.
8. **Collapsible Command Sidebar**: Professional expandable/collapsible navigation with responsive desktop and mobile drawer modes.

---

## 🚀 Deployment Guide

### Option 1: Fullstack Docker Compose (Recommended)

Run both Backend (FastAPI + OpenCV) and Frontend (Next.js) with a single command:

```bash
docker-compose up --build -d
```

- **Frontend**: `http://localhost:3000`
- **Backend API & Swagger Docs**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/api/v1/health`

---

### Option 2: Deploy Frontend on Vercel & Backend on Render/Railway

#### Step 1: Deploy Backend (Render / Railway)
1. Link your GitHub repository `https://github.com/vinay-kumar0080/DOCSHEILDAI`.
2. Select **Web Service** or use the included `render.yaml` blueprint.
3. Set:
   - **Runtime**: Python 3.11+
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `python -m uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
4. Copy your live backend URL (e.g. `https://docshield-backend.onrender.com`).

#### Step 2: Deploy Frontend (Vercel)
1. Import `https://github.com/vinay-kumar0080/DOCSHEILDAI` into [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Add Environment Variable:
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://docshield-backend.onrender.com/api/v1
   NEXT_PUBLIC_APP_NAME="DocShield AI"
   ```
4. Click **Deploy**.

---

### Option 3: Local Development Setup

#### 1. Backend (FastAPI)
```bash
# Install dependencies
pip install -r backend/requirements.txt

# Run server with hot reload
$env:PYTHONPATH = "backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Frontend (Next.js 14)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🧪 Automated Testing

Run the full backend test suite (14/14 unit and integration tests):

```bash
$env:PYTHONPATH = "backend"
python -m pytest backend/tests
```

Check frontend TypeScript compilation:
```bash
cd frontend
npx tsc --noEmit
```

---

## 📜 License
MIT License. Developed for automated fake identity and document screening.
