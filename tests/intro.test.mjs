import assert from 'node:assert/strict';
import test from 'node:test';
import { advanceIntro, INTRO_PHASES, shouldShowIntro } from '../lib/intro.mjs';

test('intro is offered on fresh front entry, without intercepting other pages or repeat visits', () => {
  assert.equal(shouldShowIntro(), true);
  assert.equal(shouldShowIntro({ pageIndex: 0, seen: true }), false);
  for (const pageIndex of [1, 2, 3]) assert.equal(shouldShowIntro({ pageIndex }), false);
});

test('opening progresses through the flap and card before revealing the website', () => {
  let phase = advanceIntro('closed', 'open');
  assert.equal(phase, 'opening');
  phase = advanceIntro(phase, 'advance');
  assert.equal(phase, 'rising');
  phase = advanceIntro(phase, 'advance');
  assert.equal(phase, 'scene');
  phase = advanceIntro(phase, 'advance');
  assert.equal(phase, 'walking');
  phase = advanceIntro(phase, 'advance');
  assert.equal(phase, 'together');
  phase = advanceIntro(phase, 'advance');
  assert.equal(phase, 'revealing');
  phase = advanceIntro(phase, 'advance');
  assert.equal(phase, 'complete');
  assert.equal(advanceIntro(phase, 'advance'), 'complete');
  assert.equal(advanceIntro('closed', 'advance'), 'closed');
  assert.ok(INTRO_PHASES.walking.duration >= 5000, 'walking remains slow and unhurried');
  assert.ok(INTRO_PHASES.together.duration >= 1000, 'the couple pauses before the reveal');
  assert.ok(Object.values(INTRO_PHASES).reduce((sum, step) => sum + step.duration, 0) < 18000, 'the complete intro is bounded');
});

test('missing or late assets bypass only the entrance and still reveal the invitation', () => {
  for (const phase of ['scene', 'walking', 'together']) assert.equal(advanceIntro(phase, 'assets-unavailable'), 'revealing');
  for (const phase of ['closed', 'opening', 'rising', 'revealing', 'complete']) assert.equal(advanceIntro(phase, 'assets-unavailable'), phase);
  assert.equal(advanceIntro(advanceIntro('scene', 'assets-unavailable'), 'advance'), 'complete');
});

test('skip and reduced motion finish at every phase; repeated input cannot restart a running sequence', () => {
  for (const phase of [...Object.keys(INTRO_PHASES), 'complete']) {
    assert.equal(advanceIntro(phase, 'skip'), 'complete');
    assert.equal(advanceIntro(phase, 'reduce-motion'), 'complete');
    assert.equal(advanceIntro(phase, 'reset'), 'closed');
    if (phase !== 'closed') assert.equal(advanceIntro(phase, 'open'), phase);
  }
});

test('replay always starts from a closed envelope after cancellation or completion', () => {
  for (const action of ['skip', 'reduce-motion', 'advance']) {
    const finished = advanceIntro('revealing', action);
    assert.equal(advanceIntro(advanceIntro(finished, 'reset'), 'open'), 'opening');
  }
});
