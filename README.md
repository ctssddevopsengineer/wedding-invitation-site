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

## Background music

`lib/music.mjs` is the single track configuration: `introMusic`, the six-entry
`themeMusic` map, volume and fade/loop timings. The supplied MP3s live in
`public/audio/`; paths automatically include the GitHub Pages base path.

Music does not fetch, create an audio context or play before interaction.
**Open Invitation** enables the intro track; completion crossfades to the theme
track. Skip before opening, repeat visits and deep links remain silent until
**Play music** is pressed. The closed-envelope music button only sets the mute
preference. **Replay Intro** fades down until the envelope is opened again.

`MusicProvider` owns one `lib/music-player.mjs` player outside the invitation
pages. Page navigation never restarts a track. Theme changes crossfade, and
superseded downloads cannot start playback. Mute is stored in `sessionStorage`;
playback authorization is deliberately not restored after a reload. Blocked
storage falls back to the current page's in-memory preference.

Web Audio gain ramps handle fades (including on mobile). Decoded buffers loop on
the audio clock with a short tail/head blend to avoid restart gaps and clicks;
the original MP3s are unchanged. Only the current track and a pending transition
are loaded, rather than preloading the entire collection. Mute and hidden tabs
fade down then suspend the audio clock, preserving position. Page departure
pauses immediately; return resumes only previously enabled, unmuted playback.
Unavailable audio or browser playback restrictions leave a retry control and
never block the invitation. No AI music selection is involved.

After `npm run build`, run `npm run test:music` (optionally with
`BROWSER_CHANNEL=chrome`) for real MP3, gesture, navigation, loop, lifecycle and
failure checks. Browser tests mute hardware output while exercising Web Audio.

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

## Cinematic intro — Phases 1, 2 and 3

A red-and-gold Bengali wedding envelope with an S&D seal precedes the front cover.
Select **Open Invitation** to open the flap and lift the card. A Bengal-to-Himalaya
wedding scene then appears, followed by a Bengali groom from the left and a bride
in compatible red-and-gold wedding styling from the right. They approach slowly,
pause together, then reveal the website, in approximately 11.5 seconds overall.
The rising card is the existing `FrontCover`
inside the existing book stage: there is no second invitation or copied cover.
Envelope line art and animation are isolated in `CinematicIntro.module.css` and
`CinematicIntro.js`; approved page components, theme assets and workflow files
are unchanged. The entrance is isolated in `WeddingEntrance.js` and its CSS module.
No music is included. Phase 3 adds the restrained side particles described below.

The groom and bride are transparent WebP cutouts with real alpha channels, not
rectangular pictures. New art lives only in `public/intro/`; `ASSETS.md` records
the image-generation prompts and provenance. A portrait backdrop preserves both
architectural traditions on phones without downloading the desktop backdrop.
Character movement uses transform
and opacity, with restrained walking cadence and a 400ms stagger. Small screens
use a much shorter travel distance. Invitation text fades before the characters
enter; scene text stays in a separate upper region, above their heads.

Decorative assets start loading only after opening. Both character images must
load and decode before the walking phase; if either fails or is still unavailable
after the bounded scene transition, the intro proceeds to the real invitation.
A missing backdrop uses the warm gradient fallback. Nothing waits indefinitely
for an image, and no character can appear late halfway through a walk.

**Skip Intro** and Escape immediately reveal the invitation at any phase.
**Replay Intro**, below the invitation navigation, restarts the closed envelope
at the front cover with the current theme and language. The intro is shown once
per tab session; completion or skipping records `sd-invitation-intro-seen-v1` in
session storage. If storage is blocked, opening, skipping and replay still work.
Direct links to family, details, location or back bypass the automatic intro.
The existing reload-to-front behavior is preserved, and browser-history
navigation dismisses an active intro to show its requested page.

Keyboard focus stays within the intro controls while the book is inert; after
dismissal, focus and scrolling move to the actual invitation stage. Reduced-motion
visitors still see the closed envelope, but opening reveals the invitation without
the flap/card/character choreography, without downloading the new scene assets.
Changing the motion preference during playback also
finishes immediately. Timers and scroll locks are cleaned up on dismissal.
Other-theme background preloading pauses during the intro. Slow or missing
artwork never prevents skipping or completing the sequence.

After building, run `BROWSER_CHANNEL=chrome npm run test:intro` (or omit the channel
to use Playwright Chromium). It verifies the full sequence across six themes,
42 theme/device combinations from 320px phones to 1920px desktops and short
landscape screens, seven responsive walking scenes, single-cover DOM identity,
focus, touch, navigation, replay, skip at every phase, reduced motion, blocked
storage, failed/late characters and missing-background fallback. Unit tests also
verify transparent borders, sufficient asset resolution and transfer budgets. Set
`SCREENSHOT_DIR` to save previews and `NEXT_PUBLIC_BASE_PATH` to match the build.
Run `npm run test:envelope` after building for 288 pixel-based animation checks
across all six themes and eight viewport sizes (including iPhone 16 at 393×852), using 1×, 2× and 3×
display densities and checking partially blended edge pixels.
These verify that the card never leaks below the envelope and remains visible
above it during the rise. The intro CI job runs this regression too.
Run `npm test` and `npm run test:browser` for the existing regression suites.

### Subtle wedding particles

During the couple's entrance and pause, CSS rose petals, small gold sparkles and
occasional inline floral marks fall along the left and right edges. The layer uses
20 particles on desktop and 8 at widths of 680px or less. The side lanes are
clipped to at most 16% of each desktop edge (220px maximum), or 10% on mobile,
keeping at least the middle 68% clear on desktop and 80% on mobile.
Falls start at least 24px below the scene caption;
a ResizeObserver updates this boundary when translated text wraps or fonts load.
No particles appear over the emerging card or the actual invitation pages.

Only transform and opacity animate; there is no JavaScript animation loop,
particle spawning timer, image download or animation library. Tiny floral marks
take 14 seconds per fall, with shorter, staggered petal/sparkle cycles. The layer
sits behind the text and characters and never intercepts clicks or focus.

The particle layer is removed before the final reveal, and on Skip or reduced
motion. All observers and event listeners are cleaned up. A visibilitychange
listener hides and pauses the CSS timelines while the tab is hidden. Returning
resumes them only if the intro is still active; a completed intro has no particle
elements left to resume. CSS also disables the layer for prefers-reduced-motion.

`npm run test:intro` checks desktop/mobile particle budgets, side clipping, text
clearance after resize/reflow, animated-property limits, hidden-tab suspension,
reduced motion and removal. It also reports a short local Chrome frame-interval
comparison with the particle layer hidden and visible.
