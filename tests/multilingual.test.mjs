import assert from 'node:assert/strict';
import test from 'node:test';
import { EVENT } from '../lib/event.mjs';
import { LANGUAGES, formatLocalizedNumber, getInitialLanguage, localizeEvent, resolveLanguage, translate } from '../lib/locale.mjs';
import { TRANSLATIONS } from '../lib/translations.mjs';
import { buildInvitationAbsoluteUrl, getDeepLinkState } from '../lib/deep-link.mjs';
import { buildIcs, buildGoogleCalendarUrl } from '../lib/calendar.mjs';
import { THEME_IDS } from '../lib/theme.mjs';

test('language priority is explicit URL, saved selection, English; invalid input is safe', () => {
  assert.equal(getInitialLanguage({ search: '?lang=bn', storedLanguage: 'ne' }), 'bn');
  assert.equal(getInitialLanguage({ storedLanguage: 'ne' }), 'ne');
  for (const value of ['', 'xx', 'BN', '__proto__', 'constructor', null]) {
    assert.equal(resolveLanguage(value), 'en');
  }
  assert.equal(getInitialLanguage({ search: '?lang=invalid', storedLanguage: 'bn' }), 'en');
  assert.equal(getInitialLanguage(), 'en');
});

test('Bengali and Nepali catalogs cover the same copy with real script and matching substitutions', () => {
  assert.deepEqual(Object.keys(TRANSLATIONS.bn).sort(), Object.keys(TRANSLATIONS.ne).sort());
  for (const [language, catalog] of Object.entries(TRANSLATIONS)) {
    for (const [key, value] of Object.entries(catalog)) {
      assert.ok((language === 'bn' ? /[\u0980-\u09ff]/ : /[\u0900-\u097f]/).test(value), key);
      assert.deepEqual(value.match(/\{\w+\}/g)?.sort() ?? [], key.match(/\{\w+\}/g)?.sort() ?? [], key);
      assert.equal(translate('en', key), key);
    }
  }
  assert.equal(translate('bn', 'untranslated name'), 'untranslated name');
  assert.equal(translate('ne', 'Go to {page}', { page: 'परिवार' }), 'परिवार मा जानुहोस्');
});

test('all 72 theme/page/language combinations keep deep links and language intact', () => {
  for (const themeId of THEME_IDS) for (const language of Object.keys(LANGUAGES)) for (let pageIndex = 0; pageIndex < 4; pageIndex++) {
    const url = new URL(buildInvitationAbsoluteUrl({ origin: 'https://example.com', pathname: '/wedding-invitation-site/', search: '?guest=family', hash: '#card' }, { themeId, pageIndex, language }));
    assert.equal(url.searchParams.get('theme'), themeId);
    assert.equal(url.searchParams.get('lang'), language);
    assert.equal(url.searchParams.get('guest'), 'family');
    assert.equal(getDeepLinkState(url.search).pageIndex, pageIndex);
    assert.equal(url.hash, '#card');
  }
});

test('localization preserves names, contacts, map URLs and event instants without mutating configuration', () => {
  assert.equal(localizeEvent(EVENT, 'en'), EVENT);
  for (const language of ['bn', 'ne']) {
    const event = localizeEvent(EVENT, language);
    for (const key of ['start', 'end', 'timezone', 'groomName', 'brideName', 'venueName', 'venueAddress', 'mapsUrl']) assert.equal(event[key], EVENT[key]);
    assert.equal(event.contacts[0].phone, EVENT.contacts[0].phone);
    assert.equal(event.contacts[0].name, EVENT.contacts[0].name);
    assert.notEqual(event.families.groom.heading, EVENT.families.groom.heading);
    assert.notEqual(event.frontCover.heading, EVENT.frontCover.heading);
    assert.notEqual(event.backCover.heading, EVENT.backCover.heading);
    assert.equal(event.dateLabel, translate(language, 'Reception date will be announced soon.'));
    assert.equal(event.timeLabel, translate(language, 'Reception time will be announced soon.'));
  }
});

test('localized dates use the event timezone and calendars keep their original instants', () => {
  const fixture = { ...EVENT, start: new Date('2027-01-01T19:00:00Z'), end: new Date('2027-01-02T01:00:00Z'), timezone: 'Asia/Kolkata' };
  for (const language of ['bn', 'ne']) {
    const event = localizeEvent(fixture, language);
    assert.equal(event.dateLabel, `${translate(language, 'Saturday')}, ${formatLocalizedNumber('2', language)} ${translate(language, 'January')} ${formatLocalizedNumber('2027', language)}`);
    assert.match(event.timeLabel, language === 'bn' ? /[০-৯]/ : /[०-९]/);
    assert.match(buildIcs(event), /DTSTART:20270101T190000Z/);
    const url = new URL(buildGoogleCalendarUrl(event));
    assert.equal(url.searchParams.get('text'), event.title);
    assert.equal(url.searchParams.get('dates'), '20270101T190000Z/20270102T010000Z');
  }
});
