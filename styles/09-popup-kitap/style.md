## Style 09 · Pop-up Kitap (Pop-up Book)

A hardcover pop-up book opened at 90°: the far page stands upright as a painted backdrop, the near page lies flat as the floor, and cardstock layers rise from the gutter. Mechanics drive the story: pull-tabs, lift-the-flaps, layers that unfold. It feels like a treasured picture book.

### Palette
- Pages `#FBF6EA` (cream) with a backdrop page `#EAF3F4` washed with sky blue at the top.
- Binding cloth green `#2E5E4E` / `#3F7A66` with gold `#E2B85B` lettering on the cover.
- Pop-up papers: soil `#8A5A3B`, leaves `#7CC46B` `#5DA35A` `#4F9A55`, trunk `#8B5E3C`, sun `#F4B740`, white clouds.
- Mechanics accent: pull-tab red `#D2533F`. Text ink `#2C2620`.

### Material and surface
- Matte cardstock pieces with cut edges, fibre texture and small contact shadows (reuse the cut-paper piece renderer).
- The two pages bend into the gutter: a soft brown gradient toward the spine on both pages, plus stacked page edges at the near side.
- A pop-up that is still rising is darker (it faces away from the light) and casts a soft shadow onto the upright page behind it.

### Typography
- DM Serif Display for titles (110–130 px, ink and binding green), DM Sans 700 for flap labels (56–60 px).
- The cover carries the topic word in gold.
- Titles fade up gently above the book; they are not part of the paper.

### Composition habits
- The book occupies the lower 60 % of the frame: the upright page from y ≈ 730 to the gutter (y ≈ 1330), the floor page below it.
- Pop-ups are layered from back to front: sun and sky details, tall subject (tree), mid panel (soil cross-section), small front details (sprout, grass).
- Labels live on the floor page (left), the pull-tab sticks out of the right page edge.

### Signature devices
1. **90° spread:** an upright backdrop page plus a floor page, with spine shading.
2. **Rising layers:** each pop-up scales vertically from its glue line with `sin(π/2·k)`, darker while tilted.
3. **Pull-tab:** a red arrow tab labelled "ÇEK" slides out and the action follows it (sprout grows, a wheel turns).
4. **Lift-the-flap labels:** a numbered disc and a short word on a card that flips up and down.
5. **Close the book:** the signature transition.

### How to build it (Canvas 2D)
1. `stand(k, baseY, draw)`: translate to the base line, `scale(1, sin(π/2·k))`, apply `filter = brightness(0.68 + 0.32·sy)` while rising, then draw. Draw the shadow first: the same shape, blurred, offset up-left, clipped to the upright page.
2. Pages are cut-paper polygons with gradient shading toward the spine; the upright page uses the same `stand` so it rises when the book opens.
3. Pop-up timing: back layers rise first, each canopy layer 0.25 s after the previous one, with `easeOutBack(1.4)` so the cardstock overshoots slightly.
4. The cover flips around the spine (`scaleX = cos(open·π)`, lighter colour on its inner side).
5. Everything that grows (roots, stems) is a progressively revealed strip.

### Motion
- Mechanical, satisfying motion: rising layers overshoot slightly, tabs slide with `easeInOutCubic`, flaps flip with `easeOutBack`.
- Growth is continuous (roots and stems extend smoothly); swaps happen by layers folding down and new ones rising.
- At most one mechanism moves at a time, so it reads like a hand operating the book.

### Transitions
- Default: fold the current layers down and raise the next set (a page turn is optional).
- Signature: **close the book** (0.9 s). Pop-ups fold flat, the upright page lies down, the cover swings over and shows the title word.

### Information design
- Steps on lift-the-flaps ("1 Filizlenir", "2 Fidan olur", "3 Ağaç olur").
- Cross-sections are pop-up panels (soil, water, the inside of a hive) with drawn details inside.
- Use a pull-tab whenever the viewer should feel cause and effect.

### Sound (synthesise)
Paper whooshes for rising layers (short band-passed noise swell), a crisp card snap at full height, a soft slide for the pull-tab, a book thump on close.

### Avoid
- **Flat 2D stacking.** Layers must rise from a glue line and cast shadows on the upright page.
- **Pop-ups floating in empty space.** Give them a backdrop page.
- **Mechanisms that do nothing.** Every tab or flap triggers a visible change.
- **Clutter.** Three to five pop-up layers per spread.
- **Shading the whole frame while a layer rises.** Darken only the rising piece.
