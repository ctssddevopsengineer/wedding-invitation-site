'use client';

export default function CompactScrollHint({ visible, label }) {
  return (
    <div
      className="compactScrollHint"
      data-visible={visible ? 'true' : 'false'}
      aria-hidden="true"
    >
      <span>{label}</span>
      <span className="compactScrollHintArrow" aria-hidden="true">↓</span>
    </div>
  );
}
