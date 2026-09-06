'use client';

import Artwork from '@/components/Artwork';
import { useLanguage } from '@/components/LanguageProvider';

import { useEffect, useId, useRef, useState } from 'react';
import CalendarButtons from '@/components/CalendarButtons';
import Countdown from '@/components/Countdown';
import { withBasePath } from '@/lib/public-path.mjs';
import { getTheme, getThemeAsset } from '@/lib/theme.mjs';

const HOVER_CLOSE_DELAY_MS = 180;

export default function InsideRight({ themeId, initialLocationOpen = false, onLocationOpenChange }) {
  const { language, t, event: EVENT } = useLanguage();
  const theme = getTheme(themeId);
  const monogramContrastId = useId();
  const insideRightMonogram = getThemeAsset(themeId, 'insideRightMonogram');
  const [isPinnedOpen, setIsPinnedOpen] = useState(Boolean(initialLocationOpen));
  const [isHoverOpen, setIsHoverOpen] = useState(false);
  const closeTimerRef = useRef(null);
  const isLocationOpen = isPinnedOpen || isHoverOpen;

  function clearCloseTimer() {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function openOnHover() {
    clearCloseTimer();
    setIsHoverOpen(true);
  }

  function scheduleHoverClose() {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setIsHoverOpen(false);
      closeTimerRef.current = null;
    }, HOVER_CLOSE_DELAY_MS);
  }

  function togglePinnedLocation() {
    clearCloseTimer();
    setIsPinnedOpen((value) => !value);
    setIsHoverOpen(false);
  }

  function closeLocation() {
    clearCloseTimer();
    setIsPinnedOpen(false);
    setIsHoverOpen(false);
  }

  useEffect(() => {
    setIsPinnedOpen(Boolean(initialLocationOpen));
  }, [initialLocationOpen]);

  useEffect(() => {
    onLocationOpenChange?.(isPinnedOpen);
  }, [isPinnedOpen, onLocationOpenChange]);

  useEffect(() => {
    if (!isLocationOpen) return undefined;

    function handleEscape(event) {
      if (event.key === 'Escape') closeLocation();
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isLocationOpen]);

  useEffect(() => () => clearCloseTimer(), []);

  return (
    <article className="invitePage exactInsideRight" aria-label={t("Inside right — reception details")}>
      <Artwork
        className="exactInsideRightArtwork"
        src={getThemeAsset(themeId, 'insideRight')}
        alt={t("Ornate Reception Details template with Bengali and Nepali cultural artwork")}
      />

      {insideRightMonogram && (
        <>
          {themeId === 'saffron' && (
            <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
              <defs>
                <filter id={monogramContrastId} colorInterpolationFilters="sRGB">
                  {/* Separate the orange fill from the gold lettering using their
                      blue channels, preserving the transparent crest silhouette. */}
                  <feColorMatrix type="matrix" values="0 0 8.55 0 -0.4753  0 0 9.4 0 -0.7278  0 0 7.45 0 -0.6816  0 0 0 1 0" />
                </filter>
              </defs>
            </svg>
          )}
          <Artwork
            className="insideRightThemeMonogram"
            style={themeId === 'saffron' ? { '--monogram-contrast-filter': `url("#${monogramContrastId}")` } : undefined}
            src={insideRightMonogram}
            alt={t('{couple} monogram', { couple: EVENT.couple })}
          />
          <h2 className="insideRightDynamicTitle">{language === 'en' ? <>&ensp;Reception<br />Details</> : <>{t('Reception')}<br />{t('Details')}</>}</h2>
        </>
      )}

      <div className="localizedArtworkCoordinates">
      {language !== 'en' && !insideRightMonogram && <h2 className="localizedPrintedDetailsTitle">{t('Reception details')}</h2>}
      {language !== 'en' && themeId === 'classic' && <p className="localizedDetailsClosing">{t('We would be honored by your presence on this joyous evening.')}</p>}
      </div>

      <section className="receptionDetailsOverlay" aria-label={t("Reception details")}>
        <div className="receptionDetailItem">
          <p className="receptionDetailLabel">{t("Day & Date")}</p>
          <p className="receptionDetailValue">{EVENT.dateLabel}</p>
        </div>

        <div className="receptionDetailDivider" aria-hidden="true"><span>◆</span></div>
        <br/>

        <div className="receptionDetailItem">
          <p className="receptionDetailLabel">{t("Time")}</p>
          <p className="receptionDetailValue">{EVENT.timeLabel}</p>
        </div>

        <div className="receptionDetailDivider" aria-hidden="true"><span>◆</span></div>
        <br/>

        <div className="receptionDetailItem">
          <p className="receptionDetailLabel">{t("Venue")}</p>
          <p className="receptionDetailValue">{EVENT.venueName}</p>
        </div>

        <div className="receptionDetailDivider" aria-hidden="true"><span>◆</span></div>
        <br/>

        <div className="receptionDetailItem receptionAddressItem">
          <p className="receptionDetailLabel">{t("Address")}</p>
          <p className="receptionDetailValue receptionAddressValue">{EVENT.venueAddress}</p>
        </div>

        <div className="receptionDetailDivider" aria-hidden="true"><span>◆</span></div>
        <br/>

        <div className="receptionDetailItem receptionCalendarItem">
          <p className="receptionDetailLabel">{t("Add to Calendar")}</p>
          <CalendarButtons />
        </div>

        <div className="receptionDetailDivider" aria-hidden="true"><span>◆</span></div>
        <br/>

        <div className="receptionDetailItem receptionCountdownItem">
          <p className="receptionDetailLabel">{t("Until We Celebrate")}</p>
          <Countdown target={EVENT.start} />
        </div>
      </section>

      <div className={!theme.dynamicLocationLabel ? 'localizedArtworkCoordinates' : 'dynamicLocationContainer'}>
      {(theme.dynamicLocationLabel || language !== 'en') && (
        <span className={`insideRightDynamicLocationLabel ${theme.showLocationIcon ? 'withLocationIcon' : ''}`} aria-hidden="true">
          {theme.showLocationIcon && (
            <svg className="insideRightLocationIcon" viewBox="0 0 24 24" focusable="false">
              <path d="M12 22s7-6.1 7-13A7 7 0 1 0 5 9c0 6.9 7 13 7 13Z" />
              <circle cx="12" cy="9" r="2.4" />
            </svg>
          )}
          <span>{t("Location /")}<br />{t("Map")}</span>
        </span>
      )}

      </div>

      <button
        type="button"
        className="exactLocationHotspot"
        onMouseEnter={openOnHover}
        onMouseLeave={scheduleHoverClose}
        onFocus={openOnHover}
        onBlur={scheduleHoverClose}
        onClick={togglePinnedLocation}
        aria-expanded={isLocationOpen}
        aria-controls="location-details-popover"
        aria-label={t("Show reception location details")}
        title={t("Hover or tap for location details")}
      >
        <span className="srOnly">{t("Show location details")}</span>
      </button>

      <aside
        id="location-details-popover"
        className={`locationDetailsPopover ${isLocationOpen ? 'open' : ''}`}
        aria-hidden={!isLocationOpen}
        role="dialog"
        aria-label={t("Reception location details")}
        onMouseEnter={openOnHover}
        onMouseLeave={scheduleHoverClose}
      >
        <div className="locationPopoverHeader">
          <p>{t("Location / Map")}</p>
          <button
            type="button"
            className="utilityCloseButton"
            onClick={closeLocation}
            aria-label={t("Close location details")}
          >
            ×
          </button>
        </div>

        <div className="locationPopoverBody">
          <img
            className="locationQr"
            src={withBasePath('/images/location-qr.png')}
            alt={t("QR code that opens the reception venue in Google Maps")}
          />
          <div className="locationPopoverCopy">
            <p className="locationVenueName">{EVENT.venueName}</p>
            <p className="locationVenueAddress">{EVENT.venueAddress}</p>
            <a
              className="btn btnGold"
              href={EVENT.mapsUrl}
              target="_blank"
              rel="noreferrer"
            >
              {t("Open in Google Maps")}
            </a>
          </div>
        </div>
      </aside>
    </article>
  );
}
