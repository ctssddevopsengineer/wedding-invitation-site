export const RESPONSIVE_VALIDATION_WIDTHS = Object.freeze([320, 360, 390, 430, 540, 768, 820, 1024, 1280, 1440, 1920]);

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
