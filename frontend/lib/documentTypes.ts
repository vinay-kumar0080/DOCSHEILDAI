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
    supportedDomains: ['immigration_officers', 'border_security', 'airport_security', 'immigration_departments', 'law_enforcement', 'airline', 'immigration', 'border_travel'],
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
    supportedDomains: ['immigration_officers', 'border_security', 'airport_security', 'immigration_departments', 'airline', 'immigration', 'border_travel'],
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
    badge: 'Reservation Record',
    supportedDomains: ['airport_security', 'airline'],
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
    name: 'National Identity Card',
    category: 'Identity Card',
    description: 'Extract identity details from physical ID-1 format cards, check microprint, OCR text alignments, and TD1 MRZ checksums.',
    icon: CreditCard,
    badge: 'ISO/IEC 7810 ID-1',
    supportedDomains: ['immigration_officers', 'border_security', 'airport_security', 'immigration_departments', 'law_enforcement', 'immigration', 'border_travel'],
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
    description: 'Verify residency cards, stay permit validity, and TD1/TD2 compliance.',
    icon: Award,
    badge: 'Resident Card',
    supportedDomains: ['immigration_officers', 'border_security', 'immigration_departments', 'law_enforcement', 'airport_security', 'airline', 'immigration', 'border_travel'],
    supportsMRZ: true,
    supportsFace: true,
    supportsPairVerification: true,
    expectedInformation: [
      'Holder Name & Permit / Card Number',
      'Permit Type (Permanent, Student, Refugee)',
      'Authorized Stay Expiration Date',
      'Issuing Authority & Country',
      'Associated Passport / Alien Registration Number',
      'Machine Readable Zone'
    ],
    requiredChecks: ['Quality', 'Classification', 'OCR', 'MRZ', 'Validation', 'Tampering', 'Face', 'Risk']
  },
  work_permit: {
    id: 'work_permit',
    name: 'Work Permit',
    category: 'Employment Authorization',
    description: 'Verify work authorizations, employment permit cards, and employer authorization validity.',
    icon: FileText,
    badge: 'Work Authorization',
    supportedDomains: ['immigration_officers', 'immigration_departments', 'law_enforcement'],
    supportsMRZ: false,
    supportsFace: true,
    supportsPairVerification: true,
    expectedInformation: [
      'Worker Legal Name',
      'Employment Authorization Number',
      'Issuing Ministry / Department',
      'Authorized Employment Category',
      'Validity Window (Issue & Expiry Dates)'
    ],
    requiredChecks: ['Quality', 'Classification', 'OCR', 'Validation', 'Tampering', 'Face', 'Risk']
  },
  travel_authorization: {
    id: 'travel_authorization',
    name: 'Travel Authorization',
    category: 'Travel Clearance',
    description: 'Screen electronic travel authorizations (ESTA, ETA, e-Visa pre-clearance certificates).',
    icon: ShieldCheck,
    badge: 'Pre-Clearance',
    supportedDomains: ['immigration_officers', 'border_security', 'airport_security', 'immigration_departments'],
    supportsMRZ: false,
    supportsFace: false,
    supportsPairVerification: true,
    expectedInformation: [
      'Authorization Reference Number',
      'Traveler Full Legal Name',
      'Passport Number Reference',
      'Approved Travel Dates Window',
      'Issuing Government Portal'
    ],
    requiredChecks: ['Quality', 'Classification', 'OCR', 'Validation', 'Consistency', 'Risk']
  },
  driving_license: {
    id: 'driving_license',
    name: 'Driving Licence',
    category: 'Identity & Operating Permit',
    description: 'Screen driver licenses as supporting secondary identity evidence, inspecting photo integrity and text.',
    icon: Car,
    badge: 'Driving Licence',
    supportedDomains: ['law_enforcement', 'border_security', 'border_travel'],
    supportsMRZ: false,
    supportsFace: true,
    supportsPairVerification: true,
    expectedInformation: [
      'License Holder Full Name',
      'License Number & Vehicle Class',
      'Date of Birth & Address',
      'Issue & Expiration Dates',
      'Driver Photo'
    ],
    requiredChecks: ['Quality', 'Classification', 'OCR', 'Validation', 'Tampering', 'Face', 'Risk']
  },
  travel_permit: {
    id: 'travel_permit',
    name: 'Travel Document / Permit',
    category: 'Special Authorization',
    description: 'Screen cross-border emergency travel certificates, refugee travel documents, and diplomatic accreditations.',
    icon: Navigation,
    badge: 'Special Permit',
    supportedDomains: ['border_security', 'law_enforcement', 'border_travel', 'airport_security', 'immigration'],
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
  face_verification: {
    id: 'face_verification',
    name: '1:1 Biometric Face Match',
    category: 'Biometric Correlation',
    description: 'Compare document portrait photo with live webcam selfie using deep facial embedding vector distance.',
    icon: ScanFace,
    badge: 'Biometric Match',
    supportedDomains: ['immigration_officers', 'border_security', 'airport_security', 'immigration_departments', 'law_enforcement', 'airline', 'immigration', 'border_travel'],
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

export const DOMAIN_DETAILS: Record<string, any> = {
  immigration_officers: {
    id: 'immigration_officers',
    title: 'Immigration Officers',
    name: 'Immigration Officers',
    subtitle: 'Passport control, visa verification, residence permit and work permit inspection.',
    code: 'IMM-OFFICER',
    badge: 'Border Control & Customs',
    icon: ShieldCheck,
    documents: ['passport', 'visa', 'residence_permit', 'work_permit', 'travel_authorization', 'national_id'],
    primaryDocs: ['passport', 'visa', 'residence_permit', 'work_permit', 'travel_authorization', 'national_id']
  },
  border_security: {
    id: 'border_security',
    title: 'Border-Security Personnel',
    name: 'Border-Security Personnel',
    subtitle: 'Screen cross-border credentials, visas, national IDs, and border travel permits.',
    code: 'BOR-SECURITY',
    badge: 'Border Checkpoint',
    icon: ShieldCheck,
    documents: ['passport', 'visa', 'national_id', 'residence_permit', 'travel_permit', 'travel_authorization'],
    primaryDocs: ['passport', 'visa', 'national_id', 'residence_permit', 'travel_permit', 'travel_authorization']
  },
  airport_security: {
    id: 'airport_security',
    title: 'Airport Security Authorities',
    name: 'Airport Security Authorities',
    subtitle: 'Screen passenger identity documents, boarding passes, visas, and e-tickets.',
    code: 'ASA-TERMINAL',
    badge: 'Terminal Checkpoint',
    icon: Plane,
    documents: ['passport', 'boarding_pass', 'visa', 'eticket', 'national_id', 'travel_authorization'],
    primaryDocs: ['passport', 'boarding_pass', 'visa', 'eticket', 'national_id', 'travel_authorization']
  },
  immigration_departments: {
    id: 'immigration_departments',
    title: 'Immigration Departments',
    name: 'Immigration Departments',
    subtitle: 'Evaluate visa applications, residence permits, work permits, and travel authorizations.',
    code: 'IMM-DEPT',
    badge: 'Departmental Screening',
    icon: Building2,
    documents: ['passport', 'visa', 'residence_permit', 'work_permit', 'national_id', 'travel_authorization'],
    primaryDocs: ['passport', 'visa', 'residence_permit', 'work_permit', 'national_id', 'travel_authorization']
  },
  law_enforcement: {
    id: 'law_enforcement',
    title: 'Law-Enforcement Agencies',
    name: 'Law-Enforcement Agencies',
    subtitle: 'Screen national IDs, driving licences, passports, and travel credentials.',
    code: 'LEA-PATROL',
    badge: 'Law Enforcement Command',
    icon: ShieldCheck,
    documents: ['passport', 'national_id', 'driving_license', 'residence_permit', 'work_permit', 'travel_permit'],
    primaryDocs: ['passport', 'national_id', 'driving_license', 'residence_permit', 'work_permit', 'travel_permit']
  },
  // Compatibility aliases
  airline: {
    id: 'airport_security',
    title: 'Airport Security Authorities',
    name: 'Airport Security Authorities',
    subtitle: 'Screen passenger credentials, boarding passes, visas, and e-tickets.',
    code: 'ASA-TERMINAL',
    badge: 'Terminal Checkpoint',
    icon: Plane,
    documents: ['passport', 'boarding_pass', 'visa', 'eticket', 'national_id', 'travel_authorization'],
    primaryDocs: ['passport', 'boarding_pass', 'visa', 'eticket', 'national_id', 'travel_authorization']
  },
  immigration: {
    id: 'immigration_officers',
    title: 'Immigration Officers',
    name: 'Immigration Officers',
    subtitle: 'Passport control, visa verification, residence permit and work permit inspection.',
    code: 'IMM-OFFICER',
    badge: 'Border Control & Customs',
    icon: ShieldCheck,
    documents: ['passport', 'visa', 'residence_permit', 'work_permit', 'travel_authorization', 'national_id'],
    primaryDocs: ['passport', 'visa', 'residence_permit', 'work_permit', 'travel_authorization', 'national_id']
  },
  border_travel: {
    id: 'border_security',
    title: 'Border-Security Personnel',
    name: 'Border-Security Personnel',
    subtitle: 'Screen cross-border credentials, visas, national IDs, and border travel permits.',
    code: 'BOR-SECURITY',
    badge: 'Border Checkpoint',
    icon: ShieldCheck,
    documents: ['passport', 'visa', 'national_id', 'residence_permit', 'travel_permit', 'travel_authorization'],
    primaryDocs: ['passport', 'visa', 'national_id', 'residence_permit', 'travel_permit', 'travel_authorization']
  }
};
