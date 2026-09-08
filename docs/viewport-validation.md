# Responsive validation

`lib/responsive.mjs` lists 56 distinct CSS-pixel viewports: every requested numeric pair, 360×780 as additional Galaxy A55-class coverage, and the previous 11 widths and the former browser-test width of 375px at 1100px height. Duplicate requests are tested once. Device display scaling and browser chrome can change the effective viewport; the matrix also includes 412×892 and 412×915.

Run against a fresh production export:

```sh
npm run build
BROWSER_CHANNEL=chrome REPORT_PATH=/tmp/responsive-report.json npm run test:browser
npm test
BROWSER_CHANNEL=chrome npm run test:intro
```

The browser matrix renders six themes, three languages and four invitation pages at each viewport (4,032 combinations). It checks horizontal document overflow, card containment, rendered text-fragment collisions, artwork loading, language persistence, navigation, sharing links, theme switching, blocked storage, image fallback and location controls. Layout measurements wait for the selected page and fonts, and disable decorative transitions to avoid measuring intermediate transforms. Intro animations are validated separately, including 240×320 and 640×360.

`BROWSER_WIDTHS=320,712` selects a shorter diagnostic run at 1100px height. `BROWSER_THEMES=classic,blush` narrows themes. `SCREENSHOT_DIR=/tmp/invitation-shots` captures translated cards and failures. `REPORT_PATH` saves accumulated results after each viewport and at completion.

These are Chromium checks of the current event content, including unresolved placeholders. They do not certify every physical device, browser engine, zoom setting or future event text. `npm run validate:export` separately rejects unresolved event placeholders; configure the real event details before publishing.
