import React, { useId } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, FONT } from './colors';
import { HONE_PATH, LOCKUP, NURSE_PATH } from './lockup';
import { EASE_IN_OUT, EASE_OUT, mix, progress } from '../motion/ease';

/**
 * The closing brand moment, the same in both videos.
 *
 * The HoneNurse H is built from its own geometry (design/project/assets/Logos): a navy plate rises,
 * a thin teal hairline draws where the crossbar will sit, the two bevelled bars arrive from opposite
 * ends (the mark has 180° rotational symmetry, so one rises and one descends), the hairline thickens
 * into the crossbar and locks them together, and one restrained sheen crosses the mark. The mark
 * then makes room for the wordmark, and the product line and call to action settle underneath.
 *
 * Timing is in seconds (fps-aware). Needs at least 4.4 s; the rest is a still hold.
 */
export const LogoSpawn: React.FC<{
  orientation: 'portrait' | 'landscape';
  productLine?: string;
  cta?: string;
  ctaSub?: string;
}> = ({ orientation, productLine = 'HoneLENS · Your thinking, honed by evidence.', cta = 'Add HoneLENS to Chrome', ctaSub = 'Free to start' }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const id = useId().replace(/:/g, '');
  const t = (s: number) => s * fps;

  // 1. Plate
  const plate = progress(frame, 0, t(0.5), EASE_IN_OUT);
  // 2. Hairline, bars, crossbar
  const hair = progress(frame, t(0.38), t(0.5), EASE_OUT);
  const left = progress(frame, t(0.52), t(0.78), EASE_OUT);
  const right = progress(frame, t(0.6), t(0.78), EASE_OUT);
  const lock = progress(frame, t(1.22), t(0.34), EASE_OUT);
  const sheen = progress(frame, t(1.45), t(0.75), EASE_IN_OUT);
  const settle = progress(frame, t(0.5), t(1.2), EASE_OUT);
  // 3. Lockup
  const toLockup = progress(frame, t(2.0), t(0.85), EASE_IN_OUT);
  const word = progress(frame, t(2.25), t(0.8), EASE_OUT);
  const line = progress(frame, t(2.8), t(0.6), EASE_OUT);
  const ctaP = progress(frame, t(3.2), t(0.6), EASE_OUT);

  const portrait = orientation === 'portrait';
  // Mark alone: tall and centred. Lockup: wide and centred.
  const markH = portrait ? height * 0.2 : height * 0.32;
  const lockW = portrait ? width * 0.74 : width * 0.44;
  const sA = markH / LOCKUP.height;
  const sB = lockW / LOCKUP.width;
  const s = mix(toLockup, sA, sB) * mix(settle, 1.035, 1);
  const centerX = mix(toLockup, LOCKUP.markW / 2, LOCKUP.width / 2);
  const cy = portrait ? height * 0.44 : height * 0.43;
  const tx = width / 2 - centerX * s;
  const ty = mix(toLockup, cy, cy - (portrait ? height * 0.03 : height * 0.06)) - 80 * s;

  const crossH = mix(lock, 2.2, 17.6);
  const crossW = 89.6 * hair;
  const sheenX = mix(sheen, -120, 200);

  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <AbsoluteFill style={{
        transform: `translateY(${(1 - plate) * 100}%)`,
        background: `radial-gradient(120% 90% at 50% 42%, #1D3B57 0%, ${C.navy} 55%, #132A3E 100%)`,
      }} />
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <clipPath id={`mk-${id}`}><rect x="0" y="0" width="118.4" height="160" /></clipPath>
          <clipPath id={`bars-${id}`}>
            <polygon points="0,160 0,28.8 28.8,0 28.8,160" />
            <polygon points="89.6,0 118.4,0 118.4,131.2 89.6,160" />
            <rect x="14.4" y={80 - crossH / 2} width="89.6" height={crossH} />
          </clipPath>
          <linearGradient id={`sh-${id}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.28" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <clipPath id={`wd-${id}`}><rect x={LOCKUP.wordX - 10} y="0" width={(LOCKUP.width - LOCKUP.wordX + 20) * word} height="160" /></clipPath>
        </defs>
        <g transform={`translate(${tx} ${ty}) scale(${s})`}>
          <g clipPath={`url(#mk-${id})`}>
            {/* crossbar sits under the bars, as in the source SVG */}
            <rect x={59.2 - crossW / 2} y={80 - crossH / 2} width={crossW} height={crossH} fill={C.tealLight} opacity={hair > 0 ? 1 : 0} />
            <polygon points="0,160 0,28.8 28.8,0 28.8,160" fill={C.paper} transform={`translate(0 ${(1 - left) * 172})`} />
            <polygon points="89.6,0 118.4,0 118.4,131.2 89.6,160" fill={C.paper} transform={`translate(0 ${-(1 - right) * 172})`} />
          </g>
          {sheen > 0 && sheen < 1 ? (
            <g clipPath={`url(#bars-${id})`}>
              <rect x={sheenX} y="-20" width="60" height="200" fill={`url(#sh-${id})`} transform="skewX(-18)" />
            </g>
          ) : null}
          <g clipPath={`url(#wd-${id})`} transform={`translate(${(1 - word) * 18} 0)`} opacity={word > 0 ? 1 : 0}>
            <path d={HONE_PATH} fill={C.paper} />
            <path d={NURSE_PATH} fill={C.tealLight} />
          </g>
        </g>
      </svg>
      <div style={{
        position: 'absolute', left: 0, right: 0, top: cy + (portrait ? height * 0.06 : height * 0.1),
        textAlign: 'center', display: 'grid', justifyItems: 'center', gap: portrait ? 44 : 36,
      }}>
        <div style={{ opacity: line, transform: `translateY(${mix(line, 18, 0)}px)`, fontFamily: FONT.serif, fontStyle: 'italic', fontSize: portrait ? 46 : 40, color: C.nightText, letterSpacing: '0.005em' }}>
          {productLine}
        </div>
        <div style={{ opacity: ctaP, transform: `translateY(${mix(ctaP, 18, 0)}px)`, display: 'grid', justifyItems: 'center', gap: 14 }}>
          <div style={{
            fontFamily: FONT.sans, fontWeight: 600, fontSize: portrait ? 40 : 34, color: C.navy, background: C.paper,
            padding: portrait ? '22px 40px' : '18px 34px', borderRadius: 10,
          }}>{cta}</div>
          <div style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: portrait ? 30 : 26, color: C.nightSlate }}>{ctaSub}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
