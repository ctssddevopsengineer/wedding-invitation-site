import test from 'node:test';
import assert from 'node:assert/strict';
import { INVITATION_PAGES, clampPageIndex, nextPageIndex, previousPageIndex } from '../lib/navigation.mjs';

test('defines exactly four invitation pages in the intended order', () => {
  assert.deepEqual(INVITATION_PAGES, ['front', 'inside-left', 'inside-right', 'back']);
});

test('clamps page indexes', () => {
  assert.equal(clampPageIndex(-4), 0);
  assert.equal(clampPageIndex(2), 2);
  assert.equal(clampPageIndex(99), 3);
});

test('moves forward without overflowing', () => {
  assert.equal(nextPageIndex(0), 1);
  assert.equal(nextPageIndex(3), 3);
});

test('moves backward without underflowing', () => {
  assert.equal(previousPageIndex(3), 2);
  assert.equal(previousPageIndex(0), 0);
});
