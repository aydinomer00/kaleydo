## Style 38 · Kabarık Nakış (Raised Embroidery)

A hand-embroidered picture stretched in a wooden hoop: dense satin-stitch fills with visible thread direction, French-knot clusters, stem-stitch lines and running-stitch flight paths on natural linen. Soft, warm, cosy; every shape looks padded and slightly raised. There is no animated reference yet: build from this guide (reference image: `site/taslaklar/38-kabarik-nakis.jpg`).

### Palette
- Linen `#E9DCC8` with a visible weave; hoop wood `#D9B98C` / `#B88E5E`, brass screw `#C9A04A`.
- Threads: honey `#F2B33D`, chocolate `#5B3A22`, rose `#E07A8A` / `#C9586E`, leaf greens `#6E8B3D` / `#93A84E`, cream `#F4EAD3`, mustard knots `#E8B32A`.

### Material and surface
- **Satin stitch:** fill each shape with many parallel thread strokes (3–5 px wide, 1 px darker edge, a light highlight line) that follow the form (radial on petals, curved on the bee's body); shapes overlap like padded felt with a soft shadow.
- **French knots:** tight clusters of small domed dots for flower centres and pollen.
- **Stem/back stitch** for antennae, stems and outlines; **running stitch** (dashed short stitches) for motion paths.
- Linen weave: a fine cross-hatch texture; everything casts a 2–4 px soft shadow onto the fabric.

### Typography
- Caveat 700 or Kalam 700 in a thread colour, set as if stitched: draw a soft shadow and a dashed back-stitch underline. Captions on a small stitched fabric tag.

### Composition habits
- A round hoop fills the frame (or the frame is a close-up inside the hoop); one cute hero (bee, ladybug) on one big flower; a stitched hill along the bottom; sparse small motifs (sprigs, knots, cross-stitch sparkles).

### Signature devices
1. Thread direction visible in every fill.
2. French-knot clusters that "pop" in one by one.
3. Running-stitch flight paths that draw on stitch by stitch.
4. **Stitching transition:** the next scene is sewn in with a needle tracing outlines, then fills sweep across.

### How to build it (Canvas 2D)
Pre-render each shape as its own canvas: clip to the shape, draw parallel strokes along a direction field (angle per shape), add per-stroke tone jitter, then a 1 px darker outline and a drop shadow. Animate by revealing stroke lines in order (fill sweeps) and by small rotations of whole stitched pieces (the bee's wings flap a few degrees at 8 fps).

### Motion
- Gentle and tactile: pieces settle with `easeOutBack`, wings flap on an 8 fps toggle, dashed paths draw at a steady pace.

### Sound (synthesise)
Soft needle pops (short filtered clicks), thread pulls (brief rising noise swish), and a calm music-box loop.

### Avoid
- Flat vector fills, hard digital gradients, too many tiny details (keep shapes big enough for stitches to read).
