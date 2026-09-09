import assert from 'node:assert/strict';
import test from 'node:test';
import { CRITICAL_VISUAL_VIEWPORTS, VISUAL_REGRESSION_CASES } from '../lib/visual-regression.mjs';

test('critical visual regression matrix uses eight representative viewport profiles', () => {
  assert.deepEqual(
    CRITICAL_VISUAL_VIEWPORTS.map(({ width, height }) => `${width}x${height}`),
    ['320x658', '360x800', '390x844', '412x915', '640x360', '768x1024', '1366x768', '1920x1080']
  );
});

test('visual regression matrix has three deterministic states per viewport', () => {
  assert.equal(VISUAL_REGRESSION_CASES.length, 24);
  for (const viewport of CRITICAL_VISUAL_VIEWPORTS) {
    assert.equal(VISUAL_REGRESSION_CASES.filter((item) => item.viewport.name === viewport.name).length, 3);
  }
});

test('visual regression matrix represents every theme, page and language', () => {
  assert.deepEqual([...new Set(VISUAL_REGRESSION_CASES.map((item) => item.theme))].sort(), ['blush', 'classic', 'magenta', 'navy', 'plum', 'saffron']);
  assert.deepEqual([...new Set(VISUAL_REGRESSION_CASES.map((item) => item.page))].sort(), ['back', 'details', 'family', 'front']);
  assert.deepEqual([...new Set(VISUAL_REGRESSION_CASES.map((item) => item.language))].sort(), ['bn', 'en', 'ne']);
});

test('visual case ids are stable and unique', () => {
  const ids = VISUAL_REGRESSION_CASES.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const item of VISUAL_REGRESSION_CASES) {
    assert.equal(item.id, `${item.viewport.name}-${item.theme}-${item.page}-${item.language}`);
  }
});
