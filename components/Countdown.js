'use client';

import { formatLocalizedNumber } from '@/lib/locale.mjs';
import { useLanguage } from '@/components/LanguageProvider';

import { useEffect, useMemo, useState } from 'react';

function getParts(target) {
  const distance = Math.max(0, new Date(target).getTime() - Date.now());
  const totalSeconds = Math.floor(distance / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60
  };
}

export default function Countdown({ target }) {
  const { language, t, event: EVENT } = useLanguage();
  const validTarget = useMemo(() => !Number.isNaN(new Date(target).getTime()), [target]);
  const [parts, setParts] = useState(() => (validTarget ? getParts(target) : null));

  useEffect(() => {
    if (!validTarget) return undefined;
    const update = () => setParts(getParts(target));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [target, validTarget]);

  if (!parts) return <p className="muted">{t("Reception date will be announced soon.")}</p>;

  return (
    <div className="countdown" aria-label={t("Countdown to the reception")}>
      {Object.entries(parts).map(([label, value]) => (
        <div className="countdownUnit" key={label}>
          <strong>{formatLocalizedNumber(String(value).padStart(2, '0'), language)}</strong>
          <span>{t(label)}</span>
        </div>
      ))}
    </div>
  );
}
