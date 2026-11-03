import React from 'react';
import { useCurrentFrame } from 'remotion';
import { C, FONT } from '../../brand/colors';
import { mix, progress } from '../../motion/ease';
import { SceneShell } from '../../motion/Scene';
import { SoftLine, WordsRise } from '../../motion/Text';

/**
 * L17Plans (420 f, 7 s, 1920 x 1080). Two calm statements.
 *
 *   Part 1 (8–152), centred on y ≈ 520:
 *     8    "Your work stays in your browser."  sans 84 px, "browser." teal
 *     40   "No accounts. No analytics."        serif 44 px, slate
 *     138  both lift out
 *   Part 2 (158–420): headline top-left, two equal plan cards below (spec-sheet rows: serif label,
 *   mono value, hairline rules). No prices.
 *     158  "Free every week. Pro when you need more."  sans 64 px, "Free" teal
 *     190  Free card rises, rows land 200–230 (5 f apart)
 *     236  Pro card rises, rows land 246–276
 *     290  "Weekly limits reset Monday." settles at the foot of the Free card
 *     404  scene fades out into the logo finale
 *
 * Geometry: margins 120. Headline line box 152–221; cards at y 281, 816 x 648 each, 48 apart
 * (x 120–936 and 984–1800), bottom at 929. Inside a card: padding 40/44/34, header 157 px, rows 56 px.
 * The widest row (label ~400 px + value ~330 px) fits the 726 px inner width with room to spare.
 *
 * Facts only from the product's plan rules (config/features.js): Free has unlimited AI analysis and
 * chat on the student's own key, source checks, citations, stats, dosage practice and library;
 * 3 active assignments with 6 papers each; Compare papers and Fill matrix 2 a week each; 2 practice
 * exams a week; 1 Submission Pack export a week; weekly limits reset Monday. Pro removes those
 * limits and adds mistake analytics and full audit details.
 */

const P1 = { at: 8, subAt: 40, exit: 138 };
const P2 = { at: 158, free: 190, pro: 236, note: 290 };
const ROWS = { after: 10, stagger: 5, dur: 22, h: 56 };

const CARD = { w: 816, h: 648, gap: 48, top: 281, left: 120 };
const INK = '#22313F';

type Row = [label: string, value: string];

const FREE_ROWS: Row[] = [
  ['AI analysis and chat', 'Unlimited'],
  ['Source checks, citations, stats', 'Unlimited'],
  ['Dosage practice and library', 'Unlimited'],
  ['Assignments', '3 active, 6 papers each'],
  ['Compare papers, Fill matrix', '2 a week each'],
  ['Practice exams', '2 a week'],
  ['Submission Pack export', '1 a week'],
];

const PRO_ROWS: Row[] = [
  ['Assignments and papers', 'Unlimited'],
  ['Paper comparisons', 'Unlimited'],
  ['Matrix fills', 'Unlimited'],
  ['Submission Packs', 'Unlimited'],
  ['Practice exams', 'Unlimited'],
  ['Mistake analytics', 'Included'],
  ['Full audit details', 'Included'],
];

const PlanCard: React.FC<{ name: string; sub: string; rows: Row[]; at: number; x: number; note?: string; noteAt?: number }> =
  ({ name, sub, rows, at, x, note, noteAt = 0 }) => {
    const frame = useCurrentFrame();
    const a = progress(frame, at, 30);
    const n = note ? progress(frame, noteAt, 26) : 0;
    return (
      <div
        style={{
          position: 'absolute', left: x, top: CARD.top, width: CARD.w, height: CARD.h, boxSizing: 'border-box',
          padding: '40px 44px 34px', background: C.white, border: `1px solid ${C.hair}`, borderRadius: 14,
          display: 'flex', flexDirection: 'column', opacity: a, transform: `translateY(${mix(a, 28, 0)}px)`,
        }}
      >
        <div style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: 44, lineHeight: 1.1, letterSpacing: '-0.02em', color: C.navy }}>{name}</div>
        <div style={{ marginTop: 8, fontFamily: FONT.serif, fontSize: 24, lineHeight: 1.4, color: C.slate }}>{sub}</div>
        <div style={{ marginTop: 26, height: 1, background: C.navy, flex: 'none' }} />
        {rows.map(([label, value], i) => {
          const r = progress(frame, at + ROWS.after + i * ROWS.stagger, ROWS.dur);
          return (
            <div
              key={label}
              style={{
                height: ROWS.h, flex: 'none', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
                borderBottom: i < rows.length - 1 ? `1px solid ${C.hair}` : 'none', opacity: r, transform: `translateY(${mix(r, 10, 0)}px)`,
              }}
            >
              <span style={{ fontFamily: FONT.serif, fontSize: 26, color: INK, whiteSpace: 'nowrap' }}>{label}</span>
              <span style={{ fontFamily: FONT.mono, fontSize: 24, color: C.navy, whiteSpace: 'nowrap' }}>{value}</span>
            </div>
          );
        })}
        {note ? (
          <div style={{ marginTop: 'auto', fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 23, lineHeight: 1.3, color: C.slate, opacity: n, transform: `translateY(${mix(n, 8, 0)}px)` }}>
            {note}
          </div>
        ) : null}
      </div>
    );
  };

const L17Plans: React.FC = () => (
  <SceneShell enter="fade" exit="fade" exitDur={16} drift={1.015}>
    {/* Part 1: headline line box 432–521 (84 x 1.06), sub from 551 (44 x 1.3). Group centre ≈ 520. */}
    <div style={{ position: 'absolute', left: 0, right: 0, top: 432 }}>
      <WordsRise
        lines={['Your work stays in your browser.']} at={P1.at} stagger={3} dur={28} exitAt={P1.exit} exitDur={14}
        accent={['browser']} align="center" style={{ fontSize: 84, lineHeight: 1.06, letterSpacing: '-0.026em' }}
      />
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 551 }}>
      <SoftLine at={P1.subAt} dur={28} exitAt={P1.exit} exitDur={14} style={{ fontSize: 44, lineHeight: 1.3, textAlign: 'center' }}>
        No accounts. No analytics.
      </SoftLine>
    </div>

    {/* Part 2 */}
    <div style={{ position: 'absolute', left: CARD.left, top: 152, width: 1680 }}>
      <WordsRise
        lines={['Free every week. Pro when you need more.']} at={P2.at} stagger={3} dur={26}
        accent={['Free']} style={{ fontSize: 64, lineHeight: 1.08, letterSpacing: '-0.024em' }}
      />
    </div>
    <PlanCard
      name="Free" sub="AI runs on your own free key." rows={FREE_ROWS} at={P2.free} x={CARD.left}
      note="Weekly limits reset Monday." noteAt={P2.note}
    />
    <PlanCard
      name="Pro" sub="Everything in Free, plus" rows={PRO_ROWS} at={P2.pro} x={CARD.left + CARD.w + CARD.gap}
    />
  </SceneShell>
);

export default L17Plans;
