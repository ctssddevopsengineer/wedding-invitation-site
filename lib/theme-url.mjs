import { DEFAULT_THEME_ID, resolveThemeId } from './theme.mjs';

export const THEME_QUERY_PARAM = 'theme';

export function getThemeIdFromSearch(search = '') {
  const params = new URLSearchParams(search);
  if (!params.has(THEME_QUERY_PARAM)) return null;
  return resolveThemeId(params.get(THEME_QUERY_PARAM));
}

export function getInitialThemeId({ search = '', storedTheme = null } = {}) {
  const urlTheme = getThemeIdFromSearch(search);
  if (urlTheme) return urlTheme;
  return storedTheme ? resolveThemeId(storedTheme) : DEFAULT_THEME_ID;
}

export function buildThemeRelativeUrl({ pathname = '/', search = '', hash = '' } = {}, themeId) {
  const params = new URLSearchParams(search);
  params.set(THEME_QUERY_PARAM, resolveThemeId(themeId));
  const query = params.toString();
  return `${pathname || '/'}${query ? `?${query}` : ''}${hash || ''}`;
}
