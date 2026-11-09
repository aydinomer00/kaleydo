## Style 08 · Origami

A world of folded paper: every object is a set of flat facets with crisp creases, each facet a little lighter or darker depending on which way it faces. Quiet, elegant and precise; transformations happen by folding.

### Palette
- Backdrop: soft paper gradient from sky `#CFE3EA` to rice paper `#F5EEE2`.
- Folding papers: red `#D64545`, indigo `#2F3B66`, sea green `#6FA39A` with light `#9CC6BB` and dark `#4E857F`, saffron `#F2A93B`.
- Text in deep indigo `#25304F` and red; ribbons are indigo with white type.
- A facet's colour is the paper colour mixed toward white (lit, up to +45 %) or toward deep blue-black (shaded, up to −42 %).

### Material and surface
- Paper is thin, matte and crisp. There are no rounded edges and no gradients inside a facet.
- **Facet shading:** two faces meeting at a crease always differ in brightness, so the fold reads.
- **Crease highlight:** a 1.2 px white line at 35 % along facet edges.
- A light fibre texture over each facet (soft-light) and over the backdrop.
- Shadows are minimal; depth comes from facet contrast and overlapping layers.

### Typography
- Josefin Sans 700, geometric and light-footed (titles ~110 px, ribbons 60 px).
- Titles unfold downward like a flap (vertical scale 0 → 1 with a slight overshoot).
- Labels sit on **folded ribbons**: an indigo strip with a notched right end and a darker folded-back triangle on the left.

### Composition habits
- Layered landscape of faceted mountains along the bottom third; a faceted sun (an octagon of eight alternating triangles); open sky for the action.
- Characters are small-to-medium and repeated (flocks, schools, rows), arranged in clear geometric formations.
- Lots of empty sky. Symmetry and diagonals.

### Signature devices
1. **Lit/shaded facet pairs** on every shape (mountains, sun, characters).
2. **Self-folding:** a character morphs triangle by triangle from a flat square into its shape (same facet count in both layouts).
3. **Formations:** objects arrange into V shapes, rings and lines and swap places smoothly.
4. **Folded ribbon labels.**
5. **Accordion fold:** the signature transition.

### How to build it (Canvas 2D)
1. Define each character as a list of triangles in local coordinates with a lighting value per facet (−1…1). Define the same number of triangles for a flat square layout.
2. Morph: interpolate every vertex between the square and the character (`ioC`, 1.2 s) and interpolate the lighting values too.
3. Draw a facet: fill the mixed colour, soft-light a fibre pattern clipped to it, stroke a thin white crease line.
4. Wings flap by scaling the wing tip's y offset with `sin(t·7)`; keep the body facets fixed.
5. Pre-render the backdrop (gradient, texture, mountains as lit/shaded triangle pairs, faceted sun) once.

### Motion
- Smooth and graceful at 30 fps: `easeInOutCubic` for folds and position swaps, gentle sinusoidal bobbing (±6 px) for flyers.
- Folds take 0.4–1.3 s; nothing snaps. Titles and ribbons unfold with `easeOutBack(1.3–1.6)`.

### Transitions
- Default: fold the current subject into the next one (morph), or cut.
- Signature: **accordion fold** (0.85 s). Split the frame into 6 vertical strips; compress them toward the right edge (`width = sw·cos(e·π/2)`), alternating lit and shaded, revealing the plain backdrop.

### Information design
- Steps on folded ribbons ("1 · …").
- Structure with formations: a V for teamwork, a ring for cycles, a line for order.
- Numbers as large folded digits or as a count of identical folded objects; arrows are long thin folded triangles.

### Sound (synthesise)
Crisp paper folds (very short bright noise snaps 2–6 kHz), soft paper flutter for wings (rhythmic filtered noise), a gentle wind bed, and a soft bell for completion.

### Avoid
- **Gradients and rounded corners.** Facets are flat and edges are straight.
- **Single-tone shapes.** Every form needs at least one lit/shaded crease pair.
- **Cross-fades between shapes.** Change shape by folding (vertex morph).
- **Heavy shadows.** Origami depth comes from facets.
- **Busy scenes.** One formation and one idea per frame.
