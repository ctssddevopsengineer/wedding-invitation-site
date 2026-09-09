import assert from 'node:assert/strict';
import test from 'node:test';
import { createEnvelopeCelebration, isEnvelopeCelebrationPhase } from '../lib/envelope-celebration.mjs';
import { advanceIntro, INTRO_PHASES } from '../lib/intro.mjs';

test('celebration runs only while the envelope opens and the card rises', () => {
  for (const phase of [...Object.keys(INTRO_PHASES), 'complete']) {
    assert.equal(isEnvelopeCelebrationPhase(phase), ['opening', 'rising'].includes(phase));
    assert.equal(isEnvelopeCelebrationPhase(advanceIntro(phase, 'skip')), false);
    assert.equal(isEnvelopeCelebrationPhase(advanceIntro(phase, 'reduce-motion')), false);
  }
  assert.equal(isEnvelopeCelebrationPhase(advanceIntro(advanceIntro('complete', 'reset'), 'open')), true);
});

for (const compact of [false, true]) test(`celebration trajectories are bounded and repeatable (compact=${compact})`, () => {
  const particles = createEnvelopeCelebration(compact);
  assert.equal(particles.length, compact ? 106 : 184);
  assert.equal(new Set(particles.map(p => p.id)).size, particles.length);
  assert.deepEqual(particles, createEnvelopeCelebration(compact));
  for (const side of ['left', 'right']) {
    assert.deepEqual([...new Set(particles.filter(p => p.side === side).map(p => p.type))].sort(), ['firecracker', 'ribbon', 'sprinkler']);
  }
  for (const p of particles) {
    assert.ok(Number.isFinite(p.x) && Math.abs(p.x) <= 165);
    assert.ok(Number.isFinite(p.y) && Math.abs(p.y) <= 310);
    assert.ok(p.delay >= 0);
    assert.ok(p.duration > 0 && (p.delay + p.duration) * 1000 <= INTRO_PHASES.opening.duration + INTRO_PHASES.rising.duration);
  }
});


test('celebration sustains three bursts and staggered fountains through the longer opening', () => {
  assert.equal(INTRO_PHASES.opening.duration + INTRO_PHASES.rising.duration, 6000);
  const particles = createEnvelopeCelebration();
  const bursts = particles.filter(p => p.type === 'firecracker' && p.side === 'left');
  assert.equal(new Set(bursts.map(p => p.delay)).size, 3);
  const fountains = particles.filter(p => p.type === 'sprinkler');
  assert.ok(Math.max(...fountains.map(p => p.delay + p.duration)) > 4.5);
  assert.ok(new Set(fountains.map(p => p.y)).size > 20, 'jets have varied heights');
  assert.ok(particles.every(p => p.gravity > 0), 'all particles fall under gravity');
  assert.ok(particles.filter(p => p.type === 'ribbon').every(p => p.duration >= 2.8));
});
