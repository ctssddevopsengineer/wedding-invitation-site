# Wedding Invitation Site

A configurable digital wedding invitation experience built with Next.js, designed to feel warm, personal, and elegant across desktop and mobile screens. The app presents a four-page invitation book with theme switching, responsive navigation, sharing utilities, and event details that are injected at build time.

## Project overview

This project includes:

- a four-page invitation flow: Front, Inside Left, Inside Right, and Back
- six visual themes
- swipe, arrow, and keyboard navigation
- persistent theme selection using browser storage and URL state
- centralized event and family configuration
- GitHub Pages-compatible static export
- automated test coverage for layout, navigation, hosting paths, sharing, and theme integrity

The application entry point is `app/page.js`, which renders `InvitationBook` from `components/InvitationBook.js`.

## Tech stack

- Next.js `^16.3.4`
- React `19.2.0`
- React DOM `19.2.0`
- Node `>=22`

## Local development

The source version of `lib/event.mjs` contains build-time placeholders. Render a local configuration before starting the production-style app, or provide a local development configuration appropriate for your environment.

```bash
npm install
npm test
npm run dev
```

## Production build

```bash
npm ci
npm test
npm run config:render
npm run build
npm run validate:export
```

`config:render` reads invitation values from environment variables and replaces the placeholders in `lib/event.mjs` before the static export is generated.

## Invitation configuration

The deployment pipeline supplies the following variables rather than keeping personal details in source code:

```text
EVENT_TIMEZONE
EVENT_TIMEZONE_OFFSET
EVENT_START_DATE
EVENT_START_TIME
GOOGLE_MAPS_URL
VENUE_NAME
VENUE_ADDRESS
GROOM_NAME
BRIDE_NAME
GROOM_FATHER_NAME
GROOM_MOTHER_NAME
BRIDE_FATHER_NAME
BRIDE_MOTHER_NAME
GROOM_FAMILY_CONTACT_NAME
GROOM_FAMILY_PHONE_NUMBER
BRIDE_FAMILY_CONTACT_NAME
BRIDE_FAMILY_PHONE_NUMBER
```

For GitHub Pages production deployments these values are expected as GitHub Actions environment/repository variables and are consumed by `.github/workflows/cd.yml`.

## Current app structure

```text
app/
  globals.css
  phase2b.css
  responsive-layout.css
  layout.js
  page.js

components/
  InvitationBook.js
  FrontCover.js
  InsideLeft.js
  InsideRight.js
  BackCover.js
  ThemeSwitcher.js
  CalendarButtons.js
  ContactDetails.js
  Countdown.js
  SmartSharePanel.js
  QrNfcPanel.js

lib/
  event.mjs
  theme.mjs
  public-path.mjs
  theme-url.mjs
  theme-preload.mjs
  navigation.mjs
  calendar.mjs
  contact.mjs
  responsive.mjs

public/
  themes/
    classic/
    blush/
    magenta/
    navy/
    plum/
    saffron/

scripts/
  render-event-config.mjs
  validate-static-export.mjs
```

## Available themes

- Original Deep Red (`classic`)
- Blush Rose (`blush`)
- Rani Magenta (`magenta`)
- Royal Navy (`navy`)
- Royal Plum (`plum`)
- Saffron Gold (`saffron`)

Theme metadata lives in `lib/theme.mjs`, while the artwork lives under `public/themes/<theme>/`.

## GitHub Pages deployment

`next.config.mjs` uses static export plus a deployment base path. Public assets are resolved through `lib/public-path.mjs`, so theme artwork and QR assets continue to work when the site is hosted below a repository path.

The GitHub Pages workflow:

1. installs dependencies
2. renders invitation configuration from GitHub variables
3. builds the static export
4. validates the exported paths/assets
5. uploads the Pages artifact
6. deploys through `actions/deploy-pages`

## Testing

Useful commands:

```bash
npm test
npm run test:phase2a
npm run test:phase2b
npm run validate:export
```

The responsive suite protects all 24 theme/page combinations (6 themes × 4 invitation pages) and includes compact-phone, phone, tablet, and desktop layout guards.

## Maintenance principle

Personal invitation details should not be embedded directly in React components, utility modules, calendar metadata, or deployment workflow source. Components should consume `EVENT`, and deployment-specific values should be supplied through the configuration-rendering pipeline.

## English, Bengali and Nepali

Use the language selector above the existing theme picker. English remains the
initial default; a saved language is restored on subsequent visits. An explicit
`lang=en`, `lang=bn` or `lang=ne` query parameter takes precedence over that saved
preference. Invalid language values safely fall back to English.

For example: `?theme=blush&page=details&lang=bn`. Theme changes and page navigation
retain the language. Copy/share links retain all three choices; QR and NFC links
retain the theme and language and open the front cover, as before. Browser history
and blocked local storage are supported.

Translations live in `lib/translations.mjs`; `lib/locale.mjs` translates event copy
without changing event instants, the configured names, venue/address, phone numbers
or map URLs. Dates, times, countdown labels/numerals and calendar event descriptions
are localized. Explicit weekday/month names and digits avoid English fallbacks
on browsers without Nepali locale data. Proper names and addresses retain their configured spelling.
The Classic and Blush fronts include printed names in their original artwork;
those names remain part of the approved design. Printed English invitation copy
is covered by localized parchment overlays only in Bengali/Nepali. English artwork
and the original theme CSS remain unchanged.

Bengali and Devanagari fonts are bundled locally under `app/fonts`, with their SIL
Open Font Licenses. They are loaded only when needed; no external font service or
translation API is required at runtime.

## Artwork loading and verification

Original PNG/JPEG artwork is retained byte-for-byte. Static WebP companions preserve
its dimensions and reduce aggregate artwork bytes from 70,616,072 to 9,982,714
(86%). Browsers use `<picture>` with the originals as format/network fallbacks.
Regenerate the companions with `npm run assets:optimize` after changing original
artwork. No image optimization server is required on GitHub Pages.

The active page and crests are warmed first, with hover/focus/touch warming and
sequential background warming of alternative themes. Background alternative-theme
warming is skipped for Save-Data and 2G connections. Theme selection waits for image
decoding while retaining the current card; rapid selections resolve to the last
choice. Cached theme changes avoid another image download. First visits still
depend on the guest's network; instantaneous cold downloads cannot be guaranteed.

- `npm test`: original regression checks plus language, calendar/deep-link and
  artwork loading/size/geometry tests.
- `npm run build` and `npm run validate:export`: run after `npm run config:render`
  with the event variables described above. Set `NEXT_PUBLIC_BASE_PATH` for both
  commands when verifying GitHub Pages deployment.
- `npx playwright install chromium`, then `npm run test:browser`: browser checks
  against the built `out` directory, covering all 288 combinations of six themes,
  four pages, three languages and four viewport widths, plus interaction tests.
  Set the same `NEXT_PUBLIC_BASE_PATH` used for the build. Alternatively use
  `BROWSER_CHANNEL=chrome` with an installed Chrome. Optional `SCREENSHOT_DIR` saves
  translated card screenshots, and `BROWSER_WIDTHS=375,1280` narrows the matrix.

The existing `ci.yml` and `cd.yml` are unchanged. Their `npm test` step includes the
new unit tests; the browser matrix can be run locally using the command above.
