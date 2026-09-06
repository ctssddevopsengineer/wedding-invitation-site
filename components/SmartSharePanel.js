'use client';

import { useLanguage } from '@/components/LanguageProvider';

import { useEffect, useMemo, useState } from 'react';
import { buildInvitationAbsoluteUrl } from '@/lib/deep-link.mjs';

function legacyCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  return copied;
}

export default function SmartSharePanel({ themeId, pageIndex, locationOpen = false }) {
  const { language, t, event: EVENT } = useLanguage();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    setCurrentLocation({
      origin: window.location.origin,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash
    });
  }, [themeId, pageIndex, locationOpen, language]);

  const shareUrl = useMemo(() => {
    if (!currentLocation) return '';
    return buildInvitationAbsoluteUrl(currentLocation, { themeId, pageIndex, locationOpen, language });
  }, [currentLocation, themeId, pageIndex, locationOpen, language]);

  async function copyLink() {
    if (!shareUrl) return;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(shareUrl);
      else if (!legacyCopy(shareUrl)) throw new Error('Copy unavailable');
      setStatus("Invitation link copied");
    } catch {
      setStatus("Unable to copy automatically");
    }
  }

  async function shareInvitation() {
    if (!shareUrl) return;
    const shareData = {
      title: EVENT.title,
      text: t('{description} {date} at {venue}.', { description: EVENT.description, date: EVENT.dateLabel, venue: EVENT.venueName }),
      url: shareUrl
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setStatus("Invitation shared");
      } else {
        await copyLink();
      }
    } catch (error) {
      if (error?.name !== 'AbortError') setStatus("Sharing cancelled or unavailable");
    }
  }

  return (
    <section className="smartSharePanel" aria-label={t("Share invitation")}>
      <div className="smartShareCopy">
        <strong>{t("Share this invitation")}</strong>
        <span>{t("The link keeps the selected theme and page.")}</span>
      </div>
      <div className="smartShareActions">
        <button type="button" className="experienceButton experienceButtonPrimary" onClick={shareInvitation}>
          {t("Share")}
        </button>
        <button type="button" className="experienceButton" onClick={copyLink}>
          {t("Copy link")}
        </button>
      </div>
      <span className="smartShareStatus" role="status" aria-live="polite">{status ? t(status) : ''}</span>
    </section>
  );
}
