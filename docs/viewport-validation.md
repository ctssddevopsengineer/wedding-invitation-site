# Responsive validation

`lib/responsive.mjs` lists 56 distinct CSS-pixel viewports: every requested numeric pair, 360×780 as additional Galaxy A55-class coverage, and the previous 11 widths and the former browser-test width of 375px at 1100px height. Duplicate requests are tested once. Device display scaling and browser chrome can change the effective viewport; the matrix also includes 412×892 and 412×915.

Run against a fresh production export:

```sh
# Set the required event environment variables first (see README).
npm run config:render
npm run build
BROWSER_CHANNEL=chrome REPORT_PATH=/tmp/responsive-report.json npm run test:browser
npm test
BROWSER_CHANNEL=chrome npm run test:intro
```

The browser matrix renders six themes, three languages and four invitation pages at each viewport (4,032 combinations). It checks horizontal document overflow, card containment, rendered text-fragment collisions, artwork loading, language persistence, navigation, sharing links, theme switching, blocked storage, image fallback and location controls. Layout measurements wait for the selected page and fonts, and disable decorative transitions to avoid measuring intermediate transforms. Intro animations are validated separately, including 240×320 and 640×360.

`BROWSER_WIDTHS=320,712` selects a shorter diagnostic run at 1100px height. `BROWSER_THEMES=classic,blush` narrows themes. `SCREENSHOT_DIR=/tmp/invitation-shots` captures translated cards and failures. `REPORT_PATH` saves accumulated results after each viewport and at completion.

`BROWSER_VIEWPORTS=240x320,412x915` selects exact width/height pairs. `BROWSER_ENGINE=chromium|firefox|webkit` selects the engine; Chrome and Edge channels are available with Chromium. The narrow Classic Bengali/Nepali cases also exercise a long address and require clearance between the countdown, closing blessing and location control.

Mobile coverage uses actual Playwright mobile/touch contexts, not just narrow desktop windows:

```sh
BROWSER_ENGINE=chromium BROWSER_MOBILE=true BROWSER_COLOR_SCHEME=dark \
  BROWSER_VIEWPORTS=360x780,390x844,412x915,430x932,915x412 npm run test:browser
```

Repeat with WebKit for mobile Safari emulation. Firefox does not support Playwright's `isMobile` emulation. CI runs these 360 additional combinations on its Chromium and WebKit targets, checking the device-width viewport, unrestricted zoom and the artwork's explicit light color scheme. Dark preference emulation is distinct from Samsung Internet's proprietary forced-dark rendering.

WebKit uses a fresh browser process after each fully checked viewport to avoid the macOS process crash observed while closing successive contexts. A crash during a check, a layout error, or a failed assertion still fails the run. No viewport or assertion is skipped.

The shared CI browser installer temporarily moves Google's unrelated Chrome apt source aside on disposable Linux runners; Playwright downloads its own pinned browsers. This prevents that feed's observed hash mismatch from blocking Ubuntu library installation while preserving apt signature/checksum verification. Installation gets at most three attempts, and persistent failure remains fatal. The installer tests execute its shell script with fake installers and package-source fixtures, including macOS Bash compatibility.

Pixel baselines were approved on the Linux CI environment. Exact hashes can differ on macOS because fonts and rasterization differ. For local change review, render the original and changed commits with the same browser, OS and deterministic event fixture; do not overwrite approved Linux hashes merely to make a Mac comparison pass.

These checks require configured event data because they verify localized date numerals. They do not certify every physical device, browser version, zoom setting or future event text. `npm run validate:export` separately rejects unresolved event placeholders; configure the real event details before publishing.

For Samsung Internet on a Galaxy A55, verify all themes in portrait and landscape, with its website darkening both on and off. The page declares `color-scheme: only light` to preserve text/artwork palettes and `text-size-adjust: 100%` to prevent browser text inflation while keeping pinch zoom available. Samsung settings that force recoloring or explicitly request the desktop site can override website preferences; record the browser version and those settings when comparing screenshots.
