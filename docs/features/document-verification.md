# Automated document verification and validation

Requirement source: `complete.md` §3.

Shared by registration, transfer, and inheritance.

## Upload and storage

- Endpoint: `POST /documents/upload` (multipart, authenticated)
- Allowed types: PDF, PNG, JPG/JPEG, DOC/DOCX, TXT (configurable)
- Size limited by `MAX_CONTENT_LENGTH` (default 16 MB)
- Files stored under `UPLOAD_FOLDER` (local disk)
- Metadata + hash stored in the `documents` collection

## SHA-256 integrity

On upload:

```
document_hash = sha256(file_bytes)
```

On integrity re-check (`POST /verification/document/<id>`):

1. Re-read file from disk
2. Recompute hash
3. Compare to stored hash
4. Mismatch → `REJECTED` (“Verification Failed” / tampering)
5. Match → integrity passed; authenticity still requires admin or authority review

> SHA-256 proves the file was not changed after the trusted hash was recorded. It does **not** prove the original document was genuine.

## Field extraction (OCR / heuristic)

`OCRService` extracts text from plain uploads and best-effort PDF/image content, then looks for:

- Owner / applicant name
- Survey number / property id
- Land area
- Document number
- Issue date
- Issuing authority
- Legal heir names

Extracted fields are stored on the document (`extracted_fields`, `document_number`, `issuing_authority`, `issue_date`).

Optional Tesseract/Pillow can be added for richer image OCR; heuristic extraction works without it.

## Automated validation checks

On upload the service builds `verification_checks`, including:

| Check | Purpose |
|---|---|
| `FILE_INTEGRITY` | Hash generated successfully |
| `SURVEY_NUMBER_MATCH` | Extracted survey vs application |
| `PROPERTY_RECORD_MATCH` | Extracted survey vs registry property |
| `CROSS_DOCUMENT_SURVEY` | Consistency across uploads on same application |
| `DUPLICATE_DOCUMENT` | Same hash already stored |

High/medium severity failures set status to `REQUIRES_MANUAL_REVIEW`.

## Verification statuses

| Internal status | UI label |
|---|---|
| `PENDING` | Pending Verification |
| `VERIFIED` | Verified |
| `REJECTED` | Verification Failed |
| `REQUIRES_MANUAL_REVIEW` | Requires Manual Review |

## Admin review

Admin-only: `POST /verification/document/<id>/review`

```json
{ "status": "VERIFIED", "remarks": "Matches cadastral record" }
```

Admins can:

- View uploaded files and extracted fields
- Inspect flagged checks
- Approve or reject documents with remarks
- Request additional/corrected uploads via `POST /applications/<id>/request-documents`

Users re-upload corrected documents on the application detail page when status is `DOCUMENTS_PENDING`.

## Approve gate

`POST /applications/<id>/approve` refuses to write the blockchain until:

1. Every required document type is present
2. Every uploaded required document has `verification_status == VERIFIED`
