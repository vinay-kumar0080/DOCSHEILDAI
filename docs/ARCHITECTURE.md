# DocShield AI — System Architecture

DocShield AI is an enterprise AI-assisted fake identity and travel document screening system built for Airport Security Authorities, Airlines, and Immigration Officers.

```
+-------------------------------------------------------------------------+
|                           Client Browser                                |
|  - Next.js 14 App Router                                                |
|  - Dark Cybersecurity UI (Tailwind CSS, Glassmorphism, Lucide Icons)    |
|  - Live Camera Capture & Drag-and-Drop Uploader                         |
|  - Interactive Tampering Heatmap Viewer with Opacity Slider             |
+-------------------------------------------------------------------------+
                                    |
                                    | HTTPS / REST (JSON)
                                    v
+-------------------------------------------------------------------------+
|                        FastAPI Backend Server                           |
|  - REST API Routes (/api/v1/screenings, /reports, /analytics, /health)  |
|  - Asynchronous BackgroundTasks Worker                                  |
|  - SQLAlchemy ORM Layer (PostgreSQL / Supabase / SQLite)                |
|  - PDF Forensic Report Generator (ReportLab)                            |
+-------------------------------------------------------------------------+
                                    |
     +------------------------------+------------------------------+
     |                                                             |
     v                                                             v
+------------------------------------+  +-----------------------------------+
|       AI Processing Pipeline       |  |          Data Persistence         |
|  1. Image Quality Analyzer         |  |  - Profiles Table                 |
|  2. Document Layout Classifier     |  |  - Screening Sessions Table       |
|  3. Optical Character Recognition  |  |  - Uploaded Documents Table       |
|  4. ICAO 9303 MRZ Checksum Engine  |  |  - OCR Results Table              |
|  5. Deterministic Date Validators  |  |  - MRZ Results Table              |
|  6. Multi-Signal Tampering Engine  |  |  - Tampering Results Table        |
|  7. Biometric Face Match Engine    |  |  - Face Results Table             |
|  8. Explainable Risk Engine        |  |  - Risk Assessments Table         |
+------------------------------------+  |  - Audit Logs Table               |
                                        +-----------------------------------+
```
