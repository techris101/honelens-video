import React from 'react';
import { AbsoluteFill, interpolateColors, useCurrentFrame } from 'remotion';
import { C, FONT } from '../../brand/colors';
import { ARTICLE, KEYS } from '../../data/demo';
import { EASE_IN, EASE_IN_OUT, lin, mix, progress } from '../../motion/ease';
import { SceneShell } from '../../motion/Scene';
import { WordsRise } from '../../motion/Text';
import { BrowserFrame } from '../../ui/Browser';
import { Cursor } from '../../ui/Cursor';
import { Icon } from '../../ui/Icon';
import { PanelFrame, ScreenHeader } from '../../ui/Panel';
import { AnalyzeFacts, AnalyzeHeader } from '../../ui/screens/Analyze';
import {
  GEMINI_KEY_LENGTH, ProviderKeyPage, SettingsAiScreen, providerKeyGeometry, settingsAiGeometry,
} from '../../ui/screens/AiKey';

/**
 * L16KeyGuide (1830 f, 30.5 s, 1920 x 1080). The API-key guide, for a student who has never seen an
 * API key. A persistent step indicator sits top-left (x 120, y 56: mono "Step N of 3" + three 64 x 4
 * bars; done = navy, current = teal, next = hairline; it echoes the chapter rail of L03Ch1).
 *
 * Shots (each enters and leaves on its own, never overlapping):
 *   Panel shots (steps 1 and 3): the side panel alone, PanelFrame 400 x 505 CSS px at zoom 1.9
 *   (764 x 963 px at x 1036–1800, y 56–1019). Smallest product text (12 px tags) = 22.8 px.
 *   Caption column left: x 120, top 420, width 840, title 60 px (two forced lines), serif sub 30 px.
 *   Browser shot (step 2): BrowserFrame 1680 x 816 at (120, 224), chrome scale 1.7 (URL 22 px), content
 *   1680 x 662 px. ProviderKeyPage design width 1140 at zoom 1.474 (15 px design text = 22.1 px),
 *   design height 449 so its dialog centres in the visible area. Caption one line at the top
 *   (x 120, y 116) with the sub inline to its right. A two-tab strip is drawn over the browser's own tab.
 *
 * Timeline
 *   Step 1 (0–414)   Analyze tab -> cursor clicks the gear 108 -> Settings index 120 -> clicks "AI" 172 ->
 *                    Settings › AI 184 (scrollY 0) -> scroll to 140 (246–286) -> teal-tint attention on the
 *                    Gemini link 296–360 -> click "Get Google Gemini key" 354 -> panel leaves 392–412.
 *                    Caption 16–392.
 *   Step 2 (430–1092) indicator 430. Browser rises 440. "Create API key" clicked 642 -> dialog 648–672
 *                    (masked key, Copy) -> Copy clicked 884 -> "Copied" 888–904. Browser leaves 1068–1090.
 *                    Captions 452–736 and 740–1078.
 *   Step 3 (1100–1680) indicator 1100. Panel returns at scrollY 140 (empty key box). Field clicked 1226,
 *                    pasted as 39 dots 1262, "Recognized: Google Gemini" 1278–1302, Connect clicked 1366,
 *                    static clock + "Checking your key…" 1372–1470, "Connected to Google Gemini" 1470–1490.
 *                    Caption 1120–1678.
 *   Close (1680–1830) caption "Prefer OpenRouter? Same three steps." 1684; teal tint on the OpenRouter link
 *                    1704–1800. Scene fades 1818.
 * Cursor targets come from settingsAiGeometry() / providerKeyGeometry(), mapped through each shot's
 * zoom and origin (PanelFrame and BrowserFrame both have a 1 px border).
 */

// ---------------------------------------------------------------- geometry

const PANEL = { left: 1036, top: 56, zoom: 1.9, w: 400, h: 505 } as const;
const SCROLL_AI = 140;
/** Screen point for panel CSS px (x, y) with the body scrolled by s (use s = 0 for the app bar). */
const pAt = (x: number, y: number, s = 0) => ({ x: PANEL.left + PANEL.zoom * (1 + x), y: PANEL.top + PANEL.zoom * (1 + y - s) });
const PANEL_ORIGIN = `${PANEL.left + (PANEL.w * PANEL.zoom) / 2}px ${PANEL.top + (PANEL.h * PANEL.zoom) / 2}px`;

// App bar gear: row padding 8/8/0/16, 40 px icon button at the right => x 352–392, y 8–48.
const GEAR = pAt(372, 28);
// Settings index: header at 64 (title 1 or 2 lines) puts the "AI" row at 162.7–232.3 or 190.2–259.8;
// y 211 is inside it either way.
const AI_ROW = pAt(120, 211);

const G_IDLE = settingsAiGeometry({ tabs: false, lead: false });
const G_RECOG = settingsAiGeometry({ tabs: false, lead: false, recognized: 1 });
const GEMINI_LINK = pAt(G_IDLE.links[0].cx, G_IDLE.links[0].cy, SCROLL_AI);
const LINK_REST = pAt(300, 470, SCROLL_AI);
// Click the right end of the key field so the cursor never covers the dots (39 dots end near x 306).
const KEY_FIELD = pAt(G_IDLE.input.x + G_IDLE.input.w - 27, G_IDLE.input.cy, SCROLL_AI);
const CONNECT = pAt(G_RECOG.connect.cx, G_RECOG.connect.cy, SCROLL_AI);

const BR = { left: 120, top: 224, w: 1680, h: 816, scale: 1.7 } as const;
const BAR_H = 44 * BR.scale;
const ADDR_H = 46 * BR.scale;
const CONTENT = { left: BR.left + 1, top: BR.top + 1 + BAR_H + ADDR_H + 1, w: BR.w, h: BR.h - BAR_H - ADDR_H - 1 };
const PK_W = 1140;
const PK_Z = CONTENT.w / PK_W;
const PK_H = CONTENT.h / PK_Z;
const PK = providerKeyGeometry(PK_W, PK_H);
const kAt = (x: number, y: number) => ({ x: CONTENT.left + PK_Z * x, y: CONTENT.top + PK_Z * y });
const CREATE = kAt(PK.createButton.cx, PK.createButton.cy);
const COPY = kAt(PK.copyButton.cx, PK.copyButton.cy);
const BROWSER_ORIGIN = `${BR.left + BR.w / 2}px ${BR.top + BR.h / 2}px`;

// ---------------------------------------------------------------- timing

const T = {
  step2: 430, step3: 1100,
  // step 1
  p1Exit: 392,
  cap1: 16, cap1Out: 380,
  c1In: 52, gearAt: 98, gearClick: 108, aiAt: 160, aiClick: 172, c1Out: 196,
  analyzeOut: 110, indexIn: 120, indexOut: 174, aiIn: 184,
  scroll: 246, scrollDur: 40,
  tint1In: 296, tint1Out: 330,
  c2In: 300, linkAt: 344, linkClick: 354, c2Out: 380,
  // step 2
  bIn: 440, bOut: 1068,
  cap2: 452, cap2Out: 724, cap3: 740, cap3Out: 1066,
  c3In: 560, createAt: 630, createClick: 642, copyAt: 870, copyClick: 884, c3Out: 960,
  dialog: 648, created: 650, copied: 888,
  // step 3
  p3In: 1100,
  cap4: 1120, cap4Out: 1666,
  c4In: 1170, fieldAt: 1214, fieldClick: 1226, connectAt: 1352, connectClick: 1366, c4Out: 1490,
  paste: 1262, recognized: 1278, status: 1372, connected: 1470,
  // close
  cap5: 1684, tint2In: 1704, tint2Out: 1770,
};

// ---------------------------------------------------------------- pieces

/** "Step N of 3" in mono with a rolling digit, and three bars that fill (done navy, current teal). */
const StepIndicator: React.FC = () => {
  const f = useCurrentFrame();
  const show = progress(f, 4, 22);
  const LH = 34;
  const roll = progress(f, T.step2, 22, EASE_IN_OUT) + progress(f, T.step3, 22, EASE_IN_OUT);
  const fill = [progress(f, 18, 30), progress(f, T.step2 + 6, 30), progress(f, T.step3 + 6, 30)];
  const done = [progress(f, T.step2, 20), progress(f, T.step3, 20), 0];
  return (
    <div style={{ position: 'absolute', left: 120, top: 56, display: 'flex', alignItems: 'center', gap: 24, opacity: show, transform: `translateY(${mix(show, 8, 0)}px)` }}>
      <div style={{ display: 'flex', fontFamily: FONT.mono, fontSize: 28, lineHeight: `${LH}px`, color: C.navy, whiteSpace: 'pre' }}>
        <span>Step </span>
        <span style={{ display: 'inline-block', height: LH, overflow: 'hidden', color: C.teal }}>
          <span style={{ display: 'block', transform: `translateY(${(-roll * LH).toFixed(3)}px)` }}>
            {['1', '2', '3'].map(d => <span key={d} style={{ display: 'block', height: LH }}>{d}</span>)}
          </span>
        </span>
        <span style={{ color: C.slate }}> of 3</span>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{ position: 'relative', display: 'block', width: 64, height: 4, borderRadius: 2, background: C.hair, overflow: 'hidden' }}>
            <span style={{
              position: 'absolute', inset: 0, background: interpolateColors(done[i], [0, 1], [C.teal, C.navy]),
              transform: `scaleX(${fill[i].toFixed(4)})`, transformOrigin: 'left center',
            }} />
          </span>
        ))}
      </div>
    </div>
  );
};

/** Big caption. 'column' sits beside the panel (forced lines, sub below); 'top' is one line with the sub inline. */
const Caption: React.FC<{
  lines: string[]; sub?: string; at: number; exitAt?: number; accent?: string[]; layout: 'column' | 'top';
}> = ({ lines, sub, at, exitAt, accent, layout }) => {
  const frame = useCurrentFrame();
  if (frame < at - 1 || (exitAt !== undefined && frame > exitAt + 14)) return null;
  const s = sub ? progress(frame, at + 18, 24) : 0;
  const e = exitAt === undefined ? 0 : progress(frame, exitAt, 12, EASE_IN);
  const title = (
    <WordsRise lines={lines} at={at + 4} exitAt={exitAt} exitDur={12} accent={accent} stagger={3} dur={26}
      style={{ fontSize: 60, lineHeight: 1.08, letterSpacing: '-0.022em' }} />
  );
  const subStyle: React.CSSProperties = {
    fontFamily: FONT.serif, fontSize: 30, lineHeight: 1.42, color: C.slate,
    opacity: s * (1 - e), transform: `translateY(${mix(s, 12, 0) - e * 8}px)`,
  };
  if (layout === 'top') {
    return (
      <div style={{ position: 'absolute', left: 120, top: 116, width: 1680, display: 'flex', alignItems: 'baseline', gap: 32 }}>
        {title}
        {sub ? <div style={{ ...subStyle, whiteSpace: 'nowrap' }}>{sub}</div> : null}
      </div>
    );
  }
  return (
    <div style={{ position: 'absolute', left: 120, top: 420, width: 840 }}>
      {title}
      {sub ? <div style={{ ...subStyle, marginTop: 20 }}>{sub}</div> : null}
    </div>
  );
};

/** Settings index (settings.js renderIndex): header, then one row per page with label, chevron and description. */
const SETTINGS_PAGES: Array<[string, string]> = [
  ['AI', 'Your AI key, model and the Analyze button.'],
  ['License', 'Activate Pro or manage this device.'],
  ['Network disclosure', 'Every outside request and what it sends.'],
  ['Backup and data', 'Export, import and delete your data.'],
  ['Activity log', 'A local record of actions in HoneLENS.'],
  ['Display', 'Theme, motion and transparency.'],
];
const SettingsIndex: React.FC<{ hover: number; press: number }> = ({ hover, press }) => (
  <>
    <ScreenHeader kicker="Settings" title="Your AI, license, data and display." />
    <nav className="hl-rows hl-settings__list" aria-label="Settings pages">
      {SETTINGS_PAGES.map(([label, desc], i) => (
        <a
          key={label}
          className="hl-row hl-row--action hl-settings__item"
          style={i === 0 ? { background: interpolateColors(press, [0, 1], [`rgba(243,245,246,${hover.toFixed(3)})`, 'rgba(234,237,239,1)']) } : undefined}
        >
          <span className="hl-row__label">{label}</span>
          <Icon name="chevron" size={16} />
          <span className="hl-row__detail hl-small">{desc}</span>
        </a>
      ))}
    </nav>
  </>
);

/** The browser's tab strip, redrawn over BrowserFrame's single tab: the article tab, then the new key tab. */
const TabStrip: React.FC = () => {
  const s = BR.scale;
  const tab = (title: string, active: boolean, icon: string) => (
    <div style={{
      width: 220 * s, height: BAR_H * 0.78, flex: 'none', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 8 * s,
      padding: `0 ${12 * s}px`, borderRadius: `${8 * s}px ${8 * s}px 0 0`, background: active ? C.white : 'transparent',
      fontFamily: FONT.sans, fontWeight: 600, fontSize: 12.5 * s, color: active ? C.navy : C.slate,
    }}>
      <span style={{ width: 14 * s, height: 14 * s, borderRadius: 3 * s, background: icon, flex: 'none', opacity: active ? 1 : 0.7 }} />
      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
    </div>
  );
  const left = 108; // just right of the three window dots (they end at 101.3 incl. the border)
  return (
    <div style={{
      position: 'absolute', left: 1 + left, top: 1, width: BR.w - left, height: BAR_H, background: '#EEEEE9',
      borderTopRightRadius: 14 * s * 0.7 - 1, display: 'flex', alignItems: 'flex-end', gap: 4 * s, paddingLeft: 127.5 - left, boxSizing: 'border-box',
    }}>
      {tab(ARTICLE.title, false, C.navy)}
      {tab('API keys', true, '#1F2A37')}
    </div>
  );
};

// ---------------------------------------------------------------- scene

const L16KeyGuide: React.FC = () => {
  const f = useCurrentFrame();

  // ---- Step 1: panel shot
  const p1In = progress(f, 0, 28);
  const p1Out = progress(f, T.p1Exit, 20, EASE_IN);
  const p1Push = mix(progress(f, 0, T.p1Exit, EASE_IN_OUT), 1, 1.012);
  const p1Screen: 'analyze' | 'index' | 'ai' = f < T.indexIn ? 'analyze' : f < T.aiIn ? 'index' : 'ai';
  const p1Scroll = SCROLL_AI * progress(f, T.scroll, T.scrollDur, EASE_IN_OUT);
  const p1Content =
    p1Screen === 'analyze' ? 1 - progress(f, T.analyzeOut, 10, EASE_IN)
      : p1Screen === 'index' ? progress(f, T.indexIn, 16) * (1 - progress(f, T.indexOut, 10, EASE_IN))
        : progress(f, T.aiIn, 16);
  const rowHover = progress(f, T.aiAt - 12, 12);
  const rowPress = progress(f, T.aiClick - 3, 5) - progress(f, T.aiClick + 4, 8);
  const linkTint = progress(f, T.tint1In, 12) * (1 - progress(f, T.tint1Out, 30));
  const linkPress = progress(f, T.linkClick - 3, 5) - progress(f, T.linkClick + 6, 8);

  // ---- Step 2: browser shot
  const bIn = progress(f, T.bIn, 30);
  const bOut = progress(f, T.bOut, 22, EASE_IN);
  const bPush = mix(progress(f, T.bIn, T.bOut - T.bIn, EASE_IN_OUT), 1, 1.012);
  const createHover = progress(f, T.createAt - 14, 14) * (1 - progress(f, T.createClick + 8, 10));
  const createPress = progress(f, T.createClick - 3, 5) - progress(f, T.createClick + 6, 8);
  const copyHover = progress(f, T.copyAt - 12, 12);
  const copyPress = progress(f, T.copyClick - 3, 5) - progress(f, T.copyClick + 6, 8);

  // ---- Step 3: panel shot again
  const p3In = progress(f, T.p3In, 30);
  const p3Push = mix(progress(f, T.p3In, 1830 - T.p3In, EASE_IN_OUT), 1, 1.012);
  const focused = progress(f, T.fieldClick, 8) * (1 - progress(f, T.connectClick, 8));
  const connectHover = progress(f, T.connectAt - 12, 12) * (1 - progress(f, T.connectClick + 14, 12));
  const connectPress = progress(f, T.connectClick - 3, 5) - progress(f, T.connectClick + 6, 8);
  const orTint = progress(f, T.tint2In, 12) * (1 - progress(f, T.tint2Out, 30));

  return (
    <SceneShell enter="fade" exit="fade" enterDur={14} exitDur={12} drift={1}>
      {/* Product CSS carries transitions; frames must never depend on wall-clock time. */}
      <style>{'.l16-root *{transition:none!important;animation:none!important}'}</style>
      <AbsoluteFill className="l16-root">

        {/* ---------------- Step 1 ---------------- */}
        {f < T.p1Exit + 22 ? (
          <AbsoluteFill style={{ opacity: p1In * (1 - p1Out), transform: `translate(${mix(p1In, 48, 0) + p1Out * 48}px, 0px) scale(${p1Push.toFixed(5)})`, transformOrigin: PANEL_ORIGIN }}>
            <div style={{ position: 'absolute', left: PANEL.left, top: PANEL.top }}>
              <PanelFrame section={p1Screen === 'analyze' ? 'Analyze' : null} width={PANEL.w} height={PANEL.h} zoom={PANEL.zoom} scrollY={p1Screen === 'ai' ? p1Scroll : 0}>
                <div style={{ display: 'grid', gap: 24, opacity: p1Content }}>
                  {p1Screen === 'analyze' ? (
                    <>
                      <div><AnalyzeHeader /></div>
                      <div className="hl-stack hl-an"><AnalyzeFacts /></div>
                    </>
                  ) : p1Screen === 'index' ? (
                    <SettingsIndex hover={rowHover} press={Math.max(0, rowPress)} />
                  ) : (
                    <SettingsAiScreen
                      lead={false} more={false}
                      box={{
                        state: 'empty',
                        highlightIndex: 0, highlight: linkTint,
                        hoverIndex: f >= T.linkAt - 8 ? 0 : null,
                        pressedIndex: f >= T.linkClick - 3 ? 0 : null, linkPress: Math.max(0, linkPress),
                      }}
                    />
                  )}
                </div>
              </PanelFrame>
            </div>
            <Cursor
              appearAt={T.c1In} hideAt={T.c1Out}
              keys={[
                { at: T.c1In, x: 1500, y: 560 },
                { at: T.gearAt, x: GEAR.x, y: GEAR.y, dur: 40 },
                { at: T.gearClick, x: GEAR.x, y: GEAR.y, dur: 4, click: true },
                { at: T.aiAt, x: AI_ROW.x, y: AI_ROW.y, dur: 40 },
                { at: T.aiClick, x: AI_ROW.x, y: AI_ROW.y, dur: 4, click: true },
              ]}
            />
            <Cursor
              appearAt={T.c2In} hideAt={T.c2Out}
              keys={[
                { at: T.c2In, x: LINK_REST.x, y: LINK_REST.y },
                { at: T.linkAt, x: GEMINI_LINK.x, y: GEMINI_LINK.y, dur: 36 },
                { at: T.linkClick, x: GEMINI_LINK.x, y: GEMINI_LINK.y, dur: 4, click: true },
              ]}
            />
          </AbsoluteFill>
        ) : null}

        {/* ---------------- Step 2 ---------------- */}
        {f >= T.bIn - 1 && f < T.bOut + 24 ? (
          <AbsoluteFill style={{ opacity: bIn * (1 - bOut), transform: `translate(0px, ${mix(bIn, 40, 0) + bOut * 30}px) scale(${bPush.toFixed(5)})`, transformOrigin: BROWSER_ORIGIN }}>
            <div style={{ position: 'absolute', left: BR.left, top: BR.top }}>
              <BrowserFrame width={BR.w} height={BR.h} url={KEYS.gemini.host} tabTitle="API keys" scale={BR.scale}>
                <ProviderKeyPage
                  variant="gemini" width={PK_W} height={PK_H} zoom={PK_Z}
                  hover={createHover} pressed={Math.max(0, createPress)}
                  created={progress(f, T.created, 18)} dialog={progress(f, T.dialog, 24)}
                  copyHover={copyHover} copyPressed={Math.max(0, copyPress)} copied={progress(f, T.copied, 16)}
                />
              </BrowserFrame>
              <TabStrip />
            </div>
            <Cursor
              appearAt={T.c3In} hideAt={T.c3Out}
              keys={[
                { at: T.c3In, x: 1140, y: 930 },
                { at: T.createAt, x: CREATE.x, y: CREATE.y, dur: 56 },
                { at: T.createClick, x: CREATE.x, y: CREATE.y, dur: 4, click: true },
                { at: T.copyAt, x: COPY.x, y: COPY.y, dur: 54 },
                { at: T.copyClick, x: COPY.x, y: COPY.y, dur: 4, click: true },
              ]}
            />
          </AbsoluteFill>
        ) : null}

        {/* ---------------- Step 3 and close ---------------- */}
        {f >= T.p3In - 1 ? (
          <AbsoluteFill style={{ opacity: p3In, transform: `translate(${mix(p3In, 48, 0)}px, 0px) scale(${p3Push.toFixed(5)})`, transformOrigin: PANEL_ORIGIN }}>
            <div style={{ position: 'absolute', left: PANEL.left, top: PANEL.top }}>
              <PanelFrame section={null} width={PANEL.w} height={PANEL.h} zoom={PANEL.zoom} scrollY={SCROLL_AI}>
                <SettingsAiScreen
                  lead={false} more={false}
                  box={{
                    state: 'empty',
                    chars: lin(f, [T.paste, T.paste + 2], [0, GEMINI_KEY_LENGTH]),
                    focused,
                    recognized: progress(f, T.recognized, 24),
                    hover: connectHover, pressed: Math.max(0, connectPress),
                    busy: f >= T.connectClick + 2 && f < T.connected,
                    status: progress(f, T.status, 24),
                    connected: progress(f, T.connected, 20),
                    highlightIndex: 1, highlight: orTint,
                  }}
                />
              </PanelFrame>
            </div>
            <Cursor
              appearAt={T.c4In} hideAt={T.c4Out}
              keys={[
                { at: T.c4In, x: 1560, y: 760 },
                { at: T.fieldAt, x: KEY_FIELD.x, y: KEY_FIELD.y, dur: 40 },
                { at: T.fieldClick, x: KEY_FIELD.x, y: KEY_FIELD.y, dur: 4, click: true },
                { at: T.connectAt, x: CONNECT.x, y: CONNECT.y, dur: 44 },
                { at: T.connectClick, x: CONNECT.x, y: CONNECT.y, dur: 4, click: true },
              ]}
            />
          </AbsoluteFill>
        ) : null}

        {/* ---------------- Captions and the step indicator (never move with the shots) ---------------- */}
        <Caption layout="column" lines={['Open Settings › AI and choose', 'Get Google Gemini key.']} accent={['Settings', '›', 'AI']}
          sub="The gear at the top of HoneLENS opens Settings." at={T.cap1} exitAt={T.cap1Out} />
        <Caption layout="top" lines={['Sign in with Google and create a key.']} accent={['create']}
          sub="It opens in a new tab." at={T.cap2} exitAt={T.cap2Out} />
        <Caption layout="top" lines={['Copy it.']} accent={['Copy']}
          sub="Your key works like a password, so keep it private." at={T.cap3} exitAt={T.cap3Out} />
        <Caption layout="column" lines={['Paste it into HoneLENS', 'and connect.']} accent={['connect']}
          sub="Click the key box, then paste with Ctrl+V (Cmd+V on a Mac)." at={T.cap4} exitAt={T.cap4Out} />
        <Caption layout="column" lines={['Prefer OpenRouter?', 'Same three steps.']} accent={['OpenRouter']}
          sub="Your key stays in your browser and is sent only to your provider." at={T.cap5} />
        <StepIndicator />
      </AbsoluteFill>
    </SceneShell>
  );
};

export default L16KeyGuide;
