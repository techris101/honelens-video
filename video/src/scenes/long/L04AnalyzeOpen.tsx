import React from 'react';
import { useCurrentFrame } from 'remotion';
import { C, FONT } from '../../brand/colors';
import { ARTICLE } from '../../data/demo';
import { EASE_IN, EASE_IN_OUT, EASE_OUT, inOut, lin, mix, progress } from '../../motion/ease';
import { Camera, SceneShell } from '../../motion/Scene';
import { WordsRise } from '../../motion/Text';
import { ArticlePage, BrowserFrame, Fab } from '../../ui/Browser';
import { Cursor } from '../../ui/Cursor';
import type { CursorKey } from '../../ui/Cursor';
import { Icon } from '../../ui/Icon';
import { PanelFrame } from '../../ui/Panel';
import { AnalyzeFacts, AnalyzeHeader, revealStyle } from '../../ui/screens/Analyze';

/**
 * L04AnalyzeOpen (630 f, 1920 x 1080, 60 fps). Follows the chapter card "Analyze any article".
 *
 * The world is the one L06PicoLimits uses, so L04 -> L05 -> L06 read as one continuous shot:
 * the browser window (1640 x 800 at 140,200, chrome scale 1.4) with the side panel docked on the
 * right (560 px slot = PanelFrame 400 x 480 CSS px at zoom 1.4). Camera B is the identity (the whole
 * browser); camera A frames the docked panel alone at an effective zoom of 1.9 (760 x 912 px at
 * x 1040-1800, y 84-996), browser faded out, panel floating with its own frame and shadow.
 *
 * The article page is drawn at scale 1.29 so its text column (760 * s + padding = 1073 px) fits the
 * page both before and after the panel opens (1640 -> 1079 px): the page does not reflow while the
 * panel slides in. The FAB sits fixed at the page's bottom-right (right 20, bottom 24 CSS px, as in
 * src/content/fab.js) and rides left with the page edge when the panel opens. Its close box is hidden
 * until hover, as in the product.
 *
 * Beats (frames):
 *   0-14     scene fades in on the wide browser shot.
 *   16-316   caption 1 (top): "A teal button appears on research articles."
 *   74-104   the FAB slides in from the right edge (pop). Page scrolls gently 118-248 (0 -> 150 px).
 *   212-300  cursor enters, glides to the FAB (arrives 290, hover shows the close box), clicks at 300.
 *   304-340  the side panel slides open (560 px); "Reading this page…" under the Analyze header.
 *   352-402  camera pushes in to the panel alone (zoom 1.9), browser fades out (352-378).
 *   398-466  facts land: byline 398, DOI/PMID 412, chips 430 / 442 / 454.
 *   408-604  caption 2 (left column, y 440): "Facts first" / "Identifiers, journal, study type, updates."
 *   500-522  the reading card lands: "Google Gemini is reading the full text on this page…".
 *   618-630  scene fades out. Final frame = L05's first frame (camera A, panel top, reading card).
 *
 * Screen mapping in camera A (shared with L05/L06): x = 1040 + 1.9 * (16 + x_body),
 * y = 84 + 1.9 * (100 + y_body - scroll). Header 0-47, facts 71-226, reading card 250-342 (estimates).
 */

// ---------- World geometry (identical to L06PicoLimits) ----------

export const WIN = { x: 140, y: 200, w: 1640, h: 800, chrome: 1.4 } as const;
export const DOCK = { w: 560, zoom: 1.4 } as const;
export const PANEL = { w: 400, h: 480 } as const; // CSS px (480 x 1.4 = 672 = the window's content height)
/** Top-left of the docked panel slot inside BrowserFrame (1 px frame border, 1 px slot border). */
export const SLOT = {
  x: WIN.x + 1 + (WIN.w - DOCK.w - 1) + 1,
  y: WIN.y + 1 + 44 * WIN.chrome + 46 * WIN.chrome + 1,
};
export const ZA = 1.9;
const SA = ZA / DOCK.zoom;
export const PA = { x: 1040, y: 84 };
export const CAM_A = { x: PA.x - 960 - (SLOT.x - 960) * SA, y: PA.y - 540 - (SLOT.y - 540) * SA, scale: SA };
export const CAM_B = { x: 0, y: 0, scale: 1 };

/** Panel body point -> screen point in camera A (y_body already includes any scroll offset). */
export const sx = (xb: number) => PA.x + ZA * (16 + xb);
export const sy = (yb: number) => PA.y + ZA * (100 + yb);

/**
 * The panel's own frame: docked (0) it has square corners except the window's rounded bottom-right;
 * alone (1) it has 10 px corners, a hairline and the window shadow. Same values as L06.
 */
export const panelFloatStyle = (float: number): React.CSSProperties => {
  const f = Math.max(0, Math.min(1, float));
  const r = 10 * f;
  return {
    borderRadius: `${r}px ${r}px ${mix(f, 9.1, 10)}px ${r}px`,
    boxShadow: f > 0.001
      ? `0 0 0 1px rgba(211, 209, 199, ${f.toFixed(3)}), 0 2px 6px rgba(24, 50, 74, ${(0.06 * f).toFixed(3)}), 0 30px 80px rgba(24, 50, 74, ${(0.16 * f).toFixed(3)})`
      : 'none',
  };
};

/** The product's "analysis in progress" card (analyze.js analyze(): hl-card + status line). */
export const READING_TEXT = 'Google Gemini is reading the full text on this page. This usually takes 5 to 20 seconds.';
export const ReadingCard: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <section className="hl-card hl-stack" style={style}>
    <p className="hl-small hl-an-status" role="status">
      <Icon name="clock" size={16} /> {READING_TEXT}
    </p>
  </section>
);

/**
 * Long-film caption with explicit line breaks: small teal kicker, navy Plex Sans headline (56 px),
 * optional serif sub that can land later. Same type and motion as LongCaption.
 */
export const SideCaption: React.FC<{
  kicker?: string; lines: string[]; at: number; exitAt?: number; accent?: string[];
  x?: number; y?: number; width?: number; size?: number; sub?: string; subAt?: number;
}> = ({ kicker, lines, at, exitAt, accent, x = 140, y = 440, width = 820, size = 56, sub, subAt }) => {
  const frame = useCurrentFrame();
  const k = progress(frame, at, 20);
  const e = exitAt === undefined ? 0 : progress(frame, exitAt, 12, EASE_IN);
  const s = sub ? progress(frame, subAt ?? at + 18, 26) : 0;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width }}>
      {kicker ? (
        <div style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: 24, lineHeight: 1.3, color: C.teal, marginBottom: 14, opacity: k * (1 - e), transform: `translateY(${mix(k, 10, 0) - e * 10}px)` }}>
          {kicker}
        </div>
      ) : null}
      <WordsRise lines={lines} at={at + 4} exitAt={exitAt} accent={accent} stagger={3} dur={26}
        style={{ fontSize: size, lineHeight: 1.08, letterSpacing: '-0.022em' }} />
      {sub ? (
        <div style={{ marginTop: 18, fontFamily: FONT.serif, fontSize: 28, lineHeight: 1.45, color: C.slate, opacity: s * (1 - e), transform: `translateY(${mix(s, 12, 0)}px)` }}>
          {sub}
        </div>
      ) : null}
    </div>
  );
};

/** Press curve for a click at frame c: down in 3 f, held, released over 5 f. */
export const pressCurve = (frame: number, c: number) => inOut(frame, c, 3, c + 6, 5);

// ---------- Timing ----------

const T = {
  cap1: 16, cap1Out: 316,
  fab: 74, fabDur: 30,
  pageScroll: 118, pageDur: 130,
  cursorIn: 212, fabArrive: 290, click: 300, cursorOut: 314,
  open: 304, openDur: 36,
  push: 352, camDur: 50,
  facts: 398, factStep: 14, chips: 430, chipStep: 12,
  cap2: 408, sub2: 452, cap2Out: 604,
  reading: 500,
} as const;

const PAGE_SCALE = 1.29;
const PAGE_SCROLL = 150;
const FAB_SCALE = 1.6; // label 14 * 1.6 = 22.4 px

// FAB geometry (screen, camera B): page area right edge 1781, bottom 1001; FAB right 28, bottom 34.
// The FAB is ~385 x 64 px, so its main button spans about x 1368-1697, y 903-967 (centre y 935).
const FAB_PT = { x: 1500, y: 940 };
const CURSOR_KEYS: CursorKey[] = [
  { at: 0, x: 1230, y: 650 },
  { at: T.fabArrive, x: FAB_PT.x, y: FAB_PT.y, dur: 66 },
  { at: T.click, x: FAB_PT.x, y: FAB_PT.y, click: true, dur: 6 },
];

// ---------- Scene ----------

const L04AnalyzeOpen: React.FC = () => {
  const frame = useCurrentFrame();

  // Page and FAB
  const pageY = mix(progress(frame, T.pageScroll, T.pageDur, EASE_IN_OUT), 0, PAGE_SCROLL);
  const fabIn = progress(frame, T.fab, T.fabDur);
  const fabHover = progress(frame, T.fabArrive - 6, 9) * (1 - progress(frame, T.cursorOut + 2, 9));
  const fabPress = pressCurve(frame, T.click);

  // Panel opening, then the push-in to camera A
  const openP = progress(frame, T.open, T.openDur, EASE_OUT);
  const pw = DOCK.w * openP;
  const push = progress(frame, T.push, T.camDur, EASE_IN_OUT);
  const browser = 1 - progress(frame, T.push, 26, EASE_IN);

  // Panel content
  const loading = 1 - progress(frame, T.facts - 6, 10, EASE_IN);
  const lines = (frame - T.facts) / T.factStep;
  const chips = (frame - T.chips) / T.chipStep;
  const reading = lin(frame, [T.reading, T.reading + 22], [0, 1]);

  return (
    <SceneShell drift={1}>
      <Camera dur={T.camDur} keys={[{ at: 0, ...CAM_B }, { at: T.push, ...CAM_A }]}>
        {browser > 0.001 ? (
          <div style={{ position: 'absolute', left: WIN.x, top: WIN.y, opacity: browser }}>
            <BrowserFrame width={WIN.w} height={WIN.h} url={ARTICLE.url} tabTitle={ARTICLE.journal} scale={WIN.chrome}
              panel={<div />} panelWidth={pw}>
              <ArticlePage scale={PAGE_SCALE} scrollY={pageY} />
              {fabIn > 0 ? (
                <div className="l04-fab" style={{ position: 'absolute', right: 28, bottom: 34, opacity: fabIn, transform: `translateX(${mix(fabIn, 140, 0)}px)` }}>
                  {/* The close box shows only on hover (fab.js: .wrap:hover .x { opacity: 1 }). */}
                  <style>{`.l04-fab > div > div:last-child { opacity: ${fabHover.toFixed(3)}; }`}</style>
                  <Fab scale={FAB_SCALE} pressed={fabPress} />
                </div>
              ) : null}
            </BrowserFrame>
          </div>
        ) : null}

        {pw > 0.5 ? (
          <div
            style={{
              position: 'absolute', left: SLOT.x + DOCK.w - pw, top: SLOT.y,
              width: openP < 1 ? pw : DOCK.w, height: PANEL.h * DOCK.zoom,
              overflow: openP < 1 ? 'hidden' : 'visible',
            }}
          >
            <PanelFrame section="Analyze" width={PANEL.w} height={PANEL.h} zoom={DOCK.zoom} scrollY={0} chrome={false}
              style={panelFloatStyle(push)}>
              <div><AnalyzeHeader /></div>
              <div className="hl-stack hl-an">
                <div style={{ position: 'relative' }}>
                  <AnalyzeFacts lines={lines} chips={chips} />
                  {loading > 0.001 ? (
                    <p className="hl-small hl-an-status" role="status" style={{ position: 'absolute', left: 0, top: 0, right: 0, opacity: loading }}>
                      <Icon name="clock" size={16} /> Reading this page…
                    </p>
                  ) : null}
                </div>
                <div className="hl-stack">
                  <ReadingCard style={revealStyle(reading)} />
                </div>
              </div>
            </PanelFrame>
          </div>
        ) : null}
      </Camera>

      <SideCaption lines={['A teal button appears on research articles.']} accent={['teal']}
        at={T.cap1} exitAt={T.cap1Out} x={WIN.x} y={88} width={WIN.w} />
      <SideCaption kicker="Facts first" lines={['Identifiers, journal,', 'study type, updates.']}
        sub="From the page’s citation tags, PubMed and Crossref." subAt={T.sub2}
        at={T.cap2} exitAt={T.cap2Out} />

      <Cursor keys={CURSOR_KEYS} size={40} appearAt={T.cursorIn} hideAt={T.cursorOut} />
    </SceneShell>
  );
};

export default L04AnalyzeOpen;
