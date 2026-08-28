import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { getFromStorage, saveToStorage } from "../utils/storage";
import { Language, translate, TranslationKey } from "../i18n";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: () => {},
  t: (key) => translate("en", key),
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    getFromStorage<Language>("language").then((stored) => {
      if (stored === "en" || stored === "ta" || stored === "hi") setLanguageState(stored);
    });
  }, []);

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    saveToStorage("language", nextLanguage);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: (key) => translate(language, key) }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);