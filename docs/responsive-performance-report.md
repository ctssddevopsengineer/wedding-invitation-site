# Template fidelity restored

The faded adaptive parchment presentation has been removed. The four invitation page components match `release/20260908T004600-addedmusic-latest` (`20d2930`) exactly. Original artwork rendering, original page proportions, and original text composition are restored. No gradient masks, duplicate template layers, stretched middle bands, or enlarged template frames are used.

External navigation retains larger touch targets and wrapping theme labels. Music, cinematic behavior, image-loading optimizations, and CI/CD workflows are unchanged by this correction.

This removes the taller-card layout. The earlier 3,456 adaptive-layout checks and 200% text results describe the discarded presentation and must not be treated as validation of this restored design. The release's small-screen text limitations remain, including the previously observed Bengali classic back-cover overlap at 320px.

Validation: production build and 172 unit tests passed; Plum Bengali family/back pages were visually inspected, and the four page component files were compared directly with the release reference. Local server returns HTTP 200. The discarded adaptive audit and its npm command were removed so its obsolete assertions are not presented as current validation. Changes are uncommitted.
