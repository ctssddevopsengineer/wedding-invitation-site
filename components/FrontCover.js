'use client';

import WeddingMonogram from '@/components/WeddingMonogram';
import Artwork from '@/components/Artwork';
import { useLanguage } from '@/components/LanguageProvider';
import { getTheme, getThemeAsset } from '@/lib/theme.mjs';
import CompactScrollHint from '@/components/CompactScrollHint';
import { useCompactScrollHint } from '@/components/useCompactScrollHint';

export default function FrontCover({ onOpen, themeId }) {
  const { language, t, event: EVENT } = useLanguage();
  const theme = getTheme(themeId);
  const usesDynamicFrontCopy = theme.dynamicFront || theme.blankFront;
  const { scrollRef, showScrollHint } = useCompactScrollHint(`${language}:${themeId}`);

  return (
    <article className="invitePage frontCover" aria-label={t("Front cover")}>
      <Artwork
        className="coverArtwork"
        src={getThemeAsset(themeId, 'front')}
        alt={t('{couple} reception invitation artwork', { couple: EVENT.couple })}
      />
      <WeddingMonogram themeId={themeId} page="front" />

      {(usesDynamicFrontCopy || language !== 'en') && (
        <section
          ref={scrollRef}
          data-compact-scroll-region="front"
          className={`dynamicFrontCopy ${!usesDynamicFrontCopy ? 'localizedPrintedFront' : ''}`}
          aria-label={t("Reception invitation cover text")}
        >
          {theme.blankFront && <div className="weddingMonogramSpacer" aria-hidden="true" />}
          <h1 className="dynamicFrontHeading">
            <span>{EVENT.frontCover.heading}</span>
            <em>{EVENT.frontCover.subheading}</em>
          </h1>
          <div className="dynamicFrontRule" aria-hidden="true"><span>✥</span></div>
          <p className="dynamicFrontTagline">{EVENT.tagline}</p>
          <div className="dynamicFrontRule dynamicFrontNamesRule" aria-hidden="true"><span>✥</span></div>
          <p className="dynamicFrontNames">
            <span>{EVENT.groomName}</span>
            <b>&amp;</b>
            <span>{EVENT.brideName}</span>
          </p>
          <div className="dynamicFrontRule dynamicFrontClosingRule" aria-hidden="true"><span>✥</span></div>
          <p className="dynamicFrontClosing">
            {EVENT.frontCover.closingLines.map((line, index) => (
              <span key={`${line}-${index}`}>{line}</span>
            ))}
          </p>
          <CompactScrollHint visible={showScrollHint} label={t("Scroll for more")} />
        </section>
      )}

      <div className="coverShade" />
      <div className="coverAction">
        <button className="openButton" type="button" onClick={onOpen}>
          <span>{t("Open Invitation")}</span>
          <span aria-hidden="true">↓</span>
        </button>
      </div>
      <span className="srOnly">{EVENT.title}</span>
    </article>
  );
}
