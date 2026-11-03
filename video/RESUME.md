# Paused on Oct 10, 2026: how to resume

Everything below is committed to `main` of github.com/techris101/HoneLENS.CC.v1.
To resume, open Claude Code in `C:\HoneLENS Claude code` and say: "resume the videos from video/RESUME.md".

## State when paused (~65%)

- Typecheck passes (`cd video && npm run typecheck`).
- **Done and reviewed in stills:**
  - Short: S01Hook, S02Meet, S03Fab, S04Analyze, S09Logo.
  - Long: L01–L03, L06–L11, L13–L18.
  - Fixed after review: the clipped "Library" tab and the wrapping "Source check" sub-tab (`src/ui/Panel.tsx`).
- **Written but not yet reviewed:** S05Limits, S06Chat, S07Montage, S08Key, L04AnalyzeOpen, L12Ebp.
  - Agents were stopped mid-refinement. Each file compiles, but check timings, layout and cues.
- **Still a placeholder:** L05Summary (`TODO(scene)` in the file). See its storyboard entry in DIRECTION.md. It must hand off cleanly into L06PicoLimits.
- **Missing:** `scripts/make-audio.mjs`, the soundtrack synth. The spec is in the final-render job's comments and in the notes below.
  - It writes `public/audio/{short,long}-{full,sfx}.wav` from `src/timeline.json` + `src/scenes/*/*.cues.json`.
  - Original synthesized music: short 120 bpm, long 96 bpm, D major Dmaj9–Bm11–Gmaj7–A6sus4, felt piano + pad + soft pulse.
  - It also adds the logo-finale sounds itself; their timings are in `src/brand/LogoSpawn.tsx`.

## Remaining steps

1. Finish L05Summary and the audio script. Review the six unreviewed scenes.
2. Stills on GitHub. Each run downloads as the `video-stills` artifact.

   ```bash
   gh workflow run video.yml --ref main -f mode=stills -f comps=S05Limits,S06Chat,S07Montage,S08Key,L04AnalyzeOpen,L05Summary,L12Ebp -f per=8
   ```

3. Fix what the stills show, then do a full review pass with `comps=all`.
4. Final render (10 parallel chunk jobs, then join + soundtrack):

   ```bash
   gh workflow run video.yml --ref main -f mode=final
   ```

   This produces the `honelens-videos` artifact: 3 MP4s per film (music, sfx-only, silent).

## Notes

- Heavy work runs on GitHub Actions only (the user's rule). Local commands are limited to typecheck and the light audio script.
- Agent workflows use `video/.wf/wf-video-tasks.js` (gitignored; args `{stages:[[{label,kind,prompt}]]}`). Concurrency is 2 agents per workflow on this PC, so run several workflows side by side.
- Agents hit the session usage limit twice. Tell them to write complete files early, then refine.
