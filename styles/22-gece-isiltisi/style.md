## Style 22 · Gece Işıltısı (Night Glow)

A moonlit scene where the only bright things are the ones that make their own light. A deep blue night with twinkling stars, layered silhouettes with a faint moon rim, and living light that blooms softly with additive blending. Calm, magical, a good bedtime feeling, but always a concrete place (a meadow, a shore, a forest), never abstract particles.

### Palette
- Night gradient: `#070A22` → `#141C47` → `#26306A` near the horizon → `#10163A` at the bottom.
- Silhouettes: trees `#0D1333`, hills `#0A0F2A`, foreground grass `#060A1D`; moon `#F4F1DE` with a pale halo.
- Light: firefly green `#D8FF6A` with a white-hot centre, warm text glow `#FFF6D2`, cool accents `#8FD3FF` (oxygen, cold).
- The subject may carry one warm local colour (the firefly's yellow shield `#F2C14E` with a red spot `#E0623A`).

### Material and surface
- **Additive light:** every light source is a pre-rendered radial sprite drawn with `globalCompositeOperation = 'lighter'`; overlapping lights get brighter, never muddier.
- **Glow sprites:** white centre, coloured middle at ~75 %, a long faint tail at ~16 %.
- **Moon rim:** silhouettes get a thin pale stroke (`rgba(190,205,255,0.45)`) on their upper edge.
- **Depth:** three silhouette layers (far trees, hill, foreground grass) and stars that twinkle at slow, different rates.

### Typography
- Comfortaa 700 for the title (~96 px) in warm white with a strong soft glow (shadow blur ~26 px, drawn twice).
- Comfortaa 600 for labels (~44 px) in cool white with a smaller blue glow.
- Text "lights up" from left to right; labels sit above the foreground so grass never covers them.

### Composition habits
- Sky with moon and title in the top third, the hero subject large in the middle, a meadow with many small lights at the bottom.
- Labels float near what they describe with thin glowing leader lines ending in a dot.
- Darkness is the background: keep at least half of the frame dark.

### Signature devices
1. **Living lights** that drift and blink on loop-safe rhythms.
2. **Glow pulse** of the hero's light organ, lighting its own body.
3. **Signal rings:** thin circles expanding from each flash to show communication.
4. **Glowing icons** drawn as outlines (thermometer, arrows).
5. **Light painting:** the signature transition.

### How to build it (Canvas 2D)
1. Pre-render the sky gradient, moon (cut the crescent in a separate canvas), tree line and hills; pre-render the foreground grass separately to draw on top.
2. Pre-render glow sprites; draw them with `'lighter'` and an alpha that follows the blink curve `max(0, sin)^5`.
3. Draw the hero as vector shapes (wings translucent, flapping on a 30 fps toggle), the glow behind it and a smaller glow on top.
4. Keep ambient motion periodic: frequencies that are whole multiples of 1/duration.

### Motion
- Slow and floating: hovering bob, gentle drift, blinks that ease in and out.
- Particles of an explanation travel in arcs and flash on arrival (a ring that expands and fades).
- Nothing snaps or bounces.

### Transitions
- Default: lights fade out in a ripple, then new ones fade in.
- Signature: **light painting** (1.2 s). A single light streaks across the frame in a long S-curve, its trail thickens into a soft river of light, the whole frame floods to warm white, and the flood fades away to reveal the next (or the same, reset) night scene.

### Information design
- One label per mechanism, two short lines.
- Inputs as coloured particles (blue for oxygen), outputs as light.
- Comparisons with glowing icons (a thermometer that stays low = cold light).

### Sound (synthesise)
Crickets (short, high-pitched pulse trains), a soft pad (two detuned sines), a tiny bell-like ping for each flash (sine with fast decay), and a rising shimmer for the light-painting flood.

### Avoid
- **Abstract particle fields** without a place. Always show where we are.
- **Grey glows.** Glow is drawn additively in colour.
- **Lighting everything.** Light is precious; most of the frame stays dark.
- **Hard shadows or outlines.** Silhouettes and rims only.
