## Style 11 · Ebru Akışı (Marbling Flow)

Turkish paper marbling (ebru) as a living medium: pigments float on a cream bath, every new drop pushes the older ones into rings, and a stylus or comb drags them into veins. The picture is built only from these operations, so it looks genuinely marbled and keeps flowing.

### Palette
- Bath / paper ground `#F3EAD8` (warm cream).
- Traditional earth and mineral pigments: indigo `#2D4A7A`, lapis `#3E6DB5`, turquoise `#4FA3A5`, ochre `#D9A441`, madder red `#B5473A`, green `#5E8F4E` / `#8DB36A`.
- Lettering in deep indigo `#22304F` and madder on cream labels.
- Colours are flat inside a drop; variety comes from rings, veins and overlaps, not gradients.

### Material and surface
- Ink is a floating film with soft, slightly darker edges (a 1.6 px stroke at 50 % of a darker tone).
- Paper fibres over everything (soft-light texture) because the result is printed on paper.
- No shadows and no lighting; ebru is completely flat.

### Typography
- Marcellus 400, a calm classical face (titles 92 px, labels 54 px).
- Text sits on cream paper labels with a thin indigo rule, pasted over the marbling, because marbling itself cannot carry type.

### Composition habits
- Start with a sprinkle of small drops over the whole bath (texture), then larger drops that act as landmarks (hills, sun, earth), then the hero gesture (a river, a wind, a current), then a large mass (sea, sky).
- Leave cream space between motifs; marbling looks crowded fast.

### Signature devices
1. **Drop push:** a drop of radius r at c moves every existing point p to `c + (p − c)·√(1 + r²/|p − c|²)`. Older drops become rings and crescents.
2. **Stylus and comb:** dragging from A to B shifts points along AB by `z·λ/(d + λ)` (d = distance to the segment). Wavy combs across the bath create veins.
3. **Parting:** a flowing ribbon pushes inks away from its path, leaving clean cut edges along it.
4. **Veined ribbon:** the hero flow is a ribbon (thin at the source, wide at the mouth) with turquoise vein lines inside it.
5. **Lay and lift the sheet:** the signature transition.

### How to build it (Canvas 2D)
1. Keep an ordered list of operations with start times and durations (drop, stroke, part).
2. For each frame, rebuild everything from scratch: start empty, apply every operation whose start time has passed, and scale the one in progress (drop radius × `easeOutCubic(k)`, stroke strength × smoothstep). This keeps the animation deterministic and seekable.
3. Each drop is a polygon (≥ 2.2 points per pixel of radius); after strong deformations, insert midpoints where an edge is longer than ~14 px.
4. Fill polygons in creation order with their colour and a thin darker stroke; texture the whole sheet with soft-light.
5. Ribbons are strips built along the partial path with a width profile; clip and stroke vein lines inside.

### Motion
- Ink spreads quickly and settles: drops open in 0.35–0.6 s (`easeOutCubic`).
- Strokes travel at hand speed: a 1 100 px meander takes ~1.8 s.
- Between operations the bath is calm; only new gestures move the ink.

### Transitions
- Default: keep marbling (new drops push the old picture away).
- Signature: **lay and lift the sheet** (1 s). A cream sheet descends over the bath and lifts away; the bath underneath is clean.

### Information design
- Labels on cream paper tabs ("1 · Dağlarda doğar").
- Show flows with the ribbon and its veins; show expansion with drop pushes; show mixing with combing.
- Avoid numbers and charts; ebru is for processes and flows.

### Sound (synthesise)
Water drips (pitched plinks for drops), a soft stylus swish (band-passed noise following the stroke speed), gentle water ambience, a paper whoosh for the lay-and-lift.

### Avoid
- **Fake marbling textures** (noise warps, swirl filters). Use the drop and stroke maths.
- **Gradients or shading inside drops.** Ebru is flat.
- **Only perfect circles.** Comb and stroke so drops become veins and crescents.
- **Text drawn straight onto the ink.** Use paper labels.
- **Overcrowding.** Keep cream space between motifs.
