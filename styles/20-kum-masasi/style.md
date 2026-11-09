## Style 20 · Kum Masası (Sand Table)

Sand animation on a lightbox: warm light shines up through a layer of sand on glass. Thick sand is dark, thin sand glows amber, and lines cleared with a fingertip shine brightest, with a darker rim where the sand was pushed aside. Shapes are poured, lines are drawn with a finger, grains hop and slide, and at the end a palm sweeps the table back to an even layer. It feels hand-made, live and a little magical.

### Palette
- Light: centre `#FFF1CC` → amber `#F9C978` → orange `#DE8C3A` → burnt edge `#9F521C` (one radial glow).
- Sand: dark brown `#3A2311` with lighter grains `#96602E` and darker specks; its opacity is its thickness.
- No other colours. Every tone is light × sand thickness.

### Material and surface
- **One density map.** Everything is drawn as alpha into a single canvas: 0 = bare glass, 1 = thick sand. The even starting layer is about 37 % with soft, blurry unevenness.
- **Pour** (adds sand): fill shapes at 88–92 % with a 1.5 px blur.
- **Fingertip** (removes sand): first stroke a wider, blurred rim at 25–35 % (the pushed sand), then cut the groove with `destination-out` at about 92 %.
- **Grain:** a fine speck pattern is subtracted from the whole density map every frame; loose grains scatter at pouring fronts.
- **Light:** draw the glow, then the sand texture masked by the density map (`source-in`), on top.

### Typography
- Raleway 600. Poured letters (dark) on bright, thin-sand areas: title 104 px, labels 46 px.
- Fingertip letters (bright with a dark rim) inside thick sand for the key sentence (~64 px).
- Lowercase labels, short lines; no boxes or outlines.

### Composition habits
- Big simple silhouettes: a horizon of thick sand at the bottom, one large subject, a cleared sun or moon.
- Bright sky above, dark ground below; text sits where its contrast is strongest.
- Process arrows are fingertip lines with two-stroke heads.

### Signature devices
1. **Light-through-sand** tonality: three readable levels (glow, thin, thick).
2. **Fingertip lines with rims** for contours, wind, rays and arrows.
3. **Moving grains:** dark dots hopping along a slope, little bright slides running down a steep face.
4. **Ghost outline:** a dotted fingertip line where something used to be.
5. **Palm sweep:** the signature transition.

### How to build it (Canvas 2D)
1. Pre-render the glow, the even base layer (alpha), a speck pattern and a sand-colour texture.
2. Each frame: draw the base into the density canvas, then the scene (pours, fingertip lines, grains) in time order, then subtract the speck pattern.
3. Composite: glow, then a copy of the density canvas filled with the sand texture via `source-in`.
4. Move things by translating their pours and grooves together (the dune walks by translating its shape, contours and slides).

### Motion
- Pours spread with a moving front and a spray of grains (0.5–0.8 s).
- Fingertip lines draw at a steady hand speed with an ease in and out.
- Continuous small motion during explanations: hopping grains, sliding streaks.

### Transitions
- Default: pour sand over part of the scene and draw the next one in it.
- Signature: **palm sweep** (1.2 s). A diagonal heap of pushed sand (steep at the front, tapering behind, loose grains ahead) crosses the table; behind it the even layer returns with a few soft palm streaks.

### Information design
- Cause and effect as movement: wind lines → hopping grains → sliding face → a walking shape.
- Before/after with a ghost outline instead of two pictures.
- One bright sentence written into the dark sand for the takeaway.

### Sound (synthesise)
Sand hiss (pink noise through a band-pass, amplitude following the drawing speed), soft grain patter (sparse clicks), a low whoosh for the palm sweep, and a quiet wind bed.

### Avoid
- **Outlines in a separate colour.** Lines are either poured (dark) or cleared (bright).
- **Flat fills.** Sand always has grain and slightly uneven thickness.
- **Small details.** Sand cannot hold them; keep shapes big and bold.
- **Busy backgrounds.** The light itself is the background.
