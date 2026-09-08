# Responsive and performance hardening

Validated against a production static build in local Chrome on macOS, 8 September 2026. These are browser emulations, not physical-device results. The A55 approximation uses 412×892 CSS pixels at DPR 2.625; display settings and browser chrome can change a real device's available space.

## Changes

- Added `app/readable-layout.css`, imported after existing theme styles. Body copy has a 14px minimum; main headings and couple names have an 18px minimum. Text flows and scrolls within the existing artwork instead of overlapping or shrinking. Compact cover names stack. The back-page text area has a translucent theme-colored backing for contrast.
- Made text regions keyboard focusable; family/back regions have accessible names. Moved their separate crests outside scrolling content so they remain stationary. Existing optical crest alignment is preserved.
- Expanded navigation-dot touch targets to 44px while retaining small visible dots. Theme labels wrap at 14px; controls reserve bottom space for the floating music button. Vertical/diagonal scrolling no longer turns invitation pages.
- Added short-landscape envelope layout. Intro captions remain legible; character sizing uses measured caption height and available viewport height, including the taller groom. Resize observation recalculates clearance without restarting the animation.
- Added same-dimension WebP companions for the classic and blush covers. Extended the existing optimizer/loader to JPEG-named assets, retaining original-image fallback. Removed automatic full-artwork warmup for unused themes; selected and adjacent pages plus intentional theme previews still preload.
- Added the exact viewport matrix and `npm run test:responsive`, covering layout, text overlap, touch, orientation, music controls, particle clearance, and performance sampling. Updated existing artwork/browser tests for the new optimized paths.

No workflow files, event configuration, original artwork, music behavior, or cinematic phase timings changed.

## Viewport results

Each viewport exercised all six themes, English/Bengali/Nepali, and four invitation pages: **1,008 page renders**. The real intro ran at every size, with **42 checks** across closed, meeting, and rotated states. Checks include envelope/monogram positioning, reveal bounds, couple scaling/meeting, petal clearance, text overlap and horizontal overflow, 44px controls, touch scrolling/taps, skip/replay, and retaining the walking animation through orientation changes. No detected layout issues or JavaScript errors.

| CSS viewport | Result |
| --- | --- |
| 360×640 | Pass |
| 360×800 | Pass |
| 375×667 | Pass |
| 390×844 | Pass |
| 393×873 | Pass |
| 412×915 | Pass |
| 412×892 | Pass |
| 768×1024 | Pass |
| 820×1180 | Pass |
| 1024×768 | Pass |
| 1280×800 | Pass |
| 1366×768 | Pass |
| 1440×900 | Pass |
| 1920×1080 | Pass |

Representative names and venue details replace unresolved display placeholders only inside the browser audit. Event configuration remains untouched. Visual spot checks covered compact covers, family/details/back pages, controls, and portrait/short-landscape/desktop intro scenes. Small cards intentionally require scrolling to read all copy.

## Performance and regression checks

| Asset | Original bytes | WebP bytes |
| --- | ---: | ---: |
| Classic front | 3,562,711 | 476,416 |
| Blush front | 3,007,158 | 366,206 |

Combined reduction: **87.2%**, preserving pixel dimensions. The cold classic load requested other themes' thumbnails only, without downloading their full artwork.

Across the normal matrix, 45 animation-frame intervals sampled during each walking phase had p95 values of **16.7–16.8ms**. No main-thread tasks over 50ms were recorded during initial loading and the intro. At **4× CPU slowdown, 360×640**, all 72 page combinations and intro/touch/orientation checks passed; sampled p95 was **16.7ms**, with two loading/intro long tasks of **126ms and 71ms**. These are local timing samples, not a guarantee of real-device FPS or network performance.

- Production build: passed.
- Unit tests: 172 passed.
- Music browser regression: passed gesture gating, all seven MP3s, crossfades, page continuity, mute persistence, looping, visibility resume, failed-track recovery, and reduced motion, without browser errors.
- Final shared-control fixes: 252 additional cover/control configurations passed across all 14 viewports, six themes, and three languages; theme labels wrap and the active dot retains its small visible indicator.

Reproduce with `npm run build`, `npm test`, and `BROWSER_CHANNEL=chrome npm run test:responsive`. For the slow-CPU case, add `VIEWPORT_FILTER=360x640 CPU_SLOWDOWN=4`. Reports/screenshots default to `/tmp/wedding-responsive`, configurable using `REPORT_DIR`.
