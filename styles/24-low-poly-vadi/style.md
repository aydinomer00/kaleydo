## Style 24 · Low-Poly Vadi (Low-Poly Valley)

A floating 3D diorama made of flat-shaded triangles: a block of land seen from above at an angle, its cut faces showing coloured rock layers, cone trees and paper-flat clouds around it, a low-poly sky behind. The camera sways a little so the depth is felt. Things change shape over time (land rises, rivers cut, ice grows) while the facets stay crisp.

### Palette
- Sky triangles graded from blue `#7FB7E3` / `#A9CDEB` through a pale band to peach `#F6DCC4` / `#F9C9A4`.
- Land: meadow `#6DBF5A` (one plate) and `#5DB07A` (the other), olive slopes `#8C8A4B`, rock `#8C7A55` → `#8E8F99`, snow `#F4F7FB`, trees `#2F7D4A` / `#3A9A57`.
- Rock layers: `#C9A26B`, `#A87F4F`, `#D8B98A`, `#8B6A45`, `#6E5338`.
- Interface: deep navy `#1F2D4D`, accents orange `#F0A030`, red `#E55B3C`, blue `#5DA9E9`, green `#7BC67E`.

### Material and surface
- **Flat shading:** each triangle gets one colour, `base × (0.5 + 0.5 · max(0, n·L))`, with ±3 % random variation so facets read.
- **Terrain colour by height** (meadow → slope → rock → snow line), per triangle, never blended inside a triangle.
- **Cut faces:** layer boundaries follow the surface but flatten with depth, so folding shows in the rock.
- **Seams:** fill and stroke each triangle with the same colour to hide antialiasing gaps.
- A soft blurred shadow under the floating block.

### Typography
- Exo 2 800 for the title: deep navy letters split into three flat tones by angled bands, with a light offset shadow.
- Exo 2 700 for captions in white on navy chips with one chamfered corner and a coloured number tile.

### Composition habits
- Title and one caption chip in the top third, the diorama in the middle, an infographic strip (time bar, scale) at the bottom.
- Camera from the front-left, about 30° above; the diorama fills ~90 % of the width.
- Only one caption at a time; it slides in from below and is replaced at each step.

### Signature devices
1. **Living terrain:** heights animate (mountains rise, valleys sink) while the triangulation stays fixed.
2. **Cut-away layers** that bend with the surface.
3. **Process arrows** as thick extruded shapes lying on the land, pulsing.
4. **Pop-up props** (cone trees, rocks) with an overshoot.
5. **Facet collapse:** the signature transition.

### How to build it (Canvas 2D)
1. Make a grid of vertices (slightly jittered in x and z), compute heights from a function of time, and split each cell into two triangles (alternate the diagonal).
2. Build the side faces from the edge rows, with layer bands; cull faces whose outward normal points away from the camera.
3. Project with a simple look-at camera and perspective divide; sort all polygons by depth (far first) and fill them.
4. Overlays (glowing boundary line, captions, bars) are drawn in screen space after the polygons.

### Motion
- Slow camera sway (a few degrees, periodic), slow geological change with `easeInOutSine`.
- Props pop up with `easeOutBack`; arrows pulse 1.5 times per second.
- Captions slide 20 px and fade.

### Transitions
- Default: change the heights and colours in place (the land transforms).
- Signature: **facet collapse** (1.1 s). Every triangle shrinks to its own centre with a staggered delay (random plus a top-to-bottom sweep), the scene resets, and the triangles grow back in the same order.

### Information design
- Numbered caption chips, two short lines each.
- A time bar that fills with the process and names the scale at the end ("milyonlarca yıl").
- Before/after in the same model rather than two pictures.

### Sound (synthesise)
Low rumbles for moving land (filtered brown noise with slow swells), soft wooden clicks for popping props, airy wind, and crystalline ticks for the facet collapse (short high sines in a quick random sequence).

### Avoid
- **Smooth gradients on objects.** Facets only.
- **Isometric line drawings.** This style is shaded 3D with a perspective camera.
- **Too many triangles.** Facets must be big enough to see on a phone.
- **Text inside the 3D scene.** Keep words in screen-space chips.
