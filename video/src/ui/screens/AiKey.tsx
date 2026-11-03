/**
 * The AI key flow, drawn with the product's own markup and CSS
 * (src/ui/ai-connect.js, src/modules/ai/providers.js GET_KEY_LINKS, src/sidepanel/screens/settings.js
 * pageAi + connectedCard, src/styles/screens/analyze.css "AI key box", settings.css).
 *
 * Everything here is PURE and PRESENTATIONAL: no useCurrentFrame. Every animated aspect is a numeric
 * prop; 0..1 props are used exactly as given (pass an eased value, e.g. progress(frame, at, 24)).
 *
 * Exports
 * - AiConnectBox      "Plug in your AI API key" card with "Get your AI API key" right under it.
 * - AiConnectedCard   the product's connected card (match chip, masked key, model, buttons).
 * - SettingsAiScreen  Settings › AI page (breadcrumb, header "AI / Your AI, your key.", lead, the card,
 *                     the AI and Analyze-button sections). Render inside PanelFrame.
 * - ProviderKeyPage   a generic, unbranded "API keys" page for the browser content area (1280 CSS px
 *                     design width, scaled with CSS zoom).
 * - HlSurface         minimal .hl-canvas wrapper to show AiConnectBox without the panel chrome.
 * - aiConnectGeometry / settingsAiGeometry / providerKeyGeometry: cursor targets (CSS px).
 *
 * Usage
 *   // Settings › AI inside the side panel (tabs hidden: Settings has no selected tab)
 *   <PanelFrame section={null} zoom={1.8} height={560} scrollY={sy}>
 *     <SettingsAiScreen lead={false} box={{ state: 'recognized', chars: 39, focused: 1, recognized: r }} />
 *   </PanelFrame>
 *
 *   // Just the card (short film), inside PanelFrame or a bare surface
 *   <HlSurface width={400} zoom={2.25}>
 *     <AiConnectBox state="checking" pressed={p} status={s} />
 *   </HlSurface>
 *
 *   // The provider's key page inside BrowserFrame's content area (W × H screen px)
 *   const z = W / 1280;
 *   <ProviderKeyPage variant="gemini" zoom={z} height={H / z} pressed={p} created={c} dialog={d}
 *     copyPressed={cp} copied={ok} />
 *
 * AiConnectBox states (each sets defaults; any numeric prop overrides it):
 *   empty      no dots, placeholder "Paste your key"
 *   typing     `chars` dots (default: a full 39-character key), focus ring on, steady caret
 *   recognized + "✓ Recognized: Google Gemini" (expands in; `recognized` 0..1)
 *   checking   Connect busy (teal-pressed), status line: static clock + "Checking your key…"
 *   connected  status line crossfades to the match chip "Connected to Google Gemini" (`connected` 0..1)
 * The recognized line and the status line EXPAND (grid 0fr → 1fr): everything below moves down
 * smoothly, by 24.3 px and 38 px respectively. Use aiConnectGeometry() to follow it with the cursor.
 *
 * Conventions: `links={1.4}` = first link fully in, second at 40 % (opacity + 12 px rise, EASE_OUT on
 * clamp(links - i, 0, 1)); hidden rows KEEP their layout space. No CSS transitions (inline
 * transition:none on every product control whose state changes). Never a spinner: busy = static clock.
 */
import React from 'react';
import { C, FONT } from '../../brand/colors';
import { EASE_OUT, mix } from '../../motion/ease';
import { KEYS } from '../../data/demo';
import { Chip, ScreenHeader } from '../Panel';
import { Icon } from '../Icon';
import '../css/honelens.css';

// ---------------------------------------------------------------- helpers

const clamp01 = (v: number) => (!(v > 0) ? 0 : v >= 1 ? 1 : v);
const rowIn = (n: number, i: number) => EASE_OUT(clamp01(n - i));
const fr = (v: number) => `${clamp01(v).toFixed(4)}fr`;

type RGB = [number, number, number];
const toRgb = (hex: string): RGB => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
/** Mix a base color through successive [color, amount] steps (amount 0..1), returned as rgb(). */
const tint = (base: string, ...steps: Array<[string, number]>) => {
  let c = toRgb(base);
  for (const [hex, t] of steps) {
    const k = clamp01(t);
    const d = toRgb(hex);
    c = [0, 1, 2].map(i => c[i] + (d[i] - c[i]) * k) as RGB;
  }
  return `rgb(${c.map(Math.round).join(',')})`;
};

const NO_T: React.CSSProperties = { transition: 'none' };
// Product state colors (honelens-tokens.css, light theme).
const TEAL_HOVER = '#1D6871';
const TEAL_PRESSED = '#1B626A';
const SURFACE_HOVER = '#F3F5F6';
const SURFACE_PRESSED = '#EAEDEF';

/** Height grows from 0 to its content (grid 0fr → 1fr, height linear in `open`), content fades in behind. */
const Collapse: React.FC<{ open: number; children: React.ReactNode }> = ({ open, children }) => (
  <div style={{ display: 'grid', gridTemplateRows: fr(open), opacity: clamp01((open - 0.15) / 0.85) }}>
    <div style={{ overflow: 'hidden', minHeight: 0 }}>{children}</div>
  </div>
);

// ---------------------------------------------------------------- copy (verbatim from the product)

export type AiProviderId = 'gemini' | 'openrouter';
const PROVIDER_LABEL: Record<AiProviderId, string> = { gemini: 'Google Gemini', openrouter: 'OpenRouter' };

const T = {
  label: 'Plug in your AI API key',
  placeholder: 'Paste your key',
  hint: 'HoneLENS recognizes Google Gemini, OpenRouter, OpenAI and Anthropic keys.',
  intro: 'Connect any AI provider with your own key. You keep full control of it, and you can remove it any time.',
  checking: 'Checking your key…',
  getKey: 'Get your AI API key',
  getKeyHelp: 'Sign in, create a key, copy it, and paste it above. It takes about a minute.',
  footer: 'Your key stays in this browser and is sent only to its provider. Free keys may let the provider use what you send to improve its services, so analyze published articles rather than private notes.',
  pageLead: 'Connect the AI provider you like with your own key. HoneLENS uses it to summarize articles, explain limitations and biases, answer your questions, compare papers and draft matrix cells.',
  aiOff: 'When AI is off, Analyze, Compare papers and Fill matrix with AI are hidden. Every other feature works the same.',
  fab: 'The button appears on research article pages of PubMed, PMC, Europe PMC and major journals. On other article sites, Analyze offers to add the button for that site.',
  plain: 'An API key is a password that lets HoneLENS use your AI account. It stays in this browser, is sent only to its provider, and is never part of a hone-pack backup.',
};

const GET_KEY_LINKS = [
  { label: KEYS.gemini.label, tag: KEYS.gemini.tag, recommended: true },
  { label: KEYS.openrouter.label, tag: KEYS.openrouter.tag, recommended: false },
];

/** A Gemini key is 39 characters ("AIza" + 35). The password field shows one dot per character. */
export const GEMINI_KEY_LENGTH = 39;
/** Last four characters used wherever the demo key is shown partly masked (maskKey(): first 4 + •••• + last 4). */
export const KEY_TAIL = { gemini: '7Qx4', openrouter: 'a91c' } as const;
export const maskedKeyShort = (p: AiProviderId = 'gemini') =>
  p === 'gemini' ? `AIza••••${KEY_TAIL.gemini}` : `sk-o••••${KEY_TAIL.openrouter}`;
const MAX_DOTS = 45; // 45 dots ≈ 300 px: the field shows its last 45 characters, like a scrolled input

// ---------------------------------------------------------------- AiConnectBox

export type AiConnectState = 'empty' | 'typing' | 'recognized' | 'checking' | 'connected';

export type AiConnectBoxProps = {
  state?: AiConnectState;
  provider?: AiProviderId;      // which key is pasted (default 'gemini')
  chars?: number;               // masked characters in the field (dots); default by state
  focused?: number;             // 0..1 field focus (teal border + 2 px focus ring + steady caret)
  recognized?: number;          // 0..1 "Recognized: …" line expanding in
  hover?: number;               // 0..1 Connect hover
  pressed?: number;             // 0..1 Connect press (scale .98, pressed teal, inset shadow)
  busy?: boolean;               // Connect busy look (default: state === 'checking')
  status?: number;              // 0..1 status line expanding in (default 1 for checking/connected)
  connected?: number;           // 0..1 crossfade "Checking your key…" → match chip "Connected to …"
  getKey?: number;              // 0..1 the "Get your AI API key" section entrance (default 1)
  links?: number;               // fractional reveal of the two links (default 2)
  hoverIndex?: number | null;   // link under the cursor (0 Gemini, 1 OpenRouter): 2 px underline
  pressedIndex?: number | null; // link being clicked
  linkPress?: number;           // 0..1 press amount for pressedIndex (default 1)
  highlightIndex?: number | null; // link row with the product's teal-tint attention fade
  highlight?: number;           // 0..1 strength of that tint
  intro?: boolean;              // the product's intro sentence at the top (Settings/onboarding; default false)
  footer?: boolean;             // the privacy sentence at the bottom (default false)
  heading?: string;             // Analyze-tab variant: "Connect your AI to read this article"
  card?: boolean;               // wrap in the product's .hl-card (default true)
  style?: React.CSSProperties;
};

type Resolved = { chars: number; focused: number; recognized: number; status: number; connected: number; busy: boolean };
const STATE_DEFAULTS: Record<AiConnectState, Resolved> = {
  empty: { chars: 0, focused: 0, recognized: 0, status: 0, connected: 0, busy: false },
  typing: { chars: GEMINI_KEY_LENGTH, focused: 1, recognized: 0, status: 0, connected: 0, busy: false },
  recognized: { chars: GEMINI_KEY_LENGTH, focused: 1, recognized: 1, status: 0, connected: 0, busy: false },
  checking: { chars: GEMINI_KEY_LENGTH, focused: 0, recognized: 1, status: 1, connected: 0, busy: true },
  connected: { chars: GEMINI_KEY_LENGTH, focused: 0, recognized: 1, status: 1, connected: 1, busy: false },
};

/** The password field: a div with the .hl-input box, one bullet per character (Chrome's mask glyph). */
const KeyField: React.FC<{ chars: number; focused: number }> = ({ chars, focused }) => {
  const n = Math.max(0, Math.floor(chars));
  const f = clamp01(focused);
  return (
    <div
      className="hl-input"
      style={{
        ...NO_T, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', overflow: 'hidden',
        borderColor: tint(C.field, [C.teal, f]),
        outline: f > 0 ? `2px solid rgba(31,111,120,${f.toFixed(3)})` : 'none', outlineOffset: 2,
      }}
    >
      {n > 0 ? <span style={{ color: C.navy }}>{'•'.repeat(Math.min(n, MAX_DOTS))}</span> : null}
      {/* Steady caret (never blinking); takes no width so nothing shifts when focus changes. */}
      <span style={{ display: 'inline-block', width: 1.5, height: 20, marginRight: -1.5, marginLeft: n > 0 ? 1 : 0, background: C.navy, opacity: f, flex: 'none' }} />
      {n === 0 ? <span style={{ color: C.slate }}>{T.placeholder}</span> : null}
    </div>
  );
};

const ConnectButton: React.FC<{ hover: number; pressed: number; busy: boolean }> = ({ hover, pressed, busy }) => {
  const h = clamp01(hover), p = clamp01(pressed);
  const bg = busy ? TEAL_PRESSED : tint(C.teal, [TEAL_HOVER, h], [TEAL_PRESSED, p]);
  return (
    <button
      type="button"
      className="hl-btn hl-btn--primary"
      aria-busy={busy ? 'true' : undefined}
      style={{
        ...NO_T, background: bg, color: C.white, cursor: 'default',
        transform: `translateY(${(-h * (1 - p)).toFixed(3)}px) scale(${(1 - 0.02 * p).toFixed(4)})`,
        boxShadow: p > 0 ? `inset 0 1px 2px rgba(24,50,74,${(0.18 * p).toFixed(3)})` : 'none',
      }}
    >
      <Icon name="arrow" size={16} />
      Connect
    </button>
  );
};

/** "Get your AI API key": exactly two links, as getKeyLinks() renders them. */
const GetKeyLinks: React.FC<{
  reveal: number; links: number; hoverIndex: number | null; pressedIndex: number | null; linkPress: number;
  highlightIndex: number | null; highlight: number;
}> = ({ reveal, links, hoverIndex, pressedIndex, linkPress, highlightIndex, highlight }) => {
  const g = clamp01(reveal);
  return (
    <section className="hl-ai-getkey" aria-label={T.getKey} style={{ opacity: g, transform: g < 1 ? `translateY(${mix(g, 12, 0)}px)` : undefined }}>
      <p className="hl-label" style={{ margin: 0 }}>{T.getKey}</p>
      <ul className="hl-ai-getkey__list">
        {GET_KEY_LINKS.map((l, i) => {
          const r = rowIn(links, i);
          const press = pressedIndex === i ? clamp01(linkPress) : 0;
          const hot = hoverIndex === i || press > 0;
          const tintA = highlightIndex === i ? clamp01(highlight) : 0;
          return (
            <li
              key={l.label}
              style={{
                // Constant negative margin + padding: the tint gets breathing room, the layout is unchanged.
                margin: '-4px -8px', padding: '4px 8px', borderRadius: 6,
                background: tintA > 0 ? `rgba(227,240,241,${tintA.toFixed(3)})` : 'transparent',
                opacity: r, transform: r < 1 ? `translateY(${mix(r, 12, 0)}px)` : undefined,
              }}
            >
              <a
                className="hl-link hl-ai-getkey__link"
                style={{
                  ...NO_T,
                  color: press > 0 ? tint(C.teal, [TEAL_PRESSED, press]) : C.teal,
                  textDecorationThickness: hot ? 2 : 1,
                  transform: press > 0 ? `scale(${(1 - 0.02 * press).toFixed(4)})` : undefined,
                  transformOrigin: '0% 50%',
                }}
              >
                {l.label}
                <Icon name="external" size={16} />
              </a>
              <span className="hl-ai-tag">{l.tag}</span>
              {l.recommended ? <span className="hl-ai-tag hl-ai-tag--quiet">Recommended</span> : null}
            </li>
          );
        })}
      </ul>
      <p className="hl-small" style={{ margin: 0 }}>{T.getKeyHelp}</p>
    </section>
  );
};

export const AiConnectBox: React.FC<AiConnectBoxProps> = props => {
  const {
    state = 'empty', provider = 'gemini', hover = 0, pressed = 0, getKey = 1, links = 2,
    hoverIndex = null, pressedIndex = null, linkPress = 1, highlightIndex = null, highlight = 0,
    intro = false, footer = false, heading, card = true, style,
  } = props;
  const d = STATE_DEFAULTS[state];
  const chars = props.chars ?? d.chars;
  const focused = props.focused ?? d.focused;
  const recognized = clamp01(props.recognized ?? d.recognized);
  const connected = clamp01(props.connected ?? d.connected);
  const status = Math.max(clamp01(props.status ?? d.status), connected);
  const busy = props.busy ?? d.busy;
  const label = PROVIDER_LABEL[provider];

  const body = (
    <div className="hl-stack hl-ai-connect">
      {intro ? <p className="hl-ai-lead" style={{ margin: 0 }}>{T.intro}</p> : null}

      {/* Field + recognized line share one grid item, so the line can grow from exactly 0 px. */}
      <div>
        <div className="hl-field">
          <label className="hl-label">{T.label}</label>
          <button type="button" className="hl-btn hl-btn--quiet hl-btn--sm hl-ai-show" aria-pressed="false" style={{ ...NO_T, cursor: 'default' }}>Show</button>
          <KeyField chars={chars} focused={focused} />
          <span className="hl-hint">{T.hint}</span>
        </div>
        <Collapse open={recognized}>
          {/* The product's line sits 8 px into the 12 px stack gap: 12 - 8 = 4. */}
          <div style={{ paddingTop: 4 }}>
            <p className="hl-small hl-ai-detected" role="status" style={{ margin: 0 }}>
              <Icon name="check" size={16} />
              {`Recognized: ${label}`}
            </p>
          </div>
        </Collapse>
      </div>

      {/* Connect + status line (checking → connected chip, crossfaded in one fixed 26 px slot). */}
      <div>
        <div style={{ display: 'flex' }}>
          <ConnectButton hover={hover} pressed={pressed} busy={busy} />
        </div>
        <Collapse open={status}>
          <div style={{ paddingTop: 12 }}>
            <div className="hl-ai-status" role="alert" style={{ display: 'grid', height: 26, alignItems: 'center' }}>
              <p className="hl-small" style={{ gridArea: '1 / 1', margin: 0, display: 'flex', alignItems: 'center', gap: 4, opacity: 1 - connected }}>
                <Icon name="clock" size={16} />
                {T.checking}
              </p>
              <div style={{ gridArea: '1 / 1', display: 'flex', opacity: connected, transform: connected < 1 ? `translateY(${mix(connected, 6, 0)}px)` : undefined }}>
                <Chip state="match">{`Connected to ${label}`}</Chip>
              </div>
            </div>
          </div>
        </Collapse>
      </div>

      <GetKeyLinks reveal={getKey} links={links} hoverIndex={hoverIndex} pressedIndex={pressedIndex}
        linkPress={linkPress} highlightIndex={highlightIndex} highlight={highlight} />

      {footer ? <p className="hl-small" style={{ margin: 0 }}>{T.footer}</p> : null}
    </div>
  );

  const inner = heading ? (
    <>
      <h2 className="hl-an-h">{heading}</h2>
      {body}
    </>
  ) : body;
  return card
    ? <section className="hl-card hl-stack" style={style}>{inner}</section>
    : <div className="hl-stack" style={style}>{inner}</div>;
};

// ---------------------------------------------------------------- AiConnectedCard

export type AiConnectedCardProps = {
  provider?: AiProviderId;
  checkedOn?: string;          // date shown after the key (default 'Oct 10, 2026', the demo's date)
  chip?: number;               // 0..1 entrance of the match chip (opacity + 6 px rise; default 1)
  rows?: number;               // fractional reveal of key line, model field, buttons (default 3)
  testHover?: number;          // 0..1 "Test connection" hover
  testPressed?: number;        // 0..1 "Test connection" press
  style?: React.CSSProperties;
};

/** settings.js connectedCard(): "Connected to …" (as the match chip), masked key, model, Test / Remove. */
export const AiConnectedCard: React.FC<AiConnectedCardProps> = ({
  provider = 'gemini', checkedOn = 'Oct 10, 2026', chip = 1, rows = 3, testHover = 0, testPressed = 0, style,
}) => {
  const c = clamp01(chip);
  const rs = (i: number): React.CSSProperties => {
    const r = rowIn(rows, i);
    return { opacity: r, transform: r < 1 ? `translateY(${mix(r, 12, 0)}px)` : undefined };
  };
  const th = clamp01(testHover), tp = clamp01(testPressed);
  return (
    <section className="hl-card hl-stack" aria-label="AI connection" style={style}>
      <h2 className="hl-settings__h" style={{ margin: 0 }}>
        <span style={{ display: 'flex', opacity: c, transform: c < 1 ? `translateY(${mix(c, 6, 0)}px)` : undefined }}>
          <Chip state="match">{`Connected to ${PROVIDER_LABEL[provider]}`}</Chip>
        </span>
      </h2>
      <p className="hl-small hl-num" style={{ margin: 0, ...rs(0) }}>{`Key ${maskedKeyShort(provider)} · checked ${checkedOn}`}</p>
      <div className="hl-stack" style={rs(1)}>
        <div className="hl-field">
          <label className="hl-label">Model</label>
          <span className="hl-select">
            <div className="hl-input" style={{ ...NO_T, paddingRight: 36, whiteSpace: 'nowrap' }}>Recommended (automatic)</div>
            <Icon name="chevron" size={16} />
          </span>
          <span className="hl-hint">Faster models answer sooner; larger ones go deeper.</span>
        </div>
      </div>
      <div className="hl-inline" style={rs(2)}>
        <button
          type="button" className="hl-btn hl-btn--secondary hl-btn--sm"
          style={{
            ...NO_T, cursor: 'default', background: tint(C.white, [SURFACE_HOVER, th], [SURFACE_PRESSED, tp]),
            transform: `translateY(${(-th * (1 - tp)).toFixed(3)}px) scale(${(1 - 0.02 * tp).toFixed(4)})`,
            boxShadow: tp > 0 ? `inset 0 1px 2px rgba(24,50,74,${(0.18 * tp).toFixed(3)})` : 'none',
          }}
        >
          <Icon name="retry" size={16} />
          Test connection
        </button>
        <button type="button" className="hl-btn hl-btn--quiet hl-btn--sm" style={{ ...NO_T, cursor: 'default' }}>Remove key</button>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------- SettingsAiScreen

/** kit.js toggle(): always "On" in the film. */
const Toggle: React.FC<{ label: string }> = ({ label }) => (
  <label className="hl-toggle">
    <input type="checkbox" role="switch" checked readOnly />
    <span className="hl-toggle__track" style={NO_T}>
      <span className="hl-toggle__knob" style={NO_T}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="square" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
    </span>
    <span>{label} <span className="hl-toggle__state">On</span></span>
  </label>
);

export type SettingsAiScreenProps = {
  box?: AiConnectBoxProps;         // props for the connect card
  connectedCard?: AiConnectedCardProps;
  swap?: number;                   // 0..1 crossfade from the connect card to the connected card. Both sit in
                                   // ONE grid cell (height = the taller one), so nothing below moves.
  lead?: boolean;                  // the page's lead paragraph (5 lines, 160 px incl. gap; default true)
  more?: boolean;                  // the "AI in HoneLENS" / "Analyze button" sections + plain-terms note (default true)
  style?: React.CSSProperties;
};

/** settings.js render() for page 'ai' + pageAi(). Render as PanelFrame's child (it supplies .hl-screen). */
export const SettingsAiScreen: React.FC<SettingsAiScreenProps> = ({ box, connectedCard, swap = 0, lead = true, more = true, style }) => {
  const s = clamp01(swap);
  return (
    <>
      <nav className="hl-settings__back" aria-label="Breadcrumb">
        <a className="hl-link" style={NO_T}>Settings</a>
        <span aria-hidden="true">{' / '}</span>
        <span aria-current="page">AI</span>
      </nav>
      <ScreenHeader kicker="AI" title="Your AI, your key." />
      <div className="hl-stack hl-settings" style={style}>
        {lead ? <p style={{ margin: 0 }}>{T.pageLead}</p> : null}
        <div style={{ display: 'grid' }}>
          <div style={{ gridArea: '1 / 1', opacity: 1 - s, alignSelf: 'start' }}>
            <AiConnectBox {...box} />
          </div>
          {s > 0 ? (
            <div style={{ gridArea: '1 / 1', opacity: s, alignSelf: 'start', transform: s < 1 ? `translateY(${mix(s, 8, 0)}px)` : undefined }}>
              <AiConnectedCard {...connectedCard} />
            </div>
          ) : null}
        </div>
        {more ? (
          <>
            <section className="hl-stack hl-settings__section" aria-label="AI in HoneLENS">
              <h2 className="hl-settings__h">AI in HoneLENS</h2>
              <Toggle label="Use AI in HoneLENS" />
              <p className="hl-small" style={{ margin: 0 }}>{T.aiOff}</p>
            </section>
            <section className="hl-stack hl-settings__section" aria-label="Analyze button">
              <h2 className="hl-settings__h">Analyze button</h2>
              <Toggle label="Show the Analyze button on research articles" />
              <p className="hl-small" style={{ margin: 0 }}>{T.fab}</p>
            </section>
            <div className="hl-callout hl-callout--plain">
              <p style={{ margin: 0 }}>
                <span className="hl-callout__label"><Icon name="info" size={16} />In plain terms.</span>
                {T.plain}
              </p>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
};

/** Bare .hl-canvas surface (fonts, tokens, zoom) for showing a card without the panel chrome. */
export const HlSurface: React.FC<{ width?: number; zoom?: number; padding?: number; background?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({
  width = 400, zoom = 1, padding = 16, background = 'transparent', children, style,
}) => (
  <div className="hl-canvas" style={{ zoom, width, padding, background, boxSizing: 'border-box', ...style }}>
    <div className="hl-stack">{children}</div>
  </div>
);

// ---------------------------------------------------------------- geometry (cursor targets)

export type Rect = { x: number; y: number; w: number; h: number; cx: number; cy: number };
const rect = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h, cx: x + w / 2, cy: y + h / 2 });
const shift = (r: Rect, dx: number, dy: number) => rect(r.x + dx, r.y + dy, r.w, r.h);

// Line boxes from the product CSS (exact) and text widths from the Plex metrics (±2 px).
const G = {
  inset: 17,            // .hl-card border 1 + padding 16
  heading: 20.25 + 12,  // .hl-an-h 15px × 1.35 + stack gap
  intro: 81.6 + 12,     // 3 lines × 27.2 at 334 px + gap
  field: 112.85,        // label 20.25 + 6 + input 40 + 6 + hint 2 lines × 20.3
  detected: 24.3,       // 4 + 20.3
  status: 38,           // 12 + 26 slot
  getKey: 145.85,       // border 1 + 12 + label 20.25 + 8 + link 24 + 8 + link 24 + 8 + 2 lines × 20.3
  footer: 12 + 81.2,    // gap + 4 lines × 20.3
  showW: 62.1, connectW: 115.4, link0W: 177.9, link1W: 160.4,
};

export type AiConnectGeometry = {
  input: Rect; show: Rect; connect: Rect; status: Rect; links: [Rect, Rect]; height: number;
};

/**
 * Where things are inside AiConnectBox, in CSS px from its top-left (the card's outer edge), for a
 * card 368 px wide (panel 400). Pass the same recognized/status values you give the box.
 */
export function aiConnectGeometry(o: { width?: number; recognized?: number; status?: number; intro?: boolean; heading?: boolean; footer?: boolean; card?: boolean } = {}): AiConnectGeometry {
  const { width = 368, recognized = 0, status = 0, intro = false, heading = false, footer = false, card = true } = o;
  const inset = card ? G.inset : 0;
  const x0 = inset, cw = width - 2 * inset;
  const y0 = inset + (heading ? G.heading : 0) + (intro ? G.intro : 0);
  const connectTop = y0 + G.field + G.detected * clamp01(recognized) + 12;
  const getKeyTop = connectTop + 40 + G.status * clamp01(status) + 12;
  const height = getKeyTop + G.getKey + (footer ? G.footer : 0) + inset;
  return {
    show: rect(x0 + cw - G.showW, y0 - 4, G.showW, 32),
    input: rect(x0, y0 + 26.25, cw, 40),
    connect: rect(x0, connectTop, G.connectW, 40),
    status: rect(x0, connectTop + 52, cw, 26),
    links: [rect(x0, getKeyTop + 41.25, G.link0W, 24), rect(x0, getKeyTop + 73.25, G.link1W, 24)],
    height,
  };
}

/**
 * The same targets for SettingsAiScreen, in panel CSS px from the PanelFrame's top-left with scrollY 0
 * (screen = panelLeft + zoom·x, panelTop + zoom·(y − scrollY)). App bar: 88 px with tabs, 48 without
 * (row 8 + 40 px gear, tabs 40). Body padding 16; breadcrumb 24 + 24, header 49.7 + 24 + 24.
 */
export function settingsAiGeometry(o: { tabs?: boolean; lead?: boolean; recognized?: number; status?: number; intro?: boolean; footer?: boolean } = {}) {
  const { tabs = false, lead = true, ...box } = o;
  const appbar = tabs ? 88 : 48;
  const boxTop = appbar + 16 + 145.7 + (lead ? 136 + 24 : 0);
  const g = aiConnectGeometry({ ...box, width: 368 });
  return {
    boxTop,
    boxLeft: 16,
    input: shift(g.input, 16, boxTop),
    show: shift(g.show, 16, boxTop),
    connect: shift(g.connect, 16, boxTop),
    status: shift(g.status, 16, boxTop),
    links: [shift(g.links[0], 16, boxTop), shift(g.links[1], 16, boxTop)] as [Rect, Rect],
    boxBottom: boxTop + g.height,
  };
}

// ---------------------------------------------------------------- ProviderKeyPage (generic, unbranded)

// Neutral console palette: grays and a dark slate-navy. No provider logos, colors or trademarks.
const PK = {
  ink: '#1B2430', muted: '#5F6B78', faint: '#8A94A0', line: '#E4E7EB', soft: '#F7F8FA', field: '#F5F6F8',
  fieldLine: '#DDE1E6', btn: '#1F2A37', btnHover: '#2B3846', btnPressed: '#141B24', ghostLine: '#D5DAE0',
  ghostHover: '#F3F5F7', selected: '#E9ECF0',
};
// Layout (design CSS px at zoom 1). Shared by the renderer and providerKeyGeometry().
const PKG = {
  top: 64, side: 240, mainX: 296, h1Top: 112, pTop: 164, btnTop: 220, btnW: 192, btnH: 50,
  tableTop: 306, headH: 48, rowH: 64, tableMaxW: 880,
  dlgW: 640, dlgH: 284, pad: 32, keyTop: 122, keyH: 56, copyW: 140, doneTop: 206, doneW: 104, doneH: 46,
};

const VARIANT = {
  gemini: {
    nav: ['Overview', 'API keys', 'Usage', 'Documentation'],
    account: 'Default project',
    col3: 'Project', val3: 'Default project',
    keyShort: `AIza…${KEY_TAIL.gemini}`,
    masked: KEYS.masked,
    note: 'Keep this key private. You can see it again in this list.',
  },
  openrouter: {
    nav: ['Models', 'API keys', 'Activity', 'Documentation'],
    account: 'Personal',
    col3: 'Limit', val3: 'No limit',
    keyShort: `sk-or-v1-…${KEY_TAIL.openrouter}`,
    masked: `sk-or-v1-${'•'.repeat(21)}`,
    note: 'Copy this key now. You will not be able to see it again.',
  },
};

const Svg: React.FC<{ size: number; color: string; children: React.ReactNode; sw?: number }> = ({ size, color, children, sw = 2 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flex: 'none' }} aria-hidden="true">
    {children}
  </svg>
);

export type ProviderKeyPageProps = {
  variant?: AiProviderId;      // changes only small text (nav labels, third column, key prefix, dialog note)
  zoom?: number;               // CSS zoom; content width on screen = width × zoom
  width?: number;              // design width (default 1280)
  height?: number;             // design height (default 720; pass screenHeight / zoom to fill)
  hover?: number;              // 0..1 "Create API key" hover
  pressed?: number;            // 0..1 "Create API key" press
  created?: number;            // 0..1 the new key row replaces "No API keys yet."
  dialog?: number;             // 0..1 the "API key created" dialog and its scrim
  copyHover?: number;          // 0..1
  copyPressed?: number;        // 0..1
  copied?: number;             // 0..1 "Copy" → "✓ Copied" (same button, fixed width)
  doneHover?: number;          // 0..1
  style?: React.CSSProperties;
};

/**
 * A deliberately generic developer-console page ("API keys"), not any provider's real design.
 * Positioned absolutely at its parent's top-left (drop it into BrowserFrame's content area).
 */
export const ProviderKeyPage: React.FC<ProviderKeyPageProps> = ({
  variant = 'gemini', zoom = 1, width = 1280, height = 720, hover = 0, pressed = 0, created = 0, dialog = 0,
  copyHover = 0, copyPressed = 0, copied = 0, doneHover = 0, style,
}) => {
  const v = VARIANT[variant];
  const tableW = Math.min(PKG.tableMaxW, width - PKG.mainX - 56);
  const h = clamp01(hover), p = clamp01(pressed), cr = clamp01(created), dl = clamp01(dialog);
  const ch = clamp01(copyHover), cp = clamp01(copyPressed), ok = clamp01(copied), dh = clamp01(doneHover);
  const dlgX = (width - PKG.dlgW) / 2, dlgY = (height - PKG.dlgH) / 2;
  const cols = '1.15fr 1.35fr 1fr 0.9fr';
  const cell: React.CSSProperties = { paddingLeft: 24, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
  const press = (k: number) => (k > 0 ? `scale(${(1 - 0.02 * k).toFixed(4)})` : undefined);

  return (
    <div
      style={{
        position: 'absolute', left: 0, top: 0, width, height, zoom, overflow: 'hidden', background: C.white,
        fontFamily: FONT.sans, fontWeight: 600, color: PK.ink, WebkitFontSmoothing: 'antialiased', ...style,
      }}
    >
      {/* Top bar: neutral mark, "Developer console", account pill, avatar. */}
      <div style={{ position: 'absolute', left: 0, top: 0, width, height: PKG.top, borderBottom: `1px solid ${PK.line}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', padding: '0 28px', gap: 12 }}>
        <span style={{ width: 28, height: 28, borderRadius: 7, background: PK.btn, display: 'grid', placeItems: 'center', flex: 'none' }}>
          <span style={{ display: 'grid', gap: 4 }}>
            <span style={{ display: 'block', width: 12, height: 2.5, borderRadius: 2, background: C.white }} />
            <span style={{ display: 'block', width: 8, height: 2.5, borderRadius: 2, background: C.white }} />
          </span>
        </span>
        <span style={{ fontSize: 17, lineHeight: '24px', letterSpacing: '-0.01em' }}>Developer console</span>
        <span style={{ flex: 1 }} />
        <span style={{ height: 36, padding: '0 12px 0 14px', borderRadius: 18, border: `1px solid ${PK.line}`, display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, color: PK.muted, boxSizing: 'border-box' }}>
          {v.account}
          <Svg size={16} color={PK.muted}><path d="M6 9l6 6 6-6" /></Svg>
        </span>
        <span style={{ width: 34, height: 34, borderRadius: 17, background: PK.selected, color: PK.muted, display: 'grid', placeItems: 'center', fontSize: 15, flex: 'none' }}>S</span>
      </div>

      {/* Sidebar */}
      <div style={{ position: 'absolute', left: 0, top: PKG.top, width: PKG.side, bottom: 0, background: PK.soft, borderRight: `1px solid ${PK.line}`, boxSizing: 'border-box', paddingTop: 20 }}>
        {v.nav.map(item => {
          const on = item === 'API keys';
          return (
            <div key={item} style={{ margin: '0 14px 4px', height: 44, borderRadius: 8, padding: '0 16px', display: 'flex', alignItems: 'center', fontSize: 16, color: on ? PK.ink : PK.muted, background: on ? PK.selected : 'transparent' }}>
              {item}
            </div>
          );
        })}
      </div>

      {/* Main column */}
      <div style={{ position: 'absolute', left: PKG.mainX, top: PKG.h1Top, fontSize: 36, lineHeight: '42px', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>API keys</div>
      <div style={{ position: 'absolute', left: PKG.mainX, top: PKG.pTop, fontSize: 18, lineHeight: '28px', color: PK.muted, whiteSpace: 'nowrap' }}>Create a key to use the API from your apps.</div>
      <div
        style={{
          position: 'absolute', left: PKG.mainX, top: PKG.btnTop, width: PKG.btnW, height: PKG.btnH, borderRadius: 10,
          background: tint(PK.btn, [PK.btnHover, h], [PK.btnPressed, p]), color: C.white,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 17,
          transform: press(p), boxShadow: p > 0 ? `inset 0 1px 3px rgba(0,0,0,${(0.3 * p).toFixed(3)})` : '0 1px 2px rgba(17,24,39,.12)',
        }}
      >
        <Svg size={18} color={C.white} sw={2.2}><path d="M12 5v14M5 12h14" /></Svg>
        Create API key
      </div>

      {/* Keys table: one fixed row slot; "No API keys yet." and the new row share it (no jump). */}
      <div style={{ position: 'absolute', left: PKG.mainX, top: PKG.tableTop, width: tableW, border: `1px solid ${PK.line}`, borderRadius: 12, overflow: 'hidden', background: C.white }}>
        <div style={{ height: PKG.headH, display: 'grid', gridTemplateColumns: cols, alignItems: 'center', background: PK.soft, fontSize: 15, color: PK.muted }}>
          {['Name', 'Key', v.col3, 'Created'].map(t => <div key={t} style={cell}>{t}</div>)}
        </div>
        <div style={{ height: PKG.rowH, borderTop: `1px solid ${PK.line}`, display: 'grid' }}>
          <div style={{ gridArea: '1 / 1', ...cell, display: 'flex', alignItems: 'center', fontSize: 17, color: PK.faint, opacity: 1 - cr }}>No API keys yet.</div>
          {cr > 0 ? (
            <div style={{ gridArea: '1 / 1', display: 'grid', gridTemplateColumns: cols, alignItems: 'center', fontSize: 17, opacity: cr, transform: cr < 1 ? `translateY(${mix(cr, 10, 0)}px)` : undefined }}>
              <div style={cell}>My first key</div>
              <div style={{ ...cell, fontFamily: FONT.mono, fontWeight: 400 }}>{v.keyShort}</div>
              <div style={{ ...cell, color: PK.muted }}>{v.val3}</div>
              <div style={{ ...cell, color: PK.muted }}>Oct 10, 2026</div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Dialog */}
      {dl > 0 ? (
        <>
          <div style={{ position: 'absolute', inset: 0, background: `rgba(17,24,39,${(0.34 * dl).toFixed(3)})` }} />
          <div
            role="dialog"
            aria-label="API key created"
            style={{
              position: 'absolute', left: dlgX, top: dlgY, width: PKG.dlgW, height: PKG.dlgH, background: C.white, borderRadius: 14,
              border: `1px solid ${PK.line}`, boxSizing: 'border-box',
              boxShadow: '0 2px 6px rgba(17,24,39,.08), 0 24px 64px rgba(17,24,39,.22)',
              opacity: dl, transform: dl < 1 ? `translateY(${mix(dl, 16, 0)}px) scale(${mix(dl, 0.985, 1).toFixed(4)})` : undefined,
            }}
          >
            <div style={{ position: 'absolute', left: PKG.pad, top: PKG.pad, fontSize: 24, lineHeight: '30px', letterSpacing: '-0.01em' }}>API key created</div>
            <div style={{ position: 'absolute', right: 26, top: 34 }}>
              <Svg size={22} color={PK.faint}><path d="M6 6l12 12M18 6L6 18" /></Svg>
            </div>
            <div style={{ position: 'absolute', left: PKG.pad, top: 72, fontSize: 17, lineHeight: '26px', color: PK.muted, whiteSpace: 'nowrap' }}>{v.note}</div>
            <div
              style={{
                position: 'absolute', left: PKG.pad, top: PKG.keyTop, width: PKG.dlgW - 2 * PKG.pad - PKG.copyW - 12, height: PKG.keyH,
                boxSizing: 'border-box', borderRadius: 10, background: PK.field, border: `1px solid ${PK.fieldLine}`, padding: '0 18px',
                display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap',
                fontFamily: FONT.mono, fontWeight: 400, fontSize: 20, color: PK.ink,
              }}
            >
              {v.masked}
            </div>
            <div
              style={{
                position: 'absolute', left: PKG.dlgW - PKG.pad - PKG.copyW, top: PKG.keyTop, width: PKG.copyW, height: PKG.keyH, borderRadius: 10,
                background: tint(PK.btn, [PK.btnHover, ch], [PK.btnPressed, cp]), color: C.white, display: 'grid', placeItems: 'center',
                fontSize: 17, transform: press(cp), boxShadow: cp > 0 ? `inset 0 1px 3px rgba(0,0,0,${(0.3 * cp).toFixed(3)})` : 'none',
              }}
            >
              <span style={{ gridArea: '1 / 1', display: 'flex', alignItems: 'center', gap: 8, opacity: 1 - ok }}>
                <Svg size={18} color={C.white}><rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2" /><path d="M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5" /></Svg>
                Copy
              </span>
              <span style={{ gridArea: '1 / 1', display: 'flex', alignItems: 'center', gap: 8, opacity: ok, transform: ok < 1 ? `translateY(${mix(ok, 4, 0)}px)` : undefined }}>
                <Svg size={18} color={C.white} sw={2.4}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>
                Copied
              </span>
            </div>
            <div
              style={{
                position: 'absolute', left: PKG.dlgW - PKG.pad - PKG.doneW, top: PKG.doneTop, width: PKG.doneW, height: PKG.doneH, boxSizing: 'border-box',
                borderRadius: 10, border: `1px solid ${PK.ghostLine}`, background: tint(C.white, [PK.ghostHover, dh]),
                display: 'grid', placeItems: 'center', fontSize: 17, color: PK.ink,
              }}
            >
              Done
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

/** ProviderKeyPage targets in design CSS px (multiply by the page's zoom, add its screen origin). */
export function providerKeyGeometry(width = 1280, height = 720) {
  const dlgX = (width - PKG.dlgW) / 2, dlgY = (height - PKG.dlgH) / 2;
  const tableW = Math.min(PKG.tableMaxW, width - PKG.mainX - 56);
  return {
    createButton: rect(PKG.mainX, PKG.btnTop, PKG.btnW, PKG.btnH),
    table: rect(PKG.mainX, PKG.tableTop, tableW, PKG.headH + PKG.rowH + 3),
    newRow: rect(PKG.mainX, PKG.tableTop + 1 + PKG.headH + 1, tableW, PKG.rowH),
    dialog: rect(dlgX, dlgY, PKG.dlgW, PKG.dlgH),
    keyBox: rect(dlgX + PKG.pad, dlgY + PKG.keyTop, PKG.dlgW - 2 * PKG.pad - PKG.copyW - 12, PKG.keyH),
    copyButton: rect(dlgX + PKG.dlgW - PKG.pad - PKG.copyW, dlgY + PKG.keyTop, PKG.copyW, PKG.keyH),
    doneButton: rect(dlgX + PKG.dlgW - PKG.pad - PKG.doneW, dlgY + PKG.doneTop, PKG.doneW, PKG.doneH),
  };
}
