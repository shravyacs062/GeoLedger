[11:18 AM] A Vikas
# GeoLedger – Final Project Requirements and Implementation Checklist
 
The following requirements define the complete expected scope of GeoLedger. All existing features must be reviewed, incomplete features must be implemented, and non-functional buttons or confusing workflows must be corrected.
 
## 1. Separate Login and Authentication System
 
Create two distinct login pages with separate access permissions.
 
1.1 Admin Login
 
- Dedicated Admin Login page.
- Secure admin authentication.
- Admin dashboard accessible only to authorized administrators/registrars.
- Role-based permissions for reviewing, approving, rejecting, and managing applications.
- Admin logout and session management.
- Unauthorized users must not be able to access admin pages by directly entering URLs.
 
1.2 User Login
 
- Dedicated User Login page.
- User registration and login.
- Secure password storage and authentication.
- User profile management.
- User dashboard displaying properties, applications, transfers, notifications, and application statuses.
- User logout and session management.
 
1.3 Access Control
 
- Admin and User interfaces must remain separate.
- Users must not access admin-only operations.
- All protected backend APIs must enforce permissions, not just frontend page restrictions.
 
## 2. Three Separate Land Ownership Workflows
 
These are mandatory core modules and must be visible as separate sections in the application.
 
### 2.1 New Land Registration
 
- User initiates a new land registration application.
- Enter owner details and property information.
- Enter survey number, location, land area, and other required details.
- Mark or select the property boundary using the GIS map.
- Upload required ownership and supporting documents.
- Automatically verify and validate uploaded documents.
- Check for duplicate property registrations and conflicting ownership records.
- Submit the application to the Admin/Registrar.
- Admin reviews the documents and property information.
- Admin approves or rejects the application with remarks.
- Upon approval, register the property on the blockchain.
- Generate a unique Property ID and QR code.
- Display the registered property in the user's dashboard.
 
### 2.2 Ownership Transfer (Sale / Gift / Other Legal Transfer)
 
- Existing owner initiates an ownership transfer.
- Select the property to be transferred.
- Enter the new owner's details.
- Upload the required transfer documents.
- Verify the existing owner's registered ownership.
- Validate the new owner's identity and supporting documents.
- Verify transfer-related documents and check for inconsistencies.
- Check for pending applications or conflicting ownership claims.
- Submit the application to the Admin/Registrar.
- Admin reviews and approves or rejects the application.
- Update ownership on the blockchain only after approval.
- Update the database and property records.
- Notify both parties of the transfer status.
 
### 2.3 Ownership Transfer Due to Death of Owner (Inheritance)
 
- Applicant initiates an inheritance-based ownership transfer.
- Identify the deceased property owner and the registered property.
- Enter applicant details and relationship with the deceased.
- Identify and record all legal heirs.
- Upload the required documents:
  - Death Certificate.
  - Legal Heir Certificate.
  - Family Tree.
  - NOC from other legal heirs, where applicable.
  - Mutation Certificate.
  - Existing land ownership/registration documents.
- Automatically verify and validate the uploaded documents.
- Cross-check names, dates, relationships, property details, and other key information across documents.
- Verify the deceased owner's ownership against GeoLedger records.
- Detect missing documents, duplicate claims, inconsistent information, and conflicting ownership claims.
- Allow additional documents or corrections to be submitted.
- Forward the application for Admin/Registrar review.
- Admin reviews the legal documents and approves or rejects the application with remarks.
- Update ownership on the blockchain only after authorized approval.
- Update property records and notify the applicant and relevant parties.
 
## 3. Automated Document Verification and Validation
 
Major requirement
 
Implement a common automated document verification system shared by all three ownership workflows.
 
3.1 Document Upload and Processing
 
- Support PDF and image uploads.
- Validate file type, size, and format.
- Store documents securely.
- Extract text and key information using OCR/document processing.
 
3.2 Key Information Extraction
 
Extract relevant fields depending on the document type, such as:
 
- Owner's name.
- Applicant's name.
- Survey number.
- Property ID.
- Land area.
- Registration/document number.
- Issue date.
- Issuing authority.
- Legal heir names and relationships.
- Relevant signatures, QR codes, and other document identifiers where available.
 
3.3 Automated Validation
 
- Verify that mandatory fields are present.
- Cross-check extracted details against existing GeoLedger records.
- Compare details across multiple uploaded documents.
- Identify mismatched names, survey numbers, dates, and property information.
- Detect duplicate document submissions.
- Identify missing or invalid documents based on the selected workflow.
- Flag suspicious documents for manual review.
 
3.4 Document Integrity and Tampering Detection
 
- Generate a SHA-256 hash for every uploaded document.
- Store the hash securely alongside the document reference.
- Recalculate and compare the hash whenever the document is retrieved or verified.
- Detect modifications made after the trusted hash was recorded.
- Where possible, verify digital signatures, QR codes, document numbers, and issuing-authority records against trusted sources.
 
3.5 Verification Results
 
Every uploaded document must display one of these statuses:
 
- Verified.
- Verification Failed.
- Requires Manual Review.
- Pending Verification.
 
3.6 Admin Review
 
- Admin can view uploaded documents.
- Admin can view extracted information and validation results.
- Admin can inspect flagged documents.
- Admin can approve or reject documents.
- Admin can provide rejection remarks.
- Users can upload corrected documents when requested.
 
Important: SHA-256 verifies file integrity against a previously trusted hash; it does not independently establish that the original document was genuine. Authenticity must be supported by trusted issuing-authority validation, digital signatures, or authorized manual review.
 
## 4. Blockchain Integration
 
- Implement property registration through smart contracts.
- Implement ownership transfer through smart contracts.
- Restrict blockchain registration and transfer to authorized operations.
- Ensure transfers occur only after Admin/Registrar approval.
- Store relevant property identifiers, ownership information, timestamps, transaction references, and document hashes as appropriate.
- Maintain transaction history.
- Display transaction hash and transaction status.
- Handle failed, pending, and successful transactions.
- Synchronize blockchain transactions with the database.
- Prevent unauthorized transfers and duplicate registrations.
- Provide a way to verify blockchain transaction records.
 
## 5. GIS Mapping and Property Visualization
 
- Interactive map integration using Leaflet and OpenStreetMap.
- Display land parcels and their boundaries using GeoJSON.
- Search properties using survey number or Property ID.
- Allow users to select or mark land boundaries during registration.
- Display property location and area.
- Connect GIS parcel information with registered property records.
- Validate submitted coordinates and boundaries.
- Display registered properties on the map.
- Clearly distinguish demo GeoJSON data from verified government cadastral data.
 
## 6. Property QR Code and Public Verification
 
- Generate a unique QR code for every approved property.
- QR code must link to the property's public verification page.
- Allow scanning through a mobile device.
- Display essential property information.
- Display current ownership and registration status.
- Show blockchain verification information.
- Do not expose confidential documents or sensitive personal information publicly.
- Ensure QR codes remain valid after ownership transfers.
 
## 7. Land Valuation Module
 
- Implement a land valuation feature.
- Consider location, land area, land type, and other available valuation factors.
- Display estimated property value.
- Explain the factors used in calculating the estimate.
- Allow authorized Admin users to manage valuation parameters.
- Clearly distinguish system-generated estimates from official government valuations.
 
## 8. Admin Dashboard
 
The Admin dashboard must provide:
 
- Total registered properties.
- Pending registration applications.
- Pending ownership transfers.
- Pending inheritance applications.
- Approved and rejected applications.
- Pending document verification.
- Flagged or suspicious documents.
- Recent blockchain transactions.
- Property and application management.
- User management.
- GIS property overview.
- Reports and analytics.
- Notification management.
 
Admin must be able to:
 
- View and review all applications.
- Approve or reject applications.
- Request additional documents.
- Add review remarks.
- Manage property records.
- View document verification results.
- Track blockchain transactions.
- Manage authorized users and roles.
 
## 9. User Dashboard
 
The User dashboard must provide:
 
- User profile information.
- Registered properties.
- New land registration.
- Ownership transfer.
- Inheritance transfer.
- Submitted applications.
- Application tracking.
- Document verification status.
- Pending actions and requested corrections.
- Property details.
- QR code access.
- Blockchain transaction history.
- Notifications.
 
Users must be able to track every application from submission to final approval or rejection.
 
## 10. Application and Document Management
 
- Unique application ID for every submission.
- Separate application records for registration, transfer, and inheritance.
- Application status tracking.
- Document checklist for each workflow.
- Document upload and replacement.
- Admin remarks and correction requests.
- Application history and timestamps.
- Proper handling of rejected and resubmitted applications.
- Prevent duplicate or conflicting submissions where applicable.
 
## 11. Notifications
 
- Notify users when an application is submitted.
- Notify users when documents are verified or flagged.
- Notify users when additional documents are required.
- Notify users when an application is approved or rejected.
- Notify users when ownership is successfully transferred.
- Notify Admins when new applications are submitted.
- Include read/unread status.
- Display notification history.
 
## 12. Database and Cloud Document Storage
 
- Maintain consistent records across the frontend, backend, database, and blockchain.
- Store user, property, application, document metadata, and transaction information.
- Store uploaded documents securely in cloud storage.
- Keep document hashes and relevant references in the database.
- Implement reliable document retrieval.
- Maintain backup and recovery mechanisms.
- Ensure access
 [11:18 AM] A Vikas
permissions for sensitive records.
- Implement IPFS integration if decentralized document storage remains part of the final project scope.
- Handle database connection failures and fallback behavior properly.
 
## 13. Profile and Account Management
 
- View and edit user profile information.
- Manage account details.
- View linked wallet address.
- Connect and disconnect MetaMask where applicable.
- View account and transaction activity.
- Securely log out.
- Restrict sensitive account operations to authorized users.
 
## 14. Complete Website Functionality and User Experience
 
Mandatory across the entire application
 
Every page, button, link, form, menu, and action must be functional.
 
- Audit every button and clickable element.
- Remove placeholder buttons and non-functional links.
- Ensure every form validates inputs correctly.
- Ensure Submit, Save, Cancel, Edit, Delete, Approve, Reject, Upload, Download, Back, and Logout actions work as intended.
- Ensure navigation leads to the correct pages.
- Correct broken or confusing user journeys.
- Remove duplicate or redundant screens.
- Ensure every workflow has a clear beginning, middle, and completion state.
- Add confirmation messages for important actions.
- Add meaningful error messages.
- Add loading indicators while processing.
- Add empty states when no records are available.
- Prevent accidental duplicate submissions.
- Ensure data entered in forms is saved and displayed correctly.
- Ensure refresh and navigation do not unexpectedly lose submitted data.
- Ensure frontend actions trigger the correct backend API.
- Ensure backend API responses are reflected correctly in the interface.
- Ensure the Admin and User experiences are consistent and understandable.
- Make the website responsive across desktop, tablet, and mobile devices.
 
## 15. Security and Data Protection
 
- Secure authentication and authorization.
- Role-based access control.
- Password hashing.
- Input validation and sanitization.
- Secure file upload handling.
- Restrict access to private documents.
- Prevent unauthorized property modifications.
- Validate blockchain transaction permissions.
- Protect sensitive user and legal information.
- Maintain audit logs for Admin actions and ownership changes.
- Secure environment variables and API credentials.
 
## 16. Testing and Quality Assurance
 
Test the complete system, not just individual modules.
 
Frontend testing
 
- Test every page and button.
- Test navigation and all forms.
- Test login/logout and access restrictions.
- Test responsive layouts.
- Test loading, error, and success states.
 
Backend testing
 
- Test every API endpoint.
- Test authentication and role permissions.
- Test file uploads and document validation.
- Test database operations.
- Test application status changes.
- Test notifications.
 
Document verification testing
 
- Test genuine, unchanged documents against a trusted baseline.
- Test modified documents.
- Test missing and mismatched information.
- Test duplicate submissions.
- Test invalid document formats.
- Test manual review and rejection.
 
Workflow testing
 
- Complete a new land registration from beginning to end.
- Complete a normal ownership transfer from beginning to end.
- Complete an inheritance transfer from beginning to end.
- Test rejection, correction, and resubmission.
- Verify that blockchain and database records remain consistent.
 
Blockchain testing
 
- Test registration and ownership transfer.
- Test unauthorized transactions.
- Test invalid wallet addresses.
- Test duplicate registration.
- Test failed transactions and recovery.
 
GIS and QR testing
 
- Test parcel search.
- Test map interactions and boundary selection.
- Test QR generation and scanning.
- Test public property verification.
 
## 17. Final Deployment and Documentation
 
- Configure production environment variables.
- Deploy frontend and backend.
- Configure database and cloud document storage.
- Configure blockchain network and smart contracts.
- Configure HTTPS and CORS.
- Verify all deployed API connections.
- Prepare database backup and recovery.
- Update installation and setup instructions.
- Update API documentation.
- Document all three ownership workflows.
- Document document verification and validation.
- Document blockchain and GIS integration.
- Prepare a complete demonstration of all major workflows.
 
## Final acceptance criteria
 
GeoLedger should only be considered complete when all of the following are satisfied:
 
1. Separate Admin and User login pages work with proper access restrictions.
2. All three land ownership workflows are restored and fully functional.
3. Automated document verification, field validation, and tampering detection work.
4. Inheritance applications enforce the required legal-document checklist and review process.
5. Blockchain registration and ownership transfer work only after authorized approval.
6. GIS mapping, property QR codes, and public verification work.
7. Admin and User dashboards display actual application and property data.
8. Every button, form, link, and navigation flow works correctly.
9. Frontend, backend, database, document storage, GIS, and blockchain are properly integrated.
10. The entire system passes end-to-end testing, including failed, rejected, and corrected application scenarios.
 
The priority is a completely functional, logically connected GeoLedger system—not simply a website with all the screens present.
 