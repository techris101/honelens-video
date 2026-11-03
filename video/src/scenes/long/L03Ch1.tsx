import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../../brand/colors';
import { ChapterCard } from '../../motion/Captions';
import { EASE_IN, progress } from '../../motion/ease';
import { SceneShell } from '../../motion/Scene';

/**
 * Chapter cards of the long film (150 f each): the shared ChapterCard (mono number, drawing hairline,
 * title, serif sub) plus one quiet addition, a five-segment chapter rail at the bottom margin, aligned
 * with the card's text column (x = 18 % of the width). Earlier chapters show as navy segments, this
 * chapter's segment draws in teal once the title and sub have landed. It echoes the three-bar step
 * indicator of the key guide (L16), so progress always looks the same in this film.
 *
 * Timing inside 150 f: ChapterCard number 2, hairline 6–46, title words from 10, sub 22–48;
 * rail fades in 50–70, its segment draws 60–104; card and rail leave together 136–150 (EASE_IN, lift).
 * L08Ch2, L11Ch3, L13Ch4 and L15Ch5 reuse `ChapterScene` from this file.
 */

export const CHAPTER_COUNT = 5;

const RAIL = { show: 50, fill: 60, fillDur: 44, seg: 64, gap: 10, h: 3, bottom: 132 };

/** Five short segments: chapters before `n` navy, chapter `n` drawing in teal, later ones hairline. */
export const ChapterRail: React.FC<{ n: number }> = ({ n }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const show = progress(frame, RAIL.show, 20);
  const fill = progress(frame, RAIL.fill, RAIL.fillDur);
  const e = progress(frame, durationInFrames - 14, 14, EASE_IN);
  return (
    <div
      style={{
        position: 'absolute', left: width * 0.18, top: height - RAIL.bottom, display: 'flex', gap: RAIL.gap,
        opacity: show * (1 - e), transform: `translateY(${-e * 30}px)`,
      }}
    >
      {Array.from({ length: CHAPTER_COUNT }, (_, i) => {
        const k = i + 1;
        const s = k < n ? 1 : k === n ? fill : 0;
        return (
          <div key={k} style={{ width: RAIL.seg, height: RAIL.h, background: C.hair, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: k < n ? C.navy : C.teal, transformOrigin: '0 50%', transform: `scaleX(${s})` }} />
          </div>
        );
      })}
    </div>
  );
};

/** A complete chapter scene: paper, a very slow push (1.000 → 1.015), the card and the rail. */
export const ChapterScene: React.FC<{ n: number; title: string; sub: string }> = ({ n, title, sub }) => (
  <SceneShell enter="none" exit="none" drift={1.015}>
    <ChapterCard n={n} title={title} sub={sub} />
    <ChapterRail n={n} />
  </SceneShell>
);

const L03Ch1: React.FC = () => (
  <ChapterScene n={1} title="Analyze any article" sub="One click on PubMed, PMC and journal sites." />
);

export default L03Ch1;
