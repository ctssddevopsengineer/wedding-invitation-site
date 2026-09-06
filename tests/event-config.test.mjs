import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { EVENT } from '../lib/event.mjs';

test('reception details remain centralized in the deployment template', async () => {
  const source = await readFile(new URL('../lib/event.mjs', import.meta.url), 'utf8');
  const placeholders = [
    'EVENT_TIMEZONE',
    'EVENT_TIMEZONE_OFFSET',
    'EVENT_START_DATE',
    'EVENT_START_TIME',
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
    'BRIDE_FAMILY_PHONE_NUMBER'
  ];

  for (const placeholder of placeholders) {
    assert.match(source, new RegExp(`\\{\\{${placeholder}\\}\\}`));
  }
  assert.ok(EVENT.start instanceof Date);
  assert.equal(Number.isNaN(EVENT.start.getTime()), true);
});

test('Dinner is not part of the event configuration', () => {
  assert.equal(Object.hasOwn(EVENT, 'dinnerLabel'), false);
});

test('InsideRight consumes event constants instead of hardcoding reception values', async () => {
  const source = await readFile(new URL('../components/InsideRight.js', import.meta.url), 'utf8');

  assert.match(source, /EVENT\.dateLabel/);
  assert.match(source, /EVENT\.timeLabel/);
  assert.match(source, /EVENT\.venueName/);
  assert.match(source, /EVENT\.venueAddress/);
  assert.match(source, /EVENT\.mapsUrl/);
  assert.match(source, /EVENT\.start/);

  assert.doesNotMatch(source, />Dinner</i);
});


test('front-cover copy is centralized for dynamic theme rendering', () => {
  assert.equal(EVENT.frontCover.heading, 'Reception');
  assert.equal(EVENT.frontCover.subheading, 'Invitation');
  assert.ok(Array.isArray(EVENT.frontCover.closingLines));
  assert.ok(EVENT.frontCover.closingLines.length >= 2);
});
