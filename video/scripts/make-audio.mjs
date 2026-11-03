// Synthesizes the soundtrack for both films into public/audio/{short,long}-{full,sfx}.wav.
// Everything is generated here (no samples, no dependencies):
//   - music: a soft felt-piano arpeggio, a pad and a quiet pulse over D major (Dmaj9, Bm11, Gmaj7, A6sus4),
//     short 120 bpm, long 96 bpm;
//   - sound design: the cues in src/scenes/<film>/<Scene>.cues.json, placed at each scene's start frame;
//   - the logo finale: the same timings as src/brand/LogoSpawn.tsx, at the start of the last scene.
// `full` is music + sound design, `sfx` is sound design only (used for the sfx-only MP4).
// Usage: node scripts/make-audio.mjs [--check]
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const timeline = JSON.parse(readFileSync(path.join(root, 'src', 'timeline.json'), 'utf8'));
const FPS = timeline.fps;
const SR = 48000;
const check = process.argv.includes('--check');

// Logo finale, seconds from the start of the logo scene (src/brand/LogoSpawn.tsx).
const LOGO_HITS = [
  { s: 0, type: 'whoosh', gain: 0.35 },
  { s: 0.52, type: 'tick', gain: 0.35 },
  { s: 0.6, type: 'tick', gain: 0.35 },
  { s: 1.22, type: 'click', gain: 0.5 },
  { s: 2.25, type: 'tick', gain: 0.3 },
  { s: 2.8, type: 'whoosh', gain: 0.2 },
  { s: 3.2, type: 'pop', gain: 0.4 },
];

const CHORDS = {
  Dmaj9: [146.83, 185.0, 220.0, 277.18, 329.63],
  Bm11: [123.47, 146.83, 185.0, 220.0, 277.18, 329.63],
  Gmaj7: [98.0, 123.47, 146.83, 185.0],
  A6sus4: [110.0, 146.83, 164.81, 185.0],
};
const PROGRESSION = ['Dmaj9', 'Bm11', 'Gmaj7', 'A6sus4'];

// Deterministic noise, so the same inputs always give the same WAV.
let seed = 12345;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;

const sec = frames => frames / FPS;
const exp = (t, tau) => Math.exp(-t / tau);

/** Mono signal builders. Each returns a Float32Array at SR. */
function tone(freq, dur, amp, tau) {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    out[i] = amp * Math.sin(2 * Math.PI * freq * t) * exp(t, tau);
  }
  return out;
}

function piano(freq, dur, amp) {
  // Fundamental + soft 2nd and 3rd partials, decaying faster for the upper partials.
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const attack = Math.min(1, t / 0.004);
    out[i] = amp * attack * (
      Math.sin(2 * Math.PI * freq * t) * exp(t, 0.9) +
      0.25 * Math.sin(2 * Math.PI * 2 * freq * t) * exp(t, 0.45) +
      0.08 * Math.sin(2 * Math.PI * 3 * freq * t) * exp(t, 0.25)
    );
  }
  return out;
}

function pad(freqs, dur, amp) {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  for (const f of freqs) {
    for (const k of [0.997, 1.003]) {
      const w = 2 * Math.PI * f * k / SR;
      for (let i = 0; i < n; i++) out[i] += (amp / freqs.length / 2) * Math.sin(w * i);
    }
  }
  // Slow attack and release so the pad never clicks.
  const a = Math.round(0.8 * SR), r = Math.round(1.2 * SR);
  for (let i = 0; i < n; i++) {
    const env = Math.min(1, i / a) * Math.min(1, (n - i) / r);
    out[i] *= env;
  }
  return out;
}

function noise(dur) {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = rand();
  return out;
}

function whoosh(dur, amp) {
  // Darkened noise with a swell in and out, the way a soft UI transition sounds.
  const src = noise(dur);
  const out = new Float32Array(src.length);
  let y = 0;
  for (let i = 0; i < src.length; i++) {
    const t = i / src.length;
    y += (src[i] - y) * (0.02 + 0.2 * t);
    out[i] = amp * y * Math.sin(Math.PI * t);
  }
  return out;
}

function tick() {
  return tone(1800, 0.03, 0.5, 0.008);
}

function click() {
  const n = Math.round(0.02 * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    out[i] = (0.6 * Math.sin(2 * Math.PI * 1200 * t) + 0.25 * rand()) * exp(t, 0.005);
  }
  return out;
}

function pop() {
  const dur = 0.14, n = Math.round(dur * SR);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = 700 - 440 * (t / dur);
    phase += (2 * Math.PI * f) / SR;
    out[i] = 0.5 * Math.sin(phase) * exp(t, 0.05);
  }
  return out;
}

function swell(dur, amp) {
  const n = Math.round(dur * SR);
  const out = new Float32Array(n);
  for (const f of [220, 277.18, 329.63]) {
    for (let i = 0; i < n; i++) {
      const t = i / n;
      out[i] += (amp / 3) * Math.sin(2 * Math.PI * f * (i / SR)) * t * t;
    }
  }
  return out;
}

function thud() {
  return tone(90, 0.25, 0.9, 0.06);
}

function chime() {
  const a = tone(880, 1.0, 0.3, 0.5), b = tone(1320, 1.0, 0.12, 0.35);
  return a.map((x, i) => x + b[i]);
}

function soft(freq, dur, amp) {
  return tone(freq, dur, amp, dur / 4);
}

function twice(signal, gap) {
  const off = Math.round(gap * SR);
  const out = new Float32Array(signal.length + off);
  out.set(signal, 0);
  for (let i = 0; i < signal.length; i++) out[i + off] += signal[i];
  return out;
}

function sfxFor(cue) {
  const gain = cue.gain ?? 0.4;
  switch (cue.type) {
    case 'tick': return tick().map(x => x * gain);
    case 'click': return click().map(x => x * gain);
    case 'pop': return pop().map(x => x * gain);
    case 'thud': return thud().map(x => x * gain);
    case 'chime': return chime().map(x => x * gain);
    case 'type': return soft(2200, 0.02, 0.3).map(x => x * gain);
    case 'stream': return soft(1500, 0.02, 0.2).map(x => x * gain);
    case 'copy': return twice(tick().map(x => x * gain), 0.06);
    case 'whoosh': return whoosh(cue.dur ? sec(cue.dur) : 0.5, gain);
    case 'swell': return swell(sec(cue.dur ?? 56), gain);
    default: throw new Error(`Unknown cue type: ${cue.type}`);
  }
}

/** Scene start frames for one film, read from the timeline. */
function sceneStarts(kind) {
  let start = 0;
  return timeline[kind].scenes.map(s => {
    const row = { id: s.id, start, frames: s.frames, dir: kind };
    start += s.frames;
    return row;
  });
}

const totalFrames = kind => timeline[kind].scenes.reduce((n, s) => n + s.frames, 0);

function buffers(seconds) {
  const n = Math.ceil(seconds * SR) + SR;
  return { L: new Float32Array(n), R: new Float32Array(n) };
}

function add(buf, atSec, signal, gain = 1) {
  const start = Math.round(atSec * SR);
  for (let i = 0; i < signal.length && start + i < buf.L.length; i++) {
    buf.L[start + i] += signal[i] * gain;
    buf.R[start + i] += signal[i] * gain;
  }
}

function sceneCues(kind, scene) {
  const file = path.join(root, 'src', 'scenes', kind, `${scene.id}.cues.json`);
  return JSON.parse(readFileSync(file, 'utf8'));
}

/** Music bed: pad, arpeggio on eighth notes, quiet pulse on each beat, fades at both ends. */
function addMusic(buf, kind, seconds) {
  const bpm = timeline[kind].bpm;
  const beat = 60 / bpm;
  const bar = beat * 4;
  const bars = Math.ceil(seconds / bar);
  for (let b = 0; b < bars; b++) {
    const t0 = b * bar;
    const chord = CHORDS[PROGRESSION[b % PROGRESSION.length]];
    add(buf, t0, pad(chord, bar + 1.5, 0.5), 1);
    const eighths = 8;
    for (let e = 0; e < eighths; e++) {
      const f = chord[(e + b) % chord.length] * (e % 4 === 0 ? 1 : 2);
      add(buf, t0 + e * (bar / eighths), piano(f, 1.6, 0.16), 1);
    }
    for (let k = 0; k < 4; k++) {
      add(buf, t0 + k * beat, tone(55, 0.22, 0.10, 0.09), 1);
    }
  }
  // Fade the music in and out; apply to the music buffer only, before sound design is added.
  const fadeIn = Math.round(0.6 * SR), fadeOut = Math.round(2.0 * SR), n = buf.L.length;
  const end = Math.round(seconds * SR);
  for (let i = 0; i < n; i++) {
    const g = Math.min(1, i / fadeIn) * Math.min(1, Math.max(0, (end - i) / fadeOut));
    buf.L[i] *= g;
    buf.R[i] *= g;
  }
}

function addSfx(buf, kind) {
  const scenes = sceneStarts(kind);
  for (const scene of scenes) {
    for (const cue of sceneCues(kind, scene)) {
      add(buf, sec(scene.start + cue.at), sfxFor(cue), 1);
    }
  }
  const last = scenes[scenes.length - 1];
  if (last.id === 'S09Logo' || last.id === 'L18Logo') {
    for (const hit of LOGO_HITS) add(buf, sec(last.start) + hit.s, sfxFor(hit), 1);
  }
}

function normalize(buf, peakTarget = 0.89) {
  let peak = 0;
  for (let i = 0; i < buf.L.length; i++) peak = Math.max(peak, Math.abs(buf.L[i]), Math.abs(buf.R[i]));
  const g = peak > 0 ? peakTarget / peak : 1;
  for (let i = 0; i < buf.L.length; i++) { buf.L[i] *= g; buf.R[i] *= g; }
  return { peak, gain: g };
}

function writeWav(file, buf, frames) {
  const n = Math.round(frames / FPS * SR);
  const dataBytes = n * 4;
  const out = Buffer.alloc(44 + dataBytes);
  out.write('RIFF', 0); out.writeUInt32LE(36 + dataBytes, 4); out.write('WAVE', 8);
  out.write('fmt ', 12); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22);
  out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 4, 28); out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34);
  out.write('data', 36); out.writeUInt32LE(dataBytes, 40);
  const clip = x => Math.max(-32768, Math.min(32767, Math.round(x * 32767)));
  for (let i = 0; i < n; i++) {
    out.writeInt16LE(clip(buf.L[i]), 44 + i * 4);
    out.writeInt16LE(clip(buf.R[i]), 46 + i * 4);
  }
  writeFileSync(file, out);
  return n / SR;
}

const outDir = path.join(root, 'public', 'audio');
mkdirSync(outDir, { recursive: true });

for (const kind of ['short', 'long']) {
  const frames = totalFrames(kind);
  const seconds = sec(frames);

  // Sound design only.
  const sfx = buffers(seconds);
  addSfx(sfx, kind);
  const sfxNorm = normalize(sfx);

  // Music + sound design. Same sound design, plus the music bed.
  const full = buffers(seconds);
  addMusic(full, kind, seconds);
  addSfx(full, kind);
  const fullNorm = normalize(full);

  const sfxFile = path.join(outDir, `${kind}-sfx.wav`);
  const fullFile = path.join(outDir, `${kind}-full.wav`);
  const sfxSec = writeWav(sfxFile, sfx, frames);
  const fullSec = writeWav(fullFile, full, frames);
  console.log(`${kind}: ${seconds.toFixed(2)} s, music bpm ${timeline[kind].bpm}; full peak ${fullNorm.peak.toFixed(3)}, sfx peak ${sfxNorm.peak.toFixed(3)}`);

  if (check) {
    for (const file of [sfxFile, fullFile]) {
      const size = statSync(file).size;
      if (size < 44 + 4 * SR) throw new Error(`${file} is too small (${size} bytes)`);
    }
    if (Math.abs(sfxSec - seconds) > 0.05 || Math.abs(fullSec - seconds) > 0.05) {
      throw new Error(`${kind}: audio length ${fullSec.toFixed(2)} s does not match the film (${seconds.toFixed(2)} s)`);
    }
  }
}
console.log(`Wrote ${outDir}`);
