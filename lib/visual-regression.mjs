export const CRITICAL_VISUAL_VIEWPORTS = Object.freeze([
  Object.freeze({ name: 'small-phone', width: 320, height: 658 }),
  Object.freeze({ name: 'android', width: 360, height: 800 }),
  Object.freeze({ name: 'modern-phone', width: 390, height: 844 }),
  Object.freeze({ name: 'galaxy-a55-class', width: 412, height: 915 }),
  Object.freeze({ name: 'phone-landscape', width: 640, height: 360 }),
  Object.freeze({ name: 'tablet', width: 768, height: 1024 }),
  Object.freeze({ name: 'laptop', width: 1366, height: 768 }),
  Object.freeze({ name: 'large-desktop', width: 1920, height: 1080 })
]);

const statesByViewport = Object.freeze({
  'small-phone': [
    ['classic', 'details', 'bn'],
    ['blush', 'front', 'en'],
    ['magenta', 'family', 'ne']
  ],
  android: [
    ['classic', 'back', 'ne'],
    ['navy', 'front', 'bn'],
    ['plum', 'details', 'en']
  ],
  'modern-phone': [
    ['classic', 'front', 'en'],
    ['saffron', 'details', 'ne'],
    ['blush', 'family', 'bn']
  ],
  'galaxy-a55-class': [
    ['classic', 'family', 'bn'],
    ['magenta', 'back', 'en'],
    ['navy', 'details', 'ne']
  ],
  'phone-landscape': [
    ['classic', 'details', 'ne'],
    ['plum', 'front', 'bn'],
    ['saffron', 'back', 'en']
  ],
  tablet: [
    ['classic', 'back', 'bn'],
    ['blush', 'details', 'en'],
    ['magenta', 'front', 'ne']
  ],
  laptop: [
    ['classic', 'family', 'en'],
    ['navy', 'back', 'ne'],
    ['plum', 'details', 'bn']
  ],
  'large-desktop': [
    ['classic', 'front', 'ne'],
    ['saffron', 'family', 'en'],
    ['blush', 'back', 'bn']
  ]
});

export const VISUAL_REGRESSION_CASES = Object.freeze(
  CRITICAL_VISUAL_VIEWPORTS.flatMap((viewport) =>
    statesByViewport[viewport.name].map(([theme, page, language]) => Object.freeze({
      id: `${viewport.name}-${theme}-${page}-${language}`,
      viewport,
      theme,
      page,
      language
    }))
  )
);
