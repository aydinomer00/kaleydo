## Style 04 · Pastel Karalama (Crayon Doodle)

A child's wax-crayon drawing in a spiral sketchbook: bold primary colours, zig-zag colouring that spills over the lines, wobbly outlines that never sit still. Joyful and honest; the explanation feels like a kid drew it to show a friend.

### Palette
- Sketchbook paper `#FBF8F1` with a light tooth; dark grey spiral rings `#6E7279` across the top.
- The crayon box: red `#E5403A`, orange `#F28C28`, yellow `#F7CB2D`, green `#4FAF4A`, blue `#2F7FD1`, purple `#7B4FB8`, navy `#24357A` (writing), grey `#8A97A8` (clouds), brown `#8C5A3C`.
- Use colours straight from the box; no gradients and no mixing except by overlapping strokes.

### Material and surface
- **Paper tooth decides where wax sticks.** One shared alpha mask (≈ 70 % coverage, streaky value noise plus fine grain) is used for every colour, so all strokes break up in the same places.
- Strokes are drawn twice (second pass thinner and offset by ~1.5 px) to build a waxy, denser centre.
- Fills are **scribbles**: back-and-forth zig-zags at a slight angle that overshoot the outline by 5–15 px.
- No shadows and no lighting; it is flat paper.

### Typography
- Patrick Hand 400, filled with the crayon pattern (titles 140–160 px, labels 60–70 px).
- The title is coloured syllable by syllable in different crayons; the second line is navy.
- Writing appears word by word with a tiny rotation settle, like it was just written.

### Composition habits
- A child's layout: sun in a corner, cloud opposite, ground strip of grass along the bottom, the big idea in the middle.
- Elements are large and spaced apart; labels go wherever there is empty paper, never on top of colour.
- Two or three numbered notes per frame at most.

### Signature devices
1. **Shared paper tooth** for all colours.
2. **Overshooting scribble fills** that animate as they are coloured in.
3. **Line boil:** outlines re-jitter 8 times per second (new seed each step).
4. **Circled numbers** drawn in red crayon around the digit.
5. **Sketchbook page flip.**

### How to build it (Canvas 2D)
1. Build the tooth mask once (512 px): `alpha = clamp((noise + 0.42)·3.2)`, where noise mixes two value-noise octaves, random grain and a faint diagonal streak.
2. For each crayon colour, cache a pattern: fill a 512 px canvas with the colour, then `destination-in` the tooth. Use it as `strokeStyle` (round caps, 8–36 px widths). Patterns stay anchored to the page, as paper texture should.
3. Scribble generator: walk rows across a shape (circle or band), alternating left/right ends with random overshoot; rotate the zig-zag by a small angle. Reveal with `partial(points, u)`.
4. Outlines: jitter points with smooth noise whose seed is `floor(t·8)` (boil).
5. Text sprites: fill glyphs with the crayon pattern, then once more at 50 % offset by 1.5 px.

### Motion
- Drawing is the animation: lines and fills draw on progressively (0.4–0.8 s each, `easeOutCubic` or smoothstep).
- Characters move in held poses at 8 fps; the waving arm alternates between 3–4 drawn positions.
- Rain loops as short strokes dropping 200 px; nothing else moves continuously.

### Transitions
- Default: keep drawing new things on the same page, or flip to a new page.
- Signature: **sketchbook page flip** (0.9 s). The page lifts over the spiral rings (height `H·cos(e·π/2)`) with a soft shadow, revealing a fresh sheet.

### Information design
- Numbered notes: a red crayon circle with the digit, then navy writing (≤ 4 words).
- Arrows are single crayon strokes with a two-line head. Diagrams are drawn like a kid would explain them: a drop, a beam, a fan of colours.
- Counts are tally marks or rows of scribbled dots.

### Sound (synthesise)
Crayon scratching (short bursts of band-passed noise 1.5–5 kHz with grainy amplitude modulation), a pencil tap for numbers, and a paper flip.

### Avoid
- **Smooth vector strokes.** Every mark needs the tooth gaps.
- **A different texture per colour.** The paper decides the gaps, so share one mask.
- **Neat fills inside the line.** Overshoot and zig-zag.
- **Static lines.** Boil the outlines at 8 fps.
- **Adult typography or layouts.** Keep it naive and large.
