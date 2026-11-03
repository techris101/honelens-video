/**
 * Analyze tab content, drawn with the product's own classes and markup
 * (src/sidepanel/screens/analyze.js, src/styles/screens/analyze.css, src/ui/rich.js, src/ui/kit.js).
 * Render INSIDE <PanelFrame section="Analyze"> (panel 400 CSS px, 16 px gutters => 368 px content).
 *
 * All components are pure and presentational: no useCurrentFrame. Every animated aspect is a numeric
 * prop, so scenes drive them with progress()/lin() from their own timing.
 *
 *   <PanelFrame section="Analyze" zoom={2.25} scrollY={y}>
 *     <AnalyzeScreen state={{
 *       facts: { lines: 2.4 },                       // byline, ids, chips row (fractional)
 *       sections: 1,                                 // only the summary card is in
 *       summary: { oneChars: 40, para: 0 },          // one-sentence line writing itself
 *     }} />
 *   </PanelFrame>
 *
 * Or compose the parts yourself (each accepts `style` on its root, e.g. for a Highlight-like tint):
 *   AnalyzeHeader, AnalyzeFacts, SummaryCard, PicoList, ItemList, AskBox, AnalyzeFooter.
 * When composing by hand, mirror the product's containers to get its spacing:
 *   <div><AnalyzeHeader/></div>                    (PanelFrame's .hl-screen gives 24 px after it)
 *   <div className="hl-stack hl-an">                 (24 px between facts and the AI part)
 *     <AnalyzeFacts/>
 *     <div className="hl-stack"> summary, pico, lists, ask, footer </div>   (12 px between sections)
 *   </div>
 *
 * Conventions
 * - Fractional list reveals: rows={2.4} => rows 0 and 1 fully in, row 2 at 40 % of its entrance
 *   (opacity + 12 px rise, EASE_OUT on clamp(rows - i, 0, 1)), later rows invisible. Hidden rows KEEP
 *   their layout space, so nothing below jumps. The same applies to `lines`, `chips`, `sections`.
 * - Streaming / typing: `*Chars` props show that many characters; the rest is rendered with
 *   visibility:hidden so the final layout is reserved from the first frame (no reflow while text
 *   writes itself). A streamed block with chars <= 0 shows the product's "Writing…" status instead.
 * - Expansion (Explain more, item dives, the chat area, the chat log): a CSS grid wrapper animated
 *   from grid-template-rows 0fr to 1fr by an `open`-style 0..1 prop (height is linear in the prop, so
 *   pass an eased value), content fading in slightly behind the height. This one DOES grow the
 *   layout: everything below moves down smoothly.
 * - Presses: `pressed` 0..1 scales the control to 0.98 and switches to the product's pressed colors
 *   above 0.5. No CSS transitions anywhere (inline transition:none on every product control).
 *
 * Approximate geometry (panel CSS px, from the top of the body content at scrollY 0; estimated from
 * Plex font metrics, so allow ±10 % and frame generously): header 0–47 · facts 71–226 (byline wraps
 * to 2 lines; the chips sit on 2 rows) · summary card 250–690 (Explain more open adds ~430) ·
 * PICO 700–925 · limitations 935–1170 (first dive open adds ~250) · biases and conflicts 1180–1575 ·
 * "Anything else?" button 1587–1635 (chat area open adds ~335; the answered log adds ~155 above the
 * suggestions) · footer 1647–1770. The body content starts 100 px below the panel top
 * (84 px app bar + 16 px body padding), so on screen: y = top + (100 + y_body - scrollY) * zoom.
 */
import React from 'react';
import { C } from '../../brand/colors';
import { EASE_OUT } from '../../motion/ease';
import { ANALYSIS, ARTICLE, SOURCE_CHECK } from '../../data/demo';
import { Icon } from '../Icon';
import type { IconName } from '../icon-paths';
import '../css/honelens.css';

// ---------------------------------------------------------------- helpers

const clamp01 = (x: number) => (!(x > 0) ? 0 : x >= 1 ? 1 : x);

/** Entrance style for a 0..1 progress: opacity + rise, EASE_OUT. Undefined once fully in. */
export const revealStyle = (p: number, rise = 12): React.CSSProperties | undefined => {
  const c = clamp01(p);
  if (c >= 1) return undefined;
  const e = EASE_OUT(c);
  return { opacity: e, transform: `translateY(${(1 - e) * rise}px)` };
};

/** Row i of a fractional reveal count (see header). */
export const rowReveal = (count: number, i: number, rise = 12) => revealStyle(count - i, rise);

const NO_TX: React.CSSProperties = { transition: 'none' };

/** Height-animated container (grid 0fr -> 1fr). `open` is used as given: pass an eased value. */
const Expand: React.FC<{ open: number; children: React.ReactNode }> = ({ open, children }) => {
  const p = clamp01(open);
  const fade = clamp01((p - 0.2) / 0.8);
  return (
    <div style={{ display: 'grid', gridTemplateRows: `${p}fr`, opacity: fade }}>
      {/* overflow is released when fully open so focus rings and outlines are not clipped */}
      <div style={{ minHeight: 0, overflow: p >= 1 ? 'visible' : 'hidden' }}>{children}</div>
    </div>
  );
};

/** Steady text caret that takes no width (never changes line breaks). */
const Caret: React.FC<{ color?: string }> = ({ color = C.teal }) => (
  <span style={{ position: 'relative' }}>
    <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: color }} />
  </span>
);

/** First `chars` characters visible, the rest present but hidden so layout stays stable. */
const Stream: React.FC<{ text: string; chars?: number; caret?: boolean }> = ({ text, chars, caret = false }) => {
  const n = chars === undefined ? text.length : Math.max(0, Math.min(text.length, Math.floor(chars)));
  if (n >= text.length && !caret) return <>{text}</>;
  return (
    <>
      {text.slice(0, n)}
      {caret ? <Caret /> : null}
      {n < text.length ? <span style={{ visibility: 'hidden' }}>{text.slice(n)}</span> : null}
    </>
  );
};

/** The product's status line (analyze.js status()): clock icon + text. */
const Status: React.FC<{ text: string; style?: React.CSSProperties }> = ({ text, style }) => (
  <p className="hl-small hl-an-status" role="status" style={style}>
    <Icon name="clock" size={16} /> {text}
  </p>
);

/** One block of AI rich text (rich.js): a bold label line or a paragraph. */
export type RichBlock = ['label' | 'p', string];
const richLength = (blocks: RichBlock[]) => blocks.reduce((n, [, t]) => n + t.length, 0);

/**
 * renderRich() output (div.hl-rich, p.hl-rich__label, p) with streaming. chars counts across all
 * blocks in order (labels included). chars <= 0 shows "Writing…" over the reserved space.
 */
const Rich: React.FC<{ blocks: RichBlock[]; chars?: number }> = ({ blocks, chars }) => {
  const waiting = chars !== undefined && chars <= 0;
  let left = chars === undefined ? Number.POSITIVE_INFINITY : Math.max(0, Math.floor(chars));
  return (
    <div style={{ position: 'relative' }}>
      <div className="hl-rich" style={waiting ? { visibility: 'hidden' } : undefined}>
        {blocks.map(([kind, text], i) => {
          const n = Math.min(text.length, left);
          left -= n;
          return (
            <p key={i} className={kind === 'label' ? 'hl-rich__label' : undefined}>
              <Stream text={text} chars={n} />
            </p>
          );
        })}
      </div>
      {waiting ? <Status text="Writing…" style={{ position: 'absolute', left: 0, top: 0 }} /> : null}
    </div>
  );
};

type BtnProps = {
  variant: 'primary' | 'secondary' | 'quiet';
  sm?: boolean;
  block?: boolean;
  icon?: IconName;
  iconRotate?: number;
  pressed?: number;
  disabled?: boolean;
  className?: string;
  expanded?: boolean;
  style?: React.CSSProperties;
  children: React.ReactNode;
};
/** kit.js button(): hl-btn hl-btn--<variant> [hl-btn--sm] [hl-btn--block], icon then label. */
const Btn: React.FC<BtnProps> = ({ variant, sm, block, icon, iconRotate = 0, pressed = 0, disabled, className, expanded, style, children }) => {
  const p = clamp01(pressed);
  const cls = ['hl-btn', `hl-btn--${variant}`, sm && 'hl-btn--sm', block && 'hl-btn--block', p > 0.5 && 'is-active', className]
    .filter(Boolean).join(' ');
  return (
    <button
      type="button" className={cls} disabled={disabled} aria-expanded={expanded}
      style={{ ...NO_TX, transform: p > 0 ? `scale(${1 - 0.02 * p})` : undefined, ...style }}
    >
      {icon ? <Icon name={icon} size={16} style={iconRotate ? { transform: `rotate(${iconRotate}deg)` } : undefined} /> : null}
      {children}
    </button>
  );
};

/** White card -> teal tint (the product's one attention effect, ui.highlight()). */
const tintBg = (t: number) => {
  const k = clamp01(t);
  return `rgb(${Math.round(255 - 28 * k)}, ${Math.round(255 - 15 * k)}, ${Math.round(255 - 14 * k)})`;
};

// ---------------------------------------------------------------- content (from data/demo.ts)

const firstAuthor = ARTICLE.authors.split(',')[0].trim().split(/\s+/).pop() || '';
const authorCount = ARTICLE.authors.split(',').length;
/** factsView().byline: first author (et al.) · journal · year. */
export const FACTS_BYLINE = `${firstAuthor}${authorCount > 2 ? ' et al.' : ''} · ${ARTICLE.journal} · ${ARTICLE.year}`;
export const FACTS_IDS = `DOI ${ARTICLE.doi} · PMID ${ARTICLE.pmid}`;
const UPDATE_LINE = SOURCE_CHECK.rows.find(r => r.label === 'Updates')?.value
  ?? 'No matching update record found in Crossref on Oct 10, 2026.';

type FactChipDef = { cls: string; icon: IconName; text: string };
/** drawFacts() chips, in product order: study type (plain), update check (unknown), open access (match). */
export const FACT_CHIPS: FactChipDef[] = [
  { cls: 'hl-chip--confirmed', icon: 'info', text: ARTICLE.studyType },
  { cls: 'hl-chip--unknown', icon: 'check', text: 'No update record found' },
  { cls: 'hl-chip--match', icon: 'check', text: 'Free full text' },
];

const MEANING_FACTS = 'Identifiers, journal, publisher and study type come from the page’s citation tags and from PubMed and Crossref. “No update record found” is a limited database result. Open access comes from Europe PMC.';
const MEANING_AI = 'The summary, PICO, limitations and biases are written by the AI provider you connected, from the text shown under “Read from”. Quotes appear only when HoneLENS found them word for word in that text. Check anything you use against the article.';

export const EXPLAIN_BLOCKS: RichBlock[] = ANALYSIS.explainMore.flatMap(([l, t]): RichBlock[] => [['label', l], ['p', t]]);

const PICO_WORD: Record<string, string> = { P: 'Population', I: 'Intervention', C: 'Comparison', O: 'Outcome' };

/**
 * Deep dives (the expanded text under a limitation or bias). The product streams these from the AI
 * (deepDivePrompt: what it is, why it matters); these are short, film-length versions written only
 * from facts in data/demo.ts. Index-aligned with ANALYSIS.limitations / ANALYSIS.biases.
 */
export const DIVES: Record<'limitations' | 'biases', RichBlock[][]> = {
  limitations: [
    [
      ['label', 'What it is'],
      ['p', 'The people who recorded readmissions knew which patients had the teaching.'],
      ['label', 'Why it matters'],
      ['p', 'That knowledge can sway borderline calls, so the gap between 15.0% and 23.8% may look larger than it is. In an appraisal, call it a risk of detection bias.'],
    ],
    [
      ['label', 'What it is'],
      ['p', 'Readmissions were counted for 30 days after discharge.'],
      ['label', 'Why it matters'],
      ['p', 'The trial cannot show whether the benefit lasts. Note this when you compare it with longer studies.'],
    ],
    [
      ['label', 'What it is'],
      ['p', 'All 412 patients came from three US hospitals in one region.'],
      ['label', 'Why it matters'],
      ['p', 'Results may differ in other settings. Say so when you apply them to your own unit.'],
    ],
  ],
  biases: [
    [
      ['label', 'What it is'],
      ['p', 'CardioHome Inc., which makes home monitoring devices, paid for the trial.'],
      ['label', 'Why it matters'],
      ['p', 'A funder with products to sell can shape which questions are asked and how results are framed. Name the funder in your appraisal.'],
    ],
    [
      ['label', 'What it is'],
      ['p', 'Two authors report consulting fees from the funder.'],
      ['label', 'Why it matters'],
      ['p', 'Paid ties can lean interpretation toward the funder. The article discloses them, so you can weigh them.'],
    ],
    [
      ['label', 'What it is'],
      ['p', 'Patients reported for themselves whether they followed the teaching plan.'],
      ['label', 'Why it matters'],
      ['p', 'Self-reports tend to run high, so how closely patients followed the plan is less certain.'],
    ],
  ],
};

/** Footer line as drawAnalysis() writes it (basedOn "full", provider Google Gemini). */
export const FOOTER_TEXT = 'Read from the full text on this page by Google Gemini (gemini-3.5-flash) on Oct 10, 2026.';

// ---------------------------------------------------------------- header

export type AnalyzeHeaderProps = { kicker?: string; title?: string; style?: React.CSSProperties };
/** anHeader(): kicker + title with the quieter Analyze title size (19 px). */
export const AnalyzeHeader: React.FC<AnalyzeHeaderProps> = ({ kicker = 'Analyze', title = 'Understand this article in a minute.', style }) => (
  <header className="hl-head hl-an-head" style={style}>
    <p className="hl-kicker">{kicker}</p>
    <h1 className="hl-title">{title}</h1>
  </header>
);

// ---------------------------------------------------------------- facts

export type AnalyzeFactsProps = {
  /**
   * Fractional reveal of the facts' blocks in product order.
   * compact: 0 byline, 1 DOI/PMID line, 2 chips row.
   * full:    0 byline, 1 publisher, 2 DOI/PMID, 3 chips row, 4 Crossref line, 5 free full text link,
   *          6 "What these checks mean". Default: all in.
   */
  lines?: number;
  /** Fractional reveal of the chips one by one (0 study type, 1 update check, 2 free full text).
   *  Omit to let the chips row enter as one block with `lines`. */
  chips?: number;
  detail?: 'compact' | 'full';
  style?: React.CSSProperties;
};

/** The facts header (drawFacts): byline, identifiers in mono, status chips, hairline under. */
export const AnalyzeFacts: React.FC<AnalyzeFactsProps> = ({ lines = Number.POSITIVE_INFINITY, chips, detail = 'compact', style }) => {
  const full = detail === 'full';
  const chipRow = (s?: React.CSSProperties) => (
    <div className="hl-an-chips" style={chips === undefined ? s : undefined}>
      {FACT_CHIPS.map((c, k) => (
        <span key={k} className={`hl-chip ${c.cls}`} style={chips === undefined ? undefined : rowReveal(chips, k)}>
          <Icon name={c.icon} size={16} />
          <span className="hl-chip__text">{c.text}</span>
        </span>
      ))}
    </div>
  );
  const blocks: Array<[string, (s?: React.CSSProperties) => React.ReactNode]> = [
    ['byline', s => <p className="hl-an-byline" style={s}>{FACTS_BYLINE}</p>],
  ];
  if (full) blocks.push(['publisher', s => <p className="hl-small" style={s}>Publisher: {ARTICLE.publisher}</p>]);
  blocks.push(['ids', s => <p className="hl-num hl-an-ids" style={s}>{FACTS_IDS}</p>]);
  blocks.push(['chips', chipRow]);
  if (full) {
    blocks.push(['checked', s => <p className="hl-small" style={s}>{UPDATE_LINE}</p>]);
    blocks.push(['open', s => (
      <p className="hl-small" style={s}>
        <a className="hl-link">Open the free full text<Icon name="external" size={16} /></a>
      </p>
    )]);
    blocks.push(['meaning', s => (
      <details className="hl-an-meaning" style={s}>
        <summary>What these checks mean</summary>
        <div className="hl-callout hl-callout--note"><p><span className="hl-callout__label">What this check means.</span>{MEANING_FACTS}</p></div>
      </details>
    )]);
  }
  // The hairline under the facts lands with the first line.
  const rule = EASE_OUT(clamp01(lines));
  return (
    <section className="hl-an-facts" aria-label="Article facts" style={{ borderBottomColor: `rgba(211, 209, 199, ${rule})`, ...style }}>
      {blocks.map(([key, draw], i) => <React.Fragment key={key}>{draw(rowReveal(lines, i))}</React.Fragment>)}
    </section>
  );
};

// ---------------------------------------------------------------- summary

export type SummaryCardProps = {
  /** Characters of the one-sentence line shown (streams in place). Default: all. */
  oneChars?: number;
  /** 0..1 entrance of the short paragraph (keeps its space). Default 1. */
  para?: number;
  /** 0..1 entrance of the Explain more button. Default 1. */
  button?: number;
  /** 0..1 press on the Explain more / Show less button. */
  pressed?: number;
  /** true => the button reads "Show less" (chevron, pointing up). */
  expanded?: boolean;
  /** 0..1 height reveal of the Explain more section (grows the card). Default 0. */
  explain?: number;
  /** Characters of the Explain more text shown (labels count). <= 0 shows "Writing…". Default: all. */
  explainChars?: number;
  /** 0..1 teal tint over the card (the product highlights the summary when it lands). */
  tint?: number;
  style?: React.CSSProperties;
};

/** Summary card: heading, one-sentence line, short paragraph, Explain more with labelled sections. */
export const SummaryCard: React.FC<SummaryCardProps> = ({
  oneChars, para = 1, button = 1, pressed = 0, expanded = false, explain = 0, explainChars, tint = 0, style,
}) => (
  <section className="hl-card hl-stack hl-an-summary" aria-label="Summary" style={{ background: tint > 0 ? tintBg(tint) : undefined, ...style }}>
    <h2 className="hl-an-h">Summary</h2>
    <p className="hl-an-one"><Stream text={ANALYSIS.oneSentence} chars={oneChars} /></p>
    <p className="hl-an-para" style={revealStyle(para)}>{ANALYSIS.summary}</p>
    {/* Button and the Explain more host share one grid item, so the closed host adds no gap. */}
    <div>
      <div style={revealStyle(button)}>
        <Btn variant="secondary" sm icon={expanded ? 'chevron' : 'plus'} iconRotate={expanded ? 180 : 0} pressed={pressed} expanded={expanded}>
          {expanded ? 'Show less' : 'Explain more'}
        </Btn>
      </div>
      <Expand open={explain}>
        <div style={{ paddingTop: 12 }}>
          <div className="hl-an-more">
            <Rich blocks={EXPLAIN_BLOCKS} chars={explainChars} />
          </div>
        </div>
      </Expand>
    </div>
  </section>
);
/** Total characters of the Explain more text, for timing explainChars. */
export const EXPLAIN_LENGTH = richLength(EXPLAIN_BLOCKS);

// ---------------------------------------------------------------- PICO

export type PicoListProps = {
  /** 0..1 entrance of the "PICO" heading. Default 1. */
  heading?: number;
  /** Fractional reveal of the rows (0 Population, 1 Intervention, 2 Comparison, 3 Outcome). */
  rows?: number;
  /** Show the product's "Design as reported: …" line under the list. Default false. */
  design?: boolean;
  style?: React.CSSProperties;
};

/** The PICO definition list (dt in teal sans, dd in serif). */
export const PicoList: React.FC<PicoListProps> = ({ heading = 1, rows = Number.POSITIVE_INFINITY, design = false, style }) => (
  <section className="hl-stack" aria-label="PICO" style={style}>
    <h2 className="hl-an-h" style={revealStyle(heading)}>PICO</h2>
    <dl className="hl-an-pico">
      {ANALYSIS.pico.map(([k, v], i) => {
        const s = rowReveal(rows, i);
        return (
          <React.Fragment key={k}>
            <dt style={s}>{PICO_WORD[k] ?? k}</dt>
            <dd style={s}>{v}</dd>
          </React.Fragment>
        );
      })}
    </dl>
    {design ? <p className="hl-small" style={rowReveal(rows, ANALYSIS.pico.length)}>Design as reported: {ARTICLE.studyType}</p> : null}
  </section>
);

// ---------------------------------------------------------------- limitations, biases and conflicts

export type ItemListProps = {
  kind: 'limitations' | 'biases';
  /** Heading text. Default "Limitations" / "Biases and conflicts". */
  title?: string;
  /** 0..1 entrance of the heading and the list's top rule. Default 1. */
  heading?: number;
  /** Fractional reveal of the rows. Default: all. */
  rows?: number;
  /** Row under the cursor (product hover background). */
  hoverIndex?: number;
  /** Row being clicked, with `pressed` 0..1 (pressed background above 0.5). */
  pressedIndex?: number;
  pressed?: number;
  /** Expanded row and its 0..1 expansion (chevron turns, the dive with its teal bar grows open). */
  openIndex?: number;
  open?: number;
  /** Characters of the open row's dive text shown (labels count). <= 0 shows "Writing…". Default: all. */
  diveChars?: number;
  /**
   * Quote line ("find on the page" button, italic serif, teal search icon). The product shows it
   * under every item that has a quote at all times ('always', default). 'open' reveals it only with
   * the item's expansion.
   */
  quotes?: 'always' | 'open';
  /** Quote that the cursor is on: hover underline, press 0..1, teal tint 0..1. Default: openIndex, else 0. */
  quoteIndex?: number;
  quoteHover?: boolean;
  quotePressed?: number;
  quoteTint?: number;
  style?: React.CSSProperties;
};

/** Quote button (quoteLink()): search icon in teal + the quote in curly quotes. */
const QuoteButton: React.FC<{ quote: string; hover?: boolean; pressed?: number; tint?: number }> = ({ quote, hover = false, pressed = 0, tint = 0 }) => {
  const p = clamp01(pressed);
  const t = clamp01(tint);
  const underline = hover || p > 0;
  return (
    <button
      type="button" className="hl-an-quote" title="Find this passage on the page"
      style={{
        ...NO_TX,
        transform: p > 0 ? `scale(${1 - 0.02 * p})` : undefined,
        transformOrigin: 'left center',
        background: t > 0 ? `rgba(227, 240, 241, ${t})` : undefined,
        boxShadow: t > 0 ? `0 0 0 4px rgba(227, 240, 241, ${t})` : undefined,
      }}
    >
      <Icon name="search" size={16} />
      <span style={underline ? { textDecoration: 'underline', textUnderlineOffset: 3, textDecorationColor: C.teal } : undefined}>
        {`“${quote}”`}
      </span>
    </button>
  );
};

/** Limitations, or Biases and conflicts (with Funding / Conflict / Bias tags). Each row expands. */
export const ItemList: React.FC<ItemListProps> = ({
  kind, title, heading = 1, rows = Number.POSITIVE_INFINITY, hoverIndex = -1, pressedIndex = -1, pressed = 0,
  openIndex = -1, open = 0, diveChars, quotes = 'always', quoteIndex, quoteHover = false, quotePressed = 0, quoteTint = 0, style,
}) => {
  const biases = kind === 'biases';
  const items: Array<{ kind?: string; text: string; quote: string }> = biases ? ANALYSIS.biases : ANALYSIS.limitations;
  const dives = DIVES[kind];
  const qIndex = quoteIndex ?? (openIndex >= 0 ? openIndex : 0);
  const h = EASE_OUT(clamp01(heading));
  return (
    <section className="hl-stack" aria-label={title ?? (biases ? 'Biases and conflicts' : 'Limitations')} style={style}>
      <h2 className="hl-an-h" style={revealStyle(heading)}>{title ?? (biases ? 'Biases and conflicts' : 'Limitations')}</h2>
      <div className="hl-an-items" style={h < 1 ? { borderTopColor: `rgba(211, 209, 199, ${h})` } : undefined}>
        {items.map((it, i) => {
          const o = i === openIndex ? clamp01(open) : 0;
          const isPressed = i === pressedIndex && pressed > 0.5;
          const bg = isPressed ? 'var(--hl-surface-pressed)' : i === hoverIndex || (i === pressedIndex && pressed > 0) ? 'var(--hl-surface-hover)' : undefined;
          const quote = it.quote ? (
            <div className="hl-an-itemquote">
              <QuoteButton
                quote={it.quote}
                hover={i === qIndex && quoteHover}
                pressed={i === qIndex ? quotePressed : 0}
                tint={i === qIndex ? quoteTint : 0}
              />
            </div>
          ) : null;
          return (
            <div key={i} className="hl-an-itemwrap" style={rowReveal(rows, i)}>
              <button type="button" className="hl-an-item" aria-expanded={o >= 0.5} style={{ ...NO_TX, background: bg }}>
                <span className="hl-an-item__text">
                  {biases && it.kind ? <span className={`hl-an-kind hl-an-kind--${it.kind.toLowerCase()}`}>{it.kind}</span> : null}
                  <span>{it.text}</span>
                </span>
                <Icon name="chevron" size={16} style={{ ...NO_TX, transform: o > 0 ? `rotate(${o * 180}deg)` : 'none' }} />
              </button>
              {quote ? (quotes === 'open' ? <Expand open={o}>{quote}</Expand> : quote) : null}
              <Expand open={o}>
                <div className="hl-an-dive">
                  <Rich blocks={dives[i] ?? []} chars={i === openIndex ? diveChars : undefined} />
                </div>
              </Expand>
            </div>
          );
        })}
      </div>
    </section>
  );
};
/** Characters of a dive's text, for timing diveChars. */
export const diveLength = (kind: 'limitations' | 'biases', index: number) => richLength(DIVES[kind][index] ?? []);

// ---------------------------------------------------------------- Anything else?

export type AskBoxProps = {
  /** 'button' = only the teal button; 'open' = button + chat area. `open` overrides with 0..1. */
  mode?: 'button' | 'open';
  open?: number;
  /** 0..1 press on "Anything else?". */
  pressed?: number;
  question?: string;
  /** Characters of the question typed into the field (before it is sent). Default 0 (placeholder). */
  typed?: number;
  /** Focus ring on the field. Default: while the chat area is fully open and nothing was sent. */
  focused?: boolean;
  /** Steady caret in the field. Default: whenever the field is focused. */
  caret?: boolean;
  /** 0..1: the question moves into the chat log (log grows open), the field clears at once. */
  sent?: number;
  answer?: string;
  /** Characters of the streamed answer shown. <= 0 shows "Writing…". Default: all. */
  answerChars?: number;
  suggestions?: string[];
  /** Fractional reveal of the suggestion chips. Default: all. */
  chips?: number;
  /** 0..1 press on the "Ask" button (when sending by click instead of Ctrl+Enter). */
  askPressed?: number;
  style?: React.CSSProperties;
};

/** "Anything else?": full-width teal button, then the chat area (log, suggestions, field, Ask). */
export const AskBox: React.FC<AskBoxProps> = ({
  mode = 'button', open, pressed = 0, question = ANALYSIS.chat.question, typed = 0, focused, caret, sent = 0,
  answer = ANALYSIS.chat.answer, answerChars, suggestions = ANALYSIS.chat.suggestions, chips = Number.POSITIVE_INFINITY,
  askPressed = 0, style,
}) => {
  const o = clamp01(open ?? (mode === 'open' ? 1 : 0));
  const s = clamp01(sent);
  const isFocused = focused ?? (o >= 1 && s <= 0);
  const showCaret = caret ?? isFocused;
  const n = s > 0 ? 0 : Math.max(0, Math.min(question.length, Math.floor(typed)));
  return (
    <div style={style}>
      <Btn variant="primary" block icon="search" className="hl-an-anything" pressed={pressed} expanded={o >= 0.5}>
        Anything else?
      </Btn>
      <Expand open={o}>
        <div style={{ paddingTop: 12 }}>
          {/* chat log: the product's first child of the chat area (hidden while empty) */}
          <Expand open={s}>
            <div style={{ paddingBottom: 12 }}>
              <div className="hl-an-chatlog" aria-live="polite">
                <p className="hl-an-q"><span className="hl-sr">You asked: </span>{question}</p>
                <div className="hl-an-a"><Rich blocks={[['p', answer]]} chars={answerChars} /></div>
              </div>
            </div>
          </Expand>
          <div className="hl-stack">
            {suggestions.length ? (
              <div className="hl-an-suggest">
                {suggestions.map((q, i) => (
                  <button key={i} type="button" className="hl-chip hl-chip--action hl-an-suggest__chip" style={{ ...NO_TX, ...rowReveal(chips, i) }}>
                    {q}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="hl-field">
              <label className="hl-label">Ask anything about this article</label>
              <div className={`hl-input hl-textarea${isFocused ? ' is-focus' : ''}`} role="textbox" style={{ ...NO_TX, whiteSpace: 'pre-wrap' }}>
                {n > 0 ? (
                  <Stream text={question} chars={n} caret={showCaret} />
                ) : (
                  <>
                    {showCaret ? <Caret /> : null}
                    <span style={{ color: C.slate }}>For example: what was the sample size?</span>
                  </>
                )}
              </div>
            </div>
            <div className="hl-inline">
              <Btn variant="primary" icon="arrow" pressed={askPressed}>Ask</Btn>
              <Btn variant="quiet" sm>Clear the conversation</Btn>
            </div>
            <p className="hl-small">Answers come from this article’s text. Press Ctrl and Enter to send.</p>
          </div>
        </div>
      </Expand>
    </div>
  );
};

// ---------------------------------------------------------------- footer

export type AnalyzeFooterProps = { text?: string; style?: React.CSSProperties };
/** "Read from … by …", "About this reading" and "Read it again". */
export const AnalyzeFooter: React.FC<AnalyzeFooterProps> = ({ text = FOOTER_TEXT, style }) => (
  <div className="hl-an-foot" style={style}>
    <p className="hl-small">{text}</p>
    <details className="hl-an-meaning">
      <summary>About this reading</summary>
      <div className="hl-callout hl-callout--note"><p><span className="hl-callout__label">What this check means.</span>{MEANING_AI}</p></div>
    </details>
    <div><Btn variant="quiet" sm icon="retry">Read it again</Btn></div>
  </div>
);

// ---------------------------------------------------------------- whole screen

type Section<P> = Omit<P, 'style'> | false;
export type AnalyzeScreenState = {
  kicker?: string;
  title?: string;
  /** 0..1 entrance of the kicker + title. Default 1. */
  header?: number;
  facts?: Omit<AnalyzeFactsProps, 'style'>;
  /**
   * Fractional staged reveal of the AI part, fixed order: 0 summary, 1 PICO, 2 limitations,
   * 3 biases and conflicts, 4 "Anything else?", 5 footer. Hidden sections keep their space.
   * Default: all in.
   */
  sections?: number;
  /** Per-section props; false removes the section from the layout. */
  summary?: Section<SummaryCardProps>;
  pico?: Section<PicoListProps>;
  limitations?: Section<Omit<ItemListProps, 'kind'>>;
  biases?: Section<Omit<ItemListProps, 'kind'>>;
  ask?: Section<AskBoxProps>;
  footer?: boolean;
};

/** The whole Analyze tab in product order, driven by one state object. Render inside PanelFrame. */
export const AnalyzeScreen: React.FC<{ state?: AnalyzeScreenState }> = ({ state = {} }) => {
  const sec = state.sections ?? Number.POSITIVE_INFINITY;
  const at = (i: number) => rowReveal(sec, i);
  return (
    <>
      <div style={revealStyle(state.header ?? 1)}>
        <AnalyzeHeader kicker={state.kicker} title={state.title} />
      </div>
      <div className="hl-stack hl-an">
        <AnalyzeFacts {...(state.facts || {})} />
        <div className="hl-stack">
          {state.summary !== false ? <SummaryCard {...(state.summary || {})} style={at(0)} /> : null}
          {state.pico !== false ? <PicoList {...(state.pico || {})} style={at(1)} /> : null}
          {state.limitations !== false ? <ItemList kind="limitations" {...(state.limitations || {})} style={at(2)} /> : null}
          {state.biases !== false ? <ItemList kind="biases" {...(state.biases || {})} style={at(3)} /> : null}
          {state.ask !== false ? <AskBox {...(state.ask || {})} style={at(4)} /> : null}
          {state.footer !== false ? <AnalyzeFooter style={at(5)} /> : null}
        </div>
      </div>
    </>
  );
};

export default AnalyzeScreen;
