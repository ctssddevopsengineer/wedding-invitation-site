import "@/app/wedding-monogram.css";

import Artwork from '@/components/Artwork';
import { getThemeAsset, WEDDING_MONOGRAM } from '@/lib/theme.mjs';

// The royal templates contain printed initials. A feathered window onto an
// unprinted area of the same parchment covers those before the transparent art.
export default function WeddingMonogram({ themeId, page }) {
  const embedded = ['navy', 'plum', 'saffron'].includes(themeId) && page !== 'insideRight';
  return (
    <div className={`weddingMonogram weddingMonogram--${page}`} data-embedded-crest={embedded || undefined}>
      {embedded && (
        <span className="weddingMonogramParchment" aria-hidden="true">
          <Artwork src={getThemeAsset(themeId, page)} alt="" />
        </span>
      )}
      <Artwork src={WEDDING_MONOGRAM} width="1254" height="1254" alt="" decoding="async" />
    </div>
  );
}
