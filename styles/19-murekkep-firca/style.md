## Style 19 · Mürekkep Fırça (Ink Brush)

A monochrome ink-wash painting on fibrous paper. Forms are built from single, confident brush strokes: dry-brush streaks, darker joints, leaves flicked from base to tip, soft grey washes for mist and soil. Lots of empty paper, one red seal, calm pacing. It suits growth, plants, seasons and patience.

### Palette
- Paper `#F2EDE1` with long fibres.
- Ink `#1C1B1A` in three strengths: dark (85–95 %) for the nearest forms, mid (45–60 %) for distance, pale (10–16 %) for mist and earth washes.
- One warm earth wash `#9A8468` at 16 % for cut-away soil.
- Seal red `#C23A2B` for the seal and the single key sentence. Nothing else gets colour.

### Material and surface
- **Dry-brush stroke:** a soft base fill (darker on the loaded side of the brush) plus parallel bristle lines with occasional gaps ("flying white") that are densest at the edges and the end of the stroke.
- **Stroke shape:** internodes slightly waisted and flared at both ends, with a darker band where the brush first presses down.
- **Joints:** short swelling strokes wider than the stem, with a small paper gap on either side.
- **Leaves:** tapered strokes, widest about a third from the base, sharp at the tip, with a few light bristle streaks.
- Everything is painted into one ink layer and composited on the paper with `multiply`.

### Typography
- Spectral 600 for the title (a smaller first line, a large second line) and the red key sentence; Spectral 400 for labels (44–46 px).
- Text appears like ink soaking into paper: a soft left-to-right reveal with a 100 px feathered front.
- Labels sit in the empty space with a thin brush leader line; no boxes.

### Composition habits
- Asymmetric: the subject grouped on one side, generous empty paper on the other where the labels sit.
- A horizon or ground stroke can open a cut-away below (roots, burrows, seeds).
- The seal sits near the key sentence or the title, slightly rotated.

### Signature devices
1. **One stroke per segment,** painted in growth direction, joints added after each stroke.
2. **Flicked leaves** that grow from the base outward in 0.1 s.
3. **Telescoping growth:** all segments lengthen together (stretch the stroke images, keep joints and sheaths).
4. **The red seal** stamped once, with a little overshoot.
5. **Water bloom:** the signature transition.

### How to build it (Canvas 2D)
1. Pre-render every stroke as its own canvas (bristle lines + base fill, then a `destination-in` mask for the waisted shape; fill the mask with an opaque colour).
2. Reveal a stroke by drawing a growing crop of its canvas from the start end; rotate the context for leaning stems or horizontal strokes.
3. Leaves: `SH.lobe` filled with a lengthwise gradient, a few `destination-out` streaks, drawn with `scale(0.4 + 0.6k, k)` from the base.
4. Washes: large blurred ellipses (40–50 px blur) at 6–16 % ink.
5. Paint everything into one layer; composite onto the paper with `multiply`.

### Motion
- Unhurried: strokes take 0.12–0.2 s each, in the order a painter would paint them (stem bottom to top, then twigs, then leaves).
- Small markers (upward ticks, drifting ink dots) explain motion without arrows.
- Nothing bounces except the seal's tiny press.

### Transitions
- Default: let the painting rest, then cut to fresh paper.
- Signature: **water bloom** (1.2 s). A noisy circle of water spreads from the centre; inside it the ink blurs, loosens and fades, the paper darkens slightly as if wet, and a faint tide line marks the edge. When the water reaches the corners the paper is blank.

### Information design
- One idea per label, two short lines.
- Cut-aways explain what is hidden (roots, underground stems, seeds) with paler ink.
- The single red sentence carries the takeaway.

### Sound (synthesise)
Soft brush swishes (pink noise with a slow attack and a lowpass sweep), a hollow wooden knock for the seal, faint wind, and a watery shimmer for the bloom (a few slow sine partials with gentle detune).

### Avoid
- **Outlines.** Forms are made of strokes, not traced edges.
- **Even grey fills.** Each stroke needs dark and light inside it.
- **Filling the paper.** Leave at least a third empty.
- **More than one colour.** Red only for the seal and the key sentence.
- **Fast or bouncy motion.**
