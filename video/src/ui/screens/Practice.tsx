/**
 * Practice section screens, drawn with the product's own markup and CSS so the film shows the real
 * HoneLENS: Dosage trainer (src/sidepanel/screens/dosage.js, styles/screens/dosage.css), the red
 * Do Not Use callout (ui/kit.js dangerCallout + modules/shared/donotuse.js), and the exam simulator's
 * results area (screens/simulator.js, styles/screens/simulator.css).
 *
 * PURE and PRESENTATIONAL: no useCurrentFrame in here. Every animated aspect is a numeric prop, and
 * every prop defaults to the finished state, so <DosageScreen /> alone renders the completed screen.
 * Render inside PanelFrame (panel 400 CSS px, body gutters 16 => 368 px content):
 *
 *   <PanelFrame section="Practice" sub={practiceSub('Dosage')} zoom={2.25} height={...} scrollY={...}>
 *     <DosageScreen header={false} chars={lin(f, [40, 52], [0, 3])} focused={f < 70} press={...}
 *       result={lin(f, [80, 110], [0, 2])} steps={lin(f, [120, 210], [0, 3])} cancel={lin(f, [150, 190], [0, 1])} />
 *   </PanelFrame>
 *   <PanelFrame section="Practice" sub={practiceSub('Dosage')}><DoNotUseCallout appear={p} /></PanelFrame>
 *   <PanelFrame section="Practice" sub={practiceSub('Exam')}><ExamReadiness topics={lin(f, [0, 75], [0, 5])} /></PanelFrame>
 *
 * The parts (DoseProblemCard, DoseResult, DoseSolution) are exported too, so a scene can show only the
 * piece that matters (one focal element at a time) instead of scrolling a long screen.
 *
 * Reveal convention: a fractional count such as rows={2.4} shows items 0 and 1 fully, item 2 at 40 %
 * of its entrance (opacity + 12 px rise, EASE_OUT applied to clamp(rows - i, 0, 1)), later items
 * hidden. Hidden items KEEP their layout space, so nothing jumps. Pass linear ramps (`lin`); easing
 * is applied in here. 0..1 props (appear, cancel, tint …) are also eased in here where they move things.
 *
 * Approximate heights in panel CSS px (from the top of the screen content; they shift by one text line
 * if a line wraps differently). Add 84 for the app bar, 16 body padding and 64 for the Practice sub-nav
 * to get the y inside PanelFrame.
 *   DosageScreen   header 0–77 · banner 125–180 · problem card 204–664 (order 290–385, on hand 397–470,
 *                  answer field 482 (input 508–548), Check 607–647) · Correct row 688–764 ·
 *                  Answer card 776–862 · Worked solution 874–1056 (math line 960–1003)
 *                  (header={false}: subtract 125 · banner={false}: subtract 79)
 *   DoseProblemCard ≈ 460 tall · DoseResult ≈ 174 · DoseSolution ≈ 182 (≈ 140 without the note)
 *   DoNotUseCallout (card) ≈ 284 tall, the callout itself ≈ 96 · ExamReadiness ≈ 667 (≈ 542 without
 *   the header): score card 125–240, threshold row 252–302, readiness line 314–362, By topic 386–667.
 */
import React from 'react';
import { interpolateColors } from 'remotion';
import { C } from '../../brand/colors';
import { EASE_OUT } from '../../motion/ease';
import { DOSAGE } from '../../data/demo';
import { Icon } from '../Icon';
import { Chip, ScreenHeader } from '../Panel';

// ---------- Copy (product wording) ----------

/** Practice sub-navigation, as in src/sidepanel/routes.js. */
export const PRACTICE_SCREENS = ['Dosage', 'Exam', 'Cards'] as const;
export type PracticeScreen = (typeof PRACTICE_SCREENS)[number];
/** `sub` prop for PanelFrame: <PanelFrame section="Practice" sub={practiceSub('Dosage')}>. */
export const practiceSub = (value: PracticeScreen) => ({ items: [...PRACTICE_SCREENS] as string[], value: value as string });

const BANNER_TEXT = 'Educational practice. Never use for real patient dosing.';
const DOSE_KICKER = 'Dosage trainer';
const DOSE_TITLE = 'Practice a dosage problem, step by step.';
const PROBLEM_LABEL = 'Oral tablets and capsules';
const PROBLEM_PROMPT = 'How many tablets do you give per dose?';
const ROUNDING_NOTE = 'Round the final answer to the tenth (1 decimal place).';
// Joint Commission QD entry, exactly as modules/shared/donotuse.js words it.
const QD_RISK = 'It can be mistaken for QOD or QID.';

/** Exam results that agree with DOSAGE.exam.line: 4 topics 2 of 2, IV flow 1 of 2 => 9 of 10. */
export const EXAM_RESULT = { correct: 9, total: 10, pct: 90, threshold: 90 } as const;
export type TopicState = 'ready' | 'review';
/** Real Practice topic names (modules/dosage index.js TOPICS / generator labels). The review one is last. */
export const EXAM_TOPICS: ReadonlyArray<{ label: string; state: TopicState }> = [
  { label: 'Unit conversions', state: 'ready' },
  { label: 'Oral tablets and capsules', state: 'ready' },
  { label: 'Weight-based and daily doses', state: 'ready' },
  { label: 'Pediatric dose range check', state: 'ready' },
  { label: 'IV flow and drip rates', state: 'review' },
];

// ---------- Dose math, parsed once from DOSAGE.steps ('37.5 mg', '× 1 tablet / 25 mg', '= 1.5 tablets') ----------

type Qty = { value: string; unit: string };
const splitQty = (s: string): Qty => {
  const t = s.trim();
  const i = t.indexOf(' ');
  return i < 0 ? { value: t, unit: '' } : { value: t.slice(0, i), unit: t.slice(i + 1).trim() };
};
const FIRST = splitQty(DOSAGE.steps[0] ?? '37.5 mg');
const FRAC = /^×\s*(.+?)\s*\/\s*(.+)$/.exec((DOSAGE.steps[1] ?? '').trim());
const FRAC_NUM = splitQty(FRAC?.[1] ?? '1 tablet');
const FRAC_DEN = splitQty(FRAC?.[2] ?? '25 mg');
const RESULT_TEXT = (DOSAGE.steps[2] ?? `= ${DOSAGE.answer}`).replace(/^=\s*/, '');
const CANCELS = FIRST.unit !== '' && FIRST.unit === FRAC_DEN.unit;
// The step sentence the oral-tablets generator writes (modules/dosage/generators.js).
const STEP_TEXT = `Desired over have: multiply by ${FRAC_NUM.value} ${FRAC_NUM.unit} per ${FRAC_DEN.value} ${FRAC_DEN.unit}.`;
const ANSWER = splitQty(DOSAGE.answer); // { value: '1.5', unit: 'tablets' }

// ---------- Helpers (pure) ----------

const TEAL_PRESSED = '#1B626A'; // --hl-teal-pressed
const clamp01 = (v: number) => (v <= 0 ? 0 : v >= 1 ? 1 : v);
const ease = (v: number) => EASE_OUT(clamp01(v));
/** Eased entrance (0..1) of item i in a fractional reveal count n. */
const reveal = (n: number, i: number) => ease(n - i);
/** Fade + rise. Keeps layout space at every value. */
const enter = (p: number, dy = 12): React.CSSProperties =>
  p >= 1 ? {} : { opacity: p, transform: `translateY(${((1 - p) * dy).toFixed(3)}px)` };
const mixColor = (t: number, from: string, to: string) => interpolateColors(clamp01(t), [0, 1], [from, to]);
// The product's classes carry CSS transitions; frames must not depend on the previous frame.
const STILL: React.CSSProperties = { transition: 'none', animation: 'none' };

/** Product banner (kit.js banner): persistent notice at the top of dosage screens. */
export const DoseBanner: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div className="hl-banner" role="note" style={style}>
    <Icon name="info" size={16} />
    <span>{BANNER_TEXT}</span>
  </div>
);

/** A unit with an animated strike (dosage.css .hl-dose-cancel: struck unit turns slate). */
const Struck: React.FC<{ p: number; color: string; children: React.ReactNode }> = ({ p, color, children }) => (
  <span style={{ position: 'relative', display: 'inline-block', color: mixColor(p, C.navy, C.slate) }}>
    {children}
    <span
      aria-hidden="true"
      style={{
        position: 'absolute', left: -2, right: -2, top: '55%', height: 1.5, marginTop: -0.75, background: color,
        transform: `scaleX(${p.toFixed(4)})`, transformOrigin: 'left center', opacity: p > 0 ? 1 : 0,
      }}
    />
  </span>
);

const QtyView: React.FC<{ q: Qty; strike?: number; strikeColor: string }> = ({ q, strike, strikeColor }) => (
  <span>
    {q.value}
    {q.unit ? ' ' : null}
    {q.unit ? (strike === undefined ? q.unit : <Struck p={strike} color={strikeColor}>{q.unit}</Struck>) : null}
  </span>
);

// ---------- DoseProblemCard ----------

export type DoseProblemCardProps = {
  /** Fractional reveal of [kicker + prompt, Order, On hand, answer form]. Default 4 (all). */
  rows?: number;
  /** Characters of the answer value ("1.5") typed into the field. Default: all. */
  chars?: number;
  /** 0..1 crossfade of the unit select from "Unit" to "tablets". Default 1. */
  unit?: number;
  /** Focus ring on the answer field and a steady (never blinking) teal caret after the typed text. */
  focused?: boolean;
  /** 0..1 press depth of the Check button (ramp it up and back down around the click). */
  press?: number;
  /** 0..1 the field and unit settle into the product's disabled look after Check. Default 0. */
  checked?: number;
  /** Show the answer form (field + Check). Default true. */
  form?: boolean;
  style?: React.CSSProperties;
};

/** The problem card: kicker, prompt, Order (DOSAGE.order), On hand (DOSAGE.have), answer + unit, Check. */
export const DoseProblemCard: React.FC<DoseProblemCardProps> = ({
  rows = 4, chars = ANSWER.value.length, unit = 1, focused = false, press = 0, checked = 0, form = true, style,
}) => {
  const e0 = enter(reveal(rows, 0));
  const typed = ANSWER.value.slice(0, Math.max(0, Math.floor(chars)));
  const ck = clamp01(checked);
  const u = ease(unit);
  const pr = clamp01(press);
  const fieldBg = mixColor(ck, C.white, C.panel);
  const fieldBorder = mixColor(ck, C.field, C.hair);
  const fieldInk = mixColor(ck, C.navy, C.slate);
  return (
    <div className="hl-card hl-stack" style={style}>
      <div className="hl-stack">
        <p className="hl-kicker" style={e0}>{PROBLEM_LABEL}</p>
        <h2 className="hl-dose-prompt" style={e0}>{PROBLEM_PROMPT}</h2>
        <div className="hl-stack">
          <div className="hl-dose-order" style={enter(reveal(rows, 1))}>
            <span className="hl-label">Order</span>
            <p className="hl-dose-order__text">{DOSAGE.order}</p>
          </div>
          <div className="hl-dose-order" style={enter(reveal(rows, 2))}>
            <span className="hl-label">On hand</span>
            <p className="hl-dose-order__text">{DOSAGE.have}</p>
          </div>
        </div>
      </div>
      {form ? (
        <div className="hl-stack" style={enter(reveal(rows, 3))}>
          <div className="hl-field">
            <span className="hl-label">Your answer</span>
            <div className="hl-input-group">
              <div
                className={`hl-input hl-input--num${focused ? ' is-focus' : ''}`}
                style={{ ...STILL, display: 'flex', alignItems: 'center', background: fieldBg, borderColor: focused ? C.teal : fieldBorder, color: fieldInk }}
              >
                <span style={{ whiteSpace: 'pre' }}>{typed}</span>
                {focused ? <span aria-hidden="true" style={{ flex: 'none', width: 1.5, height: '1.1em', marginLeft: 1, background: C.teal }} /> : null}
              </div>
              <span className="hl-select hl-dose-unit">
                <div
                  className="hl-input"
                  style={{ ...STILL, display: 'grid', alignItems: 'center', paddingRight: 32, background: fieldBg, borderColor: fieldBorder, color: fieldInk }}
                >
                  <span style={{ gridArea: '1 / 1', opacity: 1 - u }}>Unit</span>
                  <span style={{ gridArea: '1 / 1', opacity: u }}>{ANSWER.unit}</span>
                </div>
                <Icon name="chevron" size={16} />
              </span>
            </div>
            <span className="hl-hint">{ROUNDING_NOTE}</span>
          </div>
          <div>
            <button
              type="button"
              className="hl-btn hl-btn--primary"
              style={{
                ...STILL, background: mixColor(pr, C.teal, TEAL_PRESSED), transform: pr > 0 ? `scale(${(1 - 0.02 * pr).toFixed(4)})` : undefined,
                boxShadow: pr > 0 ? `inset 0 1px 2px rgba(24,50,74,${(0.18 * pr).toFixed(3)})` : undefined,
              }}
            >
              Check
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

// ---------- DoseResult ----------

export type DoseResultProps = {
  /** Fractional reveal of [Your answer row with the teal "Correct" chip, Answer card]. Default 2. */
  rows?: number;
  /** 0..1 the product's attention effect (teal tint) on the Answer card. Ramp up then down. Default 0. */
  tint?: number;
  /** Show the Answer card (kicker "Answer", "1.5 tablets" in mono). Default true. */
  answerCard?: boolean;
  style?: React.CSSProperties;
};

/** What Check shows for a correct answer: checkRow (match chip "Correct") + resultCard("Answer"). */
export const DoseResult: React.FC<DoseResultProps> = ({ rows = 2, tint = 0, answerCard = true, style }) => (
  <div className="hl-stack" style={style}>
    <div className="hl-rows" style={enter(reveal(rows, 0))}>
      <div className="hl-row">
        <span className="hl-row__label">Your answer</span>
        <Chip state="match">Correct</Chip>
        <div className="hl-row__detail">
          <span className="hl-small">Your answer: {DOSAGE.answer}.</span>
        </div>
      </div>
    </div>
    {answerCard ? (
      <div className="hl-result" style={{ ...STILL, ...enter(reveal(rows, 1)), background: mixColor(tint, C.white, C.tealTint) }}>
        <span className="hl-kicker">Answer</span>
        <span className="hl-result__value">{DOSAGE.answer}</span>
      </div>
    ) : null}
  </div>
);

// ---------- DoseSolution ----------

export type DoseSolutionProps = {
  /** 0..1 entrance of the heading "Worked solution" and the step sentence. Default 1. */
  appear?: number;
  /** Fractional reveal of the three math parts from DOSAGE.steps: "37.5 mg", "× 1 tablet / 25 mg",
   *  "= 1.5 tablets". Default 3. Hidden parts keep their space on the line. */
  steps?: number;
  /** 0..1 strike over the cancelled mg units: the first over 0–0.6, the second over 0.4–1. Default 1. */
  cancel?: number;
  /** 0..1 teal tint behind the result "1.5 tablets" (the attention effect). Default 0. */
  tint?: number;
  /** Rounding line under the steps; it enters with the last math part. Default true. */
  note?: boolean;
  /** Show the "Worked solution" heading. Default true. */
  heading?: boolean;
  /** Strike colour. Default slate (calm). The product's .hl-dose-cancel uses a 2 px teal line: pass C.teal. */
  strikeColor?: string;
  style?: React.CSSProperties;
};

/** The worked dimensional-analysis solution, in Plex Mono, as renderSolution() draws it. */
export const DoseSolution: React.FC<DoseSolutionProps> = ({
  appear = 1, steps = 3, cancel = 1, tint = 0, note = true, heading = true, strikeColor = C.slate, style,
}) => {
  const a = enter(ease(appear));
  const s1 = CANCELS ? ease(cancel / 0.6) : undefined;
  const s2 = CANCELS ? ease((cancel - 0.4) / 0.6) : undefined;
  const part: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8 };
  return (
    <section className="hl-stack" aria-label="Worked solution" style={style}>
      {heading ? <h3 className="hl-dose-h" style={a}>Worked solution</h3> : null}
      {/* The entrance sits on the list itself so the "1." marker fades with the sentence. */}
      <ol className="hl-dose-steps" style={a}>
        <li>
          <p>{STEP_TEXT}</p>
          <p className="hl-dose-math">
            <span style={{ ...part, ...enter(reveal(steps, 0)) }}>
              <QtyView q={FIRST} strike={s1} strikeColor={strikeColor} />
            </span>
            <span style={{ ...part, ...enter(reveal(steps, 1)) }}>
              <span className="hl-dose-op">×</span>
              <span className="hl-dose-frac">
                <span className="hl-dose-frac__num"><QtyView q={FRAC_NUM} strikeColor={strikeColor} /></span>
                <span className="hl-dose-frac__den"><QtyView q={FRAC_DEN} strike={s2} strikeColor={strikeColor} /></span>
              </span>
            </span>
            <span style={{ ...part, ...enter(reveal(steps, 2)) }}>
              <span className="hl-dose-op">=</span>
              <strong style={{ margin: '0 -4px', padding: '0 4px', borderRadius: 2, background: tint > 0 ? mixColor(tint, 'rgba(227,240,241,0)', C.tealTint) : undefined }}>
                {RESULT_TEXT}
              </strong>
            </span>
          </p>
        </li>
      </ol>
      {note ? <p className="hl-small" style={{ margin: 0, ...enter(reveal(steps, 2)) }}>Rounding: {ROUNDING_NOTE}</p> : null}
    </section>
  );
};

// ---------- DosageScreen (composite) ----------

export type DosageScreenProps = {
  /** Kicker + title (kit.js screenHeader). Default true. */
  header?: boolean;
  /** "Educational practice. Never use for real patient dosing." Default true. */
  banner?: boolean;
  /** Default 'Dosage trainer' (the product's kicker). */
  kicker?: string;
  /** Default 'Practice a dosage problem, step by step.' */
  title?: string;
  /** DoseProblemCard rows (0..4). Default 4. */
  problem?: number;
  chars?: number;
  unit?: number;
  focused?: boolean;
  press?: number;
  /** Field settles to disabled. Default: follows the Correct row's entrance (clamp(result, 0, 1)). */
  checked?: number;
  /** Show the result + worked solution block below the card. Default true. */
  showResult?: boolean;
  /** DoseResult rows (0..2). Default 2. */
  result?: number;
  answerTint?: number;
  answerCard?: boolean;
  /** DoseSolution appear (0..1). Default 1. */
  solution?: number;
  steps?: number;
  cancel?: number;
  resultTint?: number;
  note?: boolean;
  strikeColor?: string;
};

/**
 * Practice › Dosage, in the product's order: header, banner, problem card (with the answer form),
 * then the result (Correct + Answer card) and the worked solution.
 */
export const DosageScreen: React.FC<DosageScreenProps> = ({
  header = true, banner = true, kicker = DOSE_KICKER, title = DOSE_TITLE,
  problem = 4, chars, unit, focused, press, checked,
  showResult = true, result = 2, answerTint, answerCard,
  solution, steps, cancel, resultTint, note, strikeColor,
}) => (
  <>
    {header ? <ScreenHeader kicker={kicker} title={title} /> : null}
    {banner ? <DoseBanner /> : null}
    <DoseProblemCard rows={problem} chars={chars} unit={unit} focused={focused} press={press} checked={checked ?? clamp01(result)} />
    {showResult ? (
      <div className="hl-stack">
        <DoseResult rows={result} tint={answerTint} answerCard={answerCard} />
        <DoseSolution appear={solution} steps={steps} cancel={cancel} tint={resultTint} note={note} strikeColor={strikeColor} />
      </div>
    ) : null}
  </>
);

// ---------- DoNotUseCallout ----------

export type DoNotUseCalloutProps = {
  /** Inside the problem card (kicker + prompt + Order), as the trainer shows it. Default true.
   *  false: only the Order block and the callout (hl-stack). */
  card?: boolean;
  /** 0..1 entrance of the card content / Order block. Default 1. */
  order?: number;
  /** 0..1 entrance of the red callout (fade + 12 px rise; it keeps its space). Default 1. */
  appear?: number;
  /** 0..1 optional thin red underline drawing under "qd" in the order text. Not in the product; default 0. */
  flag?: number;
  prompt?: string;
  style?: React.CSSProperties;
};

/**
 * The only red block in HoneLENS: "Do Not Use abbreviation." with the octagon icon, then the exact text
 * found in <mark>, why it is risky and what to write instead (dosage.js renderOrder + donotuse.js QD):
 *   Do Not Use abbreviation. [qd] in this order. It can be mistaken for QOD or QID. Write “daily”.
 */
export const DoNotUseCallout: React.FC<DoNotUseCalloutProps> = ({ card = true, order = 1, appear = 1, flag = 0, prompt = PROBLEM_PROMPT, style }) => {
  const { written, flag: hit, fix } = DOSAGE.doNotUse;
  const at = written.lastIndexOf(hit);
  const before = at >= 0 ? written.slice(0, at) : written;
  const after = at >= 0 ? written.slice(at + hit.length) : '';
  const fl = ease(flag);
  const fixText = /\.$/.test(fix) ? fix : `${fix}.`;
  const o = enter(ease(order));

  const orderBlock = (
    <div className="hl-dose-order" style={card ? undefined : o}>
      <span className="hl-label">Order</span>
      <p className="hl-dose-order__text">
        {before}
        {at >= 0 ? (
          <span style={{ position: 'relative', display: 'inline-block' }}>
            {hit}
            {fl > 0 ? (
              <span aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: 1, height: 2, background: C.red, transform: `scaleX(${fl.toFixed(4)})`, transformOrigin: 'left center' }} />
            ) : null}
          </span>
        ) : null}
        {after}
      </p>
    </div>
  );
  const callout = (
    <div className="hl-callout hl-callout--danger" style={enter(ease(appear))}>
      <p>
        <span className="hl-callout__label"><Icon name="danger" size={16} />Do Not Use abbreviation.</span>
        {' '}
        <mark>{hit}</mark>
        {` in this order. ${QD_RISK} ${fixText}`}
      </p>
    </div>
  );

  if (!card) {
    return <div className="hl-stack" style={style}>{orderBlock}{callout}</div>;
  }
  return (
    <div className="hl-card hl-stack" style={style}>
      <div className="hl-stack">
        <p className="hl-kicker" style={o}>{PROBLEM_LABEL}</p>
        <h2 className="hl-dose-prompt" style={o}>{prompt}</h2>
        <div className="hl-stack">
          <div style={o}>{orderBlock}</div>
          {callout}
        </div>
      </div>
    </div>
  );
};

// ---------- ExamReadiness ----------

export type ExamReadinessProps = {
  /** "Exam results" / "You answered 9 of 10 correctly." (simulator.js results header). Default true. */
  header?: boolean;
  /** The educational banner. Default false (it already shows on the Dosage screen). */
  banner?: boolean;
  /** 0..1 entrance of the Score card. Default 1. */
  score?: number;
  /** 0..1 count-up of the score percent (eased in here). Default 1. */
  count?: number;
  /** 0..1 entrance of the "Your threshold: 90%" row with the teal "Met" chip. Default 1. */
  threshold?: number;
  /** 0..1 entrance of the readiness line (DOSAGE.exam.line). Default 1. */
  ready?: number;
  /** "Counts only; not a prediction." after the readiness line, as the product writes it. Default true. */
  note?: boolean;
  /** Fractional reveal of the 5 topic rows (the "By topic" heading leads row 0). Default 5. */
  topics?: number;
  /** 0..1 teal-tint attention on the Score card. Default 0. */
  tint?: number;
};

const TopicChip: React.FC<{ state: TopicState }> = ({ state }) =>
  state === 'ready' ? (
    <Chip state="match">Ready</Chip>
  ) : (
    <span className="hl-chip hl-chip--nomatch">
      <Icon name="retry" size={16} />
      <span className="hl-chip__text">Review</span>
    </span>
  );

/**
 * Practice › Exam, results area: Score card (mono percent), threshold row (match "Met"), the readiness
 * line, and a per-topic list (4 teal "Ready" chips with check icons, 1 amber "Review" for IV flow).
 */
export const ExamReadiness: React.FC<ExamReadinessProps> = ({
  header = true, banner = false, score = 1, count = 1, threshold = 1, ready = 1, note = true, topics = 5, tint = 0,
}) => {
  const pct = Math.round(EXAM_RESULT.pct * ease(count));
  const head = ease(topics * 1.6);
  return (
    <>
      {header ? <ScreenHeader kicker="Exam results" title={`You answered ${EXAM_RESULT.correct} of ${EXAM_RESULT.total} correctly.`} /> : null}
      {banner ? <DoseBanner /> : null}
      <div className="hl-stack">
        <div className="hl-result" style={{ ...STILL, ...enter(ease(score)), background: mixColor(tint, C.white, C.tealTint) }}>
          <span className="hl-kicker">Score</span>
          <span className="hl-result__value" style={{ fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
          <span className="hl-small">{EXAM_RESULT.correct} of {EXAM_RESULT.total} correct.</span>
        </div>
        <div className="hl-rows" style={enter(ease(threshold))}>
          <div className="hl-row">
            <span className="hl-row__label">Your threshold: {EXAM_RESULT.threshold}%</span>
            <Chip state="match">Met</Chip>
          </div>
        </div>
        <p className="hl-sim-ready" style={enter(ease(ready))}>
          {DOSAGE.exam.line}
          {note ? <>{' '}<span className="hl-small">Counts only; not a prediction.</span></> : null}
        </p>
      </div>
      <section className="hl-stack" aria-label="By topic">
        <h2 className="hl-dose-h" style={enter(head)}>By topic</h2>
        <div className="hl-rows" style={{ opacity: head }}>
          {EXAM_TOPICS.map((t, i) => (
            <div key={t.label} className="hl-row" style={enter(reveal(topics, i))}>
              <span className="hl-row__label">{t.label}</span>
              <TopicChip state={t.state} />
            </div>
          ))}
        </div>
      </section>
    </>
  );
};
