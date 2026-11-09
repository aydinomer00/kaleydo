## Style 02 · Keçe Diyarı (Felt Land)

A page from a hand-sewn felt "quiet book": thick wool felt shapes with fuzzy edges, visible running stitches, buttons and thread. Warm, tactile, toddler-friendly. It should look as if someone cut and sewed every piece by hand and then moved it frame by frame.

### Palette
- Sky felt `#BFD7DF` as the page, grass felts `#8DBE7A` / `#6FA867`, leaf `#5E9B57`, branch `#8B6A4E`.
- Accent felts: sun yellow `#F2C14E`, orange `#E8834E`, cornflower blue `#5B8BC9`, red `#D9594C`.
- Cream felt `#F4E9D8` for tags and banners; chocolate `#4A3428` for lettering; off-white thread `#FFF4E0`, red thread for tags.
- Felt is matte and slightly dusty; avoid saturated neon and pure white.

### Material and surface
- **Wool fibres:** every piece carries a texture of thousands of short curly strands (light and dark, 3–12 px). Blend it with soft-light over the fill colour.
- **Fuzzy cut edge:** loose fibres cross the outline. Sample the outline every ~2.5 px and draw 1–2 short strokes (2–8 px) pointing mostly outward, slightly lighter or darker than the piece.
- **Thickness:** felt is 2–3 mm thick. Use a soft drop shadow (blur ≈ 10 px, offset 2–4 px) and a puffy inner darkening along the edge (stroke the outline inside the clip with a blurred dark line).
- **Stitches:** a running stitch about 10 px inside the edge: dashes ~10 px long with 7 px gaps, 3–4 px thick, each with its own tiny shadow so it sits on top.
- Buttons have four holes and a crossed thread.

### Typography
- Baloo 2 800 for headlines (80–100 px), Baloo 2 800 at 56 px for tags. Chocolate on cream; one accent line in red.
- Type always sits on a stitched felt banner or tag, never directly on the sky.
- The banner drops in on a spring and keeps swaying slightly, like a hung felt sign.

### Composition habits
- One stage: a branch across the middle, a large hero piece (leaf, nest, shell) and the character on it. Big, simple, chunky shapes.
- Sky top half, layered felt hills at the bottom. Tags sit between the story and the hills.
- Characters are built from round felt pieces (segments, button eyes, pom-pom antennae).

### Signature devices
1. **Fuzzy halo** of loose fibres on every edge.
2. **Running stitches** on every piece, in a contrasting thread.
3. **Button numbers:** step numbers are felt discs sewn onto the left edge of each tag.
4. **Thread trails:** a flight or path is drawn as a red running stitch that sews itself along the route.
5. **Quiet-book page turn:** the signature transition.

### How to build it (Canvas 2D)
1. Pre-render a 512 px wool-fibre texture once (≈ 9 000 short curved strands on mid-grey).
2. **Cut each piece once into a sprite:** fill → fibre texture (soft-light, clipped) → blurred inner edge → fuzzy halo strokes → stitches (inset outline via vertex normals) → extras (veins, spots, button holes). Keep the sprite and its offset.
3. Per frame, only transform and draw sprites (`drawImage` with a soft shadow). This keeps a 1080×1920 frame fast.
4. Characters are arrays of sprites positioned per frame; an inchworm crawl uses `sin(t·9 − i·0.9)` per segment.
5. Use seeded random for every fibre, stitch jitter and wobble.

### Motion
- **Stop-motion:** all puppets move on a 12 fps clock (`floor(t·12)/12`), with a tiny per-pose wobble (±0.04 rad) so pieces look re-placed by hand.
- Type and the page turn stay smooth (30 fps).
- Pieces pop in with `easeOutBack` and hang with a damped spring. Wings flap as `0.55 + 0.45·|cos|` scale on the stop-motion clock.

### Transitions
- Default: slide new felt pieces onto the same page, or cut to a new page.
- Signature: **quiet-book page turn** (0.85 s). A full felt page hinged on one edge turns over the scene (`width = W·sin(π/2·e)`), with a soft shadow on the free edge and darkening while it is nearly edge-on.

### Information design
- Steps are numbered felt discs with white digits plus a stitched cream tag with 2–3 words.
- Paths and arrows are running stitches with a felt arrowhead. Counts are rows of felt buttons or pom-poms.
- Keep tags ≥ 56 px text and inside the safe area; never more than one tag at a time.

### Sound (synthesise)
Soft fabric rustles (low band-passed noise), muted "pop" for pieces placed (short 120–180 Hz thump), a quick thread zip for stitch trails (rising noise sweep), a gentle wooden button click for numbers.

### Avoid
- **Smooth vector edges.** Every edge needs the fibre halo.
- **Fake stitches as a dashed stroke without depth.** Each stitch needs its own shadow and must sit inside the edge.
- **Smooth 30 fps puppet motion.** Puppets step at 12 fps; only type and transitions glide.
- **Glossy highlights.** Felt has none; use the inner darkening for volume.
- **Tiny pieces.** Felt reads at large scale; at most 6–8 pieces on screen.
