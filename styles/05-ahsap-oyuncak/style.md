## Style 05 · Ahşap Oyuncak (Wooden Toy)

Painted wooden toys on a birch tabletop in front of a pastel wall: chunky shapes with flat faces and softly rounded edges, wood grain showing through the paint, paint chipped at the corners. Calm, tactile, Montessori-like. Things are moved by hand, one pose at a time.

### Palette
- Wall `#DCEDE4` (mint, matte paint) over a birch table `#E9CC9E` with visible horizontal grain.
- Raw wood `#E7C48E`, ring lines `#B9874F`, bark `#6B4428`.
- Toy paints: red `#D94B3C`, green `#4E9F55`, yellow `#F2B93B`, blue `#3F7CC4`, cream `#FFF3DF`; lettering on cream in `#3B2A1E`.
- Paints are slightly muted and semi-opaque, so the grain darkens them in lines.

### Material and surface
- **Grain** is a sine of the vertical coordinate warped by low-frequency noise (fibres), sharpened (`pow(v, 6)`) into thin darker lines, plus fine noise. Paint multiplies it at ~12 %, raw wood at ~35 %.
- **Bevelled edges:** faces are flat; only a 5–10 px band at the edge rolls off. Light comes from the top-left with a weak satin highlight.
- **Chips:** near edges, noise above a threshold reveals raw wood under the paint.
- Shadows are warm and medium-soft (blur ≈ 14 px, offset 6/9 px), as if lit by a window.

### Typography
- Nunito 900, built as **wooden cut-out letters** with the same bevel and grain (100–120 px), one paint colour per line.
- Signs and badges: cream or yellow painted boards on dowel pegs with Nunito 900 text (60–76 px) in dark brown.
- Letters drop onto the scene on a spring with a hand-placed wobble.

### Composition habits
- A shallow set: wall top two thirds, table bottom third with its front edge as a horizon.
- One hero object large on the table (log slice, block tower, toy animal), one supporting toy, one sign.
- Objects stand on the table; they never float, except for the title.

### Signature devices
1. **Grain under paint** with chipped edges.
2. **Bevel lighting:** flat faces with rounded, lit edges.
3. **Counting tokens:** round painted discs with numbers, placed one by one.
4. **Rolling and stacking:** wheels roll in (rotation = distance / radius), blocks stack with a spring.
5. **Topple-and-drop:** the signature transition.

### How to build it (Canvas 2D)
1. Bake each piece once, per pixel: paint the silhouette and blur it by 5–10 px. Height = `smoothstep(clamp(alpha·1.6))·depth`, which gives a plateau with a rounded rim.
2. Normals come from central differences. Shade with `0.5 + 0.75·max(0, n·L)` and add a small Blinn specular (exponent 40, ≤ 0.25).
3. The surface colour comes from a function `colorAt(x, y, edge)`: paint × grain, or raw wood where an edge chip occurs. For log slices, compute rings from the warped radius: dark latewood lines where the distance to a ring radius is small, lighter earlywood in between, bark beyond the last ring, and a few radial cracks.
4. Pre-render the table grain once as an `ImageData` loop. Per frame, only draw sprites with transforms and shadows.

### Motion
- 12 fps stop-motion for toys (`floor(t·12)/12`) with a ±0.01–0.02 rad hand wobble per pose.
- Spring settles for drops (overshoot ≈ 5 %); a rolled wheel ends with a small rock (3 decaying oscillations).
- Counting is rhythmic: one token every 0.3 s with `easeOutBack`.

### Transitions
- Default: cut, or slide a new toy in along the table.
- Signature: **topple-and-drop** (0.85 s). Every object rotates a little and falls off the bottom of the frame with gravity (`y += 2200·k²`), leaving the empty set.

### Information design
- Numbers live on round painted tokens; totals on a big yellow badge; rules on a cream sign on pegs ("Her halka = 1 yıl").
- Highlight a measured feature with a thin cream paint line traced along it (as with the counted ring).
- Comparisons are block towers of different heights; no charts or tables.

### Sound (synthesise)
Wooden knocks (short band-passed clicks around 800–1.5 kHz with a fast decay), a hollow "tok" for tokens (sine 600 Hz, 40 ms), rolling rumble (low-passed noise, 0.8 s), and a clatter for the topple.

### Avoid
- **Plastic gloss.** Wood is satin; keep the specular weak.
- **Uniform flat colour.** Grain must show through paint, and edges need chips.
- **Rounded blobs.** Faces are flat; only edges round off.
- **Floating props.** Toys stand on the table and cast shadows on it.
- **Thin type.** Use chunky Nunito 900 cut-outs only.
