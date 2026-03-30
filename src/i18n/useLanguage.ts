import { useContext } from "react";
import { LanguageContext } from "./languageState";

export function useLanguage() {
  return useContext(LanguageContext);
}
