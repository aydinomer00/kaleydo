## Style 16 · Çizgi Roman (Comic Book)

A page from a printed comic: heavy black panel borders on cheap cream paper, flat process colours filled with Ben-Day dots and printed slightly off-register from the line art, yellow caption boxes, and jagged burst balloons carrying sound words. Energetic, loud, and very readable.

### Palette
- Newsprint `#FBF6E9` for the page and the gutters.
- Key-line black `#141414` for every outline and panel border.
- Process inks: cyan `#2E9BD6`, magenta `#E2367A`, yellow `#FFD23F`, plus a spot red `#E23A2E` for sound words.
- Mid-tones are made with dots, never with gradients: sky = cyan dots on paper; storm cloud = dark blue-grey dots on grey; grass = dark green dots on green; burst = magenta dots on yellow.

### Material and surface
- **Ben-Day dots:** a small repeating tile with dots on a diagonal grid (step 14–16 px, radius 3–4 px) used as a fill pattern.
- **Off-register colour:** each fill is drawn shifted by about (3, 2) px, then the black key line is stroked at the true position, so a thin paper edge shows on one side.
- Paper has a faint fibre grain applied with `soft-light` (never `multiply`, which greys the page).
- Lines are thick and round-joined: 7 px for objects, 9 px for panel borders, 5 px for caption boxes.

### Typography
- Bangers for the title logo and sound words (it covers Turkish; set Turkish uppercase with a dotted İ: "ŞİMŞEK").
- The title is a slanted logo: yellow letters with a thick black outline and a solid offset shadow, rotated about −3°.
- Nunito 900 in uppercase for captions (40 px) on yellow boxes with a black border.
- Sound words ("ÇAT!", "GÜM!") are 100–120 px red Bangers inside burst balloons.

### Composition habits
- A vertical page: the title logo in the top quarter, then 2–4 stacked panels with 30 px gutters, all inside the safe area.
- Each panel is one beat of the explanation; the caption box sits in the top-left corner with a step number.
- A final punchline caption in the bottom-right corner of the last panel.

### Signature devices
1. **Ben-Day dot fills** for every mid-tone.
2. **Off-register colour plates** under crisp black lines.
3. **Burst balloons** with sound words that pop in with overshoot.
4. **Motion ticks:** short double lines behind moving objects, and impact lines radiating from a hit.
5. **Dot dissolve:** the signature transition.

### How to build it (Canvas 2D)
1. Pre-build dot tiles with `SH.canvas` and turn them into patterns with `createPattern(..., 'repeat')`.
2. Write one helper `inked(g, path, fill, lineWidth, offset)`: fill the path translated by the offset, then stroke it in black at the true position.
3. Panels: clip to the panel rectangle (revealed top to bottom with `easeOutCubic`), draw its art, restore, then stroke the border.
4. Bursts: alternate inner and outer radii around a centre with a seeded jitter; scale in with `easeOutBack`.
5. Animate small moving parts on a 12 fps clock (`stepT(t, 12)`), which feels like comic animation.

### Motion
- Panels open one after another (~0.3 s each); captions pop in with a vertical `easeOutBack`.
- Flashes are binary: the panel background switches to yellow for a few frames.
- Sound waves are thick arcs that expand and thin out.

### Transitions
- Default: turn the page (cut) or reveal the next panel.
- Signature: **dot dissolve** (0.85 s). A grid of paper-coloured dots grows until it covers the page, then fades to clean paper.

### Information design
- One beat per panel, numbered in the caption ("1 · BULUTTA YÜKLER AYRILIR").
- Charges, forces and directions as big bold symbols (+, −, arrows) with black outlines.
- Myths and fun facts work well as the final punchline caption ("IŞIK SESTEN HIZLIDIR!").

### Sound (synthesise)
Short punchy hits for sound words (noise burst with a fast decay), a crackling zap for electricity (band-passed noise with random gating), a deep rolling boom for thunder (low-passed noise with a slow decay), and soft paper swishes for panel reveals.

### Avoid
- **Smooth gradients.** Tone comes from dots.
- **Thin or grey outlines.** Key lines are thick and black.
- **Perfect registration.** The colour must sit slightly off the line.
- **Too many panels.** Two to four per screen, so each can be read on a phone.
- **Text outside caption boxes** (except sound words and the title logo).
