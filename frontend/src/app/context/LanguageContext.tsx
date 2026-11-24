import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Language = 'en' | 'kn';

// Translation catalog deliberately covers interface copy only. Property IDs,
// survey numbers, wallet addresses, names, and submitted data stay unchanged.
const kn: Record<string, string> = {
  'Dashboard': 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', 'Admin Dashboard': 'ನಿರ್ವಾಹಕ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', 'My Properties': 'ನನ್ನ ಆಸ್ತಿಗಳು', 'Properties': 'ಆಸ್ತಿಗಳು', 'Applications': 'ಅರ್ಜಿಗಳು', 'Property Search': 'ಆಸ್ತಿ ಹುಡುಕಾಟ', 'Marketplace': 'ಮಾರುಕಟ್ಟೆ', 'More': 'ಇನ್ನಷ್ಟು', 'Sign out': 'ನಿರ್ಗಮಿಸಿ',
  'Register Property': 'ಆಸ್ತಿ ನೋಂದಣಿ', 'Ownership Transfer': 'ಮಾಲೀಕತ್ವ ವರ್ಗಾವಣೆ', 'Inheritance Transfer': 'ಪಾರಂಪರಿಕ ವರ್ಗಾವಣೆ', 'Land Valuation': 'ಭೂಮಿ ಮೌಲ್ಯಮಾಪನ', 'Verify Documents': 'ದಾಖಲೆ ಪರಿಶೀಲನೆ', 'Document Review': 'ದಾಖಲೆ ಪರಿಶೀಲನೆ', 'GIS Map': 'ಜಿಐಎಸ್ ನಕ್ಷೆ', 'Notifications': 'ಅಧಿಸೂಚನೆಗಳು', 'User Management': 'ಬಳಕೆದಾರ ನಿರ್ವಹಣೆ', 'Profile settings': 'ಪ್ರೊಫೈಲ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
  'Property owner portal': 'ಆಸ್ತಿ ಮಾಲೀಕರ ಪೋರ್ಟಲ್', 'New application': 'ಹೊಸ ಅರ್ಜಿ', 'Refresh': 'ರಿಫ್ರೆಶ್', 'Registered properties': 'ನೋಂದಾಯಿತ ಆಸ್ತಿಗಳು', 'Applications submitted': 'ಸಲ್ಲಿಸಿದ ಅರ್ಜಿಗಳು', 'Applications in progress': 'ಪ್ರಗತಿಯಲ್ಲಿರುವ ಅರ್ಜಿಗಳು', 'Recent applications': 'ಇತ್ತೀಚಿನ ಅರ್ಜಿಗಳು', 'View all': 'ಎಲ್ಲವನ್ನೂ ನೋಡಿ', 'Loading applications…': 'ಅರ್ಜಿಗಳು ಲೋಡ್ ಆಗುತ್ತಿವೆ…',
  'Land Registry Applications': 'ಭೂ ನೋಂದಣಿ ಅರ್ಜಿಗಳು', 'New Application': 'ಹೊಸ ಅರ್ಜಿ', 'No applications found': 'ಯಾವುದೇ ಅರ್ಜಿಗಳು ಕಂಡುಬಂದಿಲ್ಲ', 'Registered Properties': 'ನೋಂದಾಯಿತ ಆಸ್ತಿಗಳು', 'Register New Land': 'ಹೊಸ ಭೂಮಿ ನೋಂದಣಿ', 'No properties found': 'ಯಾವುದೇ ಆಸ್ತಿಗಳು ಕಂಡುಬಂದಿಲ್ಲ',
  'Search Results': 'ಹುಡುಕಾಟ ಫಲಿತಾಂಶಗಳು', 'Locate on map': 'ನಕ್ಷೆಯಲ್ಲಿ ನೋಡಿ', 'GIS Map View': 'ಜಿಐಎಸ್ ನಕ್ಷೆ ವೀಕ್ಷಣೆ', 'View Details': 'ವಿವರಗಳನ್ನು ನೋಡಿ', 'Transfer': 'ವರ್ಗಾಯಿಸಿ', 'Area:': 'ವಿಸ್ತೀರ್ಣ:', 'Owner:': 'ಮಾಲೀಕ:', 'Coordinates:': 'ನಿರ್ದೇಶಾಂಕಗಳು:',
  'Property marketplace': 'ಆಸ್ತಿ ಮಾರುಕಟ್ಟೆ', 'List my property': 'ನನ್ನ ಆಸ್ತಿಯನ್ನು ಪಟ್ಟಿ ಮಾಡಿ', 'Create a listing': 'ಪಟ್ಟಿ ರಚಿಸಿ', 'Listing title': 'ಪಟ್ಟಿಯ ಶೀರ್ಷಿಕೆ', 'Asking price (₹)': 'ಕೇಳುತ್ತಿರುವ ಬೆಲೆ (₹)', 'Publish listing': 'ಪಟ್ಟಿ ಪ್ರಕಟಿಸಿ', 'All districts': 'ಎಲ್ಲಾ ಜಿಲ್ಲೆಗಳು', 'All types': 'ಎಲ್ಲಾ ಪ್ರಕಾರಗಳು', 'Newest': 'ಇತ್ತೀಚಿನವು', 'Price: low first': 'ಬೆಲೆ: ಕಡಿಮೆಯಿಂದ', 'Price: high first': 'ಬೆಲೆ: ಹೆಚ್ಚುದಿಂದ', 'Largest area': 'ಅತಿದೊಡ್ಡ ವಿಸ್ತೀರ್ಣ', 'Asking price': 'ಕೇಳುತ್ತಿರುವ ಬೆಲೆ', 'Survey number': 'ಸರ್ವೆ ಸಂಖ್ಯೆ', 'Land area': 'ಭೂ ವಿಸ್ತೀರ್ಣ', 'Property type': 'ಆಸ್ತಿ ಪ್ರಕಾರ', 'Locality': 'ಸ್ಥಳ', 'Contact seller': 'ಮಾರಾಟಗಾರರನ್ನು ಸಂಪರ್ಕಿಸಿ', 'Request a viewing': 'ವೀಕ್ಷಣೆಗೆ ವಿನಂತಿಸಿ', 'Demo listing': 'ಪ್ರದರ್ಶನ ಪಟ್ಟಿ', 'Demo data': 'ಪ್ರದರ್ಶನ ದತ್ತಾಂಶ',
  'Estimate Property Value': 'ಆಸ್ತಿ ಮೌಲ್ಯ ಅಂದಾಜಿಸಿ', 'Calculate Estimate': 'ಅಂದಾಜು ಲೆಕ್ಕಹಾಕಿ', 'Estimated Value': 'ಅಂದಾಜಿತ ಮೌಲ್ಯ', 'District (Karnataka only)': 'ಜಿಲ್ಲೆ (ಕರ್ನಾಟಕ ಮಾತ್ರ)', 'Land Type': 'ಭೂ ಪ್ರಕಾರ', 'Location Category': 'ಸ್ಥಳ ವರ್ಗ', 'Area (sq ft)': 'ವಿಸ್ತೀರ್ಣ (ಚದರ ಅಡಿ)',
  'Register a property': 'ಆಸ್ತಿ ನೋಂದಾಯಿಸಿ', 'Property information': 'ಆಸ್ತಿ ಮಾಹಿತಿ', 'Required documents': 'ಅಗತ್ಯ ದಾಖಲೆಗಳು', 'Parcel boundary': 'ಜಮೀನು ಗಡಿ', 'Undo last point': 'ಕೊನೆಯ ಬಿಂದುವನ್ನು ರದ್ದುಮಾಡಿ', 'Clear boundary': 'ಗಡಿ ತೆರವುಗೊಳಿಸಿ', 'Submit application': 'ಅರ್ಜಿ ಸಲ್ಲಿಸಿ', 'Submit': 'ಸಲ್ಲಿಸಿ', 'Cancel': 'ರದ್ದುಮಾಡಿ', 'Save': 'ಉಳಿಸಿ', 'Close form': 'ಫಾರ್ಮ್ ಮುಚ್ಚಿ', 'Search': 'ಹುಡುಕಿ',
  'SUBMITTED': 'ಸಲ್ಲಿಸಲಾಗಿದೆ', 'UNDER REVIEW': 'ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ', 'VERIFIED': 'ಪರಿಶೀಲಿಸಲಾಗಿದೆ', 'APPROVED': 'ಅನುಮೋದಿಸಲಾಗಿದೆ', 'COMPLETED': 'ಪೂರ್ಣಗೊಂಡಿದೆ', 'REJECTED': 'ತಿರಸ್ಕರಿಸಲಾಗಿದೆ', 'DOCUMENTS PENDING': 'ದಾಖಲೆಗಳು ಬಾಕಿ ಇವೆ',
  'Connect MetaMask': 'ಮೆಟಾಮಾಸ್ಕ್ ಸಂಪರ್ಕಿಸಿ', 'Connect and verify wallet': 'ವಾಲೆಟ್ ಸಂಪರ್ಕಿಸಿ ಮತ್ತು ಪರಿಶೀಲಿಸಿ', 'Linked wallet': 'ಜೋಡಿಸಲಾದ ವಾಲೆಟ್', 'No wallet linked': 'ಯಾವುದೇ ವಾಲೆಟ್ ಜೋಡಿಸಲಾಗಿಲ್ಲ', 'Save name': 'ಹೆಸರು ಉಳಿಸಿ',
  // Administrator portal
  'Admin Portal': 'ನಿರ್ವಾಹಕ ಪೋರ್ಟಲ್', 'GeoLedger Admin': 'ಜಿಯೋಲೆಡ್ಜರ್ ನಿರ್ವಾಹಕ', 'Admin dashboard': 'ನಿರ್ವಾಹಕ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
  'Review applications and documents before on-chain registration.': 'ಆನ್-ಚೈನ್ ನೋಂದಣಿಗೆ ಮುನ್ನ ಅರ್ಜಿಗಳು ಮತ್ತು ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.',
  'Users': 'ಬಳಕೆದಾರರು', 'Pending applications': 'ಬಾಕಿ ಇರುವ ಅರ್ಜಿಗಳು', 'Documents to review': 'ಪರಿಶೀಲಿಸಬೇಕಾದ ದಾಖಲೆಗಳು',
  'Search survey no., application ID, owner, village or district': 'ಸರ್ವೆ ಸಂಖ್ಯೆ, ಅರ್ಜಿ ಐಡಿ, ಮಾಲೀಕ, ಗ್ರಾಮ ಅಥವಾ ಜಿಲ್ಲೆಯನ್ನು ಹುಡುಕಿ',
  'Search applications': 'ಅರ್ಜಿಗಳನ್ನು ಹುಡುಕಿ', 'Loading applications…': 'ಅರ್ಜಿಗಳು ಲೋಡ್ ಆಗುತ್ತಿವೆ…', 'No applications match this search.': 'ಈ ಹುಡುಕಾಟಕ್ಕೆ ಹೊಂದುವ ಅರ್ಜಿಗಳಿಲ್ಲ.',
  'Survey': 'ಸರ್ವೆ', 'Type': 'ಪ್ರಕಾರ', 'Applicant': 'ಅರ್ಜಿದಾರ', 'Status': 'ಸ್ಥಿತಿ', 'Actions': 'ಕ್ರಿಯೆಗಳು', 'Details': 'ವಿವರಗಳು', 'Approve': 'ಅನುಮೋದಿಸಿ',
  'No documents uploaded.': 'ಯಾವುದೇ ದಾಖಲೆಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿಲ್ಲ.', 'Document': 'ದಾಖಲೆ', 'Application': 'ಅರ್ಜಿ', 'Review': 'ಪರಿಶೀಲನೆ',
  'Verify': 'ಪರಿಶೀಲಿಸಿ', 'Reject': 'ತಿರಸ್ಕರಿಸಿ', 'Unable to load Admin data.': 'ನಿರ್ವಾಹಕ ಮಾಹಿತಿಯನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.',
  'The requested review action failed.': 'ವಿನಂತಿಸಿದ ಪರಿಶೀಲನಾ ಕ್ರಿಯೆ ವಿಫಲವಾಗಿದೆ.',
  'Document review': 'ದಾಖಲೆ ಪರಿಶೀಲನೆ', 'Find an application': 'ಅರ್ಜಿಯನ್ನು ಹುಡುಕಿ',
  'Find an application, inspect its files, then run an integrity check. SHA-256 matching does not establish legal authenticity.': 'ಅರ್ಜಿಯನ್ನು ಹುಡುಕಿ, ಅದರ ಕಡತಗಳನ್ನು ಪರಿಶೀಲಿಸಿ, ನಂತರ ಸಮಗ್ರತೆ ಪರಿಶೀಲನೆ ನಡೆಸಿ. SHA-256 ಹೊಂದಾಣಿಕೆಯು ಕಾನೂನುಬದ್ಧ ಸತ್ಯಾಸತ್ಯತೆಯನ್ನು ಸ್ಥಾಪಿಸುವುದಿಲ್ಲ.',
  'Unable to load applications for review.': 'ಪರಿಶೀಲನೆಗಾಗಿ ಅರ್ಜಿಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.', 'No applications match that search.': 'ಆ ಹುಡುಕಾಟಕ್ಕೆ ಹೊಂದುವ ಅರ್ಜಿಗಳಿಲ್ಲ.',
  'Reviewing:': 'ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ:', 'Uploaded documents': 'ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ದಾಖಲೆಗಳು', 'Select an application above to review its documents.': 'ಅದರ ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಲು ಮೇಲಿನ ಅರ್ಜಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
  'No documents uploaded for this application.': 'ಈ ಅರ್ಜಿಗೆ ಯಾವುದೇ ದಾಖಲೆಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿಲ್ಲ.', 'Check integrity': 'ಸಮಗ್ರತೆ ಪರಿಶೀಲಿಸಿ', 'Unable to load documents.': 'ದಾಖಲೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.',
  'Unable to verify this document.': 'ಈ ದಾಖಲೆಯನ್ನು ಪರಿಶೀಲಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.', 'Integrity check passed. Admin authenticity review is still required.': 'ಸಮಗ್ರತೆ ಪರಿಶೀಲನೆ ಯಶಸ್ವಿಯಾಗಿದೆ. ನಿರ್ವಾಹಕರ ಸತ್ಯಾಸತ್ಯತಾ ಪರಿಶೀಲನೆ ಇನ್ನೂ ಅಗತ್ಯವಿದೆ.',
  'Status:': 'ಸ್ಥಿತಿ:', 'Extracted fields (unverified)': 'ಹೊರತೆಗೆಯಲಾದ ಕ್ಷೇತ್ರಗಳು (ಪರಿಶೀಲಿಸದ)', 'Passed': 'ಯಶಸ್ವಿಯಾಗಿದೆ', 'Flagged': 'ಗುರುತಿಸಲಾಗಿದೆ',
  'User Management': 'ಬಳಕೆದಾರ ನಿರ್ವಹಣೆ', 'View user accounts and assign user or administrator access': 'ಬಳಕೆದಾರ ಖಾತೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ ಮತ್ತು ಬಳಕೆದಾರ ಅಥವಾ ನಿರ್ವಾಹಕ ಪ್ರವೇಶವನ್ನು ನಿಯೋಜಿಸಿ',
  'Loading users…': 'ಬಳಕೆದಾರರು ಲೋಡ್ ಆಗುತ್ತಿದ್ದಾರೆ…', 'Failed to load users': 'ಬಳಕೆದಾರರನ್ನು ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ', 'Failed to update role': 'ಪಾತ್ರವನ್ನು ನವೀಕರಿಸಲು ವಿಫಲವಾಗಿದೆ',
  'Seeded demo accounts and registered citizens': 'ಮಾದರಿ ಖಾತೆಗಳು ಮತ್ತು ನೋಂದಾಯಿತ ನಾಗರಿಕರು', 'Unnamed user': 'ಹೆಸರಿಸದ ಬಳಕೆದಾರ', 'No email on record': 'ದಾಖಲಾದ ಇಮೇಲ್ ಇಲ್ಲ', 'No wallet': 'ವಾಲೆಟ್ ಇಲ್ಲ', 'No users found.': 'ಯಾವುದೇ ಬಳಕೆದಾರರು ಕಂಡುಬಂದಿಲ್ಲ',
  'user': 'ಬಳಕೆದಾರ', 'admin': 'ನಿರ್ವಾಹಕ',
};

const textSources = new WeakMap<Text, string>();
const attributeNames = ['placeholder', 'aria-label', 'title'];

function translatePage(language: Language) {
  const translate = (source: string) => language === 'kn' ? (kn[source] || source) : source;
  const ignored = (element: Element | null) => !element || Boolean(element.closest('script, style, code, pre, .leaflet-container, [data-no-i18n]'));
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  nodes.forEach((node) => {
    if (ignored(node.parentElement)) return;
    const source = textSources.get(node) ?? node.nodeValue ?? '';
    if (!textSources.has(node)) textSources.set(node, source);
    const prefix = source.match(/^\s*/)?.[0] || '';
    const suffix = source.match(/\s*$/)?.[0] || '';
    node.nodeValue = `${prefix}${translate(source.trim())}${suffix}`;
  });
  document.querySelectorAll<HTMLElement>('*').forEach((element) => {
    if (ignored(element)) return;
    attributeNames.forEach((name) => {
      const current = element.getAttribute(name);
      if (current === null) return;
      const key = `i18nSource${name}`;
      const source = element.dataset[key] || current;
      element.dataset[key] = source;
      element.setAttribute(name, translate(source));
    });
  });
}

const phrases: Record<Language, Record<string, string>> = {
  en: { dashboard: 'Dashboard', properties: 'My Properties', marketplace: 'Marketplace', applications: 'Applications', search: 'Property Search', valuation: 'Land Valuation', more: 'More', signOut: 'Sign out', kannada: 'ಕನ್ನಡ' },
  kn: { dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', properties: 'ನನ್ನ ಆಸ್ತಿಗಳು', marketplace: 'ಮಾರುಕಟ್ಟೆ', applications: 'ಅರ್ಜಿಗಳು', search: 'ಆಸ್ತಿ ಹುಡುಕಾಟ', valuation: 'ಭೂಮಿ ಮೌಲ್ಯಮಾಪನ', more: 'ಇನ್ನಷ್ಟು', signOut: 'ನಿರ್ಗಮಿಸಿ', kannada: 'English' },
};

const LanguageContext = createContext<{ language: Language; setLanguage: (language: Language) => void; t: (key: string) => string }>({ language: 'en', setLanguage: () => undefined, t: key => key });
export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => localStorage.getItem('geoledger-language') === 'kn' ? 'kn' : 'en');
  useEffect(() => {
    localStorage.setItem('geoledger-language', language);
    document.documentElement.lang = language === 'kn' ? 'kn' : 'en';
    const observer = new MutationObserver(() => { observer.disconnect(); translatePage(language); observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: attributeNames }); });
    translatePage(language);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: attributeNames });
    return () => observer.disconnect();
  }, [language]);
  return <LanguageContext.Provider value={{ language, setLanguage, t: key => (language === 'kn' ? kn[key] : undefined) || phrases[language][key] || phrases.en[key] || key }}>{children}</LanguageContext.Provider>;
};
export const useLanguage = () => useContext(LanguageContext);
