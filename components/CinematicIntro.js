'use client';

import { useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { useLanguage } from '@/components/LanguageProvider';
import { LANGUAGES } from '@/lib/locale.mjs';
import { THEMES, THEME_IDS } from '@/lib/theme.mjs';
import { advanceIntro, ENTRANCE_PHASES, INTRO_PHASES } from '@/lib/intro.mjs';
import IntroDropdown from '@/components/IntroDropdown';
import WeddingEntrance from '@/components/WeddingEntrance';
import EnvelopeCelebration from '@/components/EnvelopeCelebration';
import { isEnvelopeCelebrationPhase } from '@/lib/envelope-celebration.mjs';
import { useMusic } from '@/components/MusicProvider';
import MusicControl from '@/components/MusicControl';
import styles from './CinematicIntro.module.css';

// Alpona-inspired line work is drawn independently of the approved theme art.
function Alpona({ className }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" aria-hidden="true" focusable="false">
      <g stroke="currentColor" strokeWidth=".9">
        <circle cx="100" cy="100" r="30" />
        <circle cx="100" cy="100" r="34" strokeDasharray="1 4" />
        <circle cx="100" cy="100" r="72" />
        <circle cx="100" cy="100" r="77" strokeDasharray="1 5" />
        {Array.from({ length: 16 }, (_, i) => (
          <g key={i} transform={`rotate(${i * 22.5} 100 100)`}>
            <path d="M100 64 Q77 46 100 24 Q123 46 100 64Z M100 62 Q92 47 100 34 Q108 47 100 62Z M100 22 Q91 12 100 4 Q109 12 100 22Z" />
            <circle cx="100" cy="83" r="2" />
          </g>
        ))}
      </g>
    </svg>
  );
}

export default function CinematicIntro({
  active,
  ready,
  onComplete,
  language,
  themeId,
  pendingTheme,
  onLanguageChange,
  onThemeChange,
  children
}) {
  const { t, event: EVENT } = useLanguage();
  const music = useMusic();
  const [phase, dispatch] = useReducer(advanceIntro, 'closed');
  const [entranceStatus, setEntranceStatus] = useState('pending');
  const entranceStatusRef = useRef('pending');
  entranceStatusRef.current = entranceStatus;
  const root = useRef(null);
  const openButton = useRef(null);
  const skipButton = useRef(null);
  const reducedMotion = useRef(false);
  const wasActive = useRef(false);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    function update() {
      reducedMotion.current = preference.matches;
      if (preference.matches && phase !== 'closed' && active) dispatch('reduce-motion');
    }
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, [active, phase]);

  useLayoutEffect(() => {
    if (!active) {
      dispatch('reset');
      setEntranceStatus('pending');
      if (wasActive.current) {
        const stage = root.current?.querySelector('.bookStage');
        stage?.scrollIntoView({ block: 'start', behavior: 'instant' });
        stage?.focus({ preventScroll: true });
        wasActive.current = false;
      }
      return;
    }
    if (!ready) return;
    wasActive.current = true;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    openButton.current?.focus({ preventScroll: true });
    return () => { document.body.style.overflow = oldOverflow; };
  }, [active, ready]);

  useLayoutEffect(() => {
    if (!active || !ready) return;
    if (phase === 'complete') { onComplete(); return; }
    const step = INTRO_PHASES[phase];
    if (!step?.next) return;
    // Timers bound each phase; completion and focus settle before the next paint.
    const timer = window.setTimeout(() => {
      // Slow downloads cannot hold the invitation hostage or arrive mid-walk.
      dispatch(phase === 'scene' && entranceStatusRef.current !== 'ready' ? 'assets-unavailable' : 'advance');
    }, step.duration);
    return () => window.clearTimeout(timer);
  }, [active, ready, phase, onComplete]);

  useEffect(() => {
    if (active && entranceStatus === 'failed' && ENTRANCE_PHASES.includes(phase)) dispatch('assets-unavailable');
  }, [active, phase, entranceStatus]);

  function open() {
    // Opening can be queued during hydration or an artwork download.
    // Phase timers still wait for initialization through `ready`.
    if (phase !== 'closed') return;
    skipButton.current?.focus({ preventScroll: true });
    dispatch(reducedMotion.current ? 'reduce-motion' : 'open');
    music.openIntro();
  }

  function handleKeys(event) {
    if (!active) return;
    if (event.key === 'Escape') { event.preventDefault(); dispatch('skip'); }
    if (event.key !== 'Tab') return;
    const controls = [...root.current.querySelectorAll('[data-intro-control]:not(:disabled)')];
    const index = controls.indexOf(document.activeElement);
    if (!controls.length) return;
    event.preventDefault();
    controls[(index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length].focus();
  }

  return (
    <div
      ref={root}
      className={active ? styles.overlay : styles.passthrough}
      data-cinematic-intro={active ? (phase === 'complete' ? 'finishing' : phase) : 'complete'}
      role={active ? 'dialog' : undefined}
      aria-modal={active ? true : undefined}
      aria-labelledby={active ? 'intro-title' : undefined}
      onKeyDown={handleKeys}
    >
      {active && ready && isEnvelopeCelebrationPhase(phase) && <EnvelopeCelebration />}
      {active && ready && phase !== 'closed' && phase !== 'complete' && (
        <WeddingEntrance phase={phase} onStatusChange={setEntranceStatus} />
      )}
      {active && (
        <>
          <MusicControl intro />
          <div className={styles.border} aria-hidden="true" />
          <button ref={skipButton} className={styles.skip} type="button" data-intro-control data-intro-skip onClick={() => dispatch('skip')}>
            {t('Skip Intro')} <span aria-hidden="true">↗</span>
          </button>
          <header className={styles.heading}>
            <p className={styles.eyebrow}>{t('A beautiful beginning')}</p>
            <h1 id="intro-title">{t('You are warmly invited')}</h1>
            <p className={styles.names}>{EVENT.couple.includes('{{') ? <>S <em>&amp;</em> D</> : <>{EVENT.groomName} <em>&amp;</em> {EVENT.brideName}</>}</p>
          </header>
        </>
      )}

      <div className={active ? styles.scene : styles.passthrough} data-envelope-scene={active ? true : undefined}>
        {active && <div className={styles.envelopeBack} aria-hidden="true" />}
        {/* The existing stage is mounted exactly once, through every phase. */}
        <div className={active ? styles.cardMask : styles.passthrough}>
          <div className={active ? styles.card : styles.revealedCard} inert={active} aria-hidden={active ? true : undefined}>
            {children}
          </div>
        </div>
        {active && (
          <>
            <div className={styles.pocket} aria-hidden="true">
              <Alpona className={styles.pocketMotifLeft} />
              <Alpona className={styles.pocketMotifRight} />
              <svg className={styles.seams} viewBox="0 0 520 340" preserveAspectRatio="none" fill="none">
                <path d="M0 0 260 195 520 0 M0 340 202 163 M520 340 318 163" />
                <path d="M10 21 260 208 510 21 M14 337 210 170 M506 337 310 170" strokeDasharray="2 5" />
              </svg>
            </div>
            <div className={styles.flap} aria-hidden="true">
              <div className={styles.flapFace}>
                <Alpona className={styles.flapMotif} />
                <svg viewBox="0 0 520 220" preserveAspectRatio="none" fill="none"><path d="M5 5 260 210 515 5 M22 4 260 197 498 4" /></svg>
              </div>
              <div className={styles.flapLining} />
            </div>
            <div className={styles.seal} aria-hidden="true"><span>S<small>&amp;</small>D</span></div>
          </>
        )}
      </div>

      {active && (
        <footer className={styles.footer}>
          {phase === 'closed' && (
            <div className={styles.preferences} data-intro-preferences>
              <IntroDropdown
                data-intro-language
                label={t('Language')}
                value={language}
                options={Object.entries(LANGUAGES).map(([value, label]) => ({ value, label }))}
                onChange={onLanguageChange}
              />
              <IntroDropdown
                data-intro-theme
                label={t('Colour Theme')}
                ariaLabel={t('Choose invitation colour theme')}
                value={themeId}
                options={THEME_IDS.map((value) => ({ value, label: t(THEMES[value].shortLabel) }))}
                onChange={onThemeChange}
                busy={Boolean(pendingTheme)}
              />
            </div>
          )}
          <button ref={openButton} className={styles.open} type="button" data-intro-control data-intro-open disabled={phase !== 'closed'} onClick={open}>
            {t('Open Invitation')} <span aria-hidden="true">→</span>
          </button>
          <p className={styles.hint} role="status">{phase === 'closed' ? t('An invitation sealed with love') : t('Your invitation awaits')}</p>
        </footer>
      )}
    </div>
  );
}
