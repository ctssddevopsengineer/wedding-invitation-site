import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const target = path.resolve(process.cwd(), 'lib/event.mjs');

const requiredKeys = [
  'GOOGLE_MAPS_URL',
  'VENUE_NAME',
  'VENUE_ADDRESS',
  'GROOM_NAME',
  'BRIDE_NAME',
  'GROOM_FATHER_NAME',
  'GROOM_MOTHER_NAME',
  'BRIDE_FATHER_NAME',
  'BRIDE_MOTHER_NAME',
  'GROOM_FAMILY_CONTACT_NAME',
  'GROOM_FAMILY_PHONE_NUMBER',
  'BRIDE_FAMILY_CONTACT_NAME',
  'BRIDE_FAMILY_PHONE_NUMBER',
  'EVENT_TIMEZONE',
  'EVENT_TIMEZONE_OFFSET',
  'EVENT_START_DATE',
  'EVENT_START_TIME'
];

const localizedFallbacks = Object.freeze({
  GROOM_NAME_BN: 'GROOM_NAME',
  BRIDE_NAME_BN: 'BRIDE_NAME',
  VENUE_NAME_BN: 'VENUE_NAME',
  VENUE_ADDRESS_BN: 'VENUE_ADDRESS',
  GROOM_FATHER_NAME_BN: 'GROOM_FATHER_NAME',
  GROOM_MOTHER_NAME_BN: 'GROOM_MOTHER_NAME',
  BRIDE_FATHER_NAME_BN: 'BRIDE_FATHER_NAME',
  BRIDE_MOTHER_NAME_BN: 'BRIDE_MOTHER_NAME',
  GROOM_FAMILY_CONTACT_NAME_BN: 'GROOM_FAMILY_CONTACT_NAME',
  BRIDE_FAMILY_CONTACT_NAME_BN: 'BRIDE_FAMILY_CONTACT_NAME',
  GROOM_NAME_NE: 'GROOM_NAME',
  BRIDE_NAME_NE: 'BRIDE_NAME',
  VENUE_NAME_NE: 'VENUE_NAME',
  VENUE_ADDRESS_NE: 'VENUE_ADDRESS',
  GROOM_FATHER_NAME_NE: 'GROOM_FATHER_NAME',
  GROOM_MOTHER_NAME_NE: 'GROOM_MOTHER_NAME',
  BRIDE_FATHER_NAME_NE: 'BRIDE_FATHER_NAME',
  BRIDE_MOTHER_NAME_NE: 'BRIDE_MOTHER_NAME',
  GROOM_FAMILY_CONTACT_NAME_NE: 'GROOM_FAMILY_CONTACT_NAME',
  BRIDE_FAMILY_CONTACT_NAME_NE: 'BRIDE_FAMILY_CONTACT_NAME'
});

const missing = requiredKeys.filter((key) => !String(process.env[key] ?? '').trim());
if (missing.length) {
  console.error(`Missing required invitation configuration: ${missing.join(', ')}`);
  process.exit(1);
}

let source = fs.readFileSync(target, 'utf8');

function replaceToken(key, value) {
  const token = `{{${key}}}`;
  const escapedValue = JSON.stringify(String(value)).slice(1, -1);
  source = source.split(token).join(escapedValue);
}

for (const key of requiredKeys) replaceToken(key, process.env[key]);

for (const [localizedKey, fallbackKey] of Object.entries(localizedFallbacks)) {
  const configured = String(process.env[localizedKey] ?? '').trim();
  replaceToken(localizedKey, configured || process.env[fallbackKey]);
}

const unresolved = [...source.matchAll(/{{([A-Z0-9_]+)}}/g)].map((match) => match[1]);
if (unresolved.length) {
  console.error(`Unresolved invitation placeholders: ${[...new Set(unresolved)].join(', ')}`);
  process.exit(1);
}

fs.writeFileSync(target, source, 'utf8');
console.log('Invitation event configuration rendered successfully.');
