import React from 'react';
import { useCurrentFrame } from 'remotion';
import { EASE_IN_OUT, EASE_OUT, mix, progress } from '../../motion/ease';
import { Camera, SceneShell } from '../../motion/Scene';
import { Cursor } from '../../ui/Cursor';
import type { CursorKey } from '../../ui/Cursor';
import { PanelFrame } from '../../ui/Panel';
import { AnalyzeFacts, AnalyzeHeader, SummaryCard } from '../../ui/screens/Analyze';
import { CAM_A, DOCK, PANEL, ReadingCard, SLOT, SideCaption, panelFloatStyle, pressCurve } from './L04AnalyzeOpen';

/**
 * L05Summary (840 f, 1920 x 1080, 60 fps). Continues L04 and hands off to L06PicoLimits.
 *
 * Same world and camera as the end of L04 and the start of L06: the Analyze panel alone (camera A,
 * zoom 1.9), right column. The reading card from L04 gives way to the summary card. Panel scroll goes
 * 0 -> 380 so the paragraph and the Explain more button come into view. The card then opens and the
 * scroll follows the sections down to 800. It stays open, and the scroll ends at 1100, which is where
 * L06 opens (the end of the expanded card at the top of the panel, PICO below).
 *
 * Beats (frames):
 *   0-24     reading card fades out; the summary card rises in at its place (12-36).
 *   36-137   one sentence streams in (1 character per frame).
 *   150-180  short paragraph appears.
 *   170-220  panel scrolls 0 -> 380; caption "One sentence. Then a short summary." (40-220).
 *   230-252  Explain more button appears.
 *   250      cursor enters from the lower right.
 *   340      cursor glides to the button; clicks at 420.
 *   430-640  the card grows (Explain more open) and the scroll follows it, 380 -> 800; caption "Explain
 *            more gives you about three times the detail." (470-640).
 *   436-636  the three labelled sections stream in (2.5 characters per frame).
 *   780-830  scroll 800 -> 1100 (matches L06's opening frame).
 *   830-840  hold.
 *
 * Button positions are estimated from the card layout and checked on the stills.
 */

const T = {
  reading: 0, readingOut: 24, card: 12, cardDur: 24,
  sentence: 36, sentenceCps: 1,
  para: 150, paraDur: 30,
  scroll1: 170, scroll1Dur: 50,
  button: 230, buttonDur: 22,
  cursorIn: 250, cursorArrive: 340, click: 420,
  open: 430, openDur: 50,
  explainChars: 436, explainCps: 2.5,
  scroll2: 430, scroll2Dur: 210,
  scroll3: 780, scroll3Dur: 50,
  cap1: 40, cap1Out: 220, cap2: 470, cap2Out: 640,
  cursorOut: 780,
} as const;

const SCROLL_START = 0;
const SCROLL_BUTTON = 380;
const SCROLL_EXPLAIN = 800;
// Where L06 opens: the end of the expanded card at the top of the panel, PICO below it.
const SCROLL_HANDOFF = 1100;

// Screen px of the Explain more button in camera A (estimated).
const BTN_SCREEN = { x: 1412, y: 844 };

const CURSOR_KEYS: CursorKey[] = [
  { at: T.cursorIn, x: 1700, y: 880 },
  { at: T.cursorArrive, x: BTN_SCREEN.x, y: BTN_SCREEN.y, dur: 60 },
  { at: T.click, x: BTN_SCREEN.x, y: BTN_SCREEN.y, click: true, dur: 6 },
];

const L05Summary: React.FC = () => {
  const frame = useCurrentFrame();

  // Reading card -> summary card
  const readingP = 1 - progress(frame, T.reading, T.readingOut, EASE_IN_OUT);
  const cardP = progress(frame, T.card, T.cardDur, EASE_OUT);

  // Summary content
  const oneChars = Math.max(0, Math.floor((frame - T.sentence) / T.sentenceCps));
  const para = progress(frame, T.para, T.paraDur, EASE_OUT);
  const button = progress(frame, T.button, T.buttonDur, EASE_OUT);

  // Explain more: open from the click and stays open into L06
  const pressed = pressCurve(frame, T.click);
  const expanded = frame >= T.click;
  const explain = progress(frame, T.open, T.openDur, EASE_OUT);
  const explainChars = Math.max(0, Math.floor((frame - T.explainChars) * T.explainCps));

  // Panel scroll
  const scroll = (() => {
    if (frame < T.scroll1) return SCROLL_START;
    if (frame < T.scroll1 + T.scroll1Dur) return mix(progress(frame, T.scroll1, T.scroll1Dur, EASE_IN_OUT), SCROLL_START, SCROLL_BUTTON);
    if (frame < T.scroll2) return SCROLL_BUTTON;
    if (frame < T.scroll2 + T.scroll2Dur) return mix(progress(frame, T.scroll2, T.scroll2Dur, EASE_IN_OUT), SCROLL_BUTTON, SCROLL_EXPLAIN);
    if (frame < T.scroll3) return SCROLL_EXPLAIN;
    return mix(progress(frame, T.scroll3, T.scroll3Dur, EASE_IN_OUT), SCROLL_EXPLAIN, SCROLL_HANDOFF);
  })();

  return (
    <SceneShell enter="none" exit="none" drift={1}>
      <Camera keys={[{ at: 0, ...CAM_A }]}>
        <div style={{ position: 'absolute', left: SLOT.x, top: SLOT.y, width: DOCK.w, height: PANEL.h * DOCK.zoom }}>
          <PanelFrame section="Analyze" width={PANEL.w} height={PANEL.h} zoom={DOCK.zoom} scrollY={scroll} chrome={false}
            style={panelFloatStyle(1)}>
            <div><AnalyzeHeader /></div>
            <div className="hl-stack hl-an">
              <div><AnalyzeFacts /></div>
              <div className="hl-stack" style={{ position: 'relative' }}>
                {readingP > 0.001 ? (
                  <div style={{ position: 'absolute', left: 0, right: 0, top: 0, opacity: readingP }}>
                    <ReadingCard />
                  </div>
                ) : null}
                {cardP > 0.001 ? (
                  <div style={{ opacity: cardP, transform: `translateY(${(1 - cardP) * 12}px)` }}>
                    <SummaryCard
                      oneChars={oneChars}
                      para={para}
                      button={button}
                      pressed={pressed}
                      expanded={expanded}
                      explain={explain}
                      explainChars={explainChars}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </PanelFrame>
        </div>
      </Camera>

      <SideCaption lines={['One sentence.', 'Then a short summary.']} accent={['short']}
        at={T.cap1} exitAt={T.cap1Out} />
      <SideCaption lines={['Explain more gives you', 'about three times the detail.']}
        at={T.cap2} exitAt={T.cap2Out} />

      <Cursor keys={CURSOR_KEYS} size={40} appearAt={T.cursorIn} hideAt={T.cursorOut} />
    </SceneShell>
  );
};

export default L05Summary;
