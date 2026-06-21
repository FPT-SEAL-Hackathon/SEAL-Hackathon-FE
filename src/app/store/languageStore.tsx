import { useCallback } from "react";
import { en } from "@/constants/translations";

interface LanguageState {
  t: (key: string) => string;
}

export function useLanguage(): LanguageState {
  const t = useCallback(
    (key: string): string => (en as Record<string, string>)[key] ?? key,
    []
  );

  return { t };
}
