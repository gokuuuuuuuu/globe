import { createContext } from "react";

export type Lang = "zh" | "en";

export interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (zh: string, en: string) => string;
}

export const LanguageContext = createContext<LanguageContextType>({
  lang: "zh",
  setLang: () => {},
  t: (zh) => zh,
});
