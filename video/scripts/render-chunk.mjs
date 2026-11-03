// Renders one frame range of a film as a near-lossless H.264 chunk (no audio). Runs on GitHub
// Actions as a matrix job; scripts/finish.sh joins the chunks, re-encodes once and adds the soundtrack.
//   node scripts/render-chunk.mjs --comp=Long --part=0 --parts=6
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition, ensureBrowser } from '@remotion/renderer';
import { mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const arg = (k, d) => (process.argv.find(a => a.startsWith(`--${k}=`)) || '').split('=').slice(1).join('=') || d;
const id = arg('comp', 'Short');
const part = Number(arg('part', '0'));
const parts = Number(arg('parts', '1'));

await ensureBrowser();
const serveUrl = await bundle({ entryPoint: path.join(root, 'src', 'index.ts') });
const composition = await selectComposition({ serveUrl, id, inputProps: { audio: 'none' } });
const total = composition.durationInFrames;
const size = Math.ceil(total / parts);
const from = part * size;
const to = Math.min(total, from + size) - 1;
mkdirSync(path.join(root, 'out', 'chunks'), { recursive: true });
const outputLocation = path.join(root, 'out', 'chunks', `${id}-${String(part).padStart(2, '0')}.mp4`);
console.log(`${id}: frames ${from}–${to} of ${total} on ${os.cpus().length} CPUs`);
let last = 0;
await renderMedia({
  serveUrl, composition, codec: 'h264', outputLocation, inputProps: { audio: 'none' },
  frameRange: [from, to], muted: true, crf: 10, x264Preset: 'medium', pixelFormat: 'yuv420p',
  concurrency: os.cpus().length, chromiumOptions: { gl: 'swangle' },
  onProgress: ({ progress }) => { const p = Math.floor(progress * 10); if (p > last) { last = p; console.log(`${p * 10}%`); } },
});
console.log(`Wrote ${outputLocation}`);
