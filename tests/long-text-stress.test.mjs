import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const insideLeft = fs.readFileSync(new URL('../components/InsideLeft.js', import.meta.url), 'utf8');
const insideRight = fs.readFileSync(new URL('../components/InsideRight.js', import.meta.url), 'utf8');
const back = fs.readFileSync(new URL('../components/BackCover.js', import.meta.url), 'utf8');

const STRESS_FIXTURES = Object.freeze({
  person: 'Mr. Abhinav-Chandrashekhar Verylongfamilyname Bhattacharyya-Datta',
  venue: 'The Grand Himalayan Bengal International Heritage Convention and Celebration Centre',
  address: '123 Extremely Long Heritage Boulevard, Near the Riverside Cultural Complex, Barrackpore Cantonment, North 24 Parganas, West Bengal 700120',
  message: 'Your gracious presence, blessings, love and warm wishes will make this very special evening even more meaningful to both of our families.'
});

function approximateLines(text, charactersPerLine) {
  return Math.ceil(text.length / charactersPerLine);
}

test('stress fixtures intentionally exceed normal invitation values', () => {
  assert.ok(STRESS_FIXTURES.person.length > 55);
  assert.ok(STRESS_FIXTURES.venue.length > 70);
  assert.ok(STRESS_FIXTURES.address.length > 120);
  assert.ok(approximateLines(STRESS_FIXTURES.address, 34) >= 4);
});

test('dynamic content remains sourced from EVENT instead of being duplicated into theme layouts', () => {
  assert.match(insideLeft, /EVENT\.families\.groom\.father/);
  assert.match(insideLeft, /EVENT\.families\.bride\.mother/);
  assert.match(insideRight, /EVENT\.venueName/);
  assert.match(insideRight, /EVENT\.venueAddress/);
  assert.match(back, /EVENT\.contacts/);
});

test('long dynamic fields wrap rather than clip or escape their parchment zones', () => {
  assert.match(css, /overflow-wrap:\s*anywhere/);
  assert.match(css, /hyphens:\s*auto/);
  assert.match(css, /text-wrap:\s*balance/);
  assert.match(css, /text-wrap:\s*pretty/);
  assert.match(css, /\.bookApp\[data-invitation-theme\] \.dynamicFrontNames[\s\S]*?white-space:\s*normal/);
  assert.match(css, /\.receptionAddressValue[\s\S]*?max-width:\s*100%/);
});
