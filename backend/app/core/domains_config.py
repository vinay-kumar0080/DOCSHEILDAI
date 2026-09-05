"""
DocShield AI — Canonical Security Domains and Document Presets Configuration
Single source of truth for:
- 5 Operational Security Domains
- Exact 6 supported documents per domain
- Domain validation & upload checks
- Fail-closed security rules
"""

from typing import Dict, List, Any
from fastapi import HTTPException

CANONICAL_DOMAINS: List[Dict[str, Any]] = [
    {
        "domain_id": "immigration_officers",
        "id": "immigration_officers",
        "name": "Immigration Officers",
        "display_name": "Immigration Officers",
        "badge": "Border Control & Customs",
        "code": "IMM-OFFICER",
        "description": "Perform passport control, visa validation, residence and work permit inspection at national checkpoints.",
        "icon": "ShieldCheck",
        "color": "from-cyan-600/30 to-blue-500/20",
        "documents": [
            "Passport",
            "Visa",
            "Residence Permit",
            "Work Permit",
            "Travel Authorization",
            "National ID"
        ],
        "supported_document_ids": [
            "passport",
            "visa",
            "residence_permit",
            "work_permit",
            "travel_authorization",
            "national_id"
        ]
    },
    {
        "domain_id": "border_security",
        "id": "border_security",
        "name": "Border-Security Personnel",
        "display_name": "Border-Security Personnel",
        "badge": "Border Checkpoint",
        "code": "BOR-SECURITY",
        "description": "Identity consistency, MRZ verification, tampering signals, and travel authorization screening.",
        "icon": "Shield",
        "color": "from-emerald-600/30 to-teal-500/20",
        "documents": [
            "Passport",
            "Visa",
            "National ID",
            "Residence Permit",
            "Travel Permit",
            "Border/Travel Authorization"
        ],
        "supported_document_ids": [
            "passport",
            "visa",
            "national_id",
            "residence_permit",
            "travel_permit",
            "travel_authorization"
        ]
    },
    {
        "domain_id": "airport_security",
        "id": "airport_security",
        "name": "Airport Security Authorities",
        "display_name": "Airport Security Authorities",
        "badge": "Terminal Checkpoint",
        "code": "ASA-TERMINAL",
        "description": "Screen passenger identity documents, boarding passes, visas, and e-tickets for aviation integrity.",
        "icon": "Plane",
        "color": "from-blue-600/30 to-cyan-500/20",
        "documents": [
            "Passport",
            "Boarding Pass",
            "Visa",
            "E-Ticket",
            "National ID",
            "Travel Authorization"
        ],
        "supported_document_ids": [
            "passport",
            "boarding_pass",
            "visa",
            "eticket",
            "national_id",
            "travel_authorization"
        ]
    },
    {
        "domain_id": "immigration_departments",
        "id": "immigration_departments",
        "name": "Immigration Departments",
        "display_name": "Immigration Departments",
        "badge": "Departmental Screening",
        "code": "IMM-DEPT",
        "description": "Evaluate visa applications, residence status, work authorizations, and legal identity validity.",
        "icon": "Building2",
        "color": "from-purple-600/30 to-indigo-500/20",
        "documents": [
            "Passport",
            "Visa",
            "Residence Permit",
            "Work Permit",
            "National ID",
            "Travel Authorization"
        ],
        "supported_document_ids": [
            "passport",
            "visa",
            "residence_permit",
            "work_permit",
            "national_id",
            "travel_authorization"
        ]
    },
    {
        "domain_id": "law_enforcement",
        "id": "law_enforcement",
        "name": "Law-Enforcement Agencies",
        "display_name": "Law-Enforcement Agencies",
        "badge": "Law Enforcement Command",
        "code": "LEA-PATROL",
        "description": "Screen national IDs, driving licences, passports, and travel credentials for investigative identification.",
        "icon": "ShieldAlert",
        "color": "from-indigo-600/30 to-blue-500/20",
        "documents": [
            "Passport",
            "National ID",
            "Driving Licence",
            "Residence Permit",
            "Work Permit",
            "Travel Document"
        ],
        "supported_document_ids": [
            "passport",
            "national_id",
            "driving_license",
            "residence_permit",
            "work_permit",
            "travel_permit"
        ]
    }
]

DOMAINS_BY_ID: Dict[str, Dict[str, Any]] = {d["domain_id"]: d for d in CANONICAL_DOMAINS}

DOMAIN_ALIASES: Dict[str, str] = {
    "airline": "airport_security",
    "immigration": "immigration_officers",
    "border_travel": "border_security"
}

DOCUMENT_ID_ALIASES: Dict[str, str] = {
    "e_ticket": "eticket",
    "driving_licence": "driving_license",
    "travel_document": "travel_permit",
    "border_authorization": "travel_authorization",
    "border_travel_authorization": "travel_authorization"
}

def resolve_domain_id(domain_id: str) -> str:
    normalized = (domain_id or "").strip().lower()
    return DOMAIN_ALIASES.get(normalized, normalized)

def resolve_document_id(doc_id: str) -> str:
    normalized = (doc_id or "").strip().lower()
    return DOCUMENT_ID_ALIASES.get(normalized, normalized)

def is_domain_valid(domain_id: str) -> bool:
    resolved = resolve_domain_id(domain_id)
    return resolved in DOMAINS_BY_ID

def get_domain_config(domain_id: str) -> Dict[str, Any]:
    resolved = resolve_domain_id(domain_id)
    if resolved not in DOMAINS_BY_ID:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid domain '{domain_id}'. Must be one of: {list(DOMAINS_BY_ID.keys())}"
        )
    return DOMAINS_BY_ID[resolved]

def is_document_supported(domain_id: str, document_type: str) -> bool:
    resolved_doc = resolve_document_id(document_type)
    if resolved_doc in ["live_selfie", "face_verification", "primary_document"]:
        return True
    
    resolved_domain = resolve_domain_id(domain_id)
    domain_cfg = DOMAINS_BY_ID.get(resolved_domain)
    if not domain_cfg:
        return False
    
    return resolved_doc in domain_cfg["supported_document_ids"]

def validate_domain_and_document(domain_id: str, document_type: str) -> None:
    resolved_domain = resolve_domain_id(domain_id)
    if resolved_domain not in DOMAINS_BY_ID:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid security domain '{domain_id}'. Must be one of: {list(DOMAINS_BY_ID.keys())}"
        )
    
    resolved_doc = resolve_document_id(document_type)
    if resolved_doc not in ["live_selfie", "face_verification", "primary_document"]:
        supported_docs = DOMAINS_BY_ID[resolved_domain]["supported_document_ids"]
        if resolved_doc not in supported_docs:
            raise HTTPException(
                status_code=400,
                detail=f"Document '{document_type}' is not supported by domain '{domain_id}'. Supported documents: {supported_docs}"
            )
