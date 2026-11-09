# Video brief · {{TOPIC}}

Make a **{{DURATION}}-second** animated explainer about **"{{TOPIC}}"** for **{{AUDIENCE}}**.
On-screen language: **{{LANGUAGE}}**. Visual style: **{{STYLE_ID}} · {{STYLE_NAME}}** (full style guide in section 3).
Format: **{{FORMAT}}**, {{WIDTH}}×{{HEIGHT}} px, {{FPS}} fps. Final file: `{{OUTPUT}}`.

Work in this order: facts → storyboard → build → sound → check → deliver. Show me the storyboard before you build if anything about the topic is uncertain.

---

## 1. Content

- **Facts first.** Use only well-established facts that a children's encyclopedia would print. If a number is uncertain, use safe wording ("one of the fastest", "thousands of kilometres", "according to scientists") instead of a precise figure. No myths, no fear, no gore.
- **Arc:** a hook question in the first 2 seconds → 2 to 4 clear steps (cause → effect) → one memorable takeaway sentence → a calm ending that can loop.
- **One idea per beat.** Each step gets its own picture, motion and caption.
- **Captions:** at most 2 lines, about 2–5 words per line, large enough to read on a phone. Spell {{LANGUAGE}} correctly. If the language is Turkish, use ç ğ ı İ ö ş ü properly, write capital i as **İ** and capital ı as **I**, and make sure the chosen font contains every glyph (fall back to a covered font rather than letting the browser substitute one).
- **Tone:** curious, warm, gently funny; talk *with* children, not down to them.

## 2. Storyboard

{{STORYBOARD}}

Write the storyboard as a table before building: `time range | what we see | on-screen text | motion | sound`. Times must add up to exactly {{DURATION}} s. Reserve the last 0.8–1.2 s for the style's signature transition so the clip can end cleanly or loop.

## 3. Style guide

{{STYLE_GUIDE}}

Follow the guide's palette, materials, typography, signature devices and "avoid" list strictly. Invent new scenes in the same language rather than copying the example topic.

## 4. Build

- **Engine:** one HTML page that draws with the Canvas 2D API. Everything must be deterministic: expose `window.seek(t)` that renders the exact frame for time `t` (no wall-clock time, no unseeded randomness; use a seeded PRNG and hash-based noise). Expose `window.DURATION`, `window.FPS` and `window.__ready`.
- **Speed:** pre-render textures, sprites and static layers once in an init step; each frame only composes them.
- **Fonts:** load local `woff2` files with `@font-face` and wait for `document.fonts.load(...)` (with a sample string that includes the special letters) before the first frame.
- **Layout ({{FORMAT}}):** {{SAFE_ZONE}}
- **Motion:** ease everything (no linear starts or stops), stagger related elements by 60–120 ms, keep at least 0.6 s of stillness after each caption appears so it can be read.
- **Render:** drive a headless Chromium page frame by frame (`seek(i / FPS)`), capture each frame as PNG, and pipe the frames to ffmpeg: `-c:v libx264 -pix_fmt yuv420p -crf 18 -preset slow -movflags +faststart` with BT.709 colour tags. Exactly `{{DURATION}} × {{FPS}}` frames.
- If this repository is available, reuse `engine/core.js` (the `SH` toolkit: easing, noise, paper/shadow helpers, text sprites, a seek-based harness) and `tools/render.cjs`.

## 5. Sound

- Voiceover: {{VOICEOVER}}
- Sound effects: {{SFX}}
- Music: {{MUSIC}}
- **Synthesize** effects and music procedurally (for example with Python + NumPy, or ffmpeg's `sine`/`anoisesrc` sources): stock-sound websites often block automated downloads. Give every visual event its own small cue (pops, swishes, taps, chimes) that matches the style's material.
- Write a cue list (`time → sound`), mix with short fades, keep peaks below −1 dBFS and the overall loudness around −16 LUFS, then mux the audio into the video (AAC 192 kb/s).

## 6. Check before delivering

- Render still frames at every beat and look at them: overlaps, cut-off text, contrast, safe zones, spelling, missing glyphs, colours outside the palette.
- Watch the motion at full speed once: nothing should pop in or out without easing, and nothing important should move while it must be read.
- Confirm duration, resolution, frame rate and audio with `ffprobe`.
- Fix and re-render; do not deliver the first draft if a check fails.

## 7. Deliver

- `{{OUTPUT}}` plus a poster frame (`.jpg`), a contact sheet of the key frames, the source folder, the storyboard and a short `CREDITS.md` (fonts with licences, how the sounds were made).
- Finish with a short report: what was made, the facts used, and anything you were unsure about.

{{EXTRA}}
