## Style 40 · Halk Damgası (Folk Stamp Print)

A hand-stamped folk print on warm paper: only three inks (brick red, cornflower blue, ochre), worn and uneven stamp texture where the paper shows through, simple flat shapes decorated with geometric folk motifs (triangles, arches, zigzags). Calm, rhythmic and graphic, like a printed children's book. There is no animated reference yet: build from this guide (reference image: `site/taslaklar/40-halk-damgasi.jpg`).

### Palette
- Paper `#F2E2C8` with soft fibres.
- Inks: red `#C8462E`, blue `#3F6FA8`, ochre `#E3A42F`; navy `#1F3354` only for tiny details (beaks, legs).
- Never more than these; overlaps are avoided (each shape is one ink).

### Material and surface
- **Stamp texture:** every shape is filled with its ink, then knocked out with a speckle mask (worn rubber, 10–25 % paper showing), denser at the edges; edges are slightly rough.
- **Folk motifs:** paper-coloured triangles, zigzags, scallops and arch rows cut into shapes (wings, hills) as a second pass.
- Slight misregistration: each ink layer offset by 1–3 px.

### Typography
- Josefin Sans 700 or Alfa Slab One in one of the inks, with the same worn stamp texture; short words, generous letter spacing.

### Composition habits
- Big sky with sun and clouds as simple stamps, a flock or a single animal in the middle, layered hills with motif bands at the bottom, decorative plants in the corners.
- Repetition is a feature: flocks, rows of arches, repeated leaves.

### Signature devices
1. Shapes appear as if stamped: a quick press (scale 1.03 → 1) with the texture "inking in".
2. Repeated motifs stamped in a rhythm.
3. A flock moving in formation, wings flapping on a 6–8 fps toggle.
4. **Stamp transition:** a large patterned stamp presses over the frame, lifts away and leaves the next scene.

### How to build it (Canvas 2D)
Pre-render each shape per ink: fill, cut motifs with `destination-out`, apply a fixed speckle mask (also `destination-out`), then composite with `multiply` onto the paper. Keep the speckle mask fixed per stamp so the texture does not crawl when shapes move.

### Motion
- Measured and rhythmic: stamps land on the beat, flocks glide steadily, hills slide gently in parallax.

### Sound (synthesise)
Soft rubber stamp thuds (low filtered noise burst), paper rustle, and a simple folk-like plucked melody (triangle wave, pentatonic).

### Avoid
- Gradients, more than three inks, clean digital edges, realistic detail.
