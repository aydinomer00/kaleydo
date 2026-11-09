'use strict';
/* 23 · Vitray Işığı — a pointed-arch stained-glass window in a stone wall. Coloured glass with streaks, bubbles and
   darker edges, held by dark lead came; light comes on piece by piece, glows, and spills coloured patches on the floor.
   Details are "painted" on the glass; a glass bee moves with its own lead; a lens reveals what a bee sees.
   A cloud shadow passes and the window falls dim again. */
(() => {
  const { E, P, clamp, lerp, rng, mix, darken, rgba } = SH;
  const C = { stone: '#8E857A', stoneD: '#5F574F', mortar: '#4C453F', lead: '#1F1C22', paint: '#3A2A20', gold: '#E8C77A', cream: '#F1E2B8' };
  const S = {};
  const WIN = { x0: 140, x1: 940, spring: 820, bottom: 1520 };
  const SUN = [540, 560], FLOWER = [460, 1010], SMALL = [800, 1185], LENS_R = 205;
  const TAU = Math.PI * 2;

  function archPath() {                                         // pointed (drop) arch
    const span = WIN.x1 - WIN.x0, r = span * 0.62, cl = WIN.x0 + r, cr = WIN.x1 - r, cy = WIN.spring;
    const top = cy - Math.sqrt(r * r - (540 - cr) ** 2), aL = Math.atan2(top - cy, 540 - cl), aR = Math.atan2(top - cy, 540 - cr);
    const pts = [[WIN.x0, WIN.bottom], [WIN.x0, cy]];
    for (let i = 1; i <= 40; i++) { const a = Math.PI + (aL - Math.PI + TAU) % TAU * (i / 40); pts.push([cl + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    for (let i = 1; i <= 40; i++) { const a = aR + (0 - aR) * (i / 40); pts.push([cr + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    pts.push([WIN.x1, WIN.bottom]);
    S.apex = top;
    return pts;
  }
  function clipPoly(poly, a, b, c) {                            // keep a·x + b·y <= c
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const p1 = poly[i], p2 = poly[(i + 1) % poly.length], d1 = a * p1[0] + b * p1[1] - c, d2 = a * p2[0] + b * p2[1] - c;
      if (d1 <= 0) out.push(p1);
      if ((d1 <= 0) !== (d2 <= 0)) { const k = d1 / (d1 - d2); out.push([p1[0] + (p2[0] - p1[0]) * k, p1[1] + (p2[1] - p1[1]) * k]); }
    }
    return out;
  }
  function voronoi(sites, box) {
    return sites.map((s, i) => {
      let poly = [[box[0], box[1]], [box[2], box[1]], [box[2], box[3]], [box[0], box[3]]];
      for (let j = 0; j < sites.length && poly.length >= 3; j++) {
        if (i === j) continue;
        const o = sites[j];
        poly = clipPoly(poly, o[0] - s[0], o[1] - s[1], (o[0] * o[0] + o[1] * o[1] - s[0] * s[0] - s[1] * s[1]) / 2);
      }
      return poly;
    });
  }
  const centroid = pts => { let x = 0, y = 0; for (const p of pts) { x += p[0]; y += p[1]; } return [x / pts.length, y / pts.length]; };
  function glass(g, path, col, seed, lit, o = {}) {             // one pane: colour, streaks, bubbles, darker edges
    const R = rng(seed), base = lit ? col : mix(darken(col, 0.62), '#14141c', 0.25);
    g.save(); g.fillStyle = base; g.fill(path); g.clip(path);
    const [cx, cy] = o.c || [0, 0], rr = o.r || 120;
    if (lit) {
      const gr = g.createRadialGradient(cx - rr * 0.2, cy - rr * 0.25, 0, cx, cy, rr * 1.3);
      gr.addColorStop(0, 'rgba(255,255,255,0.28)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(cx - rr * 2, cy - rr * 2, rr * 4, rr * 4);
      const a = R() * Math.PI; g.strokeStyle = 'rgba(255,255,255,0.09)';
      for (let k = -6; k <= 6; k++) { g.lineWidth = 2 + R() * 6; g.beginPath(); g.moveTo(cx + Math.cos(a) * -400 + Math.cos(a + 1.57) * k * 18, cy + Math.sin(a) * -400 + Math.sin(a + 1.57) * k * 18); g.lineTo(cx + Math.cos(a) * 400 + Math.cos(a + 1.57) * k * 18, cy + Math.sin(a) * 400 + Math.sin(a + 1.57) * k * 18); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,0.4)'; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(cx + (R() - 0.5) * rr, cy + (R() - 0.5) * rr, 1.5 + R() * 2.5, 0, TAU); g.fill(); }
    }
    g.filter = 'blur(6px)'; g.strokeStyle = lit ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.35)'; g.lineWidth = 16; g.stroke(path); g.filter = 'none';
    g.restore();
  }
  function lead(g, path, w = 11) {                              // came: dark core + a soft highlight
    g.save(); g.lineJoin = 'round'; g.lineCap = 'round';
    g.strokeStyle = C.lead; g.lineWidth = w; g.stroke(path);
    g.strokeStyle = 'rgba(150,145,160,0.35)'; g.lineWidth = w * 0.22; g.translate(-w * 0.18, -w * 0.18); g.stroke(path);
    g.restore();
  }
  const ellipsePts = (cx, cy, rx, ry, rot, n = 36) => Array.from({ length: n }, (_, i) => { const a = (i / n) * TAU, x = Math.cos(a) * rx, y = Math.sin(a) * ry; return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]; });
  const lobeAt = (x, y, len, wid, rot, seed) => SH.tfPts(SH.lobe(len, wid, seed, { a: 0.7, tip: 0.7, jit: 0 }), x, y, 1, rot);

  // the window's designed pieces (drawn over the background quarries)
  function design() {
    const P_ = [];
    const add = (pts, col, o = {}) => P_.push({ pts, col, ...o });
    // sun: rays then disc
    for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU - Math.PI / 2, a1 = a - 0.16, a2 = a + 0.16; add([[SUN[0] + Math.cos(a1) * 92, SUN[1] + Math.sin(a1) * 92], [SUN[0] + Math.cos(a) * 168, SUN[1] + Math.sin(a) * 168], [SUN[0] + Math.cos(a2) * 92, SUN[1] + Math.sin(a2) * 92]], k % 2 ? '#F2A33D' : '#F7D46A', { sun: true }); }
    add(ellipsePts(SUN[0], SUN[1], 86, 86, 0, 40), '#F9C843', { sun: true });
    // stems and leaves
    add(SH.strip(SH.thruPts([FLOWER[0], FLOWER[1] + 60], [FLOWER[0] + 30, 1300], [FLOWER[0] + 10, WIN.bottom + 20], 16), 24, 30, 2301), '#2F8F4E');
    add(lobeAt(FLOWER[0] + 22, 1300, 190, 76, -1.0, 2302), '#3FA34D', { vein: true });
    add(lobeAt(FLOWER[0] + 24, 1380, 170, 70, 1.05, 2303), '#2E8B57', { vein: true });
    add(SH.strip(SH.thruPts([SMALL[0], SMALL[1] + 40], [SMALL[0] - 20, 1360], [SMALL[0] - 6, WIN.bottom + 20], 14), 18, 22, 2304), '#2F8F4E');
    add(lobeAt(SMALL[0] - 14, 1390, 130, 52, 1.1, 2305), '#3FA34D', { vein: true });
    // big flower: six petals and a centre
    S.bigPetals = [];
    for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; const pts = lobeAt(FLOWER[0], FLOWER[1], 168, 112, a, 2310 + k); S.bigPetals.push(pts); add(pts, k % 2 ? '#D2245B' : '#E2416E', { vein: true, petal: true }); }
    add(ellipsePts(FLOWER[0], FLOWER[1], 50, 50, 0, 30), '#F6B53C', { dots: true });
    // small flower
    for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU + 0.3; add(lobeAt(SMALL[0], SMALL[1], 104, 70, a, 2320 + k), k % 2 ? '#7B3FB5' : '#9156C9', { vein: true }); }
    add(ellipsePts(SMALL[0], SMALL[1], 30, 30, 0, 24), '#F6B53C', { dots: true });
    // the banner ribbon for the painted words
    add([[150, 1406], [196, 1380], [196, 1476], [150, 1452], [172, 1429]], '#D9C38E');
    add([[930, 1406], [884, 1380], [884, 1476], [930, 1452], [908, 1429]], '#D9C38E');
    add([[188, 1380], [892, 1380], [892, 1476], [188, 1476]], C.cream, { banner: true });
    return P_;
  }

  // the bee: separate panes with their own lead (local coordinates, facing left)
  function bee(g, x, y, t, scale = 1, pollen = 0) {
    g.save(); g.translate(x, y); g.scale(scale, scale);
    const flap = Math.floor(t * 14) % 2 ? -0.25 : 0.2;
    for (const [wx, wy, rx, ry, rot] of [[8, -40, 36, 21, -0.5], [34, -36, 30, 18, -0.2]]) {
      g.save(); g.translate(wx - 6, wy + 22); g.rotate(flap); g.translate(-(wx - 6), -(wy + 22));
      const p = SH.pathFrom(ellipsePts(wx, wy, rx, ry, rot, 30));
      g.fillStyle = 'rgba(214,236,247,0.88)'; g.fill(p); lead(g, p, 7); g.restore();
    }
    const body = new Path2D(); body.ellipse(20, 0, 54, 33, 0, 0, TAU);
    const bands = [[-34, -10, '#F2C230'], [-10, 10, '#2A2430'], [10, 30, '#F2C230'], [30, 50, '#2A2430'], [50, 80, '#F2C230']];
    for (const [a, b2, col] of bands) { g.save(); g.clip(body); g.fillStyle = col; g.fillRect(a, -40, b2 - a, 80); g.restore(); }
    g.save(); g.clip(body); g.strokeStyle = C.lead; g.lineWidth = 6; for (const xx of [-10, 10, 30, 50]) { g.beginPath(); g.moveTo(xx, -40); g.lineTo(xx, 40); g.stroke(); } g.restore();
    lead(g, body, 8);
    g.fillStyle = C.lead; g.beginPath(); g.moveTo(72, -6); g.lineTo(90, 0); g.lineTo(72, 6); g.fill();
    const head = new Path2D(); head.arc(-44, 4, 23, 0, TAU);
    g.fillStyle = '#2A2430'; g.fill(head); lead(g, head, 7);
    g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.arc(-52, -2, 5, 0, TAU); g.fill();
    g.strokeStyle = C.lead; g.lineWidth = 4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-54, -14); g.quadraticCurveTo(-66, -40, -80, -44); g.moveTo(-44, -16); g.quadraticCurveTo(-50, -42, -60, -50); g.stroke();
    for (const lx of [-14, 6, 26]) { g.beginPath(); g.moveTo(lx, 28); g.lineTo(lx - 8, 48); g.stroke(); if (pollen > 0) { g.fillStyle = `rgba(250,200,40,${pollen})`; g.beginPath(); g.arc(lx - 8, 50, 7, 0, TAU); g.fill(); } }
    g.restore();
  }

  SH.register({
    id: '23', w: 1080, h: 1920, duration: 8, fps: 30, poster: 6.5,
    fonts: ['700 80px "Philosopher"'],
    init(g, W, H) {
      const R = rng(2330);
      // ---- stone wall with a deep window recess, a sill and the gilded title
      const wall = SH.canvas(W, H), w = wall.g;
      w.fillStyle = C.stone; w.fillRect(0, 0, W, H);
      for (let row = 0, y = 0; y < H; row++, y += 96) for (let x = -(row % 2) * 70; x < W; x += 140 + Math.round(R() * 20)) {
        const p = SH.pathFrom(SH.rrect(x + 3, y + 3, 134, 90, 6, row * 31 + x, { jit: 0.8 }));
        w.fillStyle = mix(C.stone, R() < 0.5 ? '#A39A8E' : '#7D756A', R() * 0.6); w.fill(p);
      }
      w.globalCompositeOperation = 'soft-light'; w.globalAlpha = 0.8; w.fillStyle = w.createPattern(SH.grain(512, 2331, { fibres: 0, fine: 30, mottle: 40, cell: 24 }), 'repeat'); w.fillRect(0, 0, W, H);
      w.globalCompositeOperation = 'source-over'; w.globalAlpha = 1;
      S.arch = archPath(); S.archPath = SH.pathFrom(S.arch);
      const recess = SH.pathFrom(SH.tfPts(S.arch.map(([x, y]) => [x - 540, y - 1000]), 540, 1000, 1.075, 0));
      w.save(); w.shadowColor = 'rgba(0,0,0,0.5)'; w.shadowBlur = 30; w.fillStyle = C.stoneD; w.fill(recess); w.restore();
      w.fillStyle = '#6D655C'; w.fillRect(100, WIN.bottom + 6, 880, 46); w.fillStyle = 'rgba(255,255,255,0.18)'; w.fillRect(100, WIN.bottom + 6, 880, 6);
      w.drawImage(SH.vignette(W, H, 0.45, '20,16,12', 0.5, 0.45), 0, 0);
      const title = (s, y) => { const sp = SH.textSprite(s, 92, { fam: 'Philosopher', wt: 700, col: C.gold, key: 'gild', paint: (q, ww, hh, bx, by, draw) => { q.save(); q.fillStyle = 'rgba(30,20,10,0.6)'; q.translate(3, 4); draw(); q.restore(); const gr2 = q.createLinearGradient(0, by - 70, 0, by + 10); gr2.addColorStop(0, '#F7E3A8'); gr2.addColorStop(0.5, C.gold); gr2.addColorStop(1, '#B8893C'); q.fillStyle = gr2; draw(); } }); SH.drawSprite(w, sp, 540, y, { ax: 0.5 }); };
      title('Çiçekler', 170); title('neden renkli?', 270);
      S.wall = wall.c;
      // ---- glass: background quarries (Voronoi) + designed pieces
      const sites = [];
      for (let tries = 0; tries < 6000 && sites.length < 120; tries++) {
        const x = WIN.x0 + R() * (WIN.x1 - WIN.x0), y = S.apex + R() * (WIN.bottom - S.apex);
        if (sites.every(s => Math.hypot(s[0] - x, s[1] - y) > 96)) sites.push([x, y]);
      }
      const cells = voronoi(sites, [WIN.x0 - 40, S.apex - 40, WIN.x1 + 40, WIN.bottom + 40]).filter(c => c.length >= 3);
      S.pieces = cells.map((pts, i) => {
        const [cx, cy] = centroid(pts), dSun = Math.hypot(cx - SUN[0], cy - SUN[1]);
        const pal = cy > 1230 ? ['#2E8B57', '#3FA34D', '#1F6F45', '#5CB35C'] : dSun < 330 ? ['#F2C14E', '#E8A33D', '#F7D774', '#5AA0D8'] : ['#2F6DB5', '#3B82C4', '#5AA0D8', '#1F4F8F', '#79B4E3'];
        return { pts, col: pal[Math.floor(R() * pal.length)], c: [cx, cy], seed: 2340 + i };
      });
      S.design = design().map((p, i) => ({ ...p, c: centroid(p.pts), seed: 2400 + i }));
      const all = [...S.pieces, ...S.design];
      for (const p of all) { p.path = SH.pathFrom(p.pts); p.d = clamp(Math.hypot(p.c[0] - SUN[0], p.c[1] - SUN[1]) / 1050); p.xn = clamp((p.c[0] - WIN.x0) / (WIN.x1 - WIN.x0)) + (SH.h01(2350, p.seed) - 0.5) * 0.12; }
      S.all = all;
      const mk = lit => {
        const { c, g: q } = SH.canvas(W, H);
        q.save(); q.clip(S.archPath);
        for (const p of all) {
          glass(q, p.path, p.col, p.seed, lit, { c: p.c, r: 110 });
          if (p.vein) { q.save(); q.clip(p.path); q.strokeStyle = rgba(C.paint, lit ? 0.45 : 0.3); q.lineWidth = 3; q.beginPath(); const a = p.pts[0], b2 = p.pts[Math.floor(p.pts.length / 2)]; q.moveTo(a[0], a[1]); q.quadraticCurveTo(p.c[0] + 6, p.c[1] - 6, b2[0], b2[1]); q.stroke(); q.restore(); }
          if (p.dots) { q.fillStyle = rgba('#7A3E10', 0.55); for (let k = 0; k < 9; k++) { const a = k * 2.4, rr = 8 + (k % 3) * 9; q.beginPath(); q.arc(p.c[0] + Math.cos(a) * rr, p.c[1] + Math.sin(a) * rr, 3.5, 0, TAU); q.fill(); } }
        }
        q.restore();
        return c;
      };
      S.lit = mk(true); S.dim = mk(false);
      const ld = SH.canvas(W, H), l = ld.g;
      l.save(); l.clip(S.archPath);
      for (const p of S.pieces) lead(l, p.path, 11);
      for (const p of S.design) { l.save(); l.globalCompositeOperation = 'destination-out'; l.fill(p.path); l.restore(); lead(l, p.path, p.banner ? 9 : 11); }   // quarry lead never crosses a figure
      l.restore();
      lead(l, S.archPath, 24);
      S.lead = ld.c;
      // a bee's-eye version of the big flower: violet petals with dark nectar guides and a bullseye
      const uv = SH.canvas(W, H), u = uv.g;
      for (const pts of S.bigPetals) {
        const pth = SH.pathFrom(pts), c0 = centroid(pts);
        glass(u, pth, '#7357D6', 2390, true, { c: c0, r: 90 });
        u.save(); u.clip(pth); u.strokeStyle = 'rgba(30,14,70,0.75)'; u.lineCap = 'round';
        for (let k = -2; k <= 2; k++) { const tip = pts[Math.floor(pts.length / 2)], a = Math.atan2(tip[1] - FLOWER[1], tip[0] - FLOWER[0]) + k * 0.13; u.lineWidth = 7; u.beginPath(); u.moveTo(FLOWER[0], FLOWER[1]); u.lineTo(FLOWER[0] + Math.cos(a) * 120, FLOWER[1] + Math.sin(a) * 120); u.stroke(); }
        u.restore(); lead(u, pth, 11);
      }
      const bull = SH.pathFrom(ellipsePts(FLOWER[0], FLOWER[1], 92, 92, 0, 40)); u.save(); u.globalCompositeOperation = 'multiply'; u.fillStyle = 'rgba(60,30,120,0.55)'; u.fill(bull); u.restore();
      const cen = SH.pathFrom(ellipsePts(FLOWER[0], FLOWER[1], 50, 50, 0, 30)); glass(u, cen, '#2B1B5E', 2391, true, { c: FLOWER, r: 50 }); lead(u, cen, 11);
      S.uv = uv.c;
      S.layer = SH.canvas(W, H); S.mask = SH.canvas(W, H);
      S.words = ['Renkler arıları çağırır', 'Arılar gizli desenleri görür', 'Polen taşınır, tohum oluşur'].map(s => SH.textSprite(s, 50, { fam: 'Philosopher', wt: 700, col: C.paint }));
      S.beePath1 = SH.catmullPts([[990, 640], [840, 720], [700, 840], [630, 880]], 40);
    },
    frame(g, t, W, H) {
      g.drawImage(S.wall, 0, 0);
      // per-pane light: on in rings from the sun, off as a cloud shadow passes left to right
      const M = S.mask.g;
      M.setTransform(1, 0, 0, 1, 0, 0); M.globalCompositeOperation = 'source-over'; M.clearRect(0, 0, W, H);
      let sum = 0;
      for (const p of S.all) {
        const on = E.ioS(P(t, 0.2 + 1.25 * p.d, 0.55 + 1.25 * p.d)), off = E.ioS(P(t, 6.8 + 0.75 * p.xn, 7.1 + 0.75 * p.xn)), L = clamp(on - off);
        sum += L;
        if (L > 0) { M.fillStyle = `rgba(0,0,0,${L.toFixed(3)})`; M.fill(p.path); M.lineWidth = 12; M.strokeStyle = M.fillStyle; M.stroke(p.path); }
      }
      const avg = sum / S.all.length;
      const Lg = S.layer.g;
      Lg.setTransform(1, 0, 0, 1, 0, 0); Lg.globalCompositeOperation = 'source-over'; Lg.globalAlpha = 1; Lg.clearRect(0, 0, W, H);
      Lg.drawImage(S.lit, 0, 0);
      // a bee's-eye lens over the big flower
      const kl = E.outBack(P(t, 3.3, 3.65), 1.4) * (1 - E.inQ(P(t, 4.5, 4.75)));
      if (kl > 0) { Lg.save(); Lg.beginPath(); Lg.arc(FLOWER[0], FLOWER[1], LENS_R * kl, 0, TAU); Lg.clip(); Lg.drawImage(S.uv, 0, 0); Lg.restore(); }
      Lg.globalCompositeOperation = 'destination-in'; Lg.drawImage(S.mask.c, 0, 0); Lg.globalCompositeOperation = 'source-over';
      g.drawImage(S.dim, 0, 0);
      g.drawImage(S.layer.c, 0, 0);
      // the painted words on the banner
      const words = [[1.7, 3.2], [3.45, 4.75], [5.0, 6.95]];
      words.forEach(([a, b], i) => { const k = P(t, a, a + 0.3) * (1 - P(t, b, b + 0.25)); if (k > 0) SH.drawSprite(g, S.words[i], 540, 1446, { ax: 0.5, alpha: k * clamp(avg * 1.4) }); });
      // the glass bee
      const bp = beeAt(t);
      if (bp) { g.save(); g.clip(S.archPath); bee(g, bp[0], bp[1], t, 1.05, P(t, 4.95, 5.15)); g.restore(); }
      g.drawImage(S.lead, 0, 0);
      if (kl > 0) { g.save(); g.lineWidth = 16; g.strokeStyle = C.lead; g.beginPath(); g.arc(FLOWER[0], FLOWER[1], LENS_R * kl, 0, TAU); g.stroke(); g.strokeStyle = 'rgba(200,190,255,0.5)'; g.lineWidth = 3; g.beginPath(); g.arc(FLOWER[0], FLOWER[1], LENS_R * kl - 9, 0, TAU); g.stroke(); g.restore(); }
      // cloud shadow passing over the window
      const kc = P(t, 6.7, 7.75);
      if (kc > 0 && kc < 1) {
        const x = lerp(-400, 1500, E.ioS(kc)), gr = g.createLinearGradient(x - 380, 0, x + 380, 0);
        gr.addColorStop(0, 'rgba(10,12,30,0)'); gr.addColorStop(0.5, 'rgba(10,12,30,0.4)'); gr.addColorStop(1, 'rgba(10,12,30,0)');
        g.save(); g.clip(S.archPath); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
      }
      // glow spilling from the lit glass, and coloured light on the floor below the sill
      if (avg > 0.01) {
        g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.28 * avg; g.filter = 'blur(18px)'; g.drawImage(S.layer.c, 0, 0); g.restore();
        g.save(); g.beginPath(); g.rect(0, WIN.bottom + 52, W, H); g.clip();
        g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.55 * avg; g.filter = 'blur(14px)';
        g.setTransform(1, 0, -0.35, 0.28, 330, WIN.bottom + 52 - 0.28 * S.apex + 40); g.drawImage(S.layer.c, 0, 0);
        g.restore();
      }
    },
  });

  function beeAt(t) {
    if (t < 1.8 || t > 6.75) return null;
    if (t < 3.0) { const p = SH.catmull(S.beePath1, E.outQ(P(t, 1.8, 3.0))); return [p[0], p[1] + 6 * Math.sin(t * 9)]; }
    if (t < 4.6) { const u = (t - 3.0) * 2.4; return [630 + 26 * Math.sin(u), 880 + 14 * Math.sin(2 * u)]; }
    const land1 = [FLOWER[0] + 14, FLOWER[1] - 34], land2 = [SMALL[0] + 10, SMALL[1] - 30];
    if (t < 5.0) { const k = E.ioS(P(t, 4.6, 5.0)), a = [630 + 26 * Math.sin(3.84), 880 + 14 * Math.sin(7.68)]; return [lerp(a[0], land1[0], k), lerp(a[1], land1[1], k) - 30 * Math.sin(Math.PI * k)]; }
    if (t < 5.25) return land1;
    if (t < 5.9) { const k = E.ioS(P(t, 5.25, 5.9)); return [lerp(land1[0], land2[0], k), lerp(land1[1], land2[1], k) - 90 * Math.sin(Math.PI * k)]; }
    if (t < 6.3) return land2;
    const k = E.inQ(P(t, 6.3, 6.75));
    return [lerp(land2[0], -120, k), lerp(land2[1], 520, k)];
  }
})();
