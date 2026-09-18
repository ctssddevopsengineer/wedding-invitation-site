import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { shapeNepaliDisplayText } from '../lib/devanagari-shaping.mjs';

const component = fs.readFileSync(new URL('../components/InsideLeft.js', import.meta.url), 'utf8');

test('Nirjhara keeps the configured semantic value while adding a shaping hint for display', () => {
  const source = 'निर्झरा दत्त';
  const shaped = shapeNepaliDisplayText(source);

  assert.equal(source, 'निर्झरा दत्त');
  assert.equal(shaped, 'निर्\u200Dझरा दत्त');
  assert.equal(shaped.replace(/\u200D/g, ''), source);
});

test('unrelated Nepali names are not modified', () => {
  for (const value of ['सोमनाथ दत्त', 'सौकर्या', 'दिक्षा', 'श्रीकृष्ण भुजेल']) {
    assert.equal(shapeNepaliDisplayText(value), value);
  }
});

test('inside-left applies shaping only to the Nepali groom-mother display and preserves accessibility text', () => {
  assert.match(component, /language === 'ne'[\s\S]*?shapeNepaliDisplayText\(EVENT\.families\.groom\.mother\)/);
  assert.match(component, /className="familyGroomMotherName"\s+aria-label=\{EVENT\.families\.groom\.mother\}/);
  assert.match(component, />\{groomMotherDisplay\}<\/p>/);
});
