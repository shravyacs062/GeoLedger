import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Language = 'en' | 'kn';
const phrases: Record<Language, Record<string, string>> = {
  en: { dashboard: 'Dashboard', properties: 'My Properties', marketplace: 'Marketplace', applications: 'Applications', search: 'Property Search', valuation: 'Land Valuation', more: 'More', signOut: 'Sign out', kannada: 'ಕನ್ನಡ' },
  kn: { dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', properties: 'ನನ್ನ ಆಸ್ತಿಗಳು', marketplace: 'ಮಾರುಕಟ್ಟೆ', applications: 'ಅರ್ಜಿಗಳು', search: 'ಆಸ್ತಿ ಹುಡುಕಾಟ', valuation: 'ಭೂಮಿ ಮೌಲ್ಯಮಾಪನ', more: 'ಇನ್ನಷ್ಟು', signOut: 'ನಿರ್ಗಮಿಸಿ', kannada: 'English' },
};
const LanguageContext = createContext<{ language: Language; setLanguage: (language: Language) => void; t: (key: string) => string }>({ language: 'en', setLanguage: () => undefined, t: key => key });
export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => localStorage.getItem('geoledger-language') === 'kn' ? 'kn' : 'en');
  useEffect(() => { localStorage.setItem('geoledger-language', language); document.documentElement.lang = language === 'kn' ? 'kn' : 'en'; }, [language]);
  return <LanguageContext.Provider value={{ language, setLanguage, t: key => phrases[language][key] || phrases.en[key] || key }}>{children}</LanguageContext.Provider>;
};
export const useLanguage = () => useContext(LanguageContext);
