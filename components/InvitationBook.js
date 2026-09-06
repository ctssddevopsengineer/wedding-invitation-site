'use client';

import { LanguageProvider, useLanguage } from '@/components/LanguageProvider';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { getInitialLanguage, LANGUAGE_STORAGE_KEY, resolveLanguage } from '@/lib/locale.mjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import BackCover from '@/components/BackCover';
import FrontCover from '@/components/FrontCover';
import InsideLeft from '@/components/InsideLeft';
import InsideRight from '@/components/InsideRight';
import QrNfcPanel from '@/components/QrNfcPanel';
import SmartSharePanel from '@/components/SmartSharePanel';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { INVITATION_PAGES, nextPageIndex, previousPageIndex } from '@/lib/navigation.mjs';
import { DEFAULT_THEME_ID, THEME_IDS, getTheme, resolveThemeId, THEME_STORAGE_KEY } from '@/lib/theme.mjs';
import { createArtworkLoader, getPageArtworkAssets } from '@/lib/artwork.mjs';
import { getThemeWarmupAssets } from '@/lib/theme-preload.mjs';
import { getInitialThemeId, getThemeIdFromSearch } from '@/lib/theme-url.mjs';
import { buildInvitationRelativeUrl, getDeepLinkState, getInitialDeepLinkState } from '@/lib/deep-link.mjs';

const PAGE_LABELS = ['Front', 'Inside Left', 'Inside Right', 'Back'];
const SWIPE_THRESHOLD = 55;
const INTERACTIVE_SELECTOR = 'button, a, input, select, textarea, [role="button"], [role="radio"]';

export default function InvitationBook() {
  const [language, setLanguage] = useState('en');
  return <LanguageProvider language={language}><InvitationContent language={language} setLanguage={setLanguage} /></LanguageProvider>;
}

function InvitationContent({ language, setLanguage }) {
  const { t } = useLanguage();
  const [pageIndex, setPageIndex] = useState(0);
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);
  const [themeReady, setThemeReady] = useState(false);
  const [locationDeepLinked, setLocationDeepLinked] = useState(false);
  const touchStartX = useRef(null);
  const artworkLoader = useRef(null);
  const selectionRequest = useRef(0);
  const [pendingTheme, setPendingTheme] = useState(null);

  const warmThemeAssets = useCallback((targetThemeId, targetPageIndex = pageIndex, currentOnly = false, priority = 'low') => {
    if (typeof window === 'undefined' || typeof window.Image !== 'function') return Promise.resolve();
    if (!artworkLoader.current) artworkLoader.current = createArtworkLoader(() => new window.Image());
    const assets = currentOnly ? getPageArtworkAssets(targetThemeId, targetPageIndex) :
      [...new Set([...getThemeWarmupAssets(targetThemeId, targetPageIndex), ...getPageArtworkAssets(targetThemeId, targetPageIndex)])];
    return Promise.all(assets.map((src) => artworkLoader.current(src, priority)));
  }, [pageIndex]);

  useEffect(() => {
    let storedTheme = null;
    let storedLanguage = null;
    try {
      storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    } catch {
      // Storage may be unavailable in privacy mode. URL/default still work.
    }

    const navigationEntry = window.performance?.getEntriesByType?.('navigation')?.[0];
    const navigationType = navigationEntry?.type ?? 'navigate';
    const deepLink = getInitialDeepLinkState(window.location.search, navigationType);
    setPageIndex(deepLink.pageIndex);
    setLocationDeepLinked(deepLink.locationOpen);
    setThemeId(getInitialThemeId({ search: window.location.search, storedTheme }));
    setLanguage(getInitialLanguage({ search: window.location.search, storedLanguage }));
    setThemeReady(true);
  }, []);

  useEffect(() => {
    function handlePopState() {
      selectionRequest.current += 1;
      setPendingTheme(null);
      const urlTheme = getThemeIdFromSearch(window.location.search);
      const deepLink = getDeepLinkState(window.location.search);
      if (urlTheme) setThemeId(urlTheme);
      setLanguage(getInitialLanguage({ search: window.location.search }));
      setPageIndex(deepLink.pageIndex);
      setLocationDeepLinked(deepLink.locationOpen);
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!themeReady) return;

    document.documentElement.dataset.invitationTheme = themeId;
    document.documentElement.lang = language;

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, themeId);
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Storage can be blocked; the URL still preserves the active theme.
    }

    const nextRelativeUrl = buildInvitationRelativeUrl(window.location, {
      themeId,
      language,
      pageIndex,
      locationOpen: locationDeepLinked && pageIndex === 2
    });
    const currentRelativeUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (nextRelativeUrl !== currentRelativeUrl) {
      window.history.replaceState(window.history.state, '', nextRelativeUrl);
    }
  }, [themeId, pageIndex, locationDeepLinked, themeReady, language]);

  useEffect(() => {
    if (!themeReady) return;
    warmThemeAssets(themeId, pageIndex);
  }, [pageIndex, themeId, themeReady, warmThemeAssets]);

  useEffect(() => {
    selectionRequest.current += 1;
    setPendingTheme(null);
  }, [pageIndex]);

  useEffect(() => {
    if (!themeReady || navigator.connection?.saveData || /(^|-)2g$/.test(navigator.connection?.effectiveType || '')) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      await warmThemeAssets(themeId, pageIndex, true);
      for (const id of THEME_IDS) {
        if (cancelled) return;
        if (id !== themeId) await warmThemeAssets(id, pageIndex, true);
      }
    }, 300);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [themeReady, themeId, pageIndex, warmThemeAssets]);

  useEffect(() => {
    if (pageIndex !== 2 && locationDeepLinked) setLocationDeepLinked(false);
  }, [pageIndex, locationDeepLinked]);

  useEffect(() => {
    function handleKeyboardNavigation(event) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target instanceof Element && event.target.closest(INTERACTIVE_SELECTOR)) return;

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setPageIndex((current) => previousPageIndex(current));
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setPageIndex((current) => nextPageIndex(current));
      } else if (event.key === 'Home') {
        event.preventDefault();
        setPageIndex(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        setPageIndex(INVITATION_PAGES.length - 1);
      }
    }

    window.addEventListener('keydown', handleKeyboardNavigation);
    return () => window.removeEventListener('keydown', handleKeyboardNavigation);
  }, []);

  async function changeTheme(nextThemeId) {
    const resolved = resolveThemeId(nextThemeId);
    const request = ++selectionRequest.current;
    if (resolved === themeId) { setPendingTheme(null); return; }
    setPendingTheme(resolved);
    await warmThemeAssets(resolved, pageIndex, true, 'high');
    if (request !== selectionRequest.current) return;
    setThemeId(resolved);
    setPendingTheme(null);
  }

  function goTo(index) {
    setPageIndex(Math.max(0, Math.min(INVITATION_PAGES.length - 1, index)));
  }

  function handleTouchStart(event) {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event) {
    if (touchStartX.current == null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    setPageIndex((current) => delta < 0 ? nextPageIndex(current) : previousPageIndex(current));
  }

  const activeTheme = getTheme(themeId);
  const themeStyle = {
    '--theme-accent': activeTheme.accent,
    '--theme-accent-dark': activeTheme.accentDark,
    '--theme-gold': activeTheme.gold,
    '--theme-soft': activeTheme.soft,
    '--theme-ink': activeTheme.ink
  };

  const pages = [
    <FrontCover key="front" themeId={themeId} onOpen={() => goTo(1)} />,
    <InsideLeft key="inside-left" themeId={themeId} />,
    <InsideRight
      key="inside-right"
      themeId={themeId}
      initialLocationOpen={locationDeepLinked}
      onLocationOpenChange={setLocationDeepLinked}
    />,
    <BackCover key="back" themeId={themeId} />
  ];

  return (
    <main
      className="bookApp"
      lang={language}
      style={themeStyle}
      data-invitation-theme={themeId}
      aria-busy={Boolean(pendingTheme)}
      data-theme-ready={themeReady ? 'true' : 'false'}
    >
      <LanguageSwitcher onLanguageChange={(value) => setLanguage(resolveLanguage(value))} />
      <ThemeSwitcher
        themeId={themeId}
        pendingTheme={pendingTheme}
        onThemeChange={changeTheme}
        onThemeWarm={(id) => warmThemeAssets(id, pageIndex)}
      />

      <div className="phase2bExperienceTools">
        <SmartSharePanel
          themeId={themeId}
          pageIndex={pageIndex}
          locationOpen={locationDeepLinked && pageIndex === 2}
        />
        <QrNfcPanel themeId={themeId} pageIndex={pageIndex} />
      </div>

      <section
        className={`bookStage page-${INVITATION_PAGES[pageIndex]}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-live="polite"
        aria-label={t('{page} invitation page in {theme}', { page: t(PAGE_LABELS[pageIndex]), theme: language === 'en' ? activeTheme.label : t(activeTheme.shortLabel) })}
      >
        <div className="pageViewport themeTransitionFrame" key={`${themeId}-${pageIndex}`}>
          {pages[pageIndex]}
        </div>
      </section>

      <nav className="bookNav" aria-label={t("Invitation pages")}>
        <button
          type="button"
          className="navArrow"
          onClick={() => setPageIndex((current) => previousPageIndex(current))}
          disabled={pageIndex === 0}
          aria-label={t("Previous page")}
        >
          ‹
        </button>

        <div className="pageDots">
          {PAGE_LABELS.map((label, index) => (
            <button
              type="button"
              key={label}
              className={index === pageIndex ? 'pageDot active' : 'pageDot'}
              onClick={() => goTo(index)}
              aria-label={t('Go to {page}', { page: t(label) })}
              aria-current={index === pageIndex ? 'page' : undefined}
              title={t(label)}
            />
          ))}
        </div>

        <span className="pageLabel">{t(PAGE_LABELS[pageIndex])}</span>

        <button
          type="button"
          className="navArrow"
          onClick={() => setPageIndex((current) => nextPageIndex(current))}
          disabled={pageIndex === INVITATION_PAGES.length - 1}
          aria-label={t("Next page")}
        >
          ›
        </button>
      </nav>

      <p className="swipeHint">{t("Swipe, use the arrows, or press \u2190 / \u2192 to explore the invitation")}</p>
    </main>
  );
}
