import React from 'react';
import { useCurrentFrame } from 'remotion';
import { C, FONT } from '../../brand/colors';
import { ARTICLE, EBP } from '../../data/demo';
import { EASE_IN, mix, progress } from '../../motion/ease';
import { SceneShell } from '../../motion/Scene';
import { WordsRise } from '../../motion/Text';

/*
 * S01Hook (180 f, 1080 x 1920). Three hard lines, one at a time, left-aligned at x = 84:
 *   "12 articles." (0-55) -> "One evidence / table." (60-115) -> "Due Friday." (120-175, "Friday" teal).
 * Under them a quiet stack of article cards: the front card is the film's article; one more card
 * slides up from behind on each line, so the pile grows with the count.
 *
 * Geometry (measured with the real Plex files): 128 px semibold, tracking -0.03 em.
 *   "One evidence" 756 px, "12 articles." 620 px, "Due Friday." 636 px -> right edge <= 840 (< 940).
 *   First line top 694 (a single line is centred on y = 760); the two-line beat ends at y = 960.
 *   Card stack: front card 84..904 x 1170..1412; back cards peek 66 px each (top-most at 972).
 */

const X = 84;
const SIZE = 128;
const LINE_TOP = 694;
const HEAD: React.CSSProperties = { position: 'absolute', left: X, top: LINE_TOP, fontSize: SIZE, lineHeight: 1.04, letterSpacing: '-0.03em' };

const CARD_TOP = 1170;
const CARD_W = 820;
const CARD_H = 242;
const PEEK = 66;
// Front (depth 0) to back (depth 3). The front card is the article the film analyzes.
const TITLES = [
  ARTICLE.title,
  'Teach-back at discharge and 90-day readmission in one health system',
  'Structured self-care education for adults with heart failure: a systematic review',
  'Discharge conversations through the eyes of patients and nurses',
];
const CARDS = EBP.papers.map((p, i) => ({ meta: `${p.short} · ${p.design}`, title: TITLES[i] }));
// When each back card slides out from behind (on the line beats), and its slight tilt.
const REVEAL = [0, 4, 64, 124];
const ROT = [0, 0.8, -0.6, 1.2];

const Card: React.FC<{ depth: number; p: number }> = ({ depth, p }) => {
  const { meta, title } = CARDS[depth];
  const lift = depth * PEEK * p;
  const scale = 1 - depth * 0.025;
  return (
    <div style={{
      position: 'absolute', left: X, top: CARD_TOP, width: CARD_W, height: CARD_H, boxSizing: 'border-box',
      padding: '24px 40px 0', background: C.white, border: `1.5px solid ${C.hair}`, borderRadius: 16,
      boxShadow: '0 1px 2px rgba(24,50,74,.05), 0 10px 28px rgba(24,50,74,.07)',
      transformOrigin: '50% 0%', transform: `translateY(${-lift}px) rotate(${ROT[depth] * p}deg) scale(${scale})`,
    }}>
      <div style={{ fontFamily: FONT.mono, fontSize: 24, lineHeight: '30px', color: C.field, whiteSpace: 'nowrap' }}>{meta}</div>
      <div style={{ marginTop: 16, fontFamily: FONT.serif, fontSize: 34, lineHeight: 1.3, color: C.slate }}>{title}</div>
    </div>
  );
};

const S01Hook: React.FC = () => {
  const frame = useCurrentFrame();
  // The stack is already settling at frame 0 so the very first frame is never empty.
  const inP = progress(frame, -12, 36);
  const outP = progress(frame, 150, 22, EASE_IN);
  return (
    <SceneShell enter="none" exit="none" drift={1.02}>
      <div style={{ position: 'absolute', inset: 0, opacity: inP * (1 - outP), transform: `translateY(${mix(inP, 48, 0) - outP * 40}px)` }}>
        {[3, 2, 1, 0].map(d => (
          <Card key={d} depth={d} p={d === 0 ? 1 : progress(frame, REVEAL[d], 30)} />
        ))}
      </div>

      <WordsRise lines={['12 articles.']} at={-3} stagger={2} dur={18} exitAt={46} exitDur={10} style={HEAD} />
      <WordsRise lines={['One evidence', 'table.']} at={60} stagger={2} dur={18} exitAt={106} exitDur={10} style={HEAD} />
      <WordsRise lines={['Due Friday.']} at={120} stagger={2} dur={18} exitAt={163} exitDur={12} accent={['Friday']} style={HEAD} />
    </SceneShell>
  );
};

export default S01Hook;
