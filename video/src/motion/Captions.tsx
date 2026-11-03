import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, FONT } from '../brand/colors';
import { EASE_IN, mix, progress } from './ease';
import { WordsRise } from './Text';

/**
 * Short-video caption: big Plex Sans semibold in the top safe band (TikTok/Shorts UI covers the
 * bottom ~22% and the right edge). One idea, at most 2 lines, optional teal accent word.
 */
export const ShortCaption: React.FC<{
  lines: string[]; at: number; exitAt?: number; accent?: string[]; top?: number; size?: number; sub?: string; subAt?: number;
}> = ({ lines, at, exitAt, accent, top = 230, size = 92, sub, subAt }) => {
  const frame = useCurrentFrame();
  const subP = sub ? progress(frame, subAt ?? at + 14, 22) : 0;
  const subE = sub && exitAt !== undefined ? progress(frame, exitAt, 12, EASE_IN) : 0;
  return (
    <div style={{ position: 'absolute', left: 84, right: 84, top }}>
      <WordsRise lines={lines} at={at} exitAt={exitAt} accent={accent} stagger={3} dur={24}
        style={{ fontSize: size, lineHeight: 1.04, letterSpacing: '-0.028em' }} />
      {sub ? (
        <div style={{ marginTop: 26, fontFamily: FONT.serif, fontSize: 40, lineHeight: 1.35, color: C.slate, opacity: subP * (1 - subE), transform: `translateY(${mix(subP, 14, 0)}px)` }}>{sub}</div>
      ) : null}
    </div>
  );
};

/**
 * Long-video caption block: a small teal kicker over a one-line navy headline, placed where the
 * scene asks (default top-left inside the 120 px margin).
 */
export const LongCaption: React.FC<{
  kicker?: string; title: string; at: number; exitAt?: number; accent?: string[]; x?: number; y?: number; size?: number; width?: number; sub?: string;
}> = ({ kicker, title, at, exitAt, accent, x = 120, y = 96, size = 56, width = 900, sub }) => {
  const frame = useCurrentFrame();
  const k = progress(frame, at, 20);
  const e = exitAt === undefined ? 0 : progress(frame, exitAt, 12, EASE_IN);
  const s = sub ? progress(frame, at + 16, 24) : 0;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width }}>
      {kicker ? (
        <div style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: 24, color: C.teal, marginBottom: 14, opacity: k * (1 - e), transform: `translateY(${mix(k, 10, 0)}px)` }}>{kicker}</div>
      ) : null}
      <WordsRise lines={[title]} at={at + 4} exitAt={exitAt} accent={accent} stagger={3} dur={26}
        style={{ fontSize: size, lineHeight: 1.08, letterSpacing: '-0.022em' }} lineStyle={{ whiteSpace: 'normal' }} />
      {sub ? (
        <div style={{ marginTop: 16, fontFamily: FONT.serif, fontSize: 28, lineHeight: 1.45, color: C.slate, opacity: s * (1 - e) }}>{sub}</div>
      ) : null}
    </div>
  );
};

/** Chapter marker for the long video: mono number, sans title, one hairline that draws. */
export const ChapterCard: React.FC<{ n: number; title: string; sub?: string }> = ({ n, title, sub }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width } = useVideoConfig();
  const out = durationInFrames - 14;
  const line = progress(frame, 6, 40);
  const num = progress(frame, 2, 22);
  const e = progress(frame, out, 14, EASE_IN);
  const s = sub ? progress(frame, 22, 26) : 0;
  return (
    <AbsoluteFill style={{ background: C.paper, justifyContent: 'center', alignItems: 'flex-start', paddingLeft: width * 0.18 }}>
      <div style={{ opacity: 1 - e, transform: `translateY(${-e * 30}px)` }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 30, color: C.teal, opacity: num, transform: `translateY(${mix(num, 12, 0)}px)`, marginBottom: 22 }}>
          {String(n).padStart(2, '0')}
        </div>
        <div style={{ height: 2, width: 560 * line, background: C.navy, marginBottom: 30 }} />
        <WordsRise lines={[title]} at={10} stagger={3} dur={26} style={{ fontSize: 84, lineHeight: 1.05, letterSpacing: '-0.03em' }} />
        {sub ? <div style={{ marginTop: 22, fontFamily: FONT.serif, fontSize: 32, color: C.slate, opacity: s }}>{sub}</div> : null}
      </div>
    </AbsoluteFill>
  );
};
