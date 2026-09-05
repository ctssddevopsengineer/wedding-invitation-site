import Artwork from '@/components/Artwork';
import { useLanguage } from '@/components/LanguageProvider';
import ContactDetails from '@/components/ContactDetails';
import { getThemeAsset } from '@/lib/theme.mjs';

export default function BackCover({ themeId }) {
  const { language, t, event: EVENT } = useLanguage();
  const copy = EVENT.backCover;
  const backMonogram = getThemeAsset(themeId, 'backMonogram');

  return (
    <article
      className="invitePage heritageBackCover"
      aria-label={t("Back cover — Bengal and Nepal heritage gratitude page")}
    >
      <Artwork
        className="heritageBackArtwork"
        src={getThemeAsset(themeId, 'back')}
        alt={t("Bengali riverside temple and boats blending into Himalayan mountains and a Nepali pagoda")}
      />

      <div className="heritageBackContent">
        {backMonogram && (
          <Artwork
            className="heritageBackMonogram"
            src={backMonogram}
            alt={t('{couple} monogram', { couple: EVENT.couple })}
          />
        )}

        <section className="heritageBackIntro" aria-labelledby="back-gratitude-title">
          <h2 id="back-gratitude-title">{copy.heading}</h2>
          <div className="heritageGoldRule" aria-hidden="true"><span>✥</span></div>
          <p className="heritageBackMessage">
            {copy.messageLines.map((line, index) => (
              <span key={`${line}-${index}`}>{line}</span>
            ))}
          </p>
        </section>

        <p className="heritageCoupleNames">
          <span>{EVENT.groomName}</span>
          <b>&amp;</b>
          <span>{EVENT.brideName}</span>
        </p>

        <div className="heritageGoldRule heritageNamesRule" aria-hidden="true"><span>✥</span></div>

        <p className="heritageJourneyMessage">
          {copy.journeyLines.map((line, index) => (
            <span key={`${line}-${index}`}>{line}</span>
          ))}
        </p>

        <div className="heritageLotusMark" aria-hidden="true">♧</div>

        <section className="heritageAssistance" aria-labelledby="back-assistance-title">
          <div className="heritageSectionRule" aria-hidden="true" />
          <h3 id="back-assistance-title"><span aria-hidden="true">✤</span>{copy.assistanceHeading}<span aria-hidden="true">✤</span></h3>
          <ContactDetails contacts={EVENT.contacts} />
        </section>


      </div>
    </article>
  );
}
