# Property QR codes and public verification

Requirement source: `complete.md` §6.

## QR generation

After a successful registration approve, the backend generates a QR payload for the property.

| Item | Detail |
|---|---|
| API | `GET /qr/property/<identifier>`, `POST /qr/generate` |
| Auth | Login required to generate/fetch QR images |
| Payload URL | `{FRONTEND_URL}/public/verify/<survey_number>` |
| Storage | `qr_code_url` / `qr_generated_at` on the property record |

The QR encodes the **public verification URL**, not private documents. The same survey-based URL remains valid after ownership transfers (owner fields update; the link identity does not change).

Frontend: Property Details shows the PNG (`qr_image_base64`) when available, plus the public link and a Regenerate action.

## Public verification page

| Route | Auth |
|---|---|
| `/public/verify/:identifier` | **None** (public) |
| `/verify/property/:identifier` | Alias to the same screen |
| Backend `GET /verify/property/<identifier>` | Public API |

Displayed publicly:

- Survey number / property id
- Registration status
- Current owner wallet (registry + blockchain when available)
- Location / area / land type (non-sensitive cadastral fields)
- Blockchain match indication
- Anchored document **hashes** and types (not file contents)

**Not** exposed publicly:

- Uploaded PDF/image files
- Personal phone/email beyond what is already public cadastral data
- Admin remarks or internal verification notes

## Mobile scanning

Scan the QR with any camera app → opens the public verify URL in the browser → shows the verification card above.

## Demo

Seeded parcel: open `/public/verify/SN-DEMO-001` or use **Public Verify Demo** on the landing page.
