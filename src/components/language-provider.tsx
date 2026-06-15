"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { translations, type Language } from "@/lib/i18n/translations";

type I18nContextValue = {
  language: Language;
  dir: "rtl" | "ltr";
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ar");

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("elitecrm-language") as Language | null;
    if (savedLanguage === "ar" || savedLanguage === "en") {
      setLanguageState(savedLanguage);
    }
  }, []);

  const dir = language === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    document.title = language === "ar" ? "إيليت سي آر إم" : "EliteCRM";
  }, [language, dir]);

  function setLanguage(nextLanguage: Language) {
    setLanguageState(nextLanguage);
    window.localStorage.setItem("elitecrm-language", nextLanguage);
  }

  function toggleLanguage() {
    setLanguage(language === "ar" ? "en" : "ar");
  }

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      dir,
      setLanguage,
      toggleLanguage,
      t: (key) => (translations[language] as Record<string, string>)[String(key)] ?? String(key),
    }),
    [language]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("Missing I18nProvider");
  }

  return context;
}
