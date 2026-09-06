export const INVITATION_PAGES = Object.freeze([
  'front',
  'inside-left',
  'inside-right',
  'back'
]);

export function clampPageIndex(index) {
  const numeric = Number.isFinite(Number(index)) ? Number(index) : 0;
  return Math.min(INVITATION_PAGES.length - 1, Math.max(0, Math.trunc(numeric)));
}

export function nextPageIndex(index) {
  return clampPageIndex(clampPageIndex(index) + 1);
}

export function previousPageIndex(index) {
  return clampPageIndex(clampPageIndex(index) - 1);
}
