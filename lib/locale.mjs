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
  return text.replace(/\{(\w+)\}/g, (match, name) => String(values[name] ?? match));
}
// Some browsers omit Nepali ICU data. Explicit digits and translated date parts
// avoid silently falling back to English while retaining timezone correctness.
export function formatLocalizedNumber(value, language) {
  const digits = { bn: '০১২৩৪৫৬৭৮৯', ne: '०१२३४५६७८९' }[language];
  return digits ? String(value).replace(/[0-9]/g, (digit) => digits[Number(digit)]) : String(value);
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
  return {
    ...event, dateLabel, timeLabel,
    title: `${event.couple} — ${t('Wedding Reception')}`,
    description: t('Together with their families, {couple} invite you to celebrate their wedding reception.', { couple: event.couple }),
    tagline: t(event.tagline),
    frontCover: { heading: t(event.frontCover.heading), subheading: t(event.frontCover.subheading), closingLines: lines(event.frontCover.closingLines) },
    insideLeft: { heading: t(event.insideLeft.heading), introLines: lines(event.insideLeft.introLines), closingLines: lines(event.insideLeft.closingLines) },
    backCover: { heading: t(event.backCover.heading), messageLines: lines(event.backCover.messageLines), journeyLines: lines(event.backCover.journeyLines), assistanceHeading: t(event.backCover.assistanceHeading) },
    families: Object.fromEntries(Object.entries(event.families).map(([key, family]) => [key, { ...family, heading: t(family.heading) }])),
    contacts: event.contacts.map((contact) => ({ ...contact, role: t(contact.role) }))
  };
}
