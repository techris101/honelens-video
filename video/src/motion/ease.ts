import { Easing, interpolate } from 'remotion';

// One motion language for both videos. Entrances decelerate hard (expo-like out), exits accelerate
// gently. No bounce, no overshoot: the brand is calm and exact.
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN = Easing.bezier(0.55, 0, 0.75, 0.2);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EASE_SOFT = Easing.bezier(0.33, 0, 0.2, 1);

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** 0 → 1 between `start` and `start + dur` (frames), eased. */
export const progress = (frame: number, start: number, dur: number, easing = EASE_OUT) =>
  interpolate(frame, [start, start + Math.max(1, dur)], [0, 1], { ...clamp, easing });

/** Map a 0..1 progress onto a range. */
export const mix = (p: number, from: number, to: number) => from + (to - from) * p;

/** Value that enters at `inAt` and leaves at `outAt` (both eased), e.g. for opacity. */
export const inOut = (frame: number, inAt: number, inDur: number, outAt: number, outDur: number) =>
  Math.min(progress(frame, inAt, inDur), 1 - progress(frame, outAt, outDur, EASE_IN));

/** Linear clamp helper. */
export const lin = (frame: number, input: [number, number], output: [number, number]) =>
  interpolate(frame, input, output, clamp);

/** Seconds → frames at the composition fps. */
export const sec = (s: number, fps: number) => Math.round(s * fps);
