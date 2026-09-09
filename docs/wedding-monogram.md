# Shared wedding monogram

All six themes now use `public/images/wedding-monogram.png`, with an optimized
WebP companion and PNG fallback. `WeddingMonogram` renders the decoration outside
the translated copy containers. Classic's reception-details page retains its
printed title and lotus: that page had no initials to replace.

The navy, plum, and saffron front/family/back templates have printed initials.
A feathered CSS window displaying an unprinted area of that same template covers
the old crest, preserving the existing source artwork. The replacement remains
full color and uses real alpha transparency; no multiply or sepia filter is applied.
The landscape back cover has a smaller mobile emblem to clear its heading.

## Asset provenance

Source: user-supplied `ChatGPT Image Sep 9, 2026, 12_02_14 AM.png`.
Background extraction used the built-in imagegen tool. As an AI-assisted extraction,
the output is visually matched to the source, not guaranteed pixel-identical.
The generated PNG is retained with its alpha channel; Sharp encodes the WebP
companion at quality 90 and alpha quality 100.

Prompt:

> Use case: background-extraction. Edit target: supplied wedding monogram. Remove only the cream parchment background to actual transparent alpha, including gaps between bells/chains, leaves, lamps and ornamental flourishes. Preserve the exact original composition, colors, details, Om symbol, gold kalash, coconut, leaves, flowers, flames, hanging bells and chains. Do not redraw, redesign or add anything. Keep entire artwork uncropped on square transparent canvas. Output transparent PNG for use over website parchment backgrounds.

## Local validation

- `npm test` checks assets, transparency, loading, and existing behavior.
- `npm run build` creates the production export.
- With a local server running, `npm run test:monogram` checks all six themes and
  four pages in all three languages at 390 and 1440 pixels, including image decoding, aspect ratio,
  card containment, and heading clearance. Use `TEST_URL` to change the server URL
  and `BROWSER_CHANNEL` to select a browser (defaults to installed Chrome).
- `BROWSER_CHANNEL=chrome BROWSER_WIDTHS=390,1440 npm run test:browser`
  exercises the production export across English, Bengali, and Nepali, including
  image fallback, language switching, and page navigation.

The existing event placeholders must be configured before export validation can
approve the invitation for publication.

Validation result: 241 unit tests and 144 monogram browser checks passed; the
production build passed. The broader multilingual suite found two existing
classic-theme details-page collisions at 390px in Bengali and Nepali, involving
calendar/countdown placeholder messages. This page has no monogram overlay.
PNG fallback was also inspected with all WebP requests blocked.
