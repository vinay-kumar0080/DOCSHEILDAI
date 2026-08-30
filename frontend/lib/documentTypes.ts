import { 
  BookOpen, 
  FileCheck, 
  CreditCard, 
  Award, 
  FileText, 
  Navigation, 
  Files, 
  ScanFace,
  Plane,
  Layers,
  LucideIcon,
  ShieldCheck,
  Building2,
  Car,
  Ticket
} from 'lucide-react';
import { DomainId } from '../types';

export interface DocumentConfig {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: LucideIcon;
  badge: string;
  supportedDomains: DomainId[];
  supportsMRZ: boolean;
  supportsFace: boolean;
  supportsPairVerification: boolean;
  expectedInformation: string[];
  requiredChecks: string[];
}

export const DOCUMENT_CONFIGS: Record<string, DocumentConfig> = {
  passport: {
    id: 'passport',
    name: 'Passport',
    category: 'Primary Travel Document',
    description: 'Extract passport biodata, validate ICAO 9303 MRZ checksums, inspect portrait area, and detect tampering.',
    icon: BookOpen,
    badge: 'ICAO 9303 TD3',
    supportedDomains: ['airport_security', 'airline', 'immigration', 'border_travel'],
    supportsMRZ: true,
    supportsFace: true,
    supportsPairVerification: true,
    expectedInformation: [
      'Full Name (Given names & Surname)',
      'Passport Document Number',
      'Date of Birth & Gender',
      'Nationality & Issuing Country',
      'Date of Issue & Expiry Date',
      '2-Line ICAO 9303 TD3 Machine Readable Zone (MRZ)',
      'Official Photo Portrait'
    ],
    requiredChecks: ['Quality', 'Classification', 'OCR', 'MRZ', 'Validation', 'Tampering', 'Face', 'Risk']
  },
  visa: {
    id: 'visa',
    name: 'Visa',
    category: 'Entry Authorization',
    description: 'Extract visa information, validate validity windows, entry allowances, passport cross-check, and foil integrity.',
    icon: FileCheck,
    badge: 'Consular Foil',
    supportedDomains: ['airport_security', 'airline', 'immigration', 'border_travel'],
    supportsMRZ: true,
    supportsFace: false,
    supportsPairVerification: true,
    expectedInformation: [
      'Visa Number & Control Number',
      'Visa Type / Class (e.g. B1/B2, Tourist, Business)',
      'Bearer Name & Nationality',
      'Associated Passport Number',
      'Issue Date & Expiry Date',
      'Number of Entries (Single, Double, Multiple)',
      'MRV-A or MRV-B Zone (if consular machine-readable)'
    ],
    requiredChecks: ['Quality', 'Classification', 'OCR', 'Validation', 'Tampering', 'Consistency', 'Risk']
  },
  boarding_pass: {
    id: 'boarding_pass',
    name: 'Boarding Pass',
    category: 'Flight Credential',
    description: 'Verify passenger name, flight number, departure/arrival routing, seat assignment, and barcode/text consistency.',
    icon: Navigation,
    badge: 'IATA BCBP',
    supportedDomains: ['airport_security', 'airline'],
    supportsMRZ: false,
    supportsFace: false,
    supportsPairVerification: true,
    expectedInformation: [
      'Passenger Full Name',
      'Flight Number & Airline Carrier',
      'Origin & Destination Airport IATA codes',
      'Departure Date, Time & Gate',
      'Seat Number & Boarding Group',
      'PNR / Booking Reference Code'
    ],
    requiredChecks: ['Quality', 'Classification', 'OCR', 'Validation', 'Consistency', 'Risk']
  },
  eticket: {
    id: 'eticket',
    name: 'E-Ticket / Booking Reference',
    category: 'Travel Booking Reference',
    description: 'Electronic ticket number and PNR booking reference confirmation (Reference validation only).',
    icon: Ticket,
    badge: 'Reference Record',
    supportedDomains: ['airline', 'airport_security'],
    supportsMRZ: false,
    supportsFace: false,
    supportsPairVerification: true,
    expectedInformation: [
      'Booking Reference (PNR)',
      '13-Digit E-Ticket Number',
      'Passenger Name',
      'Flight Itinerary Routing',
      'Issuing Carrier'
    ],
    requiredChecks: ['Reference Validation', 'Consistency']
  },
  national_id: {
    id: 'national_id',
    name: 'National ID Card',
    category: 'Identity Card',
    description: 'Extract identity details from physical ID-1 format cards, check microprint, OCR text alignments, and TD1 MRZ checksums.',
    icon: CreditCard,
    badge: 'ISO/IEC 7810 ID-1',
    supportedDomains: ['airport_security', 'immigration', 'border_travel'],
    supportsMRZ: true,
    supportsFace: true,
    supportsPairVerification: false,
    expectedInformation: [
      'Full Name & Identity Number (CIN/DNI/Aadhaar/SSN format)',
      'Date of Birth, Gender & Place of Birth',
      'Nationality / Country of Residence',
      'Card Validity Period (Issue & Expiry)',
      '3-Line TD1 MRZ (if standard compliant)',
      'Holder Face Portrait'
    ],
    requiredChecks: ['Quality', 'Classification', 'OCR', 'Validation', 'Tampering', 'Face', 'Risk']
  },
  residence_permit: {
    id: 'residence_permit',
    name: 'Residence Permit',
    category: 'Immigration & Stay',
    description: 'Verify residency cards, work authorizations, stay permit validity, and TD1/TD2 compliance.',
    icon: Award,
    badge: 'Residency Card',
    supportedDomains: ['immigration', 'airline', 'airport_security', 'border_travel'],
    supportsMRZ: true,
    supportsFace: true,
    supportsPairVerification: true,
    expectedInformation: [
      'Holder Name & Permit / Card Number',
      'Permit Type (Permanent, Student, Work, Refugee)',
      'Authorized Stay Expiration Date',
      'Issuing Authority & Country',
      'Associated Passport / Alien Registration Number',
      'Machine Readable Zone'
    ],
    requiredChecks: ['Quality', 'Classification', 'OCR', 'MRZ', 'Validation', 'Tampering', 'Face', 'Risk']
  },
  travel_permit: {
    id: 'travel_permit',
    name: 'Travel / Work Permit',
    category: 'Special Authorization',
    description: 'Screen cross-border emergency travel certificates, refugee travel documents, and diplomatic accreditations.',
    icon: FileText,
    badge: 'Special Permit',
    supportedDomains: ['airport_security', 'immigration', 'border_travel'],
    supportsMRZ: false,
    supportsFace: true,
    supportsPairVerification: true,
    expectedInformation: [
      'Document Title & Control Number',
      'Beneficiary Full Legal Name',
      'Authorized Travel Purpose & Route',
      'Validity Period Window',
      'Issuing Consular / Diplomatic Authority'
    ],
    requiredChecks: ['Quality', 'Classification', 'OCR', 'Validation', 'Tampering', 'Face', 'Risk']
  },
  driving_license: {
    id: 'driving_license',
    name: 'Driving License',
    category: 'Secondary Identity',
    description: 'Screen driver licenses as supporting secondary identity evidence, inspecting photo integrity and text.',
    icon: Car,
    badge: 'Secondary ID',
    supportedDomains: ['border_travel', 'airport_security'],
    supportsMRZ: false,
    supportsFace: true,
    supportsPairVerification: true,
    expectedInformation: [
      'License Holder Full Name',
      'License Number & Class',
      'Date of Birth & Address',
      'Issue & Expiration Dates',
      'Driver Photo'
    ],
    requiredChecks: ['Quality', 'Classification', 'OCR', 'Validation', 'Tampering', 'Face', 'Risk']
  },
  compare_documents: {
    id: 'compare_documents',
    name: 'Compare Documents (Cross-Verification)',
    category: 'Document Pair Matching',
    description: 'Upload two documents (e.g. Passport + Visa, or Passport + Boarding Pass) to cross-verify biodata consistency.',
    icon: Files,
    badge: 'Dual Verification',
    supportedDomains: ['airport_security', 'airline', 'immigration', 'border_travel'],
    supportsMRZ: true,
    supportsFace: true,
    supportsPairVerification: true,
    expectedInformation: [
      'Primary Document (e.g., Passport)',
      'Secondary Document (e.g., Visa, Boarding Pass, Residence Permit)',
      'Cross-Document Name, Number, and Date Correlation',
      'Biometric & Physical Attribute Alignment'
    ],
    requiredChecks: ['Quality', 'OCR', 'Validation', 'Consistency', 'Tampering', 'Risk']
  },
  face_verification: {
    id: 'face_verification',
    name: '1:1 Biometric Face Match',
    category: 'Biometric Correlation',
    description: 'Compare document portrait photo with live webcam selfie using deep facial embedding vector distance.',
    icon: ScanFace,
    badge: 'Biometric Match',
    supportedDomains: ['airport_security', 'airline', 'immigration', 'border_travel'],
    supportsMRZ: false,
    supportsFace: true,
    supportsPairVerification: false,
    expectedInformation: [
      'Document Cropped Portrait Photo',
      'Live Webcam Captured Face Frame',
      '128-dimensional Deep Embedding Correlation',
      'Facial Landmark Symmetrical Alignment'
    ],
    requiredChecks: ['Face Detection', 'Embedding Extraction', 'Cosine Similarity', 'Confidence Assessment']
  }
};

export const DOMAIN_DETAILS = {
  airport_security: {
    title: 'Airport Security Authorities',
    subtitle: 'Screen passenger identity and travel documents for potential fraud, manipulation, and identity inconsistencies.',
    code: 'ASA-TERMINAL',
    badge: 'Terminal Checkpoint',
    icon: Plane,
    primaryDocs: ['passport', 'boarding_pass', 'visa', 'residence_permit', 'face_verification', 'compare_documents']
  },
  airline: {
    title: 'Airlines & Gate Agents',
    subtitle: 'Passenger travel document, e-ticket, and boarding authorization verification.',
    code: 'AIR-BOARDING',
    badge: 'Pre-Boarding & Check-in',
    icon: Building2,
    primaryDocs: ['eticket', 'passport', 'visa', 'boarding_pass', 'residence_permit', 'face_verification']
  },
  immigration: {
    title: 'Immigration & Border Control',
    subtitle: 'Perform comprehensive identity and travel-document screening for border entry and residency verification.',
    code: 'IMM-BORDER',
    badge: 'Border Entry Control',
    icon: ShieldCheck,
    primaryDocs: ['passport', 'visa', 'national_id', 'residence_permit', 'travel_permit', 'compare_documents', 'face_verification']
  },
  border_travel: {
    title: 'Border & Travel Screening',
    subtitle: 'Screen cross-border travel documents, visas, and permits with multi-modal forensic inspection.',
    code: 'BOR-TRAVEL',
    badge: 'Cross-Border Checkpoint',
    icon: ShieldCheck,
    primaryDocs: ['passport', 'visa', 'travel_permit', 'residence_permit', 'national_id', 'driving_license', 'face_verification']
  }
};
