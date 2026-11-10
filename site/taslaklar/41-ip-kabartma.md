## Style 41 · İp Kabartma (Cord & Yarn Relief)

A textile relief: thick twisted cords and yarn couched onto linen to form the picture. Every line is a plied rope with a visible twist, crossings are tied with tiny knots, leaves are filled with chunky satin-like yarn strokes, curls end in spirals. Tactile, cosy and very graphic. There is no animated reference yet: build from this guide (reference image: `site/taslaklar/41-ip-kabartma.jpg`).

### Palette
- Linen `#E3D3B8` with a weave texture.
- Cords: cream `#F2E6CC`, chestnut `#7A3E1E`, rust `#B9581F`, amber `#E39A2A`; leaves `#3F7A2E` / `#7DAE3C` with lime veins `#B7D45A`; cheeks `#E89A8E`.

### Material and surface
- **Twisted cord:** stroke the path with the base colour, then draw short diagonal twist marks along it (alternating light/dark, spacing ≈ cord width) and a thin shadow line underneath; ends are tucked (small dark dot).
- **Knots** at crossings: small rounded bumps with a highlight.
- **Yarn fills** for leaves and bodies: parallel thick strokes following the form, with braid-like texture on legs.
- Everything casts a soft 3–5 px shadow on the linen.

### Typography
- Grandstander 900 or Baloo 2 800, rendered as cord: draw the letter outlines as twisted cord strokes on the linen.

### Composition habits
- One central hero (spider, snail) on a strong geometric structure (web, spiral), framed by vines and leaves entering from the corners.

### Signature devices
1. **Cord drawing:** structures are laid down along their path like rope being couched (the twist pattern travels with the drawing).
2. Knots tie on with a tiny pop.
3. Spiral tendrils unroll.
4. **Unravel transition:** cords pull away along their paths (reverse drawing) and the next picture is couched in.

### How to build it (Canvas 2D)
Represent every line as a polyline; draw cords with `SH.partial` for the reveal, then place twist ticks by resampling the visible part at a fixed spacing and orienting each tick 45° to the tangent. Pre-render filled shapes (leaves, body) as sprites with directional yarn strokes and shadows.

### Motion
- Steady laying-down of cords, gentle sway of vines, the hero bobs slightly on its structure.

### Sound (synthesise)
Rope friction (band-passed noise with a slow sweep), soft knot pops, and a warm plucked-string melody.

### Avoid
- Thin lines (everything is chunky), flat fills without texture, sharp digital shadows.
