// Event related constants
const EVENT_TIMEZONE = '{{EVENT_TIMEZONE}}';
const EVENT_TIMEZONE_OFFSET = '{{EVENT_TIMEZONE_OFFSET}}';
const EVENT_START_DATE = new Date('{{EVENT_START_DATE}}T{{EVENT_START_TIME}}{{EVENT_TIMEZONE_OFFSET}}');
const EVENT_END_DATE = new Date(EVENT_START_DATE.getTime() + 6 * 60 * 60 * 1000); // 6 hours later

// Map related constants
const MAPS_URL = '{{GOOGLE_MAPS_URL}}';
const VENUE_NAME = '{{VENUE_NAME}}';
const VENUE_ADDRESS = '{{VENUE_ADDRESS}}';

// Groom and Bride names
const GROOM_NAME = '{{GROOM_NAME}}';
const BRIDE_NAME = '{{BRIDE_NAME}}';

// Groom's parents name
const GROOM_FATHER_NAME = '{{GROOM_FATHER_NAME}}';
const GROOM_MOTHER_NAME = '{{GROOM_MOTHER_NAME}}';

// Bride's parents name
const BRIDE_FATHER_NAME = '{{BRIDE_FATHER_NAME}}';
const BRIDE_MOTHER_NAME = '{{BRIDE_MOTHER_NAME}}';

// Groom and Bride family contact information
const GROOM_FAMILY_CONTACT_NAME = '{{GROOM_FAMILY_CONTACT_NAME}}';
const GROOM_FAMILY_CONTACT_PHONE = '{{GROOM_FAMILY_PHONE_NUMBER}}';
const BRIDE_FAMILY_CONTACT_NAME = '{{BRIDE_FAMILY_CONTACT_NAME}}';
const BRIDE_FAMILY_CONTACT_PHONE = '{{BRIDE_FAMILY_PHONE_NUMBER}}';

// Optional localized placeholder values. The render step automatically falls back
// to the base value when a localized GitHub/environment variable is not defined.
const LOCALIZED_EVENT_VALUES = Object.freeze({
  bn: Object.freeze({
    groomName: '{{GROOM_NAME_BN}}',
    brideName: '{{BRIDE_NAME_BN}}',
    venueName: '{{VENUE_NAME_BN}}',
    venueAddress: '{{VENUE_ADDRESS_BN}}',
    groomFatherName: '{{GROOM_FATHER_NAME_BN}}',
    groomMotherName: '{{GROOM_MOTHER_NAME_BN}}',
    brideFatherName: '{{BRIDE_FATHER_NAME_BN}}',
    brideMotherName: '{{BRIDE_MOTHER_NAME_BN}}',
    groomFamilyContactName: '{{GROOM_FAMILY_CONTACT_NAME_BN}}',
    brideFamilyContactName: '{{BRIDE_FAMILY_CONTACT_NAME_BN}}'
  }),
  ne: Object.freeze({
    groomName: '{{GROOM_NAME_NE}}',
    brideName: '{{BRIDE_NAME_NE}}',
    venueName: '{{VENUE_NAME_NE}}',
    venueAddress: '{{VENUE_ADDRESS_NE}}',
    groomFatherName: '{{GROOM_FATHER_NAME_NE}}',
    groomMotherName: '{{GROOM_MOTHER_NAME_NE}}',
    brideFatherName: '{{BRIDE_FATHER_NAME_NE}}',
    brideMotherName: '{{BRIDE_MOTHER_NAME_NE}}',
    groomFamilyContactName: '{{GROOM_FAMILY_CONTACT_NAME_NE}}',
    brideFamilyContactName: '{{BRIDE_FAMILY_CONTACT_NAME_NE}}'
  })
});

const groomFamilyContact = {
  name: GROOM_FAMILY_CONTACT_NAME,
  phone: GROOM_FAMILY_CONTACT_PHONE
};

const brideFamilyContact = {
  name: BRIDE_FAMILY_CONTACT_NAME,
  phone: BRIDE_FAMILY_CONTACT_PHONE
};

function formatDateLabel(date, locale = 'en-GB', timeZone = EVENT_TIMEZONE) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return 'Reception date will be announced soon.';
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone
    }).format(date);
  } catch (e) {
    return date.toDateString();
  }
}

function formatTime(date, locale = 'en-GB', timeZone = EVENT_TIMEZONE) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return 'Reception time will be announced soon.';
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      hour: 'numeric', minute: '2-digit', hour12: true, timeZone
    }).format(date);
  } catch (e) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

function formatTimeLabel(start, end, locale = 'en-GB', timeZone = EVENT_TIMEZONE) {
  if (!(start instanceof Date) || Number.isNaN(start.getTime())) {
    return 'Reception time will be announced soon.';
  }

  if (start && end) {
    try {
      const sameDay = start.toDateString() === end.toDateString();
      const s = formatTime(start, locale, timeZone);
      const e = formatTime(end, locale, timeZone);
      return sameDay ? `${s} — ${e}` : `${s} onwards`;
    } catch (e) {
      return `${start.toLocaleTimeString()} onwards`;
    }
  }
  return `${formatTime(start, locale, timeZone)} onwards`;
}

export const EVENT = Object.freeze({
  title: `${GROOM_NAME} & ${BRIDE_NAME} — Wedding Reception`,
  groomName: GROOM_NAME,
  brideName: BRIDE_NAME,
  couple: `${GROOM_NAME} & ${BRIDE_NAME}`,
  tagline: 'A Celebration of Two Cultures, One Beautiful Journey',

  frontCover: Object.freeze({
    heading: 'Reception',
    subheading: 'Invitation',
    closingLines: Object.freeze([
      'Together with their families,',
      'invite you to celebrate their wedding reception'
    ])
  }),

  insideLeft: Object.freeze({
    heading: 'With the Blessings of Our Families',
    introLines: Object.freeze([
      'With joy in our hearts and blessings from our elders we cordially invite you to join us for the wedding reception'
    ]),
    closingLines: Object.freeze([
      'Your gracious presence and blessings',
      'will make the occasion truly special.'
    ])
  }),

  backCover: Object.freeze({
    heading: 'With Love & Gratitude',
    messageLines: Object.freeze([
      'Thank you for joining us as two families,',
      'two traditions and two hearts',
      'come together as one.'
    ]),
    journeyLines: Object.freeze([
      'Two cultures. Two families.',
      'One beautiful journey.'
    ]),
    assistanceHeading: 'For Assistance'
  }),

  dateLabel: formatDateLabel(EVENT_START_DATE),
  timeLabel: formatTimeLabel(EVENT_START_DATE),
  start: EVENT_START_DATE,
  end: EVENT_END_DATE,
  timezone: EVENT_TIMEZONE,

  venueName: VENUE_NAME,
  venueAddress: VENUE_ADDRESS,
  mapsUrl: MAPS_URL,
  localized: LOCALIZED_EVENT_VALUES,

  description:
    `Together with their families, ${GROOM_NAME} and ${BRIDE_NAME} invite you to celebrate their wedding reception.`,

  families: Object.freeze({
    groom: Object.freeze({
      heading: "Groom's Family",
      father: GROOM_FATHER_NAME,
      mother: GROOM_MOTHER_NAME
    }),
    bride: Object.freeze({
      heading: "Bride's Family",
      father: BRIDE_FATHER_NAME,
      mother: BRIDE_MOTHER_NAME
    })
  }),

  contacts: Object.freeze([
    Object.freeze({ role: "Groom's Family", name: groomFamilyContact.name, phone: groomFamilyContact.phone }),
    Object.freeze({ role: "Bride's Family", name: brideFamilyContact.name, phone: brideFamilyContact.phone })
  ])
});
