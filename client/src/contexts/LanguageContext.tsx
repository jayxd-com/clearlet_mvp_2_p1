import { createContext, useContext, useState, useEffect } from "react";
import { translations, type Language } from "@/lib/translations";

type LanguageProviderState = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const initialState: LanguageProviderState = {
  language: "en",
  setLanguage: () => null,
  t: (key: string) => key,
};

const LanguageContext = createContext<LanguageProviderState>(initialState);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Initialize from localStorage if available, otherwise default to "en"
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("clearlet-language");
    return (saved === "en" || saved === "es") ? saved as Language : "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("clearlet-language", lang);
  };

  const t = (key: string) => {
    try {
      // @ts-ignore - Dynamic key access
      const translation = translations[language]?.[key];
      // Fallback to English if translation is missing, then to key itself
      // @ts-ignore
      return translation || translations["en"]?.[key] || key;
    } catch (error) {
      console.warn(`Translation error for key: ${key}`, error);
      return key;
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
