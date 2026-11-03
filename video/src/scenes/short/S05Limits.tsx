import React from 'react';
import { useCurrentFrame } from 'remotion';
import { C, SHADOW_WINDOW } from '../../brand/colors';
import { ShortCaption } from '../../motion/Captions';
import { EASE_IN, EASE_IN_OUT, EASE_OUT, lin, mix, progress } from '../../motion/ease';
import { Camera, SceneShell } from '../../motion/Scene';
import type { CamKey } from '../../motion/Scene';
import { ArticlePage } from '../../ui/Browser';
import { Cursor } from '../../ui/Cursor';
import type { CursorKey } from '../../ui/Cursor';
import { diveLength } from '../../ui/screens/Analyze';
import {
  CURSOR_SIZE, DONE_SUMMARY, PANEL, PUSH_S04, REST, S04_END, ShortPanel, glide, press, ramp, tintPulse, tip,
} from './S04Analyze';
import type { StackState } from './S04Analyze';

/* ==========================================================================================
 * S05Limits (450 f, 7.5 s). Continues S04's last frame exactly (scroll 718, push 1.04), same panel.
 *
 *   0    push released + glide to the limitations (scroll 718 -> 968, 40 f); section in 10,
 *        rows land 18 / 26 / 34
 *   6    caption "Every point links / to the exact words."                       exit 218
 *   34   cursor enters from below, settles on limitation 1 (60), clicks (62)
 *   64   the row opens (24 f): chevron turns, the quote with its find icon, the dive ("Writing…" then
 *        streams 72-100)
 *   74   cursor glides to the quote (98), hover underline, clicks (104); the quote keeps a teal tint
 *   108  split: the panel's bottom edge rises (416 -> 228 CSS px, 108-134) so it shows only heading,
 *        row and quote; the article page card rises into the freed space (122), the page scrolls to the
 *        passage (126-162) and the sentence is highlighted (teal tint + underline, 160-176). Hold.
 *   232  caption "Funding and / conflicts, surfaced."                             exit 436
 *   236  page card drops away; the panel grows back (240-276) while it glides to "Biases and conflicts"
 *        (scroll 968 -> 1475, 240-284); section in 262, rows land 272 / 284 / 296 (amber Funding,
 *        Conflict tags)
 *   300  cursor enters, settles on the funding row (328), clicks (332); it opens (334-360), its quote
 *        gets the product's tint (352), the dive streams (346-382)
 *   384  slow push 1.00 -> 1.04 (anchored low), held into S06
 *
 * Geometry (scene px, camera at rest). by()/bx() from S04Analyze: y = 560 + 2.25 (101 + yb - scroll).
 *   scroll 968: "Limitations" 780, row 1 864-1008 (text lines centred 909 / 963), quote text centre 1035
 *   (x 189..~865). Visible body [scroll - 16, scroll + H - 100] for panel height H (CSS px).
 *   Split, H 228: panel 560-1077.5 shows y_b 952-1096 (heading, row 1, quote; the dive starts at 1097.25).
 *   Page card 904.5 x 294 at (88, 1105.5); bottom band 1400-1500 stays empty paper.
 *   scroll 1475: "Biases and conflicts" 778, funding row 863-1070 (tag 904, text 971 / 1025),
 *   its quote 1070-1166, the dive from 1166 (cut by the panel edge at 1500).
 *
 * Page card. ArticlePage (scale 1.95: body serif 30.2 px, line 48.96 px) laid out at the card's width and
 * anchored by its BOTTOM (a scoped style makes its root static so the wrapper takes the page's height):
 * after the target paragraph come only the Funding heading and its 3-line paragraph, so the paragraph's
 * position no longer depends on how the title and abstract wrap. Article bottom - paragraph bottom
 * = 42.9 (collapsed margin) + 38.0 (h2) + 15.6 + 3 x 48.96 + 23.4 + 50.7 = 317.5 px. Bottom offset 291.5
 * puts the paragraph's end 26 px above the card's inner bottom; the paragraph wraps to 4 lines
 * (Plex Serif widths: 23.6 / 24.2 / 24.0 / 16.3 em of 25.2 em), so the "Outcome assessment" heading sits
 * 17 px under the card's top edge, and the glyph-free gaps above it and below the paragraph take the
 * card's edges (no cut lines). Highlight: line 2 (from "Outcome") and the start of line 3.
 * ========================================================================================== */

const S_LIM = 968;
const S_BIAS = 1475;
const H_SPLIT = 228;

const CARD_X = PANEL.x;
const CARD_W = (PANEL.w + 2) * PANEL.zoom;                       // 904.5, same as the panel's outer box
const CARD_Y = PANEL.y + (H_SPLIT + 2) * PANEL.zoom + 28;        // 1105.5
const CARD_H = 294;
const PAGE_S = 1.95;
const PAGE_BOTTOM = 291.5;                                       // article end sits this far below the card
const PAGE_CSS = '.vs-page>div{position:relative!important;inset:auto!important}';

// Cursor tips (scene px).
const ROW1 = { x: 400, y: 936 };       // limitation 1, between its two text lines
const QUOTE = { x: 464, y: 1035 };     // on the quote text
const FUND = { x: 400, y: 996 };       // funding row, between its two text lines
const CLICK_ROW = 62, CLICK_QUOTE = 104, CLICK_FUND = 332;

const KEYS_A: CursorKey[] = [
  { at: 0, x: 690, y: 1590 },
  { at: 56, ...tip(ROW1.x + 8, ROW1.y + 10), dur: 22 },
  { at: 60, ...tip(ROW1.x, ROW1.y), dur: 4 },
  { at: CLICK_ROW, ...tip(ROW1.x, ROW1.y), dur: 2, click: true },
  { at: 95, ...tip(QUOTE.x - 6, QUOTE.y - 8), dur: 21 },
  { at: 99, ...tip(QUOTE.x, QUOTE.y), dur: 4 },
  { at: CLICK_QUOTE, ...tip(QUOTE.x, QUOTE.y), dur: 5, click: true },
];

const KEYS_B: CursorKey[] = [
  { at: 0, x: 700, y: 1590 },
  { at: 324, ...tip(FUND.x + 8, FUND.y + 10), dur: 24 },
  { at: 328, ...tip(FUND.x, FUND.y), dur: 4 },
  { at: CLICK_FUND, ...tip(FUND.x, FUND.y), dur: 4, click: true },
];

const LIM_DIVE = diveLength('limitations', 0);
const BIAS_DIVE = diveLength('biases', 0);

/** S05's last frame, which S06's first frame continues. */
export const S05_END = { scrollY: S_BIAS, cam: PUSH_S04 } as const;

/** The panel state S05 ends on (both first rows open, every section up to biases in). */
export const limitsEndState = (): StackState => ({
  sections: 4,
  summary: DONE_SUMMARY,
  limitations: { openIndex: 0, open: 1 },
  biases: { openIndex: 0, open: 1 },
});

/** The article page, clipped to a card and bottom-anchored (see header). */
const PageCard: React.FC<{ offset: number; hl: number; style?: React.CSSProperties }> = ({ offset, hl, style }) => (
  <div
    style={{
      position: 'absolute', left: CARD_X, top: CARD_Y, width: CARD_W, height: CARD_H, background: C.white,
      border: `1px solid ${C.hair}`, borderRadius: 22, boxShadow: SHADOW_WINDOW, overflow: 'hidden', ...style,
    }}
  >
    <style>{PAGE_CSS}</style>
    <div className="vs-page" style={{ position: 'absolute', left: 0, right: 0, bottom: -offset }}>
      <ArticlePage scale={PAGE_S} hl={hl} hlKey="assessors" />
    </div>
  </div>
);

const S05Limits: React.FC = () => {
  const frame = useCurrentFrame();

  const scrollY = glide(frame, S04_END.scrollY, [
    { at: 0, to: S_LIM, dur: 40 },
    { at: 240, to: S_BIAS, dur: 44 },
  ]);

  // split: 0 full panel, 1 short panel + page card
  const split = progress(frame, 108, 26, EASE_IN_OUT) - progress(frame, 240, 36, EASE_IN_OUT);
  const panelH = mix(split, PANEL.h, H_SPLIT);

  const cardIn = progress(frame, 122, 26, EASE_OUT);
  const cardOut = progress(frame, 236, 16, EASE_IN);
  const pageOffset = glide(frame, PAGE_BOTTOM + 170, [{ at: 126, to: PAGE_BOTTOM, dur: 36 }]);
  const hl = progress(frame, 160, 16);

  const state: StackState = {
    sections: 2 + ramp(frame, [10], 18) + ramp(frame, [262], 18),
    summary: DONE_SUMMARY,
    limitations: {
      rows: ramp(frame, [18, 26, 34], 16),
      hoverIndex: frame >= 54 && frame < 76 ? 0 : -1,
      pressedIndex: 0,
      pressed: press(frame, CLICK_ROW),
      openIndex: 0,
      open: progress(frame, 64, 24, EASE_OUT),
      diveChars: lin(frame, [72, 100], [0, LIM_DIVE]),
      quoteIndex: 0,
      quoteHover: frame >= 92 && frame < 114,
      quotePressed: press(frame, CLICK_QUOTE),
      quoteTint: progress(frame, CLICK_QUOTE, 8) * (1 - progress(frame, 236, 24, EASE_IN_OUT)),
    },
    biases: {
      rows: ramp(frame, [272, 284, 296], 16),
      hoverIndex: frame >= 318 && frame < 350 ? 0 : -1,
      pressedIndex: 0,
      pressed: press(frame, CLICK_FUND),
      openIndex: 0,
      open: progress(frame, 334, 26, EASE_OUT),
      diveChars: lin(frame, [346, 382], [0, BIAS_DIVE]),
      quoteIndex: 0,
      quoteTint: tintPulse(frame, 352),
    },
  };

  const cam: CamKey[] = [
    { ...PUSH_S04, at: 0 },
    { ...REST, at: 0 },
    { ...PUSH_S04, at: 384 },
  ];

  return (
    <SceneShell enter="none" exit="none" drift={1}>
      <Camera keys={cam} dur={40}>
        {cardIn * (1 - cardOut) > 0.001 ? (
          <PageCard offset={pageOffset} hl={hl}
            style={{ opacity: cardIn * (1 - cardOut), transform: `translateY(${mix(cardIn, 70, 0) + cardOut * 50}px)` }} />
        ) : null}
        <ShortPanel scrollY={scrollY} state={state} height={panelH} />
        <Cursor keys={KEYS_A} size={CURSOR_SIZE} appearAt={34} hideAt={112} />
        <Cursor keys={KEYS_B} size={CURSOR_SIZE} appearAt={300} hideAt={346} />
      </Camera>

      <ShortCaption lines={['Every point links', 'to the exact words.']} at={6} exitAt={218} accent={['exact']} />
      <ShortCaption lines={['Funding and', 'conflicts, surfaced.']} at={232} exitAt={436} accent={['surfaced']} />
    </SceneShell>
  );
};

export default S05Limits;
