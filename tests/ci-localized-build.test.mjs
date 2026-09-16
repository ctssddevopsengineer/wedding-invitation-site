import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const workflow = fs.readFileSync(new URL('../.github/workflows/new-ci.yml', import.meta.url), 'utf8');
const buildStart = workflow.indexOf('  build:');
const responsiveStart = workflow.indexOf('  responsive-browser-regression:');
const buildJob = workflow.slice(buildStart, responsiveStart);

test('production static export passes localized Bengali and Nepali invitation variables', () => {
  for (const key of [
    'GROOM_NAME_BN', 'BRIDE_NAME_BN', 'VENUE_NAME_BN', 'VENUE_ADDRESS_BN',
    'GROOM_FATHER_NAME_BN', 'GROOM_MOTHER_NAME_BN', 'BRIDE_FATHER_NAME_BN', 'BRIDE_MOTHER_NAME_BN',
    'GROOM_FAMILY_CONTACT_NAME_BN', 'BRIDE_FAMILY_CONTACT_NAME_BN',
    'GROOM_NAME_NE', 'BRIDE_NAME_NE', 'VENUE_NAME_NE', 'VENUE_ADDRESS_NE',
    'GROOM_FATHER_NAME_NE', 'GROOM_MOTHER_NAME_NE', 'BRIDE_FATHER_NAME_NE', 'BRIDE_MOTHER_NAME_NE',
    'GROOM_FAMILY_CONTACT_NAME_NE', 'BRIDE_FAMILY_CONTACT_NAME_NE'
  ]) {
    assert.ok(buildJob.includes(`${key}: ${{ vars.${key} }}`), `build job must pass ${key}`);
  }
});

test('responsive browser matrix consumes the tested production static export', () => {
  const responsiveJob = workflow.slice(responsiveStart, workflow.indexOf('  intro-browser-regression:'));
  assert.match(responsiveJob, /name:\s*wedding-site-static-export/);
  assert.match(responsiveJob, /path:\s*out/);
});
