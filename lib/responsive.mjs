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

// Exact CSS pixel viewports, including legacy coverage at 1100px height.
// Galaxy A55-class coverage includes 360x780, 412x892 and 412x915; browser scaling varies.
// 374x812 locks the strict "below 375px" all-page parchment scrolling boundary; 375px remains fixed-layout.
export const RESPONSIVE_VALIDATION_VIEWPORTS = Object.freeze(
  [...new Set((
    '600x1024 360x740 320x658 712x1138 800x1280 384x640 640x360 ' +
    '412x823 320x533 480x854 393x786 353x745 240x320 184x224 162x197 375x667 414x896 ' +
    '428x926 393x852 402x874 440x956 448x997 412x924 427x952 1024x1366 ' +
    '344x882 853x1280 411x731 411x823 320x480 414x736 375x812 374x812 412x892 ' +
    '360x640 360x800 390x844 393x873 412x915 360x780 768x1024 820x1180 ' +
    '1024x768 1280x800 1366x768 1440x900 1920x1080 375x1100 ' +
    RESPONSIVE_VALIDATION_WIDTHS.map(width => `${width}x1100`).join(' ')
  ).split(' '))].map(size => {
    const [width, height] = size.split('x').map(Number);
    return Object.freeze({ width, height });
  })
);
