import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { C, FONT } from '../../brand/colors';
import { EASE_IN, EASE_IN_OUT, lin, mix, progress } from '../../motion/ease';
import { SceneShell } from '../../motion/Scene';
import { WordsRise } from '../../motion/Text';
import { PanelFrame } from '../../ui/Panel';
import { Cursor } from '../../ui/Cursor';
import {
  DoNotUseCallout, DoseBanner, DoseProblemCard, DoseResult, DoseSolution, ExamReadiness, practiceSub,
} from '../../ui/screens/Practice';

/**
 * L14Practice (570 f, 9.5 s, 1920 x 1080). The Practice tab, one focal element at a time.
 *
 * Layout: caption column on the left (x 120, width 860, top 410), the side panel alone on the right
 * (PanelFrame 400 x 550 CSS px, zoom 1.7 => 683 x 938 px at x 1116–1799, y 72–1010). Smallest UI text
 * (14 px) renders at 23.8 px; the dose math (15 px mono) at 25.5 px.
 *
 * Panel body geometry (panel CSS px, app bar 88 + body padding 16 + Practice sub-nav 40 + 24 => content
 * starts at 168): banner 168–223 · problem card 247–531 (Order 333–428, On hand 440–513, no answer
 * form) · Correct row 555–630 · Worked solution 654–836. Visible body = 88..550 + scrollY.
 *
 * Beats
 *   A Dosage (0–262)    caption 10–256. Order / On hand land 12–48 (scrollY 0). Scroll to 338 (56–94):
 *                       view = On hand, Correct row, worked solution. Correct row 94–110, solution
 *                       heading 106–120, math "37.5 mg" 118, "× 1 tablet / 25 mg" 131, mg units strike
 *                       146–166 (teal, as .hl-dose-cancel), "= 1.5 tablets" 164–180, teal tint 178–194.
 *                       Panel content fades 248–260 while the body scrolls back to the top 250–282.
 *   B Do Not Use (262–428) caption 270–416. New problem card fades in 280, order block 282–300, thin red
 *                       mark under "qd" 304–318, the red Do Not Use callout rises 312–332. Fits at scrollY 0.
 *   C Exam (414–570)    cursor 382–446 clicks the sub-nav "Exam" at 414 (sub-nav switches at 415). Dosage
 *                       content fades 416–428; Exam results 428+: score card 432 (counts to 90 % by 476),
 *                       threshold "Met" 454, readiness line 470–488. Caption 420 to the end. Scene fades 558.
 */

const PANEL = { left: 1116, top: 72, zoom: 1.7, w: 400, h: 550 } as const;
/** Screen position of a point given in panel CSS px (the frame has a 1 px border). */
const at = (x: number, y: number) => ({ x: PANEL.left + PANEL.zoom * (1 + x), y: PANEL.top + PANEL.zoom * (1 + y) });
// Sub-nav "Exam" segment: seg 368 wide at x 16 (border 1, padding 2, gap 2 => items 119.3 wide), y 107–141.
const EXAM_SEG = at(200, 124);

const SCROLL_A = 338;

const T = {
  cap1: 10, cap1Out: 244,
  rows: [12, 48] as [number, number],
  scrollDown: 56, scrollDur: 38,
  result: [94, 110] as [number, number],
  sol: [106, 120] as [number, number],
  steps: { f: [118, 144, 164, 180], v: [0, 2, 2, 3] },
  cancel: [146, 166] as [number, number],
  tint: 178,
  aOut: 248, aGone: 262,
  scrollUp: 250, scrollUpDur: 32,
  cap2: 270, cap2Out: 404,
  bIn: 280, order: [282, 300] as [number, number], flag: [304, 318] as [number, number], callout: [312, 332] as [number, number],
  cursorIn: 382, cursorArrive: 408, click: 414, cursorOut: 436,
  bOut: 416, cIn: 428,
  score: [432, 450] as [number, number], count: [436, 476] as [number, number],
  threshold: [454, 470] as [number, number], ready: [470, 488] as [number, number],
  cap3: 420,
};

/** Kicker + forced-break headline + serif sub, in the left caption column. */
const Caption: React.FC<{
  kicker: string; lines: string[]; sub: string; at: number; exitAt?: number; accent?: string[];
}> = ({ kicker, lines, sub, at: start, exitAt, accent }) => {
  const frame = useCurrentFrame();
  const k = progress(frame, start, 20);
  const s = progress(frame, start + 18, 24);
  const e = exitAt === undefined ? 0 : progress(frame, exitAt, 12, EASE_IN);
  return (
    <div style={{ position: 'absolute', left: 120, top: 410, width: 860 }}>
      <div style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: 26, lineHeight: 1.2, color: C.teal, marginBottom: 16, opacity: k * (1 - e), transform: `translateY(${mix(k, 10, 0) - e * 8}px)` }}>
        {kicker}
      </div>
      <WordsRise lines={lines} at={start + 4} exitAt={exitAt} exitDur={12} accent={accent} stagger={3} dur={26}
        style={{ fontSize: 58, lineHeight: 1.08, letterSpacing: '-0.022em' }} />
      <div style={{ marginTop: 22, fontFamily: FONT.serif, fontSize: 30, lineHeight: 1.42, color: C.slate, opacity: s * (1 - e), transform: `translateY(${mix(s, 12, 0) - e * 8}px)` }}>
        {sub}
      </div>
    </div>
  );
};

const L14Practice: React.FC = () => {
  const f = useCurrentFrame();

  // Body scroll: down to the solution, back to the top for the next problem.
  const scrollY = SCROLL_A * (progress(f, T.scrollDown, T.scrollDur, EASE_IN_OUT) - progress(f, T.scrollUp, T.scrollUpDur, EASE_IN_OUT));

  const panelIn = progress(f, 0, 28);
  const examOn = f >= T.click + 1;

  // Beat A: dosage problem, Correct, worked solution.
  const aOp = 1 - progress(f, T.aOut, 12, EASE_IN);
  const steps = interpolate(f, T.steps.f, T.steps.v, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  // Beat B: Do Not Use; leaves with the banner when Exam is tapped.
  const bOut = 1 - progress(f, T.bOut, 12, EASE_IN);
  const bOp = progress(f, T.bIn, 16) * bOut;
  // Beat C: exam results.
  const cOp = progress(f, T.cIn, 14);

  const dosageBody = (
    <>
      <DoseBanner style={{ opacity: bOut }} />
      {f < T.aGone ? (
        <div style={{ display: 'grid', gap: 24, opacity: aOp }}>
          <DoseProblemCard form={false} rows={lin(f, T.rows, [0, 3])} />
          <DoseResult answerCard={false} rows={lin(f, T.result, [0, 1])} />
          <DoseSolution
            appear={lin(f, T.sol, [0, 1])} steps={steps} cancel={lin(f, T.cancel, [0, 1])}
            tint={progress(f, T.tint, 16)} strikeColor={C.teal}
          />
        </div>
      ) : (
        <div style={{ opacity: bOp }}>
          <DoNotUseCallout order={lin(f, T.order, [0, 1])} flag={lin(f, T.flag, [0, 1])} appear={lin(f, T.callout, [0, 1])} />
        </div>
      )}
    </>
  );

  const examBody = (
    <div style={{ display: 'grid', gap: 24, opacity: cOp }}>
      <ExamReadiness
        header topics={0}
        score={lin(f, T.score, [0, 1])} count={lin(f, T.count, [0, 1])}
        threshold={lin(f, T.threshold, [0, 1])} ready={lin(f, T.ready, [0, 1])}
      />
    </div>
  );

  return (
    <SceneShell enter="fade" exit="fade" enterDur={14} exitDur={12} drift={1.02}>
      {/* Product CSS carries transitions; frames must never depend on wall-clock time. */}
      <style>{'.l14-root *{transition:none!important;animation:none!important}'}</style>
      <div className="l14-root" style={{ position: 'absolute', inset: 0 }}>
        <Caption kicker="Practice › Dosage" lines={['Dosage practice,', 'step by step.']} accent={['Dosage']}
          sub="Dimensional analysis, worked out one step at a time." at={T.cap1} exitAt={T.cap1Out} />
        <Caption kicker="Practice › Dosage" lines={['Do Not Use', 'abbreviations, caught.']} accent={['caught']}
          sub="Flagged in the order, with what to write instead." at={T.cap2} exitAt={T.cap2Out} />
        {f >= T.cap3 - 1 ? (
          <Caption kicker="Practice › Exam" lines={['Exam practice with', 'a readiness check.']} accent={['readiness']}
            sub="See which topics are ready and what to review next." at={T.cap3} />
        ) : null}

        <div style={{ position: 'absolute', left: PANEL.left, top: PANEL.top, opacity: panelIn, transform: `translateY(${mix(panelIn, 36, 0)}px)` }}>
          <PanelFrame section="Practice" sub={practiceSub(examOn ? 'Exam' : 'Dosage')} width={PANEL.w} height={PANEL.h} zoom={PANEL.zoom} scrollY={scrollY}>
            {f < T.cIn ? dosageBody : examBody}
          </PanelFrame>
        </div>

        <Cursor
          appearAt={T.cursorIn} hideAt={T.cursorOut}
          keys={[
            { at: T.cursorIn, x: 1372, y: 640 },
            { at: T.cursorArrive, x: EXAM_SEG.x, y: EXAM_SEG.y, dur: 26 },
            { at: T.click, x: EXAM_SEG.x, y: EXAM_SEG.y, dur: 6, click: true },
          ]}
        />
      </div>
    </SceneShell>
  );
};

export default L14Practice;
