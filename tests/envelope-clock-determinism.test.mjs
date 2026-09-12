import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const envelopeScript = fs.readFileSync(new URL('../scripts/test-envelope-clipping-browser.mjs', import.meta.url), 'utf8');

test('envelope clipping regression uses a deterministic browser clock origin', () => {
  assert.match(envelopeScript, /const clockOrigin = new Date\('2030-01-01T00:00:00\.000Z'\)/);
  assert.match(envelopeScript, /page\.clock\.install\(\{ time: clockOrigin \}\)/);
  assert.match(envelopeScript, /page\.clock\.pauseAt\(new Date\(clockOrigin\.getTime\(\) \+ 1000\)\)/);
  assert.doesNotMatch(envelopeScript, /page\.clock\.pauseAt\(new Date\(\)\)/);
});
