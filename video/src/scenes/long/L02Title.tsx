import React from 'react';
import { useCurrentFrame } from 'remotion';
import { C, FONT } from '../../brand/colors';
import { COPY } from '../../data/demo';
import { mix, progress } from '../../motion/ease';
import { SceneShell } from '../../motion/Scene';
import { HMark } from '../../ui/Browser';

/**
 * L02Title (300 f, 5 s, 1920 x 1080). The name, settled.
 *
 *   6    small navy HoneNurse H fades up (72 px tall)
 *   20   "HoneLENS" 172 px: letters fade up left to right (3 f apart) while the whole word's tracking
 *        tightens from +0.16 em to −0.028 em over 96 f, so the word gathers in around the centre
 *   74   tagline, serif italic 46 px, navy
 *   102  "A side panel for nursing students, in Chrome." sans 28 px, slate
 *   284  scene lifts out (SceneShell)
 *
 * Vertical geometry (visible ink, not line boxes): mark 312–384 · caps 440–560 · tagline caps
 * 612–644 · small line caps 686–706. The group's centre (~509) sits just above frame centre.
 * Plex metrics used: ascent 1.025 em, descent 0.275 em, cap height 0.698 em.
 */

const WORD = 'HoneLENS';
const T = { mark: 6, letters: 20, stagger: 3, letterDur: 36, track: 20, trackDur: 96, tagline: 74, line: 102 };

const L02Title: React.FC = () => {
  const frame = useCurrentFrame();
  const mark = progress(frame, T.mark, 30);
  const ls = mix(progress(frame, T.track, T.trackDur), 0.16, -0.028); // em, applied between letters only
  const tag = progress(frame, T.tagline, 30);
  const line = progress(frame, T.line, 28);
  const n = WORD.length;

  return (
    <SceneShell enter="fade" exit="lift" exitDur={16} drift={1.025}>
      {/* Mark: 72 px tall (53 px wide), bottom at y = 384, 56 px above the cap line. */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 312, height: 72, display: 'flex', justifyContent: 'center', opacity: mark, transform: `translateY(${mix(mark, 14, 0)}px)` }}>
        <HMark size={72} />
      </div>

      {/* Wordmark: line box 410–582 (line-height 1), baseline at 410 + 0.875 em = 560, caps from 440. */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 410, height: 172, textAlign: 'center', whiteSpace: 'nowrap', fontFamily: FONT.sans, fontWeight: 600, fontSize: 172, lineHeight: 1, color: C.navy }}>
        {WORD.split('').map((ch, i) => {
          const p = progress(frame, T.letters + i * T.stagger, T.letterDur);
          return (
            <span key={i} style={{ display: 'inline-block', opacity: p, transform: `translateY(${mix(p, 0.14, 0)}em)`, marginRight: i < n - 1 ? `${ls}em` : 0 }}>
              {ch}
            </span>
          );
        })}
      </div>

      {/* Tagline: 46 px, line box from 599, caps 612–644. */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 599, textAlign: 'center', fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 46, lineHeight: 1.2, color: C.navy, opacity: tag, transform: `translateY(${mix(tag, 16, 0)}px)` }}>
        {COPY.tagline}
      </div>

      {/* Product line: 28 px, line box from 678, caps 686–706. */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 678, textAlign: 'center', fontFamily: FONT.sans, fontWeight: 600, fontSize: 28, lineHeight: 1.2, color: C.slate, opacity: line, transform: `translateY(${mix(line, 12, 0)}px)` }}>
        A side panel for nursing students, in Chrome.
      </div>
    </SceneShell>
  );
};

export default L02Title;
