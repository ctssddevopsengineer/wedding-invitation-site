'use client';

import { useMusic } from './MusicProvider';
import { useLanguage } from './LanguageProvider';
import styles from './MusicControl.module.css';

export default function MusicControl({ intro = false }) {
  const { muted, status, ready, toggle } = useMusic();
  const { t } = useLanguage();
  const label = muted ? 'Unmute music' : status === 'error' ? 'Retry music' :
    status === 'paused' || (status === 'idle' && !intro) ? 'Play music' : 'Mute music';
  const quiet = muted || status === 'idle' || status === 'paused' || status === 'error';
  return (
    <button
      className={styles.control}
      type="button"
      data-music-control
      data-music-state={status}
      data-music-muted={muted}
      data-intro-control={intro ? true : undefined}
      disabled={!ready}
      aria-label={t(label)}
      title={t(label)}
      onClick={toggle}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 5 6 9H3v6h3l5 4V5Z" />
        {quiet ? <path d="m16 9 5 6m0-6-5 6" /> : <><path d="M15 8a6 6 0 0 1 0 8" /><path d="M18 5a10 10 0 0 1 0 14" /></>}
      </svg>
      <span>{t(label)}</span>
    </button>
  );
}
