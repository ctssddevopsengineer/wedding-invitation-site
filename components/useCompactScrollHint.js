'use client';

import { useEffect, useRef, useState } from 'react';

export function useCompactScrollHint(refreshKey = '') {
  const scrollRef = useRef(null);
  const [showScrollHint, setShowScrollHint] = useState(false);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return undefined;

    let frameId = 0;

    const update = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        const compactViewport = window.innerWidth < 375;
        const hasOverflow = scroller.scrollHeight > scroller.clientHeight + 1;
        const atBottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;
        const compactOverflow = compactViewport && hasOverflow;

        scroller.dataset.compactOverflow = compactOverflow ? 'true' : 'false';
        setShowScrollHint(compactOverflow && !atBottom);
      });
    };

    update();
    scroller.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });

    const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null;
    resizeObserver?.observe(scroller);
    for (const child of scroller.children) resizeObserver?.observe(child);

    const mutationObserver = typeof MutationObserver === 'function'
      ? new MutationObserver(update)
      : null;
    mutationObserver?.observe(scroller, { subtree: true, childList: true, characterData: true });

    return () => {
      window.cancelAnimationFrame(frameId);
      scroller.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      delete scroller.dataset.compactOverflow;
    };
  }, [refreshKey]);

  return { scrollRef, showScrollHint };
}
