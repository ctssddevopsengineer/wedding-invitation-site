'use client';

import { useLanguage } from '@/components/LanguageProvider';

import { useEffect, useMemo, useState } from 'react';
import { buildInvitationAbsoluteUrl } from '@/lib/deep-link.mjs';
import { buildNfcWriteMessage, buildQrImageUrl, supportsWebNfc } from '@/lib/invitation-entry.mjs';

export default function QrNfcPanel({ themeId }) {
  const { language, t, event: EVENT } = useLanguage();
  const [locationLike, setLocationLike] = useState(null);
  const [status, setStatus] = useState('');
  const [nfcSupported, setNfcSupported] = useState(false);

  useEffect(() => {
    setLocationLike({
      origin: window.location.origin,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: ''
    });
    setNfcSupported(supportsWebNfc(window));
  }, [themeId, language]);

  const invitationUrl = useMemo(() => {
    if (!locationLike) return '';
    return buildInvitationAbsoluteUrl(locationLike, { themeId, pageIndex: 0, language });
  }, [locationLike, themeId, language]);

  const qrImageUrl = useMemo(() => buildQrImageUrl(invitationUrl), [invitationUrl]);

  async function copyNfcLink() {
    if (!invitationUrl) return;
    try {
      await navigator.clipboard.writeText(invitationUrl);
      setStatus("NFC target link copied");
    } catch {
      setStatus("Unable to copy NFC link automatically");
    }
  }

  async function writeNfcTag() {
    if (!nfcSupported || !invitationUrl) return;
    try {
      const writer = new window.NDEFReader();
      await writer.write(buildNfcWriteMessage(invitationUrl));
      setStatus("NFC tag written successfully");
    } catch (error) {
      setStatus('NFC write failed');
    }
  }

  return (
    <details className="qrNfcPanel">
      <summary className="qrNfcSummary">{t("QR + NFC access")}</summary>
      <div className="qrNfcBody" aria-label={t("QR and NFC invitation access")}>
        <p className="qrNfcIntro">{t("Both entry methods open the invitation front cover using the selected theme.")}</p>

        <div className="qrNfcGrid">
          <div className="qrAccessCard">
            <span className="qrNfcCardLabel">QR</span>
            {qrImageUrl ? (
              <img
                className="invitationQr"
                src={qrImageUrl}
                alt={t("QR code for this wedding reception invitation")}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="invitationQrPlaceholder" aria-hidden="true" />
            )}
            <span className="qrNfcCardHint">{t("Scan to open the invitation")}</span>
          </div>

          <div className="nfcAccessCard">
            <span className="qrNfcCardLabel">NFC</span>
            <div className="nfcGlyph" aria-hidden="true">)))</div>
            <span className="qrNfcCardHint">{t("Use the same URL when programming a physical NFC tag")}</span>
            <div className="smartShareActions">
              <button type="button" className="experienceButton" onClick={copyNfcLink}>
                {t("Copy NFC link")}
              </button>
              {nfcSupported && (
                <button type="button" className="experienceButton experienceButtonPrimary" onClick={writeNfcTag}>
                  {t("Write NFC tag")}
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="entryUrlPreview" aria-label={t("Invitation entry URL")}>{invitationUrl}</p>
        <span className="smartShareStatus" role="status" aria-live="polite">{status ? t(status) : ''}</span>
      </div>
    </details>
  );
}
