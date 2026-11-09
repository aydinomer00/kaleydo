## Style 03 · Hamur Dünyası (Clay World)

Plasticine stop-motion on a small tabletop set: rounded, lumpy, softly glossy clay pieces lit from the top-left, with fingerprints and tool marks. Playful and funny; everything looks squeezable.

### Palette
- Backdrop gradient: pale sky `#CFE6EA` to warm cream `#F6E7C8` (a painted card behind the set).
- Clay colours, slightly desaturated as real plasticine: green `#86BD6B`, orange `#E07B39`, red `#E25B4C`, teal `#3FA7A0`, yellow `#F3C64B`, beige `#D9C2A3`, cream `#FFF1DC`, dark brown `#3A2E2A` for eyes and lettering on slabs.
- Highlights are warm white and shadows are warm brown-grey. Never use pure black.

### Material and surface
- Clay is **inflated volume**: edges round off, the centre is broad and flat, and light rolls over the rim.
- Soft specular highlights (glossy but not plastic), lit from the top-left; matte diffuse elsewhere.
- Surface is never perfectly smooth: low-frequency lumps, fine bumps and one fingerprint swirl per piece.
- Contact shadows are soft and warm (blur ≈ 16 px, offset 5/8 px).

### Typography
- Grandstander 900 for headlines, **modelled in clay** with the same lighting as everything else (100–130 px).
- Labels are clay letters stuck onto a cream clay slab (58 px), with a clay ball carrying the step number.
- Letters arrive like squashed clay: they drop in with a spring and settle with a little vertical squash.

### Composition habits
- A small set: backdrop, a clay ground slab across the bottom quarter, a hero character large in the middle, two or three props (mushroom, flower, cloud, sun).
- Characters are 30–40 % of the frame width; props stay at the edges.
- Labels float above the action on slabs; one at a time.

### Signature devices
1. **Height-map lighting:** every piece is lit from its own blurred silhouette, so text, shells and clouds all share one believable light.
2. **Spiral grooves and pressed marks** carved into the height map (shell coils, button holes, fingerprints).
3. **Stop-motion boil:** 12 poses per second with ±2–3 px and ±0.03 rad random re-placement per pose.
4. **Squash and stretch** on every landing and while crawling.
5. **Rolling-pin transition.**

### How to build it (Canvas 2D)
1. For each piece, paint its silhouette in white on an offscreen canvas (with padding) and blur it (`ctx.filter = 'blur(8–22px)'`). The blurred alpha, raised to 0.7 and multiplied by a depth of 30–60 px, is the height map.
2. Add noise to the height map: 2D value noise at two scales (±1.6 and ±0.5) and a fingerprint (`sin(d·1.15)` inside a 60 px radius). Optional `press` masks subtract height (grooves, debossed marks).
3. Normals come from central differences, `n = normalize(−dh/dx, −dh/dy, 1)`. Shade with `0.42 + 0.9·max(0, n·L)` and add a Blinn specular `pow(n·H, 34)·0.42`, where L ≈ (−0.55, −0.65, 0.53).
4. Write the lit pixels into a sprite once (`putImageData`), keeping the silhouette alpha. Per frame, only draw sprites with transforms and a soft shadow.
5. Text uses the same function with `fillText` as the silhouette.

### Motion
- Puppets move on a 12 fps clock (`floor(t·12)/12`); a camera never moves in claymation.
- Crawling: horizontal stretch `1 + 0.06·sin(t·10)` with inverse vertical squash. Landing: spring with overshoot.
- Swaps between states are visible "replacement pieces" (a bigger shell replaces a smaller one with a little pop), not morphs.

### Transitions
- Default: cut, or replace props on the same set.
- Signature: **rolling pin** (0.9 s). A long clay cylinder rolls from top to bottom; above it a fresh, empty backdrop is revealed.

### Information design
- Numbers are clay balls with raised cream digits; labels are slabs with 2–4 words.
- Arrows are clay snakes with a squashed triangular head. Quantities are stacks of clay balls or rings on a shell.
- Big type only; text below 56 px is unreadable with clay shading.

### Sound (synthesise)
Squishy pops (short low sine thumps 110–170 Hz with a soft noise click), sticky slide sounds (low-passed noise with a slow swell), a cartoon "boing" for landings (sine glide down), and wooden table taps.

### Avoid
- **Flat fills with a drop shadow.** Every piece needs the height-map volume, including the letters.
- **Plastic gloss.** Keep the specular soft and small (exponent ~30, ≤ 0.5 intensity).
- **Smooth tweening of puppets.** Motion steps at 12 fps with boil.
- **Perfect surfaces.** Add lumps and one fingerprint per piece.
- **Thin details.** Clay cannot hold thin lines; use chunky shapes and grooves instead.
