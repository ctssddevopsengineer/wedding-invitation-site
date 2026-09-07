import assert from 'node:assert/strict';
import test from 'node:test';
import { createWeddingParticles, isParticlePhase } from '../lib/wedding-particles.mjs';

test('particles only run in the wedding scene, never over the envelope or real invitation', () => {
  for (const phase of ['walking', 'together']) assert.equal(isParticlePhase(phase), true);
  for (const phase of ['closed', 'opening', 'rising', 'scene', 'revealing', 'complete', undefined]) assert.equal(isParticlePhase(phase), false);
});

test('desktop and mobile use small, symmetric fields with all three decorative elements', () => {
  for (const [compact, count] of [[false, 20], [true, 8]]) {
    const particles = createWeddingParticles(compact);
    assert.equal(particles.length, count);
    assert.equal(new Set(particles.map((particle) => particle.id)).size, count);
    for (const side of ['left', 'right']) {
      const lane = particles.filter((particle) => particle.side === side);
      assert.equal(lane.length, count / 2);
      assert.deepEqual([...new Set(lane.map((particle) => particle.type))].sort(), ['flower', 'petal', 'spark']);
      assert.equal(lane.filter((particle) => particle.type === 'flower').length, 1, 'floral accents stay occasional');
    }
  }
});

test('the field is deterministic, tiny and slow with staggered falls', () => {
  assert.deepEqual(createWeddingParticles(), createWeddingParticles());
  for (const compact of [false, true]) for (const particle of createWeddingParticles(compact)) {
    assert.ok(particle.position >= 10 && particle.position <= 85);
    assert.ok(particle.duration >= 6 && particle.duration <= 14);
    assert.ok(particle.delay <= 0 && particle.delay > -particle.duration);
    assert.ok(particle.size >= 2 && particle.size <= 12);
    assert.ok(Math.abs(particle.drift) <= (compact ? 4 : 12));
    if (particle.type === 'flower') assert.equal(particle.duration, 14);
  }
});
