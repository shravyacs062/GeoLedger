"""Lightweight document field extraction.

Uses optional OCR libraries when available; otherwise performs heuristic
text extraction from plain-text / simple PDF-like uploads for demo validation.
"""

import re
from datetime import datetime
from io import BytesIO


FIELD_PATTERNS = {
    "owner_name": [
        re.compile(r"(?:owner|proprietor|name of owner)\s*[:\-]\s*(.+)", re.I),
        re.compile(r"(?:applicant|heir)\s*[:\-]\s*(.+)", re.I),
        re.compile(r"(?:full\s+name|name)\s*[:\-]\s*(.+)", re.I),
    ],
    "survey_number": [
        re.compile(r"(?:survey\s*(?:no|number|#)?)\s*[:\-]?\s*(SN-?[A-Z0-9\-]+)", re.I),
        re.compile(r"\b(SN-[A-Z0-9\-]+)\b", re.I),
    ],
    "property_id": [
        re.compile(r"(?:property\s*(?:id|number)?)\s*[:\-]?\s*(GL-PROP-[A-Z0-9\-]+)", re.I),
        re.compile(r"\b(GL-PROP-[A-Z0-9\-]+)\b", re.I),
    ],
    "land_area": [
        re.compile(r"(?:area|extent)\s*[:\-]?\s*([\d,\.]+\s*(?:sq\.?\s*(?:ft|m)|acres?))", re.I),
        re.compile(r"([\d,\.]+)\s*(?:sq\.?\s*(?:ft|m2?|metres?))", re.I),
    ],
    "document_number": [
        re.compile(r"(?:document|deed|certificate|reg(?:istration)?)\s*(?:no|number|#)\s*[:\-]?\s*([A-Z0-9\-\/]+)", re.I),
    ],
    "issue_date": [
        re.compile(r"(?:date|issued\s*on|dated)\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})", re.I),
    ],
    "issuing_authority": [
        re.compile(r"(?:issued\s*by|authority|registrar)\s*[:\-]?\s*(.+)", re.I),
    ],
    "legal_heir_names": [
        re.compile(r"(?:legal\s*heir(?:s)?|heirs?)\s*[:\-]?\s*(.+)", re.I),
    ],
}


class OCRService:
    def extract_from_bytes(self, file_bytes: bytes, filename: str = "", document_type: str = "") -> dict:
        text = self._bytes_to_text(file_bytes, filename)
        extracted = {}
        for field, patterns in FIELD_PATTERNS.items():
            for pattern in patterns:
                match = pattern.search(text or "")
                if match:
                    extracted[field] = match.group(1).strip()[:200]
                    break

        # Seed sensible defaults from document type for demo continuity
        if document_type and not extracted:
            extracted["document_type_hint"] = document_type

        return {
            "extracted_fields": extracted,
            "raw_text_preview": (text or "")[:500],
            "extraction_method": "heuristic" if text else "unavailable",
            "extracted_at": datetime.utcnow().isoformat(),
            "confidence": 0.7 if extracted else 0.2,
        }

    def _bytes_to_text(self, file_bytes: bytes, filename: str) -> str:
        if not file_bytes:
            return ""

        # Plain text / pseudo documents used in tests
        try:
            text = file_bytes.decode("utf-8")
            if text.isprintable() or "\n" in text:
                return text
        except UnicodeDecodeError:
            pass

        # Best-effort PDF text scrape without heavy deps
        lower = (filename or "").lower()
        if lower.endswith(".pdf") or file_bytes[:4] == b"%PDF":
            try:
                from pypdf import PdfReader
                from pypdf.errors import PdfReadError
            except ImportError:
                pass
            else:
                try:
                    extracted_text = "\n".join(
                        page.extract_text() or ""
                        for page in PdfReader(BytesIO(file_bytes)).pages
                    )
                    if extracted_text.strip():
                        return extracted_text
                except (PdfReadError, OSError, ValueError):
                    pass
            try:
                # Extract PDF literal text strings, then fall back to readable byte runs.
                strings = re.findall(rb"\(((?:\\.|[^\\)])*)\)\s*Tj", file_bytes)
                if strings:
                    return "\n".join(
                        re.sub(rb"\\([\\()])", rb"\1", value).decode("latin-1", errors="ignore")
                        for value in strings
                    )
                chunks = re.findall(rb"[\x20-\x7E]{4,}", file_bytes)
                return " ".join(c.decode("ascii", errors="ignore") for c in chunks[:200])
            except Exception:
                return ""

        # Optional pytesseract path for images
        if lower.endswith((".png", ".jpg", ".jpeg")):
            try:
                from PIL import Image
                import pytesseract

                image = Image.open(BytesIO(file_bytes))
                return pytesseract.image_to_string(image)
            except Exception:
                return ""

        return ""

    def cross_check(
        self,
        extracted: dict,
        application: dict = None,
        property_record: dict = None,
        other_docs_fields: list = None,
        document_type: str = "",
    ) -> list:
        """Return validation check results against GeoLedger records."""
        checks = []
        fields = extracted or {}
        document_type = (document_type or "").upper()

        survey = fields.get("survey_number")
        survey_required = document_type in {
            "SALE_DEED",
            "MUTATION_CERTIFICATE",
            "OWNERSHIP_PROOF",
        }
        if survey_required and not survey:
            checks.append({
                "name": "SURVEY_NUMBER_PRESENT",
                "passed": False,
                "severity": "MEDIUM",
                "message": "Survey number could not be extracted; reviewer must check the document",
            })
        if application and survey:
            expected = application.get("survey_number")
            checks.append({
                "name": "SURVEY_NUMBER_MATCH",
                "passed": survey.upper() == (expected or "").upper(),
                "severity": "HIGH" if survey.upper() != (expected or "").upper() else "LOW",
                "message": f"Extracted survey {survey} vs application {expected}",
            })

        party_details = (application or {}).get("party_details") or {}
        buyer = party_details.get("buyer") or {}
        seller = party_details.get("seller") or {}
        expected_names = {
            "ID_PROOF": [party_details.get("applicant_name")],
            "SELLER_ID_PROOF": [seller.get("name")],
            "BUYER_ID_PROOF": [buyer.get("name")],
            "NEW_OWNER_ID_PROOF": [buyer.get("name"), party_details.get("applicant_name")],
            "DEATH_CERTIFICATE": [party_details.get("deceased_owner_name")],
        }.get(document_type, [])
        expected_names = [name.strip() for name in expected_names if isinstance(name, str) and name.strip()]

        def normalize_name(value: str) -> str:
            return re.sub(r"[^a-z0-9]", "", value.lower())

        if document_type in {
            "ID_PROOF",
            "SELLER_ID_PROOF",
            "BUYER_ID_PROOF",
            "NEW_OWNER_ID_PROOF",
            "DEATH_CERTIFICATE",
        }:
            extracted_name = fields.get("owner_name")
            if not extracted_name:
                checks.append({
                    "name": "REQUIRED_NAME_PRESENT",
                    "passed": False,
                    "severity": "MEDIUM",
                    "message": "Relevant name could not be extracted; reviewer must check the document",
                })
            elif expected_names:
                matches = any(
                    normalize_name(extracted_name) == normalize_name(name)
                    for name in expected_names
                )
                checks.append({
                    "name": "DOCUMENT_NAME_MATCH",
                    "passed": matches,
                    "severity": "LOW" if matches else "HIGH",
                    "message": (
                        "Extracted name matches the application"
                        if matches
                        else "Extracted name does not match the expected party; reviewer must investigate"
                    ),
                })

        if property_record and survey:
            expected = property_record.get("survey_number")
            checks.append({
                "name": "PROPERTY_RECORD_MATCH",
                "passed": survey.upper() == (expected or "").upper(),
                "severity": "HIGH" if survey.upper() != (expected or "").upper() else "LOW",
                "message": f"Extracted survey {survey} vs property {expected}",
            })

        # Cross-document consistency
        for other in other_docs_fields or []:
            other_survey = (other or {}).get("survey_number")
            if survey and other_survey and survey.upper() != other_survey.upper():
                checks.append({
                    "name": "CROSS_DOCUMENT_SURVEY",
                    "passed": False,
                    "severity": "HIGH",
                    "message": f"Survey mismatch across documents: {survey} vs {other_survey}",
                })

        if not checks:
            checks.append({
                "name": "EXTRACTION_BASELINE",
                "passed": True,
                "severity": "LOW",
                "message": "No conflicting fields detected from extraction",
            })

        return checks
