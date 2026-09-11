# AGENTS.md

This file defines repository-level instructions for AI coding agents and contributors working on this project.

## Project Overview

This repository contains a Next.js static wedding reception invitation site deployed to GitHub Pages.

The production experience currently includes:
- 6 themes: Classic, Blush Rose, Rani Magenta, Royal Navy, Royal Plum, Saffron Gold
- 4 invitation pages: Front, Inside Left, Inside Right, Back
- 3 languages: English, Bengali, Nepali
- responsive/mobile layouts
- cinematic intro
- background music
- theme and language persistence
- QR/NFC entry
- sharing, calendar, countdown, and location interactions
- pixel-level and browser-level regression coverage

Treat visual stability, multilingual correctness, responsive behavior, and GitHub Pages compatibility as release-critical.

## Core Engineering Rules

1. Do not change unrelated features while implementing a requested change.
2. Preserve all 6 themes, 4 pages, and 3 languages unless the task explicitly changes that contract.
3. Any production behavior change must include or update regression tests.
4. Never weaken, skip, or delete a failing assertion merely to make CI green.
5. Fix the root cause. Distinguish application defects from test defects and infrastructure failures.
6. Do not update visual baselines blindly. Review and approve only intentional visual changes.
7. Preserve accessibility, keyboard behavior, touch behavior, deep links, and existing URL state.
8. Keep GitHub Pages repository-scoped hosting working through the configured base path.
9. Do not hardcode event-specific data inside UI components when it belongs in shared event/configuration data.
10. Prefer narrowly scoped CSS fixes over broad global overrides.

## Branch and Change Safety

- Work only on the branch explicitly requested by the user/task.
- Never modify `development`, `master`, production, or another protected/shared branch unless explicitly authorized.
- Re-fetch the target file immediately before updating it and use its current blob SHA.
- Avoid unrelated formatting or file-wide rewrites.
- Preserve existing assets unless replacement is explicitly requested.
- Do not merge a pull request unless explicitly requested.

## Runtime and Build

Use the repository-declared Node/npm versions and lockfile.

Primary validation commands:

```bash
npm ci
npm test
npm run test:phase2a
npm run test:phase2b
npm run build
npm run test:browser
npm run test:intro
npm run test:music
npm run test:monogram
npm run test:visual
```

Use only scripts that exist in `package.json`. Do not invent CI commands.

## Testing Requirements

### Unit and configuration tests

`npm test` runs:

```bash
node --test tests/*.test.mjs
```

New files under `tests/*.test.mjs` are therefore automatically part of the unit/configuration suite.

When changing CSS import order, responsive behavior, configuration wiring, theme behavior, or component semantics, update the corresponding tests.

### Browser regression

The browser regression suite validates rendered static output across:
- Chromium
- Firefox
- WebKit
- branded Chrome/Edge CI channels where configured

Do not refer to Playwright WebKit as literal Safari. It is WebKit-engine coverage, not a full Safari-app test.

The responsive matrix is intentionally broad. Do not reduce the matrix or silently remove difficult viewport cases to fix CI.

### Visual regression

Pixel baselines are approval artifacts, not disposable snapshots.

When a visual baseline changes:
1. confirm the production change is intentional,
2. inspect the changed visual state,
3. update only the affected approved baseline entries,
4. keep unrelated baselines unchanged.

Transient UI, timers, animation, or runtime-only affordances should be made deterministic or excluded from pixel comparison when appropriate, while keeping their behavior covered by browser tests.

## Responsive and Layout Contract

The invitation artwork and overlay geometry are tightly coupled.

General rules:
- no horizontal page overflow,
- no text collision,
- no important text escaping the invitation card,
- no unreadably small typography used as a shortcut for fitting content,
- preserve theme-specific artwork alignment,
- preserve readable Bengali and Nepali typography.

### Inside Right compact scrolling

For the current compact-scrolling feature:

- viewports below 375 CSS px may use the Inside Right reception-details scroll fallback,
- 375px and above must retain the normal fixed-layout behavior,
- scrolling must be vertical only,
- horizontal scrolling is not allowed,
- long content must remain reachable,
- content must not flex-shrink into text overlap,
- Front, Inside Left, and Back must remain unaffected,
- any scroll guidance must appear only when real overflow exists,
- the scroll hint must disappear at the bottom,
- the hint must remain absent at 375px and above,
- localized guidance must work for English, Bengali, and Nepali.

Do not solve compact overflow by shrinking typography to an unreadable size.

## Mobile Interaction Rules

This project supports touch navigation. Any scrollable content added inside a page must not break horizontal invitation navigation.

Expected behavior:
- vertical movement inside a scrollable details area scrolls that content,
- horizontal invitation navigation remains available,
- controls remain tappable,
- no overlay may block the Location/Map hotspot or other interactive controls.

## Localization

English strings act as stable translation keys.

When adding user-visible copy:
- add Bengali and Nepali translations,
- use the existing translation helper instead of inline language branching where practical,
- preserve local fonts for Bengali and Devanagari,
- do not replace localized numerals/date behavior with English-only formatting,
- preserve configured names, venue data, URLs, contacts, and event instants.

## Theme Integrity

All six themes must keep their own palette, artwork, monogram rules, and approved geometry.

Do not:
- copy one theme's absolute coordinates globally,
- silently fall back to another theme's artwork,
- modify Classic/Blush while working on another theme unless required and tested,
- add opaque masks over supplied invitation artwork unless explicitly approved.

## Event and Content Configuration

Reception details should come from shared event/configuration data.

Do not hardcode:
- couple names,
- parent names,
- venue,
- address,
- event date/time,
- contact numbers,
- map URL,
- localized event values

inside presentation components unless the value is genuinely static UI copy.

## GitHub Pages

The app is a static export and must continue to work under the repository base path.

All public asset references must remain deployment-aware. Do not assume hosting at `/`.

Validate both:
- root/local behavior where applicable,
- GitHub Pages project-path behavior.

## CI Failure Handling

When CI fails:

1. inspect the exact failed job and logs,
2. identify the first real failure,
3. check whether it reproduces across platforms,
4. determine whether the failure is application, test, or infrastructure related,
5. inspect current branch contents before editing,
6. make the smallest correct fix,
7. update tests when behavior changed,
8. rerun/observe CI,
9. do not claim success until the relevant run has actually completed successfully.

Examples of infrastructure failures include package-repository checksum errors or native browser crashes. Do not weaken product assertions to hide those failures.

## Code Quality

- Keep components focused.
- Reuse existing helpers and abstractions.
- Prefer semantic class names.
- Avoid duplicate state-management logic.
- Clean up event listeners, observers, timers, and browser resources.
- Guard browser-only APIs where necessary.
- Avoid introducing dependencies when the platform or existing code already solves the problem.
- Keep comments focused on non-obvious constraints, not obvious syntax.

## Accessibility

Preserve or improve:
- semantic labels,
- keyboard navigation,
- focus visibility,
- Escape-to-close behavior,
- reduced-motion support,
- screen-reader text,
- unrestricted browser zoom,
- adequate text contrast.

Do not disable zoom with viewport metadata.

## Before Committing

For every change, verify:
- syntax is valid,
- affected unit tests are updated,
- related regression coverage exists,
- no unrelated files changed,
- 375px+ layout remains unchanged when working on compact scrolling,
- multilingual behavior still works,
- GitHub Pages base-path behavior remains intact.

For UI work, also validate representative mobile, tablet, landscape, and desktop sizes.

## Before Declaring a Change Complete

A change is complete only when:
- requested behavior is implemented,
- regression tests cover it,
- existing required tests still pass,
- expected visual changes are reviewed,
- CI is green for the relevant commit/PR,
- no known regression has been hidden by skipped or weakened tests.

If CI is still running, report that status accurately instead of claiming completion.
