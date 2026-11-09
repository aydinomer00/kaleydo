## Style 13 · Tezhip Işıltısı (Gilded Illumination)

An illuminated manuscript page: burnished cream paper, deep lapis panels, borders of gold-leaf vines and rosettes, with cinnabar and white accents. The gold is alive; a soft highlight slides across it as if the page were tilted under a lamp. Ceremonial, precious, calm. Ornament is original, inspired by the craft of illumination rather than copied from manuscripts.

### Palette
- Burnished paper `#F1E6CC` with a faint sheen.
- Lapis `#16285A` (panels and night skies), deepening to `#0E1A3D`.
- Gold: shadow `#8C6A1F`, body `#C9A23C`, highlight `#F6E3A1`.
- Accents: cinnabar `#B33A2E`, cream `#F7EFDA`; small naturalistic colours (earth blue and green) only inside medallions and diagrams.

### Material and surface
- **Gold leaf** is metallic: a gradient from dark to bright gold whose bright band moves slowly across the page (≈ 5–6 s per pass), plus a leaf texture (fine noise, soft-light). A tiny drop shadow lifts gilded lines off the paper.
- **Lapis** is matte pigment with a subtle vertical gradient.
- **Paper** is burnished: warm cream, fibres, a diagonal sheen.
- **Stars** are four-point gold stars that twinkle gently.

### Typography
- Cinzel Decorative 700 for the title in gold (70–92 px). Cinzel 700 for labels (40 px), cream on lapis cartouches with a gold rule.
- Cinzel is a capitals face, so set Turkish in uppercase with the correct dotted **İ** (ŞEKİL, DEĞİŞTİRİR, BİR), or i and ı become ambiguous.

### Composition habits
- Concentric framing: paper margin → double gold rules → lapis border band with a scrolling gold vine → gold rule → inner lapis sky.
- Strong central symmetry; the main diagram sits in the middle of the inner panel, a row of medallions near the bottom, the title at the top.
- Corner rosettes (eight gold petals) anchor each corner.

### Signature devices
1. **Moving gold sheen** across every gilded element.
2. **Self-drawing illumination:** rules sweep in, vines grow along the bands, rosettes bloom at the corners.
3. **Medallion rows:** a sequence shown as gold-ringed medallions that light up in turn (with a soft `lighter` glow).
4. **Dotted gold paths** for orbits, sight lines and rays.
5. **Gold-dust sweep:** the signature transition.

### How to build it (Canvas 2D)
1. Pre-render the burnished paper and a small gold-leaf texture.
2. Each frame, draw every gilded shape in white into a **mask canvas** (rules, vines, rosettes, stars, title text, orbit, medallion rims). Animate by revealing or growing the shapes.
3. Fill a buffer with the moving gold gradient and the soft-light leaf texture, then `destination-in` the mask and draw the buffer with a tiny dark shadow.
4. Draw lapis panels, colour accents and diagram content (phases with an arc and terminator ellipse) normally.
5. Vines: a sine path along each band with small lobes alternating on both sides at the peaks.

### Motion
- Slow and dignified: the frame draws itself in about 1 s, stars appear one by one, orbits travel at a constant speed.
- The gold sheen never stops; everything else settles.
- Highlights glow in and out (0.3 s) rather than popping.

### Transitions
- Default: fade between inner panels while the frame stays.
- Signature: **gold-dust sweep** (0.9 s). A diagonal edge sweeps from the top-left; behind it the page is blank paper, and a band of twinkling gold specks rides along the edge.

### Information design
- Labels on lapis cartouches with gold rules ("1 · YARISI HEP AYDINLIK").
- Cycles are medallion rows; positions are dotted gold orbits; light is gold rays.
- Numbers stay in Cinzel capitals with old-style elegance.

### Sound (synthesise)
Soft bell tones (sine partials with long decays), a shimmering sparkle for the sheen and the sweep (high random sine pings), and a quiet drone for night scenes.

### Avoid
- **Flat yellow "gold".** Gold needs the moving gradient, the leaf texture and a lift shadow.
- **Lowercase Turkish in Cinzel.** Use uppercase with a dotted İ.
- **Asymmetric clutter.** Illumination is symmetrical and framed.
- **Copying historical ornament.** Build original vines and rosettes.
- **Busy colour.** Lapis, gold and paper do most of the work; accents are tiny.
