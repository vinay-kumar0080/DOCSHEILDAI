-- DocShield AI: Supabase PostgreSQL Schema DDL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'analyst',
    domain VARCHAR(50) DEFAULT 'airport_security',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Screening Sessions
CREATE TABLE IF NOT EXISTS screening_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    domain VARCHAR(50) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'created',
    stage VARCHAR(50) DEFAULT 'pending',
    risk_score FLOAT DEFAULT 0.0,
    risk_level VARCHAR(50) DEFAULT 'UNABLE_TO_DETERMINE',
    manual_review_required BOOLEAN DEFAULT FALSE,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 3. Uploaded Documents
CREATE TABLE IF NOT EXISTS uploaded_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    screening_id UUID REFERENCES screening_sessions(id) ON DELETE CASCADE,
    storage_path VARCHAR(512) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    doc_role VARCHAR(50) DEFAULT 'primary_document',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. OCR Results
CREATE TABLE IF NOT EXISTS ocr_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    screening_id UUID REFERENCES screening_sessions(id) ON DELETE CASCADE,
    raw_text TEXT,
    structured_fields JSONB,
    average_confidence FLOAT DEFAULT 0.0,
    bounding_boxes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. MRZ Results
CREATE TABLE IF NOT EXISTS mrz_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    screening_id UUID REFERENCES screening_sessions(id) ON DELETE CASCADE,
    mrz_detected BOOLEAN DEFAULT FALSE,
    mrz_text TEXT,
    document_number VARCHAR(50),
    date_of_birth VARCHAR(50),
    expiry_date VARCHAR(50),
    nationality VARCHAR(50),
    issuer VARCHAR(50),
    sex VARCHAR(10),
    checksums JSONB,
    is_valid BOOLEAN DEFAULT FALSE,
    confidence FLOAT DEFAULT 0.0,
    field_matches JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Validation Results
CREATE TABLE IF NOT EXISTS validation_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    screening_id UUID REFERENCES screening_sessions(id) ON DELETE CASCADE,
    check_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    severity VARCHAR(20) DEFAULT 'info',
    message VARCHAR(500) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tampering Results
CREATE TABLE IF NOT EXISTS tampering_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    screening_id UUID REFERENCES screening_sessions(id) ON DELETE CASCADE,
    tampering_detected BOOLEAN DEFAULT FALSE,
    score FLOAT DEFAULT 0.0,
    confidence FLOAT DEFAULT 0.0,
    status VARCHAR(50) DEFAULT 'CLEAR',
    suspicious_regions JSONB,
    heatmap_path VARCHAR(512),
    heatmap_base64 TEXT,
    signals JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Face Results
CREATE TABLE IF NOT EXISTS face_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    screening_id UUID REFERENCES screening_sessions(id) ON DELETE CASCADE,
    face_detected_document BOOLEAN DEFAULT FALSE,
    face_detected_live BOOLEAN DEFAULT FALSE,
    face_count_document INTEGER DEFAULT 0,
    face_count_live INTEGER DEFAULT 0,
    similarity FLOAT DEFAULT 0.0,
    status VARCHAR(50) DEFAULT 'NOT_EVALUATED',
    confidence FLOAT DEFAULT 0.0,
    document_face_box JSONB,
    live_face_box JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Risk Assessments
CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    screening_id UUID REFERENCES screening_sessions(id) ON DELETE CASCADE,
    risk_score FLOAT DEFAULT 0.0,
    risk_level VARCHAR(50) NOT NULL,
    contributors JSONB,
    explanation JSONB,
    recommendation VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Reports
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    screening_id UUID REFERENCES screening_sessions(id) ON DELETE CASCADE,
    report_path VARCHAR(512) NOT NULL,
    generated_by VARCHAR(255) DEFAULT 'DocShield AI Engine',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(50),
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
