# DocShield AI — Security & Privacy Architecture

## 1. Biometric Data Privacy & Minimization
- Raw biometric vectors and embeddings are never permanently persisted in public database tables.
- Temporary files generated during inference are scrubbed based on the configured `DOCUMENT_RETENTION_HOURS` policy.
- Zero-exposure credential architecture: frontend never receives `SUPABASE_SERVICE_ROLE_KEY` or master database connection credentials.

## 2. Input Validation & File Sanitization
- File MIME types are strictly validated against an explicit whitelist (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`).
- Maximum upload size capped at 15MB.
- File names are cryptographically randomized with UUIDs to prevent directory traversal and execution vulnerabilities.

## 3. Mandatory Legal Notice
- AI outputs are decision-support signals only.
- Prohibited terminology: System never claims "100% Genuine", "100% Fake", or "Guaranteed Authentic".
- High-risk signals mandate physical inspection and official verification by authorized personnel.
