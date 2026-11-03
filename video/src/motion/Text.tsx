import React from 'react';
import { useCurrentFrame } from 'remotion';
import { C, FONT } from '../brand/colors';
import { EASE_IN, EASE_OUT, mix, progress } from './ease';

type Accent = string[] | undefined;
const isAccent = (word: string, accent: Accent) =>
  !!accent && accent.some(a => word.replace(/[.,:;?]/g, '').toLowerCase() === a.toLowerCase());

/**
 * Kinetic headline: each word rises out of a mask, staggered. Optional exit (words lift away).
 * `lines` lets you force line breaks; each entry is one line. Words in `accent` turn teal
 * (use for at most one word or phrase per line).
 */
export const WordsRise: React.FC<{
  lines: string[];
  at?: number;            // frame the first word starts
  stagger?: number;       // frames between words
  dur?: number;           // frames per word
  exitAt?: number;        // frame the exit starts (omit to stay)
  exitDur?: number;
  accent?: string[];
  style?: React.CSSProperties;
  lineStyle?: React.CSSProperties;
  color?: string;
  accentColor?: string;
  align?: 'left' | 'center' | 'right';
}> = ({ lines, at = 0, stagger = 3, dur = 26, exitAt, exitDur = 14, accent, style, lineStyle, color = C.navy, accentColor = C.teal, align = 'left' }) => {
  const frame = useCurrentFrame();
  let i = 0;
  const exit = exitAt === undefined ? 0 : progress(frame, exitAt, exitDur, EASE_IN);
  return (
    <div style={{ fontFamily: FONT.sans, fontWeight: 600, color, textAlign: align, ...style }}>
      {lines.map((line, li) => (
        <div key={li} style={{ display: 'block', whiteSpace: 'nowrap', ...lineStyle }}>
          {line.split(' ').map((w, wi) => {
            const k = i++;
            const p = progress(frame, at + k * stagger, dur, EASE_OUT);
            const y = mix(p, 105, 0) - exit * 105;
            return (
              <span key={wi} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '0.08em', marginBottom: '-0.08em' }}>
                <span style={{ display: 'inline-block', transform: `translateY(${y}%)`, color: isAccent(w, accent) ? accentColor : undefined }}>
                  {w}
                </span>
                {wi < line.split(' ').length - 1 ? ' ' : null}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/** A supporting line that fades and drifts up 0.4em. Serif by default. */
export const SoftLine: React.FC<{
  children: React.ReactNode; at?: number; dur?: number; exitAt?: number; exitDur?: number; style?: React.CSSProperties;
}> = ({ children, at = 0, dur = 30, exitAt, exitDur = 12, style }) => {
  const frame = useCurrentFrame();
  const p = progress(frame, at, dur);
  const e = exitAt === undefined ? 0 : progress(frame, exitAt, exitDur, EASE_IN);
  return (
    <div style={{ fontFamily: FONT.serif, color: C.slate, opacity: p * (1 - e), transform: `translateY(${mix(p, 0.4, 0) - e * 0.3}em)`, ...style }}>
      {children}
    </div>
  );
};

/**
 * Reveals `text` character by character from `at`, at `cps` characters per second (fps-aware).
 * Used for typing into inputs and for AI answers streaming in. `caret` shows a steady (not blinking)
 * caret while typing.
 */
export const TypeOn: React.FC<{
  text: string; at: number; cps?: number; fps: number; caret?: boolean; style?: React.CSSProperties; caretColor?: string;
}> = ({ text, at, cps = 40, fps, caret = false, style, caretColor = C.teal }) => {
  const frame = useCurrentFrame();
  const n = Math.max(0, Math.min(text.length, Math.floor(((frame - at) / fps) * cps)));
  const typing = frame >= at && n < text.length;
  return (
    <span style={style}>
      {text.slice(0, n)}
      {caret && (typing || (frame >= at && n === text.length && frame < at + (text.length / cps) * fps + fps * 0.4)) ? (
        <span style={{ display: 'inline-block', width: '0.08em', height: '1.05em', background: caretColor, marginLeft: '0.04em', verticalAlign: '-0.15em' }} />
      ) : null}
      {/* Keep layout stable: the untyped rest is present but invisible. */}
      <span style={{ visibility: 'hidden' }}>{text.slice(n)}</span>
    </span>
  );
};

/** Number that counts from `from` to `to` (eased) — for stats like 412 or 24%. */
export const CountUp: React.FC<{ from?: number; to: number; at: number; dur?: number; decimals?: number; suffix?: string; style?: React.CSSProperties }> =
  ({ from = 0, to, at, dur = 40, decimals = 0, suffix = '', style }) => {
    const frame = useCurrentFrame();
    const v = mix(progress(frame, at, dur), from, to);
    return <span style={{ fontVariantNumeric: 'tabular-nums', ...style }}>{v.toFixed(decimals)}{suffix}</span>;
  };
