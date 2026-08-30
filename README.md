# DocShield AI — Fake Identity & Document Screening System

**DocShield AI** is an enterprise, SIH-style AI-assisted document and identity screening platform designed for **Airport Security Authorities**, **Airlines**, and **Immigration Officers**.

It provides multi-modal forensic inspection of Passports, Visas, National IDs, Driving Licenses, Residence Permits, and Live Biometric Face Verification with an explainable rule-based risk engine.

---

## Key Capabilities

1. **OCR & Field Extraction**: High-precision Optical Character Recognition for names, document numbers, dates, nationality.
2. **ICAO Document 9303 MRZ Engine**: Checksum verification (doc number, DOB, expiration, composite modulo-10 check digits).
3. **Multi-Signal Tampering Forensics**: Error Level Analysis (ELA), 2D Fast Fourier Transform (FFT) frequency spectrum, Laplacian noise variance, and visual suspicious-region heatmap generator.
4. **1:1 Biometric Face Match**: Compares document portrait crop with live webcam/selfie capture.
5. **Deterministic Date & Consistency Engine**: Expiry checks, future DOB detection, cross-comparison between visual OCR and encoded MRZ lines.
6. **Explainable Risk Engine**: Transparent 0-100 score with itemized positive/negative signal breakdown (Low Risk, Review Recommended, High Risk, Unable to Determine).
7. **Official PDF Reports**: Downloadable forensic screening report with audit trail and legal disclaimer.

---

## Technology Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons, Dark Futuristic Cybersecurity UI.
- **Backend**: Python 3.11+, FastAPI, SQLAlchemy, Pydantic v2, ReportLab, OpenCV, NumPy, SciPy, Pillow.
- **Database**: PostgreSQL / Supabase with SQLite fallback.

---

## Getting Started

### 1. Backend Setup

```bash
# Navigate to repository root
pip install -r backend/requirements.txt

# Start FastAPI server
$env:PYTHONPATH = "backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

API docs will be live at: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend
npm install
npm run dev
```

Application will be live at: `http://localhost:3000`

---

## Running Automated Tests

```bash
$env:PYTHONPATH = "backend"
python -m pytest backend/tests
```
