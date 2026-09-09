'use client';

import { useEffect, useRef, useState } from 'react';
import { LANGUAGES } from '@/lib/locale.mjs';
import { useLanguage } from '@/components/LanguageProvider';

const LANGUAGE_LABEL_ID = 'invitation-language-label';
const LANGUAGE_MENU_ID = 'invitation-language-menu';

export default function LanguageSwitcher({ onLanguageChange }) {
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);
  const entries = Object.entries(LANGUAGES);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }

    function handleEscape(event) {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  function focusOption(index) {
    const bounded = (index + entries.length) % entries.length;
    optionRefs.current[bounded]?.focus();
  }

  function openAndFocus(index) {
    setOpen(true);
    requestAnimationFrame(() => focusOption(index));
  }

  function handleTriggerKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const activeIndex = Math.max(0, entries.findIndex(([id]) => id === language));
      openAndFocus(activeIndex);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const activeIndex = entries.findIndex(([id]) => id === language);
      openAndFocus(activeIndex >= 0 ? activeIndex : entries.length - 1);
    }
  }

  function handleMenuKeyDown(event) {
    const currentIndex = optionRefs.current.indexOf(document.activeElement);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusOption(currentIndex + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusOption(currentIndex - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusOption(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusOption(entries.length - 1);
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  }

  function chooseLanguage(id) {
    setOpen(false);
    onLanguageChange(id);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  return (
    <div className="languageSwitcher" ref={rootRef}>
      <span className="languageSwitcherLabel" id={LANGUAGE_LABEL_ID}>
        <span aria-hidden="true">◎</span> {t('Language')}
      </span>

      <div className="languageDropdown">
        <button
          ref={triggerRef}
          className="languageDropdownTrigger"
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={LANGUAGE_MENU_ID}
          aria-labelledby={`${LANGUAGE_LABEL_ID} invitation-language-value`}
          onClick={() => setOpen((current) => !current)}
          onKeyDown={handleTriggerKeyDown}
        >
          <span id="invitation-language-value" lang={language}>{LANGUAGES[language]}</span>
          <span className="languageDropdownChevron" aria-hidden="true">⌄</span>
        </button>

        {open && (
          <div
            className="languageDropdownMenu"
            id={LANGUAGE_MENU_ID}
            role="listbox"
            aria-labelledby={LANGUAGE_LABEL_ID}
            onKeyDown={handleMenuKeyDown}
          >
            {entries.map(([id, label], index) => (
              <button
                key={id}
                ref={(element) => { optionRefs.current[index] = element; }}
                className={`languageDropdownOption${id === language ? ' active' : ''}`}
                type="button"
                role="option"
                aria-selected={id === language}
                lang={id}
                onClick={() => chooseLanguage(id)}
              >
                <span className="languageDropdownCheck" aria-hidden="true">{id === language ? '✓' : ''}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
