import React from 'react';
import { LogoSpawn } from '../../brand/LogoSpawn';
import { COPY } from '../../data/demo';

// Closing brand moment (see brand/LogoSpawn.tsx). 5.5 s: build, lockup, line, CTA, hold.
const S09Logo: React.FC = () => <LogoSpawn orientation="portrait" cta={COPY.cta} ctaSub="Free to start" />;
export default S09Logo;
