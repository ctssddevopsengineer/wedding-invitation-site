// Seeded variation makes each launch natural while keeping replay deterministic.
export function isEnvelopeCelebrationPhase(phase) {
  return phase === 'opening' || phase === 'rising';
}

export function createEnvelopeCelebration(compact = false) {
  const particles = [];
  let seed = 71;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (const side of ['left', 'right']) {
    const direction = side === 'left' ? 1 : -1;
    for (const type of ['firecracker', 'sprinkler', 'ribbon']) {
      const count = type === 'ribbon' ? (compact ? 5 : 8) : type === 'sprinkler' ? (compact ? 32 : 56) : (compact ? 24 : 42);
      for (let i = 0; i < count; i++) {
        const wave = i % 3;
        const angle = random() * Math.PI * 2;
        const radius = (compact ? 45 : 70) + random() * (compact ? 55 : 95);
        const x = type === 'firecracker' ? Math.cos(angle) * radius : direction * (12 + random() * (compact ? 70 : 145));
        const y = type === 'firecracker' ? Math.sin(angle) * radius : -(90 + random() * (compact ? 130 : 220));
        const gravity = type === 'firecracker' ? 95 : type === 'ribbon' ? 210 : 190;
        particles.push({
          id: `${side}-${type}-${i}`, side, type,
          x: type === 'sprinkler' ? (random() - .5) * (compact ? 64 : 140) : x,
          y: type === 'sprinkler' ? -(100 + random() * (compact ? 100 : 190)) : y,
          gravity,
          iterations: type === 'sprinkler' ? 3 : 1,
          delay: type === 'firecracker' ? .15 + wave * 1.35 + (side === 'right' ? .35 : 0) : type === 'sprinkler' ? i / count * 1.35 : random() * 3.1,
          duration: type === 'ribbon' ? 2.8 : type === 'sprinkler' ? 1.4 : 1.8,
          rotation: direction * (240 + random() * 480),
          angle: Math.atan2(y, x) * 180 / Math.PI,
          size: type === 'ribbon' ? 7 + random() * 5 : 1.5 + random() * 1.8,
          origin: type === 'firecracker' ? 40 + wave * 7 : 72,
          color: type === 'ribbon' ? ['#e8ae54', '#f2a9b4', '#fff1cf'][i % 3] : ['#fff6d1', '#ffdb78', '#efac35'][i % 3]
        });
      }
    }
  }
  return particles;
}
