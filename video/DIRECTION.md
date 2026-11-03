# HoneLENS product videos: direction

Two films, built in code with Remotion, rendered on GitHub Actions (`.github/workflows/video.yml`).

| Film | Canvas | Length | Use |
| --- | --- | --- | --- |
| `Short` | 1080 × 1920, 60 fps | 55.0 s (3,300 frames) | TikTok, YouTube Shorts, Reels ad |
| `Long` | 1920 × 1080, 60 fps | 2:46 (9,960 frames) | YouTube ad / explainer, store video |

Scene order and lengths live in `src/timeline.json`. A scene is one file in `src/scenes/<short|long>/<Id>.tsx`
(default export, a `React.FC` with no props) plus `<Id>.cues.json` (sound cues, see below). Frame 0 of a scene
is its first frame; `useVideoConfig().durationInFrames` is its length. Scenes play back to back with no overlap,
so each scene handles its own entrance and exit (use `SceneShell`).

## The feel

Calm, exact, premium. Think of a quiet product film: one idea at a time, generous empty space, text that
lands with confidence, UI that is real and readable. HoneLENS is the research side panel of the HoneNurse family;
its rule is "hierarchy and spacing do the work before decoration." The short film is fast (a new caption every
2–3 s) but never frantic: speed comes from cuts and confident motion, not from shaking, flashing or color.

- **Minimal palette.** Paper `#F8F8F5` background, navy `#18324A` ink, one accent: teal `#1F6F78`. Navy
  plates (`#18324A`) only for the logo finale. Amber `#7A4A0A` / `#FAEEDA` only where the product uses it
  (retracted, funding/conflict tags, needs-action). Red only for the dosage Do Not Use callout. No gradients
  except the finale's barely-there radial; no glows, no sparkles, no particles, no lens flares, no confetti.
  AI is shown exactly like the rest of the product: calm cards and text, never "magic".
- **Type.** IBM Plex Sans semibold (600) for headlines and labels; Plex Serif (regular/italic) for supporting
  lines and reading text; Plex Mono for DOIs, PMIDs, numbers and dose math. These are the only fonts loaded.
  Headlines: tight tracking (−0.02 to −0.03 em), line-height ~1.04.
- **Copy rules (from the brand).** Sentence case everywhere (no ALL CAPS, no Title Case headlines). No
  exclamation marks, no emoji. Positive, capability-led copy: say what HoneLENS helps you do; never list what it
  cannot do. Never write "not retracted", "peer-reviewed" as a claim, "safe dose", "approved", "AI-proof",
  "verified" or "guaranteed". Write "No matching update record found in Crossref", "nearest fit". Product names:
  HoneLENS, HoneNurse. Tagline: "Your thinking, honed by evidence." US English.
- **Motion.** Entrances decelerate (`EASE_OUT`, 18–30 frames), exits accelerate and are faster (`EASE_IN`,
  10–16 frames). Words rise out of a mask (`WordsRise`). No bounce, no overshoot, no wobble, no spin, no looping
  pulse or blinking. Camera moves are slow eased pushes/pans (`Camera`, 30–50 frames). One focal element moves
  at a time; secondary elements wait. Things that appear in the product UI use the product's one attention effect:
  a soft teal-tint fade (`Highlight`). A cursor (`Cursor`) demonstrates clicks.
- **Readable.** Every piece of text on screen must be readable on a phone: in the short film nothing important
  under 30 px tall, captions 84–100 px. In the long film captions 52–60 px, UI text ≥ 22 px effective size
  (zoom the panel; use `Camera` to push in on the part that matters). Hold text long enough to read
  (≥ 0.35 s per word for captions, ≥ 1.5 s for any caption).

## Layout

**Short (1080 × 1920).** The platform UI covers the bottom ~22 % and the right ~140 px. Keep captions in the top
band (`ShortCaption`, top 230 px, sides 84 px). Product UI lives between y ≈ 560 and y ≈ 1500. Nothing essential
below y = 1500 or right of x = 940. The panel: `PanelFrame width={400} zoom={2.25}` is 900 px wide; centre it
(x = 90).

**Long (1920 × 1080).** 120 px outer margins. Caption top-left (`LongCaption`, y ≈ 96) or in a left column
beside UI. Browser window up to ~1680 × 860. The side panel docked in the browser (`BrowserFrame panel=…`)
or shown alone (`PanelFrame zoom≈1.6–1.9`). Push in with `Camera` so the active part is large.

## Building blocks (import, don't re-invent)

- `brand/colors.ts` – `C` (all tokens), `FONT`, `SHADOW_FLOAT`, `SHADOW_WINDOW`.
- `motion/ease.ts` – `EASE_OUT`, `EASE_IN`, `EASE_IN_OUT`, `progress(frame, start, dur, easing?)` (0→1),
  `mix(p, a, b)`, `inOut`, `lin`.
- `motion/Text.tsx` – `WordsRise` (masked word rise, optional exit, `accent` words turn teal), `SoftLine`,
  `TypeOn` (typing/streaming text that keeps layout stable), `CountUp`.
- `motion/Scene.tsx` – `SceneShell` (background, enter/exit, slow drift), `Camera` (eased pan/zoom keys),
  `Appear` (fade + rise), `Highlight` (the product's teal-tint attention fade).
- `motion/Captions.tsx` – `ShortCaption`, `LongCaption`, `ChapterCard`.
- `ui/Panel.tsx` – `PanelFrame` (the real side panel: app bar "HoneLENS", section tabs, optional segmented
  sub-nav; real product CSS, crisp via CSS zoom), `ScreenHeader`, `Chip`.
- `ui/Browser.tsx` – `BrowserFrame` (generic browser window, docks the panel), `ArticlePage` (the fictional
  article, with the product's in-page quote highlight), `Fab` (floating "Analyze with HoneLENS" button), `HMark`.
- `ui/Cursor.tsx` – `Cursor` (eased glide with slight arc, press + one thin teal ring on click).
- `ui/Icon.tsx` – `Icon name=…` (the product's own line icons), `LensGlyph`.
- `ui/screens/*` – product screens drawn with the product's real CSS classes (built in phase A).
- `data/demo.ts` – every piece of content: `ARTICLE`, `ANALYSIS`, `SOURCE_CHECK`, `CITE`, `EBP`, `STATS`,
  `DOSAGE`, `KEYS`, `COPY`. Use these; do not invent different numbers.
- `brand/LogoSpawn.tsx` – the finale (already done; do not change).

Product CSS is real: class names from `../src/styles/*.css` (synced to `src/ui/css/honelens.css`) such as
`hl-card`, `hl-btn hl-btn--primary`, `hl-chip hl-chip--match`, `hl-row`, `hl-callout`, `hl-kicker`, `hl-title`,
`hl-an-*` (Analyze). Mirror the markup the product's screens produce (`../src/sidepanel/screens/*.js`,
`../src/ui/kit.js`) so the film shows the real product.

## Sound cues

`<Id>.cues.json` is an array of `{ "at": frame, "type": "...", "dur"?: frames, "gain"?: 0..1 }`, frames
relative to the scene start. Types: `whoosh` (scene/camera transition, soft air), `click` (cursor click),
`tick` (small UI change: chip, row, tab), `pop` (a card or panel lands), `type` (keyboard typing, needs `dur`),
`stream` (AI text writing itself, very soft, needs `dur`), `copy` (copy to clipboard), `swell` (rising air into a
big moment, needs `dur`), `thud`, `chime`, `shimmer` (finale only). Add a cue for every click and every major
landing; keep it tasteful (most UI ticks gain 0.4–0.6). A soundtrack is generated from the cues plus music
(`scripts/make-audio.mjs`).

## Storyboard: Short (55 s, 1080 × 1920)

Pace: 120 bpm (one beat = 30 frames). Cut on beats where possible.

1. **S01Hook (180 f).** Paper. Three hard-hitting lines, one at a time, centred vertically around y ≈ 760,
   left-aligned at x = 84, ~120 px type: "12 articles." (0–55) → "One evidence table." (60–115) →
   "Due Friday." (120–175; "Friday" teal). Each line rises in fast (stagger 2, dur 18) and lifts out. Under the
   lines, a quiet stack of 3–4 article title cards (white cards, hairline borders, serif titles, fictional) fans
   out slightly behind the text as the count grows — subtle, slate text, no clutter.
2. **S02Meet (150 f).** "Meet HoneLENS." huge (≈ 130 px) at centre; at 40 f, serif italic tagline
   "Your thinking, honed by evidence." in slate below. Small `HMark` (navy/teal, ~70 px) above the word
   fades in first. Clean exit (lift) at the end.
3. **S03Fab (270 f).** Caption "Open any research article." (0) → "Click Analyze." (150). A browser window
   (≈ 1000 × 980, top at y = 560) shows `ArticlePage` scrolling gently. At 60 f the teal `Fab` slides in from the
   right at the bottom-right of the page (as the product does) with a soft shadow. Cursor enters at 90 f, glides
   to the button, clicks at 200 f (cue click), the button presses.
4. **S04Analyze (660 f).** The side panel takes over: the browser slides left and the `PanelFrame`
   (section Analyze) rises to fill the UI region. Beats: (0–200) caption "Read the facts first." — the facts header
   appears line by line: journal + date, DOI and PMID in mono, chips (study type, update check, free full text).
   (200–420) caption "The whole paper, in one sentence." — the one-sentence summary writes itself (`TypeOn`, stream
   cue) in the summary card, the short paragraph fades in below. (420–660) caption "PICO, pulled out for you." —
   camera glides down (scrollY) to the PICO list; P, I, C, O rows land one by one (tick cues).
5. **S05Limits (450 f).** (0–230) caption "Every point links to the exact words." Limitations list; cursor clicks
   the first item; it expands showing the quote button with its find icon; cursor clicks the quote; a split
   reveal shows the article page below/behind the panel with the sentence highlighted in teal tint + underline
   (`ArticlePage hl=… hlKey='assessors'`). (230–450) caption "Funding and conflicts, surfaced." — the
   "Biases and conflicts" list with amber "Funding" and "Conflict" tags; the funding row expands.
6. **S06Chat (270 f).** Caption "Ask anything else." The teal "Anything else?" button (full-width primary) is
   clicked; the question types into the field; Ctrl+Enter; the answer streams in (stream cue) with its section
   reference. Two suggestion chips sit below.
7. **S07Montage (720 f).** Four quick, crisp beats of 180 f each, same layout rhythm (caption top, one UI card
   centred, camera push-in): (a) "Check every source." — Source check rows; chips land one by one ("Matches",
   "No update record found", "Free full text"). (b) "Cite in APA 7 or AMA 11." — the citation card with the APA
   text, the format toggle flips to AMA, "Copy citation" is clicked, a toast "Copied" rises (copy cue).
   (c) "Fill your evidence table." — a compact evidence matrix (4 papers × 4 columns) whose empty cells fill
   in a diagonal cascade, each tagged "AI draft" (tick cues). (d) "Practice dosage math." — the dose card:
   order, on hand, dimensional-analysis steps in mono landing one per beat, answer "1.5 tablets".
8. **S08Key (270 f).** Caption "Bring a free AI key." sub "From Google or OpenRouter. It stays in your browser."
   The Settings › AI connect box: "Plug in your AI API key" field; under it "Get your AI API key" with
   "Get Google Gemini key · Free · Recommended" and "Get OpenRouter key · Free". The field fills with masked dots,
   Connect is pressed, a "Connected to Google Gemini" match chip appears.
9. **S09Logo (330 f).** Done: `LogoSpawn`.

## Storyboard: Long (2:46, 1920 × 1080)

Pace: unhurried and confident; captions stay up 3–5 s. Chapters separate the story.

1. **L01Open (540 f).** Paper. Serif statement lines centred: "Evidence-based practice starts with the
   evidence." (0–170) → "Reading it well takes time." (180–330) → a calm field of 6–8 fictional article title
   cards drifts upward slowly behind (white cards, hairlines, serif titles, mono years) while "HoneLENS reads
   with you." lands in navy sans (360–520).
2. **L02Title (300 f).** "HoneLENS" in Plex Sans semibold, huge (≈ 170 px), centred, letters settle with a
   tracking tighten; tagline below in serif italic; small line "A side panel for nursing students, in Chrome."
   in slate. A small navy `HMark` above.
3. **L03Ch1 (150 f).** `ChapterCard n=1 title="Analyze any article"` sub "One click on PubMed, PMC and journal sites."
4. **L04AnalyzeOpen (630 f).** Browser window large (≈ 1680 × 860) with `ArticlePage`; caption (left, top)
   "A teal button appears on research articles." The `Fab` slides in; cursor clicks it at ~300 f; the side panel
   slides open docked on the right (`panelWidth` 0 → ~520 px, `PanelFrame zoom≈1.3`), showing the Analyze facts
   header (journal, date, DOI, PMID in mono, chips). Caption changes to "Facts first: identifiers, journal,
   study type, updates."
5. **L05Summary (840 f).** Camera pushes in on the panel (or the panel alone large, zoom ≈ 1.9, centred-right
   with caption at left). One-sentence summary streams in; short paragraph appears; caption "One sentence. Then a
   short summary." At ~420 f cursor clicks "Explain more": the card grows to show the three labelled sections
   (What they did / What they found / How to read it) streaming in; caption "Explain more gives you about three
   times the detail." The button becomes "Show less".
6. **L06PicoLimits (840 f).** PICO rows land (caption "PICO, ready for your notes."). Then Limitations: click
   the first item → it expands with its quote → click the quote → camera pulls back to show the browser and the
   sentence highlighted in the article (teal tint + underline). Caption "Every point links to the exact words in
   the paper." Then Biases and conflicts with amber Funding/Conflict tags; caption "Funding and conflicts of
   interest, surfaced."
7. **L07Chat (540 f).** Caption "Anything else? Ask." The teal "Anything else?" button, the question typed,
   the answer streams with its section reference, the two suggestion chips. Small serif note: "Answers come from
   this article’s text."
8. **L08Ch2 (150 f).** `ChapterCard n=2 title="Check every source"` sub "Retraction and update notices, from Crossref."
9. **L09SourceCheck (690 f).** Panel Read › Source check (sub-nav: Source check · Stats · Clips · Cite). Rows
   land with chips. Expand "What these checks mean" (a calm serif paragraph in a panel note). Then a second
   paper is checked: amber Retracted notice (ban icon, the word "Retracted", 6 px amber bar, "Open the notice").
   Captions: "Identifiers, journal, publisher, date and study type." → "Retracted papers are flagged before you
   cite them." → "Your assignment’s rules, checked."
10. **L10CiteStats (600 f).** Two halves. (0–300) Cite: APA 7 citation card, segmented APA 7 | AMA 11 flips,
    "Copy citation" → toast "Copied". Caption "Citations in APA 7 or AMA 11." (300–600) Stats: NNT 12 result
    in mono with "In plain terms" teal-tint box ("Teach about 12 patients to prevent one readmission within
    30 days."). Caption "Statistics, explained in plain words."
11. **L11Ch3 (150 f).** `ChapterCard n=3 title="Build your evidence table"` sub "Reading sheets, matrix, comparison and a Submission Pack."
12. **L12Ebp (1050 f).** A full-tab EBP builder page (browser window, wide). (0–300) Assignment header with the
    PICOT question and 4 papers (P1–P4 with short citations and design). Caption "Collect your papers under one
    PICOT question." (300–620) Click "Compare papers" → the comparison appears: a one-line synthesis, then
    Agreements / Differences / Gaps lists with paper ids. Caption "Compare papers side by side." (620–900) Click
    "Fill matrix with AI" → the evidence matrix's empty cells fill in a diagonal cascade, each tagged
    "AI draft · edit it into your own words". Caption "Draft your evidence matrix, then make it yours."
    (900–1050) Export cards: Word, Excel, CSV ("Submission Pack"). Caption "Export a Submission Pack."
13. **L13Ch4 (150 f).** `ChapterCard n=4 title="Practice what you’ll be tested on"` sub "Dosage math and exam practice."
14. **L14Practice (570 f).** Panel Practice › Dosage: the order and on-hand cards, dimensional-analysis steps
    landing in mono, answer "1.5 tablets" with a teal match. Caption "Dosage practice, step by step." Then the red
    Do Not Use callout: "qd" → "Write “daily”". Caption "Do Not Use abbreviations, caught." Then Exam tab: a
    readiness line. Caption "Exam practice with a readiness check."
15. **L15Ch5 (150 f).** `ChapterCard n=5 title="Connect your free AI key"` sub "About a minute. Here’s how."
16. **L16KeyGuide (1830 f, ~30 s).** A step guide with a persistent step indicator top-left ("Step 1 of 3",
    mono, with three small bars filling). Step 1 (0–450): HoneLENS Settings › AI, the "Plug in your AI API key"
    box with "Get your AI API key" right under it: "Get Google Gemini key · Free · Recommended" and "Get OpenRouter
    key · Free". Caption "Open Settings › AI and choose Get Google Gemini key." Cursor clicks it. Step 2 (450–1110):
    a new browser tab at `aistudio.google.com/apikey` — a deliberately generic, unbranded key page (heading "API
    keys", a "Create API key" button; no Google logos or colors). Caption "Sign in with Google and create a key."
    Click → a dialog shows a masked key and "Copy". Click Copy (copy cue). Caption "Copy it." Step 3
    (1110–1680): back to HoneLENS; the key pastes into the field as dots; the line "Recognized: Google Gemini"
    appears; click "Connect"; a static clock + "Checking your key…" then the match chip "Connected to Google
    Gemini". Caption "Paste it into HoneLENS and connect." (1680–1830): caption "Prefer OpenRouter? Same three
    steps." sub "Your key stays in your browser and is sent only to your provider."
17. **L17Plans (420 f).** Two calm statements: "Your work stays in your browser. No accounts. No analytics."
    (0–200) then "Free every week. Pro when you need more." with two tidy columns (Free: unlimited AI analysis,
    source checks, citations, stats and dosage practice · 3 assignments · 2 comparisons a week) (Pro: unlimited
    assignments, papers, comparisons, Submission Packs and practice exams). No prices.
18. **L18Logo (360 f).** Done: `LogoSpawn`.
