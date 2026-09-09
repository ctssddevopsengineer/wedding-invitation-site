import { getThemeAsset, THEME_PAGE_ASSETS, WEDDING_MONOGRAM } from './theme.mjs';

export function optimizedArtworkUrl(src) {
  return typeof src === 'string' && /(?:\/themes\/[^/]+\/[^/]+\.(?:png|jpe?g)|\/images\/wedding-monogram\.png)$/.test(src) ? src.replace(/\.(?:png|jpe?g)$/, '.webp') : src;
}
export function getPageArtworkAssets(themeId, pageIndex) {
  const index = Math.max(0, Math.min(3, Number(pageIndex) || 0));
  const monogram = index !== 2 || getThemeAsset(themeId, 'insideRightMonogram') ? WEDDING_MONOGRAM : '';
  return [getThemeAsset(themeId, THEME_PAGE_ASSETS[index]), monogram].filter(Boolean);
}

// Failed requests are evicted so a later hover/selection can retry. Decode before
// swapping themes to avoid an empty frame while the browser decompresses artwork.
export function createArtworkLoader(createImage) {
  const cache = new Map();
  return function load(src, priority = 'low') {
    const url = optimizedArtworkUrl(src);
    if (cache.has(url)) {
      const entry = cache.get(url);
      if (priority === 'high' && entry.image) entry.image.fetchPriority = 'high';
      return entry.promise;
    }
    const image = createImage();
    const promise = new Promise((resolve) => {
      let timer;
      let attemptedOriginal = false;
      const finish = (success) => {
        clearTimeout(timer);
        image.onload = image.onerror = null;
        if (!success) cache.delete(url);
        else if (cache.has(url)) cache.get(url).image = null; // Do not retain decoded bitmaps for every theme.
        resolve(success);
      };
      image.decoding = 'async';
      image.fetchPriority = priority;
      image.onload = async () => {
        try { await image.decode?.(); } catch { /* Loaded image is still usable. */ }
        finish(true);
      };
      image.onerror = () => {
        if (!attemptedOriginal && url !== src) {
          attemptedOriginal = true;
          image.src = src;
        } else finish(false);
      };
      timer = setTimeout(() => finish(false), 12000);
      image.src = url;
    });
    cache.set(url, { image, promise });
    return promise;
  };
}
