const DESKTOP_TYPES = ['petal', 'spark', 'petal', 'spark', 'spark', 'petal', 'spark', 'flower', 'petal', 'spark'];
const MOBILE_TYPES = ['petal', 'spark', 'petal', 'flower'];

export function isParticlePhase(phase) {
  return phase === 'walking' || phase === 'together';
}

// A fixed field avoids random hydration differences and per-frame allocation.
export function createWeddingParticles(compact = false) {
  const types = compact ? MOBILE_TYPES : DESKTOP_TYPES;
  return ['left', 'right'].flatMap((side, sideIndex) => types.map((type, index) => {
    const duration = type === 'flower' ? 14 : type === 'spark' ? 6 + index % 3 : 8 + index % 3;
    return {
      id: `${side}-${index}`,
      side,
      type,
      position: 14 + (index * 23 + sideIndex * 11) % 60,
      size: type === 'spark' ? 2 + index % 2 : type === 'flower' ? 8 : (compact ? 8 : 10) + index % 3,
      duration,
      delay: -((index * 1.7 + sideIndex * 2.3) % duration),
      drift: (index % 2 ? -1 : 1) * (compact ? 4 : 12),
      rotation: 35 + (index * 47 + sideIndex * 31) % 180
    };
  }));
}
