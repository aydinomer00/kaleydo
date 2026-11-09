## Style 10 · Hayal Perdesi (Shadow Play)

A traditional-style shadow theatre: a cloth screen lit from behind by a flickering candle, translucent puppets of dyed leather pressed against it, operated on visible rods. The characters and motifs are original, inspired by the technique and not copied from any historical figure. Warm, theatrical, story-like.

### Palette
- Screen light: centre `#FFF6DF` → `#FBEFD2` → warm `#F2C77E` → amber edge `#C9772F`.
- Leather dyes (always translucent, multiplied onto the light): saffron `#E3A33C`, madder red `#B8432F`, indigo `#3E5C8A`, leaf green `#5E8B4A`, plum `#6A3D5A`, moon yellow `#F0D06A`, mouse grey `#7D8FA6`.
- Outlines and rods `#2A1A12`; frame dark wood `#2B1A12` with a gold rule `#C8A04A`.

### Material and surface
- **The screen** is cloth with a faint weave (1 px lines every 3 px at 3 % multiply) and a warm glow added with `screen` blending. Candle flicker multiplies the whole screen by 0.95–1.0 (noise at ~9 Hz plus a little 23 Hz).
- **Puppets** are dyed leather: semi-opaque colour (α ≈ 0.88) composited with `multiply`, a dark 4 px outline, a mottled texture, and **punched holes** (even-odd cut-outs) that let pure light through.
- **Distance = blur:** a puppet pressed to the screen is crisp; pulled toward the light it grows (+50 %), blurs (up to 22 px) and fades.
- **Rods** are dark, blurred lines running down to the bottom edge at a slight angle.

### Typography
- Cormorant Garamond 700 cut out of dark cartouche plaques (pointed hexagonal shape, a gold inner rule, two punched dots), so the light shines through the letters (titles 96 px, labels 66 px).
- Signs are pinned to the screen (no rods) and arrive by sliding up from below while coming into focus.

### Composition habits
- A framed vertical stage. The title at the top, a celestial object (moon, star) top-left, a horizontal prop (branch, rooftop, boat) across the middle, the hero puppet on it, a label sign at the bottom.
- Puppets are large (the hero ≈ 40 % of the width) and few (3–4 at a time).
- The glow is centred slightly below the middle where the action is.

### Signature devices
1. **Light-through-colour:** multiply-composited translucent parts.
2. **Punched ornaments:** rings of small holes on bodies, wings and moons.
3. **Jointed parts:** wings, heads and limbs rotate around pivots; a head "turns" by scaling x through zero.
4. **Cut-out lettering** on cartouche plaques.
5. **Pull-away transition.**

### How to build it (Canvas 2D)
1. Pre-render the screen (radial gradient + weave) and the frame (texture applied before clearing the window, so the screen stays clean).
2. Each leather part becomes a sprite: a path with hole circles appended, filled with `evenodd`, a clipped grain texture, then an outline stroke.
3. Draw parts with `globalCompositeOperation = 'multiply'`. When away from the screen, set `filter = blur()` and scale/alpha by the distance.
4. Light effects (glowing eyes, the candle hot-spot) use `lighter` or `screen` radial gradients on top.
5. Assemble characters from parts per frame (body, wings with pivots, head, eye rims, beak).

### Motion
- Puppetry: smooth motion along arcs with a slight lag and float (sinusoidal bob ±5 px); wings flap fast while flying and fold at rest.
- Arrivals start blurred and sharpen as the puppet touches the screen (0.6–0.9 s).
- The light never stops moving: flicker is always on.

### Transitions
- Default: slide puppets on and off along the screen, or let the candle dip briefly between scenes.
- Signature: **pull-away** (0.8 s). Every puppet and sign is drawn toward the light: shadows grow, blur and dissolve, leaving the empty glowing screen.

### Information design
- Labels on cut-out cartouches (one at a time, 3–5 words).
- Show ideas with light: rays of dotted punch-marks converge on what receives light; a dotted arc shows rotation or a path.
- Numbers can be punched digits in a small round plaque.

### Sound (synthesise)
A soft room tone with candle crackle (sparse filtered clicks), wooden rod taps, leather swishes (low-passed noise), and a short reed-like melody note (simple sawtooth through a band-pass) for reveals.

### Avoid
- **Opaque black silhouettes.** Puppets are coloured and translucent; only outlines and rods are dark.
- **A flat, evenly lit screen.** It needs a warm hotspot, falloff, weave and flicker.
- **Texture applied over the screen window.** It turns the glow grey; texture the frame only.
- **Rods across the title.** Pin signs to the screen.
- **Copying historical characters.** Design original figures in the technique.
