import { translations } from "./i18n-dictionary";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export type Language = "zh" | "en" | "zh-TW";

// The language cycle order (owner bug round 2026-11-15): the toggles (⌘K
// palette, onboarding button) rotate through these — the `common.langName`
// copy of each locale is the NEXT locale's native name, so the button always
// reads "one click takes you here".
export const LANGUAGES: Language[] = ["zh", "en", "zh-TW"];

/** The next locale in the toggle cycle (wraps around). */
export function nextLanguage(lang: Language): Language {
  return LANGUAGES[(LANGUAGES.indexOf(lang) + 1) % LANGUAGES.length];
}

// BCP 47 document tags per locale — zh-TW rides the script-neutral Hant tag
// (traditional script, no region claim).
const LANG_TAGS: Record<Language, string> = { zh: "zh-CN", en: "en", "zh-TW": "zh-Hant" };

// The dictionary is nested by language: translations[lang][key] (prototype I18N shape).
type Dict = Record<string, string>;

// The locale → column bridge: the table's generated block key is the
// identifier-safe `zhTW`, the Language union's member is the BCP 47 tag
// `zh-TW` (what storage and the html lang carry) — this is the one place the
// two names meet.
const DICT_FOR: Record<Language, Dict> = {
  zh: translations.zh as Dict,
  en: translations.en as Dict,
  "zh-TW": translations.zhTW as Dict,
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Non-React mirror (epic P2-8 T5): the AI server adapter (src/ai/
// companion-service-server.ts) generates quiz/flashcards in the UI's language
// but is not a component, so it cannot mount the hook. The provider keeps the
// mirror current (init + setLanguage); zh is the same fallback the provider
// initializes with, and the key is lazy-written so storage alone would lie.
let uiLanguageMirror: Language = "zh";

/** The UI's current language for non-React readers (the AI server adapter). */
export function currentUiLanguage(): Language {
  return uiLanguageMirror;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("synapse-lang");
    const resolved = (LANGUAGES as string[]).includes(saved ?? "") ? (saved as Language) : "zh";
    uiLanguageMirror = resolved;
    return resolved;
  });

  const setLanguage = useCallback((lang: Language) => {
    uiLanguageMirror = lang;
    setLang(lang);
    localStorage.setItem("synapse-lang", lang);
  }, []);

  useEffect(() => {
    document.documentElement.lang = LANG_TAGS[language];
  }, [language]);

  const t = useCallback((key: string, vars?: Record<string, string | number>) => {
    const dict = DICT_FOR[language] ?? DICT_FOR.zh;
    let text = dict[key] ?? DICT_FOR.zh[key] ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
