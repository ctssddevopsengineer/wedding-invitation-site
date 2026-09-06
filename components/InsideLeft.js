import Artwork from '@/components/Artwork';
import { useLanguage } from '@/components/LanguageProvider';
import { getThemeAsset } from '@/lib/theme.mjs';

export default function InsideLeft({ themeId }) {
  const { language, t, event: EVENT } = useLanguage();
  const copy = EVENT.insideLeft;
  const insideLeftMonogram = getThemeAsset(themeId, 'insideLeftMonogram');

  return (
    <article
      className="invitePage familyBlessingsTemplate"
      aria-label={t("Inside left — family blessings")}
    >
      <Artwork
        className="familyBlessingsArtwork"
        src={getThemeAsset(themeId, 'insideLeft')}
        alt={t("Ornate Bengali and Nepali family blessings invitation background")}
      />

      <div className="familyBlessingsContent">
        {insideLeftMonogram && (
          <Artwork
            className="familyMonogramArtwork"
            src={insideLeftMonogram}
            alt={t('{couple} monogram', { couple: EVENT.couple })}
          />
        )}

        <section className="familyBlessingsIntro" aria-labelledby="family-blessings-title">
          <h2 id="family-blessings-title">{copy.heading}</h2>
          <div className="familyGoldDivider" aria-hidden="true"><span>✥</span></div>
          <p>
            {copy.introLines.map((line, index) => (
              <span key={`${line}-${index}`}>{line}</span>
            ))}
          </p>
        </section>

        <p className="familyCoupleNames" aria-label={EVENT.couple}>
          <span>{EVENT.groomName}</span>
          <b aria-hidden="true">&amp;</b>
          <span>{EVENT.brideName}</span>
        </p>

        <div className="familyGoldDivider familyNamesDivider" aria-hidden="true"><span>✥</span></div>

        <section className="familyBlock familyGroomBlock" aria-labelledby="groom-family-title">
          <h3 id="groom-family-title"><span aria-hidden="true">✤</span>{EVENT.families.groom.heading}<span aria-hidden="true">✤</span></h3>
          <p>{EVENT.families.groom.father}</p>
          <p>{EVENT.families.groom.mother}</p>
        </section>

        <div className="familyGoldDivider familyMiddleDivider" aria-hidden="true"><span>✥</span></div>

        <section className="familyBlock familyBrideBlock" aria-labelledby="bride-family-title">
          <h3 id="bride-family-title"><span aria-hidden="true">✤</span>{EVENT.families.bride.heading}<span aria-hidden="true">✤</span></h3>
          <p>{EVENT.families.bride.father}</p>
          <p>{EVENT.families.bride.mother}</p>
        </section>

        <div className="familyGoldDivider familyClosingDivider" aria-hidden="true"><span>✥</span></div>

        <p className="familyBlessingsClosing">
          {copy.closingLines.map((line, index) => (
            <span key={`${line}-${index}`}>{line}</span>
          ))}
        </p>
      </div>
    </article>
  );
}
