import { createContext, useContext, useCallback, type ReactNode } from "react";
import { en, type Language } from "../constants/translations";

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageState | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language: Language = "en";

  const setLanguage = useCallback((_lang: Language) => {
    localStorage.setItem("seal-language", "en");
  }, []);

  const t = useCallback(
    (key: string): string => (en as Record<string, string>)[key] ?? key,
    []
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageState {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
