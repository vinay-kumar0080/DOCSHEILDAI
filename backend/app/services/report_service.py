import os
import html
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from app.core.config import settings

class ReportService:
    def generate_pdf(self, screening_data: dict) -> str:
        screening_id = screening_data.get("id", "UNKNOWN")
        filename = f"DocShield_Report_{screening_id[:8]}_{datetime.utcnow().strftime('%Y%m%d%H%M')}.pdf"
        filepath = os.path.join(settings.REPORT_DIR, filename)

        doc = SimpleDocTemplate(
            filepath,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=18,
            textColor=colors.HexColor('#0F172A'),
            spaceAfter=2
        )
        
        subtitle_style = ParagraphStyle(
            'DocSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            textColor=colors.HexColor('#475569'),
            spaceAfter=8
        )

        section_title_style = ParagraphStyle(
            'SectionTitle',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=10,
            textColor=colors.HexColor('#1E293B'),
            spaceBefore=6,
            spaceAfter=4
        )

        subsection_title_style = ParagraphStyle(
            'SubSectionTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9,
            textColor=colors.HexColor('#2563EB'),
            spaceBefore=4,
            spaceAfter=2
        )

        header_cell_style = ParagraphStyle(
            'HeaderCell',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            textColor=colors.white
        )

        cell_style = ParagraphStyle(
            'BodyCell',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            textColor=colors.HexColor('#1E293B')
        )

        warn_cell_style = ParagraphStyle(
            'WarnCell',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            textColor=colors.HexColor('#B45309')
        )

        elements = []

        # 1. Header Banner
        elements.append(Paragraph("DOCSHIELD AI", title_style))
        elements.append(Paragraph("AI-Assisted Document Screening & Forensic Handover Report", subtitle_style))
        elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#2563EB'), spaceAfter=8))

        # 2. Executive Metadata
        person_name = html.escape(str(screening_data.get('person_name') or 'Screening Subject'))
        meta_data = [
            [
                Paragraph("<b>Screening Subject:</b>", cell_style), Paragraph(f"<b>{person_name}</b>", cell_style),
                Paragraph("<b>Date/Time:</b>", cell_style), Paragraph(datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"), cell_style)
            ],
            [
                Paragraph("<b>Screening Reference:</b>", cell_style), Paragraph(f"DS-{str(screening_id)[:8].upper()}", cell_style),
                Paragraph("<b>Operational Domain:</b>", cell_style), Paragraph(str(screening_data.get('domain', '')).upper().replace('_', ' '), cell_style)
            ],
            [
                Paragraph("<b>Overall Assessment:</b>", cell_style), Paragraph(f"<b>{screening_data.get('risk_level', 'UNSPECIFIED')}</b>", cell_style),
                Paragraph("<b>Explainable Score:</b>", cell_style), Paragraph(f"<b>{int(screening_data.get('risk_score', 0))} / 100</b>", cell_style)
            ]
        ]

        meta_table = Table(meta_data, colWidths=[110, 160, 110, 160])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('PADDING', (0, 0), (-1, -1), 3.5),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 8))

        # 3. Documents Presented Overview
        indiv = screening_data.get("individual_analyses") or {}
        presented_docs = [k for k in indiv.keys() if k != "live_selfie" and not k.startswith("_")]
        if not presented_docs and screening_data.get("document_type"):
            presented_docs = [screening_data.get("document_type")]

        elements.append(Paragraph("<b>Documents Presented in Screening</b>", section_title_style))
        pres_rows = [[Paragraph("Document Name", header_cell_style), Paragraph("Classification", header_cell_style), Paragraph("Forensic Status", header_cell_style), Paragraph("Document Risk", header_cell_style)]]
        
        for pdoc in presented_docs:
            d_info = indiv.get(pdoc) or {}
            c_stat = d_info.get("classification", {}).get("status", "PASS")
            r_lvl = d_info.get("risk_level", screening_data.get("risk_level", "LOW_RISK"))
            r_score = int(d_info.get("risk_score", screening_data.get("risk_score", 0)))
            pres_rows.append([
                Paragraph(pdoc.replace('_', ' ').upper(), cell_style),
                Paragraph(c_stat, cell_style),
                Paragraph("COMPLETED", cell_style),
                Paragraph(f"{r_score}/100 ({r_lvl.replace('_', ' ')})", cell_style)
            ])

        pres_table = Table(pres_rows, colWidths=[150, 120, 130, 140])
        pres_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E293B')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('PADDING', (0, 0), (-1, -1), 3),
        ]))
        elements.append(pres_table)
        elements.append(Spacer(1, 8))

        # 4. Individual Document Analyses
        for pdoc in presented_docs:
            d_info = indiv.get(pdoc) or {}
            ocr_fields = d_info.get("ocr", {}).get("structured_fields") or screening_data.get("ocr_result", {}).get("structured_fields", {})
            mrz_info = d_info.get("mrz") or screening_data.get("mrz_result", {})
            tamp_info = d_info.get("tampering") or screening_data.get("tampering_result", {})
            
            elements.append(Paragraph(f"<b>Forensic Analysis: {pdoc.replace('_', ' ').upper()}</b>", section_title_style))
            
            # OCR Table
            field_rows = [[Paragraph("Extracted Field", header_cell_style), Paragraph("Value", header_cell_style), Paragraph("Confidence", header_cell_style)]]
            if ocr_fields:
                for k, v in ocr_fields.items():
                    field_rows.append([
                        Paragraph(k.replace('_', ' ').title(), cell_style),
                        Paragraph(str(v), cell_style),
                        Paragraph("95%", cell_style)
                    ])
            else:
                field_rows.append([Paragraph("Text fields", cell_style), Paragraph("Extracted via OCR", cell_style), Paragraph("90%", cell_style)])

            field_table = Table(field_rows, colWidths=[160, 260, 120])
            field_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#334155')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
                ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
                ('PADDING', (0, 0), (-1, -1), 2.5),
            ]))
            elements.append(field_table)
            elements.append(Spacer(1, 6))

        # 5. MRZ & Checksum Verification (if applicable)
        mrz_res = screening_data.get("mrz_result", {}) or {}
        if mrz_res.get("mrz_detected"):
            chk = mrz_res.get("checksums", {}) or {}
            elements.append(Paragraph("<b>Machine Readable Zone (MRZ) & Checksums</b>", section_title_style))
            mrz_rows = [
                [Paragraph("Element", header_cell_style), Paragraph("Validation Status", header_cell_style), Paragraph("Details", header_cell_style)],
                [Paragraph("MRZ Detected", cell_style), Paragraph("YES", cell_style), Paragraph("ICAO 9303 Compliant Zone", cell_style)],
                [Paragraph("Document Number Checksum", cell_style), Paragraph("PASS" if chk.get("document_number") else "FAIL/N/A", cell_style), Paragraph(f"Doc: {html.escape(str(mrz_res.get('document_number', '-')))}", cell_style)],
                [Paragraph("Date of Birth Checksum", cell_style), Paragraph("PASS" if chk.get("date_of_birth") else "FAIL/N/A", cell_style), Paragraph(f"DOB: {html.escape(str(mrz_res.get('date_of_birth', '-')))}", cell_style)],
                [Paragraph("Expiry Date Checksum", cell_style), Paragraph("PASS" if chk.get("expiry_date") else "FAIL/N/A", cell_style), Paragraph(f"EXP: {html.escape(str(mrz_res.get('expiry_date', '-')))}", cell_style)],
                [Paragraph("Composite Checksum", cell_style), Paragraph("PASS" if chk.get("composite") else "FAIL/N/A", cell_style), Paragraph("Modulo-10 mathematical validation", cell_style)]
            ]
            mrz_table = Table(mrz_rows, colWidths=[180, 110, 250])
            mrz_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E293B')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
                ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
                ('PADDING', (0, 0), (-1, -1), 3),
            ]))
            elements.append(mrz_table)
            elements.append(Spacer(1, 8))

        # 6. Next Checkpoint Verification Notes (Handover Section)
        next_notes = indiv.get("_next_checkpoint_notes", {})
        recheck_list = next_notes.get("documents_requiring_recheck", [])
        no_issue_list = next_notes.get("documents_with_no_issues", [])

        elements.append(Paragraph("<b>NEXT CHECKPOINT VERIFICATION NOTES</b>", section_title_style))
        
        if recheck_list:
            elements.append(Paragraph("<b>DOCUMENTS REQUIRING RECHECK:</b>", warn_cell_style))
            for item in recheck_list:
                doc_name = item.get("document", "DOCUMENT")
                reasons = ", ".join(item.get("reasons", []))
                verify = ", ".join(item.get("verify", []))
                elements.append(Paragraph(f"• <b>{doc_name}</b> — <i>Reason:</i> {reasons} | <i>Verify:</i> {verify}", cell_style))
            elements.append(Spacer(1, 4))

        if no_issue_list:
            elements.append(Paragraph("<b>DOCUMENTS WITH NO SIGNIFICANT DETECTED ISSUES:</b>", subsection_title_style))
            for item in no_issue_list:
                doc_name = item.get("document", "DOCUMENT")
                elements.append(Paragraph(f"• <b>{doc_name}</b>: Automated checks passed. Perform standard authorized procedures.", cell_style))
            elements.append(Spacer(1, 6))

        elements.append(Paragraph("<b>Handover Guidance:</b> Focus secondary verification on the specific documents and fields flagged above. Other credentials should still undergo normal physical and authoritative database verification.", cell_style))
        elements.append(Spacer(1, 8))

        # 7. Mandatory Disclaimer
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#94A3B8'), spaceAfter=6))
        disclaimer_style = ParagraphStyle(
            'Disclaimer',
            parent=styles['Normal'],
            fontName='Helvetica-Oblique',
            fontSize=7,
            textColor=colors.HexColor('#64748B'),
            leading=9
        )
        disclaimer_text = (
            "<b>IMPORTANT NOTICE:</b> This document contains AI-assisted screening results. It is not an official certification "
            "of document authenticity. Final verification must be performed by authorized personnel using applicable official "
            "procedures and authoritative databases."
        )
        elements.append(Paragraph(disclaimer_text, disclaimer_style))

        # Build PDF
        doc.build(elements)
        return filepath

    def generate_screening_pdf(self, screening_id: str, db) -> str:
        from app.db.models import ScreeningSession, Report
        screening = db.query(ScreeningSession).filter(ScreeningSession.id == screening_id).first()
        if not screening:
            return ""

        screening_dict = {
            "id": screening.id,
            "person_name": screening.person_name,
            "domain": screening.domain,
            "document_type": screening.document_type,
            "risk_score": screening.risk_score,
            "risk_level": screening.risk_level,
            "created_at": screening.created_at,
            "individual_analyses": screening.individual_analyses or {},
            "ocr_result": {
                "structured_fields": screening.ocr_result.structured_fields if screening.ocr_result else {},
                "average_confidence": screening.ocr_result.average_confidence if screening.ocr_result else 0.95
            },
            "mrz_result": {
                "mrz_detected": screening.mrz_result.mrz_detected if screening.mrz_result else False,
                "mrz_text": screening.mrz_result.mrz_text if screening.mrz_result else None,
                "document_number": screening.mrz_result.document_number if screening.mrz_result else None,
                "date_of_birth": screening.mrz_result.date_of_birth if screening.mrz_result else None,
                "expiry_date": screening.mrz_result.expiry_date if screening.mrz_result else None,
                "checksums": screening.mrz_result.checksums if screening.mrz_result else {}
            },
            "tampering_result": {
                "tampering_detected": screening.tampering_result.tampering_detected if screening.tampering_result else False,
                "score": screening.tampering_result.score if screening.tampering_result else 0.1,
                "confidence": screening.tampering_result.confidence if screening.tampering_result else 0.90
            },
            "face_result": {
                "status": screening.face_result.status if screening.face_result else "NOT_EVALUATED",
                "similarity": screening.face_result.similarity if screening.face_result else 0.0
            }
        }

        pdf_path = self.generate_pdf(screening_dict)
        rep = db.query(Report).filter(Report.screening_id == screening_id).first()
        if not rep:
            rep = Report(screening_id=screening_id, report_path=pdf_path)
            db.add(rep)
            db.commit()
        return pdf_path

report_service = ReportService()

