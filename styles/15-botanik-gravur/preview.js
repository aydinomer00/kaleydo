'use strict';
/* 15 · Botanik Gravür — a copperplate natural-history plate. Tone is made only with engraved lines:
   contour hatching follows each form, lines swell in shadow and break up in the light, the
   darkest areas get a second cross-hatch. Figures are engraved once into offscreen plates and
   revealed by a sweeping burin; the plate is burnished clean at the end of the loop. */
(() => {
  const { E, P, clamp, lerp, bump, rng, mix, darken, lighten, rgba } = SH;
  const C = { paper: '#F7F0E0', ink: '#3B2A1F', plate: '#F1E8D3', fox: '#C9A77B', accent: '#7A4A2A' };
  const S = {};
  const L = [-0.62, -0.78];                               // light comes from the top-left

  // contour hatching: rings shrunk toward the centroid; segment width follows the form's shade
  function engraveForm(g, pts, o = {}) {
    const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), rx = (Math.max(...xs) - Math.min(...xs)) / 2, ry = (Math.max(...ys) - Math.min(...ys)) / 2;
    const shade = (x, y) => clamp(0.45 + (((x - cx) / rx) * -L[0] + ((y - cy) / ry) * -L[1]) * 0.42 + (o.bias || 0));
    g.strokeStyle = C.ink; g.lineCap = 'round';
    const rings = o.rings || 16;
    for (let r = 0; r < rings; r++) {
      const k = 1 - (r / rings) * (o.depth ?? 0.9), ring = SH.resample(pts.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]).concat([[cx + (pts[0][0] - cx) * k, cy + (pts[0][1] - cy) * k]]), 6);
      for (let i = 1; i < ring.length; i++) {
        const [x0, y0] = ring[i - 1], [x1, y1] = ring[i], s = shade((x0 + x1) / 2, (y0 + y1) / 2) * (r === 0 ? 1.6 : 1);
        if (s < 0.28 && r > 0) continue;                  // lines break up in the light
        g.lineWidth = 0.5 + s * s * (o.w || 3.2); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      }
    }
    if (o.cross) {                                        // cross-hatching in the deepest shade
      g.save(); g.clip(SH.pathFrom(pts)); g.lineWidth = 1.1;
      for (let d = -rx - ry; d < rx + ry; d += 9) {
        for (let u = -1; u <= 1; u += 0.02) {
          const x = cx + d * 0.7 + u * rx * 1.4 * 0.7, y = cy - d * 0.7 + u * ry * 1.4 * 0.7;
          if (shade(x, y) > 0.74) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + 6, y + 6); g.stroke(); }
        }
      }
      g.restore();
    }
  }
  function leader(g, a, b, u) {                           // thin leader line drawn on
    const p = SH.partial([a, b], u);
    if (p.length < 2) return;
    g.save(); g.strokeStyle = C.ink; g.lineWidth = 1.6; g.beginPath(); g.moveTo(p[0][0], p[0][1]); g.lineTo(p[1][0], p[1][1]); g.stroke(); g.restore();
  }
  function plateCanvas(W, H, draw) { const c = SH.canvas(W, H); draw(c.g); return c.c; }
  function reveal(g, cv, x0, y0, x1, y1, u, diag = true) {   // a sweeping burin reveals an engraved plate
    if (u <= 0) return;
    g.save(); g.beginPath();
    if (diag) { const d = (x1 - x0 + y1 - y0) * u; g.moveTo(x0, y0); g.lineTo(x0 + d, y0); g.lineTo(x0, y0 + d); g.closePath(); }
    else g.rect(x0, y0, (x1 - x0) * u, y1 - y0);
    g.clip(); g.drawImage(cv, 0, 0); g.restore();
  }

  SH.register({
    id: '15', w: 1080, h: 1920, duration: 8, fps: 30, poster: 4.6,
    fonts: ['600 80px "EB Garamond"', '500 80px "EB Garamond"'],
    init(g, W, H) {
      const pp = SH.canvas(W, H), b = pp.g, R = rng(1501);
      b.fillStyle = C.paper; b.fillRect(0, 0, W, H);
      b.globalCompositeOperation = 'soft-light'; b.globalAlpha = 0.5; b.fillStyle = b.createPattern(SH.grain(512, 1502, { fibres: 900, mottle: 24 }), 'repeat'); b.fillRect(0, 0, W, H);
      b.globalCompositeOperation = 'multiply'; b.globalAlpha = 1;
      b.fillStyle = C.plate; b.fillRect(70, 110, W - 140, H - 220);                 // plate mark
      for (let i = 0; i < 14; i++) { const x = R() * W, y = R() * H, r = 4 + R() * 22, gr = b.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, rgba(C.fox, 0.22)); gr.addColorStop(1, rgba(C.fox, 0)); b.fillStyle = gr; b.fillRect(x - r, y - r, r * 2, r * 2); }   // foxing
      S.paper = pp.c;
      // figures, engraved once
      const kidney = (cx, cy, s) => SH.catmullPts([[cx - 120 * s, cy + 10 * s], [cx - 100 * s, cy - 70 * s], [cx, cy - 92 * s], [cx + 110 * s, cy - 60 * s], [cx + 128 * s, cy + 20 * s], [cx + 70 * s, cy + 84 * s], [cx + 8 * s, cy + 52 * s], [cx - 54 * s, cy + 86 * s], [cx - 120 * s, cy + 10 * s]], 90);
      S.fig1 = plateCanvas(W, H, q => { engraveForm(q, kidney(330, 700, 1.15), { rings: 18, cross: true, w: 3.4 }); q.fillStyle = C.ink; q.beginPath(); q.ellipse(338, 760, 26, 9, 0.1, 0, Math.PI * 2); q.fill(); });
      // fig. 2: the seed opened lengthways: a coat, two food stores, a tiny plant between them
      const half = (cx, cy, s, flip) => SH.catmullPts([[cx, cy - 150 * s], [cx + flip * 120 * s, cy - 120 * s], [cx + flip * 170 * s, cy], [cx + flip * 120 * s, cy + 130 * s], [cx, cy + 150 * s], [cx + flip * 18 * s, cy], [cx, cy - 150 * s]], 80);
      S.half = [-1, 1].map(f => plateCanvas(W, H, q => {
        const cx = 560, cy = 1080, outer = half(cx, cy, 1.25, f), inner = half(cx + f * 8, cy, 1.12, f);
        engraveForm(q, outer, { rings: 3, depth: 0.12, w: 3.6, bias: 0.25 });               // the coat: a dark rim
        engraveForm(q, inner, { rings: 11, depth: 0.75, w: 2.4, bias: -0.12 });             // the food store: lighter
      }));
      S.embryo = plateCanvas(W, H, q => {
        const pts = SH.catmullPts([[560, 960], [600, 1000], [596, 1080], [570, 1180], [548, 1190], [556, 1080], [540, 1000], [560, 960]], 50);
        engraveForm(q, pts, { rings: 8, cross: true, w: 2.6, bias: 0.25 });
        q.strokeStyle = C.ink; q.lineWidth = 2; q.beginPath(); q.moveTo(560, 962); q.quadraticCurveTo(530, 930, 500, 940); q.moveTo(560, 962); q.quadraticCurveTo(580, 925, 615, 935); q.stroke();   // first leaves
      });
      S.fig3 = plateCanvas(W, H, q => {
        q.translate(250, -40);
        engraveForm(q, kidney(540, 1530, 0.6), { rings: 12, w: 2.8, cross: true });
        q.strokeStyle = C.ink; q.lineCap = 'round';
        for (let k = 0; k < 3; k++) { q.lineWidth = 4 - k; q.beginPath(); q.moveTo(560 + k * 4, 1560); q.bezierCurveTo(600, 1620, 520 + k * 20, 1680, 560 + k * 26, 1740); q.stroke(); }   // root with root hairs
        for (let i = 0; i < 12; i++) { const y = 1620 + i * 9, x = 548 + Math.sin(i) * 14; q.lineWidth = 1; q.beginPath(); q.moveTo(x, y); q.lineTo(x + (i % 2 ? 16 : -16), y + 6); q.stroke(); }
        q.lineWidth = 4; q.beginPath(); q.moveTo(536, 1500); q.bezierCurveTo(520, 1430, 560, 1390, 540, 1330); q.stroke();   // shoot
        for (const f of [-1, 1]) engraveForm(q, SH.tfPts(SH.lobe(90, 46, 1510 + f, { a: 0.9, jit: 0.2 }), 540, 1335, 1, f * 1.05), { rings: 7, w: 2.2 });
      });
      S.t1 = SH.textSprite('Bir tohumun', 98, { fam: 'EB Garamond', wt: 600, col: C.ink });
      S.t2 = SH.textSprite('içinde ne var?', 98, { fam: 'EB Garamond', wt: 600, col: C.accent });
      S.plate = SH.textSprite('LEVHA I', 34, { fam: 'EB Garamond', wt: 500, col: C.ink, tr: 8 });
      S.fig = ['Şek. 1', 'Şek. 2', 'Şek. 3'].map(s => SH.textSprite(s, 38, { fam: 'EB Garamond', wt: 500, col: C.ink }));
      S.letters = ['a', 'b', 'c'].map(s => SH.textSprite(s, 44, { fam: 'EB Garamond', wt: 600, col: C.ink }));
      S.legend = ['a · Kabuk: tohumu korur', 'b · Besin deposu: ilk yemek', 'c · Minik bitki: filizlenir'].map(s => SH.textSprite(s, 46, { fam: 'EB Garamond', wt: 500, col: C.ink }));
    },
    frame(g, t, W, H) {
      g.drawImage(S.paper, 0, 0);
      const content = gg => {
        // border rules engrave themselves
        const bk = E.ioS(P(t, 0.0, 0.6));
        gg.strokeStyle = C.ink;
        for (const [ins, lw] of [[86, 3], [98, 1.2]]) { gg.lineWidth = lw; gg.beginPath(); SH.partial([[ins, 126], [W - ins, 126], [W - ins, H - 126], [ins, H - 126], [ins, 126]], bk).forEach((p, i) => (i ? gg.lineTo(p[0], p[1]) : gg.moveTo(p[0], p[1]))); gg.stroke(); }
        const tk = E.outC(P(t, 0.3, 0.9));
        SH.drawSprite(gg, S.plate, W / 2, 200, { ax: 0.5, alpha: tk });
        SH.drawSprite(gg, S.t1, W / 2, 330, { ax: 0.5, alpha: tk }); SH.drawSprite(gg, S.t2, W / 2, 438, { ax: 0.5, alpha: tk });
        // fig. 1: the whole seed
        reveal(gg, S.fig1, 160, 560, 520, 860, E.ioS(P(t, 0.8, 1.9)));
        if (t > 1.6) SH.drawSprite(gg, S.fig[0], 270, 890, { alpha: P(t, 1.6, 1.9) });
        // fig. 2: the seed opened: halves swing apart, the embryo appears between them
        const open = E.ioC(P(t, 2.6, 3.5));
        for (let i = 0; i < 2; i++) {
          const f = i ? 1 : -1, u = E.ioS(P(t, 1.9, 2.8));
          gg.save(); gg.translate(f * open * 36, 0); gg.translate(560, 1230); gg.rotate(f * open * 0.12); gg.translate(-560, -1230);
          reveal(gg, S.half[i], 340, 860, 800, 1300, u, false);
          gg.restore();
        }
        if (open > 0.6) reveal(gg, S.embryo, 480, 900, 640, 1200, E.ioS(P(t, 3.2, 3.9)), false);
        if (t > 3.3) SH.drawSprite(gg, S.fig[1], 300, 1320, { alpha: P(t, 3.3, 3.6) });
        // lettered leaders and legend
        const lead = [[[430, 980], [250, 940], 3.6], [[660, 1080], [860, 1040], 3.95], [[575, 1060], [860, 1180], 4.3]];
        lead.forEach(([a, b2, t0], i) => {
          const u = E.outC(P(t, t0, t0 + 0.35));
          if (u <= 0) return;
          leader(gg, a, b2, u);
          if (u > 0.9) SH.drawSprite(gg, S.letters[i], b2[0] + (b2[0] < 400 ? -30 : 14), b2[1] + 14, { alpha: P(t, t0 + 0.3, t0 + 0.5) });
          SH.drawSprite(gg, S.legend[i], 150, 1795 - (2 - i) * 0, { alpha: 0 });
        });
        // fig. 3: it germinates
        reveal(gg, S.fig3, 680, 1250, 910, 1720, E.ioS(P(t, 4.6, 6.0)), false);
        if (t > 5.6) SH.drawSprite(gg, S.fig[2], 830, 1730, { alpha: P(t, 5.6, 5.9) });
        // legend, one line at a time as each part is introduced
        [3.7, 4.05, 4.4].forEach((t0, i) => { const k = P(t, t0 + 0.2, t0 + 0.5); if (k > 0) SH.drawSprite(gg, S.legend[i], 140, 1560 + i * 64, { alpha: k }); });
      };
      const wipe = P(t, 7.05, 7.95);
      if (wipe <= 0) { content(g); return; }
      // loop: the plate is burnished clean from top to bottom
      const y = lerp(-80, H + 80, E.ioC(wipe));
      g.save(); g.beginPath(); g.rect(0, y, W, H - y); g.clip(); content(g); g.restore();
      const gr = g.createLinearGradient(0, y - 60, 0, y + 30); gr.addColorStop(0, 'rgba(255,250,235,0)'); gr.addColorStop(0.7, 'rgba(255,250,235,0.85)'); gr.addColorStop(1, 'rgba(255,250,235,0)');
      g.fillStyle = gr; g.fillRect(0, y - 60, W, 90);
    },
  });
})();
