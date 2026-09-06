import { resolveLanguage } from './locale.mjs';
import { INVITATION_PAGES } from './navigation.mjs';
import { resolveThemeId } from './theme.mjs';

export const PAGE_QUERY_PARAM = 'page';
export const PAGE_DEEP_LINKS = Object.freeze(['front', 'family', 'details', 'location', 'back']);

const PAGE_INDEX_BY_LINK = Object.freeze({
  front: 0,
  family: 1,
  details: 2,
  location: 2,
  back: 3
});

const PAGE_ALIASES = Object.freeze({
  'inside-left': 'family',
  'inside-right': 'details',
  reception: 'details',
  map: 'location'
});

export function resolvePageDeepLink(value) {
  if (typeof value !== 'string' || !value.trim()) return 'front';
  const normalized = value.trim().toLowerCase();
  if (PAGE_DEEP_LINKS.includes(normalized)) return normalized;
  return PAGE_ALIASES[normalized] ?? 'front';
}

export function getPageDeepLinkFromSearch(search = '') {
  const params = new URLSearchParams(search);
  if (!params.has(PAGE_QUERY_PARAM)) return null;
  return resolvePageDeepLink(params.get(PAGE_QUERY_PARAM));
}

export function pageIndexFromDeepLink(pageLink = 'front') {
  return PAGE_INDEX_BY_LINK[resolvePageDeepLink(pageLink)] ?? 0;
}

export function deepLinkFromPageIndex(pageIndex = 0, { locationOpen = false } = {}) {
  if (locationOpen && pageIndex === 2) return 'location';
  const normalizedIndex = Math.max(0, Math.min(INVITATION_PAGES.length - 1, Number(pageIndex) || 0));
  return ['front', 'family', 'details', 'back'][normalizedIndex];
}

export function getDeepLinkState(search = '') {
  const pageLink = getPageDeepLinkFromSearch(search) ?? 'front';
  return Object.freeze({
    pageLink,
    pageIndex: pageIndexFromDeepLink(pageLink),
    locationOpen: pageLink === 'location'
  });
}

export function getInitialDeepLinkState(search = '', navigationType = 'navigate') {
  if (navigationType === 'reload') {
    return Object.freeze({
      pageLink: 'front',
      pageIndex: 0,
      locationOpen: false
    });
  }
  return getDeepLinkState(search);
}

export function buildInvitationRelativeUrl(
  { pathname = '/', search = '', hash = '' } = {},
  { themeId, pageIndex = 0, pageLink = null, locationOpen = false, language } = {}
) {
  const params = new URLSearchParams(search);
  if (themeId) params.set('theme', resolveThemeId(themeId));
  if (language) params.set('lang', resolveLanguage(language));
  const resolvedPage = pageLink ? resolvePageDeepLink(pageLink) : deepLinkFromPageIndex(pageIndex, { locationOpen });
  params.set(PAGE_QUERY_PARAM, resolvedPage);
  const query = params.toString();
  return `${pathname || '/'}${query ? `?${query}` : ''}${hash || ''}`;
}

export function buildInvitationAbsoluteUrl(locationLike, options = {}) {
  const origin = locationLike?.origin ?? '';
  return `${origin}${buildInvitationRelativeUrl(locationLike, options)}`;
}
