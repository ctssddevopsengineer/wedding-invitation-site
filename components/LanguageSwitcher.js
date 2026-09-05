'use client';

import { LANGUAGES } from '@/lib/locale.mjs';
import { useLanguage } from '@/components/LanguageProvider';

export default function LanguageSwitcher({ onLanguageChange }) {
  const { language, t } = useLanguage();
  return (
    <div className="languageSwitcher">
      <label htmlFor="invitation-language"><span aria-hidden="true">◎</span> {t('Language')}</label>
      <select id="invitation-language" value={language} onChange={(event) => onLanguageChange(event.target.value)}>
        {Object.entries(LANGUAGES).map(([id, label]) => <option key={id} value={id} lang={id}>{label}</option>)}
      </select>
    </div>
  );
}
