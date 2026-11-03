import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import timeline from '../../timeline.json';
import { C, FONT } from '../../brand/colors';
import { EASE_IN, EASE_IN_OUT, EASE_OUT, lin, mix, progress } from '../../motion/ease';
import { SceneShell } from '../../motion/Scene';
import { WordsRise } from '../../motion/Text';
import { SOURCE_CHECK } from '../../data/demo';
import { PanelFrame } from '../../ui/Panel';
import { CheckRow, SourceCheckScreen, readSub, type CheckRowData } from '../../ui/screens/Read';

/**
 * L09SourceCheck (690 f, 1920 x 1080): Read > Source check, after the chapter card "Check every source".
 *
 * Composition (shared with L10CiteStats, which continues this shot without a cut):
 *   - Left column at x = 140: a teal kicker (24 px, y = 440) and a two-line caption (56 px, y = 486).
 *   - The side panel on the right: PanelFrame 400 CSS px wide at zoom 1.75 (700 px, x 1080-1780), top at
 *     y = 100, 760 CSS px tall so it runs off the bottom of the frame. Screen y of a panel point =
 *     100 + 1.75 * (y - scrollY); the visible body is panel y 88..560 (+ scrollY). Smallest UI text
 *     (14 px) lands at 24.5 px.
 *   - No SceneShell drift: a constant-rate push (DRIFT per frame) runs across L09 and L10, so the join
 *     between the two scenes is seamless (same scale, same panel, same scroll on both sides of the cut).
 *
 * Beats (frames):
 *   0-30     panel rises in (sub-nav "Source check" visible), kicker 6, caption 1 at 12 (out 252).
 *   22-44    paper title; rows land 36-140 (one per 18 f), each chip 12 f after its row.
 *   84-128   scroll 0 -> 188 so all five rows sit in view (Updates and Full text land during the glide).
 *   152-196  "What these checks mean" note opens (156-192) while the view glides to 340.
 *   262-276  first paper fades out; at 276 the view jumps (invisibly) to 56 for the second paper.
 *   278      caption 2 (out 458). Second paper title 284-306, Retracted notice opens 314-346,
 *            Updates row 350-368 with its "Retracted" chip 360-376.
 *   472      caption 3 (out 660). "Your criteria" 482-504, "Doesn't match" chip 498-514.
 *   664-689  kicker leaves; the panel holds for L10 to pick up.
 */

// ---------- Shared stage (also used by L10CiteStats) ----------

export const STAGE = { x: 1080, top: 100, width: 400, height: 760, zoom: 1.75 } as const;
export const COL = { x: 140, kickerY: 440, captionY: 486 } as const;
/** Constant camera push per frame, continuous across L09 -> L10. */
export const DRIFT = 0.000015;
export const L09_FRAMES = timeline.long.scenes.find(s => s.id === 'L09SourceCheck')?.frames ?? 690;
/** Scroll position at the end of L09 and the start of L10 (sub-nav hidden under the app bar). */
export const JOIN_SCROLL = 56;

const STILL_CSS = '.hlv-stage,.hlv-stage *{transition:none!important;animation:none!important}';

/** Slow, constant push around the frame centre. `offset` = frames already elapsed in earlier scenes. */
export const Drift: React.FC<{ offset?: number; children: React.ReactNode }> = ({ offset = 0, children }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ transform: `scale(${(1 + DRIFT * (offset + f)).toFixed(5)})`, transformOrigin: '50% 50%' }}>
      {children}
    </AbsoluteFill>
  );
};

/** The docked-looking side panel (Read section) at its fixed place on the right. */
export const Stage: React.FC<{
  sub: { items: string[]; value: string };
  scrollY: number;
  opacity?: number;
  dy?: number;
  children: React.ReactNode;
}> = ({ sub, scrollY, opacity = 1, dy = 0, children }) => (
  <div
    className="hlv-stage"
    style={{ position: 'absolute', left: STAGE.x, top: STAGE.top, opacity, transform: dy ? `translateY(${dy.toFixed(3)}px)` : undefined }}
  >
    <style>{STILL_CSS}</style>
    <PanelFrame section="Read" sub={sub} width={STAGE.width} height={STAGE.height} zoom={STAGE.zoom} scrollY={scrollY}>
      {children}
    </PanelFrame>
  </div>
);

/** Teal sans kicker above the caption (the product's screen kicker, e.g. "Source check"). */
export const Kicker: React.FC<{ text: string; at: number; exitAt?: number }> = ({ text, at, exitAt }) => {
  const f = useCurrentFrame();
  const k = progress(f, at, 20);
  const e = exitAt === undefined ? 0 : progress(f, exitAt, 12, EASE_IN);
  return (
    <div
      style={{
        position: 'absolute', left: COL.x, top: COL.kickerY, fontFamily: FONT.sans, fontWeight: 600, fontSize: 24,
        lineHeight: 1.3, color: C.teal, whiteSpace: 'nowrap', opacity: k * (1 - e), transform: `translateY(${mix(k, 10, 0) - e * 10}px)`,
      }}
    >
      {text}
    </div>
  );
};

/** LongCaption's headline style (56 px, -0.022em) with explicit line breaks, in the left column. */
export const ColumnCaption: React.FC<{ lines: string[]; at: number; exitAt?: number; accent?: string[] }> = ({ lines, at, exitAt, accent }) => (
  <WordsRise
    lines={lines} at={at} exitAt={exitAt} accent={accent} stagger={3} dur={26}
    style={{ position: 'absolute', left: COL.x, top: COL.captionY, fontSize: 56, lineHeight: 1.08, letterSpacing: '-0.022em' }}
  />
);

// ---------- Small pure helpers ----------

const clamp01 = (v: number) => (v <= 0 ? 0 : v >= 1 ? 1 : v);

export type GlideKey = { at: number; dur: number; to: number };
/** Piecewise eased value (scroll positions): each key glides from the previous value; dur 0 = instant cut. */
export const glide = (f: number, from: number, keys: GlideKey[]) => {
  let v = from;
  for (const k of keys) {
    const p = k.dur <= 0 ? (f >= k.at ? 1 : 0) : progress(f, k.at, k.dur, EASE_IN_OUT);
    if (p <= 0) break;
    v = mix(p, v, k.to);
  }
  return v;
};

/** Fractional reveal count for items entering one after another (non-overlapping windows). */
export const seq = (f: number, starts: number[], dur: number) => starts.reduce((n, s) => n + lin(f, [s, s + dur], [0, 1]), 0);

/** Button press for a click at frame c (matches the Cursor's press): down 3 f, hold, release 8 f. */
export const pressAt = (f: number, c: number) => Math.min(lin(f, [c - 1, c + 2], [0, 1]), 1 - lin(f, [c + 5, c + 13], [0, 1]));

/** Fade + rise in, fade + lift out (eased values 0..1). Returns no style when fully shown. */
export const swapStyle = (pIn: number, pOut = 0, dy = 10): React.CSSProperties | undefined =>
  pIn >= 1 && pOut <= 0
    ? undefined
    : { opacity: pIn * (1 - pOut), transform: `translateY(${((1 - pIn) * dy - pOut * dy).toFixed(3)}px)` };

// ---------- The second (retracted) paper, shared with L10's first frames ----------

/** Date the demo checks run on (SOURCE_CHECK: "on Oct 10, 2026"). */
const CHECK_YEAR = 2026;
const RETRACTED_AGE = CHECK_YEAR - SOURCE_CHECK.retracted.year;
/** Worded like modules/sourcecheck/criteria.js for a 5-year rule. */
const DATE_ROW: CheckRowData = {
  label: `Published ${SOURCE_CHECK.retracted.year} · ${RETRACTED_AGE} years old`,
  value: `Your window: published in the last 5 years (${CHECK_YEAR - 5} or later)`,
  state: 'nomatch',
  chip: 'Doesn’t match',
};

export type RetractedBodyProps = {
  titleIn?: number; noticeIn?: number; rows?: number; chipsIn?: number; criteriaIn?: number; criteriaChip?: number;
};

/** Second paper: title, Retracted notice, Updates row, then "Your criteria" with the date rule. Defaults = finished. */
export const RetractedBody: React.FC<RetractedBodyProps> = ({ titleIn = 1, noticeIn = 1, rows = 1, chipsIn, criteriaIn = 1, criteriaChip = 1 }) => {
  const c = EASE_OUT(clamp01(criteriaIn));
  return (
    <div className="hlv-read" style={{ display: 'grid', gap: 16, minWidth: 0 }}>
      <SourceCheckScreen header={false} retracted titleIn={titleIn} noticeIn={noticeIn} rows={rows} chipsIn={chipsIn ?? rows} />
      <div style={{ display: 'grid', gap: 16, minWidth: 0, ...(swapStyle(c, 0, 12) ?? {}) }}>
        <h2 className="sc-subhead">Your criteria</h2>
        <div className="hl-rows">
          <CheckRow row={DATE_ROW} chipP={EASE_OUT(clamp01(criteriaChip))} />
        </div>
      </div>
    </div>
  );
};

// ---------- Scene ----------

const ROWS = [36, 54, 72, 104, 122];
const CHIPS = [48, 66, 84, 116, 134];
const SWITCH = 276;

const L09SourceCheck: React.FC = () => {
  const f = useCurrentFrame();
  const panelIn = progress(f, 0, 30);
  const scroll = glide(f, 0, [
    { at: 84, dur: 44, to: 188 },   // all five rows in view
    { at: 152, dur: 44, to: 340 },  // rows 3-5 and the note
    { at: SWITCH, dur: 0, to: JOIN_SCROLL }, // content is invisible at this frame
  ]);
  const out1 = progress(f, 262, 14, EASE_IN);

  return (
    <SceneShell enter="none" exit="none" drift={1}>
      <Drift>
        <Kicker text="Source check" at={6} exitAt={664} />
        <ColumnCaption lines={['Identifiers, journal, publisher,', 'date and study type.']} at={12} exitAt={252} />
        <ColumnCaption lines={['Retracted papers are flagged', 'before you cite them.']} at={278} exitAt={458} />
        <ColumnCaption lines={['Your assignment’s', 'rules, checked.']} at={472} exitAt={660} accent={['checked']} />

        <Stage sub={readSub('Source check')} scrollY={scroll} opacity={panelIn} dy={mix(panelIn, 40, 0)}>
          {f < SWITCH ? (
            <div style={swapStyle(1, out1, 8)}>
              <SourceCheckScreen
                header={false}
                titleIn={lin(f, [22, 44], [0, 1])}
                rows={seq(f, ROWS, 18)}
                chipsIn={seq(f, CHIPS, 14)}
                meaningOpen={lin(f, [156, 192], [0, 1])}
                criteriaIn={0}
              />
            </div>
          ) : (
            // The wrapper fade only softens the empty rows hairline; the parts have their own entrances.
            <div style={{ opacity: progress(f, SWITCH, 14) }}>
              <RetractedBody
                titleIn={lin(f, [284, 306], [0, 1])}
                noticeIn={lin(f, [314, 346], [0, 1])}
                rows={lin(f, [350, 368], [0, 1])}
                chipsIn={lin(f, [360, 376], [0, 1])}
                criteriaIn={lin(f, [482, 504], [0, 1])}
                criteriaChip={lin(f, [498, 514], [0, 1])}
              />
            </div>
          )}
        </Stage>
      </Drift>
    </SceneShell>
  );
};

export default L09SourceCheck;
