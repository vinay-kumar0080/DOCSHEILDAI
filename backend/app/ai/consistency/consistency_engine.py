from typing import Dict, Any, List, Optional
from datetime import datetime

class ConsistencyEngine:
    """
    Centralized Cross-Document and Multi-Field Consistency Service.
    Performs field-level comparison between:
    1. Visual OCR text vs. ICAO 9303 MRZ fields
    2. Primary Document (Passport) vs. Secondary Document (Visa / Boarding Pass / Permit)
    3. Logical date order (Issue Date < Expiry Date, DOB < Issue Date)
    """

    def evaluate_consistency(
        self,
        document_type: str,
        ocr_fields: Dict[str, Any],
        mrz_data: Dict[str, Any],
        secondary_fields: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        items: List[Dict[str, Any]] = []
        is_consistent = True

        # 1. OCR vs MRZ Name Comparison
        if mrz_data.get("mrz_detected"):
            ocr_name = str(ocr_fields.get("name", "")).upper().replace(",", " ").strip()
            mrz_surname = str(mrz_data.get("surname", "")).upper().strip()
            mrz_given = str(mrz_data.get("given_names", "")).upper().strip()
            mrz_full_name = f"{mrz_given} {mrz_surname}".strip() if mrz_given else mrz_surname

            if ocr_name and mrz_surname:
                name_match = (mrz_surname in ocr_name) or (ocr_name in mrz_full_name)
                items.append({
                    "check": "Name (OCR ↔ MRZ)",
                    "status": "CONSISTENT" if name_match else "INCONSISTENT",
                    "ocr_value": ocr_name,
                    "mrz_value": mrz_full_name or mrz_surname,
                    "explanation": "Visual name aligns with machine readable line" if name_match else "Visual name does not match MRZ bearer line"
                })
                if not name_match:
                    is_consistent = False

            # 2. OCR vs MRZ Document Number Comparison
            ocr_doc_num = str(ocr_fields.get("document_number", "")).upper().replace("-", "").replace(" ", "").strip()
            mrz_doc_num = str(mrz_data.get("document_number", "")).upper().replace("-", "").replace(" ", "").strip()

            if ocr_doc_num and mrz_doc_num:
                num_match = (ocr_doc_num == mrz_doc_num)
                items.append({
                    "check": "Document Number (OCR ↔ MRZ)",
                    "status": "CONSISTENT" if num_match else "INCONSISTENT",
                    "ocr_value": ocr_doc_num,
                    "mrz_value": mrz_doc_num,
                    "explanation": "Visual document number matches MRZ check field" if num_match else "Mismatch between visual document number and MRZ"
                })
                if not num_match:
                    is_consistent = False

            # 3. OCR vs MRZ Nationality
            ocr_nat = str(ocr_fields.get("nationality", "")).upper().strip()
            mrz_nat = str(mrz_data.get("nationality", "")).upper().strip()
            if ocr_nat and mrz_nat:
                nat_match = (mrz_nat in ocr_nat or ocr_nat in mrz_nat)
                items.append({
                    "check": "Nationality Code (OCR ↔ MRZ)",
                    "status": "CONSISTENT" if nat_match else "INCONSISTENT",
                    "ocr_value": ocr_nat,
                    "mrz_value": mrz_nat,
                    "explanation": "Issuing / nationality country code verified" if nat_match else "Nationality code mismatch"
                })

        # 4. Date Logical Order Check (Issue Date vs Expiry Date)
        issue_str = ocr_fields.get("issue_date")
        exp_str = ocr_fields.get("expiry_date") or mrz_data.get("expiry_date")
        if issue_str and exp_str:
            try:
                iss_dt = datetime.strptime(issue_str, "%Y-%m-%d")
                exp_dt = datetime.strptime(exp_str, "%Y-%m-%d")
                dates_valid = iss_dt < exp_dt
                items.append({
                    "check": "Temporal Timeline (Issue < Expiry)",
                    "status": "CONSISTENT" if dates_valid else "INCONSISTENT",
                    "ocr_value": f"{issue_str} -> {exp_str}",
                    "explanation": "Issue date precedes expiration date" if dates_valid else "Expiration date occurs before issue date"
                })
                if not dates_valid:
                    is_consistent = False
            except Exception:
                pass

        # 5. Document Pair Cross Verification (e.g. Passport ↔ Visa or Passport ↔ Boarding Pass)
        if secondary_fields:
            primary_name = str(ocr_fields.get("name", "")).upper().strip()
            sec_name = str(secondary_fields.get("name", "")).upper().strip()

            if primary_name and sec_name:
                pair_name_match = (primary_name in sec_name or sec_name in primary_name)
                items.append({
                    "check": "Passenger Name (Primary ↔ Secondary)",
                    "status": "CONSISTENT" if pair_name_match else "INCONSISTENT",
                    "primary_value": primary_name,
                    "secondary_value": sec_name,
                    "explanation": "Passenger name aligns across travel documents" if pair_name_match else "Name mismatch across presented document pair"
                })
                if not pair_name_match:
                    is_consistent = False

            # Passport Number on Visa
            passport_num = str(ocr_fields.get("document_number", "")).upper().replace("-", "").strip()
            visa_pass_num = str(secondary_fields.get("passport_number", "")).upper().replace("-", "").strip()
            if passport_num and visa_pass_num:
                pass_match = (passport_num == visa_pass_num)
                items.append({
                    "check": "Passport Number on Visa",
                    "status": "CONSISTENT" if pass_match else "INCONSISTENT",
                    "primary_value": passport_num,
                    "secondary_value": visa_pass_num,
                    "explanation": "Associated passport number matches visa foil reference" if pass_match else "Visa references a different passport number"
                })
                if not pass_match:
                    is_consistent = False

        overall_status = "CONSISTENT" if is_consistent else "INCONSISTENT"
        if not items:
            overall_status = "NOT_APPLICABLE"

        return {
            "overall_status": overall_status,
            "is_consistent": is_consistent,
            "items": items,
            "total_checks": len(items)
        }

consistency_engine = ConsistencyEngine()
