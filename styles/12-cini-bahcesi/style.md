## Style 12 · Çini Bahçesi (Tile Garden)

A glazed ceramic tile panel in the spirit of Ottoman underglaze tilework: motifs painted with a brush on white slip under a clear, glossy glaze, framed by cobalt border friezes. All motifs are original; the style borrows the technique, palette and ornamental logic, not historical designs.

### Palette
- White slip `#F7F4EC` (each tile ±2 % tint), grout `#D9D3C4`.
- Underglaze colours: cobalt `#1F4E9B`, turquoise `#2BA3A7`, raised coral red `#C8402E`, sage green `#4E8B4E`.
- Contour lines in deep blue-black `#1B2840`; white used inside motifs (veins, scales, quatrefoils).
- Red is precious: use it for the hero (tulip, pomegranate, sun core) only.

### Material and surface
- **Tiles** are 180 px squares with rounded corners and 6 px grout between them. Grout runs straight through every painted motif and every letter, because the picture is painted across tiles.
- **Glaze:** a diagonal white highlight streak on each tile (gradient band ≈ 18–42 % across the diagonal) and a faint blue-grey pooling stroke along each tile edge.
- **Underglaze paint:** colour at ~93 % with brush streaks (darker curved strokes, 22 %), slightly softened (0.6 px blur on contours). The red sits a little raised, with a tiny warm shadow below.

### Typography
- Alegreya 800 for titles (cobalt, with the key word in red, ~110 px), Alegreya 700 for labels (50 px) on white cartouches with a cobalt rule.
- Titles are revealed like an inscription being painted: a mask sweeps left to right.

### Composition habits
- Border friezes at the top and bottom rows: cobalt bands with white quatrefoils, red centres and turquoise half-discs.
- A stylised ground band (cobalt with white scale arcs) above the bottom frieze; the hero plant grows from it in a strong vertical with long saz leaves sweeping out.
- Symmetry around the centre axis, generous white tiles around the motif.

### Signature devices
1. **Contour first, colour second:** every motif draws its dark outline progressively, then the brush colour floods in.
2. **Grout through the picture.**
3. **Glaze gloss and edge pooling** on every tile.
4. **Ornamental vocabulary:** quatrefoils, scale bands, rosette suns, pointed tulip petals with white veins, lanceolate saz leaves.
5. **Tile flip:** the signature transition.

### How to build it (Canvas 2D)
1. Pre-render the blank panel: grout background, tiles with individual tints, a light grain, and the friezes. Pre-render the gloss layer (highlight streak and edge stroke per tile) separately.
2. Per frame, paint motifs on top of the blank panel: `painted(points, colour, t0, t1)` strokes the outline for the first 55 % of the time (`partial`), then fills with streaked colour.
3. Draw the grout path over the painting, then the gloss layer on top of everything.
4. For the transition, render the finished frame into a snapshot. Each tile scales horizontally by |cos θ| around its centre, showing the snapshot while cos > 0 and the blank tile after, with a delay that grows diagonally.

### Motion
- Painting is deliberate and steady: contours take 0.4–0.6 s, fills 0.3 s, leaves 1 s.
- Growth (stems) reveals along the path; buds pop with `easeOutBack(1.4)`; petals open with `easeInOutCubic`.
- The rosette sun spins in and keeps a very slow rotation; tiles never move except in the flip.

### Transitions
- Default: paint the next motif on the same panel, or cut to a new panel.
- Signature: **tile flip** (1 s). A diagonal wave of tiles turns over to their blank glazed face.

### Information design
- Labels on white cartouches ("1 · Soğan kışın uyur").
- Use ornament for structure: a frieze can count (one red bud per item), a scale band is ground or water, a rosette is the sun or a focal point.
- Keep everything on the tile grid; diagrams are drawn as painted motifs.

### Sound (synthesise)
Clear ceramic clinks (short sine partials around 2–4 kHz with fast decay), a soft brush swish while painting, a gentle tile clack for each flip in the wave.

### Avoid
- **Clean vector fills.** Paint must show brush streaks and soft contours under glaze.
- **Grout hidden behind motifs.** Grout cuts through everything.
- **Flat matte tiles.** Every tile needs its gloss streak and edge pooling.
- **Copying historical panels.** Compose original motifs in the vocabulary.
- **Red everywhere.** Keep coral red for the hero.
