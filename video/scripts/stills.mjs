// Renders review stills (JPEG) for scene compositions, bundling once. Runs on GitHub Actions.
//   node scripts/stills.mjs --comps=all|short|long|S01Hook,L05Summary --per=8 --scale=0.5 [--frames=0,60,120]
// Output: out/stills/<Comp>/<Comp>-f<frame>.jpg
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition, ensureBrowser } from '@remotion/renderer';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const arg = (k, d) => (process.argv.find(a => a.startsWith(`--${k}=`)) || '').split('=').slice(1).join('=') || d;
const timeline = JSON.parse(readFileSync(path.join(root, 'src', 'timeline.json'), 'utf8'));

const all = { short: timeline.short.scenes, long: timeline.long.scenes };
const want = arg('comps', 'all');
let scenes = want === 'all' ? [...all.short, ...all.long]
  : want === 'short' || want === 'long' ? all[want]
  : [...all.short, ...all.long].filter(s => want.split(',').includes(s.id));
const per = Number(arg('per', '8'));
const scale = Number(arg('scale', '0.5'));
const fixed = arg('frames', '');

await ensureBrowser();
console.log('Bundling…');
const serveUrl = await bundle({ entryPoint: path.join(root, 'src', 'index.ts') });
const outDir = path.join(root, 'out', 'stills');
let n = 0;
for (const s of scenes) {
  const comp = await selectComposition({ serveUrl, id: s.id, inputProps: {} });
  const frames = fixed ? fixed.split(',').map(Number).filter(f => f < comp.durationInFrames)
    : Array.from({ length: per }, (_, i) => Math.min(comp.durationInFrames - 1, Math.round((i + 0.5) * comp.durationInFrames / per)));
  mkdirSync(path.join(outDir, s.id), { recursive: true });
  for (const frame of frames) {
    const output = path.join(outDir, s.id, `${s.id}-f${String(frame).padStart(4, '0')}.jpg`);
    await renderStill({ serveUrl, composition: comp, frame, output, imageFormat: 'jpeg', jpegQuality: 88, scale, inputProps: {} });
    n++;
  }
  console.log(`${s.id}: ${frames.join(', ')}`);
}
console.log(`Rendered ${n} stills.`);
