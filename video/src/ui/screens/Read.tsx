/**
 * Read section screens, drawn with the product's own markup and CSS so the film shows the real
 * HoneLENS: Source check (src/sidepanel/screens/source-check.js + modules/sourcecheck/check.js),
 * Citation maker (screens/cite.js, styles/screens/cite.css) and the Stats calculator's "From counts"
 * tab (screens/stats.js, modules/stats). Shared pieces mirror src/ui/kit.js (checkRow, chip, callouts,
 * resultCard, toast, segmented, field).
 *
 * PURE and PRESENTATIONAL: no useCurrentFrame in here. Every animated aspect is a numeric prop and every
 * prop defaults to the finished state, so <SourceCheckScreen /> alone renders the completed screen.
 * Render inside PanelFrame (panel 400 CSS px, body gutters 16 => 368 px content):
 *
 *   <PanelFrame section="Read" sub={readSub('Source check')} zoom={1.8} scrollY={...}>
 *     <SourceCheckScreen titleIn={lin(f, [10, 34], [0, 1])} rows={lin(f, [30, 130], [0, 5])}
 *       chipsIn={lin(f, [60, 170], [0, 5])} meaningOpen={lin(f, [260, 290], [0, 1])} />
 *   </PanelFrame>
 *   <PanelFrame section="Read" sub={readSub('Source check')}><SourceCheckScreen retracted noticeIn={...} /></PanelFrame>
 *   <PanelFrame section="Read" sub={readSub('Cite')} zoom={2.25} height={h} scrollY={sy}>
 *     <CiteScreen header={false} tabs={false} format={f < 70 ? 'apa' : 'ama'} crossfade={lin(f, [70, 92], [0, 1])}
 *       pressed={...} toast={lin(f, [120, 142], [0, 1])} scrollY={sy} viewportHeight={h - 88} />
 *   </PanelFrame>
 *   <PanelFrame section="Read" sub={readSub('Stats')}>
 *     <StatsScreen filled={lin(f, [0, 60], [0, 4])} pressed={...} result={lin(f, [90, 114], [0, 1])} plain={...} />
 *   </PanelFrame>
 *
 * Reveal convention: a fractional count such as rows={2.4} shows rows 0 and 1 fully, row 2 at 40 % of
 * its entrance (opacity + 12 px rise, EASE_OUT applied to clamp(rows - i, 0, 1)), later rows hidden.
 * Hidden rows and chips KEEP their layout space, so nothing jumps. Pass linear ramps (`lin`); easing is
 * applied in here, also for the 0..1 props (titleIn, noticeIn, meaningOpen, criteriaIn, cardIn,
 * crossfade, result, arr, plain, toast). `pressed` and `flash` are used as given.
 * Expanding parts (meaningOpen, noticeIn) animate a grid wrapper 0fr -> 1fr, so content below moves down.
 *
 * Toast: CiteScreen draws the product toast at the bottom of the panel's visible body. PanelFrame scrolls
 * its <main> with a transform, which is the toast's containing block, so pass the same `scrollY` as the
 * PanelFrame and `viewportHeight` = PanelFrame height − 88 (app bar 48 + section tabs 40; − 48 with
 * section={null}). Do not wrap CiteScreen in a transformed element inside PanelFrame when you use the
 * toast. `ProductToast` is exported for placing a toast yourself.
 *
 * Approximate y in panel CSS px from the top of the screen content (±1 text line if a line wraps
 * differently). Add 88 (app bar + section tabs), 16 (body padding) and 64 (Read sub-nav) to get the y
 * inside PanelFrame, i.e. +168.
 *   SourceCheckScreen  header 0–77 · paper title 125–226 · rows 242–632 (each ≈ 74, Updates ≈ 94; chips
 *                      sit at the right of each row's first line) · meaning note +160 when open ·
 *                      "Your criteria" 648–782 (808–942 with the note open). Without header: −125.
 *                      Retracted: title 125–201 · notice 217–289 · one row 305–379.
 *   CiteScreen         header 0–77 · tabs 125–166 · DOI field 178–244 · "Your citation" 268–291 ·
 *                      APA 7 | AMA 11 303–343 (≈ 160 wide, left) · citation card 355–626 (APA ≈ 271,
 *                      AMA ≈ 190 tall; +94 with inText) · Copy citation 638–678 (x 0–≈150).
 *                      header={false} tabs={false}: field 0–66, seg 125–165, card 177–448, buttons 460–500.
 *                      header/tabs/lookup all false: heading 12–35, seg 47–87, card 99–370, buttons 382–422.
 *   StatsScreen        header 0–77 · Experimental group 125–220 · Control group 236–330 · Calculate
 *                      346–386 · NNT result 410–562 (value line ≈ 470) · In plain terms 574–646.
 *                      Without header: −125.
 */
import React from 'react';
import { interpolateColors } from 'remotion';
import { C } from '../../brand/colors';
import { EASE_IN_OUT, EASE_OUT } from '../../motion/ease';
import { ARTICLE, CITE, SOURCE_CHECK, STATS } from '../../data/demo';
import { Icon } from '../Icon';
import type { IconName } from '../icon-paths';
import { Chip, ScreenHeader } from '../Panel';

// ---------- Navigation ----------

/** Read sub-navigation, as in src/sidepanel/routes.js. */
export const READ_SCREENS = ['Source check', 'Stats', 'Clips', 'Cite'] as const;
export type ReadScreen = (typeof READ_SCREENS)[number];
/** `sub` prop for PanelFrame: <PanelFrame section="Read" sub={readSub('Cite')}>. */
export const readSub = (value: ReadScreen) => ({ items: [...READ_SCREENS] as string[], value: value as string });

// ---------- Helpers ----------

const clamp01 = (v: number) => (v <= 0 ? 0 : v >= 1 ? 1 : v);
const ease = (v: number) => EASE_OUT(clamp01(v));
/** Eased entrance (0..1) of item i in a fractional reveal count n. */
const reveal = (n: number, i: number) => ease(n - i);
/** Fade + rise. Keeps layout space at every value. */
const enter = (p: number, dy = 12): React.CSSProperties =>
  p >= 1 ? {} : { opacity: p, transform: `translateY(${((1 - p) * dy).toFixed(3)}px)` };
const mixColor = (t: number, from: string, to: string) => interpolateColors(clamp01(t), [0, 1], [from, to]);
const rgba = (hex: string, a: number) =>
  `rgba(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)}, ${clamp01(a).toFixed(4)})`;
const TEAL_PRESSED = '#1B626A'; // --hl-teal-pressed

// The product's classes carry CSS transitions and keyframes (.hl-btn, .hl-seg__item, .hl-toast …).
// Every frame must be a pure function of the props, so they are switched off for this subtree.
const STILL_CSS = '.hlv-read,.hlv-read *{transition:none!important;animation:none!important}';
const Still: React.FC = () => <style>{STILL_CSS}</style>;
const ROOT: React.CSSProperties = { display: 'grid', gap: 24, minWidth: 0 }; // same rhythm as .hl-screen

/** Product :active look for a primary button (teal-pressed, scale .98, inset shadow), 0..1. */
const pressStyle = (p: number): React.CSSProperties => {
  const k = clamp01(p);
  if (k <= 0) return {};
  return {
    background: mixColor(k, C.teal, TEAL_PRESSED),
    transform: `scale(${(1 - 0.02 * k).toFixed(4)})`,
    boxShadow: `inset 0 1px 2px rgba(24, 50, 74, ${(0.18 * k).toFixed(3)})`,
  };
};

/**
 * Expansion without DOM measurement: a one-row grid from 0fr to 1fr (inner element clips) plus opacity.
 * Put any spacing INSIDE the children (padding), so a closed wrapper takes no space at all.
 */
const Expand: React.FC<{ open: number; children: React.ReactNode }> = ({ open, children }) => {
  const o = clamp01(open);
  return (
    <div style={{ display: 'grid', gridTemplateRows: `${o.toFixed(4)}fr`, opacity: o, minWidth: 0 }}>
      <div style={{ minHeight: 0, overflow: 'hidden' }}>{children}</div>
    </div>
  );
};

/** Steady caret (no blinking) for text being typed. */
const Caret: React.FC = () => (
  <span style={{ display: 'inline-block', width: 1.5, height: '1.15em', background: C.teal, marginLeft: 1, marginRight: -2.5, verticalAlign: '-0.22em' }} />
);

/** Typed text that keeps its layout: the untyped rest is present but invisible. */
const Typed: React.FC<{ text: string; chars: number; caret?: boolean }> = ({ text, chars, caret = false }) => {
  const n = Math.max(0, Math.min(text.length, Math.floor(chars + 1e-6)));
  return (
    <span style={{ whiteSpace: 'pre' }}>
      {text.slice(0, n)}
      {caret ? <Caret /> : null}
      <span style={{ visibility: 'hidden' }}>{text.slice(n)}</span>
    </span>
  );
};

/** kit.js field(): label + input, drawn as a static box (no <input>) so the value can be typed by frame. */
const FieldBox: React.FC<{ label: string; value: string; chars?: number; focus?: boolean; mono?: boolean }> = ({
  label, value, chars = value.length, focus = false, mono = true,
}) => (
  <div className="hl-field">
    <span className="hl-label">{label}</span>
    <div
      className={`hl-input${mono ? ' hl-input--num' : ''}`}
      style={{ display: 'flex', alignItems: 'center', overflow: 'hidden', borderColor: focus ? C.teal : undefined }}
    >
      <Typed text={value} chars={chars} caret={focus} />
    </div>
  </div>
);

/** Renders the *italic* markers used in CITE strings as real italics. */
const WithItalics: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split('*').map((s, i) => (i % 2 === 1 ? <i key={i}>{s}</i> : <React.Fragment key={i}>{s}</React.Fragment>))}
  </>
);

// ---------- Shared parts ----------

type ChipState = React.ComponentProps<typeof Chip>['state'];
const CHIP_INK: Record<ChipState, string> = {
  match: C.teal, nomatch: C.amber, unknown: C.slate, confirmed: C.navy, retracted: C.amber, danger: C.red, offline: C.slate,
};

export type CheckRowData = { label: string; value: string; state: ChipState; chip: string };

export type CheckRowProps = {
  row: CheckRowData;
  /** Row entrance 0..1, already eased (opacity + 12 px rise). */
  p?: number;
  /** Chip landing 0..1, already eased (opacity + scale .9 -> 1 from the right edge). */
  chipP?: number;
  /** 0..1: the chip-as-button hover ring (product .hl-chip--action:hover), for a cursor about to click it. */
  ring?: number;
};

/** kit.js checkRow(): label, status chip (icon + word), detail line below. */
export const CheckRow: React.FC<CheckRowProps> = ({ row, p = 1, chipP = 1, ring = 0 }) => {
  const c = clamp01(chipP);
  return (
    <div className="hl-row" style={enter(p)}>
      <span className="hl-row__label">{row.label}</span>
      <Chip
        state={row.state}
        style={{
          opacity: c,
          transform: c >= 1 ? undefined : `scale(${(0.9 + 0.1 * c).toFixed(4)})`,
          transformOrigin: 'right center',
          boxShadow: ring > 0 ? `inset 0 0 0 1px ${rgba(CHIP_INK[row.state], ring)}` : undefined,
        }}
      >
        {row.chip}
      </Chip>
      <div className="hl-row__detail">
        <span className="hl-small">{row.value}</span>
      </div>
    </div>
  );
};

/** kit.js retractedNotice(): amber callout, 6 px amber bar, ban icon, "Retracted.", notice line, link. */
export const RetractedNotice: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div className="hl-callout hl-callout--retracted" role="note" style={style}>
    <p>
      <span className="hl-callout__label">
        <Icon name="retracted" size={16} />
        Retracted.
      </span>
      {`${SOURCE_CHECK.retracted.notice} (Crossref). `}
      <a className="hl-link">
        Open the notice
        <Icon name="external" size={16} style={{ marginLeft: 4, verticalAlign: '-3px' }} />
      </a>
    </p>
  </div>
);

/** kit.js toast(): white card, hairline, float shadow, icon + one line. Position it yourself. */
export const ProductToast: React.FC<{ text: string; iconName?: IconName; style?: React.CSSProperties }> = ({ text, iconName = 'check', style }) => (
  <div className="hl-toast" role="status" style={style}>
    <Icon name={iconName} size={20} style={{ width: 20, height: 20, marginTop: 2 }} />
    <p>{text}</p>
  </div>
);

// ---------- Source check ----------

/** The illustrative paper's checks (data/demo.ts). */
const PAPER_ROWS: CheckRowData[] = SOURCE_CHECK.rows.map(r => ({ label: r.label, value: r.value, state: r.state, chip: r.chip }));
/** The second, retracted paper: its update row, worded like modules/sourcecheck/check.js noticeText(). */
const RETRACTED_ROWS: CheckRowData[] = [
  { label: 'Updates', value: `${SOURCE_CHECK.retracted.notice} (Crossref)`, state: 'retracted', chip: 'Retracted' },
];
/** Assignment rule row, worded like modules/sourcecheck/criteria.js (5-year window on Oct 10, 2026). */
const CRITERIA_ROW: CheckRowData = {
  label: 'Published within 5 years', value: 'Your window: published in the last 5 years (2021 or later)', state: 'match', chip: 'Matches',
};
export const MEANING_TITLE = 'What these checks mean.';
export const MEANING_TEXT =
  'Each row shows what a public record says: PubMed, Crossref or Europe PMC. No update record found means Crossref listed no matching notice on the day you checked.';

export type SourceCheckScreenProps = {
  /** Kicker + title (default true). */
  header?: boolean;
  /** Show the second paper (SOURCE_CHECK.retracted) with the Retracted notice; hides "Your criteria". */
  retracted?: boolean;
  /** Paper title + journal line entrance 0..1 (default 1). */
  titleIn?: number;
  /** Fractional reveal of the check rows (default: all; 5 rows, or 1 row when retracted). */
  rows?: number;
  /** Fractional reveal of the chips, so chips can land after their rows (default = rows). */
  chipsIn?: number;
  /** Retracted notice expansion 0..1 (retracted mode only, default 1). Rows below move down. */
  noticeIn?: number;
  /** "What these checks mean" note under the rows, expansion 0..1 (default 0 = closed). */
  meaningOpen?: number;
  meaningText?: string;
  /** "Your criteria" subhead + "Published within 5 years · Matches" entrance 0..1 (default 1). */
  criteriaIn?: number;
  /** Index of a row whose chip shows the hover ring (cursor about to click it), and its amount 0..1. */
  chipHover?: number;
  chipHoverAmount?: number;
  /** The product's one attention effect on a fresh result: teal tint on the rows block, 0..1 as given. */
  flash?: number;
};

export const SourceCheckScreen: React.FC<SourceCheckScreenProps> = ({
  header = true, retracted = false, titleIn = 1, rows, chipsIn, noticeIn = 1, meaningOpen = 0,
  meaningText = MEANING_TEXT, criteriaIn = 1, chipHover = -1, chipHoverAmount = 1, flash = 0,
}) => {
  const list = retracted ? RETRACTED_ROWS : PAPER_ROWS;
  const shown = rows ?? list.length;
  const chips = chipsIn ?? shown;
  const paper = retracted
    ? { title: SOURCE_CHECK.retracted.title, line: `${SOURCE_CHECK.retracted.journal} · ${SOURCE_CHECK.retracted.year}` }
    : { title: ARTICLE.title, line: `${ARTICLE.journal} · ${ARTICLE.year}` };
  return (
    <div className="hlv-read" style={ROOT}>
      <Still />
      {header ? <ScreenHeader kicker="Source check" title="Can you use this source for your assignment?" /> : null}
      <section className="sc-result" aria-label="Check result">
        <div style={{ minWidth: 0 }}>
          <div style={enter(ease(titleIn))}>
            <p className="sc-title">{paper.title}</p>
            <p className="hl-small" style={{ margin: '4px 0 0' }}>{paper.line}</p>
          </div>
          {retracted ? (
            <Expand open={ease(noticeIn)}>
              <div style={{ paddingTop: 16 }}><RetractedNotice /></div>
            </Expand>
          ) : null}
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="hl-rows" style={flash > 0 ? { background: rgba(C.tealTint, flash) } : undefined}>
            {list.map((r, i) => (
              <CheckRow key={r.label} row={r} p={reveal(shown, i)} chipP={reveal(chips, i)} ring={i === chipHover ? clamp01(chipHoverAmount) : 0} />
            ))}
          </div>
          <Expand open={ease(meaningOpen)}>
            <div style={{ paddingTop: 16 }}>
              <div className="hl-callout hl-callout--note" role="note">
                <p><span className="hl-callout__label">{MEANING_TITLE}</span>{meaningText}</p>
              </div>
            </div>
          </Expand>
        </div>
        {!retracted ? (
          <div style={{ display: 'grid', gap: 16, minWidth: 0, ...enter(ease(criteriaIn)) }}>
            <h2 className="sc-subhead">Your criteria</h2>
            <div className="hl-rows">
              <CheckRow row={CRITERIA_ROW} />
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
};

// ---------- Cite ----------

export type CiteFormat = 'apa' | 'ama';
const FORMAT_LABEL: Record<CiteFormat, string> = { apa: 'APA', ama: 'AMA' };
const STYLE_ITEMS: ReadonlyArray<{ value: CiteFormat; label: string }> = [
  { value: 'apa', label: 'APA 7' },
  { value: 'ama', label: 'AMA 11' },
];
const FIRST_AUTHOR = ARTICLE.authorsShort.split(' ')[0]; // "Rivera"
const IN_TEXT: ReadonlyArray<[string, string]> = [
  ['Parenthetical', `(${FIRST_AUTHOR} et al., ${ARTICLE.year})`],
  ['Narrative', `${FIRST_AUTHOR} et al. (${ARTICLE.year})`],
];

/** One format's card content (cite.js renderOutput): label, reference, optional in-text block. */
const CardBody: React.FC<{ format: CiteFormat; inText: boolean }> = ({ format, inText }) => (
  <div className="hl-stack">
    <p className="hl-label" style={{ margin: 0 }}>{FORMAT_LABEL[format]} reference</p>
    <p className={`hl-cite__ref${format === 'apa' ? ' hl-cite__ref--hang' : ''}`}>
      <WithItalics text={CITE[format]} />
    </p>
    {inText && format === 'apa' ? (
      <div className="hl-cite__intext">
        <p className="hl-label" style={{ margin: 0 }}>In-text</p>
        {IN_TEXT.map(([label, text]) => (
          <div key={label} className="hl-cite__intext-row">
            <span className="hl-small">{label}</span>
            <span className="hl-cite__mono">{text}</span>
            <button type="button" className="hl-btn hl-btn--text hl-btn--sm"><Icon name="copy" size={16} />Copy</button>
          </div>
        ))}
      </div>
    ) : null}
    {inText && format === 'ama' ? (
      <p className="hl-small" style={{ margin: 0 }}>AMA in-text citations are superscript numbers in the order you cite sources.</p>
    ) : null}
  </div>
);

/**
 * Crossfade between two blocks of different height, without measuring: a hidden spacer holds both
 * blocks in 0fr..1fr wrappers, so its height moves from the first block's height to the second's;
 * the visible blocks are overlaid at the top and crossfade. t is used as given.
 */
const Crossfade: React.FC<{ from: React.ReactNode; to: React.ReactNode; t: number }> = ({ from, to, t }) => {
  const k = clamp01(t);
  if (k >= 1) return <>{to}</>;
  if (k <= 0) return <>{from}</>;
  const outO = 1 - clamp01(k / 0.5);
  const inP = clamp01((k - 0.3) / 0.7);
  const cell: React.CSSProperties = { minHeight: 0, overflow: 'hidden' };
  const layer: React.CSSProperties = { position: 'absolute', top: 0, left: 0, right: 0 };
  return (
    <div style={{ position: 'relative', overflow: 'hidden', minWidth: 0 }}>
      <div aria-hidden="true" style={{ visibility: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateRows: `${(1 - k).toFixed(4)}fr` }}><div style={cell}>{from}</div></div>
        <div style={{ display: 'grid', gridTemplateRows: `${k.toFixed(4)}fr` }}><div style={cell}>{to}</div></div>
      </div>
      <div aria-hidden="true" style={{ ...layer, opacity: outO }}>{from}</div>
      <div style={{ ...layer, opacity: inP, transform: `translateY(${((1 - inP) * 6).toFixed(3)}px)` }}>{to}</div>
    </div>
  );
};

/** kit.js segmented() for the citation style. The selection moves in the first third of the crossfade. */
const StyleToggle: React.FC<{ format: CiteFormat; t: number }> = ({ format, t }) => {
  const w = clamp01(t / 0.35);
  return (
    <div className="hl-seg" role="radiogroup" aria-label="Citation style" style={{ justifySelf: 'start' }}>
      {STYLE_ITEMS.map(it => {
        const on = it.value === format ? w : 1 - w;
        return (
          <button
            key={it.value} type="button" className="hl-seg__item" role="radio" aria-checked={it.value === format ? 'true' : 'false'}
            style={{
              background: on > 0 ? mixColor(on, C.white, C.tealTint) : 'transparent',
              color: mixColor(on, C.slate, C.teal),
              boxShadow: on > 0 ? `inset 0 0 0 1px ${rgba(C.teal, on)}` : 'none',
            }}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
};

export type CitationCardProps = {
  format?: CiteFormat;
  /** 0..1 crossfade from the other format to `format` (default 1). Eased in here. */
  crossfade?: number;
  /** Show the APA in-text block / the AMA superscript note (default false: the reference alone). */
  inText?: boolean;
  style?: React.CSSProperties;
};

/** The citation card alone (hl-card): "APA reference" label and the reference, serif, hanging indent for APA. */
export const CitationCard: React.FC<CitationCardProps> = ({ format = 'apa', crossfade = 1, inText = false, style }) => {
  const other: CiteFormat = format === 'apa' ? 'ama' : 'apa';
  const t = EASE_IN_OUT(clamp01(crossfade));
  return (
    <div className="hl-card" style={style}>
      <Crossfade from={<CardBody format={other} inText={inText} />} to={<CardBody format={format} inText={inText} />} t={t} />
    </div>
  );
};

export type CiteScreenProps = {
  /** Kicker + title (default true). */
  header?: boolean;
  /** "New citation | Reference list" tabs under the header (default true). */
  tabs?: boolean;
  /** The "DOI or PMID" field with the DOI (default true). */
  lookup?: boolean;
  /** Characters of the DOI typed into the field (default: all). */
  doiChars?: number;
  /** Field has focus: teal border and a steady caret. */
  doiFocus?: boolean;
  /** Selected citation style (default 'apa'). */
  format?: CiteFormat;
  /** 0..1: the card crossfades from the other style to `format`; the toggle moves in the first third (default 1). */
  crossfade?: number;
  /** Citation card entrance 0..1 (default 1). */
  cardIn?: number;
  /** In-text block (APA) or superscript note (AMA) inside the card (default false). */
  inText?: boolean;
  /** "Copy citation" pressed 0..1, as given. */
  pressed?: number;
  /** Toast 0..1: rises from the bottom of the panel (default 0 = none). Run it back to 0 to dismiss. */
  toast?: number;
  /** Toast line (default: the product's "AMA citation copied." for the selected style). */
  toastText?: string;
  /** Same value as PanelFrame scrollY, so the toast stays at the panel bottom. */
  scrollY?: number;
  /** Visible body height in panel CSS px: PanelFrame height − 88 (default 760 − 88 = 672). */
  viewportHeight?: number;
};

export const CiteScreen: React.FC<CiteScreenProps> = ({
  header = true, tabs = true, lookup = true, doiChars, doiFocus = false, format = 'apa', crossfade = 1, cardIn = 1,
  inText = false, pressed = 0, toast = 0, toastText, scrollY = 0, viewportHeight = 672,
}) => {
  const toastP = ease(toast);
  const body = (
    <div className="hl-stack" style={{ minWidth: 0 }}>
      {lookup ? <FieldBox label="DOI or PMID" value={ARTICLE.doi} chars={doiChars} focus={doiFocus} /> : null}
      <h2 className="hl-cite__h">Your citation</h2>
      <StyleToggle format={format} t={crossfade} />
      <CitationCard format={format} crossfade={crossfade} inText={inText} style={enter(ease(cardIn))} />
      <div className="hl-cite__actions">
        <button type="button" className="hl-btn hl-btn--primary" style={pressStyle(pressed)}>
          <Icon name="copy" size={16} />
          Copy citation
        </button>
        <button type="button" className="hl-btn hl-btn--secondary">Save to reference list</button>
      </div>
    </div>
  );
  return (
    <div className="hlv-read" style={ROOT}>
      <Still />
      {header ? <ScreenHeader kicker="Citation maker" title="Make a reference from a DOI or PMID." /> : null}
      {tabs ? (
        <div className="hl-stack" style={{ minWidth: 0 }}>
          <div className="hl-tabs" role="tablist" aria-label="Citation maker views" style={{ overflow: 'hidden' }}>
            <button type="button" className="hl-tab" role="tab" aria-selected="true">New citation</button>
            <button type="button" className="hl-tab" role="tab" aria-selected="false">Reference list</button>
          </div>
          {body}
        </div>
      ) : body}
      {toastP > 0 ? (
        <div
          aria-live="polite"
          style={{
            position: 'absolute', left: 16, right: 16, top: scrollY + viewportHeight - 16, zIndex: 50,
            display: 'grid', justifyItems: 'center', pointerEvents: 'none',
            opacity: toastP, transform: `translateY(calc(-100% + ${((1 - toastP) * 20).toFixed(3)}px))`,
          }}
        >
          <ProductToast text={toastText ?? `${FORMAT_LABEL[format]} citation copied.`} />
        </div>
      ) : null}
    </div>
  );
};

// ---------- Stats ----------

/** 2 by 2 counts from the trial (data/demo.ts header: 31/206 vs 49/206 readmissions). */
export const STATS_COUNTS = { expEvents: 31, expTotal: 206, ctlEvents: 49, ctlTotal: 206 } as const;

/** NNT range exactly as modules/stats/calc.js computes it (Wald CI of the risk difference, reciprocals rounded up). */
const nntRange = () => {
  const { expEvents: a, expTotal: n1, ctlEvents: c, ctlTotal: n0 } = STATS_COUNTS;
  const p1 = a / n1, p0 = c / n0, rd = p0 - p1;
  const se = Math.sqrt((p1 * (1 - p1)) / n1 + (p0 * (1 - p0)) / n0);
  const z = 1.959963984540054;
  const up = (x: number) => Math.ceil(x - 1e-9);
  return { lo: up(1 / (rd + z * se)), hi: up(1 / (rd - z * se)) }; // 7 to 88
};
const NNT_RANGE = nntRange();

const COUNT_FIELDS: ReadonlyArray<{ group: string; fields: ReadonlyArray<[string, number]> }> = [
  { group: 'Experimental group', fields: [['Events', STATS_COUNTS.expEvents], ['Total', STATS_COUNTS.expTotal]] },
  { group: 'Control group', fields: [['Events', STATS_COUNTS.ctlEvents], ['Total', STATS_COUNTS.ctlTotal]] },
];

export type NntResultProps = {
  /** ARR line entrance 0..1, already eased (default 1). */
  arrP?: number;
  /** Teal-tint attention fade on the card, 0..1 as given. */
  flash?: number;
  style?: React.CSSProperties;
};

/** kit.js resultCard(): "NNT (number needed to treat)", 12 in mono, "95% CI 7 to 88", plus the ARR line. */
export const NntResult: React.FC<NntResultProps> = ({ arrP = 1, flash = 0, style }) => (
  <div className="hl-result" style={{ ...(flash > 0 ? { background: mixColor(flash, C.white, C.tealTint) } : null), ...style }}>
    <span className="hl-kicker">NNT (number needed to treat)</span>
    <span className="hl-result__value">{STATS.nnt}</span>
    <span className="hl-small">95% CI {NNT_RANGE.lo} to {NNT_RANGE.hi}</span>
    <div
      style={{
        display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'baseline', gap: 12,
        marginTop: 4, paddingTop: 10, borderTop: `1px solid ${C.hair}`, ...enter(clamp01(arrP), 8),
      }}
    >
      <span className="hl-small" style={{ color: C.navy }}>ARR (absolute risk reduction)</span>
      <span className="hl-num" style={{ color: C.navy }}>{STATS.arr}%</span>
    </div>
  </div>
);

/** kit.js plainTerms() with STATS.plain. */
export const PlainTermsNnt: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div className="hl-callout hl-callout--plain" style={style}>
    <p>
      <span className="hl-callout__label"><Icon name="info" size={16} />In plain terms.</span>
      {STATS.plain}
    </p>
  </div>
);

export type StatsScreenProps = {
  /** Kicker + title (default true). */
  header?: boolean;
  /** Header kicker (default the product's "Stats calculator"). */
  kicker?: string;
  /** Fractional typing of the four counts in order (Events, Total, Events, Total), 0..4 (default 4). */
  filled?: number;
  /** Show the Calculate button (default true). */
  calculate?: boolean;
  /** Calculate pressed 0..1, as given. */
  pressed?: number;
  /** NNT result card entrance 0..1 (default 1). */
  result?: number;
  /** ARR line inside the result card, 0..1 (default = result). */
  arr?: number;
  /** "In plain terms" box entrance 0..1 (default 1). */
  plain?: number;
  /** Teal-tint attention fade on the result card (product highlight), 0..1 as given. */
  flash?: number;
};

export const StatsScreen: React.FC<StatsScreenProps> = ({
  header = true, kicker = 'Stats calculator', filled = 4, calculate = true, pressed = 0, result = 1, arr, plain = 1, flash = 0,
}) => {
  let k = 0;
  return (
    <div className="hlv-read" style={ROOT}>
      <Still />
      {header ? <ScreenHeader kicker={kicker} title="What do the numbers in this paper mean?" /> : null}
      <div className="hl-stats-form">
        {COUNT_FIELDS.map(g => (
          <fieldset key={g.group} className="hl-stats-pair">
            <legend className="hl-label">{g.group}</legend>
            {g.fields.map(([label, value]) => {
              const i = k++;
              const f = filled - i;
              const text = String(value);
              return <FieldBox key={label} label={label} value={text} chars={clamp01(f) * text.length} focus={f > 0 && f < 1} />;
            })}
          </fieldset>
        ))}
        {calculate ? (
          <div>
            <button type="button" className="hl-btn hl-btn--primary" style={pressStyle(pressed)}>Calculate</button>
          </div>
        ) : null}
      </div>
      <div className="hl-stack hl-stats-results">
        <NntResult arrP={ease(arr ?? result)} flash={flash} style={enter(ease(result))} />
        <PlainTermsNnt style={enter(ease(plain))} />
      </div>
    </div>
  );
};
