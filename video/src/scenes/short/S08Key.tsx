import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { ShortCaption } from '../../motion/Captions';
import { EASE_IN, EASE_IN_OUT, EASE_OUT, lin, mix, progress } from '../../motion/ease';
import { SceneShell } from '../../motion/Scene';
import { PanelFrame } from '../../ui/Panel';
import { Cursor } from '../../ui/Cursor';
import { AiConnectBox, GEMINI_KEY_LENGTH, aiConnectGeometry } from '../../ui/screens/AiKey';

/**
 * S08Key (270 f, 1080 × 1920). Caption "Bring a free AI key." + sub. The side panel (section null: app bar
 * only, as on the Settings page) at zoom 2.25, 400 × 416 CSS px at (90, 560) → 900 × 936 px, bottom 1496.
 * Inside: the product's AiConnectBox card ("Plug in your AI API key" + "Get your AI API key").
 *
 *   10–40   panel rises in            36–66  the two key links land (Gemini · Free · Recommended, OpenRouter · Free)
 *   68–112  teal tint on the Gemini link (the product's attention effect)
 *   96      click the key field → 100–112 masked dots fill (paste) → 116–136 "Recognized: Google Gemini"
 *   148     click Connect → 152–172 "Checking your key…" (static clock) → 182–200 "Connected to Google Gemini"
 *   200–240 hold on the connected chip (the cursor has moved aside and fades out at 214)
 *   236–270 caption and panel leave; the scene ends on clean paper for S09's navy plate.
 * The panel body scrolls 6 CSS px while the status line expands, so both links stay fully visible.
 * Cursor targets come from aiConnectGeometry() with the same recognized/status values as the box.
 */

const PX = 90;          // panel left (screen px)
const PY = 560;         // panel top
const Z = 2.25;
const PANEL_H = 416;    // CSS px → 936 px
const BOX_X = 1 + 16;   // panel border + body padding (CSS px)
const BOX_Y = 1 + 48 + 16; // panel border + app bar (no tabs) + body padding

const CLICK_FIELD = 96;
const CLICK_CONNECT = 148;
const CONNECTED_AT = 182;
const EXIT_AT = 240;

/** Box-local CSS px → screen px (before the camera), at panel scroll `s`. */
const toScreen = (x: number, y: number, s: number) => ({ x: PX + Z * (BOX_X + x), y: PY + Z * (BOX_Y + y - s) });

const STILL_CSS = '.hlv-s08,.hlv-s08 *{transition:none!important;animation:none!important}';

const S08Key: React.FC = () => {
  const f = useCurrentFrame();

  // Box state, all pure functions of the frame.
  const links = lin(f, [36, 66], [0, 2]);
  const highlight = progress(f, 68, 12) * (1 - progress(f, 82, 30, EASE_IN_OUT));
  const focused = progress(f, CLICK_FIELD - 1, 5) * (1 - progress(f, CLICK_CONNECT - 2, 8));
  const chars = lin(f, [CLICK_FIELD + 4, CLICK_FIELD + 16], [0, GEMINI_KEY_LENGTH]);
  const recognized = progress(f, CLICK_FIELD + 20, 20);
  const hover = progress(f, CLICK_CONNECT - 12, 10) * (1 - progress(f, CLICK_CONNECT + 10, 10));
  const pressed = lin(f, [CLICK_CONNECT - 2, CLICK_CONNECT + 2], [0, 1]) * (1 - lin(f, [CLICK_CONNECT + 6, CLICK_CONNECT + 14], [0, 1]));
  const busy = f >= CLICK_CONNECT + 1 && f < CONNECTED_AT + 4;
  const status = progress(f, CLICK_CONNECT + 4, 20);
  const connected = progress(f, CONNECTED_AT, 18);
  const scrollY = 6 * progress(f, CLICK_CONNECT + 6, 24, EASE_IN_OUT);

  // Cursor targets (exact: same expansion values as the box at the moment of each click).
  const gField = aiConnectGeometry({ recognized: 0, status: 0 });
  const gConnect = aiConnectGeometry({ recognized: 1, status: 0 });
  const field = toScreen(gField.input.x + gField.input.w - 46, gField.input.cy, 0); // right end: the dots fill to its left
  const connect = toScreen(gConnect.connect.cx, gConnect.connect.cy, 0);

  // Panel entrance / exit and a slow push-in anchored on the UI band's centre.
  const pin = progress(f, 10, 30, EASE_OUT);
  const pout = progress(f, EXIT_AT, 16, EASE_IN);
  const push = mix(progress(f, 20, EXIT_AT - 20, EASE_IN_OUT), 1, 1.03);

  return (
    <SceneShell enter="none" exit="none" drift={1}>
      <style>{STILL_CSS}</style>
      <AbsoluteFill style={{ transform: `scale(${push.toFixed(5)})`, transformOrigin: '540px 1030px' }}>
        <div
          className="hlv-s08"
          style={{
            position: 'absolute', left: PX, top: PY,
            opacity: pin * (1 - pout),
            transform: `translateY(${(mix(pin, 60, 0) - pout * 56).toFixed(2)}px)`,
          }}
        >
          <PanelFrame section={null} width={400} height={PANEL_H} zoom={Z} scrollY={scrollY}>
            <AiConnectBox
              state="empty"
              chars={chars}
              focused={focused}
              recognized={recognized}
              hover={hover}
              pressed={pressed}
              busy={busy}
              status={status}
              connected={connected}
              links={links}
              highlightIndex={0}
              highlight={highlight}
            />
          </PanelFrame>
        </div>
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - pout }}>
          <Cursor
            appearAt={72}
            hideAt={214}
            keys={[
              { at: 72, x: 880, y: 1330 },
              { at: CLICK_FIELD, x: field.x, y: field.y, click: true, dur: 24 },
              { at: CLICK_CONNECT, x: connect.x, y: connect.y, click: true, dur: 28 },
              { at: CONNECTED_AT + 2, x: 700, y: 1070, dur: 28 },
            ]}
          />
        </div>
      </AbsoluteFill>
      <ShortCaption
        lines={['Bring a free AI key.']}
        accent={['free']}
        at={6}
        sub="From Google or OpenRouter. It stays in your browser."
        subAt={26}
        exitAt={EXIT_AT - 4}
      />
    </SceneShell>
  );
};

export default S08Key;
