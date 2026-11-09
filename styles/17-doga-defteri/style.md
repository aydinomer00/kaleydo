## Style 17 · Doğa Defteri (Field Journal)

The open page of a naturalist's spiral-bound notebook lying on a desk: dot-grid paper, quick graphite sketches with loose watercolour washes, fountain-pen handwriting, and things taped in with washi tape (a map card, a found feather). Curious, personal, hands-on: it feels like the viewer is looking over the shoulder of someone who just went outside and noticed something.

### Palette
- Desk `#2F3B34` (dark green cloth) around a kraft notebook board `#9A7853`.
- Page `#F7F1E3` with a faint dot grid `rgba(110,95,75,0.3)` every 40 px.
- Blue-black fountain-pen ink `#24365E` for writing; graphite `#5C5752` for sketches and small pencil notes; a red pencil `#C2553A` for headings, circles and routes.
- Watercolour washes: blue `#2F4C86`, rust `#C2553A`, cream `#E9D3A6`, sea blue `#A8CBDD`, sand `#DDB46C`.
- Tapes: mint `#86CDBB` with dots, coral `#EE9A84` with stripes.

### Material and surface
- **Graphite line:** stroked with a pattern of the lead colour whose alpha is grainy (30–100 %), plus a thinner ghost line slightly offset, like a sketch that was gone over twice.
- **Construction lines:** a faint circle for the head, an ellipse for the body, axis lines for wings. They stay visible under the finished drawing.
- **Watercolour wash:** a loose fill (jittered outline, offset 3–5 px from the pencil), a few darker pigment pools, a darker blurred drying edge, granulation specks; composited with `multiply`. Washes bloom outward from a point inside the form.
- **Paper card and tape:** a slightly whiter card with a soft drop shadow; washi tape is translucent with torn ends.

### Typography
- Caveat 700 for the title (110–130 px) and red headings, Caveat 600 for notes and labels (50–56 px).
- Pencil handwriting (Caveat 600 with knocked-out specks) for the date and place.
- Printed fields in small spaced Inter 600 ("TARİH ....", "YER ....") are part of the blank page and get filled in by hand.

### Composition habits
- Title top-left in two lines with a hand-drawn underline; date and place in the printed fields above it.
- One hero sketch in the middle, labelled with curved arrows and short notes.
- A taped-in card (map, photo, diagram) at the lower left, a column of short notes beside it, a small specimen (feather, leaf) near the bottom.
- Items are slightly rotated; nothing is perfectly aligned.

### Signature devices
1. **Sketch then paint:** construction lines → contour → washes blooming → tiny details (eye, white spots).
2. **Live handwriting:** text is revealed left to right at writing speed.
3. **Hand-drawn annotations:** curved arrows with two-stroke heads, red underlines, a red circle around the key number.
4. **Taped-in items:** cards and specimens drop in with a shrinking shadow, then the tape is pressed on.
5. **Page flip over the spiral:** the signature transition.

### How to build it (Canvas 2D)
1. Pre-render the desk, the board, the page stack and the blank page (with punched holes cut out using `destination-out`), plus the spiral wires in two parts (back part under the page, front part on top).
2. Each frame, draw the page content into an offscreen page canvas, clipped to the page.
3. Sketches: keep the geometry as point lists in a local frame; draw them with `SH.partial(points, u)` for drawing-on; pre-render each wash into its own canvas and reveal it through a growing noisy circle (`SH.blob`).
4. Handwriting: render text sprites once, then draw a left-to-right crop of each sprite.
5. Map cards: pre-render (sea wash with land cut out to leave a paper gap, land washes, pencil coastlines, labels); animate only the route (dashed `partial` line) and the travelling icon.

### Motion
- Calm and steady like real note-taking: one thing at a time, writing at a constant speed.
- Paper items drop in with `easeOutCubic` (scale 1.1 → 1, shadow shrinks); tapes press on in 0.15 s.
- Small icons on maps move along the route; a bird flaps on a 12 fps clock.

### Transitions
- Default: continue on the same page, or cut to a new page.
- Signature: **page flip** (1.1 s). The page rotates up about the hole row with a slight curl (each row of pixels is drawn as a strip with perspective), darkens as it turns, shows its blank back, and disappears behind the spiral, revealing a fresh page with the same printed fields.

### Information design
- Numbers and key facts get a red circle; seasons or steps get red underlined headings.
- Maps are hand-copied and rough, with a dashed route, a start dot and a moving icon.
- Labels sit outside the drawing and point in with curved arrows.

### Sound (synthesise)
Pencil scratching (band-passed noise bursts with a fast tremolo), pen writing (softer, higher), a paper tap when items land, a short sticky rip for tape, and a page flip whoosh with a papery flutter.

### Avoid
- **Perfect vector shapes.** Every line is graphite or ink and slightly wobbly.
- **Washes that fill lines exactly.** Paint sits a little off the drawing.
- **Long paragraphs.** Notes are 2–3 words per line.
- **Typed-looking text.** Only the printed fields use a typeface other than the handwriting.
- **Dense colour.** Most of the page stays paper.
