/**
 * EBP builder visuals, drawn with the product's own classes and copy
 * (src/sidepanel/screens/ebp.js aiHelp/comparisonView/exportTab, src/pages/matrix.js + matrix.html,
 * src/styles/screens/ebp.css, src/config/features.js quotaLine, src/modules/ebp/matrix.js labels).
 * Content comes from EBP in data/demo.ts.
 *
 * Everything is PURE and PRESENTATIONAL: no useCurrentFrame. Every animated aspect is a numeric prop.
 * 0..1 props marked "eased by you" are used as given (pass progress(frame, at, dur)); reveal props
 * (0..1 or fractional counts) apply EASE_OUT themselves.
 *
 * ── 1. EbpPage: the full-tab page (BrowserFrame content area) ──────────────────────────────────
 * Design width 1280 CSS px (the product's hl-page: 48 px top, 24 px sides => one 1232 px column),
 * enlarged with CSS zoom. Absolutely positioned at its parent's top-left.
 *
 *   const z = W / 1280;                     // W × H = BrowserFrame content area in screen px
 *   <BrowserFrame width={1680} height={900} url={EBP_TAB.url} tabTitle={EBP_TAB.title}>
 *     <EbpPage zoom={z} height={H / z} scrollY={sy}
 *       papers={{ papers: lin(f, [60, 180], [0, 4]) }}
 *       ai={{ comparePressed: press, compareUsed: f > 330 ? 1 : 0, status: 'comparing', statusShow: s }}
 *       compare={progress(f, 340, 36)} comparison={{ items: lin(f, [370, 520], [0, 4]) }}
 *       matrix={{ cascade: lin(f, [660, 860], [0, MATRIX_CASCADE_END]) }}
 *       exports={{ exports: progress(f, 910, 60, EASE_SOFT) }} />
 *   </BrowserFrame>
 *
 *   Page, top to bottom (all heights FIXED, so geometry is exact; see ebpPageGeometry()):
 *     header      kicker "EBP builder", title EBP.assignment, meta            y 48,  h 82
 *     PICOT card  "PICOT question" + the question (P/I/C/O/T marks in teal)  y 154, h 136
 *     row         Papers card (P1–P4: id, short citation, design) 788 wide  y 314, h 292
 *                 + AI help card 420 wide: "Compare papers" (primary) and "Fill matrix with AI",
 *                 quota lines "Compare: 0 of 2 this week · resets Monday, Oct 12", status slot
 *     comparison  card (grows in: 0 → 256 px incl. its 24 px gap, `compare` 0..1)  y 630 when open
 *     matrix      "Evidence matrix" + lead + 8-column table                 y 630 (+256 × compare), h 690
 *     export      "Submission Pack": Word, Excel, CSV cards + quota line    matrix y + 714, h 296
 *     page height 1704 (compare closed) / 1960 (open)
 *   Use ebpPageGeometry(compare) for cursor targets and scroll positions (page CSS px at scrollY 0;
 *   screen = x × zoom, (y − scrollY) × zoom, relative to the content area's top-left).
 *
 * Sections are exported too, to show one at a time large. They are laid out for the page's 1232 px
 * column (fixed heights assume it), so wrap them in <EbpSurface> (1280 wide, 24 px side padding):
 *   <EbpSurface zoom={1.4}><MatrixTable cascade={c} /></EbpSurface>
 *   EbpHeader (header + PICOT card, h 242) · PapersList · AiHelpCard · CompareView (h 232)
 *   · MatrixTable (h 690) · ExportCards (h 296)
 *   PapersList and AiHelpCard stretch to their parent's height in the page (292); standalone, give
 *   them style={{ width: 788 | 420, height: 292 }}.
 *
 * Matrix cascade (MatrixTable / matrix.cascade): the seven fillable columns c = 0..6 (Design, Sample
 * and setting, Intervention or exposure, Outcome measures, Key findings, Limitations, Level) × rows
 * r = 0..3. Cell (r, c) sits on diagonal d = r + c (0..9) and its own progress is
 *   cascadeCell(cascade, r, c) = clamp((cascade − d) / CASCADE_SPAN, 0, 1)      CASCADE_SPAN = 1.5
 * so diagonal d starts when cascade = d (one "tick" cue each) and all cells are done at
 * MATRIX_CASCADE_END = 10.5. Drive it LINEARLY (lin()); each cell eases itself. Per cell: box border
 * goes from the field grey to the product's amber dashed draft border (.ebp-cell--draft), text fades
 * and rises 6 px, a soft teal-tint flash comes and goes on the box (the product's attention effect),
 * then the product tag "AI draft · edit it into your own words" (.ebp-draft-tag) fades in under it
 * (two lines at this column width). cascade 0 = empty matrix. Default: fully drafted.
 *
 * ── 2. MatrixCompact: the short film's phone-friendly matrix ───────────────────────────────────
 * 4 papers × (Paper, Design, Findings, Level). Designed at 400 CSS px and zoomed: default zoom 2.25
 * => 900 × 886 screen px; cell text 13.5 CSS px => 30.4 px, header 30.4 px, tag 27 px.
 *   <MatrixCompact zoom={2.25} cascade={lin(f, [20, 140], [0, COMPACT_CASCADE_END])} />
 * Inside a PanelFrame (already zoomed): <MatrixCompact zoom={1} width={368} /> (inner zoom 0.92, so
 * line breaks never change). Fillable columns c = 0..2 (Design, Findings, Level), d = r + c (0..5),
 * same cell formula, done at COMPACT_CASCADE_END = 6.5. Tag "AI draft". Geometry:
 * matrixCompactGeometry(zoom, width) (screen px relative to the component's top-left).
 *
 * Conventions: papers={2.4} => rows 0 and 1 in, row 2 at 40 % (opacity + 12 px rise, EASE_OUT on
 * clamp(n − i, 0, 1)), later rows invisible; hidden rows KEEP their layout space (nothing jumps).
 * Typing: synthChars shows that many characters, the rest is visibility:hidden. Presses: pressed
 * 0..1 scales the button to 0.98 and switches to the product's pressed colors above 0.5; hover above
 * 0.5 uses the hover colors. No CSS transitions anywhere (inline transition:none on every product
 * control whose state changes). Busy = static clock, never a spinner.
 */
import React from 'react';
import { C } from '../../brand/colors';
import { EASE_IN_OUT, EASE_OUT } from '../../motion/ease';
import { EBP } from '../../data/demo';
import { Icon } from '../Icon';
import type { IconName } from '../icon-paths';
import '../css/honelens.css';

// ---------------------------------------------------------------- helpers

const clamp01 = (v: number) => (!(v > 0) ? 0 : v >= 1 ? 1 : v);

/** Entrance style for a 0..1 progress: opacity + rise, EASE_OUT. Undefined once fully in. */
const reveal = (p: number, rise = 12): React.CSSProperties | undefined => {
  const c = clamp01(p);
  if (c >= 1) return undefined;
  const e = EASE_OUT(c);
  return { opacity: e, transform: `translateY(${((1 - e) * rise).toFixed(3)}px)` };
};
/** Item i of a fractional reveal count. */
const rowIn = (n: number, i: number, rise = 12) => reveal(n - i, rise);

type RGB = readonly [number, number, number];
const WHITE: RGB = [255, 255, 255];
const PAPER: RGB = [248, 248, 245];
const TINT: RGB = [227, 240, 241];  // C.tealTint
const FIELD: RGB = [122, 133, 140]; // C.field
const AMBER: RGB = [122, 74, 10];   // C.amber
const mixRgb = (a: RGB, b: RGB, t: number) => {
  const k = clamp01(t);
  const ch = (i: number) => Math.round(a[i] + (b[i] - a[i]) * k);
  return `rgb(${ch(0)}, ${ch(1)}, ${ch(2)})`;
};

/** The teal-tint attention flash for a 0..1 entrance: up fast, then fades out; 0 at both ends. */
const flash = (p: number) => {
  const c = clamp01(p);
  if (c <= 0 || c >= 1) return 0;
  return c < 0.25 ? EASE_OUT(c / 0.25) : 1 - EASE_IN_OUT((c - 0.25) / 0.75);
};

const NO_T: React.CSSProperties = { transition: 'none' };
const P0: React.CSSProperties = { margin: 0 };

const ID_STYLE: React.CSSProperties = { fontSize: '0.9em', lineHeight: 'inherit' };

/**
 * AI text with paper ids (P1…P4) set like the product's comparison key ids (.ebp-cmp-sid).
 * `chars` streams it: that many characters visible, the rest present but visibility:hidden, so the
 * layout (and the id styling) is final from the first frame.
 */
const IdText: React.FC<{ text: string; chars?: number }> = ({ text, chars }) => {
  let left = chars === undefined ? text.length : Math.max(0, Math.floor(chars));
  return (
    <>
      {text.split(/(P\d)/).map((part, i) => {
        const n = Math.min(part.length, left);
        left -= n;
        const body = n >= part.length ? part : <>{part.slice(0, n)}<span style={{ visibility: 'hidden' }}>{part.slice(n)}</span></>;
        return /^P\d$/.test(part)
          ? <span key={i} className="hl-num ebp-cmp-sid" style={ID_STYLE}>{body}</span>
          : <React.Fragment key={i}>{body}</React.Fragment>;
      })}
    </>
  );
};

/** The PICOT question with its (P) (I) (C) (O) (T) marks set small in teal sans. */
const picotMarked = (text: string) =>
  text.split(/(\([PICOT]\))/).map((part, i) =>
    /^\([PICOT]\)$/.test(part)
      ? <span key={i} style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.78em', color: C.teal, letterSpacing: '0.02em' }}>{part}</span>
      : <React.Fragment key={i}>{part}</React.Fragment>);

/** Keep "(RR 0.63)" and "nearest fit" on one line wherever they wrap. */
const cellText = (v: string) => v.replace(/\(RR (\S+)\)/, '(RR $1)').replace('nearest fit', 'nearest fit');

type BtnProps = {
  variant: 'primary' | 'secondary';
  sm?: boolean;
  icon?: IconName;
  width?: number;
  hover?: number;
  pressed?: number;
  disabled?: boolean;
  children: React.ReactNode;
};
/** kit.js button(): hl-btn hl-btn--<variant> [hl-btn--sm], icon then label. Fixed width = exact geometry. */
const Btn: React.FC<BtnProps> = ({ variant, sm, icon, width, hover = 0, pressed = 0, disabled, children }) => {
  const p = disabled ? 0 : clamp01(pressed);
  const h = disabled ? 0 : clamp01(hover);
  const cls = ['hl-btn', `hl-btn--${variant}`, sm && 'hl-btn--sm', p > 0.5 ? 'is-active' : h > 0.5 ? 'is-hover' : null]
    .filter(Boolean).join(' ');
  const transform = p > 0 ? `scale(${(1 - 0.02 * p).toFixed(4)})` : h > 0 ? `translateY(${(-h).toFixed(3)}px)` : 'none';
  return (
    <button type="button" className={cls} disabled={disabled} style={{ ...NO_T, width, transform, whiteSpace: 'nowrap', flex: 'none' }}>
      {icon ? <Icon name={icon} size={16} /> : null}
      {children}
    </button>
  );
};

// ---------------------------------------------------------------- layout (page CSS px)

/** Fixed page layout. Every section has an explicit height, so the geometry below is exact. */
export const EBP_LAYOUT = {
  pageW: 1280,
  padX: 24,
  padTop: 48,
  padBottom: 64,
  colW: 1232,
  gap: 24,
  headerH: 82,
  picotH: 136,
  rowH: 292,        // Papers card + AI help card
  papersW: 788,
  aiW: 420,
  compareH: 232,    // comparison card (the expansion adds gap + this = 256)
  matrixH: 690,
  exportH: 296,
} as const;

// AI help card internals (from the card's top-left; card padding 20 × 24, 1 px border)
const AI = { titleH: 22, noteH: 61, btnTop: 128, btnH: 32, compareW: 160, fillW: 172, quotaH: 20, statusTop: 228, statusH: 41 } as const;
// Papers card internals
const PL = { rowsTop: 59, rowH: 49 } as const;
// Matrix internals
const MX = { tableTop: 66, headW: 117, colW: 159, thInnerH: 41, thH: 57, cellH: 124, boxH: 84, rowPitch: 141 } as const;
// Export internals
const EX = { cardsTop: 93, cardH: 170, btnTop: 108, btnW: [220, 256, 172] as const } as const;

/** Suggested BrowserFrame labels for the page (the product titles the tab "<assignment> · HoneLENS"). */
export const EBP_TAB = { title: `${EBP.assignment} · HoneLENS`, url: 'chrome-extension://honelens/pages/matrix.html' } as const;

/** features.js quotaLine(): "1 of 2 this week · resets Monday, Oct 12" (fixed demo date: Sat Oct 10, 2026). */
export const QUOTA_RESETS = 'Monday, Oct 12';
export const quotaLine = (used: number, limit: number) => `${used} of ${limit} this week · resets ${QUOTA_RESETS}`;

export type Box = { x: number; y: number; w: number; h: number; cx: number; cy: number };
const box = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h, cx: x + w / 2, cy: y + h / 2 });

/**
 * Page geometry in page CSS px at scrollY 0 (x from the page's left edge; pass the page `width` if it
 * is wider than 1280, the column is centred). `compare` = the same 0..1 you pass to EbpPage.
 */
export function ebpPageGeometry(compare = 0, width: number = EBP_LAYOUT.pageW) {
  const L = EBP_LAYOUT;
  const x0 = Math.max(0, (width - L.pageW) / 2) + L.padX;
  const headerY = L.padTop;
  const picotY = headerY + L.headerH + L.gap;
  const rowY = picotY + L.picotH + L.gap;
  const aiX = x0 + L.papersW + L.gap;
  const open = clamp01(compare);
  const compareY = rowY + L.rowH + L.gap;
  const matrixY = rowY + L.rowH + (L.gap + L.compareH) * open + L.gap;
  const tableY = matrixY + MX.tableTop;
  const firstCellY = tableY + 1 + MX.thH + 1 + 8;
  const exportY = matrixY + L.matrixH + L.gap;
  const cardW = (L.colW - 2 * L.gap) / 3;
  const cards = [0, 1, 2].map(i => box(x0 + i * (cardW + L.gap), exportY + EX.cardsTop, cardW, EX.cardH));
  return {
    header: box(x0, headerY, L.colW, L.headerH),
    picot: box(x0, picotY, L.colW, L.picotH),
    papers: {
      card: box(x0, rowY, L.papersW, L.rowH),
      rows: EBP.papers.map((_, i) => box(x0 + 25, rowY + PL.rowsTop + PL.rowH * i, L.papersW - 50, PL.rowH)),
    },
    ai: {
      card: box(aiX, rowY, L.aiW, L.rowH),
      compareBtn: box(aiX + 25, rowY + AI.btnTop, AI.compareW, AI.btnH),
      fillBtn: box(aiX + 25 + AI.compareW + 8, rowY + AI.btnTop, AI.fillW, AI.btnH),
      status: box(aiX + 25, rowY + AI.statusTop, L.aiW - 50, AI.statusH),
    },
    /** The comparison card (where it is once open; height grows with `compare`). */
    compareCard: box(x0, compareY, L.colW, L.compareH * open),
    matrix: {
      section: box(x0, matrixY, L.colW, L.matrixH),
      table: box(x0, tableY, L.colW, L.matrixH - MX.tableTop),
      /** The draft box of cell (r, c), c = 0..6 fillable columns (Design … Level). */
      cell: (r: number, c: number) => box(x0 + 1 + MX.headW + MX.colW * c + 10, firstCellY + MX.rowPitch * r, MX.colW - 20, MX.boxH),
      rowHead: (r: number) => box(x0 + 1 + 10, firstCellY + MX.rowPitch * r, MX.headW - 20, MX.cellH),
    },
    exports: {
      section: box(x0, exportY, L.colW, L.exportH),
      cards,
      /** Word, Excel, CSV download buttons. */
      buttons: cards.map((c, i) => box(c.x + 25, c.y + EX.btnTop, EX.btnW[i], 40)),
    },
    height: exportY + L.exportH + L.padBottom,
  };
}

// ---------------------------------------------------------------- surface

/** .hl-canvas wrapper to show one section alone (default: the page's 1232 px column, 24 px sides). */
export const EbpSurface: React.FC<{ width?: number; zoom?: number; pad?: number; children: React.ReactNode; style?: React.CSSProperties }> =
  ({ width = EBP_LAYOUT.pageW, zoom = 1, pad = EBP_LAYOUT.padX, children, style }) => (
    <div className="hl-canvas" style={{ width, zoom, padding: `0 ${pad}px`, background: 'transparent', ...style }}>
      {children}
    </div>
  );

// ---------------------------------------------------------------- header + PICOT

export type EbpHeaderProps = {
  title?: number;   // 0..1 reveal of the kicker / title / meta block (default 1)
  picot?: number;   // 0..1 reveal of the PICOT card (default 1)
  meta?: string;    // course · due date line (product format "NUR 340 · Due 2026-10-16")
  style?: React.CSSProperties;
};

/** Page header (screenHeader(..., { tab: true })) and the PICOT question card. Height 242. */
export const EbpHeader: React.FC<EbpHeaderProps> = ({ title = 1, picot = 1, meta = 'NUR 340 · Due 2026-10-16', style }) => (
  <div style={style}>
    <header className="hl-head hl-head--tab" style={{ margin: 0, height: EBP_LAYOUT.headerH, ...reveal(title) }}>
      <p className="hl-kicker">EBP builder</p>
      <h1 className="hl-title">{EBP.assignment}</h1>
      {meta ? <p className="hl-head__meta">{meta}</p> : null}
    </header>
    <section
      className="hl-card" aria-labelledby="ebp-h-picot"
      style={{ marginTop: EBP_LAYOUT.gap, height: EBP_LAYOUT.picotH, padding: '20px 24px', ...reveal(picot) }}
    >
      <h2 className="ebp-h2" id="ebp-h-picot" style={{ height: 25 }}>PICOT question</h2>
      <p style={{ ...P0, marginTop: 8, height: 60, fontFamily: 'var(--font-serif)', fontSize: 20, lineHeight: 1.5, color: C.navy, maxWidth: 'none' }}>
        {picotMarked(EBP.picot)}
      </p>
    </section>
  </div>
);

// ---------------------------------------------------------------- papers

export type PapersListProps = {
  reveal?: number;  // 0..1 card entrance (default 1)
  papers?: number;  // 0..4 fractional rows (default 4)
  style?: React.CSSProperties;
};

/** "Papers" card: P1–P4 rows (id in teal mono, short citation, design). Rows are 49 px apart. */
export const PapersList: React.FC<PapersListProps> = ({ reveal: r = 1, papers = 4, style }) => (
  <section className="hl-card" aria-labelledby="ebp-h-papers" style={{ padding: '20px 24px', ...reveal(r), ...style }}>
    <h2 className="ebp-h2" id="ebp-h-papers" style={{ height: 25 }}>Papers</h2>
    <div className="hl-rows" style={{ marginTop: 12 }}>
      {EBP.papers.map((p, i) => (
        <div
          key={p.id} className="hl-row"
          style={{ gridTemplateColumns: '56px 196px minmax(0, 1fr)', gap: 0, alignItems: 'baseline', height: PL.rowH, padding: '12px 0', ...rowIn(papers, i) }}
        >
          <span className="hl-num ebp-cmp-sid">{p.id}</span>
          <span className="hl-row__label" style={{ fontSize: 16 }}>{p.short}</span>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 16, lineHeight: 1.5, color: C.slate, whiteSpace: 'nowrap' }}>{p.design}</span>
        </div>
      ))}
    </div>
  </section>
);

// ---------------------------------------------------------------- AI help (buttons, quota, status)

export type AiHelpCardProps = {
  reveal?: number;          // 0..1 card entrance (default 1)
  compareHover?: number;    // 0..1
  comparePressed?: number;  // 0..1
  fillHover?: number;       // 0..1
  fillPressed?: number;     // 0..1
  busy?: 'compare' | 'fill' | null;   // that button disabled while it runs (as the product does)
  status?: 'comparing' | 'drafting' | null;
  statusShow?: number;      // 0..1 opacity of the status (eased by you)
  drafted?: number;         // 0..4 papers drafted, for the 'drafting' progress bar (continuous)
  compareUsed?: number;     // weekly quota counts shown (free plan: 2 compares, 2 fills a week)
  fillUsed?: number;
  quota?: boolean;          // show the two quota lines (default true; space is kept either way)
  style?: React.CSSProperties;
};

/**
 * The product's "AI help" card (ebp.js aiHelp): note, "Compare papers" (primary, search icon) and
 * "Fill matrix with AI" (plus icon), the weekly quota lines, and a fixed status slot (comparing:
 * static clock + "Reading your papers and comparing them. This can take up to a minute."; drafting:
 * the product's progress bar "Drafting matrix cells  n of 4"). Buttons sit 128 px below the card top.
 */
export const AiHelpCard: React.FC<AiHelpCardProps> = ({
  reveal: r = 1, compareHover = 0, comparePressed = 0, fillHover = 0, fillPressed = 0, busy = null,
  status = null, statusShow = 1, drafted = 0, compareUsed = 0, fillUsed = 0, quota = true, style,
}) => {
  const d = Math.max(0, Math.min(4, drafted));
  return (
    <section className="hl-card ebp-ai" aria-labelledby="ebp-ai-h" style={{ display: 'block', padding: '20px 24px', ...reveal(r), ...style }}>
      <h2 className="ebp-h3" id="ebp-ai-h" style={{ height: AI.titleH }}>AI help</h2>
      <p className="hl-small" style={{ ...P0, marginTop: 12, height: AI.noteH, overflow: 'hidden' }}>
        Uses each paper’s saved analysis or its PubMed abstract. Drafts fill empty cells only and stay marked until you edit them.
      </p>
      <div className="hl-inline" style={{ marginTop: 12, height: AI.btnH, flexWrap: 'nowrap' }}>
        <Btn variant="primary" sm icon="search" width={AI.compareW} hover={compareHover} pressed={comparePressed} disabled={busy === 'compare'}>Compare papers</Btn>
        <Btn variant="secondary" sm icon="plus" width={AI.fillW} hover={fillHover} pressed={fillPressed} disabled={busy === 'fill'}>Fill matrix with AI</Btn>
      </div>
      <p className="hl-small" style={{ ...P0, marginTop: 12, height: AI.quotaH, whiteSpace: 'nowrap', visibility: quota ? undefined : 'hidden' }}>
        Compare: {quotaLine(compareUsed, 2)}
      </p>
      <p className="hl-small" style={{ ...P0, marginTop: 4, height: AI.quotaH, whiteSpace: 'nowrap', visibility: quota ? undefined : 'hidden' }}>
        Fill matrix: {quotaLine(fillUsed, 2)}
      </p>
      <div style={{ marginTop: 12, height: AI.statusH, position: 'relative', opacity: status ? clamp01(statusShow) : 0 }}>
        {status === 'comparing' ? (
          <p className="hl-small" role="status" style={P0}>
            <Icon name="clock" size={16} style={{ verticalAlign: '-3px', marginRight: 6 }} />
            Reading your papers and comparing them. This can take up to a minute.
          </p>
        ) : status === 'drafting' ? (
          <div className="hl-progress">
            <div className="hl-progress__top">
              <span className="hl-label">Drafting matrix cells</span>
              <span className="hl-num">{Math.floor(d + 1e-6)} of 4</span>
            </div>
            <div className="hl-progress__bar" role="progressbar" aria-valuemin={0} aria-valuemax={4} aria-valuenow={Math.floor(d)}>
              <div className="hl-progress__fill" style={{ ...NO_T, transform: `scaleX(${(d / 4).toFixed(4)})` }} />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};

// ---------------------------------------------------------------- comparison

export type CompareViewProps = {
  items?: number;       // 0..4 fractional: 0 synthesis, 1 agree, 2 differ, 3 gaps (default 4)
  synthChars?: number;  // stream the synthesis line (undefined = all)
  style?: React.CSSProperties;
};

const CMP_BLOCKS: Array<[string, string[]]> = [
  ['Where they agree', EBP.agreements],
  ['Where they differ', EBP.differences],
  ['Gaps the evidence leaves open', EBP.gaps],
];

/**
 * comparisonView() as a full-width card (height 232): "Comparison of 4 papers", the one-line
 * synthesis (20 px serif), then three columns with the product's labels and paper ids in teal mono,
 * and the product's footnote.
 */
export const CompareView: React.FC<CompareViewProps> = ({ items = 4, synthChars, style }) => (
  <section className="hl-card" aria-label="Paper comparison" style={{ display: 'block', height: EBP_LAYOUT.compareH, padding: '20px 24px', ...style }}>
    <p className="hl-label" style={{ ...P0, height: 21 }}>Comparison of {EBP.papers.length} papers</p>
    <p className="ebp-cmp-synth" style={{ marginTop: 12, height: 30, fontFamily: 'var(--font-serif)', fontSize: 20, lineHeight: 1.5, color: C.navy, whiteSpace: 'nowrap', ...rowIn(items, 0) }}>
      <IdText text={EBP.synthesis} chars={synthChars} />
    </p>
    <div style={{ marginTop: 16, height: 73, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 24 }}>
      {CMP_BLOCKS.map(([label, list], i) => (
        <div key={label} className="hl-stack ebp-cmp-block" style={{ gap: 4, alignContent: 'start', ...rowIn(items, i + 1) }}>
          <p className="hl-label" style={P0}>{label}</p>
          <ul className="ebp-cmp-list" style={{ height: 48 }}>
            {list.map((x, j) => <li key={j}><IdText text={x} /></li>)}
          </ul>
        </div>
      ))}
    </div>
    <p className="hl-small" style={{ ...P0, marginTop: 16, height: 21 }}>
      Compared on Oct 10, 2026. AI comparison of the text read; check it against the papers.
    </p>
  </section>
);

// ---------------------------------------------------------------- evidence matrix (full)

type PaperKey = 'design' | 'sample' | 'intervention' | 'outcomes' | 'findings' | 'limits' | 'level';
/** The product's column labels (modules/ebp/matrix.js), Aim/Citation/Grade/Notes hidden. */
const MATRIX_COLS: Array<{ key: PaperKey; label: string }> = [
  { key: 'design', label: 'Design' },
  { key: 'sample', label: 'Sample and setting' },
  { key: 'intervention', label: 'Intervention or exposure' },
  { key: 'outcomes', label: 'Outcome measures' },
  { key: 'findings', label: 'Key findings' },
  { key: 'limits', label: 'Limitations' },
  { key: 'level', label: 'Level' },
];

export const CASCADE_SPAN = 1.5;
export const MATRIX_CASCADE_END = (EBP.papers.length - 1) + (MATRIX_COLS.length - 1) + CASCADE_SPAN; // 10.5
export const COMPACT_CASCADE_END = (EBP.papers.length - 1) + 2 + CASCADE_SPAN;                         // 6.5
/** Progress 0..1 of fillable cell (r, c) for a cascade value (diagonal d = r + c starts at cascade = d). */
export const cascadeCell = (cascade: number, r: number, c: number) => clamp01((cascade - (r + c)) / CASCADE_SPAN);

export const DRAFT_TAG_FULL = 'AI draft · edit it into your own words';
export const DRAFT_TAG_SHORT = 'AI draft';

export type MatrixTableProps = {
  cascade?: number;     // 0..MATRIX_CASCADE_END, drive linearly (default: all drafted)
  rows?: number;        // 0..4 fractional row reveal (row heads + cell contents; structure stays)
  reveal?: number;      // 0..1 heading + lead entrance (default 1)
  tag?: 'full' | 'short' | 'none';   // draft tag text (default 'full', the product's)
  tint?: boolean;       // teal-tint flash as each cell fills (default true)
  style?: React.CSSProperties;
};

/** One drafted matrix cell: textarea-styled box (.hl-input.hl-textarea.ebp-cell) + the draft tag. */
const DraftCell: React.FC<{ text: string; p: number; tag: string | null; tint: boolean; vis?: React.CSSProperties }> = ({ text, p, tag, tint, vis }) => {
  const on = p > 0;
  const eText = EASE_OUT(clamp01(p / 0.6));
  const eTag = EASE_OUT(clamp01((p - 0.3) / 0.7));
  const eBorder = EASE_OUT(clamp01(p / 0.5));
  return (
    <div style={{ height: MX.cellH, fontSize: 12, lineHeight: 1, ...vis }}>
      <div
        className={`hl-input hl-textarea ebp-cell${on ? ' ebp-cell--draft' : ''}`}
        style={{
          ...NO_T, height: MX.boxH, minHeight: 0, padding: '6px 8px', fontSize: 15, lineHeight: 1.45, overflow: 'hidden',
          resize: 'none', color: C.navy, background: tint ? mixRgb(WHITE, TINT, flash(p) * 0.95) : C.white,
          borderColor: on ? mixRgb(FIELD, AMBER, eBorder) : undefined,
        }}
      >
        {on ? (
          <span style={{ display: 'block', opacity: eText, transform: eText < 1 ? `translateY(${((1 - eText) * 6).toFixed(3)}px)` : undefined }}>
            {cellText(text)}
          </span>
        ) : null}
      </div>
      {tag && on ? (
        <span
          className="ebp-draft-tag"
          style={{ lineHeight: 1.35, opacity: eTag, transform: eTag < 1 ? `translateY(${((1 - eTag) * 4).toFixed(3)}px)` : undefined }}
        >
          {tag}
        </span>
      ) : null}
    </div>
  );
};

/**
 * The full-tab evidence matrix (matrix.js matrixTable): navy header row, one row per paper, every cell
 * a textarea-styled box. Fixed column widths: Paper 117, then 7 × 159 (fits the 1232 column exactly).
 * Section height 690: h2 + lead (66), table ~624. Row pitch 141 px, header 58 px.
 */
export const MatrixTable: React.FC<MatrixTableProps> = ({ cascade = MATRIX_CASCADE_END, rows = 4, reveal: rv = 1, tag = 'full', tint = true, style }) => {
  const tagText = tag === 'full' ? DRAFT_TAG_FULL : tag === 'short' ? DRAFT_TAG_SHORT : null;
  const thStyle: React.CSSProperties = { ...NO_T, minWidth: 0, padding: '8px 10px' };
  return (
    <section aria-labelledby="ebp-h-matrix" style={{ height: EBP_LAYOUT.matrixH, ...style }}>
      <div style={reveal(rv)}>
        <h2 className="ebp-h2" id="ebp-h-matrix" style={{ height: 25 }}>Evidence matrix</h2>
        <p className="hl-small ebp-lead" style={{ ...P0, marginTop: 4, height: 21, fontSize: 14, lineHeight: 1.45, maxWidth: 'none' }}>
          One row per paper. Every cell holds your own words. Changes save as you type.
        </p>
      </div>
      <div className="hl-table-wrap ebp-matrix-wrap" role="region" aria-label="Evidence matrix" style={{ marginTop: 16, overflow: 'hidden', maxHeight: 'none' }}>
        <table className="hl-table hl-table--compact ebp-matrix" style={{ tableLayout: 'fixed', width: EBP_LAYOUT.colW - 2 }}>
          <colgroup>
            <col style={{ width: MX.headW }} />
            {MATRIX_COLS.map(c => <col key={c.key} style={{ width: MX.colW }} />)}
          </colgroup>
          <thead>
            <tr>
              {['Paper', ...MATRIX_COLS.map(c => c.label)].map(label => (
                <th key={label} scope="col" style={{ ...thStyle, position: 'static' }}>
                  <div style={{ height: MX.thInnerH, display: 'flex', alignItems: 'flex-end' }}>{label}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EBP.papers.map((p, r) => {
              const vis = rowIn(rows, r, 8);
              const [name, year] = p.short.split(' ');
              return (
                <tr key={p.id}>
                  <th scope="row" className="ebp-rowhead" style={{ ...thStyle, borderBottom: `1px solid ${C.hair}` }}>
                    <div style={{ margin: 0, height: MX.cellH, ...vis }}>
                      <span className="hl-num ebp-cmp-sid" style={{ display: 'block' }}>{p.id}</span>
                      <span className="ebp-rowlabel" style={{ display: 'block', marginTop: 4, lineHeight: 1.35 }}>{name}<br />{year}</span>
                    </div>
                  </th>
                  {MATRIX_COLS.map((c, ci) => (
                    <td key={c.key} style={{ ...thStyle }}>
                      <DraftCell text={p[c.key]} p={cascadeCell(cascade, r, ci)} tag={tagText} tint={tint} vis={vis} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------- Submission Pack

export type ExportKind = 'word' | 'excel' | 'csv';
export type ExportCardsProps = {
  exports?: number;     // 0..1 staggered reveal: heading 0–0.4, Word 0.2–0.6, Excel 0.4–0.8, CSV 0.6–1
  hover?: { kind: ExportKind; amount: number } | null;
  pressed?: { kind: ExportKind; amount: number } | null;
  used?: number;        // Word or Excel packs used this week (free plan: 1)
  status?: 'building' | 'downloading' | null;   // the product's slot text, right of the quota line
  statusShow?: number;  // 0..1 (eased by you)
  style?: React.CSSProperties;
};

const EXPORT_CARDS: Array<{ kind: ExportKind; title: string; text: string; button: string; primary: boolean }> = [
  { kind: 'word', title: 'Word', text: 'Landscape matrix, APA reference list, criteria summary and source links.', button: 'Download Word pack', primary: true },
  { kind: 'excel', title: 'Excel', text: 'Matrix, references, criteria and source links, one sheet each.', button: 'Download Excel workbook', primary: false },
  { kind: 'csv', title: 'CSV', text: 'Always free. Opens in Excel, Numbers or Google Sheets.', button: 'Download CSV', primary: false },
];

/** "Submission Pack": heading, the product's lead, Word / Excel / CSV cards in a row, quota line. Height 296. */
export const ExportCards: React.FC<ExportCardsProps> = ({ exports = 1, hover = null, pressed = null, used = 0, status = null, statusShow = 1, style }) => {
  const part = (k: number) => clamp01((exports - k * 0.2) / 0.4);
  return (
    <section aria-labelledby="ebp-h-pack" style={{ height: EBP_LAYOUT.exportH, ...style }}>
      <div style={reveal(part(0))}>
        <h2 className="ebp-h2" id="ebp-h-pack" style={{ height: 25 }}>Submission Pack</h2>
        <p className="ebp-lead" style={{ marginTop: 4, height: 48 }}>
          The Submission Pack holds your matrix, references, criteria and source links. It contains only what you wrote and chose.
        </p>
      </div>
      <div style={{ marginTop: 16, height: EX.cardH, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: EBP_LAYOUT.gap }}>
        {EXPORT_CARDS.map((c, i) => (
          <section key={c.kind} className="hl-card" aria-label={c.title} style={{ height: EX.cardH, padding: '20px 24px', ...reveal(part(i + 1)) }}>
            <h3 className="ebp-h3" style={{ height: 22 }}>{c.title}</h3>
            <p className="hl-small" style={{ ...P0, marginTop: 8, height: 41 }}>{c.text}</p>
            <div style={{ marginTop: 16, display: 'flex' }}>
              <Btn
                variant={c.primary ? 'primary' : 'secondary'} icon="download" width={EX.btnW[i]}
                hover={hover?.kind === c.kind ? hover.amount : 0} pressed={pressed?.kind === c.kind ? pressed.amount : 0}
              >
                {c.button}
              </Btn>
            </div>
          </section>
        ))}
      </div>
      <div style={{ marginTop: 12, height: 21, display: 'flex', justifyContent: 'space-between', gap: 24, ...reveal(part(3)) }}>
        <p className="hl-small" style={{ ...P0, whiteSpace: 'nowrap' }}>Word or Excel packs: {quotaLine(used, 1)}</p>
        <p className="hl-small" role="status" style={{ ...P0, whiteSpace: 'nowrap', opacity: status ? clamp01(statusShow) : 0 }}>
          {status === 'building' ? <><Icon name="clock" size={16} style={{ verticalAlign: '-3px', marginRight: 6 }} />Building the file…</> : null}
          {status === 'downloading' ? 'Your file is downloading.' : null}
        </p>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------- the page

export type EbpPageProps = {
  zoom?: number;        // CSS zoom; on-screen width = width × zoom
  width?: number;       // design width (default 1280; wider centres the 1280 column)
  height?: number;      // design height (default 800; pass contentHeight / zoom to fill)
  scrollY?: number;     // page CSS px
  header?: Omit<EbpHeaderProps, 'style'>;
  papers?: Omit<PapersListProps, 'style'>;
  ai?: Omit<AiHelpCardProps, 'style'>;
  compare?: number;     // 0..1 the comparison card grows in (eased by you); 0 = not there
  comparison?: Omit<CompareViewProps, 'style'>;
  matrix?: Omit<MatrixTableProps, 'style'>;
  exports?: Omit<ExportCardsProps, 'style'>;
  style?: React.CSSProperties;
};

/** The whole full-tab EBP page. See the header comment for layout and ebpPageGeometry() for targets. */
export const EbpPage: React.FC<EbpPageProps> = ({
  zoom = 1, width = EBP_LAYOUT.pageW, height = 800, scrollY = 0,
  header, papers, ai, compare = 0, comparison, matrix, exports, style,
}) => {
  const L = EBP_LAYOUT;
  const open = clamp01(compare);
  const fade = clamp01((open - 0.2) / 0.8);
  return (
    <div className="hl-canvas" style={{ position: 'absolute', left: 0, top: 0, width, height, zoom, overflow: 'hidden', background: C.paper, ...style }}>
      <main
        className="hl-page ebp-page"
        style={{ display: 'block', padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`, transform: scrollY ? `translateY(${(-scrollY).toFixed(3)}px)` : undefined }}
      >
        <EbpHeader {...header} />
        <div style={{ marginTop: L.gap, height: L.rowH, display: 'flex', gap: L.gap }}>
          <PapersList {...papers} style={{ width: L.papersW, height: L.rowH, flex: 'none' }} />
          <AiHelpCard {...ai} style={{ width: L.aiW, height: L.rowH, flex: 'none' }} />
        </div>
        {/* Comparison: grid 0fr → 1fr (height linear in `compare`), content fading in behind it. */}
        <div style={{ display: 'grid', gridTemplateRows: `${open.toFixed(4)}fr`, opacity: fade }}>
          <div style={{ minHeight: 0, overflow: open >= 1 ? 'visible' : 'hidden' }}>
            <div style={{ paddingTop: L.gap }}>
              {open > 0 ? <CompareView {...comparison} /> : <div style={{ height: L.compareH }} />}
            </div>
          </div>
        </div>
        <MatrixTable {...matrix} style={{ marginTop: L.gap }} />
        <ExportCards {...exports} style={{ marginTop: L.gap }} />
      </main>
    </div>
  );
};

// ---------------------------------------------------------------- compact matrix (short film)

/** Compact matrix layout at its 400 CSS px design width (zoom 2.25 => 900 px). */
export const MATRIX_COMPACT = {
  width: 400,
  cols: [82, 94, 142, 80] as const,   // Paper, Design, Findings, Level (+ 2 px wrap border = 400)
  padX: 8,
  padY: 7,
  headH: 32,       // header cell (7 + 18 + 7), then a 1 px rule
  cellH: 75,       // content height of every body cell
  rowPitch: 90,    // 1 + 7 + 75 + 7
  height: 394,
  text: 13.5,      // CSS px (× 2.25 = 30.4 px)
} as const;

export type MatrixCompactProps = {
  cascade?: number;    // 0..COMPACT_CASCADE_END, drive linearly (default: all drafted)
  rows?: number;       // 0..4 fractional row reveal (contents; the table structure stays)
  zoom?: number;       // total zoom applied to the 400 CSS px design (default 2.25 => 900 px wide)
  width?: number;      // CSS px of the slot it sits in (default 400; 368 inside PanelFrame)
  tint?: boolean;      // teal-tint flash as each cell fills (default true)
  empty?: 'blank' | 'notSet';   // empty cells: blank (default) or the product's "Not set"
  style?: React.CSSProperties;
};

/**
 * Cell (r, c) content box in screen px relative to the component's top-left. c: 0 Paper, 1 Design,
 * 2 Findings, 3 Level (fillable c' = c − 1 for cascadeCell).
 */
export function matrixCompactGeometry(zoom = 2.25, width = 400) {
  const M = MATRIX_COMPACT;
  const s = zoom * (width / M.width);
  const colX = (c: number) => 1 + M.cols.slice(0, c).reduce((a, b) => a + b, 0);
  const cell = (r: number, c: number) => {
    const x = colX(c) + M.padX, y = 1 + M.headH + 1 + M.padY + M.rowPitch * r;
    return box(x * s, y * s, (M.cols[c] - 2 * M.padX) * s, M.cellH * s);
  };
  return { scale: s, width: M.width * s, height: M.height * s, headerH: (1 + M.headH + 1) * s, cell };
}

const COMPACT_COLS: Array<{ key: 'design' | 'findings' | 'level'; label: string }> = [
  { key: 'design', label: 'Design' },
  { key: 'findings', label: 'Findings' },
  { key: 'level', label: 'Level' },
];

/** The phone-friendly matrix: 4 papers × Paper, Design, Findings, Level; navy header, product table classes. */
export const MatrixCompact: React.FC<MatrixCompactProps> = ({
  cascade = COMPACT_CASCADE_END, rows = 4, zoom = 2.25, width = 400, tint = true, empty = 'blank', style,
}) => {
  const M = MATRIX_COMPACT;
  const txt: React.CSSProperties = { fontFamily: 'var(--font-serif)', fontSize: M.text, lineHeight: 1.3, color: C.navy };
  const cellPad = `${M.padY}px ${M.padX}px`;
  return (
    <div className="hl-canvas" style={{ width: M.width, zoom: zoom * (width / M.width), background: 'transparent', ...style }}>
      <div className="hl-table-wrap" role="region" aria-label="Evidence matrix" style={{ overflow: 'hidden' }}>
        <table className="hl-table hl-table--compact" style={{ tableLayout: 'fixed', width: M.width - 2 }}>
          <colgroup>
            {M.cols.map((w, i) => <col key={i} style={{ width: w }} />)}
          </colgroup>
          <thead>
            <tr>
              {['Paper', ...COMPACT_COLS.map(c => c.label)].map(label => (
                <th key={label} scope="col" style={{ ...NO_T, padding: cellPad, fontSize: M.text, lineHeight: 1.3 }}>
                  <div style={{ height: M.headH - 2 * M.padY }}>{label}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EBP.papers.map((p, r) => {
              const base = r % 2 === 1 ? PAPER : WHITE;  // .hl-table tbody tr:nth-child(even) td
              const vis = rowIn(rows, r, 10);
              const [name, year] = p.short.split(' ');
              return (
                <tr key={p.id}>
                  <td style={{ ...NO_T, padding: cellPad, verticalAlign: 'top' }}>
                    <div style={{ height: M.cellH, ...vis }}>
                      <span className="hl-num ebp-cmp-sid" style={{ display: 'block', fontSize: 12, lineHeight: 1.3 }}>{p.id}</span>
                      <span style={{ display: 'block', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: M.text, lineHeight: 1.3, color: C.navy }}>
                        {name}<br />{year}
                      </span>
                    </div>
                  </td>
                  {COMPACT_COLS.map((c, ci) => {
                    const pr = cascadeCell(cascade, r, ci);
                    const on = pr > 0;
                    const eText = EASE_OUT(clamp01(pr / 0.6));
                    const eTag = EASE_OUT(clamp01((pr - 0.3) / 0.7));
                    const [lvl, fit] = p.level.split(' · ');
                    return (
                      <td key={c.key} style={{ ...NO_T, padding: cellPad, verticalAlign: 'top', background: tint ? mixRgb(base, TINT, flash(pr) * 0.95) : undefined }}>
                        <div style={{ height: M.cellH, position: 'relative', fontSize: 12, lineHeight: 1, ...vis }}>
                          {empty === 'notSet' && eText < 1 ? (
                            <span className="hl-small" style={{ position: 'absolute', left: 0, top: 0, fontSize: 12.5, opacity: 1 - eText }}>Not set</span>
                          ) : null}
                          {on ? (
                            <div style={{ ...txt, opacity: eText, transform: eText < 1 ? `translateY(${((1 - eText) * 8).toFixed(3)}px)` : undefined }}>
                              {c.key === 'level'
                                ? <><span style={{ display: 'block', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>{lvl}</span><span style={{ display: 'block', color: C.slate }}>{fit}</span></>
                                : cellText(p[c.key])}
                            </div>
                          ) : null}
                          {on ? (
                            <span className="ebp-draft-tag" style={{ lineHeight: 1.3, opacity: eTag, transform: eTag < 1 ? `translateY(${((1 - eTag) * 4).toFixed(3)}px)` : undefined }}>
                              {DRAFT_TAG_SHORT}
                            </span>
                          ) : null}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
