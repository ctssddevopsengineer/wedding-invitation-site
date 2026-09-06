import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { EVENT } from '../lib/event.mjs';
import { localizeEvent, translate } from '../lib/locale.mjs';
import { transliterate } from '../lib/transliterate.mjs';

const renderSource = fs.readFileSync(new URL('../scripts/render-event-config.mjs', import.meta.url), 'utf8');

const workflowPaths = [
  '../.github/workflows/ci.yml',
  '../.github/workflows/cd.yml',
  '../.github/workflows/deploy-cloudflare.yml'
];
const workflowSources = workflowPaths.map((workflowPath) => ({
  workflowPath,
  source: fs.readFileSync(new URL(workflowPath, import.meta.url), 'utf8')
}));

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

test('all build workflows expose Bengali and Nepali localized variables to config:render', () => {
  const localizedKeys = [
    'GROOM_NAME_BN', 'BRIDE_NAME_BN', 'VENUE_NAME_BN', 'VENUE_ADDRESS_BN',
    'GROOM_FATHER_NAME_BN', 'GROOM_MOTHER_NAME_BN', 'BRIDE_FATHER_NAME_BN', 'BRIDE_MOTHER_NAME_BN',
    'GROOM_FAMILY_CONTACT_NAME_BN', 'BRIDE_FAMILY_CONTACT_NAME_BN',
    'GROOM_NAME_NE', 'BRIDE_NAME_NE', 'VENUE_NAME_NE', 'VENUE_ADDRESS_NE',
    'GROOM_FATHER_NAME_NE', 'GROOM_MOTHER_NAME_NE', 'BRIDE_FATHER_NAME_NE', 'BRIDE_MOTHER_NAME_NE',
    'GROOM_FAMILY_CONTACT_NAME_NE', 'BRIDE_FAMILY_CONTACT_NAME_NE'
  ];

  for (const { workflowPath, source } of workflowSources) {
    for (const key of localizedKeys) {
      assert.match(source, new RegExp(`${key}:\\s*\\$\\{\\{ vars\\.${key} \\}\\}`), `${key} missing from ${workflowPath}`);
    }
  }
});

test('Bengali and Nepali use explicit localized placeholder values everywhere they are rendered', () => {
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

test('missing localized values automatically transliterate base English placeholders', () => {
  const fixture = {
    ...EVENT,
    groomName: 'Soukarya',
    brideName: 'Diksha',
    venueName: 'Royal Palace Banquet',
    venueAddress: '12 West Road Kolkata India',
    localized: { bn: {}, ne: {} },
    families: {
      groom: { ...EVENT.families.groom, father: 'Subrata Datta', mother: 'Madhumita Datta' },
      bride: { ...EVENT.families.bride, father: 'Ramesh Sharma', mother: 'Sunita Sharma' }
    },
    contacts: [
      { ...EVENT.contacts[0], name: 'Subrata Datta' },
      { ...EVENT.contacts[1], name: 'Ramesh Sharma' }
    ]
  };

  const bn = localizeEvent(fixture, 'bn');
  assert.equal(bn.groomName, 'সৌকর্য');
  assert.equal(bn.brideName, 'দীক্ষা');
  assert.doesNotMatch(bn.venueName, /[A-Za-z]/);
  assert.doesNotMatch(bn.venueAddress, /[A-Za-z]/);
  assert.doesNotMatch(bn.families.groom.father, /[A-Za-z]/);
  assert.doesNotMatch(bn.contacts[0].name, /[A-Za-z]/);

  const ne = localizeEvent(fixture, 'ne');
  assert.equal(ne.groomName, 'सौकार्य');
  assert.equal(ne.brideName, 'दीक्षा');
  assert.doesNotMatch(ne.venueName, /[A-Za-z]/);
  assert.doesNotMatch(ne.venueAddress, /[A-Za-z]/);
  assert.doesNotMatch(ne.families.bride.mother, /[A-Za-z]/);
  assert.doesNotMatch(ne.contacts[1].name, /[A-Za-z]/);
});

test('explicit localized values always win over automatic transliteration', () => {
  const fixture = {
    ...EVENT,
    groomName: 'Soukarya',
    brideName: 'Diksha',
    venueName: 'Royal Palace',
    venueAddress: 'Kolkata',
    localized: {
      bn: { groomName: 'সৌকর্য দত্ত', brideName: 'দীক্ষা শর্মা', venueName: 'রাজপ্রাসাদ', venueAddress: 'কলকাতা, পশ্চিমবঙ্গ' },
      ne: { groomName: 'सौकार्य दत्त', brideName: 'दीक्षा शर्मा', venueName: 'राजदरबार', venueAddress: 'कोलकाता' }
    }
  };

  assert.equal(localizeEvent(fixture, 'bn').groomName, 'সৌকর্য দত্ত');
  assert.equal(localizeEvent(fixture, 'bn').venueName, 'রাজপ্রাসাদ');
  assert.equal(localizeEvent(fixture, 'ne').brideName, 'दीक्षा शर्मा');
  assert.equal(localizeEvent(fixture, 'ne').venueName, 'राजदरबार');
});

test('transliterator preserves punctuation and converts digits for Bengali and Nepali', () => {
  assert.equal(transliterate('Soukarya 12', 'bn'), 'সৌকর্য ১২');
  assert.equal(transliterate('Diksha 12', 'ne'), 'दीक्षा १२');
  assert.equal(transliterate('Already বাংলা', 'bn').endsWith(' বাংলা'), true);
  assert.equal(transliterate('Soukarya', 'en'), 'Soukarya');
});

test('source templates may retain deployment tokens until config:render, while localized placeholders remain mapped to base fallbacks', () => {
  assert.equal(EVENT.groomName, '{{GROOM_NAME}}');
  assert.equal(EVENT.brideName, '{{BRIDE_NAME}}');
  assert.equal(EVENT.venueName, '{{VENUE_NAME}}');
  assert.equal(EVENT.venueAddress, '{{VENUE_ADDRESS}}');

  assert.match(renderSource, /const unresolved = \[\.\.\.source\.matchAll\(\/\{\{\(\[A-Z0-9_\]\+\)\}\}\/g\)\]/);
  assert.match(renderSource, /Unresolved invitation placeholders:/);
  assert.match(renderSource, /process\.exit\(1\)/);
  assert.match(renderSource, /configured \|\| process\.env\[fallbackKey\]/);
});

test('placeholder substitutions are translated when the substituted value is itself a translation key', () => {
  assert.equal(translate('bn', 'Go to {page}', { page: 'Front' }), 'প্রচ্ছদ দেখুন');
  assert.equal(translate('ne', 'Use {theme} theme', { theme: 'Deep Red' }), 'गाढा रातो थिम प्रयोग गर्नुहोस्');
});
