'use client';

import { createContext, useContext, useMemo } from 'react';
import { EVENT } from '@/lib/event.mjs';
import { localizeEvent, translate } from '@/lib/locale.mjs';

const LanguageContext = createContext({ language: 'en', event: EVENT, t: (key, values) => translate('en', key, values) });
export function LanguageProvider({ language, children }) {
  const value = useMemo(() => ({ language, event: localizeEvent(EVENT, language), t: (key, values) => translate(language, key, values) }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
export function useLanguage() { return useContext(LanguageContext); }
