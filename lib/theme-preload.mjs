import { getThemeAsset, THEME_PAGE_ASSETS } from './theme.mjs';

export function getAdjacentPageIndexes(pageIndex, pageCount = THEME_PAGE_ASSETS.length) {
  const safe = Math.max(0, Math.min(pageCount - 1, Number(pageIndex) || 0));
  const indexes = [safe];
  if (safe > 0) indexes.push(safe - 1);
  if (safe < pageCount - 1) indexes.push(safe + 1);
  return indexes;
}

export function getThemeWarmupAssets(themeId, pageIndex) {
  const assets = getAdjacentPageIndexes(pageIndex)
    .map((index) => getThemeAsset(themeId, THEME_PAGE_ASSETS[index]))
    .filter(Boolean);

  const insideRightIndex = THEME_PAGE_ASSETS.indexOf('insideRight');
  if (getAdjacentPageIndexes(pageIndex).includes(insideRightIndex)) {
    const monogram = getThemeAsset(themeId, 'insideRightMonogram');
    if (monogram) assets.push(monogram);
  }

  return [...new Set(assets)];
}
