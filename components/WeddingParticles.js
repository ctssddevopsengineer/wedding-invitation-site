'use client';

import { useEffect, useMemo, useState } from 'react';
import { createWeddingParticles } from '@/lib/wedding-particles.mjs';
import styles from './WeddingParticles.module.css';

function FloralMark() {
  return (
    <svg viewBox="0 0 20 20" focusable="false" aria-hidden="true">
      {[0, 72, 144, 216, 288].map((angle) => <ellipse key={angle} cx="10" cy="5.5" rx="2.7" ry="4" transform={`rotate(${angle} 10 10)`} />)}
      <circle cx="10" cy="10" r="1.8" />
    </svg>
  );
}

export default function WeddingParticles({ active, captionRef }) {
  const [enabled, setEnabled] = useState(false);
  const [compact, setCompact] = useState(false);
  const [paused, setPaused] = useState(false);
  const [top, setTop] = useState(null);
  const particles = useMemo(() => createWeddingParticles(compact), [compact]);

  useEffect(() => {
    if (!active) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = window.matchMedia('(max-width: 680px)');
    const syncPreferences = () => { setEnabled(!motion.matches); setCompact(mobile.matches); };
    const syncVisibility = () => setPaused(document.hidden);
    syncPreferences();
    syncVisibility();
    motion.addEventListener('change', syncPreferences);
    mobile.addEventListener('change', syncPreferences);
    document.addEventListener('visibilitychange', syncVisibility);
    return () => {
      motion.removeEventListener('change', syncPreferences);
      mobile.removeEventListener('change', syncPreferences);
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  }, [active]);

  useEffect(() => {
    if (!active || !enabled) return;
    // Measure only on layout changes, never in an animation loop. This also
    // protects wrapped/localized text and late-loading fonts on narrow screens.
    const measure = () => {
      const viewportHeight = window.innerHeight;
      const textBottom = captionRef.current?.getBoundingClientRect().bottom ?? viewportHeight * .4;
      setTop(Math.ceil(Math.max(textBottom + 24, viewportHeight * .28)));
    };
    measure();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    if (captionRef.current) observer?.observe(captionRef.current);
    window.addEventListener('resize', measure);
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure); };
  }, [active, enabled, captionRef]);

  if (!active || !enabled || top === null) return null;

  return (
    <div className={styles.field} data-wedding-particles data-paused={paused} data-compact={compact} aria-hidden="true" style={{ '--particles-top': `${top}px` }}>
      {['left', 'right'].map((side) => (
        <div key={side} className={`${styles.lane} ${styles[side]}`} data-particle-lane={side}>
          {particles.filter((particle) => particle.side === side).map((particle) => (
            <span
              key={particle.id}
              className={styles.particle}
              data-particle={particle.type}
              style={{
                left: `${particle.position}%`,
                '--size': `${particle.size}px`,
                '--duration': `${particle.duration}s`,
                '--delay': `${particle.delay}s`,
                '--drift': `${particle.drift}px`,
                '--rotation': `${particle.rotation}deg`
              }}
            >
              <span className={styles[particle.type]}>{particle.type === 'flower' && <FloralMark />}</span>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
