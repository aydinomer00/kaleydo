'use strict';
/* 17 · Doğa Defteri — a naturalist's spiral-bound field notebook: dot-grid paper, graphite sketches under loose
   watercolour washes, fountain-pen handwriting, a taped-in map card with a dashed route, a pressed feather.
   Everything is written and sketched live; the page flips up over the spiral to reveal a fresh page. */
(() => {
  const { E, P, clamp, lerp, rng, mix, darken, rgba } = SH;
  const C = {
    desk: '#2F3B34', board: '#9A7853', paper: '#F7F1E3', ink: '#24365E', lead: '#5C5752', rust: '#C2553A',
    blue: '#2F4C86', cream: '#E9D3A6', sea: '#A8CBDD', sand: '#DDB46C', land: '#D9D0B6', turkey: '#D0694A',
    print: '#A48C6E', dot: 'rgba(110,95,75,0.30)', mint: '#86CDBB', coral: '#EE9A84', wire: '#2A2C31',
  };
  const S = {};
  const PAGE = { x: 46, y: 150, w: 988, h: 1720 }, AX = 182;                 // AX: the spiral axis (hole row)
  const HOLES = Array.from({ length: 18 }, (_, i) => PAGE.x + 52 + i * 52);
  const BIRD = { x: 560, y: 800, s: 0.72, r: -0.16 }, BW = 660, BH = 720, OX = 310, OY = 360;
  const CARD = { x: 318, y: 1350, w: 460, h: 540, r: -0.04 };
  const FEATHER = { x: 300, y: 1722, r: -0.08 };

  // map outlines (longitude, latitude), deliberately rough like a hand-copied sketch map
  const AFRICA = [[-5.8, 35.8], [-2, 35.1], [1, 36.5], [5, 36.8], [10.2, 37.2], [11, 36.5], [10.3, 34], [11.5, 33.1], [15.2, 32.3], [18, 30.6], [20, 31.4], [20.1, 32.4], [22, 32.9], [25, 31.6], [29.9, 31.2], [32.3, 31.3], [32.6, 29.9], [33.6, 27.5], [35.5, 24], [37.2, 19.6], [38.6, 17.5], [39.5, 15.6], [41.7, 13.4], [43.1, 11.6], [44.5, 10.4], [48, 11.2], [51.3, 11.8], [51, 10.4], [49.5, 6.5], [47.5, 4], [45.3, 2], [42, -0.6], [40.2, -2.5], [39.7, -4], [39.3, -6.8], [39.7, -10], [40.5, -15], [38, -17.5], [35, -19.8], [35.4, -22], [32.6, -26], [32.4, -28.6], [31, -29.9], [28, -32.6], [25.6, -34], [22, -34], [20, -34.8], [18.4, -33.9], [18.2, -32], [16.5, -28.6], [15.1, -26.7], [14.5, -22.9], [13.2, -20], [11.8, -17.2], [12.3, -13.5], [13.4, -12], [13.2, -8.8], [12.3, -6], [11.8, -3.9], [9.4, 0.4], [9.7, 4], [8.5, 4.5], [6, 4.3], [4.4, 6.3], [1.5, 6.2], [-0.2, 5.6], [-2, 4.8], [-4, 5.3], [-7.5, 4.4], [-10.8, 6.3], [-13.2, 8.5], [-14.8, 10.8], [-15.6, 11.9], [-16.8, 13.2], [-17.4, 14.7], [-16.5, 16], [-16, 18], [-16.5, 19.5], [-17, 20.8], [-16, 23.5], [-14.8, 25], [-13, 27.6], [-11.5, 28.2], [-9.8, 29.9], [-9.6, 30.4], [-9.8, 31.7], [-8.5, 33.2], [-6.8, 34]];
  const MADAG = [[49.3, -12], [50.5, -15.5], [49.8, -17], [48, -22], [47.1, -24.9], [45.2, -25.6], [44, -24.9], [43.3, -22], [44.4, -19], [44, -17], [44.5, -16.2], [46.3, -15.7], [47, -14.5], [48, -13.5]];
  const MIDEAST = [[36.2, 36.6], [35.9, 35.5], [35.5, 33.9], [35, 32.8], [34.5, 31.6], [34.2, 31.3], [33, 31.1], [32.3, 31.3], [32.6, 29.9], [33.5, 28.4], [34.3, 27.7], [34.6, 28.5], [34.9, 29.5], [35.6, 28], [36.5, 26], [38, 24], [39.2, 21.5], [40.8, 19], [42.5, 16.5], [42.8, 14.5], [43.3, 12.7], [45, 12.8], [48.5, 14], [52, 15.5], [55, 17.2], [60, 19], [60, 46], [40.3, 46], [41.6, 41.5], [44.8, 39.7], [44.3, 37.4], [42.3, 37.1], [36.6, 36.8]];
  const TURKEY = [[26, 40.6], [26.6, 41.7], [28, 42], [29, 41.25], [31.5, 41.2], [33.5, 42], [35, 42.1], [36.5, 41.3], [38.5, 41], [40.5, 41], [41.6, 41.5], [43.5, 41.1], [44.8, 39.7], [44.3, 37.4], [42.3, 37.1], [40, 36.9], [38, 36.8], [36.6, 36.8], [36.2, 36], [35.9, 36.7], [34.6, 36.8], [33.5, 36.2], [32.5, 36.1], [30.6, 36.8], [29.6, 36.2], [28.3, 36.8], [27.4, 37], [27.2, 37.9], [26.3, 38.3], [26.8, 38.9], [26.6, 39.5], [26.2, 39.9], [26.4, 40.2]];
  const IBERIA = [[-9.3, 46], [-9.3, 43], [-8.9, 42], [-8.8, 41], [-9.5, 39], [-8.8, 38.4], [-8.9, 37], [-7.4, 37.2], [-6.3, 36.8], [-5.6, 36], [-4.4, 36.7], [-2, 36.8], [-0.7, 37.6], [-0.5, 38.3], [0.2, 38.8], [-0.3, 39.5], [0.9, 41], [3.2, 41.9], [3.2, 43], [4.5, 43.5], [6.5, 43.1], [7.5, 43.8], [8.8, 44.4], [8.8, 46]];
  const ITALY = [[10, 46], [10.3, 43.2], [11, 42.4], [12.4, 41.6], [14, 40.8], [15, 40.2], [15.6, 40], [15.8, 38.6], [16.1, 38], [16.6, 38.6], [17.2, 39], [16.6, 39.8], [17, 40.5], [18.5, 40.2], [17.4, 40.9], [16, 41.5], [15.1, 41.9], [14.4, 42.4], [13.6, 43.5], [12.6, 46]];
  const BALKANS = [[14, 46], [17.6, 43], [18.5, 42.5], [19.4, 41.9], [19.5, 40.5], [20, 39.6], [20.7, 38.8], [21.1, 38.3], [21.6, 37.2], [22.4, 36.5], [23.1, 36.8], [22.8, 37.6], [23.4, 38], [24, 38.2], [23, 38.9], [22.6, 40], [22.9, 40.6], [23.8, 40.7], [24.4, 40.9], [25.4, 40.9], [26, 40.8], [26.6, 41.7], [28, 42], [28.6, 44], [30, 46]];
  const ISLES = [
    [[12.4, 38], [13.4, 38.2], [15.6, 38.3], [15.1, 37], [14.3, 36.9], [12.6, 37.6]],
    [[8.4, 41], [9.5, 41.2], [9.8, 40], [9.6, 39.1], [8.6, 38.9], [8.4, 39.9]],
    [[8.6, 42.9], [9.4, 43], [9.5, 42], [9.2, 41.4], [8.7, 41.8]],
    [[23.5, 35.5], [24.3, 35.4], [26.3, 35.3], [26, 35], [24.7, 34.9], [23.6, 35.2]],
    [[32.3, 35.1], [33, 35.4], [34.6, 35.7], [34, 34.9], [32.9, 34.6]],
  ];
  const ROUTE = [[33, 39.2], [35.6, 36.4], [34.6, 32.2], [32.5, 27], [32.6, 20], [32.8, 12], [33.4, 3], [31.5, -7], [28.5, -16], [26.5, -24], [25.2, -29]];

  const lp2 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
  const arcPts = (cx, cy, rx, ry, a0, a1, n) => Array.from({ length: n + 1 }, (_, i) => { const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
  const sm = (pts, n) => SH.catmullPts(pts, n);
  const close = pts => [...pts, pts[0]];

  function specks(seed, n, col, rmax) {
    const { c, g } = SH.canvas(256, 256), R = rng(seed);
    g.fillStyle = col;
    for (let i = 0; i < n; i++) { g.globalAlpha = 0.3 + R() * 0.7; g.beginPath(); g.arc(R() * 256, R() * 256, 0.4 + R() * rmax, 0, 6.283); g.fill(); }
    return c;
  }
  function leadTex() {                                     // graphite: the lead colour with grainy coverage
    const { c, g } = SH.canvas(128, 128), img = g.createImageData(128, 128), R = rng(1702), [r, gr, b] = SH.hex2rgb(C.lead);
    for (let i = 0; i < 128 * 128; i++) { const k = i * 4; img.data[k] = r; img.data[k + 1] = gr; img.data[k + 2] = b; img.data[k + 3] = 255 * (0.3 + 0.7 * Math.pow(R(), 0.55)); }
    g.putImageData(img, 0, 0);
    return c;
  }
  const inkText = (s, size, col = C.ink, wt = 700) => SH.textSprite(s, size, {
    fam: 'Caveat', wt, col, key: 'ink',
    paint: (q, w, h, bx, by, draw) => {                    // fountain-pen ink pools slightly toward the baseline
      q.fillStyle = col; draw();
      q.globalCompositeOperation = 'source-atop';
      const gr = q.createLinearGradient(0, by - size * 0.8, 0, by + size * 0.15);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.2)');
      q.fillStyle = gr; q.fillRect(0, 0, w, h);
    },
  });
  const leadText = (s, size) => SH.textSprite(s, size, {
    fam: 'Caveat', wt: 600, col: C.lead, key: 'lead',
    paint: (q, w, h, bx, by, draw) => {
      q.fillStyle = C.lead; draw();
      q.globalCompositeOperation = 'destination-out'; q.globalAlpha = 0.6;
      q.fillStyle = q.createPattern(S.knock, 'repeat'); q.fillRect(0, 0, w, h);
    },
  });
  function write(g, sp, x, y, u, o = {}) {                 // handwriting: reveal the sprite left to right
    u = clamp(u);
    if (u <= 0) return;
    const cw = u >= 1 ? sp.w : sp.bx + sp.width * u;
    g.save();
    g.translate(x - (o.ax || 0) * sp.width, y);
    if (o.rot) g.rotate(o.rot);
    g.drawImage(sp.c, 0, 0, cw, sp.h, -sp.bx, -sp.by, cw, sp.h);
    g.restore();
  }
  function pencil(g, pts, u, lw, a, seed, jit = 2) {       // graphite line + a lighter ghost line beside it
    if (u <= 0) return;
    const p = SH.partial(pts, u);
    if (p.length < 2) return;
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.globalAlpha *= a;
    g.strokeStyle = SH.pattern(g, S.lead); g.lineWidth = lw; g.stroke(SH.pathFrom(p, false));
    g.globalAlpha *= 0.5; g.lineWidth = lw * 0.5; g.stroke(SH.pathFrom(SH.jitterPts(p, seed, jit, false), false));
    g.restore();
  }
  function inkLine(g, pts, u, lw, col = C.ink) {
    if (u <= 0) return;
    const p = SH.partial(pts, u);
    if (p.length < 2) return;
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = col; g.lineWidth = lw; g.stroke(SH.pathFrom(p, false)); g.restore();
  }
  function arrow(g, a, k, b, u, col = C.ink, lw = 3.6) {
    const pts = SH.thruPts(a, k, b, 28);
    inkLine(g, pts, u, lw, col);
    if (u < 0.97) return;
    const n = pts.length, [x, y] = pts[n - 1], [px, py] = pts[n - 4], ang = Math.atan2(y - py, x - px);
    g.save(); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.beginPath();
    for (const s of [-1, 1]) { g.moveTo(x, y); g.lineTo(x - Math.cos(ang + s * 0.5) * 18, y - Math.sin(ang + s * 0.5) * 18); }
    g.stroke(); g.restore();
  }
  const hline = (x0, x1, y, seed, amp = 3) => { const n = Math.max(8, Math.round((x1 - x0) / 14)); return Array.from({ length: n + 1 }, (_, i) => [lerp(x0, x1, i / n), y + SH.noise1(seed, i * 0.35) * amp + (i / n) * 4]); };

  // watercolour layer: loose fill, pigment pools, darker drying edge, granulation
  function washLayer(cw, ch, ox, oy, polys, col, seed, o = {}) {
    const { c, g } = SH.canvas(cw, ch), R = rng(seed);
    g.translate(ox + (o.dx ?? 4), oy + (o.dy ?? 3));
    polys.forEach((poly, i) => {
      const pts = SH.jitterPts(SH.resample(close(poly), 5), seed + i * 7, o.jit ?? 4), p = SH.pathFrom(pts);
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
      g.save(); g.globalAlpha = o.a ?? 0.82; g.fillStyle = col; g.fill(p); g.clip(p);
      for (let k = 0; k < (o.pools ?? 3); k++) {
        const x = lerp(x0, x1, R()), y = lerp(y0, y1, R()), r = (20 + R() * 40) * (o.ps ?? 1), gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, rgba(darken(col, 0.35), 0.35)); gr.addColorStop(1, rgba(darken(col, 0.35), 0));
        g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
      }
      g.globalAlpha = 0.55; g.filter = `blur(${o.eb ?? 2.5}px)`; g.strokeStyle = darken(col, 0.32); g.lineWidth = o.ew ?? 7; g.stroke(p); g.filter = 'none';
      g.restore();
    });
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-atop'; g.globalAlpha = o.gran ?? 0.3; g.fillStyle = g.createPattern(S.gran, 'repeat'); g.fillRect(0, 0, cw, ch);
    return c;
  }
  function tapeCanvas(w, h, col, seed, kind) {             // washi tape: translucent, torn ends, printed pattern
    const { c, g } = SH.canvas(w + 10, h + 4), R = rng(seed), pts = [];
    for (let y = 0; y <= h; y += 4) pts.push([5 + (R() - 0.5) * 6, 2 + y]);
    for (let y = h; y >= 0; y -= 4) pts.push([w + 5 + (R() - 0.5) * 6, 2 + y]);
    const p = SH.pathFrom(pts);
    g.fillStyle = rgba(col, 0.82); g.fill(p);
    g.save(); g.clip(p);
    if (kind === 'stripe') { g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 7; for (let x = -h; x < w + h; x += 18) { g.beginPath(); g.moveTo(x, h + 4); g.lineTo(x + h, 0); g.stroke(); } }
    else { g.fillStyle = 'rgba(255,255,255,0.6)'; for (let y = 9, r = 0; y < h; y += 13, r++) for (let x = 10 + (r % 2) * 7; x < w + 5; x += 14) { g.beginPath(); g.arc(x, y, 2.6, 0, 6.283); g.fill(); } }
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,0.28)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w + 10, h + 4);
    g.restore();
    return c;
  }
  function tape(g, cv, x, y, rot, k) {
    if (k <= 0) return;
    const e = E.outC(k), s = lerp(1.15, 1, e);
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.globalAlpha *= clamp(k * 3);
    g.shadowColor = 'rgba(40,30,20,0.2)'; g.shadowBlur = 4; g.shadowOffsetY = 1.5;
    g.drawImage(cv, -cv.width / 2, -cv.height / 2);
    g.restore();
  }

  function birdGeo() {                                     // a barn swallow seen from below, heading left
    const head0 = arcPts(-170, -4, 40, 40, 190, 290, 14);
    const back = sm([[-156, -42], [-110, -36], [-40, -26], [40, -17], [96, -12]], 24);
    const tailU = [[96, -12], [170, -42], [246, -80], [320, -114], [262, -64], [205, -26], [166, -4]];
    const tailL = [[205, 22], [262, 60], [320, 108], [246, 76], [170, 40], [96, 13]];
    const belly = sm([[96, 13], [40, 20], [-40, 32], [-110, 40], [-151, 31]], 24);
    const head1 = arcPts(-170, -4, 40, 40, 62, 160, 12);
    const beak = [[-208, 6], [-229, -2], [-209, -11]];
    const body = close([...head0, ...back.slice(1), ...tailU.slice(1), ...tailL, ...belly.slice(1), ...head1.slice(1), ...beak]);
    const wing = (lead, trail) => { const L = sm(lead, 36), T = sm(trail, 30); return { L, T, out: [...L, ...T.slice(1)] }; };
    const wU = wing([[-108, -36], [-100, -92], [-78, -150], [-40, -205], [8, -250], [60, -285], [104, -306]], [[104, -306], [78, -262], [50, -214], [28, -160], [12, -106], [0, -60], [-14, -30]]);
    const wL = wing([[-106, 38], [-96, 96], [-72, 156], [-34, 210], [14, 254], [64, 286], [108, 304]], [[108, 304], [80, 262], [52, 214], [30, 160], [14, 108], [2, 62], [-12, 32]]);
    const prim = w => { const Tr = w.T.slice().reverse(), out = []; for (let k = 0; k < 5; k++) { const u0 = 0.2 + k * 0.13, u1 = Math.min(0.97, u0 + 0.26); out.push([lp2(SH.catmull(w.L, u0), SH.catmull(Tr, u0), 0.72), lp2(SH.catmull(w.L, u1), SH.catmull(Tr, u1), 0.38)]); } return out; };
    const cons = [arcPts(-170, -4, 47, 47, 0, 360, 36), arcPts(-30, 6, 142, 42, 0, 360, 40), [[-252, 4], [338, 4]], [[-64, -30], [104, -306]], [[-64, 34], [108, 304]]];
    const tail = [...tailU, ...tailL];
    const cap = [...arcPts(-170, -4, 40, 40, 178, 335, 16), [-150, -14], [-192, -6]];
    const cream = [[-150, -36], [-110, -34], [-40, -24], [40, -15], [94, -10], [94, 11], [40, 18], [-40, 30], [-110, 38], [-150, 32]];
    return { body, wU, wL, prim: [...prim(wU), ...prim(wL)], cons, tail, cap, cream };
  }

  function mapCard() {
    const { c, g } = SH.canvas(CARD.w, CARD.h);
    g.fillStyle = '#FCF8EF'; g.fillRect(0, 0, CARD.w, CARD.h);
    g.globalCompositeOperation = 'soft-light'; g.globalAlpha = 0.5; g.fillStyle = g.createPattern(SH.grain(256, 1730, { fibres: 120 }), 'repeat'); g.fillRect(0, 0, CARD.w, CARD.h);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    const k = 5.19, mx = lo => 46 + (lo + 19) * k, my = la => 60 + (43 - la) * k, prj = a => a.map(([lo, la]) => [mx(lo), my(la)]);
    const M = { x: 20, y: 60, w: 420, h: 410 };
    const lands = [[AFRICA, C.sand], [MADAG, C.sand], [MIDEAST, C.land], [IBERIA, C.land], [ITALY, C.land], [BALKANS, C.land], ...ISLES.map(p => [p, C.land]), [TURKEY, C.turkey]];
    const sea = washLayer(CARD.w, CARD.h, 0, 0, [[[M.x, M.y], [M.x + M.w, M.y], [M.x + M.w, M.y + M.h], [M.x, M.y + M.h]]], C.sea, 1731, { jit: 0, dx: 0, dy: 0, a: 0.55, pools: 6, ps: 2.2, ew: 10 });
    const sg = sea.getContext('2d');
    sg.globalCompositeOperation = 'destination-out'; sg.globalAlpha = 1; sg.lineWidth = 7; sg.lineJoin = 'round';
    for (const [pts] of lands) { const p = SH.pathFrom(prj(pts)); sg.fill(p); sg.stroke(p); }   // a paper gap between sea and land
    g.save(); g.beginPath(); g.rect(M.x, M.y, M.w, M.h); g.clip();
    g.drawImage(sea, 0, 0);
    lands.forEach(([pts, col], i) => g.drawImage(washLayer(CARD.w, CARD.h, 0, 0, [prj(pts)], col, 1740 + i, { jit: 1.5, dx: 1.5, dy: 1, a: col === C.land ? 0.6 : 0.85, pools: 2, ps: 0.8, ew: 4, eb: 1.5 }), 0, 0));
    for (const [pts] of lands) pencil(g, close(prj(pts)), 1, 1.3, 0.85, 1750, 1.2);
    g.restore();
    for (const [a, b] of [[[M.x - 8, M.y], [M.x + M.w + 6, M.y + 1]], [[M.x + M.w, M.y - 6], [M.x + M.w - 1, M.y + M.h + 8]], [[M.x + M.w + 7, M.y + M.h], [M.x - 5, M.y + M.h - 1]], [[M.x, M.y + M.h + 6], [M.x + 1, M.y - 7]]]) pencil(g, [a, b], 1, 1.7, 0.85, 1752, 1);
    write(g, inkText('Afrika', 46), mx(18), my(6), 1, { ax: 0.5 });
    write(g, inkText('Türkiye', 34), 214, 46, 1);
    arrow(g, [300, 50], [306, 58], [312, 74], 1, C.ink, 2.6);
    write(g, inkText('göç yolu', 40, C.ink, 600), CARD.w / 2, 516, 1, { ax: 0.5 });
    S.route = sm(prj(ROUTE), 90);
    return c;
  }
  function featherCanvas() {
    const { c, g } = SH.canvas(440, 150), R = rng(1770);
    const A = [22, 84], K = [220, 58], B = [424, 66], at = u => SH.qp(A, K, B, u);
    const tan = u => { const a = at(Math.max(0, u - 0.01)), b = at(Math.min(1, u + 0.01)), l = Math.hypot(b[0] - a[0], b[1] - a[1]); return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
    g.lineCap = 'round';
    for (let i = 0; i < 280; i++) {
      const u = 0.05 + (i / 280) * 0.93;
      if (u > 0.55 && u < 0.585) continue;                 // a small split in the vane
      const [x, y] = at(u), [tx, ty] = tan(u), prof = Math.pow(Math.sin(Math.PI * Math.min(1, (u - 0.03) / 0.98)), 0.55);
      const band = 0.5 + 0.5 * Math.sin(u * 30), fluff = u < 0.2;
      for (const side of [-1, 1]) {
        const len = (side < 0 ? 24 : 46) * prof * (fluff ? 1.3 : 1) + R() * 3, ang = side * (fluff ? 1.25 : 0.95);
        const dx = tx * Math.cos(ang) - ty * Math.sin(ang), dy = tx * Math.sin(ang) + ty * Math.cos(ang);
        const ex = x + dx * len, ey = y + dy * len, cx = x + dx * len * 0.5 + tx * len * 0.18, cy = y + dy * len * 0.5 + ty * len * 0.18 + (fluff ? (R() - 0.5) * 8 : 0);
        g.strokeStyle = fluff ? rgba('#CFC5B8', 0.7) : rgba(mix('#9C8D7E', '#4C4552', band * 0.55 + u * 0.35), 0.8);
        g.lineWidth = fluff ? 0.9 : 1.15;
        g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(cx, cy, ex, ey); g.stroke();
      }
    }
    const shaft = new Path2D(); shaft.moveTo(...A); shaft.quadraticCurveTo(...K, ...B);
    g.strokeStyle = '#8A7A68'; g.lineWidth = 3.6; g.stroke(shaft);
    g.strokeStyle = '#F1E8D6'; g.lineWidth = 2; g.stroke(shaft);
    return c;
  }
  function pencilProp(g) {                                 // a yellow hex pencil lying on the desk
    g.save(); g.translate(120, 76); g.rotate(-0.035);
    const L = 520, w = 30;
    g.save(); g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 16; g.shadowOffsetY = 9;
    g.fillStyle = '#E8B730'; g.fillRect(60, -w / 2, L - 120, w); g.restore();
    g.fillStyle = '#F6D25E'; g.fillRect(60, -w / 2, L - 120, w / 3);
    g.fillStyle = '#C8951E'; g.fillRect(60, w / 6, L - 120, w / 3);
    g.fillStyle = '#BFC2C8'; g.fillRect(L - 60, -w / 2 - 1, 34, w + 2);
    g.fillStyle = '#8F939B'; for (const x of [L - 54, L - 44, L - 34]) g.fillRect(x, -w / 2 - 1, 2.5, w + 2);
    g.fillStyle = '#E48A86'; g.fill(SH.pathFrom(SH.rrect(L - 27, -w / 2, 27, w, 7, 1781, { jit: 0.1 })));
    g.fillStyle = '#E6C79A'; g.beginPath(); g.moveTo(60, -w / 2); g.lineTo(0, 0); g.lineTo(60, w / 2); g.closePath(); g.fill();
    g.fillStyle = '#3E3B3A'; g.beginPath(); g.moveTo(18, -5.4); g.lineTo(0, 0); g.lineTo(18, 5.4); g.closePath(); g.fill();
    g.restore();
  }
  const spiralBack = g => { for (const x of HOLES) { const p = new Path2D(); p.moveTo(x + 9, AX - 62); p.quadraticCurveTo(x + 22, AX - 52, x + 20, PAGE.y + 14); g.lineCap = 'round'; g.strokeStyle = '#1C1D21'; g.lineWidth = 7; g.stroke(p); } };
  const spiralFront = g => {
    for (const x of HOLES) {
      const p = new Path2D(); p.moveTo(x - 1, AX + 5); p.quadraticCurveTo(x - 6, AX - 50, x + 9, AX - 62);
      g.lineCap = 'round'; g.strokeStyle = C.wire; g.lineWidth = 7.5; g.stroke(p);
      g.save(); g.translate(-1.7, 0); g.strokeStyle = 'rgba(214,218,226,0.85)'; g.lineWidth = 2.2; g.stroke(p); g.restore();
    }
  };

  SH.register({
    id: '17', w: 1080, h: 1920, duration: 8, fps: 30, poster: 6.6,
    fonts: ['700 80px "Caveat"', '600 80px "Caveat"', '600 40px "Inter"'],
    init(g, W, H) {
      S.lead = leadTex(); S.gran = specks(1703, 1600, '#2A2230', 1.2); S.knock = specks(1704, 2600, '#000', 0.9);
      S.pagePath = SH.pathFrom(SH.rrect(PAGE.x, PAGE.y, PAGE.w, PAGE.h, 12, 1720, { jit: 0.2 }));
      const holes = HOLES.map(x => SH.pathFrom(SH.rrect(x - 7, AX - 11, 14, 22, 7, x, { jit: 0.1 })));
      // desk, pencil, notebook board, page stack, wire backs
      const dk = SH.canvas(W, H), d = dk.g;
      d.fillStyle = C.desk; d.fillRect(0, 0, W, H);
      d.globalCompositeOperation = 'soft-light'; d.globalAlpha = 0.9; d.fillStyle = d.createPattern(SH.grain(256, 1780, { fine: 34, mottle: 30, fibres: 500, fibreLen: 2, fibreVar: 6, cell: 8 }), 'repeat'); d.fillRect(0, 0, W, H);
      d.globalCompositeOperation = 'source-over'; d.globalAlpha = 1;
      d.drawImage(SH.vignette(W, H, 0.4, '8,12,10'), 0, 0);
      pencilProp(d);
      const board = SH.pathFrom(SH.rrect(PAGE.x - 12, PAGE.y - 14, PAGE.w + 24, PAGE.h + 34, 14, 1782, { jit: 0.3 }));
      d.save(); d.shadowColor = 'rgba(0,0,0,0.5)'; d.shadowBlur = 40; d.shadowOffsetY = 18; d.fillStyle = C.board; d.fill(board); d.restore();
      SH.paper(d, board, { color: C.board, z: 0, tex: 0.8, seed: 3, edge: false });
      for (let i = 3; i >= 1; i--) { d.fillStyle = mix(C.paper, '#A89676', 0.1 + i * 0.09); d.fill(SH.pathFrom(SH.rrect(PAGE.x + 1, PAGE.y + i * 4, PAGE.w - 2, PAGE.h, 12, 1790 + i, { jit: 0.2 }))); }
      d.fillStyle = '#3B3128'; for (const p of holes) d.fill(p);
      spiralBack(d);
      S.desk = dk.c;
      // the blank page (front: printed fields), its back, and a dark silhouette for shading the flip
      const mkPage = front => {
        const { c, g: b } = SH.canvas(W, H);
        b.fillStyle = C.paper; b.fill(S.pagePath);
        b.save(); b.clip(S.pagePath);
        b.globalCompositeOperation = 'soft-light'; b.globalAlpha = 0.5; b.fillStyle = b.createPattern(SH.grain(512, 1721, { fibres: 500, fine: 9, mottle: 22 }), 'repeat'); b.fillRect(0, 0, W, H);
        b.globalCompositeOperation = 'source-over'; b.globalAlpha = 1;
        b.fillStyle = C.dot;
        for (let y = PAGE.y + 78; y < PAGE.y + PAGE.h - 20; y += 40) for (let x = PAGE.x + 34; x < PAGE.x + PAGE.w - 20; x += 40) { b.beginPath(); b.arc(x, y, 1.7, 0, 6.283); b.fill(); }
        if (front) {
          b.font = '600 21px "Inter"'; b.fillStyle = C.print;
          SH.fillTr(b, 'TARİH', 96, 254, 3); SH.fillTr(b, 'YER', 528, 254, 3);
          for (const [x0, x1] of [[184, 480], [586, 990]]) for (let x = x0; x < x1; x += 7) { b.beginPath(); b.arc(x, 259, 1.2, 0, 6.283); b.fill(); }
        }
        b.restore();
        b.globalCompositeOperation = 'destination-out'; for (const p of holes) b.fill(p);
        return c;
      };
      S.blank = mkPage(true); S.back = mkPage(false);
      const sl = SH.canvas(W, H); sl.g.fillStyle = '#1E160E'; sl.g.fill(S.pagePath); sl.g.globalCompositeOperation = 'destination-out'; for (const p of holes) sl.g.fill(p);
      S.sil = sl.c;
      const sp = SH.canvas(W, AX + 40); spiralFront(sp.g); S.spiral = sp.c;
      S.cur = SH.canvas(W, H);
      // the swallow sketch: geometry + three washes
      S.geo = birdGeo();
      const G = S.geo;
      S.washes = [
        { c: washLayer(BW, BH, OX, OY, [G.wU.out, G.wL.out, G.tail, G.cap], C.blue, 1710, { jit: 5 }), o: [-60, 0], R: 430, t0: 2.1, t1: 2.75, seed: 1711 },
        { c: washLayer(BW, BH, OX, OY, [SH.blob(-191, 6, 21, 16, 1712, { wob: 0.1 }), SH.blob(-166, 22, 24, 13, 1713, { wob: 0.1 })], C.rust, 1714, { jit: 2, pools: 1, ew: 4, ps: 0.4 }), o: [-180, 12], R: 80, t0: 2.4, t1: 2.65, seed: 1715 },
        { c: washLayer(BW, BH, OX, OY, [G.cream], C.cream, 1716, { jit: 3, pools: 2, ew: 5, a: 0.7 }), o: [-30, 10], R: 170, t0: 2.5, t1: 2.85, seed: 1717 },
      ];
      S.card = mapCard();
      S.feather = featherCanvas();
      S.tapeA = tapeCanvas(150, 42, C.mint, 1760, 'dots'); S.tapeB = tapeCanvas(170, 44, C.coral, 1761, 'stripe');
      S.icon = SH.pathFrom([[16, 0], [8, -3], [2, -4], [-4, -16], [-8, -17], [-6, -4], [-14, -3], [-24, -10], [-19, 0], [-24, 10], [-14, 3], [-6, 4], [-8, 17], [-4, 16], [2, 4], [8, 3]]);
      // handwriting
      S.date = leadText('12 Eylül', 50); S.place = leadText('arka bahçe', 50);
      S.t1 = inkText('Kırlangıçlar', 132); S.t2 = inkText('nereye gider?', 112);
      S.a1 = inkText('kırmızı boğaz', 54, C.ink, 600); S.a2 = inkText('çatal kuyruk', 54, C.ink, 600);
      S.notes = [['Sonbahar', 62, C.rust, 700, 600, 1150, 4.0, 4.35], ['böcekler azalır', 54, C.ink, 600, 600, 1222, 4.4, 4.8], ["Afrika'ya uçarlar", 54, C.ink, 600, 600, 1290, 4.8, 5.2], ['binlerce km!', 58, C.rust, 700, 630, 1372, 5.2, 5.45], ['İlkbahar', 62, C.rust, 700, 600, 1470, 5.65, 5.95], ['yuvaya dönerler', 54, C.ink, 600, 600, 1540, 6.0, 6.35]]
        .map(([s, size, col, wt, x, y, t0, t1]) => ({ sp: inkText(s, size, col, wt), x, y, t0, t1 }));
      S.cap = inkText('bahçede buldum!', 52, C.ink, 600);
      const n3 = S.notes[3], cx = n3.x + n3.sp.width / 2, cy = n3.y - 18, rx = n3.sp.width / 2 + 26;
      S.ring = Array.from({ length: 61 }, (_, i) => { const a = ((200 + i * 6.9) * Math.PI) / 180, rr = 1 + 0.07 * (i / 60); return [cx + Math.cos(a) * rx * rr, cy + Math.sin(a) * 42 * rr]; });
    },
    frame(g, t, W, H) {
      g.drawImage(S.desk, 0, 0);
      const cg = S.cur.g;
      cg.setTransform(1, 0, 0, 1, 0, 0); cg.globalAlpha = 1; cg.globalCompositeOperation = 'source-over';
      cg.clearRect(0, 0, W, H); cg.drawImage(S.blank, 0, 0);
      cg.save(); cg.clip(S.pagePath); content(cg, t); cg.restore();
      const u = E.ioC(P(t, 6.85, 7.95));
      if (u <= 0) g.drawImage(S.cur.c, 0, 0);
      else { g.drawImage(S.blank, 0, 0); if (u < 1) flipPage(g, S.cur.c, u, W, H); }
      g.drawImage(S.spiral, 0, 0);
    },
  });

  function content(g, t) {
    // header fields and title
    write(g, S.date, 196, 250, P(t, 0.15, 0.45));
    write(g, S.place, 598, 250, P(t, 0.4, 0.7));
    write(g, S.t1, 92, 392, P(t, 0.3, 0.85));
    write(g, S.t2, 130, 500, P(t, 0.8, 1.25));
    inkLine(g, hline(126, 140 + S.t2.width, 522, 1791, 3), E.ioS(P(t, 1.2, 1.45)), 4.5);
    // swallow sketch: construction lines, washes blooming, contour, details
    g.save(); g.translate(BIRD.x, BIRD.y); g.rotate(BIRD.r); g.scale(BIRD.s, BIRD.s);
    const lw = 1 / BIRD.s, G = S.geo, kc = P(t, 1.3, 1.75);
    G.cons.forEach((pts, i) => pencil(g, pts, clamp(kc * 1.6 - i * 0.15), 1.3 * lw, 0.26, 50 + i, 1.5));
    for (const w of S.washes) {
      const k = E.outC(P(t, w.t0, w.t1));
      if (k <= 0) continue;
      g.save(); g.globalCompositeOperation = 'multiply';
      if (k < 1) g.clip(SH.pathFrom(SH.blob(w.o[0], w.o[1], w.R * k, w.R * k, w.seed, { wob: 0.14, n: 64 })));
      g.drawImage(w.c, -OX, -OY);
      g.restore();
    }
    pencil(g, G.body, P(t, 1.5, 2.0), 2.5 * lw, 0.92, 61);
    pencil(g, G.wU.out, P(t, 1.8, 2.15), 2.3 * lw, 0.92, 62);
    pencil(g, G.wL.out, P(t, 1.95, 2.3), 2.3 * lw, 0.92, 63);
    G.prim.forEach((pr, i) => pencil(g, pr, P(t, 2.2 + (i % 5) * 0.04, 2.36 + (i % 5) * 0.04), 1.6 * lw, 0.7, 70 + i, 1));
    const ke = P(t, 2.75, 2.85);
    if (ke > 0) {
      g.globalAlpha = ke;
      g.fillStyle = '#1E1B1F'; g.beginPath(); g.arc(-183, -14, 6.5, 0, 6.283); g.fill();
      g.fillStyle = '#FFF'; g.beginPath(); g.arc(-185, -16, 2, 0, 6.283); g.fill();
      g.fillStyle = C.paper; for (const [x, y] of [[214, -52], [222, 46], [176, -30], [182, 26]]) { g.beginPath(); g.ellipse(x, y, 9, 5, x > 200 ? 0.5 : 0.35, 0, 6.283); g.fill(); }
      g.globalAlpha = 1;
    }
    g.restore();
    // annotations
    arrow(g, [250, 944], [300, 878], [430, 852], E.ioS(P(t, 2.85, 3.1)));
    write(g, S.a1, 96, 992, P(t, 2.95, 3.3));
    arrow(g, [846, 954], [862, 900], [812, 866], E.ioS(P(t, 3.05, 3.3)));
    write(g, S.a2, 712, 1004, P(t, 3.15, 3.5));
    // taped-in map card with the route
    const kc2 = P(t, 3.3, 3.7);
    if (kc2 > 0) {
      const e = E.outC(kc2), sc = lerp(1.12, 1, e);
      g.save(); g.translate(CARD.x, CARD.y); g.rotate(lerp(-0.14, CARD.r, e)); g.scale(sc, sc); g.globalAlpha = clamp(kc2 * 4);
      g.shadowColor = `rgba(50,35,20,${lerp(0.15, 0.32, e).toFixed(3)})`; g.shadowBlur = lerp(36, 10, e); g.shadowOffsetX = lerp(16, 3, e); g.shadowOffsetY = lerp(26, 5, e);
      g.drawImage(S.card, -CARD.w / 2, -CARD.h / 2);
      g.shadowColor = 'rgba(0,0,0,0)'; g.globalAlpha = 1;
      g.translate(-CARD.w / 2, -CARD.h / 2);
      const ur = E.ioS(P(t, 3.85, 5.2));
      if (ur > 0) {
        const part = SH.partial(S.route, ur);
        g.save(); g.setLineDash([11, 9]); g.lineCap = 'round'; g.strokeStyle = C.rust; g.lineWidth = 4.2; g.stroke(SH.pathFrom(part, false)); g.restore();
        g.fillStyle = C.rust; g.beginPath(); g.arc(S.route[0][0], S.route[0][1], 6, 0, 6.283); g.fill();
        const n = part.length, [x, y] = part[n - 1], [px, py] = part[Math.max(0, n - 4)];
        const ang = n > 1 && (x !== px || y !== py) ? Math.atan2(y - py, x - px) : Math.PI / 2;
        const flap = 0.65 + 0.35 * Math.cos(SH.stepT(t, 12) * 26);
        g.save(); g.translate(x, y); g.rotate(ang); g.scale(1.15, 1.15 * (ur < 1 ? flap : 1)); g.fillStyle = C.ink; g.fill(S.icon); g.restore();
      }
      tape(g, S.tapeA, 34, 20, -0.72, P(t, 3.62, 3.78));
      tape(g, S.tapeA, CARD.w - 34, 20, 0.7, P(t, 3.7, 3.86));
      g.restore();
    }
    // notes column
    for (const nt of S.notes) write(g, nt.sp, nt.x, nt.y, P(t, nt.t0, nt.t1));
    for (const i of [0, 4]) { const nt = S.notes[i]; inkLine(g, hline(nt.x - 4, nt.x + nt.sp.width + 8, nt.y + 14, 1800 + i, 2.5), E.ioS(P(t, nt.t1 - 0.05, nt.t1 + 0.12)), 3.6, C.rust); }
    inkLine(g, S.ring, E.ioS(P(t, 5.4, 5.7)), 3.4, C.rust);
    // pressed feather under tape
    const kf = P(t, 5.45, 5.8);
    if (kf > 0) {
      const e = E.outC(kf), s = lerp(1.1, 1, e);
      g.save(); g.translate(FEATHER.x, FEATHER.y); g.rotate(lerp(0.15, FEATHER.r, e)); g.scale(s, s); g.globalAlpha = clamp(kf * 4);
      g.shadowColor = `rgba(50,35,20,${lerp(0.1, 0.28, e).toFixed(3)})`; g.shadowBlur = lerp(24, 6, e); g.shadowOffsetX = lerp(10, 2, e); g.shadowOffsetY = lerp(18, 4, e);
      g.drawImage(S.feather, -220, -75);
      g.restore();
      tape(g, S.tapeB, FEATHER.x - 30, FEATHER.y - 4, 1.15, P(t, 5.75, 5.92));
    }
    arrow(g, [596, 1728], [560, 1696], [526, 1706], E.ioS(P(t, 6.0, 6.2)));
    write(g, S.cap, 604, 1752, P(t, 6.1, 6.45));
  }

  // the page flips up and over the spiral: rows of the page rotate about the hole row, with a little curl
  function flipPage(g, src, u, W, H) {
    const th0 = 1.5 * Math.PI * u, curl = 0.9 * Math.sin(Math.PI * u), f = 5200, Xc = W / 2, Yc = H / 2;
    const step = 4, d0 = PAGE.y - AX, d1 = PAGE.y + PAGE.h - AX;
    const nodes = [];
    for (let d = d0; d <= 0; d += step) nodes.push({ d, y: d * Math.cos(th0), z: d * Math.sin(th0), th: th0 });
    let y = 0, z = 0;
    for (let d = step; d <= d1 + 0.01; d += step) { const th = th0 + curl * ((d - step / 2) / d1); y += step * Math.cos(th); z += step * Math.sin(th); nodes.push({ d, y, z, th }); }
    const strips = [];
    let ymax = AX;
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i], b = nodes[i + 1], zm = (a.z + b.z) / 2, ym = (a.y + b.y) / 2;
      const Ya = Yc + (AX + a.y - Yc) * (f / (f - a.z)), Yb = Yc + (AX + b.y - Yc) * (f / (f - b.z));
      const nY = -Math.sin(b.th), nZ = Math.cos(b.th), vY = Yc - AX - ym, vZ = f - zm, dot = (nY * vY + nZ * vZ) / Math.hypot(vY, vZ);
      strips.push({ d: a.d, Ya, Yb, s: f / (f - zm), zm, front: dot > 0, lit: Math.abs(dot) });
      ymax = Math.max(ymax, Ya, Yb);
    }
    // soft shadow the lifted page casts on the fresh page below
    const sh = 0.3 * Math.sin(Math.min(th0 + curl * 0.5, Math.PI));
    if (sh > 0.005) {
      const L = 60 + 240 * Math.sin(Math.min(th0, Math.PI / 2));
      g.save(); g.clip(S.pagePath);
      const gr = g.createLinearGradient(0, ymax - 10, 0, ymax + L);
      gr.addColorStop(0, `rgba(40,28,16,${sh.toFixed(3)})`); gr.addColorStop(1, 'rgba(40,28,16,0)');
      g.fillStyle = gr; g.fillRect(0, ymax - 10, W, L + 10);
      g.restore();
    }
    strips.sort((p, q) => p.zm - q.zm);
    for (const s of strips) {
      const hy = s.Yb - s.Ya;
      if (Math.abs(hy) < 0.05) continue;
      g.setTransform(s.s, 0, 0, hy / step, Xc - Xc * s.s, s.Ya);
      const sy = AX + s.d;
      g.drawImage(s.front ? src : S.back, 0, sy, W, step + 0.75, 0, 0, W, step + 0.75);
      const dark = s.front ? 0.55 * (1 - s.lit) : 0.12 + 0.45 * (1 - s.lit);
      if (dark > 0.01) { g.globalAlpha = dark; g.drawImage(S.sil, 0, sy, W, step + 0.75, 0, 0, W, step + 0.75); g.globalAlpha = 1; }
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
  }
})();
