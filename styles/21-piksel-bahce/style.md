## Style 21 · Piksel Bahçe (Pixel Garden)

An original retro game screen: a tiny canvas scaled up with hard pixels, a short fixed palette, dithered gradients, characters with 1-px dark outlines animated at 6–8 fps, a typed dialog box and a stage bar. Each step of an explanation plays like a level being cleared. Do not copy the look, characters or interface of any existing game; build the scene from these rules.

### Palette
- Sky `#6EC1F0` → `#9AD6F7` → `#C8ECFF`, water `#47B0DC` → `#1C467A` (5 steps), sand `#E9C46A` / `#CFA24E`.
- Characters: green `#7AC74F` / dark green `#4E9A2E` / belly `#D9F2A0`, tadpole greys `#3C3A4A` / `#6E6A80`.
- Interface: outline and panels `#1B1B2F`, panel blue `#2A2F55`, grey `#6C7090`, gold `#FFD54F`, pink `#FF8FB1`, white.
- Never use smooth gradients: only these colours, mixed by ordered dithering.

### Material and surface
- **Resolution:** draw everything on a 180×320 canvas, then scale ×6 with `imageSmoothingEnabled = false`.
- **Dithering:** a 4×4 Bayer matrix picks between neighbouring palette steps for skies, water depth and light shafts.
- **Sprites:** draw simple vector shapes at sprite size, then snap: alpha threshold, nearest palette colour, and a 1-px outline on every pixel that touches the shape.
- **Ambient motion** on whole pixels only: clouds bob, the water line shimmers, bubbles rise, weeds sway (all with periods that divide the clip length).

### Typography
- Press Start 2P at 8 px (dialog, labels) and 16 px (title) on the small canvas, rasterised and thresholded so every pixel is hard.
- Uppercase text. The font draws İ, Ö, Ü, Ğ at lowercase height, so draw the plain capital and add the dot, dots or breve as pixels above it.
- Title in gold with a dark outline and a 1-px drop shadow; dialog text white on dark.

### Composition habits
- Game layout: title at the top, the world in the middle (sky, horizon, water cross-section), a dialog box and a stage bar at the bottom.
- One small hero sprite moving through a large, calm scene.
- Keep 4–6 px of margin inside every box; borders are 1 px with an inner line.

### Signature devices
1. **Dialog box** that pops open and types each line at ~30 characters per second, with a blinking arrow when done.
2. **Stage bar:** one slot per step (icon inside); slots light up gold as the story reaches them.
3. **Sparkles** (three-frame pixel stars) at every transformation.
4. **Sprite swaps** instead of morphs: each stage is a new sprite.
5. **Diamond wipe:** the signature transition.

### How to build it (Canvas 2D)
1. `sprite(w, h, palette, draw)` returns a pixel-snapped canvas with outline; cache every frame of every character.
2. `ptext(str, size, colour)` rasterises text the same way and records the baseline offset, so lines align.
3. Each frame: draw the static background, ambient motion, title, characters (integer positions, flipped with `scale(-1, 1)` when moving right), dialog, stage bar, then the wipe; finally scale the small canvas up.
4. Run the story on its own clock so the wipe can restart it.

### Motion
- Character animation at 8 fps (tail wiggles, blinking), ambient motion at 6 fps.
- Movement follows smooth paths but is rounded to whole pixels.
- Jumps are parabolas with splash pixels at take-off and landing.

### Transitions
- Default: a hard cut, or a sparkle at the point of change.
- Signature: **diamond wipe** (0.95 s). Dark pixel diamonds grow cell by cell along the diagonal until the screen is covered, the level resets behind them, and they shrink away in the same order.

### Information design
- Numbered steps in the dialog box ("1. YUMURTA / SUYA BIRAKILIR"), 2 lines of at most 20 characters.
- The stage bar shows where we are in the whole cycle at a glance.
- A speech bubble for one fun line from the hero at the end.

### Sound (synthesise)
Square-wave blips for typing (one per letter, alternating pitch), a rising arpeggio when a stage lights up, a short noise splash for water, a two-note jump sound, and a soft triangle-wave bass loop if music is wanted.

### Avoid
- **Antialiasing anywhere,** including text and scaled sprites.
- **Sub-pixel motion.** Round every position.
- **Colours outside the palette** or smooth gradients.
- **Copying a real game's characters, interface or level design.**
- **Long dialog lines.** Two short lines per box.
