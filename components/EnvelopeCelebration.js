'use client';

import { useEffect, useMemo, useState } from 'react';
import { createEnvelopeCelebration } from '@/lib/envelope-celebration.mjs';
import styles from './EnvelopeCelebration.module.css';

export default function EnvelopeCelebration() {
  const [preferences, setPreferences] = useState({ enabled: false, compact: false, paused: false });
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = window.matchMedia('(max-width: 680px)');
    const sync = () => setPreferences({ enabled: !motion.matches, compact: mobile.matches, paused: document.hidden });
    sync();
    motion.addEventListener('change', sync);
    mobile.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      motion.removeEventListener('change', sync);
      mobile.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);
  const particles = useMemo(() => createEnvelopeCelebration(preferences.compact), [preferences.compact]);
  if (!preferences.enabled) return null;
  return (
    <div className={styles.field} data-envelope-celebration data-paused={preferences.paused} aria-hidden="true">
      {particles.map((particle) => (
        <span key={particle.id} className={`${styles.particle} ${styles[particle.type]} ${styles[particle.side]}`}
          data-celebration-particle={particle.type}
          style={{ '--x': `${particle.x}px`, '--y-mid': `${particle.y * .75 + particle.gravity * .25}px`, '--y-end': `${particle.y + particle.gravity}px`, '--size': `${particle.size}px`, '--angle': `${particle.angle}deg`, '--origin': `${particle.origin}%`, '--y': `${particle.y}px`, '--delay': `${particle.delay}s`, '--duration': `${particle.duration}s`, '--rotation': `${particle.rotation}deg`, '--color': particle.color }}>
          {particle.type === 'ribbon' ? (
            <svg className={styles.strip} viewBox="0 0 16 64" fill="none" focusable="false">
              <path d="M8 1 C-5 14 22 20 8 33 S-3 49 10 63" stroke="currentColor" strokeWidth="5" />
              <path d="M7 1 C-6 14 21 20 7 33 S-4 49 9 63" stroke="#fff8df" strokeOpacity=".65" strokeWidth="1" />
            </svg>
          ) : <i className={styles.ember} />}
        </span>
      ))}
    </div>
  );
}
