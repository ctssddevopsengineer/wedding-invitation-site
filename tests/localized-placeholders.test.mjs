import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { EVENT } from '../lib/event.mjs';
import { localizeEvent, translate } from '../lib/locale.mjs';

const renderSource = fs.readFileSync(new URL('../scripts/render-event-config.mjs', import.meta.url), 'utf8');

test('localized invitation placeholders are optional and fall back to base deployment values', () => {
  for (const key of [
    'GROOM_NAME_BN', 'BRIDE_NAME_BN', 'VENUE_NAME_BN', 'VENUE_ADDRESS_BN',
    'GROOM_FATHER_NAME_BN', 'GROOM_MOTHER_NAME_BN', 'BRIDE_FATHER_NAME_BN', 'BRIDE_MOTHER_NAME_BN',
    'GROOM_FAMILY_CONTACT_NAME_BN', 'BRIDE_FAMILY_CONTACT_NAME_BN',
    'GROOM_NAME_NE', 'BRIDE_NAME_NE', 'VENUE_NAME_NE', 'VENUE_ADDRESS_NE',
    'GROOM_FATHER_NAME_NE', 'GROOM_MOTHER_NAME_NE', 'BRIDE_FATHER_NAME_NE', 'BRIDE_MOTHER_NAME_NE',
    'GROOM_FAMILY_CONTACT_NAME_NE', 'BRIDE_FAMILY_CONTACT_NAME_NE'
  ]) {
    assert.match(renderSource, new RegExp(`${key}:`), `${key} fallback missing`);
  }
  assert.match(renderSource, /configured \|\| process\.env\[fallbackKey\]/);
});

test('Bengali and Nepali use localized placeholder values everywhere they are rendered', () => {
  const fixture = {
    ...EVENT,
    groomName: 'Groom',
    brideName: 'Bride',
    couple: 'Groom & Bride',
    venueName: 'Venue',
    venueAddress: 'Address',
    localized: {
      bn: {
        groomName: 'বর', brideName: 'কনে', venueName: 'অনুষ্ঠানস্থল', venueAddress: 'বাংলা ঠিকানা',
        groomFatherName: 'বরের বাবা', groomMotherName: 'বরের মা', brideFatherName: 'কনের বাবা', brideMotherName: 'কনের মা',
        groomFamilyContactName: 'বরপক্ষ', brideFamilyContactName: 'কনেপক্ষ'
      },
      ne: {
        groomName: 'दुलाहा', brideName: 'दुलही', venueName: 'समारोह स्थल', venueAddress: 'नेपाली ठेगाना',
        groomFatherName: 'दुलाहाका बुबा', groomMotherName: 'दुलाहाकी आमा', brideFatherName: 'दुलहीका बुबा', brideMotherName: 'दुलहीकी आमा',
        groomFamilyContactName: 'दुलाहा पक्ष', brideFamilyContactName: 'दुलही पक्ष'
      }
    },
    families: {
      groom: { ...EVENT.families.groom, father: 'GF', mother: 'GM' },
      bride: { ...EVENT.families.bride, father: 'BF', mother: 'BM' }
    },
    contacts: [
      { ...EVENT.contacts[0], name: 'Groom contact' },
      { ...EVENT.contacts[1], name: 'Bride contact' }
    ]
  };

  const bn = localizeEvent(fixture, 'bn');
  assert.equal(bn.groomName, 'বর');
  assert.equal(bn.brideName, 'কনে');
  assert.equal(bn.couple, 'বর & কনে');
  assert.equal(bn.venueName, 'অনুষ্ঠানস্থল');
  assert.equal(bn.venueAddress, 'বাংলা ঠিকানা');
  assert.equal(bn.families.groom.father, 'বরের বাবা');
  assert.equal(bn.families.bride.mother, 'কনের মা');
  assert.equal(bn.contacts[0].name, 'বরপক্ষ');
  assert.equal(bn.contacts[1].name, 'কনেপক্ষ');
  assert.match(bn.description, /বর & কনে/);

  const ne = localizeEvent(fixture, 'ne');
  assert.equal(ne.groomName, 'दुलाहा');
  assert.equal(ne.brideName, 'दुलही');
  assert.equal(ne.couple, 'दुलाहा & दुलही');
  assert.equal(ne.venueName, 'समारोह स्थल');
  assert.equal(ne.venueAddress, 'नेपाली ठेगाना');
  assert.equal(ne.families.groom.mother, 'दुलाहाकी आमा');
  assert.equal(ne.families.bride.father, 'दुलहीका बुबा');
  assert.equal(ne.contacts[0].name, 'दुलाहा पक्ष');
  assert.equal(ne.contacts[1].name, 'दुलही पक्ष');
  assert.match(ne.description, /दुलाहा & दुलही/);
});

test('unrendered localized tokens never leak into npm test localization output', () => {
  const event = localizeEvent(EVENT, 'bn');
  for (const value of [event.groomName, event.brideName, event.venueName, event.venueAddress]) {
    assert.doesNotMatch(String(value), /^\{\{[A-Z0-9_]+\}\}$/);
  }
});

test('placeholder substitutions are translated when the substituted value is itself a translation key', () => {
  assert.equal(translate('bn', 'Go to {page}', { page: 'Front' }), 'প্রচ্ছদ দেখুন');
  assert.equal(translate('ne', 'Use {theme} theme', { theme: 'Deep Red' }), 'गाढा रातो थिम प्रयोग गर्नुहोस्');
});
