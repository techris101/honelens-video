import React from 'react';
import { useCurrentFrame } from 'remotion';
import { ANALYSIS } from '../../data/demo';
import { LongCaption } from '../../motion/Captions';
import { EASE_IN_OUT, inOut, lin, mix, progress } from '../../motion/ease';
import { SceneShell } from '../../motion/Scene';
import { SoftLine } from '../../motion/Text';
import { Cursor, CursorKey } from '../../ui/Cursor';
import { PanelFrame } from '../../ui/Panel';
import { AnalyzeFooter, AskBox, ItemList } from '../../ui/screens/Analyze';

/**
 * L07Chat (540 f, 1920 x 1080, 60 fps). Same shot as the end of L06: the Analyze panel alone at
 * zoom 1.9 (400 x 480 CSS px -> 760 x 912 px at x 1040-1800, y 84-996), caption in the left column
 * (x 140, kicker at y 440). Next scene is the chapter card "Check every source".
 *
 * Panel body (CSS px, y = 0 at the top of "Anything else?"; Biases and conflicts are anchored just
 * above it, as at the end of L06). Measured from the Plex font metrics:
 *   button 0-48 · chat area opens below it: suggestion chips 60-116 (two rows) · field 128-251
 *   (textarea 154-251) · Ask / Clear row 263-303 (Ask 0-82 wide) · note 315-355.
 *   Once sent, the log (question 60-84, answer 96-205) opens above the chips and adds ~157.
 * Screen mapping: x = 1040 + 1.9 * (16 + x_body), y = 84 + 1.9 * (100 + y_body - scrollY).
 *
 * Beats (frames):
 *   12        caption "Anything else? Ask." (stays; the scene's exit fades it).
 *   36-90     cursor in, clicks "Anything else?" at 90.
 *   96-132    chat area opens; 98-148 the panel scrolls -190 -> 0; chips land 124 / 136.
 *   160-268   the question types into the field (20 characters per second).
 *   296       cursor clicks Ask; 302-332 the question moves into the log; "Writing…" until 330.
 *   330-470   the answer streams in with its section reference (Methods, Intervention).
 *   372       serif note "Answers come from this article’s text." under the caption. Hold to 528.
 */

const PA = { x: 1040, y: 84 };
const Z = 1.9;
const PANEL = { w: 400, h: 480 } as const;
const sx = (xb: number) => PA.x + Z * (16 + xb);
const sy = (yb: number, scroll: number) => PA.y + Z * (100 + yb - scroll);

const S_START = -190; // biases tail above, "Anything else?" in the lower half of the view
const S_OPEN = 0;     // the whole chat area in view

const T = {
  cap: 12, cursorIn: 36, btnArrive: 86, btnClick: 90, open: 96, scroll: 98,
  chips: 124, chipStep: 12, type: 160, typeCps: 20,
  askArrive: 292, askClick: 296, sent: 302, answer: 330, answerCps: 60, cursorOut: 318, note: 372,
} as const;

const BTN_PT = { x: sx(200), y: sy(24, S_START) };   // on the "Anything else?" label
const ASK_PT = { x: sx(41), y: sy(283, S_OPEN) };     // centre of the Ask button
const REST_PT = { x: 1730, y: 800 };                  // empty space right of "Clear the conversation"

const CURSOR_KEYS: CursorKey[] = [
  { at: 0, x: 1560, y: 960 },
  { at: T.btnArrive, x: BTN_PT.x, y: BTN_PT.y, dur: 46 },
  { at: T.btnClick, x: BTN_PT.x, y: BTN_PT.y, click: true, dur: 4 },
  { at: 156, x: REST_PT.x, y: REST_PT.y, dur: 48 },
  { at: T.askArrive, x: ASK_PT.x, y: ASK_PT.y, dur: 34 },
  { at: T.askClick, x: ASK_PT.x, y: ASK_PT.y, click: true, dur: 4 },
];

const press = (frame: number, c: number) => inOut(frame, c, 3, c + 6, 5);

const L07Chat: React.FC = () => {
  const frame = useCurrentFrame();

  const scroll = mix(progress(frame, T.scroll, 50, EASE_IN_OUT), S_START, S_OPEN);
  const open = progress(frame, T.open, 36, EASE_IN_OUT);
  const chips = lin(frame, [T.chips, T.chips + 2 * T.chipStep], [0, 2]);
  const typed = ((frame - T.type) / 60) * T.typeCps;
  const sent = progress(frame, T.sent, 30, EASE_IN_OUT);
  const answerChars = ((frame - T.answer) / 60) * T.answerCps;

  return (
    <SceneShell drift={1.01}>
      <div style={{ position: 'absolute', left: PA.x, top: PA.y }}>
        <PanelFrame section="Analyze" width={PANEL.w} height={PANEL.h} zoom={Z} scrollY={scroll}>
          <div className="hl-stack hl-an">
            <div style={{ position: 'relative' }}>
              {/* Biases and conflicts (as left at the end of L06) sit directly above */}
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: '100%', paddingBottom: 12 }}>
                <ItemList kind="biases" />
              </div>
              <div className="hl-stack">
                <AskBox
                  open={open} pressed={press(frame, T.btnClick)}
                  question={ANALYSIS.chat.question} typed={typed}
                  askPressed={press(frame, T.askClick)} sent={sent}
                  answer={ANALYSIS.chat.answer} answerChars={answerChars}
                  suggestions={ANALYSIS.chat.suggestions} chips={chips}
                />
                <AnalyzeFooter />
              </div>
            </div>
          </div>
        </PanelFrame>
      </div>

      <LongCaption kicker="Your questions" title="Anything else? Ask." accent={['Ask']}
        at={T.cap} x={140} y={440} width={800} />
      <SoftLine at={T.note} style={{ position: 'absolute', left: 140, top: 572, width: 800, fontSize: 30, lineHeight: 1.4 }}>
        Answers come from this article’s text.
      </SoftLine>

      <Cursor keys={CURSOR_KEYS} size={40} appearAt={T.cursorIn} hideAt={T.cursorOut} />
    </SceneShell>
  );
};

export default L07Chat;
