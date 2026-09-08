export const RESPONSIVE_VALIDATION_WIDTHS = Object.freeze([320, 360, 390, 430, 540, 768, 820, 1024, 1280, 1440, 1920]);

// CSS pixels, not physical panel pixels. The A55 entry is an emulation at
// 2.625 DPR; browser chrome/display scaling can change the actual viewport.
export const RESPONSIVE_VIEWPORTS = Object.freeze([
  [360, 640], [360, 800], [375, 667], [390, 844], [393, 873], [412, 915],
  [412, 892], [768, 1024], [820, 1180], [1024, 768], [1280, 800],
  [1366, 768], [1440, 900], [1920, 1080]
].map(([width, height]) => Object.freeze({ width, height })));

export function viewportBucket(width) {
  const value = Number(width);
  if (!Number.isFinite(value) || value <= 0) return 'invalid';
  if (value <= 360) return 'compact-phone';
  if (value <= 430) return 'phone';
  if (value <= 680) return 'large-phone';
  if (value <= 1024) return 'tablet';
  if (value <= 1440) return 'desktop';
  return 'large-desktop';
}
