import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('../scripts/test-multilingual-browser.mjs', import.meta.url), 'utf8');

test('responsive browser regression retries transient invitation image decode races', () => {
  assert.match(source, /async function waitForInvitationImages\(page\)/);
  assert.match(source, /image\.complete && image\.naturalWidth > 0 && image\.naturalHeight > 0/);
  assert.match(source, /for \(let attempt = 0; attempt < 3; attempt\+\+\)/);
  assert.match(source, /await image\.decode\(\)/);
  assert.match(source, /requestAnimationFrame\(\(\) => requestAnimationFrame\(resolve\)\)/);
  assert.match(source, /await waitForInvitationImages\(page\)/);
});
