import React from 'react';
import { Sequence, interpolateColors, useCurrentFrame } from 'remotion';
import { C } from '../../brand/colors';
import { ShortCaption } from '../../motion/Captions';
import { EASE_IN, EASE_IN_OUT, EASE_OUT, EASE_SOFT, lin, mix, progress } from '../../motion/ease';
import { SceneShell } from '../../motion/Scene';
import { Cursor } from '../../ui/Cursor';
import { Icon } from '../../ui/Icon';
import { ARTICLE, DOSAGE, SOURCE_CHECK } from '../../data/demo';
import { CheckRow, CitationCard, ProductToast } from '../../ui/screens/Read';
import { COMPACT_CASCADE_END, MATRIX_COMPACT, MatrixCompact } from '../../ui/screens/Ebp';
import { DoseSolution } from '../../ui/screens/Practice';
import '../../ui/css/honelens.css';

/**
 * S07Montage (720 f = 4 beats × 180 f, 1080 × 1920). Same rhythm in every beat:
 *   caption (two lines, top band) rises at 4 and lifts out at 162;
 *   one UI card, centred on y = 1030 inside the 560–1500 band, enters 8–34 (fade, 48 px rise, .97 → 1),
 *   pushes in slowly (+3.5 %, eased) and lifts out 166–180; the next beat starts on clean paper.
 * Cards are the product's own markup at CSS zoom 2.25 inside a 400 CSS px column with 16 px gutters,
 * i.e. exactly where the side panel's content sat in S04–S06 (x 126–954). Smallest text 14 CSS px = 31.5 px.
 *
 *   (a)   0–180  Check every source.      Source check rows; chips land on the beat (54, 82, 110).
 *   (b) 180–360  Cite in APA 7 or AMA 11. Click AMA 11 (62) → card crossfades; click Copy citation (114) → toast.
 *   (c) 360–540  Fill your evidence table. MatrixCompact, diagonal cascade 44–129 (one tick per diagonal).
 *   (d) 540–720  Practice dosage math.     Order, on hand, then the mono steps one per beat (58, 88, 118), answer tint.
 */

const BEAT = 180;
const Z = 2.25;           // CSS zoom of every card
const COL_X = 90;         // screen x of the 400 CSS px column (content starts 16 CSS px in: x = 126)
const MID_Y = 1030;       // vertical centre of the UI band (560–1500)
const ENTER_AT = 8;
const EXIT_AT = 166;
const CAPTION_OUT = 162;

const clamp01 = (v: number) => (v <= 0 ? 0 : v >= 1 ? 1 : v);
const fade = (p: number, dy = 12): React.CSSProperties =>
  p >= 1 ? {} : { opacity: p, transform: `translateY(${((1 - p) * dy).toFixed(3)}px)` };

// Product classes carry CSS transitions; every frame must be a pure function of the frame.
const STILL_CSS = '.hlv-s07,.hlv-s07 *{transition:none!important;animation:none!important}';

/**
 * One beat's stage: an absolutely placed column (screen px) with the beat's enter, push-in and exit.
 * `top` is the screen y of the column's top; `originY` the push-in anchor (screen y), default MID_Y.
 */
const Stage: React.FC<{ top: number; base?: number; push?: number; children: React.ReactNode }> = ({ top, base = 1, push = 0.035, children }) => {
  const f = useCurrentFrame();
  const pin = progress(f, ENTER_AT, 26, EASE_OUT);
  const pout = progress(f, EXIT_AT, 14, EASE_IN);
  const drift = progress(f, 14, BEAT - 14, EASE_SOFT);
  const scale = base * mix(pin, 0.97, 1) * (1 + push * drift);
  const ty = mix(pin, 48, 0) - pout * 56;
  return (
    <div
      className="hlv-s07"
      style={{
        position: 'absolute', left: COL_X, top, width: 400 * Z,
        opacity: pin * (1 - pout),
        transform: `translateY(${ty.toFixed(2)}px) scale(${scale.toFixed(5)})`,
        transformOrigin: `${(540 - COL_X).toFixed(0)}px ${(MID_Y - top).toFixed(0)}px`,
      }}
    >
      {children}
    </div>
  );
};

/** The product canvas at video size: 400 CSS px wide, 16 px gutters (content 368), zoom 2.25. */
const Canvas: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div className="hl-canvas" style={{ zoom: Z, width: 400, padding: '0 16px', background: 'transparent', ...style }}>
    {children}
  </div>
);

/** The product's one attention effect (teal tint in, then out), as a 0..1 strength. */
const flash = (f: number, at: number, inDur = 10, outDur = 34) => progress(f, at, inDur) * (1 - progress(f, at + inDur, outDur, EASE_IN_OUT));
const tintBg = (a: number) => (a > 0.001 ? `rgba(227,240,241,${clamp01(a).toFixed(3)})` : 'transparent');

// ---------------------------------------------------------------- (a) Source check

const SC_ROWS = [SOURCE_CHECK.rows[0], SOURCE_CHECK.rows[3], SOURCE_CHECK.rows[4]]; // Matches · No update record found · Free full text
const SC_CHIP_AT = [54, 82, 110];
// Card height (CSS px): 17 + kicker 18.2 + 4 + journal 20.3 + 16 + rows (1 + 69.6 + 89.9 + 69.6) + 17 ≈ 323 → 727 px.
const SC_TOP = Math.round(MID_Y - (323 * Z) / 2);

const SourceBeat: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      <Stage top={SC_TOP}>
        <Canvas>
          <div className="hl-card" style={{ display: 'grid', gap: 16 }}>
            <div>
              <p className="hl-kicker" style={{ margin: 0 }}>Source check</p>
              <p className="hl-small" style={{ margin: '4px 0 0' }}>{`${ARTICLE.journal} · ${ARTICLE.year}`}</p>
            </div>
            <div className="hl-rows">
              {SC_ROWS.map((r, i) => (
                <div key={r.label} style={{ margin: '0 -8px', padding: '0 8px', background: tintBg(flash(f, SC_CHIP_AT[i]) * 0.75) }}>
                  <CheckRow row={r} p={progress(f, 18 + 7 * i, 22)} chipP={progress(f, SC_CHIP_AT[i], 16)} />
                </div>
              ))}
            </div>
          </div>
        </Canvas>
      </Stage>
      <ShortCaption lines={['Check every', 'source.']} accent={['every']} at={4} exitAt={CAPTION_OUT} />
    </>
  );
};

// ---------------------------------------------------------------- (b) Cite

const TEAL_PRESSED = '#1B626A';
const AMA_CARD_MIN = 212;  // AMA card ≈ 194 tall (5 lines); a fixed floor makes the Copy button's y exact
// Layout (CSS px from the column's content top): toggle 0–40 · card 52–(52 + h) · buttons +12, 40 tall · toast +20.
const CITE_APA_H = 40 + 12 + 271 + 12 + 40;                  // ≈ 375 → 844 px, centred while APA shows
const CITE_TOP = Math.round(MID_Y - (CITE_APA_H * Z) / 2);   // 608; the card shrinks upward-anchored to AMA
const SEG_ITEM_W = [62.4, 72.7];                              // "APA 7", "AMA 11" (14 px Plex Sans 600 + 2 × 12 padding)
const AMA_TARGET = { x: Z * (16 + 3 + SEG_ITEM_W[0] + 2 + SEG_ITEM_W[1] / 2), y: Z * 20 };
const COPY_TARGET = { x: Z * (16 + 75), y: Z * (40 + 12 + AMA_CARD_MIN + 12 + 20) };
const CLICK_AMA = 62;
const CLICK_COPY = 114;

/** kit.js segmented() for the citation style (same look as CiteScreen's toggle), with a press on AMA 11. */
const StyleToggle: React.FC<{ t: number; press: number }> = ({ t, press }) => {
  const w = clamp01(t / 0.35);
  const items = [{ label: 'APA 7', on: 1 - w }, { label: 'AMA 11', on: w }];
  return (
    <div className="hl-seg" role="radiogroup" aria-label="Citation style" style={{ justifySelf: 'start' }}>
      {items.map((it, i) => (
        <button
          key={it.label} type="button" className="hl-seg__item" role="radio" aria-checked={it.on >= 0.5 ? 'true' : 'false'}
          style={{
            background: it.on > 0 ? interpolateColors(it.on, [0, 1], [C.white, C.tealTint]) : 'transparent',
            color: interpolateColors(it.on, [0, 1], [C.slate, C.teal]),
            boxShadow: it.on > 0 ? `inset 0 0 0 1px rgba(31,111,120,${it.on.toFixed(3)})` : 'none',
            transform: i === 1 && press > 0 ? `scale(${(1 - 0.02 * press).toFixed(4)})` : undefined,
          }}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
};

const CiteBeat: React.FC = () => {
  const f = useCurrentFrame();
  const segPress = lin(f, [CLICK_AMA - 2, CLICK_AMA + 1], [0, 1]) * (1 - lin(f, [CLICK_AMA + 4, CLICK_AMA + 10], [0, 1]));
  const t = lin(f, [CLICK_AMA + 2, CLICK_AMA + 34], [0, 1]);
  const pressed = lin(f, [CLICK_COPY - 2, CLICK_COPY + 2], [0, 1]) * (1 - lin(f, [CLICK_COPY + 6, CLICK_COPY + 14], [0, 1]));
  const toast = progress(f, CLICK_COPY + 4, 22);
  return (
    <>
      <Stage top={CITE_TOP}>
        <Canvas>
          <div style={{ display: 'grid', gap: 12, minWidth: 0 }}>
            <StyleToggle t={t} press={segPress} />
            <CitationCard format="ama" crossfade={t} style={{ minHeight: AMA_CARD_MIN }} />
            <div className="hl-cite__actions">
              <button
                type="button" className="hl-btn hl-btn--primary"
                style={pressed > 0 ? {
                  background: interpolateColors(pressed, [0, 1], [C.teal, TEAL_PRESSED]),
                  transform: `scale(${(1 - 0.02 * pressed).toFixed(4)})`,
                  boxShadow: `inset 0 1px 2px rgba(24,50,74,${(0.18 * pressed).toFixed(3)})`,
                } : undefined}
              >
                <Icon name="copy" size={16} />
                Copy citation
              </button>
              <button type="button" className="hl-btn hl-btn--secondary">Save to reference list</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8, ...fade(toast, 16) }}>
              <ProductToast text="AMA citation copied." />
            </div>
          </div>
        </Canvas>
        <Cursor
          appearAt={26}
          keys={[
            { at: 26, x: 760, y: 560 },
            { at: CLICK_AMA, x: AMA_TARGET.x, y: AMA_TARGET.y, click: true, dur: 32 },
            { at: CLICK_COPY, x: COPY_TARGET.x, y: COPY_TARGET.y, click: true, dur: 34 },
          ]}
        />
      </Stage>
      <ShortCaption lines={['Cite in APA 7', 'or AMA 11.']} accent={['Cite']} at={4} exitAt={CAPTION_OUT} />
    </>
  );
};

// ---------------------------------------------------------------- (c) Evidence matrix

const MX_H = MATRIX_COMPACT.height * Z;            // 886.5 px at zoom 2.25 (900 px wide)
const MX_TOP = Math.round(MID_Y - MX_H / 2);       // 587
const MX_START = 44;
const MX_STEP = 13;                                // frames per diagonal (6 diagonals, one tick each)

const MatrixBeat: React.FC = () => {
  const f = useCurrentFrame();
  const cascade = lin(f, [MX_START, MX_START + COMPACT_CASCADE_END * MX_STEP], [0, COMPACT_CASCADE_END]);
  const rows = lin(f, [12, 40], [0, 4]);
  return (
    <>
      {/* Starts at .965 so the push-in ends at native size: the 900 px table stays inside 560–1500. */}
      <Stage top={MX_TOP} base={0.965} push={0.035}>
        <MatrixCompact zoom={Z} cascade={cascade} rows={rows} />
      </Stage>
      <ShortCaption lines={['Fill your', 'evidence table.']} accent={['evidence']} at={4} exitAt={CAPTION_OUT} />
    </>
  );
};

// ---------------------------------------------------------------- (d) Dosage

const DOSE_PROMPT = 'How many tablets do you give per dose?'; // dosage.js oral-tablets prompt
const DOSE_STEP_AT = [58, 88, 118];
// Card (CSS px): 17 + prompt 27.2 + 12 + order 95.3 + 12 + on hand 72.8 + 12 + rule/space 17 + solution 95 + 17 ≈ 377 → 849 px.
const DOSE_TOP = Math.round(MID_Y - (377 * Z) / 2);

const DoseBeat: React.FC = () => {
  const f = useCurrentFrame();
  const steps = DOSE_STEP_AT.reduce((n, at) => n + lin(f, [at, at + 16], [0, 1]), 0);
  const order = progress(f, 16, 22);
  const onHand = progress(f, 28, 22);
  return (
    <>
      <Stage top={DOSE_TOP}>
        <Canvas>
          <div className="hl-card hl-stack">
            <h2 className="hl-dose-prompt">{DOSE_PROMPT}</h2>
            <div className="hl-dose-order" style={fade(order)}>
              <span className="hl-label">Order</span>
              <p className="hl-dose-order__text">{DOSAGE.order}</p>
            </div>
            <div className="hl-dose-order" style={fade(onHand)}>
              <span className="hl-label">On hand</span>
              <p className="hl-dose-order__text">{DOSAGE.have}</p>
            </div>
            <div style={{ marginTop: 4, paddingTop: 12, borderTop: `1px solid ${C.hair}` }}>
              <DoseSolution
                heading={false} note={false} strikeColor={C.teal}
                appear={lin(f, [44, 64], [0, 1])}
                steps={steps}
                cancel={lin(f, [100, 118], [0, 1])}
                tint={flash(f, 128, 8, 30)}
              />
            </div>
          </div>
        </Canvas>
      </Stage>
      <ShortCaption lines={['Practice', 'dosage math.']} accent={['dosage']} at={4} exitAt={CAPTION_OUT} />
    </>
  );
};

// ---------------------------------------------------------------- scene

const BEATS: React.FC[] = [SourceBeat, CiteBeat, MatrixBeat, DoseBeat];

const S07Montage: React.FC = () => (
  <SceneShell enter="none" exit="none" drift={1}>
    <style>{STILL_CSS}</style>
    {BEATS.map((B, i) => (
      <Sequence key={i} from={i * BEAT} durationInFrames={BEAT} name={`S07 beat ${'abcd'[i]}`}>
        <B />
      </Sequence>
    ))}
  </SceneShell>
);

export default S07Montage;
