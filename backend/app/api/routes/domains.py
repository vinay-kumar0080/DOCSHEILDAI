from fastapi import APIRouter, HTTPException
from app.core.domains_config import CANONICAL_DOMAINS, get_domain_config

router = APIRouter(tags=["Domains & Document Types"])

@router.get("/domains")
def get_domains():
    return CANONICAL_DOMAINS

@router.get("/domains/{domain_id}")
def get_domain(domain_id: str):
    return get_domain_config(domain_id)

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
            "id": "boarding_pass",
            "name": "Boarding Pass",
            "category": "Flight Credential",
            "description": "Verify passenger name, flight number, routing, seat, and barcode/text alignment.",
            "icon": "Navigation",
            "has_mrz": False,
            "badge": "IATA BCBP"
        },
        {
            "id": "eticket",
            "name": "E-Ticket",
            "category": "Travel Booking Reference",
            "description": "Verify passenger name, booking reference (PNR), flight, origin, destination, and travel dates.",
            "icon": "Ticket",
            "has_mrz": False,
            "badge": "Reservation Record"
        },
        {
            "id": "national_id",
            "name": "National Identity Card",
            "category": "Identity Card",
            "description": "Verify identity credentials, card layout geometry, date of birth consistency, and microprint noise.",
            "icon": "CreditCard",
            "has_mrz": True,
            "badge": "ISO/IEC 7810 ID-1"
        },
        {
            "id": "residence_permit",
            "name": "Residence Permit",
            "category": "Immigration",
            "description": "Validate resident status permits, biometrics zone, issuing authority, and validity dates.",
            "icon": "Award",
            "has_mrz": True,
            "badge": "Resident Card"
        },
        {
            "id": "work_permit",
            "name": "Work Permit",
            "category": "Employment Authorization",
            "description": "Verify employment authorization permits, validity windows, and issuing authorities.",
            "icon": "FileText",
            "has_mrz": False,
            "badge": "Employment Auth"
        },
        {
            "id": "travel_authorization",
            "name": "Travel Authorization",
            "category": "Travel Clearance",
            "description": "Screen ESTA/ETA pre-clearance certificates, border authorizations, and transit permits.",
            "icon": "CheckCircle2",
            "has_mrz": False,
            "badge": "Pre-Clearance"
        },
        {
            "id": "driving_license",
            "name": "Driving License",
            "category": "Permit",
            "description": "Extract license classes, endorsements, expiration terms, and inspect photo tampering.",
            "icon": "Car",
            "has_mrz": False,
            "badge": "Motor Vehicle Registry"
        },
        {
            "id": "travel_permit",
            "name": "Travel Permit",
            "category": "Special Document",
            "description": "Screen emergency travel documents, refugee certificates, and border transit papers.",
            "icon": "Navigation",
            "has_mrz": False,
            "badge": "Transit Authority"
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
