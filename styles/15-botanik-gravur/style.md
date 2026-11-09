## Style 15 · Botanik Gravür (Botanical Engraving)

A plate from an old natural-history book, engraved in copper and printed in sepia: tone made only with lines (contour hatching, cross-hatching), lettered figures with fine leader lines, a legend, a plate number. Precise, curious, scholarly but warm.

### Palette
- Aged paper `#F7F0E0`, a slightly darker plate-mark rectangle `#F1E8D3`, sparse foxing spots `#C9A77B`.
- Sepia-black ink `#3B2A1F` for every line; a warm brown `#7A4A2A` only for the second title line.
- No fills, no colour washes: the ink is always a line.

### Material and surface
- **Contour hatching:** lines follow the form, as rings shrunk toward the form's centre.
- **Line weight follows light:** each line segment's width is `0.5 + shade²·3.2` px. In the light (shade < 0.28) segments are skipped, so lines break up, which is the hallmark of engraving.
- **Cross-hatching** only in the deepest shade (a second set of short diagonal strokes).
- Outer contours are the heaviest lines; leader lines are hairlines (1.6 px).
- The paper shows a plate mark and a few soft foxing spots.

### Typography
- EB Garamond: the title in 600 (~98 px), the plate number spaced out (LEVHA I), figure captions "Şek. 1" and legend entries in 500 (38–46 px).
- Letters a, b, c mark parts; the legend explains them ("a · Kabuk: tohumu korur").

### Composition habits
- A double-ruled border inside the paper, the plate number and title at the top, figures arranged with generous space like a specimen page: a small whole view, a large section in the middle, a stage of change at the side.
- The legend bottom-left; captions beside each figure.

### Signature devices
1. **Shade-weighted contour hatching** with breaks in the light.
2. **Sections:** objects open (halves swing apart) to reveal engraved interiors.
3. **Lettered leaders and a legend.**
4. **Burin reveal:** figures appear as if being engraved, wiped in diagonally or left to right.
5. **Burnish wipe:** the signature transition.

### How to build it (Canvas 2D)
1. Engrave each figure once into its own full-frame offscreen canvas.
2. `engraveForm(points)`: compute the centroid and extents. For each ring k (1 → 0.1), scale the outline toward the centroid, resample at 6 px, and draw each segment with a width from a shade function (dot product of the offset from the centre with the light direction, plus a bias). Skip light segments.
3. Cross-hatch: clip to the form and place short diagonal strokes where the shade is above ~0.74.
4. Per frame, reveal plates through animated clip shapes (diagonal triangle or growing rectangle); open sections by rotating halves about their hinge.
5. Draw leaders with `partial`, then their letters.

### Motion
- Calm and methodical: each figure engraves in ~1 s, leaders draw in 0.35 s, legend lines fade in one by one.
- Sections open with `easeInOutCubic` over ~0.9 s.
- Nothing bounces.

### Transitions
- Default: turn to a new plate (cut) or add figures to the same plate.
- Signature: **burnish wipe** (0.9 s). A soft bright band travels down the plate and leaves clean paper behind it.

### Information design
- Parts by letter with a legend; sequences as numbered figures (Şek. 1–3); scale bars and measurements as fine ruled lines with small serif numbers.
- Explain with sections and stages rather than icons.

### Sound (synthesise)
A soft scratch of the burin (very short high-passed noise ticks in rhythm while engraving), paper rustle for section openings, a gentle page turn.

### Avoid
- **Fills or gradients.** Tone comes only from lines.
- **Even line widths.** Lines must swell in shadow and break in light.
- **Straight parallel hatching on round forms.** Follow the contour.
- **Modern sans-serif labels.** Use the serif face and the a/b/c legend.
- **Crowding.** A specimen plate breathes.
