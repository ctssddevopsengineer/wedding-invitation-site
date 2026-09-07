'use client';

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/components/LanguageProvider';
import { withBasePath } from '@/lib/public-path.mjs';
import styles from './WeddingEntrance.module.css';

export default function WeddingEntrance({ phase, onStatusChange }) {
  const { t, event: EVENT } = useLanguage();
  const [loaded, setLoaded] = useState({ groom: false, bride: false });
  const [failed, setFailed] = useState(false);
  const [backgroundFailed, setBackgroundFailed] = useState(false);
  const [entered, setEntered] = useState(false);
  const mounted = useRef(false);
  const status = failed ? 'failed' : loaded.groom && loaded.bride ? 'ready' : 'pending';
  const visible = ['scene', 'walking', 'together', 'revealing'].includes(phase);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => { onStatusChange(status); }, [status, onStatusChange]);
  useEffect(() => { if (phase === 'walking') setEntered(true); }, [phase]);

  async function characterLoaded(event, name) {
    const image = event.currentTarget;
    try {
      await image.decode();
      if (mounted.current) setLoaded((current) => ({ ...current, [name]: true }));
    } catch {
      if (mounted.current) setFailed(true);
    }
  }

  return (
    <div className={styles.weddingScene} data-wedding-scene data-visible={visible} data-phase={phase} data-characters={status} data-entered={entered} aria-hidden="true">
      {!backgroundFailed && (
        <picture>
          <source media="(max-width: 680px)" srcSet={withBasePath('/intro/wedding-scene-mobile.webp')} />
          <img className={styles.backdrop} src={withBasePath('/intro/wedding-scene.webp')} alt="" decoding="async" onError={() => setBackgroundFailed(true)} />
        </picture>
      )}
      <div className={styles.vignette} />
      <div className={styles.caption} data-entrance-caption>
        <p>{t('Two cultures. Two families.')}</p>
        <h2>{t('One beautiful journey.')}</h2>
        <span>{EVENT.couple.includes('{{') ? 'S & D' : EVENT.couple}</span>
      </div>
      <div className={styles.procession} data-procession>
        {['groom', 'bride'].map((name) => (
          <div key={name} className={`${styles.person} ${styles[name]}`} data-character={name}>
            <img
              className={styles.figure}
              src={withBasePath(`/intro/${name}.webp`)}
              alt=""
              decoding="async"
              draggable={false}
              onLoad={(event) => characterLoaded(event, name)}
              onError={() => setFailed(true)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
