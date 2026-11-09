## Style 06 · Yün Örgü (Knitted Yarn)

The whole frame is a knitted fabric, like the picture on a hand-knitted sweater. Every visual is a pattern chart of stitches; animation happens by changing the chart, so motion feels like a living sweater. Cosy, warm, a little nostalgic.

### Palette
- Yarns: cream `#F7EEDC`, sky blues `#A9CFE0` / `#C3DFEA` (alternating 3-row stripes), mustard `#F4C542`, brown `#7A5236` / nest browns `#A8794B` `#7E5532`, leaf greens `#6FAE5B` `#4F8C44`, red `#D9483B`, orange `#F29B38`, egg white `#F2F0E6`.
- Lettering yarn: cream and mustard with a plum outline `#4A3A5C`.
- At most 10–14 yarn colours in a chart, like a real colourwork pattern.

### Material and surface
- **Stockinette stitch:** each cell is a V made of two plump legs. Each leg is shaded vertically (lighter at the top, darker at the bottom) and carries fine diagonal ply-twist lines.
- Behind every stitch is a slightly darker shade of the same yarn, so no background shows between legs; the fabric reads dense.
- A soft dark line runs down the centre of each V. Edges of colour areas are jagged by the stitch grid (that is the charm).
- No other lighting: the fabric is flat; depth comes from the stitch shading.

### Typography
- Quicksand 700 laid in yarn: a thick plum outline (16 % of the size) with a cream or mustard fill crossed by twisted diagonal strokes (100–110 px titles, 70 px labels).
- Text sits on plain cream knitted bands (top and bottom of the chart), never over busy colourwork.
- Text fades in after its band is knitted.

### Composition habits
- Chart resolution about 45 × 96 stitches for 1080 × 1920 (24 × 20 px per stitch). Objects must read at that resolution: chunky silhouettes, 1-stitch details only for eyes and beaks.
- Bands: cream title band (top 25 rows), striped sky scene, cream label band (bottom 12 rows).
- Big shapes (sun, nest, animal) 8–20 stitches wide.

### Signature devices
1. **Shaded V-stitch sprites** per yarn colour.
2. **Chart animation:** the picture changes cell by cell (wings alternate every 1/8 s, a nest grows row by row).
3. **Knit-in:** the fabric is knitted row by row from the bottom at the start, each new row dropping 10 px into place.
4. **Unravel:** the signature transition; rows disappear from the top with a loose yarn strand waving along the working edge.
5. **Yarn lettering** on plain bands.

### How to build it (Canvas 2D)
1. Pre-render one stitch sprite per palette colour (two quadratic-curve legs, vertical gradient, clipped twist lines, centre shadow). Store a darker backing colour per yarn.
2. Each frame, draw the chart as pixel art on a tiny canvas (COLS × ROWS) with `fillRect` using exact palette colours.
3. Read it back with `getImageData`, map each pixel's RGB to its palette index (a `Map` of "r,g,b" → index), then for every cell fill the backing rectangle and `drawImage` the stitch sprite. About 4 300 sprite draws per frame are cheap.
4. Knit-in and unravel just skip rows outside the visible range; the dropping row offsets its y by `(1 − progress)·10`.

### Motion
- The chart animates at 8 fps (wing flaps, bobbing) and objects move in whole stitches. Never sub-pixel, because that breaks the knit.
- Building actions add a row or stitch at a time (a nest grows 1 row per ~0.25 s).
- Only the knit-in drop, the unravel strand and the text fades are smooth.

### Transitions
- Default: change the chart in place (a new scene is "re-knitted" top to bottom in 0.5 s).
- Signature: **unravel** (0.85 s), top rows disappearing with a waving strand.

### Information design
- Numbers and labels in yarn lettering on the bottom band (one at a time).
- Counts are knitted dots (bobbles) or stripes. Arrows are chunky stitch arrows 3 stitches thick.
- Keep diagrams iconic; the stitch grid cannot show fine detail.

### Sound (synthesise)
Soft needle clicks (short high-passed clicks, rhythmic while knitting), a warm woolly whoosh (low-passed noise), a gentle yarn pull (rising noise sweep) on the unravel.

### Avoid
- **Flat pixel art with a knit overlay.** Each cell must be a shaded V-stitch sprite.
- **Gaps showing the background between stitches.** Use darker backing yarn.
- **Smooth sub-stitch motion.** Move whole stitches at 8 fps.
- **Too many colours or tiny details.** Keep it a real colourwork chart.
- **Text over colourwork.** Lettering goes on plain bands.
