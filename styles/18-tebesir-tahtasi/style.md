## Style 18 · Tebeşir Tahtası (Chalkboard Lesson)

A classroom chalkboard in a wooden frame with a chalk tray: the lesson is drawn and written live in coloured chalk, with ghosts of earlier lessons still faintly visible. It feels like a friendly teacher explaining step by step, and it ends with the board being wiped clean.

### Palette
- Green slate `#2C4A3E` with lighter eraser swirls and half-erased sums (white at 5–7 %, blurred).
- Chalk: white `#F2F0E6` for words and arrows, yellow `#F5DE6E` for light, energy and the key word, pink `#F2A3B5` for products, blue `#93CBEA` for water and gases, green `#A9DB8C` for plants.
- Frame and tray in oak (`#9C6B3A`, lighter `#BC8A52`, darker `#6E4626`) on a cream wall `#E7DEC8`.

### Material and surface
- **Chalk tooth:** all chalk is drawn into one layer, then a fixed speckle texture is subtracted with `destination-out` (≈ 85 % strength). Because the texture is fixed to the board, every line and letter breaks up in the same places, like real chalk on slate.
- **Two-pass strokes:** a firm stroke plus a thinner, wandering stroke at 55 % opacity.
- **Side-of-chalk shading:** wide (18 px), low-opacity diagonal strokes clipped inside a shape.
- **Dusty halo:** the chalk layer is drawn once more underneath, blurred by 3 px at about 30 % opacity.
- The tray holds chalk sticks, dust and the eraser.

### Typography
- Kalam 700 for everything: the title in two lines (~96 px) with a wavy underline, labels 48–60 px in the colour of what they name, the key word in yellow at ~104 px with a double underline.
- Kalam has no arrow or subscript glyphs: draw arrows as chalk lines and set subscripts (CO₂, O₂) as a smaller "2" lowered by about 14 px.

### Composition habits
- Title top-left, one large central drawing, labels around it with arrows, a summary formula near the bottom, the key word last.
- Colours stay consistent: each colour belongs to one ingredient everywhere (formula included).
- Leave dark board between groups; the board should never look full.

### Signature devices
1. **Chalk tooth** breaking up every stroke.
2. **Ghost lessons** on the board.
3. **Side-of-chalk hatching** to fill shapes.
4. **Moving chalk symbols:** small chevrons climbing a stem, bubbles drifting in and out, rays that flicker on a 6 fps clock.
5. **Eraser wipe:** the signature transition.

### How to build it (Canvas 2D)
1. Pre-render the wall, frame (wood with grain lines), board with ghosts, and tray into one static canvas.
2. Each frame: clear the chalk layer, draw the lesson (strokes with `SH.partial`, text sprites revealed left to right), subtract the tooth texture, draw the layer blurred at low alpha, then draw it sharp.
3. Keep the tooth pattern's transform fixed so chalk breaks up in the same places every frame.
4. For the wipe, build a mask from eraser rectangles sampled every 14 px along its path and subtract it from the chalk layer.

### Motion
- One element at a time in teaching order; writing at a constant speed; arrows draw from tail to head and get their head at the end.
- Small cyclic motions (chevrons, bubbles, flickering rays) keep the board alive during holds.
- The lesson clock can run slightly fast so the content is complete before the wipe.

### Transitions
- Default: keep adding to the same board.
- Signature: **eraser wipe** (≈ 1.35 s). The felt eraser lifts from the tray, sweeps the board in four wide horizontal passes (motion trail, puffs of dust drifting down), leaves soft smears that settle, and returns to the tray, so the board is back to its ghosted starting state.

### Information design
- Processes as "ingredients → result" with arrows from the sources into the object and out of it.
- A one-line formula that repeats the colours of the diagram, then the name of the process in yellow.
- Labels in lowercase, short and concrete ("su (kökten)", "oksijen").

### Sound (synthesise)
Chalk tapping and scratching (short band-passed noise ticks with irregular rhythm), a squeak on long lines (a brief high sine glide), soft thuds for dots, and a long breathy swish with low rumble for the eraser.

### Avoid
- **Clean vector lines.** Every stroke must show the tooth.
- **Pure white.** Chalk is warm off-white and slightly transparent.
- **A spotless board.** Keep the ghosts of earlier lessons.
- **Too many colours in one element.** One colour per idea.
- **Text in a typed font.** Everything is chalk handwriting.
