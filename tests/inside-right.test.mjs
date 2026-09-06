import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../components/InsideRight.js', import.meta.url), 'utf8');

test('inside right renders reception values from EVENT constants', () => {
  for (const property of ['dateLabel', 'timeLabel', 'venueName', 'venueAddress', 'mapsUrl', 'start']) {
    assert.match(source, new RegExp(`EVENT\\.${property}`));
  }
});

test('inside right contains no Dinner field or Dinner UI', () => {
  assert.doesNotMatch(source, /Dinner/i);
});

test('calendar and countdown are inside the reception details overlay', () => {
  const overlayStart = source.indexOf('className="receptionDetailsOverlay"');
  const overlayEnd = source.indexOf('</section>', overlayStart);
  const overlaySource = source.slice(overlayStart, overlayEnd);
  assert.match(overlaySource, /<CalendarButtons \/>/);
  assert.match(overlaySource, /<Countdown target=\{EVENT\.start\} \/>/);
});

test('location medallion supports hover, focus and click interactions', () => {
  assert.match(source, /onMouseEnter=\{openOnHover\}/);
  assert.match(source, /onFocus=\{openOnHover\}/);
  assert.match(source, /onClick=\{togglePinnedLocation\}/);
  assert.match(source, /EVENT\.venueName/);
  assert.match(source, /EVENT\.venueAddress/);
  assert.match(source, /EVENT\.mapsUrl/);
});


test('Rani Magenta can render the blank-template Location / Map label dynamically without affecting other themes', () => {
  assert.match(source, /theme\.dynamicLocationLabel/);
  assert.match(source, /insideRightDynamicLocationLabel/);
  assert.match(source, /t\("Location \/"\)/);
  assert.match(source, /t\("Map"\)/);
});
