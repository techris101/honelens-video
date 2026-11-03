import React from 'react';
import { useCurrentFrame } from 'remotion';
import { EASE_IN, lin, progress } from '../../motion/ease';
import { SceneShell } from '../../motion/Scene';
import { Cursor } from '../../ui/Cursor';
import { CiteScreen, StatsScreen, readSub } from '../../ui/screens/Read';
import {
  ColumnCaption, Drift, JOIN_SCROLL, Kicker, L09_FRAMES, RetractedBody, STAGE, Stage, glide, pressAt, swapStyle,
} from './L09SourceCheck';

/**
 * L10CiteStats (600 f, 1920 x 1080): Read > Cite, then Read > Stats. Continues L09's shot without a cut:
 * same panel (zoom 1.75, x 1080, top 100), same scroll (56), same constant push (Drift offset = L09 length).
 * Frames 0-14 the second paper's check fades out; the new screen rises in its place. The sub-nav sits
 * just above the visible body at scroll 56, so the switch Cite -> Stats is shown by the kicker, not by it.
 *
 * Screen y of a panel point = 100 + 1.75 * (y - scrollY); x = 1080 + 1.75 * x.
 * Cite (no header, tabs or DOI field), scroll 56: "Your citation" y 180 (317 px), APA 7 | AMA 11 y 215-255
 *   (378-448 px), card y 267-538 APA / 267-457 AMA, Copy citation y 550-590 APA / 469-509 AMA (823-893 px).
 *   Toast bottom at 1004 px (viewportHeight 445), clear of the Copy button.
 * Stats (no header): Experimental 168-263, Control 279-373, Calculate 389-429, NNT 453-605, plain 617-689.
 *   Typed at scroll 56; after Calculate the view glides to 290: Calculate 273-343 px, NNT card 385-651 px,
 *   "In plain terms" 672-798 px.
 *
 * Beats (frames):
 *   0-14     L09's retracted paper fades out. Kicker "Citation maker" 10 (out 272). Caption 1 18 (out 268).
 *   16-48    "Your citation", APA 7 | AMA 11 (APA selected) and the APA card rise in.
 *   126      click AMA 11; 128-162 toggle moves and the card crossfades to AMA.
 *   200      click Copy citation (press 199-213); toast "AMA citation copied." 204-224, leaves 260-274.
 *   274-288  cite fades out; 288 Stats in (290-312). Kicker "Stats calculator" 292 (out 572). Caption 2 296 (out 568).
 *   316-352  the four counts type in. 372 click Calculate.
 *   378-424  view glides 56 -> 290; NNT 12 lands 382-404 (ARR 402-420, teal attention fade 384-432).
 *   436-460  "In plain terms" box. Holds to 584, scene fades 584-600 into the chapter card.
 */

const CITE_AT = 14;
const STATS_AT = 288;
/** Visible body height used to place the product toast (bottom at 1004 px on screen). */
const TOAST_VIEWPORT = 445;

/** Screen point of a panel point (before the drift, which the cursor shares). */
const at = (x: number, y: number, scroll: number) => ({ x: STAGE.x + STAGE.zoom * x, y: STAGE.top + STAGE.zoom * (y - scroll) });
// Cursor tip is ~3 px inside the cursor box, so keys sit 3 px up-left of the target.
const AMA = at(126, 235, JOIN_SCROLL);   // AMA 11 segment
const COPY = at(90, 489, JOIN_SCROLL);   // Copy citation, after the card has become AMA
const CALC = at(66, 409, JOIN_SCROLL);   // Calculate

const L10CiteStats: React.FC = () => {
  const f = useCurrentFrame();
  const scroll = glide(f, JOIN_SCROLL, [{ at: 378, dur: 46, to: 290 }]);

  const prevOut = progress(f, 0, CITE_AT, EASE_IN);
  const citeIn = progress(f, 16, 22);
  const citeOut = progress(f, 274, 14, EASE_IN);
  const statsIn = progress(f, STATS_AT + 2, 22);

  const toast = Math.min(lin(f, [204, 224], [0, 1]), 1 - lin(f, [260, 274], [0, 1]));
  const flash = 0.9 * Math.min(lin(f, [384, 394], [0, 1]), 1 - lin(f, [396, 432], [0, 1]));

  let body: React.ReactNode;
  if (f < CITE_AT) {
    body = (
      <div style={swapStyle(1, prevOut, 8)}>
        <RetractedBody />
      </div>
    );
  } else if (f < STATS_AT) {
    body = (
      <div style={swapStyle(citeIn, citeOut, 10)}>
        <CiteScreen
          header={false}
          tabs={false}
          lookup={false}
          format="ama"
          crossfade={lin(f, [128, 162], [0, 1])}
          cardIn={lin(f, [24, 48], [0, 1])}
          pressed={pressAt(f, 200)}
          toast={toast}
          scrollY={scroll}
          viewportHeight={TOAST_VIEWPORT}
        />
      </div>
    );
  } else {
    body = (
      <div style={swapStyle(statsIn, 0, 10)}>
        <StatsScreen
          header={false}
          filled={lin(f, [316, 352], [0, 4])}
          pressed={pressAt(f, 372)}
          result={lin(f, [382, 404], [0, 1])}
          arr={lin(f, [402, 420], [0, 1])}
          plain={lin(f, [436, 460], [0, 1])}
          flash={flash}
        />
      </div>
    );
  }

  return (
    <SceneShell enter="none" exit="fade" exitDur={16} drift={1}>
      <Drift offset={L09_FRAMES}>
        <Kicker text="Citation maker" at={10} exitAt={272} />
        <Kicker text="Stats calculator" at={292} exitAt={572} />
        <ColumnCaption lines={['Citations in', 'APA 7 or AMA 11.']} at={18} exitAt={268} />
        <ColumnCaption lines={['Statistics, explained', 'in plain words.']} at={296} exitAt={568} accent={['plain']} />

        <Stage sub={readSub(f < STATS_AT ? 'Cite' : 'Stats')} scrollY={scroll}>
          {body}
        </Stage>

        <Cursor
          appearAt={90}
          hideAt={236}
          keys={[
            { at: 0, x: 1010, y: 760 },
            { at: 126, x: AMA.x - 3, y: AMA.y - 3, click: true, dur: 34 },
            { at: 200, x: COPY.x - 3, y: COPY.y - 3, click: true, dur: 36 },
          ]}
        />
        <Cursor
          appearAt={338}
          hideAt={374}
          keys={[
            { at: 0, x: 1500, y: 980 },
            { at: 372, x: CALC.x - 3, y: CALC.y - 3, click: true, dur: 28 },
          ]}
        />
      </Drift>
    </SceneShell>
  );
};

export default L10CiteStats;
