import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { ARTICLE } from '../../data/demo';
import { ShortCaption } from '../../motion/Captions';
import { EASE_IN_OUT, mix, progress } from '../../motion/ease';
import { SceneShell } from '../../motion/Scene';
import { ArticlePage, BrowserFrame, Fab } from '../../ui/Browser';
import { Cursor } from '../../ui/Cursor';

/*
 * S03Fab (270 f, 1080 x 1920).
 *   0    caption "Open any / research article."; the browser rises in (8)
 *   30   the article scrolls gently (to 136)
 *   60   the teal "Analyze with HoneLENS" button slides in from the page's right edge (fixed, bottom-right,
 *        right 20 / bottom 24 like src/content/fab.js; its close "x" only shows on hover, as in the product)
 *   88   the cursor enters from below and comes to rest over the abstract
 *   138  the camera pushes in on the button (to 178); caption "Click Analyze." (150)
 *   164  the cursor glides to the button, settles (197), clicks (200); the button presses
 *   206  a slow push-through on the pressed button, caption out (246), scene fades (256-270) into S04
 *
 * Geometry (scene px). Browser 1000 x 920 at (40, 560), chrome scale 1.6 -> outer box 40..1042 x 560..1482;
 * page area x 41..1041, y 706..1481 (775 tall). Article at scale 1.6 (title wraps to 3 lines).
 * Fab scale 1.85: pill 387 x 74 at x 552..939, y 1363..1437 (centre 746, 1400); label 26 px.
 * Camera: scale 1 -> 1.14 (moves the pill centre to 640, 1380), then 1.14 -> 1.2 anchored on the pill.
 * At 1.14 the browser spans y 423..1474 (caption ends at y 326) and the pill x 420..860 (safe < 940).
 * End state for S04: browser top-left at (40, 560) before the camera; scrollY 180; button pressed once.
 */

// Browser window
const BL = 40, BT = 560, BW = 1000, BH = 920, BS = 1.6;
const PAGE_X = BL + 1;
const PAGE_Y = BT + 1 + 44 * BS + 46 * BS + 1;   // outer border + tab strip + address bar (+ its border)
const PAGE_H = BH - 90 * BS - 1;

// Fab (mirrors Fab's own box model: pill = 54s + label 155s, gap 6s, close 28s + 2px border)
const FS = 1.85;
const FAB_RIGHT = 20 * FS, FAB_BOTTOM = 24 * FS;
const PILL_W = 209 * FS, PILL_H = 40 * FS, GAP = 6 * FS, X_W = 28 * FS + 2;
const PILL_CX = PAGE_X + BW - FAB_RIGHT - X_W - GAP - PILL_W / 2;
const PILL_CY = PAGE_Y + PAGE_H - FAB_BOTTOM - PILL_H / 2;
const MASK_PAD = 24;   // room for the button's shadow inside the masked wrapper

// Camera: the pill moves to (AX, AY) and stays there while the push continues.
const CX = 540, CY = 960, AX = 640, AY = 1380;
const anchorT = (s: number): [number, number] => [AX - CX - s * (PILL_CX - CX), AY - CY - s * (PILL_CY - CY)];

// Cursor (positions are the pointer's top-left; its tip sits ~4 px in at size 46)
const CLICK = 200;
const TIP_X = 700, TIP_Y = 1414;   // on the pill, just under the label so "Analyze" stays readable
const CURSOR_KEYS = [
  { at: 0, x: 430, y: 1600 },
  { at: 130, x: 500, y: 1170, dur: 42 },                 // enters from below, over the abstract
  { at: 158, x: 522, y: 1184, dur: 26 },                 // a small reading drift
  { at: 193, x: TIP_X - 11, y: TIP_Y - 13, dur: 29 },    // glide to the button (slight arc), stops just short
  { at: 197, x: TIP_X - 4, y: TIP_Y - 4, dur: 4 },       // settle onto it (same direction, no overshoot)
  { at: CLICK, x: TIP_X - 4, y: TIP_Y - 4, dur: 3, click: true },
];

const S03Fab: React.FC = () => {
  const frame = useCurrentFrame();

  const winIn = progress(frame, 8, 34);
  const scrollY = mix(progress(frame, 30, 106, EASE_IN_OUT), 0, 180);

  const fabIn = progress(frame, 60, 30);
  const fabSlide = (1 - fabIn) * (PILL_W + GAP + X_W + FAB_RIGHT + MASK_PAD);
  const hover = progress(frame, 184, 9);   // the close "x" fades in on hover (150 ms in the product)
  const pressed = progress(frame, CLICK - 1, 3) * (1 - progress(frame, CLICK + 11, 8));
  const cut = MASK_PAD + PILL_W + GAP / 2;
  const mask = `linear-gradient(to right, #000 ${cut}px, rgba(0,0,0,${hover}) ${cut}px)`;

  const p1 = progress(frame, 138, 40, EASE_IN_OUT);
  const p2 = progress(frame, 206, 64, EASE_IN_OUT);
  const s = 1 + 0.14 * p1 + 0.06 * p2;
  const t1 = anchorT(1.14);
  const [tx, ty] = p2 > 0 ? anchorT(s) : [t1[0] * p1, t1[1] * p1];

  return (
    <SceneShell enter="none" exit="fade" exitDur={14} drift={1}>
      <AbsoluteFill style={{ transformOrigin: `${CX}px ${CY}px`, transform: `translate(${tx}px, ${ty}px) scale(${s})` }}>
        <BrowserFrame width={BW} height={BH} scale={BS} url={ARTICLE.url} tabTitle={ARTICLE.title}
          style={{ position: 'absolute', left: BL, top: BT, opacity: winIn, transform: `translateY(${mix(winIn, 80, 0)}px)` }}>
          <ArticlePage scale={1.6} scrollY={scrollY} />
          <div style={{
            position: 'absolute', right: FAB_RIGHT - MASK_PAD, bottom: FAB_BOTTOM - MASK_PAD, padding: MASK_PAD, display: 'flex',
            opacity: progress(frame, 60, 12), transform: `translateX(${fabSlide}px)`, WebkitMaskImage: mask, maskImage: mask,
          }}>
            <Fab scale={FS} pressed={pressed} />
          </div>
        </BrowserFrame>
        <Cursor keys={CURSOR_KEYS} size={46} appearAt={88} />
      </AbsoluteFill>

      <ShortCaption lines={['Open any', 'research article.']} at={0} exitAt={134} />
      <ShortCaption lines={['Click Analyze.']} at={150} exitAt={246} accent={['Analyze']} />
    </SceneShell>
  );
};

export default S03Fab;
