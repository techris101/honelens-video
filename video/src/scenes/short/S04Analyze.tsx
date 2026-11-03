import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { ARTICLE, ANALYSIS } from '../../data/demo';
import { ShortCaption } from '../../motion/Captions';
import { EASE_IN, EASE_IN_OUT, EASE_OUT, lin, mix, progress } from '../../motion/ease';
import { Camera, SceneShell } from '../../motion/Scene';
import type { CamKey } from '../../motion/Scene';
import { ArticlePage, BrowserFrame, Fab } from '../../ui/Browser';
import { PanelFrame } from '../../ui/Panel';
import {
  AnalyzeFacts, AnalyzeFooter, AnalyzeHeader, AskBox, ItemList, PicoList, SummaryCard, rowReveal,
} from '../../ui/screens/Analyze';
import type { AnalyzeFactsProps, AskBoxProps, ItemListProps, PicoListProps, SummaryCardProps } from '../../ui/screens/Analyze';

/* ==========================================================================================
 * Shared by S04Analyze, S05Limits and S06Chat (short film, 1080 x 1920).
 * The three scenes are one continuous shot of the Analyze tab: each scene's first frame equals
 * the previous scene's last frame (same panel state, scroll and camera), so the cuts are
 * invisible and only the captions change.
 *
 * Panel: PanelFrame 400 x 416 CSS px at zoom 2.25, top-left (88, 560) -> 904.5 x 940.5 on screen
 * (x 88..992, y 560..1500). Body content y = 0 sits 101 CSS px below the panel's outer top
 * (1 px border + 84 px app bar + 16 px body padding); the visible body is [scrollY - 16, scrollY + 316].
 *
 * Layout below was computed from the IBM Plex font files (advance widths, hhea metrics) and the
 * product CSS, and every line count was checked to stay the same within +-8 px of width, so the
 * numbers are reliable (to ~2 px) for cursor targets. Two tiny layout pins make that true:
 * the summary card gets 12 px more right padding (its paragraph is 10 lines for any width between
 * 310 and 336 px; at the default 334 it sat 4 px from becoming 9) and limitation/bias item text gets
 * 8 px right padding (the funding row's text was 3.7 px from fitting one line). Neither is visible.
 * ========================================================================================== */

export const PANEL = { x: 88, y: 560, w: 400, h: 416, zoom: 2.25 } as const;
export const CURSOR_SIZE = 46;   // same pointer as S03Fab

/** Screen y (scene px, before the Camera) of body-content y `yb` at panel scroll `s`. */
export const by = (yb: number, s: number) => PANEL.y + PANEL.zoom * (101 + yb - s);
/** Screen x of body-content x `xb` (content box is 368 CSS px wide: x 126..954 on screen). */
export const bx = (xb: number) => PANEL.x + PANEL.zoom * (17 + xb);
/** Cursor key position for a pointer whose tip should land on (x, y): the tip sits ~4 px in. */
export const tip = (x: number, y: number) => ({ x: x - 4, y: y - 4 });

/**
 * Body-content y (CSS px) of the parts we frame or click, with every list row closed and the
 * limitation/bias quotes in 'open' mode (quotes appear only when a row is expanded).
 */
export const Y = {
  facts: 70.9,          // byline 70.9-112.9 (2 lines), ids 120.9-140.5, chips 152.5-208.9 (2 rows), rule 225.9
  summary: 249.9,       // card 249.9-716.15: h2, one-sentence 299.15-371.15 (3 lines), paragraph 383.15-655.15 (10 lines)
  pico: 728.15,         // heading + 4 rows, ends 952.8
  lim: 964.8,           // "Limitations" heading
  l1: 1002.05,          // first limitation row, 64 tall (2 text lines from 1010.05)
  l1Quote: 1066.05,     // its quote row when open (27.2 tall, text centre 1078.2)
  limOpen: 278.4,       // opening row 1 adds quote 27.2 + dive 251.2
  bias: 1193.05,        // "Biases and conflicts" heading (add limOpen when limitation 1 is open)
  b1: 1230.3,           // funding row, 92 tall: tag row 1238.3-1258.3, text lines 1266.3-1314.3
  biasOpen: 293.8,      // opening the funding row adds quote 42.6 (2 lines) + dive 251.2
  ask: 1501.3,          // "Anything else?" button, 48 tall (add limOpen + biasOpen when both are open)
} as const;

// ------------------------------------------------------------------------------ the stack

export type StackState = {
  facts?: Omit<AnalyzeFactsProps, 'style'>;
  /** Staged reveal like AnalyzeScreen: 0 summary, 1 PICO, 2 limitations, 3 biases, 4 ask, 5 footer. */
  sections?: number;
  summary?: Omit<SummaryCardProps, 'style'>;
  pico?: Omit<PicoListProps, 'style'>;
  limitations?: Omit<ItemListProps, 'kind' | 'style'>;
  biases?: Omit<ItemListProps, 'kind' | 'style'>;
  ask?: Omit<AskBoxProps, 'style'>;
};

// Scoped layout pin (see header). Lives inside the zoomed panel, so 8 px are CSS px.
const PIN_CSS = '.vs-an .hl-an-item__text{padding-right:8px}';

/** The Analyze tab in product order (mirrors AnalyzeScreen), with the two layout pins. */
export const AnalyzeStack: React.FC<{ state: StackState }> = ({ state }) => {
  const sec = state.sections ?? Number.POSITIVE_INFINITY;
  const at = (i: number) => rowReveal(sec, i);
  return (
    <>
      <div><AnalyzeHeader /></div>
      <div className="hl-stack hl-an vs-an">
        <style>{PIN_CSS}</style>
        <AnalyzeFacts {...(state.facts || {})} />
        <div className="hl-stack">
          <SummaryCard {...(state.summary || {})} style={{ ...at(0), paddingRight: 28 }} />
          <PicoList {...(state.pico || {})} style={at(1)} />
          <ItemList kind="limitations" quotes="open" {...(state.limitations || {})} style={at(2)} />
          <ItemList kind="biases" quotes="open" {...(state.biases || {})} style={at(3)} />
          <AskBox {...(state.ask || {})} style={at(4)} />
          <AnalyzeFooter style={at(5)} />
        </div>
      </div>
    </>
  );
};

/** The side panel placed in the short film's UI region. `height` (CSS px) can shrink it for a split. */
export const ShortPanel: React.FC<{ scrollY: number; state: StackState; height?: number; style?: React.CSSProperties }> =
  ({ scrollY, state, height = PANEL.h, style }) => (
    <div style={{ position: 'absolute', left: PANEL.x, top: PANEL.y, ...style }}>
      <PanelFrame section="Analyze" width={PANEL.w} height={height} zoom={PANEL.zoom} scrollY={scrollY}>
        <AnalyzeStack state={state} />
      </PanelFrame>
    </div>
  );

// ------------------------------------------------------------------------------ timing helpers

export type Step = { at: number; to: number; dur?: number; ease?: (t: number) => number };
/** A value that starts at `from` and glides through `steps` (each eased, default in-out 36 f). */
export const glide = (frame: number, from: number, steps: Step[]) =>
  steps.reduce((v, st) => mix(progress(frame, st.at, st.dur ?? 36, st.ease ?? EASE_IN_OUT), v, st.to), from);

/** Fractional reveal count for rowReveal-style props: item i ramps linearly 0 -> 1 from starts[i]. */
export const ramp = (frame: number, starts: number[], dur: number) =>
  starts.reduce((n, s) => n + Math.min(1, Math.max(0, (frame - s) / dur)), 0);

/** 0 -> 1 -> 0 press for a click at `at` (cursor press lands on the same frame). */
export const press = (frame: number, at: number) => progress(frame, at - 1, 3) * (1 - progress(frame, at + 7, 8));

/** The product's attention tint: in fast, out slow. */
export const tintPulse = (frame: number, at: number, inDur = 8, outDur = 34) =>
  progress(frame, at, inDur) * (1 - progress(frame, at + inDur, outDur, EASE_IN_OUT));

// Camera pushes are anchored low so the panel's bottom edge stays at y <= 1500 while it grows.
export const PUSH_S04: CamKey = { at: 0, scale: 1.04, y: -22, x: 0 };
export const REST: CamKey = { at: 0, scale: 1, x: 0, y: 0 };

/** S04's last frame, which S05's first frame continues. */
export const S04_END = { scrollY: 718, cam: PUSH_S04 } as const;

/** Full-content defaults shared by the scenes (all text written, rows in). */
export const DONE_SUMMARY: StackState['summary'] = { para: 1, button: 1 };

// ==========================================================================================
// S04Analyze (660 f, 11 s)
//   0    the article (as S03 left it) slides away left; the panel rises into the UI region (6-38)
//   12   caption "Read the facts first."                     exit 188
//   44   facts land: byline (journal, year) 44, DOI + PMID in mono 60, chips 80 / 96 / 112
//   70   slow push 1.00 -> 1.04 (anchored low)
//   196  glide to the summary (scroll 0 -> 230) with the push released; card rises 212
//   204  caption "The whole paper, in one sentence."          exit 406
//   232  the one-sentence summary writes itself (to 296); card tint 298; paragraph 316; push 316
//   414  glide to PICO (scroll 230 -> 718, 42 f), push released; PICO section rises 438
//   424  caption "PICO, pulled out for you."                  exit 646
//   462  rows land on the beat-ish: P 462, I 486, C 510, O 534; push 540 (ends pushed for S05)
//
// Screen geometry at rest: facts y 946-1295; summary at scroll 230: card top 832, sentence
// 942-1105 (36 px type), paragraph from 1131; PICO at scroll 718: 810-1316, dd text 36 px.
// ==========================================================================================

const ONE_LEN = ANALYSIS.oneSentence.length;

// S03Fab's browser, at its un-pushed geometry (S03 fades to paper, so this is a fresh shot).
const BW = 1000, BH = 920, BL = 40, BT = 560, BS = 1.6, FS = 1.85;

const S04Analyze: React.FC = () => {
  const frame = useCurrentFrame();

  // opening: browser out, panel in
  const bIn = progress(frame, 0, 8);
  const bOut = progress(frame, 0, 30, EASE_IN);
  const pIn = progress(frame, 6, 32, EASE_OUT);

  const scrollY = glide(frame, 0, [
    { at: 196, to: 230, dur: 36 },
    { at: 414, to: S04_END.scrollY, dur: 42 },
  ]);

  const state: StackState = {
    facts: { lines: ramp(frame, [44, 60], 16), chips: ramp(frame, [80, 96, 112], 16) },
    sections: ramp(frame, [212], 22) + ramp(frame, [438], 22),
    summary: {
      oneChars: lin(frame, [232, 296], [0, ONE_LEN]),
      tint: tintPulse(frame, 298),
      para: ramp(frame, [316], 24),
      button: ramp(frame, [330], 20),
    },
    pico: { rows: ramp(frame, [462, 486, 510, 534], 18) },
  };

  const cam: CamKey[] = [
    REST,
    { ...PUSH_S04, at: 70 },
    { ...REST, at: 196 },
    { ...PUSH_S04, at: 316 },
    { ...REST, at: 414 },
    { ...PUSH_S04, at: 540 },
  ];

  return (
    <SceneShell enter="none" exit="none" drift={1}>
      {bIn * (1 - bOut) > 0.001 ? (
        <AbsoluteFill style={{ opacity: bIn * (1 - progress(frame, 8, 22, EASE_IN)), transform: `translateX(${-mix(bOut, 0, 760)}px) scale(${mix(bOut, 1, 0.96)})` }}>
          <BrowserFrame width={BW} height={BH} scale={BS} url={ARTICLE.url} tabTitle={ARTICLE.title}
            style={{ position: 'absolute', left: BL, top: BT }}>
            <ArticlePage scale={1.6} scrollY={180} />
            <div style={{ position: 'absolute', right: 20 * FS, bottom: 24 * FS, display: 'flex' }}>
              <Fab scale={FS} />
            </div>
          </BrowserFrame>
        </AbsoluteFill>
      ) : null}

      <Camera keys={cam} dur={48}>
        <ShortPanel scrollY={scrollY} state={state}
          style={{ opacity: pIn, transform: `translateY(${mix(pIn, 260, 0)}px)` }} />
      </Camera>

      <ShortCaption lines={['Read the facts first.']} at={12} exitAt={188} accent={['facts']} />
      <ShortCaption lines={['The whole paper,', 'in one sentence.']} at={204} exitAt={406} accent={['one']} />
      <ShortCaption lines={['PICO, pulled out', 'for you.']} at={424} exitAt={646} accent={['PICO']} />
    </SceneShell>
  );
};

export default S04Analyze;
