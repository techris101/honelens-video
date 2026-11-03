import React from 'react';
import { useCurrentFrame } from 'remotion';
import { ARTICLE } from '../../data/demo';
import { LongCaption } from '../../motion/Captions';
import { EASE_IN, EASE_IN_OUT, inOut, lin, mix, progress } from '../../motion/ease';
import { Camera, SceneShell } from '../../motion/Scene';
import { ArticlePage, BrowserFrame } from '../../ui/Browser';
import { Cursor, CursorKey } from '../../ui/Cursor';
import { PanelFrame } from '../../ui/Panel';
import { AnalyzeFooter, AskBox, ItemList, PicoList, SummaryCard } from '../../ui/screens/Analyze';

/**
 * L06PicoLimits (840 f, 1920 x 1080, 60 fps). Continues L05: the Analyze panel alone, large, on the
 * right; captions in the left column.
 *
 * One world, one camera. The world is the browser window (1640 x 800 at 140,200, chrome scale 1.4)
 * with the side panel docked on the right (560 px slot = PanelFrame 400 x 480 CSS px at zoom 1.4).
 * Camera A frames the docked panel so it reads exactly like the panel alone: zoom 1.4 x 1.357 = 1.9,
 * 760 x 912 px at x 1040-1800, y 84-996 (browser hidden, panel floats with its own shadow).
 * Camera B is the identity: the whole browser, the article on the left. The pull-back A -> B is the
 * "find on the page" moment; B -> A pushes back in for biases and conflicts.
 *
 * Panel body (panel CSS px, y = 0 at the top of PICO; the summary card is anchored just above it so
 * the opening frame still shows the end of L05's summary). Measured from the Plex font metrics:
 *   PICO 0-225 · Limitations 237-481 (item 1 text 282-330, its quote 342-363; the open dive adds ~251)
 *   · Biases and conflicts at 493 (744 with the first limitation open), Funding 777-926,
 *   Conflict 926-1059. Panel view = scrollY - 16 .. scrollY + 364.
 * Phase A screen mapping: x = 1040 + 1.9 * (16 + x_body), y = 84 + 1.9 * (100 + y_body - scrollY).
 *
 * Beats (frames):
 *   0-182    caption 1 "PICO, ready for your notes." (12-182). Scroll -200 -> -56 (16-58), heading 46,
 *            rows land 60 / 80 / 100 / 120.
 *   186-350  scroll -> 222 (186-232). Limitations heading 222, rows 232 / 246 / 260. Caption 2 (196-350).
 *            Cursor in at 250, clicks the first item at 298: the dive opens (302-332), writes from 318.
 *            Cursor clicks the quote at 346 (teal tint stays on it through the browser shot).
 *   362-416  pull back to the browser. Caption 3 at the top (404-606). Page scrolls to the passage
 *            (412-466), the sentence is highlighted (466-490, teal tint + underline), hold.
 *   616-670  push back in, browser fades (616-642). Caption 4 (650-end). Scroll -> 730 (672-716),
 *            Biases and conflicts heading 706, rows 716 / 732 / 748 with amber Funding / Conflict tags.
 */

// ---------- World geometry ----------

const WIN = { x: 140, y: 200, w: 1640, h: 800, chrome: 1.4 } as const;
const DOCK = { w: 560, zoom: 1.4 } as const;
const PANEL = { w: 400, h: 480 } as const; // CSS px (480 x 1.4 = 672 = the window's content height)
/** Top-left of the docked panel slot inside BrowserFrame (content-box: 1 px frame border, 1 px slot border). */
const SLOT = {
  x: WIN.x + 1 + (WIN.w - DOCK.w - 1) + 1,
  y: WIN.y + 1 + 44 * WIN.chrome + 46 * WIN.chrome + 1,
};

// Phase A: the panel alone, zoom 1.9, right column.
const ZA = 1.9;
const SA = ZA / DOCK.zoom;
const PA = { x: 1040, y: 84 };
const CAM_A = { x: PA.x - 960 - (SLOT.x - 960) * SA, y: PA.y - 540 - (SLOT.y - 540) * SA, scale: SA };
const CAM_B = { x: 0, y: 0, scale: 1 };

/** Panel body point -> screen point in phase A. */
const sx = (xb: number) => PA.x + ZA * (16 + xb);
const sy = (yb: number, scroll: number) => PA.y + ZA * (100 + yb - scroll);

// Scroll stops (panel CSS px)
const S0 = -200; // end of the summary (Explain more open) at the top, PICO below
const S1 = -56;  // PICO centred
const S2 = 222;  // Limitations heading near the top
const S3 = 730;  // Biases and conflicts heading near the top (first limitation open)

// ---------- Timing ----------

const T = {
  cap1: 12, cap1Out: 182,
  scroll1: 16, picoHead: 46, picoRows: 60, picoStep: 20,
  scroll2: 186, cap2: 196, cap2Out: 350,
  limHead: 222, limRows: 232, limStep: 14,
  cursorIn: 250, itemArrive: 292, itemClick: 298, open: 302, dive: 318,
  quoteArrive: 338, quoteClick: 346, cursorOut: 356,
  pull: 362, camDur: 54, pageScroll: 412, hl: 466, cap3: 404, cap3Out: 606,
  push: 616, cap4: 650, scroll3: 672, biasHead: 706, biasRows: 716, biasStep: 16,
} as const;

const DIVE_CPS = 150; // characters per second while the first limitation's explanation writes itself
const PAGE_TARGET = 640; // ArticlePage scrollY that brings "Outcome assessors were aware…" into view

// Cursor (screen space). Item: first text line of "Outcome assessors knew who got the teaching".
const ITEM_PT = { x: sx(130), y: sy(294, S2) };
const QUOTE_PT = { x: sx(150), y: sy(352, S2) };
const CURSOR_KEYS: CursorKey[] = [
  { at: 0, x: 1520, y: 900 },
  { at: T.itemArrive, x: ITEM_PT.x, y: ITEM_PT.y, dur: 40 },
  { at: T.itemClick, x: ITEM_PT.x, y: ITEM_PT.y, click: true, dur: 6 },
  { at: T.quoteArrive, x: QUOTE_PT.x, y: QUOTE_PT.y, dur: 32 },
  { at: T.quoteClick, x: QUOTE_PT.x, y: QUOTE_PT.y, click: true, dur: 8 },
];

/** Press curve for a click at frame c: down in 3 f, held, released over 5 f. */
const press = (frame: number, c: number) => inOut(frame, c, 3, c + 6, 5);

// ---------- Scene ----------

const L06PicoLimits: React.FC = () => {
  const frame = useCurrentFrame();

  // Panel scroll
  let scroll: number = S0;
  scroll = mix(progress(frame, T.scroll1, 42, EASE_IN_OUT), scroll, S1);
  scroll = mix(progress(frame, T.scroll2, 46, EASE_IN_OUT), scroll, S2);
  scroll = mix(progress(frame, T.scroll3, 44, EASE_IN_OUT), scroll, S3);

  // Camera A -> B -> A and what rides on it
  const toB = progress(frame, T.pull, T.camDur, EASE_IN_OUT) * (1 - progress(frame, T.push, T.camDur, EASE_IN_OUT));
  const float = 1 - toB; // panel's own frame (radius, shadow, hairline) while it is alone
  const browser = progress(frame, T.pull, 34) * (1 - progress(frame, T.push, 26, EASE_IN));
  const pageY = mix(progress(frame, T.pageScroll, 54, EASE_IN_OUT), 0, PAGE_TARGET);
  const hl = progress(frame, T.hl, 24);

  // PICO
  const picoHead = lin(frame, [T.picoHead, T.picoHead + 20], [0, 1]);
  const picoRows = (frame - T.picoRows) / T.picoStep;

  // Limitations
  const limHead = lin(frame, [T.limHead, T.limHead + 20], [0, 1]);
  const limRows = (frame - T.limRows) / T.limStep;
  const itemHover = frame >= T.itemArrive - 4 && frame < T.itemClick + 14;
  const itemPress = press(frame, T.itemClick);
  const open = progress(frame, T.open, 30, EASE_IN_OUT);
  const diveChars = ((frame - T.dive) / 60) * DIVE_CPS;
  const quoteHover = frame >= T.quoteArrive - 4 && frame < T.quoteClick + 14;
  const quotePress = press(frame, T.quoteClick);
  const quoteTint = progress(frame, T.quoteClick, 10) * (1 - progress(frame, T.push, 30, EASE_IN));

  // Biases and conflicts
  const biasHead = lin(frame, [T.biasHead, T.biasHead + 20], [0, 1]);
  const biasRows = (frame - T.biasRows) / T.biasStep;

  // Docked, the panel's bottom-right corner is the window's rounded corner (BrowserFrame radius
  // 14 * 1.4 * 0.7 = 13.7 px outer, 12.7 px inner = 9.1 CSS px at zoom 1.4); alone, all corners are 10.
  const r = 10 * float;
  const radius = `${r}px ${r}px ${mix(float, 9.1, 10)}px ${r}px`;
  const panelShadow = float > 0.001
    ? `0 0 0 1px rgba(211, 209, 199, ${float.toFixed(3)}), 0 2px 6px rgba(24, 50, 74, ${(0.06 * float).toFixed(3)}), 0 30px 80px rgba(24, 50, 74, ${(0.16 * float).toFixed(3)})`
    : 'none';

  return (
    <SceneShell drift={1.01}>
      <Camera dur={T.camDur} keys={[{ at: 0, ...CAM_A }, { at: T.pull, ...CAM_B }, { at: T.push, ...CAM_A }]}>
        {browser > 0.001 ? (
          <div style={{ position: 'absolute', left: WIN.x, top: WIN.y, opacity: browser }}>
            <BrowserFrame width={WIN.w} height={WIN.h} url={ARTICLE.url} tabTitle={ARTICLE.journal} scale={WIN.chrome}
              panel={<div />} panelWidth={DOCK.w}>
              <ArticlePage scale={1.5} scrollY={pageY} hl={hl} hlKey="assessors" />
            </BrowserFrame>
          </div>
        ) : null}

        <div style={{ position: 'absolute', left: SLOT.x, top: SLOT.y }}>
          <PanelFrame section="Analyze" width={PANEL.w} height={PANEL.h} zoom={DOCK.zoom} scrollY={scroll} chrome={false}
            style={{ borderRadius: radius, boxShadow: panelShadow }}>
            <div className="hl-stack hl-an">
              <div style={{ position: 'relative' }}>
                {/* L05's summary, Explain more open, sits directly above PICO */}
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: '100%', paddingBottom: 12 }}>
                  <SummaryCard expanded explain={1} />
                </div>
                <div className="hl-stack">
                  <PicoList heading={picoHead} rows={picoRows} />
                  <ItemList
                    kind="limitations" heading={limHead} rows={limRows}
                    hoverIndex={itemHover ? 0 : -1} pressedIndex={0} pressed={itemPress}
                    openIndex={0} open={open} diveChars={diveChars}
                    quoteIndex={0} quoteHover={quoteHover} quotePressed={quotePress} quoteTint={quoteTint}
                  />
                  <ItemList kind="biases" heading={biasHead} rows={biasRows} />
                  <AskBox />
                  <AnalyzeFooter />
                </div>
              </div>
            </div>
          </PanelFrame>
        </div>
      </Camera>

      <LongCaption kicker="Population, intervention, comparison, outcome" title="PICO, ready for your notes."
        at={T.cap1} exitAt={T.cap1Out} x={140} y={440} width={800} />
      <LongCaption kicker="Limitations" title="What it is, and why it matters."
        at={T.cap2} exitAt={T.cap2Out} x={140} y={440} width={800} />
      <LongCaption title="Every point links to the exact words in the paper." accent={['exact']}
        at={T.cap3} exitAt={T.cap3Out} x={WIN.x} y={88} width={WIN.w} />
      <LongCaption kicker="Biases and conflicts" title="Funding and conflicts of interest, surfaced."
        at={T.cap4} x={140} y={440} width={800} />

      <Cursor keys={CURSOR_KEYS} size={40} appearAt={T.cursorIn} hideAt={T.cursorOut} />
    </SceneShell>
  );
};

export default L06PicoLimits;
