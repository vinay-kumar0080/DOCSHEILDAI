# DocShield AI — REST API Reference (`/api/v1`)

## Base URL
`http://127.0.0.1:8000/api/v1`

---

## 1. System & Models
- `GET /health` : Service health status
- `GET /models/status` : Real-time status of loaded AI inference engines

## 2. Authentication & Profiles
- `POST /auth/profile` : Create or sync officer profile
- `GET /auth/profile/{email}` : Retrieve officer profile

## 3. Screening Workflow
- `GET /domains` : Retrieve list of security domains
- `GET /documents/types` : Retrieve supported identity document types
- `POST /screenings` : Initialize new screening session
- `POST /screenings/{id}/upload` : Upload identity document or live selfie image
- `POST /screenings/{id}/analyze` : Trigger async multi-modal AI screening pipeline
- `GET /screenings/{id}/status` : Poll current execution stage
- `GET /screenings/{id}` : Retrieve full screening dossier
- `GET /screenings` : List past screenings with optional query filters
- `DELETE /screenings/{id}` : Delete screening record

## 4. Sub-Module Endpoints
- `GET /screenings/{id}/ocr` : Extracted OCR tokens and structured fields
- `GET /screenings/{id}/mrz` : ICAO 9303 MRZ parsed fields and checksums
- `GET /screenings/{id}/validation` : Deterministic date and expiration checks
- `GET /screenings/{id}/tampering` : Error Level Analysis and tampering heatmap
- `GET /screenings/{id}/face` : Biometric facial comparison status
- `GET /screenings/{id}/risk` : Explainable risk assessment breakdown

## 5. Reports & Biometrics
- `GET /screenings/{id}/report` : Generate and download official PDF report
- `POST /face-verification` : Direct 1:1 facial comparison endpoint
- `GET /analytics` : Aggregated database screening metrics
