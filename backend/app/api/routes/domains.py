from fastapi import APIRouter

router = APIRouter(tags=["Domains & Document Types"])

@router.get("/domains")
def get_domains():
    return [
        {
            "id": "airport_security",
            "name": "Airport Security Authorities",
            "code": "ASA",
            "description": "Screen passengers, identity documents, boarding passes, and travel credentials.",
            "icon": "Plane",
            "color": "from-blue-600/30 to-cyan-500/20",
            "badge": "Aviation Security Tier 1"
        },
        {
            "id": "airline",
            "name": "Airlines & Gate Agents",
            "code": "AIR",
            "description": "Verify passenger travel documents, visas, and identity consistency before boarding.",
            "icon": "Building2",
            "color": "from-purple-600/30 to-indigo-500/20",
            "badge": "Pre-Boarding Verification"
        },
        {
            "id": "immigration",
            "name": "Immigration Officers",
            "code": "IMM",
            "description": "Perform AI-assisted border control, biometric identity comparison, and forensic screening.",
            "icon": "ShieldCheck",
            "color": "from-cyan-600/30 to-blue-500/20",
            "badge": "Border Control & Customs"
        }
    ]

@router.get("/documents/types")
def get_document_types():
    return [
        {
            "id": "passport",
            "name": "Passport",
            "category": "Travel Document",
            "description": "Extract passport biodata, validate ICAO 9303 MRZ checksums, inspect portrait area, and detect tampering.",
            "icon": "BookOpen",
            "has_mrz": True,
            "badge": "ICAO 9303 TD3"
        },
        {
            "id": "visa",
            "name": "Visa",
            "category": "Entry Permit",
            "description": "Extract visa information, validate validity windows, entry allowances, and foil integrity.",
            "icon": "FileCheck",
            "has_mrz": True,
            "badge": "Consular Foil"
        },
        {
            "id": "national_id",
            "name": "National ID Card",
            "category": "Identity Card",
            "description": "Verify identity credentials, card layout geometry, date of birth consistency, and microprint noise.",
            "icon": "CreditCard",
            "has_mrz": True,
            "badge": "ISO/IEC 7810 ID-1"
        },
        {
            "id": "driving_license",
            "name": "Driving License",
            "category": "Permit",
            "description": "Extract license classes, endorsements, expiration terms, and inspect photo tampering.",
            "icon": "Award",
            "has_mrz": False,
            "badge": "Motor Vehicle Registry"
        },
        {
            "id": "residence_permit",
            "name": "Residence Permit",
            "category": "Immigration",
            "description": "Validate resident status permits, biometrics zone, and tamper-resistant security background.",
            "icon": "FileText",
            "has_mrz": True,
            "badge": "Biometric Resident Card"
        },
        {
            "id": "travel_permit",
            "name": "Travel Permit",
            "category": "Travel Document",
            "description": "Screen emergency travel documents, refugee certificates, and border transit papers.",
            "icon": "Navigation",
            "has_mrz": False,
            "badge": "Transit Authority"
        },
        {
            "id": "other",
            "name": "Other Identity Document",
            "category": "General",
            "description": "General optical character recognition, image forensics, and tamper risk inspection.",
            "icon": "Files",
            "has_mrz": False,
            "badge": "General Credential"
        },
        {
            "id": "face_verification",
            "name": "Face Verification",
            "category": "Biometric",
            "description": "Compare a live/captured webcam face image with the face present on the identity document.",
            "icon": "ScanFace",
            "has_mrz": False,
            "badge": "1:1 Biometric Match"
        }
    ]
