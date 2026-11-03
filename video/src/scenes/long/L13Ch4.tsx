import React from 'react';
import { ChapterScene } from './L03Ch1';

// Chapter 4 card (150 f). Layout, timing and rail: see ChapterScene in L03Ch1.tsx.
// The longest chapter title (33 characters, 84 px, about 1,200–1,450 px from x = 346): fits inside 1,800.
const L13Ch4: React.FC = () => (
  <ChapterScene n={4} title="Practice what you’ll be tested on" sub="Dosage math and exam practice." />
);

export default L13Ch4;
