import React from 'react';
import { useCurrentFrame } from 'remotion';
import { C, FONT } from '../../brand/colors';
import { ANALYSIS } from '../../data/demo';
import { ShortCaption } from '../../motion/Captions';
import { EASE_IN, EASE_OUT, lin, mix, progress } from '../../motion/ease';
import { Camera, SceneShell } from '../../motion/Scene';
import type { CamKey } from '../../motion/Scene';
import { Cursor } from '../../ui/Cursor';
import type { CursorKey } from '../../ui/Cursor';
import { CURSOR_SIZE, PANEL, PUSH_S04, REST, ShortPanel, Y, by, glide, press, ramp, tip } from './S04Analyze';
import type { StackState } from './S04Analyze';
import { S05_END, limitsEndState } from './S05Limits';

/* ==========================================================================================
 * S06Chat (270 f, 4.5 s). Continues S05's last frame (scroll 1475, push 1.04, both first rows open).
 *
 *   0    push released + glide down to "Anything else?" (scroll 1475 -> 2066, 44 f); the button rises 22
 *   8    caption "Ask anything else."                                  exit 252
 *   30   cursor enters from below, settles on the teal button (58), clicks (62)
 *   64   the chat area opens below it (32 f): suggestion chips (74 / 82), the field takes focus (80)
 *   96   the question types itself into the field (40 cps, to 150)
 *   150  keycaps "Ctrl + Enter" appear in the field's corner, press (158), leave with the field
 *   162  sent: the question moves into the log (log grows 28 f, the field slides down out of view),
 *        "Writing…" until 190, then the answer streams with its section reference (190-244)
 *   196  caption sub "Answers come from this article’s text."
 *   216  slow push 1.00 -> 1.04; the scene fades to paper (256-270) into S07
 *
 * Geometry (scene px, camera at rest), scroll 2066, visible body [2050, 2382]:
 *   "Anything else?" button y_b 2073.5-2121.5 -> 804-912 (centre 858, x 126..954)
 *   chat area, before sending: chips 2133.5-2189.9 (940-1067), label 2201.9, textarea 2228.2-2324.2
 *   (1152-1368; typed line 1170-1224), Ask row 2336.2-2376.2 (1395-1485); the small print starts at
 *   2388.2, just under the panel's edge.
 *   after sending (log 156.8 tall): question 2133.5 (939-993, 34 px type), answer 2169.5-2278.3
 *   (1020-1265, 4 lines of 38 px serif), chips 2290.3-2346.7 (1292-1419), field label 2358.7-2379
 *   (1446-1491); the textarea starts below the edge.
 * ========================================================================================== */

const S_ASK = 2066;
const ASK_TOP = Y.ask + Y.limOpen + Y.biasOpen;          // 2073.5 with both first rows open
const BTN = { x: 560, y: by(ASK_TOP + 24, S_ASK) };       // just right of the label's centre
const CLICK = 62;

const Q_LEN = ANALYSIS.chat.question.length;
const A_LEN = ANALYSIS.chat.answer.length;
const LOG_H = 156.8;                                       // CSS px the answered log adds

const KEYS: CursorKey[] = [
  { at: 0, x: 700, y: 1590 },
  { at: 54, ...tip(BTN.x + 8, BTN.y + 10), dur: 24 },
  { at: 58, ...tip(BTN.x, BTN.y), dur: 4 },
  { at: CLICK, ...tip(BTN.x, BTN.y), dur: 4, click: true },
];

// Keycaps sit in the textarea's lower-right corner (textarea inner right edge ~925, bottom 1368).
const CAPS_RIGHT = 1080 - 912;
const CAPS_TOP = by(2324.2, S_ASK) - 18 - 58;            // 58 px caps, 18 px above the field's bottom

const Key: React.FC<{ label: string; down: number }> = ({ label, down }) => (
  <span
    style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 58, minWidth: 58, padding: '0 20px',
      borderRadius: 10, background: C.white, border: `2px solid ${C.hair}`, boxShadow: `0 ${mix(down, 4, 1)}px 0 ${C.hair}`,
      transform: `translateY(${mix(down, 0, 3)}px)`, fontFamily: FONT.sans, fontWeight: 600, fontSize: 30, lineHeight: 1, color: C.navy,
    }}
  >
    {label}
  </span>
);

const S06Chat: React.FC = () => {
  const frame = useCurrentFrame();

  const scrollY = glide(frame, S05_END.scrollY, [{ at: 0, to: S_ASK, dur: 44 }]);
  const sent = progress(frame, 162, 28, EASE_OUT);

  const base = limitsEndState();
  const state: StackState = {
    ...base,
    sections: 4 + ramp(frame, [22], 20),
    ask: {
      open: progress(frame, 64, 32, EASE_OUT),
      pressed: press(frame, CLICK),
      chips: ramp(frame, [74, 82], 16),
      focused: frame >= 80,
      typed: lin(frame, [96, 150], [0, Q_LEN]),
      sent,
      answerChars: lin(frame, [190, 244], [0, A_LEN]),
    },
  };

  // Ctrl + Enter
  const capsIn = progress(frame, 150, 10);
  const capsDown = progress(frame, 157, 2) * (1 - progress(frame, 163, 5));
  const capsOut = progress(frame, 162, 12, EASE_IN);
  const capsShift = sent * LOG_H * PANEL.zoom;             // ride down with the field as the log opens

  const cam: CamKey[] = [
    { ...S05_END.cam, at: 0 },
    { ...REST, at: 0 },
    { ...PUSH_S04, at: 216 },
  ];

  return (
    <SceneShell enter="none" exit="fade" exitDur={14} drift={1}>
      <Camera keys={cam} dur={44}>
        <ShortPanel scrollY={scrollY} state={state} />
        {capsIn * (1 - capsOut) > 0.001 ? (
          <div
            style={{
              position: 'absolute', right: CAPS_RIGHT, top: CAPS_TOP, display: 'flex', alignItems: 'center', gap: 12,
              opacity: capsIn * (1 - capsOut), transform: `translateY(${mix(capsIn, 10, 0) + capsShift}px)`,
            }}
          >
            <Key label="Ctrl" down={capsDown} />
            <span style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: 30, color: C.slate }}>+</span>
            <Key label="Enter" down={capsDown} />
          </div>
        ) : null}
        <Cursor keys={KEYS} size={CURSOR_SIZE} appearAt={30} hideAt={72} />
      </Camera>

      <ShortCaption lines={['Ask anything else.']} at={8} exitAt={252} accent={['anything']}
        sub="Answers come from this article’s text." subAt={196} />
    </SceneShell>
  );
};

export default S06Chat;
