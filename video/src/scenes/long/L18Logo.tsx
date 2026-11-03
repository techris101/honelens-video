import React from 'react';
import { LogoSpawn } from '../../brand/LogoSpawn';
import { COPY } from '../../data/demo';

// Closing brand moment (see brand/LogoSpawn.tsx). 6 s: build, lockup, line, CTA, hold.
const L18Logo: React.FC = () => <LogoSpawn orientation="landscape" cta={COPY.cta} ctaSub="Free to start" />;
export default L18Logo;
