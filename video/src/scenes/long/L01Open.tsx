import React from 'react';
import { useCurrentFrame } from 'remotion';
import { C, FONT } from '../../brand/colors';
import { lin, mix, progress } from '../../motion/ease';
import { SceneShell } from '../../motion/Scene';
import { WordsRise } from '../../motion/Text';

/**
 * L01Open (540 f, 9 s, 1920 x 1080). The film's first breath. Paper, three statements, one at a time:
 *
 *   12–170   "Evidence-based practice / starts with the evidence."   serif, "evidence." teal
 *   184–332  "Reading it well takes time."                           serif italic
 *   236–540  a calm field of seven fictional article cards rises in above and below the centre band
 *            and drifts slowly upward (each card at its own depth), dimming a little as line 3 lands
 *   372–530  "HoneLENS reads with you."                              navy sans
 *
 * Geometry: the statements sit on an optical centre a little above the frame centre (y ≈ 500–512).
 * Cards live in two rows (top y 60–252, bottom y 808–998) that drift up by at most ~120 px, so the
 * centre band (≈ y 260–700) never holds a card and no statement ever sits on top of one.
 */

const LINE1 = { at: 12, exit: 156 };
const LINE2 = { at: 184, exit: 318 };
const FIELD = { at: 236, stagger: 11, end: 540, drift: -100 };
const LINE3 = { at: 372, exit: 514 };

const CARD_W = 440;
const CARD_H = 152;

type Paper = { title: string; year: number; kind: string; x: number; y: number; depth: number; order: number };

// Fictional titles (2 lines each at 25 px in a 382 px measure). Top row centred on x = 310 / 960 / 1610;
// bottom row offset by half a pitch, its outer two cards cropped by the frame edge so the field reads
// as larger than the frame.
const PAPERS: Paper[] = [
  { title: 'Early mobility after cardiac surgery', year: 2023, kind: 'Cohort study', x: 90, y: 70, depth: 1.2, order: 2 },
  { title: 'Teach-back and medication adherence in older adults', year: 2022, kind: 'Randomized trial', x: 740, y: 100, depth: 1.0, order: 0 },
  { title: 'Pressure injury prevention in intensive care', year: 2021, kind: 'Systematic review', x: 1390, y: 60, depth: 1.15, order: 4 },
  { title: 'Fall risk screening in the emergency department', year: 2023, kind: 'Cross-sectional', x: -235, y: 820, depth: 1.1, order: 5 },
  { title: 'Sleep quality on medical-surgical units', year: 2024, kind: 'Qualitative study', x: 415, y: 836, depth: 0.9, order: 1 },
  { title: 'Hand hygiene audits and infection rates', year: 2020, kind: 'Quality improvement', x: 1065, y: 808, depth: 1.05, order: 3 },
  { title: 'Nurse staffing and patient outcomes across 40 hospitals', year: 2022, kind: 'Multisite study', x: 1715, y: 846, depth: 0.95, order: 6 },
];

const PaperCard: React.FC<{ p: Paper }> = ({ p }) => {
  const frame = useCurrentFrame();
  const a = progress(frame, FIELD.at + p.order * FIELD.stagger, 42);
  const drift = lin(frame, [FIELD.at, FIELD.end], [0, FIELD.drift]) * p.depth;
  return (
    <div
      style={{
        position: 'absolute', left: p.x, top: p.y, width: CARD_W, height: CARD_H, boxSizing: 'border-box',
        padding: '24px 28px', background: C.white, border: `1px solid ${C.hair}`, borderRadius: 12, overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(24,50,74,.04), 0 10px 28px rgba(24,50,74,.05)',
        opacity: a, transform: `translateY(${mix(a, 34, 0) + drift}px)`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 }}>
        <span style={{ fontFamily: FONT.mono, fontSize: 18, color: C.slate }}>{p.year}</span>
        <span style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: 17, color: C.slate, whiteSpace: 'nowrap' }}>{p.kind}</span>
      </div>
      <div style={{ marginTop: 12, fontFamily: FONT.serif, fontSize: 25, lineHeight: 1.3, color: '#22313F' }}>{p.title}</div>
    </div>
  );
};

const L01Open: React.FC = () => {
  const frame = useCurrentFrame();
  // The field steps back a little while the product line lands (secondary, slow).
  const dim = 1 - 0.3 * progress(frame, LINE3.at - 8, 48);
  return (
    <SceneShell enter="fade" exit="fade" exitDur={18} drift={1.03}>
      <div style={{ position: 'absolute', inset: 0, opacity: dim }}>
        {PAPERS.map(p => <PaperCard key={p.title} p={p} />)}
      </div>

      {/* Line 1: two serif lines, 84 px, line box 2 x 97 = 195 px, centred on y = 512. */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 414 }}>
        <WordsRise
          lines={['Evidence-based practice', 'starts with the evidence.']}
          at={LINE1.at} stagger={4} dur={32} exitAt={LINE1.exit} exitDur={14} accent={['evidence']} align="center"
          style={{ fontFamily: FONT.serif, fontWeight: 400, fontSize: 84, lineHeight: 1.16, letterSpacing: '-0.012em' }}
        />
      </div>

      {/* Line 2: one serif italic line, centred on y = 512. */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 463 }}>
        <WordsRise
          lines={['Reading it well takes time.']}
          at={LINE2.at} stagger={4} dur={32} exitAt={LINE2.exit} exitDur={14} align="center"
          style={{ fontFamily: FONT.serif, fontWeight: 400, fontStyle: 'italic', fontSize: 84, lineHeight: 1.16, letterSpacing: '-0.01em' }}
        />
      </div>

      {/* Line 3: navy sans, 104 px (≈ 1,200 px wide), centred on y = 500 between the two card rows. */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 446 }}>
        <WordsRise
          lines={['HoneLENS reads with you.']}
          at={LINE3.at} stagger={4} dur={30} exitAt={LINE3.exit} exitDur={16} align="center"
          style={{ fontSize: 104, lineHeight: 1.04, letterSpacing: '-0.03em' }}
        />
      </div>
    </SceneShell>
  );
};

export default L01Open;
