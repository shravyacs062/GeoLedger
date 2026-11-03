"""Lightweight document field extraction.

Uses optional OCR libraries when available; otherwise performs heuristic
text extraction from plain-text / simple PDF-like uploads for demo validation.
"""

import re
from datetime import datetime


FIELD_PATTERNS = {
    "owner_name": [
        re.compile(r"(?:owner|proprietor|name of owner)\s*[:\-]\s*(.+)", re.I),
        re.compile(r"(?:applicant|heir)\s*[:\-]\s*(.+)", re.I),
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
                # Extract readable ASCII stretches from PDF streams
                chunks = re.findall(rb"[\x20-\x7E]{4,}", file_bytes)
                return " ".join(c.decode("ascii", errors="ignore") for c in chunks[:200])
            except Exception:
                return ""

        # Optional pytesseract path for images
        if lower.endswith((".png", ".jpg", ".jpeg")):
            try:
                from PIL import Image
                import pytesseract
                import io

                image = Image.open(io.BytesIO(file_bytes))
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
    ) -> list:
        """Return validation check results against GeoLedger records."""
        checks = []
        fields = extracted or {}

        survey = fields.get("survey_number")
        if application and survey:
            expected = application.get("survey_number")
            checks.append({
                "name": "SURVEY_NUMBER_MATCH",
                "passed": survey.upper() == (expected or "").upper(),
                "severity": "HIGH" if survey.upper() != (expected or "").upper() else "LOW",
                "message": f"Extracted survey {survey} vs application {expected}",
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
