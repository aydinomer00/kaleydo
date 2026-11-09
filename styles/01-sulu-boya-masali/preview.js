'use strict';
/* 01 · Sulu Boya Masalı — transparent washes on cold-press paper.
   Each wash is pre-painted once from ~26 randomly deformed translucent layers (pigment pools at
   the edges, granulates in the paper tooth) and blooms in through an irregular soft mask.
   Washes are composited with multiply, so overlaps darken like real glazes. */
(() => {
  const { E, P, clamp, lerp, bump, rng, mix, darken, lighten, rgba } = SH;
  const C = {
    paper: '#FAF6EC', ultra: '#3F64A8', cerulean: '#6FA8D2', sap: '#6E9B5A', ochre: '#E2A93B',
    sienna: '#B5643C', rose: '#D9808C', payne: '#34404E', graphite: '#5E6066', cloud: '#7D8CA3',
  };
  const S = {};

  function gauss(R) { let u = 0; while (u === 0) u = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * R()); }
  function deform(pts, depth, v, R) {
    for (let d = 0; d < depth; d++) {
      const out = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        const k = gauss(R) * len * v;
        out.push(a, [(a[0] + b[0]) / 2 - ((b[1] - a[1]) / len) * k, (a[1] + b[1]) / 2 + ((b[0] - a[0]) / len) * k]);
      }
      pts = out;
    }
    return pts;
  }
  function fillPoly(g, pts) { g.beginPath(); pts.forEach((p, k) => (k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); }
  // pre-paint one wash into its own canvas (painted once, reused every frame)
  function wash(basePts, color, seed, o = {}) {
    const R = rng(seed), pad = o.pad || 90;
    const xs = basePts.map(p => p[0]), ys = basePts.map(p => p[1]);
    const x0 = Math.floor(Math.min(...xs) - pad), y0 = Math.floor(Math.min(...ys) - pad);
    const x1 = Math.ceil(Math.max(...xs) + pad), y1 = Math.ceil(Math.max(...ys) + pad);
    const { c, g } = SH.canvas(x1 - x0, y1 - y0);
    g.translate(-x0, -y0);
    const base = deform(basePts, 2, o.base ?? 0.28, R), layers = o.layers || 24;
    for (let i = 0; i < layers; i++) {
      const poly = deform(base, 3, o.v ?? 0.24, R);
      g.globalAlpha = o.alpha || 0.038; g.fillStyle = i % 7 === 3 && o.tint ? o.tint : color;
      fillPoly(g, poly); g.fill();
      if (i % 4 === 0) { g.globalAlpha = o.edge ?? 0.06; g.strokeStyle = darken(color, 0.35); g.lineWidth = 2.2; g.stroke(); }
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'destination-out';                // wet-in-wet lifts: soft lighter pools
    for (let i = 0; i < (o.lift || 0); i++) {
      const lx = (0.2 + R() * 0.6) * (x1 - x0), ly = (0.25 + R() * 0.5) * (y1 - y0), lr = (0.12 + R() * 0.18) * Math.min(x1 - x0, y1 - y0);
      const gr = g.createRadialGradient(lx, ly, 0, lx, ly, lr);
      gr.addColorStop(0, 'rgba(0,0,0,0.42)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalAlpha = 1; g.fillStyle = gr; g.fillRect(0, 0, x1 - x0, y1 - y0);
    }
    for (let i = 0; i < (o.streaks || 0); i++) {                   // dry-brush lifts (water reflections)
      const sy = (0.3 + R() * 0.5) * (y1 - y0), sx = (0.15 + R() * 0.3) * (x1 - x0), sw = (0.2 + R() * 0.35) * (x1 - x0);
      g.globalAlpha = 0.35 + R() * 0.3; g.fillStyle = '#000';
      for (let k = 0; k < sw; k += 3) if (R() < 0.8) g.fillRect(sx + k, sy + SH.noise1(i, k * 0.02) * 4, 3, 2 + R() * 4);
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-atop';
    const n = ((x1 - x0) * (y1 - y0)) / 700;                       // granulation in the paper tooth
    for (let i = 0; i < n; i++) { g.fillStyle = rgba(darken(color, 0.4), (0.04 + R() * 0.12).toFixed(3)); const s = 1 + R() * 2.4; g.fillRect(R() * (x1 - x0), R() * (y1 - y0), s, s); }
    const mask = SH.blob(0, 0, 1, 1, seed + 7, { wob: 0.22, jit: 0, n: 60, freq: 6 });
    const tmp = SH.canvas(x1 - x0, y1 - y0);
    return { c, x0, y0, w: x1 - x0, h: y1 - y0, mask, tmp, ox: (o.ox ?? 0.5) * (x1 - x0), oy: (o.oy ?? 0.5) * (y1 - y0) };
  }
  // bloom: the wash spreads from where the brush touched, through a soft irregular mask
  function drawWash(g, Wv, k, alpha = 1) {
    if (k <= 0) return;
    g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = alpha;
    if (k >= 1) { g.drawImage(Wv.c, Wv.x0, Wv.y0); g.restore(); return; }
    const tg = Wv.tmp.g;
    tg.globalCompositeOperation = 'source-over'; tg.clearRect(0, 0, Wv.w, Wv.h);
    tg.drawImage(Wv.c, 0, 0);
    tg.globalCompositeOperation = 'destination-in';
    const R0 = Math.hypot(Wv.w, Wv.h) * 0.62 * E.outC(k) + 4;
    tg.fillStyle = 'rgba(0,0,0,0.2)';
    for (let j = 0; j < 5; j++) {
      const r = R0 * (1 - j * 0.07);
      fillPoly(tg, Wv.mask.map(([x, y]) => [Wv.ox + x * r, Wv.oy + y * r]));
      tg.fill();
    }
    g.globalAlpha = alpha * Math.min(1, k * 3);
    g.drawImage(Wv.tmp.c, Wv.x0, Wv.y0);
    g.restore();
  }
  function pencil(g, pts, u, o = {}) {                // graphite line drawn progressively
    if (u <= 0) return;
    const part = SH.partial(pts, u);
    if (part.length < 2) return;
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = rgba(C.graphite, o.a ?? 0.55); g.lineWidth = o.w ?? 2.4;
    g.beginPath(); part.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke();
    g.strokeStyle = rgba(C.graphite, (o.a ?? 0.55) * 0.35); g.lineWidth = 1.2;
    g.beginPath(); part.forEach((p, i) => (i ? g.lineTo(p[0] + 1.1, p[1] - 0.8) : g.moveTo(p[0] + 1.1, p[1] - 0.8))); g.stroke();
    g.restore();
  }
  function arrowHead(g, a, b, k) {
    if (k <= 0) return;
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 22 * k;
    pencil(g, [[b[0] - Math.cos(ang - 0.45) * L, b[1] - Math.sin(ang - 0.45) * L], b, [b[0] - Math.cos(ang + 0.45) * L, b[1] - Math.sin(ang + 0.45) * L]], 1);
  }
  const inkText = col => (g, w, h, bx, by, draw) => {   // ink lettering with pigment specks
    g.fillStyle = col; draw();
    g.globalCompositeOperation = 'source-atop';
    const R = rng(w * 7 + h);
    for (let i = 0; i < (w * h) / 220; i++) { g.fillStyle = `rgba(255,252,240,${(R() * 0.18).toFixed(3)})`; g.fillRect(R() * w, R() * h, 2, 2); }
  };
  const txt = (s, size, wt = 700, col = C.payne) => SH.textSprite(s, size, { fam: 'Fraunces', wt, col, key: 'ink', paint: inkText(col) });

  function label(g, n, s, x, y, k) {                  // numbered pencil label
    if (k <= 0) return;
    const e = E.outC(clamp(k * 1.6));
    const circ = SH.blob(x + 22, y - 16, 25, 25, 300 + n, { wob: 0.05, jit: 0.8, n: 40 });
    pencil(g, circ.concat([circ[0], circ[1]]), e, { w: 2.2 });
    const a = clamp((k - 0.2) * 2.5);
    SH.drawSprite(g, txt(String(n), 34, 700), x + 22, y - 4, { ax: 0.5, alpha: a });
    SH.drawSprite(g, txt(s, 46, 600), x + 60, y, { alpha: a });
  }

  SH.register({
    id: '01', w: 1080, h: 1920, duration: 8, fps: 30, poster: 6.4,
    fonts: ['700 80px "Fraunces"', '600 80px "Fraunces"'],
    init(g, W, H) {
      // cold-press paper: warm white, soft mottling, strong tooth
      const tooth = SH.grain(512, 4401, { fine: 30, mottle: 22, fibres: 380 });
      const bg = SH.canvas(W, H);
      bg.g.fillStyle = C.paper; bg.g.fillRect(0, 0, W, H);
      bg.g.globalCompositeOperation = 'soft-light'; bg.g.globalAlpha = 0.9;
      bg.g.fillStyle = bg.g.createPattern(tooth, 'repeat'); bg.g.fillRect(0, 0, W, H);
      S.bg = bg.c; S.vig = SH.vignette(W, H, 0.16, '60,48,30');
      // washes
      S.swash = wash(SH.blob(330, 296, 250, 58, 11, { wob: 0.12 }), C.cerulean, 12, { alpha: 0.055, ox: 0.05 });
      S.sun = wash(SH.blob(880, 612, 92, 92, 21, { wob: 0.06 }), C.ochre, 22, { alpha: 0.05, tint: C.rose, lift: 1 });
      S.hillL = wash([[-60, 1340], [120, 1240], [300, 1210], [470, 1270], [560, 1390], [-60, 1420]], C.sap, 31, { alpha: 0.042, oy: 0.3, lift: 1 });
      S.hillR = wash([[520, 1380], [700, 1270], [880, 1240], [1140, 1300], [1140, 1430], [520, 1430]], mix(C.sap, C.ochre, 0.25), 32, { alpha: 0.04, oy: 0.3, lift: 1 });
      S.lake = wash(SH.blob(540, 1500, 470, 120, 41, { wob: 0.05 }), C.ultra, 42, { alpha: 0.034, tint: C.cerulean, oy: 0.4, lift: 3, streaks: 7 });
      S.ground = wash([[-80, 1690], [300, 1720], [700, 1700], [1160, 1730], [1160, 2000], [-80, 2000]], C.sienna, 51, { alpha: 0.022, oy: 0.2, lift: 2 });
      S.cloud = wash(SH.blob(470, 800, 300, 120, 61, { bumps: [9, 0.16], wob: 0.06 }), C.cloud, 62, { alpha: 0.04, tint: C.ultra, lift: 2 });
      S.cloudDark = wash(SH.blob(480, 850, 250, 62, 63, { bumps: [7, 0.1], wob: 0.12 }), C.payne, 64, { alpha: 0.026, oy: 0.3 });
      S.vapor = [0, 1, 2].map(i => wash(SH.blob(0, 0, 26, 52, 70 + i, { wob: 0.25 }), C.cerulean, 75 + i, { alpha: 0.05, layers: 14, pad: 40 }));
      S.drop = wash(SH.lobe(70, 18, 80, { a: 1.6, tip: 0.6 }).map(([x, y]) => [x, -y]), C.ultra, 81, { alpha: 0.09, layers: 12, pad: 24, v: 0.12 });
      // pencil underdrawing
      S.pSun = SH.blob(880, 612, 98, 98, 90, { wob: 0.02, jit: 1, n: 70 }); S.pSun.push(S.pSun[0], S.pSun[1]);
      S.pHills = SH.catmullPts([[-20, 1330], [140, 1238], [300, 1214], [470, 1268], [560, 1380], [700, 1276], [880, 1246], [1100, 1300]], 60);
      S.pLake = SH.blob(540, 1500, 478, 126, 91, { wob: 0.02, jit: 1.2, n: 90 }); S.pLake.push(S.pLake[0], S.pLake[1]);
      S.pCloud = SH.blob(470, 800, 312, 132, 92, { bumps: [9, 0.16], wob: 0.04, jit: 1, n: 120 }); S.pCloud.push(S.pCloud[0], S.pCloud[1]);
      S.arrUp = SH.catmullPts([[690, 1380], [726, 1240], [706, 1100], [636, 960]], 30);
      S.arrDown = SH.catmullPts([[250, 930], [215, 1050], [230, 1180], [300, 1380]], 30);
      const R = rng(500);
      S.rain = Array.from({ length: 26 }, (_, i) => ({ x: 340 + R() * 300, t0: 5.25 + (i / 26) * 1.35 + R() * 0.1, d: 0.42 + R() * 0.12 }));
      S.wisps = Array.from({ length: 9 }, (_, i) => ({ x: 430 + R() * 210, t0: 2.5 + i * 0.22 + R() * 0.08, v: i % 3 }));
    },
    frame(g, t, W, H) {
      g.drawImage(S.bg, 0, 0);
      // title: wash swash, then ink lettering
      drawWash(g, S.swash, P(t, 0.12, 0.75));
      const a1 = txt('Yağmur', 150, 700), a2 = txt('nereden gelir?', 90, 600);
      SH.drawSprite(g, a1, 90, 340 + 6 * (1 - E.outC(P(t, 0.2, 0.8))), { alpha: E.outC(P(t, 0.2, 0.8)) });
      SH.drawSprite(g, a2, 94, 452 + 6 * (1 - E.outC(P(t, 0.45, 1.05))), { alpha: E.outC(P(t, 0.45, 1.05)) });
      // underdrawing, then washes bloom into it
      pencil(g, S.pSun, E.ioS(P(t, 0.25, 0.9)), { a: 0.4 });
      pencil(g, S.pHills, E.ioS(P(t, 0.35, 1.2)), { a: 0.45 });
      pencil(g, S.pLake, E.ioS(P(t, 0.5, 1.3)), { a: 0.45 });
      drawWash(g, S.ground, P(t, 1.3, 2.4));
      drawWash(g, S.hillL, P(t, 1.05, 2.1));
      drawWash(g, S.hillR, P(t, 1.25, 2.3));
      drawWash(g, S.lake, P(t, 0.95, 2.0));
      drawWash(g, S.sun, P(t, 0.85, 1.8));
      // 1 · evaporation: vapour rises from the warm lake
      for (const w of S.wisps) {
        const u = P(t, w.t0, w.t0 + 1.6);
        if (u <= 0 || u >= 1) continue;
        const Wv = S.vapor[w.v], sc = 0.6 + u * 1.1, x = w.x + Math.sin(u * 5 + w.v) * 24, y = 1420 - u * 520;
        g.save(); g.translate(x, y); g.scale(sc, sc);
        g.globalCompositeOperation = 'multiply'; g.globalAlpha = bump(u) * 0.9;
        g.drawImage(Wv.c, Wv.x0, Wv.y0);
        g.restore();
      }
      pencil(g, S.arrUp, E.ioS(P(t, 2.7, 3.5)), { w: 2.6 });
      arrowHead(g, S.arrUp[S.arrUp.length - 3], S.arrUp[S.arrUp.length - 1], P(t, 3.4, 3.6));
      label(g, 1, 'Buharlaşma', 744, 1196, P(t, 2.9, 3.6));
      // 2 · the cloud gathers
      pencil(g, S.pCloud, E.ioS(P(t, 3.7, 4.4)), { a: 0.35 });
      drawWash(g, S.cloud, P(t, 3.95, 4.9));
      label(g, 2, 'Bulut', 70, 654, P(t, 4.3, 5.0));
      // 3 · rain falls back into the lake
      for (const d of S.rain) {
        const u = P(t, d.t0, d.t0 + d.d);
        if (u > 0 && u < 1) {
          const x = d.x - u * 60, y = lerp(880, 1430, E.inQ(u));
          g.save(); g.translate(x, y); g.rotate(0.11); g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.9;
          g.drawImage(S.drop.c, S.drop.x0, S.drop.y0); g.restore();
        }
        const r = P(t, d.t0 + d.d, d.t0 + d.d + 0.7);
        if (r > 0 && r < 1) {
          g.save(); g.strokeStyle = rgba(C.graphite, 0.45 * (1 - r)); g.lineWidth = 2;
          g.beginPath(); g.ellipse(d.x - 60, 1440, 14 + r * 46, 4 + r * 11, 0, 0, Math.PI * 2); g.stroke(); g.restore();
        }
      }
      label(g, 3, 'Yağmur', 60, 1150, P(t, 5.6, 6.3));
      // loop: a band of clean water lifts the paint and returns the sheet to blank paper
      const k = P(t, 7.15, 8.0);
      if (k > 0) {
        const x = lerp(-420, W + 420, E.ioC(k));
        const gr = g.createLinearGradient(x - 420, 0, x, 0);
        gr.addColorStop(0, C.paper); gr.addColorStop(0.75, rgba(C.paper, 0.85)); gr.addColorStop(1, rgba(C.paper, 0));
        g.save(); g.fillStyle = gr; g.fillRect(0, 0, x, H);
        g.globalAlpha = 0.9; g.drawImage(S.bg, 0, 0, Math.max(1, x - 380), H, 0, 0, Math.max(1, x - 380), H);
        g.globalCompositeOperation = 'multiply'; g.strokeStyle = rgba(C.cerulean, 0.35 * bump(k)); g.lineWidth = 5;
        g.beginPath();
        for (let yy = 0; yy <= H; yy += 24) g.lineTo(x - 60 + 26 * SH.noise1(7, yy * 0.01) + 10 * SH.noise1(8, yy * 0.05), yy);
        g.stroke(); g.restore();
      }
      g.drawImage(S.vig, 0, 0);
    },
  });
})();
