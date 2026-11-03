import { continueRender, delayRender, staticFile } from 'remotion';

// The same IBM Plex files the extension bundles (full woff2, SIL OFL). Loaded once per tab;
// rendering waits until every face is ready so no frame ever shows a fallback font.
const FACES: Array<[family: string, file: string, weight: string, style: string]> = [
  ['IBM Plex Sans', 'IBMPlexSans-SemiBold.woff2', '600', 'normal'],
  ['IBM Plex Serif', 'IBMPlexSerif-Regular.woff2', '400', 'normal'],
  ['IBM Plex Serif', 'IBMPlexSerif-Italic.woff2', '400', 'italic'],
  ['IBM Plex Serif', 'IBMPlexSerif-Bold.woff2', '700', 'normal'],
  ['IBM Plex Mono', 'IBMPlexMono-Regular.woff2', '400', 'normal'],
  ['IBM Plex Mono', 'IBMPlexMono-Bold.woff2', '700', 'normal'],
];

let started = false;
export const loadBrandFonts = () => {
  if (started || typeof document === 'undefined') return;
  started = true;
  const handle = delayRender('Loading IBM Plex');
  Promise.all(FACES.map(([family, file, weight, style]) => {
    const face = new FontFace(family, `url(${staticFile(`fonts/${file}`)}) format("woff2")`, { weight, style });
    return face.load().then(f => { document.fonts.add(f); });
  }))
    .then(() => continueRender(handle))
    .catch(err => { console.error(err); continueRender(handle); });
};
