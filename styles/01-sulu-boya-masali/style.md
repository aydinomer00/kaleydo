## Style 01 · Sulu Boya Masalı (Watercolor Tale)

A picture-book page painted in transparent watercolour over a light pencil underdrawing. Calm, airy, a lot of untouched paper. The viewer should feel that every shape was laid down wet and left to dry.

### Palette
- Paper `#FAF6EC` (60–70 % of every frame stays paper).
- Ultramarine `#3F64A8` and cerulean `#6FA8D2` for water and sky; sap green `#6E9B5A` for plants; yellow ochre `#E2A93B` for light; burnt sienna `#B5643C` for earth; a touch of rose `#D9808C` mixed into warm washes.
- Payne's grey ink `#34404E` for lettering and numbers; graphite `#5E6066` for pencil lines.
- Colours never sit flat: each wash mixes in a second pigment on some layers (ultramarine into cerulean, rose into ochre).

### Material and surface
- Cold-press paper: warm white with soft mottling and a pronounced tooth. Build it once: base colour + a tileable grain texture (fine noise ±15, soft mottle, a few hundred light fibres) blended with soft-light.
- A wash is transparent pigment in water. Where it dries, pigment **pools at the edges** (a darker rim), **granulates** in the tooth (dark specks) and leaves **soft lighter pools** where the paper stayed wetter.
- Overlapping washes darken each other (glazing). Composite washes with `multiply`, never normal blending.
- Pencil stays visible under and around the paint: thin, slightly doubled graphite strokes at 40–55 % opacity.

### Typography
- Fraunces 700 for the headline word (130–160 px on a 1080-wide frame), Fraunces 600 for the second line and labels (44–90 px). Payne's grey, sentence case.
- Lettering behaves like ink: fill, then dust with a few paper-coloured specks so it is not a perfect digital fill.
- One key word sits on a horizontal cerulean wash that blooms in from the left just before the word appears.
- Text fades in with a 6 px settle; it never slides across the frame.

### Composition habits
- Big quiet margins. The headline top-left, the scene in the lower two thirds, labels in empty paper near what they name.
- Few, large, simple shapes: a lake, two hills, a sun, a cloud. Detail comes from pigment behaviour, not from line work.
- The light source (sun) sits top-right and is the warmest spot of the page.

### Signature devices
1. **Underdrawing first.** Pencil outlines draw themselves, then paint blooms into them and slightly misses the line.
2. **Bloom reveal.** A wash spreads from where the brush touched through an irregular, soft-edged mask (not a circle wipe).
3. **Lifted water.** Dry-brush streaks lifted out of a lake read as reflections.
4. **Numbered pencil labels.** A digit in a hand-drawn pencil circle followed by a short word.
5. **Clean-water lift.** The signature transition: a band of clean water sweeps across and lifts the paint, leaving blank paper.

### How to build it (Canvas 2D)
1. Paper: pre-render to one full-frame canvas at init.
2. Each wash is painted **once** into its own offscreen canvas sized to its bounds:
   - Start from a base polygon and deform it twice with recursive midpoint displacement (each new midpoint pushed along the edge normal by a Gaussian × edge length × 0.28).
   - Paint 20–26 layers. Each layer is the base deformed three more times (variance ≈ 0.24), filled at α ≈ 0.035–0.05. Every 4th layer also strokes its outline at α 0.06 in a darker mix (edge pooling).
   - `destination-out` a few radial gradients (α 0.4 at the centre) for wet-in-wet lifts. For water, lift short horizontal dry-brush streaks.
   - `source-atop` scatter granulation specks (1–3 px, darker pigment, α 0.04–0.16).
3. Bloom per frame: copy the wash into a reusable temp canvas, apply `destination-in` with 4–5 concentric copies of a very irregular blob (wobble ≈ 0.22, α 0.2 each) scaled by `easeOutCubic(progress)`, then draw it with `multiply`.
4. Pencil: progressively drawn polylines (`partial(points, u)`), a 2.4 px stroke plus a 1.2 px offset ghost stroke.
5. Seeded random everywhere; no texture is generated per frame.

### Motion
- Paint behaves like liquid that settles: blooms take 0.8–1.1 s with `easeOutCubic`. Pencil lines take 0.6–0.9 s with smoothstep.
- Particles of vapour rise slowly, swell and fade (1.6 s each). Raindrops accelerate (`easeInQuad`) and leave pencil ripple ellipses.
- Nothing bounces. Nothing snaps. Overlap beats: the next wash starts before the previous one finishes.

### Transitions
- Default: let the next washes bloom over the current page; cut only on a new page.
- Signature: the clean-water lift (0.8 s). A paper-coloured gradient band sweeps across with a faint blue backrun line at its front.

### Information design
- Sequences are numbered pencil labels (①, ②, ③) with short nouns.
- Arrows are curved pencil lines with a two-stroke head, drawn on after the thing they point at has appeared.
- Numbers and charts are written by hand in Payne's grey. Bars become strips of wash, and quantities become the depth of a glaze.
- Keep every label ≥ 44 px and inside the vertical safe area.

### Sound (synthesise)
Soft brush swishes (band-passed noise 800–4 kHz, slow attack), water drips (rising sine 500 → 1500 Hz in 30 ms), a gentle page rustle on the transition, and distant soft rain noise under rain scenes.

### Avoid
- **Flat fills with a blur.** Build layered, deformed, transparent glazes with darker edges.
- **Circle-wipe reveals.** Use an irregular soft mask that grows from the brush contact point.
- **Normal blending.** Use multiply so overlaps darken.
- **Pure white or pure black.** Paper is warm and ink is Payne's grey.
- **Too much detail.** Three or four large washes per scene; let the paper breathe.
