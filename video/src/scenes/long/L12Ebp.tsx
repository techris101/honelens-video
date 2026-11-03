/**
 * L12Ebp (long film, 1050 f at 60 fps): the full-tab EBP builder in a wide browser window.
 *
 *   (0–296)    "Collect your papers under one PICOT question."  Header and PICOT card land in a wide
 *              shot, then the camera pushes in on the Papers card and P1–P4 land one by one.
 *   (296–616)  "Compare papers side by side."  Click "Compare papers": the button goes busy with the
 *              product's static-clock status, then the comparison card grows in (pushing the matrix
 *              down): the synthesis streams, then Agree / Differ / Gaps land.
 *   (616–874)  "Draft your evidence matrix, then make it yours."  Click "Fill matrix with AI": the
 *              camera lands close on the top-left of the matrix as the diagonal cascade starts (cells
 *              and the "AI draft · edit it into your own words" tag at reading size), then pulls back
 *              to the whole table while the cascade sweeps to the last cell.
 *   (874–1050) "Export a Submission Pack."  Camera settles on the last matrix row and the Submission
 *              Pack: Word, Excel, CSV cards land.
 *
 * Layout: caption top-left (y 80, 56 px, one line, 1680 wide). Browser window 1680 × 836 at (120, 188),
 * chrome scale 1.1, so the content area is 1680 × 736 at (121, 289). The page is laid out at its real
 * 1280 px design width (1600 wide here so paper always fills the view, column centred) with CSS zoom
 * Z = 1680 / 1280 = 1.3125 for crisp text, and a camera (translate + scale inside the content area)
 * frames each beat. Effective zoom k = Z × camera scale:
 *   wide shot  k 1.24   PICOT 25 px          papers close-up  k 2.0   rows 32 px
 *   compare    k 1.31   synthesis 26 px      matrix close-up  k 2.08  cells 31 px, draft tag 25 px
 *   whole table k 1.12  (pattern view)       Submission Pack  k 1.31  heading 24 px
 * The cursor lives in scene space; the camera holds still on the compare framing for both clicks.
 */
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { EBP } from '../../data/demo';
import { LongCaption } from '../../motion/Captions';
import { EASE_IN, EASE_IN_OUT, lin, mix, progress } from '../../motion/ease';
import { SceneShell } from '../../motion/Scene';
import { BrowserFrame } from '../../ui/Browser';
import { Cursor } from '../../ui/Cursor';
import type { CursorKey } from '../../ui/Cursor';
import { EBP_TAB, EbpPage, ebpPageGeometry, MATRIX_CASCADE_END } from '../../ui/screens/Ebp';
import type { AiHelpCardProps } from '../../ui/screens/Ebp';

// ---------------------------------------------------------------- stage geometry (scene px)

const WIN = { x: 120, y: 188, w: 1680, h: 836, chrome: 1.1 } as const;
/** BrowserFrame is content-box: 1 px border outside; tab bar 44s, address bar 46s + 1 px rule. */
const CHROME_H = (44 + 46) * WIN.chrome + 1;
const VIEW = { x: WIN.x + 1, y: WIN.y + 1 + CHROME_H, w: WIN.w, h: WIN.h - CHROME_H } as const;

/** Page design size (CSS px). 1600 wide keeps paper under every framing; the 1280 column is centred. */
const PAGE_W = 1600;
const PAGE_H = 2200;
const Z = VIEW.w / 1280;

const G0 = ebpPageGeometry(0, PAGE_W);  // comparison closed
const G1 = ebpPageGeometry(1, PAGE_W);  // comparison open
const COL_CX = G0.header.cx;

// ---------------------------------------------------------------- camera

/** A framing: page point (cx, cy) at the centre of the content area, effective zoom k (screen px per page px). */
type View = { cx: number; cy: number; k: number };
type CamKey = View & { at: number; dur: number };

/** Fit a vertical page range [top, bottom] to the view height. */
const fitV = (top: number, bottom: number, cx = COL_CX): View => {
  const k = VIEW.h / (bottom - top);
  return { cx, cy: (top + bottom) / 2, k };
};
const fromTop = (top: number, k: number, cx = COL_CX): View => ({ cx, cy: top + VIEW.h / (2 * k), k });
const withRight = (v: View, right: number): View => ({ ...v, cx: right - VIEW.w / (2 * v.k) });

// Wide shot: header to the end of the Papers / AI help row, 18 px of paper above and below.
const V_TOP = fitV(G0.header.y - 18, G0.papers.card.y + G0.papers.card.h + 18);
// Papers card close-up: AI help card just out of frame on the right, PICOT card just out above.
const V_PAPERS = withRight(fromTop(G0.picot.y + G0.picot.h + 3, 2), G0.ai.card.x - 6);
// Compare: AI help buttons + the comparison card (open), whole column with 24 px margins.
const V_CMP = fromTop(G0.papers.card.y + 8, Z);
// Matrix close-up: navy header row + P1, P2; Paper column + Design … Outcome measures.
const V_CLOSE = withRight(
  fitV(G1.matrix.table.y - 16, G1.matrix.cell(2, 0).y - 11),
  G1.matrix.cell(0, 4).x - 10,
);
// The whole drafted table.
const V_ALL = fitV(G1.matrix.table.y - 16, G1.matrix.table.y + G1.matrix.table.h + 16);
// Last matrix row + the Submission Pack.
const V_EXPORT = fromTop(G1.matrix.cell(3, 0).y - 14, Z);

const CAM: CamKey[] = [
  { at: 0, dur: 1, ...V_TOP },
  { at: 112, dur: 64, ...V_PAPERS },
  { at: 292, dur: 52, ...V_CMP },
  { at: 652, dur: 56, ...V_CLOSE },
  { at: 772, dur: 58, ...V_ALL },
  { at: 862, dur: 56, ...V_EXPORT },
];

/** Camera state at frame f: eased (in-out) moves between framings, like motion/Scene Camera. */
const camAt = (f: number): View => {
  let v: View = { cx: CAM[0].cx, cy: CAM[0].cy, k: CAM[0].k };
  for (let i = 1; i < CAM.length; i++) {
    const key = CAM[i];
    const p = progress(f, key.at, key.dur, EASE_IN_OUT);
    if (p <= 0) break;
    v = { cx: mix(p, v.cx, key.cx), cy: mix(p, v.cy, key.cy), k: mix(p, v.k, key.k) };
  }
  return v;
};

/** Page point → scene px for a (held) framing. */
const toScene = (v: View, px: number, py: number) => ({
  x: VIEW.x + VIEW.w / 2 + v.k * (px - v.cx),
  y: VIEW.y + VIEW.h / 2 + v.k * (py - v.cy),
});

// ---------------------------------------------------------------- timing

const T = {
  cap1: 18, cap1Out: 284,
  cap2: 306, cap2Out: 598,
  cap3: 616, cap3Out: 858,
  cap4: 874,
  rows: [156, 236] as [number, number],      // P1–P4 land, 20 f apart
  matrixIn: 298,                               // matrix heading + lead fade in (hidden in the close-up of beat 1)
  cmpClick: 378,
  cmpBusy: 388, cmpBusyEnd: 440,
  cmpOpen: 440,                                // comparison card grows in (44 f)
  synth: [470, 540] as [number, number],       // synthesis streams
  blocks: [540, 594] as [number, number],      // Agree / Differ / Gaps, 18 f apart
  fillClick: 634,
  fillBusy: 640,
  cascade: 700,                                // diagonal d starts at cascade + 13 d
  perDiag: 13,
  exports: [900, 990] as [number, number],
} as const;

const CASCADE_END_F = T.cascade + MATRIX_CASCADE_END * T.perDiag;  // 836.5

/** Button press for a click at frame c (matches Cursor's press): down 3 f, hold, release 8 f. */
const pressAt = (f: number, c: number) => Math.min(lin(f, [c - 1, c + 2], [0, 1]), 1 - lin(f, [c + 5, c + 13], [0, 1]));

// Cursor targets (the camera holds V_CMP from 344 to 652). The arrow tip sits ~3 px inside the svg.
const TIP = 3;
const CMP_BTN = toScene(V_CMP, G0.ai.compareBtn.cx - 8, G0.ai.compareBtn.cy);
const FILL_BTN = toScene(V_CMP, G0.ai.fillBtn.cx - 8, G0.ai.fillBtn.cy);
const C1_FROM = toScene(V_CMP, G0.ai.compareBtn.cx + 150, G0.ai.compareBtn.cy + 170);
const C2_FROM = toScene(V_CMP, G0.ai.fillBtn.cx - 70, G0.ai.fillBtn.cy + 190);

const CURSOR_1: CursorKey[] = [
  { at: 0, x: C1_FROM.x, y: C1_FROM.y },
  { at: T.cmpClick - 4, dur: 36, x: CMP_BTN.x - TIP, y: CMP_BTN.y - TIP },
  { at: T.cmpClick, dur: 4, x: CMP_BTN.x - TIP, y: CMP_BTN.y - TIP, click: true },
  { at: T.cmpClick + 30, dur: 24, x: CMP_BTN.x + 24, y: CMP_BTN.y + 40 },
];
const CURSOR_2: CursorKey[] = [
  { at: 0, x: C2_FROM.x, y: C2_FROM.y },
  { at: T.fillClick - 6, dur: 34, x: FILL_BTN.x - TIP, y: FILL_BTN.y - TIP },
  { at: T.fillClick, dur: 4, x: FILL_BTN.x - TIP, y: FILL_BTN.y - TIP, click: true },
];

const STILL_CSS = '.l12-stage,.l12-stage *,.l12-stage *::before,.l12-stage *::after{transition:none!important;animation:none!important}';

// ---------------------------------------------------------------- scene

const L12Ebp: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const s = cam.k / Z;
  const winIn = progress(f, 0, 34);

  const cascade = lin(f, [T.cascade, CASCADE_END_F], [0, MATRIX_CASCADE_END]);
  const fillBusy = f >= T.fillBusy;
  const cmpBusy = f >= T.cmpBusy && f < T.cmpBusyEnd;

  const ai: Omit<AiHelpCardProps, 'style'> = {
    reveal: lin(f, [66, 92], [0, 1]),
    compareHover: progress(f, T.cmpClick - 16, 10) * (1 - progress(f, T.cmpBusy, 8)),
    comparePressed: pressAt(f, T.cmpClick),
    fillHover: progress(f, T.fillClick - 16, 10) * (1 - progress(f, T.fillBusy, 8)),
    fillPressed: pressAt(f, T.fillClick),
    busy: fillBusy ? 'fill' : cmpBusy ? 'compare' : null,
    status: fillBusy ? 'drafting' : f >= T.cmpBusy && f < T.cmpBusyEnd + 14 ? 'comparing' : null,
    statusShow: fillBusy
      ? progress(f, T.fillBusy + 2, 10)
      : progress(f, T.cmpBusy + 2, 10) * (1 - progress(f, T.cmpBusyEnd - 8, 12, EASE_IN)),
    drafted: Math.min(4, (cascade / MATRIX_CASCADE_END) * 4),
    compareUsed: f >= T.synth[0] - 4 ? 1 : 0,
    fillUsed: f >= CASCADE_END_F ? 1 : 0,
  };

  const items = lin(f, [T.synth[0] - 4, T.synth[0] + 12], [0, 1]) + lin(f, T.blocks, [0, 3]);
  const synthChars = lin(f, T.synth, [0, EBP.synthesis.length]);

  return (
    <SceneShell>
      <style>{STILL_CSS}</style>

      <LongCaption title="Collect your papers under one PICOT question." accent={['PICOT']}
        at={T.cap1} exitAt={T.cap1Out} x={WIN.x} y={80} width={WIN.w} />
      <LongCaption title="Compare papers side by side."
        at={T.cap2} exitAt={T.cap2Out} x={WIN.x} y={80} width={WIN.w} />
      <LongCaption title="Draft your evidence matrix, then make it yours." accent={['yours']}
        at={T.cap3} exitAt={T.cap3Out} x={WIN.x} y={80} width={WIN.w} />
      <LongCaption title="Export a Submission Pack."
        at={T.cap4} x={WIN.x} y={80} width={WIN.w} />

      <div style={{ position: 'absolute', left: WIN.x, top: WIN.y, transform: `translateY(${mix(winIn, 26, 0).toFixed(3)}px)` }}>
        <BrowserFrame width={WIN.w} height={WIN.h} url="HoneLENS › EBP builder" tabTitle={EBP_TAB.title} scale={WIN.chrome}>
          <div
            className="l12-stage"
            style={{
              position: 'absolute', left: 0, top: 0, width: VIEW.w, height: VIEW.h, transformOrigin: '0 0',
              transform: `translate(${VIEW.w / 2}px, ${VIEW.h / 2}px) scale(${s.toFixed(5)}) translate(${(-Z * cam.cx).toFixed(3)}px, ${(-Z * cam.cy).toFixed(3)}px)`,
            }}
          >
            <EbpPage
              zoom={Z} width={PAGE_W} height={PAGE_H}
              header={{ title: lin(f, [6, 32], [0, 1]), picot: lin(f, [24, 52], [0, 1]) }}
              papers={{ reveal: lin(f, [58, 84], [0, 1]), papers: lin(f, T.rows, [0, 4]) }}
              ai={ai}
              compare={progress(f, T.cmpOpen, 44, EASE_IN_OUT)}
              comparison={{ items, synthChars }}
              matrix={{ cascade, reveal: lin(f, [T.matrixIn, T.matrixIn + 28], [0, 1]), tag: 'full' }}
              exports={{ exports: lin(f, T.exports, [0, 1]) }}
            />
          </div>
        </BrowserFrame>
      </div>

      <Cursor keys={CURSOR_1} appearAt={T.cmpClick - 44} hideAt={T.cmpClick + 18} />
      <Cursor keys={CURSOR_2} appearAt={T.fillClick - 42} hideAt={T.fillClick + 12} />
    </SceneShell>
  );
};

export default L12Ebp;
