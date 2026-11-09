## Style 25 · Mozaik Taş (Stone Mosaic)

An ancient floor mosaic that comes alive. Thousands of small stone tesserae sit in light grout; a zigzag border frames a panel with an inscription made of stones, a picture of sea and shore, and a caption band. Each tile is coloured from a small set of stones, so moving figures shift tile by tile like a slow, earthy display. Gold tesserae catch the light now and then.

### Palette
- Stones: black `#2B2522`, dark brown `#4A3B30`, browns `#7A4E2D` `#9C6B3C` `#B98A52`, cream `#E7D8B5`, sand `#D6BC8A` / `#C9A36A`, white `#F3EDE0`.
- Sea: `#1F4E66`, `#2E6A84`, `#4A8DA6`, `#79B2C4`; greens `#5E7B4C` / `#7F9C5E`; terracotta `#B4553A`; gold `#D9A93B` (with glint tones up to `#FFF0B0`).
- Grout `#B9AE9B` with a fine grain.

### Material and surface
- **Tiles:** jittered rectangles on a grid (about 14 px in the picture, 7–8 px for lettering, 10 px for the border), 2–3 px grout gaps, three tones per stone chosen per tile.
- **Relief:** one pre-rendered layer gives every tile a light top-left and a dark bottom-right, composited with `soft-light`.
- **Colour by vote:** the scene is drawn as vector art at 4× the tile grid; each tile takes the stone colour that wins most of its 16 samples, so edges never invent an in-between colour. Dark lettering wins with fewer votes so thin strokes survive.
- **Gold glint:** gold tiles brighten briefly on loop-safe sine pulses.

### Typography
- Cinzel 700 in capitals, made of tiles: the title as a two-line inscription on cream with terracotta lines, captions in two lines on their own band.
- Thicken letters slightly (2.5–3 px stroke) before sampling, and put baselines on tile-row boundaries so round letters do not grow false marks below the line (important for Turkish Ç, Ş, Ğ, İ).

### Composition habits
- Classic panel layout: zigzag border, inscription band at the top, picture in the middle, caption band at the bottom.
- The picture uses mosaic conventions: rows of wave tiles for water, a flat band of sand, figures outlined in dark stones, a round medallion with a gold frame for a second idea.
- Paths are dotted lines of gold stones.

### Signature devices
1. **Living mosaic:** figures move across a fixed tile grid.
2. **Stone inscription** for titles and captions.
3. **Gold route** laid stone by stone behind a travelling figure.
4. **Medallion** for a diagram (the Earth with its magnetic field lines).
5. **Tile flip wave:** the signature transition.

### How to build it (Canvas 2D)
1. Precompute tile rectangles for each region, and the relief layer.
2. Render static regions (border, inscription) once into a base canvas.
3. Each frame: draw the scene into a small canvas (4× tiles), vote a stone per tile, and fill each tile rectangle with its stone's tone; draw caption tiles from pre-sampled caption states; overlay the relief.
4. Cache the colour quantisation (a map from RGB to stone index).

### Motion
- Calm: waves drift on a 4 s cycle, figures glide along smooth paths, flippers flap at about 3.5 Hz.
- Scale changes (a hatchling growing into an adult) happen gradually along the route.
- Captions change with a quick left-to-right flip of their tiles (0.16 s per tile, 0.3 s wave).

### Transitions
- Default: change the picture in place.
- Signature: **tile flip wave** (1.0 s). Every tile turns on its horizontal axis (height follows `|cos πf|`, darkening when edge-on) in a diagonal wave; at the halfway point each tile shows the next picture's stone.

### Information design
- Two-line captions in capitals, one step each.
- A journey as a gold dotted route with the traveller at its head.
- A second idea in a medallion, not in a separate scene.

### Sound (synthesise)
Soft stone clicks for tile flips (short filtered noise with a woody resonance), gentle sea wash (slow-modulated pink noise), a low lyre-like pluck for each caption (decaying triangle wave), and a quiet shimmer for gold glints.

### Avoid
- **Smooth gradients.** Every colour change happens from tile to tile.
- **Thin lines.** Anything thinner than a tile disappears; outline figures with a full tile of dark stone.
- **Lowercase or long captions.** Capitals, two short lines.
- **Colours outside the stone palette.**
