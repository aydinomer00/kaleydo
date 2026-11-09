## Style 23 · Vitray Işığı (Stained Glass Light)

A pointed-arch stained-glass window set into a stone wall. The picture is made of coloured glass panes held together by dark lead; panes have streaks, bubbles and darker edges, details are painted on the glass, and light comes on pane by pane, glows into the room and spills coloured patches onto the floor. Majestic but warm, like a picture book in a cathedral.

### Palette
- Glass: sky blues `#2F6DB5` `#3B82C4` `#5AA0D8` `#79B4E3`, sun golds `#F7D46A` `#F2A33D` `#F2C14E`, rose `#D2245B` / `#E2416E`, violet `#7B3FB5`, greens `#2E8B57` `#3FA34D` `#5CB35C`, cream banner glass `#F1E2B8`.
- Lead `#1F1C22`, glass paint `#3A2A20`.
- Stone `#8E857A` with darker recess `#5F574F`; gilded title `#E8C77A` with a gradient and a dark offset shadow.

### Material and surface
- **Panes:** base colour, a soft highlight towards the light, faint parallel streaks at a random angle, two or three tiny bubbles, a blurred darker edge inside each pane.
- **Lead came:** 9–12 px dark stroke with a thin pale highlight offset up-left; the window border is 24 px.
- **Unlit glass** is the same pane darkened and slightly greyed; lighting is a per-pane mix between the two states.
- **Glass paint:** veins, dots and words painted in dark brown on the glass, at 45 % opacity.
- **Light in the room:** a blurred `screen` copy of the lit window as glow, and a skewed, blurred copy on the floor.

### Typography
- Philosopher 700. The title is gilded on the stone above the arch (two lines, ~92 px, centred).
- Words inside the window are painted on a cream ribbon pane (~50 px) and change per step.

### Composition habits
- The window fills most of the frame; the title sits on the wall above, the floor glow below.
- A big, simple emblem in the arch (sun, star, moon), the subject large in the middle, ground and plants at the bottom, a ribbon for words.
- Background "quarry" panes are irregular (Voronoi cells); figures are made of a few bold panes each.

### Signature devices
1. **Light coming on pane by pane,** in rings from the light source.
2. **Moving glass figures** (a bee with its own lead) that cross the window.
3. **A lens** that shows another way of seeing (the flower as a bee sees it: violet with nectar guides and a bullseye).
4. **Painted ribbon** whose words change with each step.
5. **Cloud shadow:** the signature transition.

### How to build it (Canvas 2D)
1. Generate background panes as Voronoi cells (half-plane clipping) inside the arch; add designed panes on top.
2. Pre-render the whole window twice (lit and unlit) and a lead layer. In the lead layer, erase the inside of every figure before stroking its outline so background lead never crosses a figure.
3. Each frame, build a mask from the panes (each filled with its light value), draw the unlit window, then the lit window through the mask (`destination-in`).
4. Draw moving figures, then the lead on top, then glow and floor light.

### Motion
- Calm and ceremonial: light spreads over ~1.5 s, figures glide on smooth arcs, wings flap on a 14 fps toggle.
- The lens grows with a small overshoot and closes softly.

### Transitions
- Default: panes fade from one picture to the next in rings.
- Signature: **cloud shadow** (1.05 s). A soft dark band drifts across the window from left to right; panes fall dim as it passes and the glow on the floor fades.

### Information design
- One short sentence per step on the ribbon.
- "Other ways of seeing" as a lens over the subject.
- Cause → effect shown by a figure travelling between subjects (pollen carried from flower to flower).

### Sound (synthesise)
A soft choir-like pad (several detuned sines with slow attack), glassy chimes when panes light (sine partials at non-integer ratios, quick decay), a gentle buzz for the bee (sawtooth through a low-pass with vibrato), and a low hush as the cloud passes.

### Avoid
- **Thin or missing lead.** Every pane boundary is dark and bold.
- **Gradients across a whole figure.** Colour changes happen at lead lines.
- **Too many tiny panes.** Keep panes large enough to read on a phone.
- **Text floating over glass.** Words belong on a ribbon pane or on the wall.
