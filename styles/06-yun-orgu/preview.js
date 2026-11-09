'use strict';
/* 06 · Yün Örgü — the whole picture is knitted. A low-resolution chart (45×96 stitches) is drawn as
   pixel art each frame, then every cell is rendered as a shaded, twisted V-stitch sprite in its
   yarn colour. The fabric knits itself in row by row and unravels at the end of the loop. */
(() => {
  const { E, P, clamp, lerp, bump, rng, mix, darken, lighten, stepT } = SH;
  const SW = 24, SHh = 20, COLS = 45, ROWS = 96;
  const C = {
    bg: '#EFE4D2', cream: '#F7EEDC', sky: '#A9CFE0', skyL: '#C3DFEA', sun: '#F4C542', branch: '#7A5236', nest: '#A8794B', nestD: '#7E5532',
    leaf: '#6FAE5B', leafD: '#4F8C44', bird: '#D9483B', birdD: '#A8342B', beak: '#F29B38', egg: '#F2F0E6', eggDot: '#7FB3D5', ink: '#4A3A5C', eye: '#2A2430',
  };
  const PAL = [C.cream, C.sky, C.skyL, C.sun, C.branch, C.nest, C.nestD, C.leaf, C.leafD, C.bird, C.birdD, C.beak, C.egg, C.eggDot, C.eye];
  const S = {};

  function stitchSprite(hex) {                          // one stockinette V: two twisted, shaded legs
    const { c, g } = SH.canvas(SW + 4, SHh + 10), base = hex;
    const leg = (dir) => {
      g.save(); g.translate(2 + SW / 2, 3); g.scale(dir, 1);
      const p = new Path2D(); p.moveTo(0, SHh + 5); p.quadraticCurveTo(-SW * 0.74, SHh * 0.6, -SW * 0.56, 0); p.quadraticCurveTo(-SW * 0.2, -2, 0, 6); p.quadraticCurveTo(3, SHh * 0.7, 0, SHh + 5); p.closePath();
      const gr = g.createLinearGradient(0, 0, 0, SHh + 4);
      gr.addColorStop(0, lighten(base, 0.28)); gr.addColorStop(0.45, base); gr.addColorStop(1, darken(base, 0.32));
      g.fillStyle = gr; g.fill(p);
      g.save(); g.clip(p); g.strokeStyle = darken(base, 0.22); g.globalAlpha = 0.55; g.lineWidth = 1.1;
      for (let k = -6; k < 30; k += 3.2) { g.beginPath(); g.moveTo(-SW, k); g.lineTo(SW * 0.2, k - SW * 0.55); g.stroke(); }   // ply twist
      g.restore();
      g.restore();
    };
    leg(1); leg(-1);
    g.fillStyle = 'rgba(30,20,20,0.25)'; g.fillRect(2 + SW / 2 - 0.8, 6, 1.6, SHh - 2);
    return c;
  }
  function yarnText(s, size, col, outline) {             // lettering laid in yarn (outline + twisted fill)
    return SH.textSprite(s, size, {
      fam: 'Quicksand', wt: 700, col, key: 'yarn' + outline, paint: (g, w, h, bx, by, draw) => {
        g.lineJoin = 'round'; g.strokeStyle = outline; g.lineWidth = size * 0.16; g.font = `700 ${size}px "Quicksand"`; g.strokeText(s, bx, by);
        g.fillStyle = col; draw();
        g.globalCompositeOperation = 'source-atop'; g.strokeStyle = darken(col, 0.18); g.lineWidth = 2;
        for (let k = -h; k < w + h; k += 7) { g.beginPath(); g.moveTo(k, h); g.lineTo(k + h * 0.7, 0); g.stroke(); }
      },
    });
  }
  // the chart: a small pixel picture redrawn every frame (one cell = one stitch)
  function chart(g, t) {
    const R = (c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    const disc = (c, cx, cy, r) => { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r) R(c, cx + x, cy + y); };
    R(C.cream, 0, 0, COLS, ROWS);
    for (let y = 24; y < 84; y++) R(y % 6 < 3 ? C.sky : C.skyL, 0, y, COLS, 1);
    disc(C.sun, 37, 33, 6);
    for (let x = 0; x < 40; x++) R(C.branch, x, 71 + Math.round(x * 0.1), 1, 3);   // branch with leaf clusters
    for (const [lx, ly] of [[3, 66], [11, 68], [34, 69]]) { disc(C.leaf, lx + 2, ly + 1, 2); R(C.leafD, lx + 1, ly + 3, 3, 1); }
    const rows = Math.floor(P(t, 2.4, 4.6) * 9);       // the nest grows in woven rows
    for (let r = 0; r < rows; r++) { const y = 71 - r, half = 6 + Math.min(r, 4); for (let x = -half; x <= half; x++) R((x + r) % 2 ? C.nest : C.nestD, 22 + x, y); }
    if (t > 5.0) for (const ex of [16, 21, 26]) { R(C.egg, ex, 59, 3, 4); R(C.egg, ex + 1, 58, 1, 1); R(C.eggDot, ex + 1, 60); }
    let bx, by, flap = Math.floor(t * 8) % 2;            // the bird: flies in with a twig, weaves, sits
    if (t < 2.4) { const u = E.ioS(P(t, 0.9, 2.4)); bx = Math.round(lerp(-14, 13, u)); by = Math.round(lerp(38, 52, u) + Math.sin(u * 9) * 2); }
    else if (t < 5.4) { bx = 13 + Math.round(Math.sin(t * 4) * 3); by = 52 - (Math.floor(t * 4) % 2); flap = 0; }
    else { const u = E.ioS(P(t, 5.4, 6.0)); bx = Math.round(lerp(13, 15, u)); by = Math.round(lerp(52, 54, u)); flap = 0; }
    if (t > 0.9) {
      R(C.bird, bx, by, 11, 5); R(C.bird, bx + 9, by - 3, 4, 4); R(C.birdD, bx, by + 3, 7, 2); R(C.birdD, bx - 2, by, 2, 2);
      R(C.eye, bx + 11, by - 2); R(C.beak, bx + 13, by - 1, 2, 2);
      if (flap) R(C.birdD, bx + 2, by - 4, 5, 4); else R(C.birdD, bx + 2, by + 4, 5, 2);
      if (t < 2.5) R(C.nestD, bx + 13, by + 1, 6, 1);   // the twig it carries
    }
  }

  SH.register({
    id: '06', w: 1080, h: 1920, duration: 8, fps: 30, poster: 6.2,
    fonts: ['700 80px "Quicksand"', '600 80px "Quicksand"'],
    init(g, W, H) {
      S.spr = PAL.map(stitchSprite); S.dark = PAL.map(h => darken(h, 0.38));
      S.idx = new Map(PAL.map((h, i) => [SH.hex2rgb(h).join(','), i]));
      S.chart = SH.canvas(COLS, ROWS);
      const bg = SH.canvas(W, H), b = bg.g;
      b.fillStyle = C.bg; b.fillRect(0, 0, W, H);
      b.globalCompositeOperation = 'soft-light'; b.globalAlpha = 0.6; b.fillStyle = b.createPattern(SH.grain(512, 60), 'repeat'); b.fillRect(0, 0, W, H);
      S.bg = bg.c;
      S.t1 = yarnText('Kuşlar yuvayı', 104, '#F7EEDC', C.ink);
      S.t2 = yarnText('nasıl örer?', 104, '#F4C542', C.ink);
      S.labels = [['1', 'Dal toplar'], ['2', 'Örer, sıkıştırır'], ['3', 'Yumurtalar sıcacık']].map(([n, s]) => ({ n: yarnText(n, 72, '#F4C542', C.ink), s: yarnText(s, 72, '#F7EEDC', C.ink) }));
    },
    frame(g, t, W, H) {
      g.drawImage(S.bg, 0, 0);
      const ch = S.chart.g;
      chart(ch, t);
      const d = ch.getImageData(0, 0, COLS, ROWS).data;
      // knit in (bottom to top) at the start, unravel (top to bottom) at the end
      const kin = P(t, 0.0, 0.85) * ROWS, unr = P(t, 7.1, 7.95) * ROWS;
      const ox = (W - COLS * SW) / 2;
      for (let r = 0; r < ROWS; r++) {
        if (ROWS - 1 - r >= kin) continue;
        if (r < unr) continue;
        const y = r * SHh, drop = ROWS - 1 - r > kin - 3 ? (kin - (ROWS - 1 - r)) / 3 : 1;
        for (let c2 = 0; c2 < COLS; c2++) {
          const k = (r * COLS + c2) * 4, idx = S.idx.get(`${d[k]},${d[k + 1]},${d[k + 2]}`) ?? 0;
          g.fillStyle = S.dark[idx]; g.fillRect(ox + c2 * SW, y - (1 - drop) * 10, SW, SHh);
          g.drawImage(S.spr[idx], ox + c2 * SW - 2, y - 3 - (1 - drop) * 10);
        }
      }
      // the working yarn strand while unravelling
      if (unr > 0 && unr < ROWS) {
        const y = unr * SHh;
        g.save(); g.strokeStyle = C.nest; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(ox, y);
        for (let x = ox; x <= W; x += 30) g.lineTo(x, y - 40 * Math.sin((x / W) * Math.PI) - 10 * Math.sin(x * 0.05 + t * 20)); g.stroke(); g.restore();
      }
      // yarn lettering on the plain bands
      const vis = r => r >= unr && ROWS - 1 - r < kin;
      if (vis(14)) {
        SH.drawSprite(g, S.t1, W / 2, 230, { ax: 0.5, alpha: E.outC(P(t, 0.6, 1.0)) });
        SH.drawSprite(g, S.t2, W / 2, 360, { ax: 0.5, alpha: E.outC(P(t, 0.8, 1.2)) });
      }
      const L = [[1.2, 2.6], [2.6, 4.9], [4.9, 7.0]];
      L.forEach(([a, b2], i) => {
        const k = P(t, a, a + 0.35) * (1 - P(t, b2, b2 + 0.25));
        if (k <= 0 || !vis(90)) return;
        const lab = S.labels[i], w = lab.n.width + 26 + lab.s.width;
        SH.drawSprite(g, lab.n, W / 2 - w / 2, 1810 + (1 - k) * 20, { alpha: k });
        SH.drawSprite(g, lab.s, W / 2 - w / 2 + lab.n.width + 26, 1810 + (1 - k) * 20, { alpha: k });
      });
    },
  });
})();
