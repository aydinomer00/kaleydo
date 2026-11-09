## Style 07 · Karton Atölye (Cardboard Workshop)

A do-it-yourself diorama built from corrugated cardboard boxes: kraft pieces with visible flutes, masking tape, felt-tip marker drawings and a rubber stamp. Resourceful and hands-on, perfect for processes, machines and recycling.

### Palette
- Kraft `#C79A66` (dominant), darker kraft `#A97C4C`, pale cut edge `#E6C89A`.
- Masking tape `#E9D7A6` (semi-opaque), white paper `#F4F1EA`.
- Marker black `#1F1D1C` and marker blue `#3D7CC9`; stamp red `#D23B33`.
- Colour appears only as marker, tape, stamp and a few tinted pieces (multiply a tint over kraft, never a flat paint).

### Material and surface
- **Kraft liner:** warm brown with very fine noise, short fibres and soft vertical bands every 15 px from the flutes underneath.
- **Cut edges** show the corrugation: a pale 8 px rim with a wavy darker line (sine along the outline).
- **Thickness:** pieces are 3–5 mm; shadows are firm (blur ≈ 12 px, offset 5/8 px).
- **Tape:** semi-transparent, torn zig-zag ends, a faint glossy band, takes on the kraft texture below.
- **Marker:** round-capped lines with a slight bleed halo (a wider 25 % stroke underneath).
- **Stamp:** red border and lettering with ink gaps (random rectangles knocked out).

### Typography
- Amatic SC 700 everywhere: tall, hand-lettered capitals like marker on cardboard (titles 140–160 px, labels 80–90 px).
- Titles are written on a cardboard sign taped to the wall (two tape strips at angles). Labels are written on masking tape: number, a middle dot and 1–3 words.
- Uppercase in Turkish needs the dotted capital İ ("GERİ", "YENİ").

### Composition habits
- A wall of kraft, a title sign at the top, a machine-like process in the middle (stations on a conveyor), labels on tape below the stations.
- Process flows left to right; items physically travel between stations.
- Keep 3–4 stations; scale the whole machine group up rather than adding detail.

### Signature devices
1. **Corrugated cut edges** on every piece.
2. **Marker mechanics:** rollers, arrows and gauges drawn in marker that actually rotate or move.
3. **Masking-tape labels** slapped on with a quick `easeOutBack`.
4. **The stamp:** the result is announced with a stamp that slams down (scale 1.6 → 1, slight rotation).
5. **Box-flap transition:** the scene opens and closes like the flaps of a box.

### How to build it (Canvas 2D)
1. Generate one large kraft texture per scene (pixel loop: base × (1 + flute sine + soft noise + grain), then a few hundred fibre strokes).
2. Cut a piece: clip its outline and draw the kraft texture with a per-piece offset; optional `multiply` tint; stroke a 16 px pale edge, then a wavy corrugation line by offsetting resampled outline points along the normal with `sin(i·1.4)`. Cache as a sprite.
3. Marker strokes are drawn live (they animate): a 25 % wider bleed stroke, then the solid stroke.
4. Tape and stamp are cached sprites; the stamp's ink gaps come from `destination-out` noise rectangles.
5. Box flaps: two half-width darker kraft sprites hinged at the outer edges, scaled in x by `−side·f`, with a gradient darkening toward the seam and a pale fold line.

### Motion
- Props move in 12 fps stop-motion with a tiny boil; conveyor items glide smoothly along the belt and hop into bins on an arc.
- Machines idle continuously: rollers turn, water bubbles, a sheet feeds out.
- Signs and tape drop in on springs; the stamp slams in 0.3 s with no bounce.

### Transitions
- Default: cut, or slide a whole station group in.
- Signature: **box flaps** (0.55 s open, 0.65 s close) at the start and end of a video or between chapters.

### Information design
- Steps: "1 · TOPLA" style tape labels under stations.
- Flows: marker arrows on the wall or moving items on the belt.
- Results: red stamp. Quantities: marker tally marks or stacked boxes.

### Sound (synthesise)
Cardboard thumps (low thud plus a papery click), tape rips (bright noise burst with a rising band-pass), marker squeaks (short high sine glides), conveyor hum (low triangle wave with rattle), stamp slam.

### Avoid
- **Flat brown rectangles.** Kraft needs flutes, fibres and corrugated edges.
- **Clean digital type.** Use marker lettering on tape or cardboard only.
- **Glossy or bright colours.** Colour comes from marker, tape and stamp.
- **Static machines.** Something always turns, bubbles or moves.
- **Clutter.** Three or four stations, scaled up.
