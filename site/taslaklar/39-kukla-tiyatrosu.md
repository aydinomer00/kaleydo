## Style 39 · Kukla Tiyatrosu (Felt Marionette Theatre)

A tabletop marionette theatre: a carved and folk-painted wooden proscenium, red velvet curtains tied back with rope, a hand-painted canvas backdrop, and felt puppets with visible strings, button joints and blanket-stitch seams. Warm stage light, theatrical and storybook-like. There is no animated reference yet: build from this guide (reference image: `site/taslaklar/39-kukla-tiyatrosu.jpg`).

### Palette
- Wood `#E6C99A` / `#C79A62` with painted leaves `#5F8A3E` and berries `#C7372F`; velvet red `#A8232A` / `#7E1A20`.
- Felt: rust orange `#C8601E`, cream `#F1E3C6`, moss `#7DA23A`, toadstool red `#C9302C`.
- Backdrop: sky `#8DB4D8`, autumn hills `#E3A23A` / `#9DB45A`, tree trunk `#7A4A26`.

### Material and surface
- **Felt:** soft fuzzy edges (blurred 1–2 px outline + fibre noise), blanket-stitch seams (small cream ticks along edges), sewn buttons at joints.
- **Strings:** thin beige lines from the top of the frame to the puppet's head, hands and knees; they stay taut and move with the limbs.
- **Painted backdrop:** visible brush texture and canvas weave, lower contrast than the puppets (depth).
- **Stage light:** warm spotlight from above, soft vignette, puppets cast a shadow on the stage floor.

### Typography
- Grandstander 900 or Baloo 2 800 in cream with a dark brown outline, presented on a painted wooden sign or a felt banner hanging from strings.

### Composition habits
- The proscenium frames the whole screen; the stage floor sits at about 70 % height; the puppet stands front-left of centre with one prop (basket, acorn); felt bushes and toadstools in the front corners.

### Signature devices
1. Puppet motion driven by strings: limbs swing from pivots (joint buttons), the body bobs slightly, strings follow.
2. Props lowered onto the stage on their own strings.
3. Backdrop changes slide in on rollers (painted canvas pulled sideways).
4. **Curtain transition:** the curtains close (gathered folds), the scene changes, the curtains open.

### How to build it (Canvas 2D)
Draw each puppet part (body, head, arms, legs, tail) as a separate pre-rendered felt sprite with its pivot; animate with small rotations (pendulum easing) and compute string endpoints from the transformed attachment points. Curtains are vertical bands of a velvet gradient whose horizontal compression simulates gathering.

### Motion
- Bouncy but gentle pendulum swings (`spring`), quick small bows, props drop with a little bounce and a dust puff.

### Sound (synthesise)
Wooden clacks for steps, a soft felt thump for landings, curtain swish (filtered noise), a short theatre fanfare (two triangle-wave notes).

### Avoid
- Realistic fur, glossy plastic, hidden strings (the strings are part of the charm), crowded stages.
