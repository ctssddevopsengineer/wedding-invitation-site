import { withBasePath } from './public-path.mjs';

export const DEFAULT_THEME_ID = 'classic';
export const THEME_STORAGE_KEY = 'sd-invitation-theme';

export const THEME_PAGE_ASSETS = Object.freeze(['front', 'insideLeft', 'insideRight', 'back']);

function asset(path) {
  return path ? withBasePath(path) : '';
}

function freezeAssets(themeId, { frontFile = 'front.png', insideLeftMonogram = true, insideRightMonogram = false, backMonogram = true } = {}) {
  return Object.freeze({
    front: asset(`/themes/${themeId}/${frontFile}`),
    thumbnail: asset(`/themes/${themeId}/thumbnail.webp`),
    insideLeft: asset(`/themes/${themeId}/inside-left.png`),
    insideLeftMonogram: insideLeftMonogram ? asset(`/themes/${themeId}/inside-left-monogram.png`) : '',
    insideRight: asset(`/themes/${themeId}/inside-right.png`),
    insideRightMonogram: insideRightMonogram ? asset(`/themes/${themeId}/inside-right-monogram.png`) : '',
    back: asset(`/themes/${themeId}/back.png`),
    backMonogram: backMonogram ? asset(`/themes/${themeId}/back-monogram.png`) : ''
  });
}

function createTheme({ id, label, shortLabel, swatch, accent, accentDark, gold, soft, ink, frontFile = 'front.png', dynamicFront = false, blankFront = false, dynamicLocationLabel = false, showLocationIcon = false, insideLeftMonogram = true, insideRightMonogram = false, backMonogram = true }) {
  return Object.freeze({
    id,
    label,
    shortLabel,
    swatch,
    accent,
    accentDark,
    gold,
    soft,
    ink,
    dynamicFront,
    blankFront,
    dynamicLocationLabel,
    showLocationIcon,
    assets: freezeAssets(id, { frontFile, insideLeftMonogram, insideRightMonogram, backMonogram })
  });
}

export const THEMES = Object.freeze({
  classic: createTheme({
    id: 'classic',
    label: 'Original Deep Red',
    shortLabel: 'Deep Red',
    swatch: '#71131b',
    accent: '#71131b',
    accentDark: '#3f090e',
    gold: '#b78a3c',
    soft: '#f7eedb',
    ink: '#3f2b22',
    frontFile: 'front-blank.jpg',
    blankFront: true
  }),
  blush: createTheme({
    id: 'blush',
    label: 'Blush Rose / Baby Pink',
    shortLabel: 'Blush Rose',
    swatch: '#d999a8',
    accent: '#a14f66',
    accentDark: '#6f3245',
    gold: '#b88b43',
    soft: '#fff3f4',
    ink: '#4e3737',
    frontFile: 'front-enhanced.jpg',
    blankFront: true,
    insideRightMonogram: true
  }),
  magenta: createTheme({
    id: 'magenta',
    label: 'Rani Magenta',
    shortLabel: 'Rani Magenta',
    swatch: '#b20b57',
    accent: '#991345',
    accentDark: '#640b2d',
    gold: '#ba8b39',
    soft: '#fff0e4',
    ink: '#4b2b2d',
    dynamicFront: true,
    dynamicLocationLabel: true,
    showLocationIcon: true,
    insideRightMonogram: true
  }),
  navy: createTheme({
    id: 'navy',
    label: 'Royal Navy',
    shortLabel: 'Royal Navy',
    swatch: '#0b2a4a',
    accent: '#12385f',
    accentDark: '#071c32',
    gold: '#b98a34',
    soft: '#fbefd7',
    ink: '#25354a',
    dynamicFront: true,
    dynamicLocationLabel: true,
    showLocationIcon: true,
    insideLeftMonogram: false,
    insideRightMonogram: true,
    backMonogram: false
  }),
  plum: createTheme({
    id: 'plum',
    label: 'Royal Plum',
    shortLabel: 'Royal Plum',
    swatch: '#5a1977',
    accent: '#641f7d',
    accentDark: '#351042',
    gold: '#b78a36',
    soft: '#fbefd7',
    ink: '#3e2a46',
    dynamicFront: true,
    dynamicLocationLabel: true,
    showLocationIcon: true,
    insideLeftMonogram: false,
    insideRightMonogram: true,
    backMonogram: false
  }),
  saffron: createTheme({
    id: 'saffron',
    label: 'Saffron Gold',
    shortLabel: 'Saffron Gold',
    swatch: '#cd7a19',
    accent: '#b96b14',
    accentDark: '#7a4510',
    gold: '#c28d2d',
    soft: '#fff3e0',
    ink: '#4f3822',
    dynamicFront: true,
    dynamicLocationLabel: true,
    showLocationIcon: false,
    insideLeftMonogram: false,
    insideRightMonogram: true,
    backMonogram: false
  })
});

export const THEME_ALIASES = Object.freeze({
  pink: 'blush',
  rani: 'magenta',
  royalNavy: 'navy',
  royalPlum: 'plum',
  saffronGold: 'saffron'
});

export const THEME_IDS = Object.freeze(Object.keys(THEMES));

export function isThemeId(value) {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(THEMES, value);
}

export function resolveThemeId(value) {
  if (isThemeId(value)) return value;
  if (typeof value === 'string' && THEME_ALIASES[value]) return THEME_ALIASES[value];
  return DEFAULT_THEME_ID;
}

export function getTheme(themeId) {
  return THEMES[resolveThemeId(themeId)];
}

export function getThemeAsset(themeId, assetName) {
  const theme = getTheme(themeId);
  return theme.assets[assetName] ?? THEMES[DEFAULT_THEME_ID].assets[assetName] ?? '';
}
