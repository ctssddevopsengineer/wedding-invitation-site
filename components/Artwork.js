'use client';

import { useState } from 'react';
import { optimizedArtworkUrl } from '@/lib/artwork.mjs';

export default function Artwork({ src, ...props }) {
  const [failedSource, setFailedSource] = useState(null);
  return (
    <picture>
      <source srcSet={failedSource === src ? undefined : optimizedArtworkUrl(src)} type="image/webp" />
      <img {...props} src={src} decoding="async" loading="eager" fetchPriority="high" onError={() => setFailedSource(src)} />
    </picture>
  );
}
