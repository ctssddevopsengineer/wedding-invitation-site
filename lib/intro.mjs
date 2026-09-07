export const INTRO_STORAGE_KEY = 'sd-invitation-intro-seen-v1';

export const INTRO_PHASES = Object.freeze({
  closed: Object.freeze({ next: null, duration: 0 }),
  opening: Object.freeze({ next: 'rising', duration: 1000 }),
  rising: Object.freeze({ next: 'revealing', duration: 1500 }),
  revealing: Object.freeze({ next: 'complete', duration: 500 })
});

export function shouldShowIntro({ pageIndex = 0, seen = false } = {}) {
  return pageIndex === 0 && !seen;
}

export function advanceIntro(phase, action) {
  if (action === 'reset') return 'closed';
  if (action === 'skip' || action === 'reduce-motion') return 'complete';
  if (action === 'open') return phase === 'closed' ? 'opening' : phase;
  if (action === 'advance') return INTRO_PHASES[phase]?.next ?? phase;
  return phase;
}
