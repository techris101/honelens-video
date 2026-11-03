import React from 'react';
import { COPY } from '../../data/demo';
import { Appear, SceneShell } from '../../motion/Scene';
import { SoftLine, WordsRise } from '../../motion/Text';
import { HMark } from '../../ui/Browser';

/*
 * S02Meet (150 f, 1080 x 1920). The small HMark fades in first, then "Meet / HoneLENS." rises,
 * huge and centred; at 40 f the serif italic tagline settles in below. The scene lifts out at the end.
 *
 * Geometry (measured with the real Plex files): "Meet HoneLENS." is 949 px on one line at 130 px,
 * wider than the 856 px safe width, so it sets on two lines: "HoneLENS." 638 px -> x 221..859.
 * Tagline 46 px italic 656 px -> x 212..868. Group 520..1008, centred on y = 764.
 */

const MARK_TOP = 520;
const TITLE_TOP = 638;   // 520 + 72 (mark) + 46
const TAG_TOP = 948;     // 638 + 2 x 135 (130 px x 1.04) + 40

const S02Meet: React.FC = () => (
  <SceneShell enter="none" exit="lift" exitDur={16} drift={1.02}>
    <Appear at={0} dur={26} dy={14} style={{ position: 'absolute', left: 0, right: 0, top: MARK_TOP, display: 'flex', justifyContent: 'center' }}>
      <HMark size={72} />
    </Appear>
    <WordsRise lines={['Meet', 'HoneLENS.']} at={10} stagger={4} dur={28} align="center"
      style={{ position: 'absolute', left: 0, right: 0, top: TITLE_TOP, fontSize: 130, lineHeight: 1.04, letterSpacing: '-0.03em' }} />
    <SoftLine at={40} dur={30}
      style={{ position: 'absolute', left: 0, right: 0, top: TAG_TOP, fontSize: 46, lineHeight: 1.3, fontStyle: 'italic', textAlign: 'center' }}>
      {COPY.tagline}
    </SoftLine>
  </SceneShell>
);

export default S02Meet;
