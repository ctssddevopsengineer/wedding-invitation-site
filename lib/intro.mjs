export const INTRO_STORAGE_KEY = 'sd-invitation-intro-seen-v1';

export const INTRO_PHASES = Object.freeze({
  closed: Object.freeze({ next: null, duration: 0 }),
  opening: Object.freeze({ next: 'rising', duration: 1400 }),
  rising: Object.freeze({ next: 'scene', duration: 4600 }),
  scene: Object.freeze({ next: 'walking', duration: 850 }),
  walking: Object.freeze({ next: 'together', duration: 6000 }),
  together: Object.freeze({ next: 'revealing', duration: 2400 }),
  revealing: Object.freeze({ next: 'complete', duration: 700 })
});

export const ENTRANCE_PHASES = Object.freeze(['scene', 'walking', 'together']);

export function shouldShowIntro({ pageIndex = 0, seen = false } = {}) {
  return pageIndex === 0 && !seen;
}

export function advanceIntro(phase, action) {
  if (action === 'reset') return 'closed';
  if (action === 'skip' || action === 'reduce-motion') return 'complete';
  if (action === 'assets-unavailable') return ENTRANCE_PHASES.includes(phase) ? 'revealing' : phase;
  if (action === 'open') return phase === 'closed' ? 'opening' : phase;
  if (action === 'advance') return INTRO_PHASES[phase]?.next ?? phase;
  return phase;
}
