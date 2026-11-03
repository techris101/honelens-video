import React from 'react';
import { useCurrentFrame } from 'remotion';
import { C } from '../brand/colors';
import { EASE_IN_OUT, EASE_OUT, mix, progress } from '../motion/ease';

export type CursorKey = { at: number; x: number; y: number; click?: boolean; dur?: number };

/**
 * A pointer that glides between keyframes (eased in-out, slight arc) and clicks.
 * Coordinates are in the parent's pixel space. A click shows a brief press (scale .88)
 * and one thin teal ring that expands and fades. No glow.
 */
export const Cursor: React.FC<{ keys: CursorKey[]; size?: number; appearAt?: number; hideAt?: number }> = ({ keys, size = 34, appearAt, hideAt }) => {
  const frame = useCurrentFrame();
  if (!keys.length) return null;
  let x = keys[0].x, y = keys[0].y;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    const dur = k.dur ?? 30;
    const p = progress(frame, k.at - dur, dur, EASE_IN_OUT);
    if (p <= 0) break;
    const px = x, py = y;
    x = mix(p, px, k.x);
    // gentle arc: lift the path by up to 6% of the distance at mid-travel
    const dist = Math.hypot(k.x - px, k.y - py);
    y = mix(p, py, k.y) - Math.sin(Math.PI * p) * dist * 0.06;
  }
  const clicks = keys.filter(k => k.click).map(k => k.at);
  let press = 0, ring = -1;
  for (const c of clicks) {
    if (frame >= c - 2 && frame < c + 10) press = Math.max(press, 1 - Math.abs(frame - (c + 2)) / 8);
    if (frame >= c && frame < c + 26) ring = (frame - c) / 26;
  }
  const show = (appearAt === undefined ? 1 : progress(frame, appearAt, 10)) * (hideAt === undefined ? 1 : 1 - progress(frame, hideAt, 10));
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${x}px, ${y}px)`, opacity: show, pointerEvents: 'none', zIndex: 1000 }}>
      {ring >= 0 ? (
        <div style={{
          position: 'absolute', left: -size * 0.9 * EASE_OUT(ring), top: -size * 0.9 * EASE_OUT(ring),
          width: size * 1.8 * EASE_OUT(ring), height: size * 1.8 * EASE_OUT(ring), borderRadius: '50%',
          border: `2px solid ${C.teal}`, opacity: 1 - ring,
        }} />
      ) : null}
      <svg width={size} height={size * 1.25} viewBox="0 0 24 30" style={{ transform: `scale(${1 - press * 0.12})`, transformOrigin: '2px 2px', filter: 'drop-shadow(0 2px 3px rgba(24,50,74,.25))' }}>
        <path d="M2 2 L2 24 L8 18.5 L12 27 L15.5 25.4 L11.6 17 L19.5 17 Z" fill={C.navy} stroke="#FFFFFF" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </div>
  );
};
