import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../brand/colors';
import { EASE_IN, EASE_IN_OUT, EASE_OUT, mix, progress } from './ease';

export type Enter = 'none' | 'fade' | 'rise' | 'scale';
export type Exit = 'none' | 'fade' | 'lift' | 'scale';

/**
 * Every scene sits in a SceneShell. It owns the background, a slow camera drift (1.00 → `drift`)
 * and the scene's own entrance and exit, so scenes can be placed back to back with no overlap.
 */
export const SceneShell: React.FC<{
  children: React.ReactNode;
  bg?: string;
  enter?: Enter;
  exit?: Exit;
  enterDur?: number;
  exitDur?: number;
  drift?: number;
  style?: React.CSSProperties;
}> = ({ children, bg = C.paper, enter = 'fade', exit = 'fade', enterDur = 14, exitDur = 12, drift = 1.02, style }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const pin = enter === 'none' ? 1 : progress(frame, 0, enterDur, EASE_OUT);
  const pout = exit === 'none' ? 0 : progress(frame, durationInFrames - exitDur, exitDur, EASE_IN);
  const cam = mix(progress(frame, 0, durationInFrames, EASE_IN_OUT), 1, drift);
  let opacity = 1, ty = 0, sc = 1;
  if (enter === 'fade' || enter === 'rise' || enter === 'scale') opacity *= pin;
  if (enter === 'rise') ty += mix(pin, 60, 0);
  if (enter === 'scale') sc *= mix(pin, 0.96, 1);
  if (exit === 'fade' || exit === 'lift' || exit === 'scale') opacity *= 1 - pout;
  if (exit === 'lift') ty -= pout * 60;
  if (exit === 'scale') sc *= mix(pout, 1, 1.03);
  return (
    <AbsoluteFill style={{ background: bg }}>
      <AbsoluteFill style={{ opacity, transform: `translateY(${ty}px) scale(${sc * cam})`, ...style }}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export type CamKey = { at: number; x?: number; y?: number; scale?: number };

/**
 * Camera moves between keyframes (eased in-out). x/y are px offsets of the content (negative x
 * moves the view right), scale is a zoom around the frame centre. Hold a key by repeating it.
 */
export const Camera: React.FC<{ keys: CamKey[]; children: React.ReactNode; dur?: number; style?: React.CSSProperties }> = ({ keys, children, dur = 36, style }) => {
  const frame = useCurrentFrame();
  let x = keys[0]?.x ?? 0, y = keys[0]?.y ?? 0, s = keys[0]?.scale ?? 1;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    const p = progress(frame, k.at, dur, EASE_IN_OUT);
    if (p <= 0) break;
    x = mix(p, x, k.x ?? x); y = mix(p, y, k.y ?? y); s = mix(p, s, k.scale ?? s);
  }
  return (
    <AbsoluteFill style={{ transform: `translate(${x}px, ${y}px) scale(${s})`, transformOrigin: '50% 50%', ...style }}>
      {children}
    </AbsoluteFill>
  );
};

/** Element that appears (fade + 16px rise) at `at`. Optional exit. */
export const Appear: React.FC<{ at: number; dur?: number; exitAt?: number; exitDur?: number; dy?: number; dx?: number; scaleFrom?: number; style?: React.CSSProperties; children: React.ReactNode }> =
  ({ at, dur = 22, exitAt, exitDur = 12, dy = 16, dx = 0, scaleFrom = 1, style, children }) => {
    const frame = useCurrentFrame();
    const p = progress(frame, at, dur);
    const e = exitAt === undefined ? 0 : progress(frame, exitAt, exitDur, EASE_IN);
    return (
      <div style={{ opacity: p * (1 - e), transform: `translate(${mix(p, dx, 0)}px, ${mix(p, dy, 0) - e * dy}px) scale(${mix(p, scaleFrom, 1)})`, ...style }}>
        {children}
      </div>
    );
  };

/**
 * The brand's one attention effect, for video: a soft teal-tint background that fades in and out
 * once (600 ms in the product; here `dur` frames). Wrap the element that just changed.
 */
export const Highlight: React.FC<{ at: number; dur?: number; children: React.ReactNode; style?: React.CSSProperties; hold?: boolean }> = ({ at, dur = 36, children, style, hold = false }) => {
  const frame = useCurrentFrame();
  const a = progress(frame, at, dur * 0.3);
  const b = hold ? 0 : progress(frame, at + dur * 0.3, dur * 0.7);
  const o = a * (1 - b);
  return <div style={{ background: `rgba(227,240,241,${o})`, borderRadius: 8, ...style }}>{children}</div>;
};
