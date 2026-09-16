import assert from 'node:assert/strict';
import test from 'node:test';
import { CRITICAL_VISUAL_VIEWPORTS, VISUAL_REGRESSION_CASES } from '../lib/visual-regression.mjs';

test('critical visual regression matrix covers phones through small tablets, tablets, laptops and large desktops', () => {
  assert.deepEqual(
    CRITICAL_VISUAL_VIEWPORTS.map(({ width, height }) => `${width}x${height}`),
    ['320x658', '360x800', '390x844', '412x915', '640x360', '768x1024', '1366x768', '1920x1080', '712x1138']
  );
});

test('visual regression matrix includes the English Classic 681–767px bridge plus full tablet/laptop language coverage', () => {
  assert.equal(VISUAL_REGRESSION_CASES.length, 147);
  for (const viewport of CRITICAL_VISUAL_VIEWPORTS) {
    const expected =
      viewport.name === 'small-tablet' ? 1 :
      viewport.name === 'tablet' ? 64 :
      viewport.name === 'laptop' ? 64 :
      3;
    assert.equal(VISUAL_REGRESSION_CASES.filter((item) => item.viewport.name === viewport.name).length, expected);
  }

  const smallTabletEnglish = VISUAL_REGRESSION_CASES.filter(
    (item) => item.viewport.name === 'small-tablet' &&
      item.theme === 'classic' &&
      item.page === 'front' &&
      item.language === 'en'
  );
  assert.equal(smallTabletEnglish.length, 1);

  for (const viewportName of ['tablet', 'laptop']) {
    const babyPinkStates = VISUAL_REGRESSION_CASES
      .filter((item) => item.viewport.name === viewportName && item.theme === 'blush')
      .map((item) => `${item.page}:${item.language}`);
    assert.equal(new Set(babyPinkStates).size, 12);
    for (const page of ['front', 'family', 'details', 'back']) {
      for (const language of ['en', 'bn', 'ne']) {
        assert.ok(babyPinkStates.includes(`${page}:${language}`), `missing Baby Pink ${viewportName} ${page} ${language}`);
      }
    }
  }

  for (const viewportName of ['tablet', 'laptop']) {
    const magentaStates = VISUAL_REGRESSION_CASES
      .filter((item) => item.viewport.name === viewportName && item.theme === 'magenta')
      .map((item) => `${item.page}:${item.language}`);
    assert.equal(new Set(magentaStates).size, 12);
    for (const page of ['front', 'family', 'details', 'back']) {
      for (const language of ['en', 'bn', 'ne']) {
        assert.ok(magentaStates.includes(`${page}:${language}`), `missing Rani Magenta ${viewportName} ${page} ${language}`);
      }
    }
  }

  for (const viewportName of ['tablet', 'laptop']) {
    const navyStates = VISUAL_REGRESSION_CASES
      .filter((item) => item.viewport.name === viewportName && item.theme === 'navy')
      .map((item) => `${item.page}:${item.language}`);
    assert.equal(new Set(navyStates).size, 12);
    for (const page of ['front', 'family', 'details', 'back']) {
      for (const language of ['en', 'bn', 'ne']) {
        assert.ok(navyStates.includes(`${page}:${language}`), `missing Royal Navy ${viewportName} ${page} ${language}`);
      }
    }
  }

  for (const viewportName of ['tablet', 'laptop']) {
    const plumStates = VISUAL_REGRESSION_CASES
      .filter((item) => item.viewport.name === viewportName && item.theme === 'plum')
      .map((item) => `${item.page}:${item.language}`);
    assert.equal(new Set(plumStates).size, 12);
    for (const page of ['front', 'family', 'details', 'back']) {
      for (const language of ['en', 'bn', 'ne']) {
        assert.ok(plumStates.includes(`${page}:${language}`), `missing Royal Plum ${viewportName} ${page} ${language}`);
      }
    }
  }

  for (const viewportName of ['tablet', 'laptop']) {
    const saffronStates = VISUAL_REGRESSION_CASES
      .filter((item) => item.viewport.name === viewportName && item.theme === 'saffron')
      .map((item) => `${item.page}:${item.language}`);
    assert.equal(new Set(saffronStates).size, 12);
    for (const page of ['front', 'family', 'details', 'back']) {
      for (const language of ['en', 'bn', 'ne']) {
        assert.ok(saffronStates.includes(`${page}:${language}`), `missing Saffron Gold ${viewportName} ${page} ${language}`);
      }
    }
  }

  for (const viewportName of ['tablet', 'laptop']) {
    const languages = VISUAL_REGRESSION_CASES
      .filter((item) => item.viewport.name === viewportName && item.theme === 'classic' && item.page === 'front')
      .map((item) => item.language)
      .sort();
    assert.deepEqual(languages, ['bn', 'en', 'ne']);
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
