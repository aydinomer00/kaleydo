## Style 14 · Linol Oyma (Linocut Print)

A two-colour relief print pulled by hand: dense black ink with white V-gouge cuts, a red second block printed slightly off-register, ink starved in specks where the paper's texture resists it. Bold, graphic, a little wild. Animation feels like a run of printed frames.

### Palette
- Rag paper `#F2EEE4` (with visible fibres).
- Black ink `#1C1A19` — the dominant mass.
- One accent block: red `#D2452F` (moon, title word, rule). Never more than two inks.

### Material and surface
- **Carving:** whites are cut out of black. A V-gouge cut is a stroke pointed at both ends and widest in the middle (`width = sin(π·u)·w`). Cuts follow the form: horizontal chips in skies, curved halos around light sources, dense parallel cuts to make far hills read grey, short angled cuts for fur.
- **Ink starvation:** thousands of tiny paper-coloured specks knocked out of both blocks.
- **Registration:** the red block is printed first, offset about 6 px from the black.
- Both blocks multiply onto the paper (ink, not paint).

### Typography
- Alfa Slab One for everything (titles ~104 px, labels 50 px): heavy slab letters like wood type.
- The title is printed above the block in black with the key word in red and a red rule beside it.
- Labels sit on a banner carved out of the black block (black letters on bare paper).

### Composition habits
- A framed rectangular block occupying most of the frame, a paper margin around it, the title in the top margin.
- One huge graphic form (moon, sun, mountain) in red, a black silhouette against it, black ground layers below.
- Silhouettes read only where they overlap the red, so place the hero in front of the light.

### Signature devices
1. **Gouge cuts** with pointed ends.
2. **Halo cuts:** concentric carved arcs around a light source.
3. **Grey by cutting:** dense parallel cuts turn black into mid-tone for distance.
4. **Re-cut at 8 fps:** every 1/8 s the carving is re-seeded, like a sequence of separately printed frames.
5. **Peel the print:** the signature transition.

### How to build it (Canvas 2D)
1. Pre-render the paper and an ink-starvation mask (≈ 26 000 small random ellipses).
2. Each frame, draw the red block into a buffer (filled shapes, `destination-out` gouges, starvation).
3. Draw the black block into another buffer: fill the block, `destination-out` windows (moon) and carved marks, fill silhouettes and ground, carve again, then starve.
4. Composite onto the paper with `multiply`: red offset by (6, −5), black at (0, 0). Text is drawn the same way.
5. Build silhouettes from several simple masses and fill each separately; one combined path with mixed windings punches holes.

### Motion
- Stepped at 8 fps for everything carved (sound rings expand in steps, a head lifts in steps).
- The print "presses in" at the start (ink coverage fades up over 0.7 s).
- Sound or energy is shown as carved rings expanding outward and fading in width.

### Transitions
- Default: cut between prints.
- Signature: **peel** (0.95 s). The printed sheet lifts from the bottom-right corner along a diagonal fold, showing the white back with a soft shadow, and reveals blank paper underneath.

### Information design
- Labels on carved banners ("1 · Sürüsünü çağırır").
- Myth-busting works well: bold short statements ("Ay'a değil, sürüsüne ulur!").
- Diagrams must be graphic: arrows as carved chevrons, counts as rows of carved notches.

### Sound (synthesise)
Low wooden thuds for presses, a sticky ink-roller hiss (rolling filtered noise), and atmospheric wind for night scenes. Wolf howls should be synthesised (a gliding sine with vibrato) rather than sampled.

### Avoid
- **Flat vector black.** Black needs cuts and starvation specks.
- **Gradients.** Tone comes from cut density only.
- **More than two inks,** or perfect registration.
- **Thin, even "stroke" cuts.** Cuts taper at both ends.
- **Smooth 30 fps motion of carved things.** Step at 8 fps.
