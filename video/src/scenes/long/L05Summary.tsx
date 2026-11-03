import React from 'react';
import { SceneShell } from '../../motion/Scene';
import { WordsRise } from '../../motion/Text';

// TODO(scene): placeholder. See video/STORYBOARD.md for this scene.
const L05Summary: React.FC = () => (
  <SceneShell>
    <WordsRise lines={['L05Summary']} at={0} style={{ position: 'absolute', left: 120, top: 200, fontSize: 80 }} />
  </SceneShell>
);
export default L05Summary;
