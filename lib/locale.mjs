import { TRANSLATIONS } from './translations.mjs';

export const LANGUAGE_STORAGE_KEY = 'sd-invitation-language';
export const LANGUAGES = Object.freeze({ en: 'English', bn: 'বাংলা', ne: 'नेपाली' });
export function resolveLanguage(value) {
  return Object.hasOwn(LANGUAGES, value) ? value : 'en';
}
export function getInitialLanguage({ search = '', storedLanguage } = {}) {
  const params = new URLSearchParams(search);
  return resolveLanguage(params.has('lang') ? params.get('lang') : storedLanguage);
}
export function translate(language, key, values = {}) {
  const catalog = TRANSLATIONS[resolveLanguage(language)];
  const text = catalog && Object.hasOwn(catalog, key) ? catalog[key] : key;
  return text.replace(/\{(\w+)\}/g, (match, name) => {
    const value = values[name];
    if (value == null) return match;
    if (typeof value === 'string' && catalog && Object.hasOwn(catalog, value)) return catalog[value];
    return String(value);
  });
}
// Some browsers omit Nepali ICU data. Explicit digits and translated date parts
// avoid silently falling back to English while retaining timezone correctness.
export function formatLocalizedNumber(value, language) {
  const digits = { bn: '০১২৩৪৫৬৭৮৯', ne: '०१२३४५६७८९' }[language];
  return digits ? String(value).replace(/[0-9]/g, (digit) => digits[Number(digit)]) : String(value);
}

function configuredValue(event, language, key, fallback) {
  const localized = event.localized?.[language]?.[key];
  if (typeof localized === 'string' && localized.trim()) return localized;
  const translated = translate(language, fallback);
  return translated === fallback ? fallback : translated;
}

export function localizeEvent(event, language) {
  language = resolveLanguage(language);
  if (language === 'en') return event;
  const t = (key, values) => translate(language, key, values);
  const lines = (items) => items.map((item) => t(item));
  const valid = event.start instanceof Date && !Number.isNaN(event.start.getTime());
  const parts = (options) => Object.fromEntries(new Intl.DateTimeFormat('en-GB', { ...options, timeZone: event.timezone }).formatToParts(event.start).map(({ type, value }) => [type, value]));
  let dateLabel = t('Reception date will be announced soon.');
  let timeLabel = t('Reception time will be announced soon.');
  if (valid) {
    try {
      const date = parts({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      const time = parts({ hour: 'numeric', minute: '2-digit', hour12: true });
      dateLabel = `${t(date.weekday)}, ${formatLocalizedNumber(date.day, language)} ${t(date.month)} ${formatLocalizedNumber(date.year, language)}`;
      timeLabel = `${formatLocalizedNumber(time.hour, language)}:${formatLocalizedNumber(time.minute, language)} ${t(time.dayPeriod.toUpperCase())} ${t('onwards')}`;
    } catch { dateLabel = event.dateLabel; timeLabel = event.timeLabel; }
  }

  const groomName = configuredValue(event, language, 'groomName', event.groomName);
  const brideName = configuredValue(event, language, 'brideName', event.brideName);
  const couple = `${groomName} & ${brideName}`;
  const venueName = configuredValue(event, language, 'venueName', event.venueName);
  const venueAddress = configuredValue(event, language, 'venueAddress', event.venueAddress);

  const groomFamily = {
    ...event.families.groom,
    heading: t(event.families.groom.heading),
    father: configuredValue(event, language, 'groomFatherName', event.families.groom.father),
    mother: configuredValue(event, language, 'groomMotherName', event.families.groom.mother)
  };
  const brideFamily = {
    ...event.families.bride,
    heading: t(event.families.bride.heading),
    father: configuredValue(event, language, 'brideFatherName', event.families.bride.father),
    mother: configuredValue(event, language, 'brideMotherName', event.families.bride.mother)
  };

  return {
    ...event,
    groomName,
    brideName,
    couple,
    venueName,
    venueAddress,
    dateLabel,
    timeLabel,
    title: `${couple} — ${t('Wedding Reception')}`,
    description: t('Together with their families, {couple} invite you to celebrate their wedding reception.', { couple }),
    tagline: t(event.tagline),
    frontCover: { heading: t(event.frontCover.heading), subheading: t(event.frontCover.subheading), closingLines: lines(event.frontCover.closingLines) },
    insideLeft: { heading: t(event.insideLeft.heading), introLines: lines(event.insideLeft.introLines), closingLines: lines(event.insideLeft.closingLines) },
    backCover: { heading: t(event.backCover.heading), messageLines: lines(event.backCover.messageLines), journeyLines: lines(event.backCover.journeyLines), assistanceHeading: t(event.backCover.assistanceHeading) },
    families: { groom: groomFamily, bride: brideFamily },
    contacts: event.contacts.map((contact, index) => ({
      ...contact,
      role: t(contact.role),
      name: configuredValue(event, language, index === 0 ? 'groomFamilyContactName' : 'brideFamilyContactName', contact.name)
    }))
  };
}
