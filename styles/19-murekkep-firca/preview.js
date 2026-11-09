'use strict';
/* 19 · Mürekkep Fırça — an ink-wash brush painting on fibrous paper: dry-brush bamboo culms painted segment by
   segment, flicked leaves, a cut-away of the underground stem, a young shoot that telescopes upward, a red seal.
   Everything is ink on paper (multiply); a water bloom spreads from the centre and dissolves the painting. */
(() => {
  const { E, P, clamp, lerp, rng, rgba } = SH;
  const C = { paper: '#F2EDE1', ink: '#1C1B1A', earth: '#9A8468', red: '#C23A2B' };
  const S = {};
  const GROUND = 1380, RHIZ = 1470;
  const CULMS = [                                             // x, width, ink strength, segment lengths (bottom up), start time, step
    { x: 400, w: 34, a: 0.45, lean: -2.6, segs: [90, 120, 125, 130, 130, 125, 120], t0: 1.25, dt: 0.12, seed: 1910 },
    { x: 170, w: 44, a: 0.86, lean: 3.4, segs: [90, 125, 130, 135, 135, 130, 125, 120], t0: 0.8, dt: 0.14, seed: 1920 },
  ];
  const SHOOT = { x: 600, segs: [90, 120, 140, 150, 150, 140], w0: 40 };
  const CLUSTERS = [                                          // culm index, node index, twig end, leaf angles (0 = up), lengths, start
    { c: 0, n: 6, end: [330, 690], ang: [-1.0, -1.35, -1.7, -2.05], len: [170, 185, 160, 140], t0: 2.0 },
    { c: 1, n: 4, end: [322, 944], ang: [1.75, 2.1, 2.45, 1.4], len: [185, 160, 140, 165], t0: 2.15 },
    { c: 1, n: 6, end: [300, 664], ang: [1.2, 1.55, 1.9], len: [175, 200, 160], t0: 2.4 },
    { c: 1, n: 8, end: [182, 486], ang: [1.3, 1.65], len: [150, 130], t0: 2.6 },
  ];

  const nodesOf = (segs, base = RHIZ) => { const ys = [base]; for (const L of segs) ys.push(ys[ys.length - 1] - L); return ys; };
  function bristle(w, h, a, seed, dry = 0.5) {               // one dry-brush stroke, painted bottom to top
    const pad = 4, { c, g } = SH.canvas(w + pad * 2, h + pad * 2), R = rng(seed), nb = Math.max(8, Math.round(w / 2.1));
    g.lineCap = 'round';
    const base = g.createLinearGradient(pad, 0, pad + w, 0);
    base.addColorStop(0, rgba(C.ink, a * 0.3)); base.addColorStop(0.5, rgba(C.ink, a * 0.22)); base.addColorStop(1, rgba(C.ink, a * 0.42));
    g.fillStyle = base; g.fillRect(pad + 1, pad + h * 0.04, w - 2, h * 0.96);
    for (let i = 0; i < nb; i++) {
      const u = (i + 0.5) / nb, edge = Math.abs(u - 0.5) * 2, x = pad + u * w + (R() - 0.5) * 1.2;
      const al = a * (0.5 + 0.5 * R()) * (0.65 + 0.35 * u) * (1 - 0.3 * edge);   // darker on the loaded side of the brush
      g.strokeStyle = rgba(C.ink, al); g.lineWidth = (w / nb) * (1.2 + R() * 0.7);
      let y = pad + h;
      const yEnd = pad + R() * h * 0.12 * edge * dry;
      while (y > yEnd) {
        const seg = 40 + R() * 140, y2 = Math.max(yEnd, y - seg);
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * 1.5, y2); g.stroke();
        y = y2 - (R() < 0.03 + 0.5 * edge * edge * dry + (y2 < pad + h * 0.25 ? 0.25 * dry : 0) ? 3 + R() * 16 : 0);   // flying white, mostly at the edges and the end
      }
    }
    const gr = g.createLinearGradient(0, pad + h, 0, pad + h - 16);            // pressure at the start of the stroke
    gr.addColorStop(0, rgba(C.ink, a * 0.35)); gr.addColorStop(1, rgba(C.ink, 0));
    g.fillStyle = gr; g.fillRect(0, pad + h - 16, w + pad * 2, 16);
    g.globalCompositeOperation = 'destination-in'; g.fillStyle = '#000';      // internode slightly waisted, flared at the ends
    const m = new Path2D(), s = Math.min(3.5, w * 0.08);
    m.moveTo(pad, pad); m.quadraticCurveTo(pad + s, pad + h / 2, pad, pad + h); m.lineTo(pad + w, pad + h); m.quadraticCurveTo(pad + w - s, pad + h / 2, pad + w, pad); m.closePath();
    g.fill(m);
    return c;
  }
  function leafCanvas(len, wid, a, seed) {                    // a flicked leaf: base at the bottom centre
    const { c, g } = SH.canvas(wid + 10, len + 10), R = rng(seed);
    g.translate(wid / 2 + 5, len + 5);
    const p = SH.pathFrom(SH.lobe(len, wid, seed, { a: 0.62, tip: 1.05, jit: 0.4 }));
    const gr = g.createLinearGradient(0, 0, 0, -len); gr.addColorStop(0, rgba(C.ink, a)); gr.addColorStop(0.55, rgba(C.ink, a * 0.85)); gr.addColorStop(1, rgba(C.ink, a * 0.7));
    g.fillStyle = gr; g.fill(p);
    g.save(); g.clip(p); g.globalCompositeOperation = 'destination-out'; g.lineCap = 'round';
    for (let k = 0; k < 3; k++) { const x = (R() - 0.5) * wid * 0.5, y0 = -len * (0.15 + R() * 0.3); g.strokeStyle = `rgba(0,0,0,${0.25 + R() * 0.3})`; g.lineWidth = 1 + R() * 1.6; g.beginPath(); g.moveTo(x, y0); g.lineTo(x * 0.3, y0 - len * (0.3 + R() * 0.3)); g.stroke(); }
    g.restore();
    return c;
  }
  function nodeMark(g, x, y, w, a, seed) {                    // the dark joint: a short swelling stroke wider than the culm
    const spine = SH.thruPts([x - w / 2 - 6, y + 2], [x, y - 3 + SH.h01(seed, 1) * 3], [x + w / 2 + 6, y + 1], 10);
    g.fillStyle = rgba(C.ink, Math.min(1, a * 1.15)); g.fill(SH.pathFrom(SH.strip(spine, 2, 2, seed, { profile: u => 1.5 + 6 * Math.sin(Math.PI * u), wob: 0.2 })));
  }
  function inkText(s, size, wt = 600, col = C.ink) {
    return SH.textSprite(s, size, { fam: 'Spectral', wt, col, key: 'ink', paint: (q, w, h, bx, by, draw) => { q.save(); q.shadowColor = rgba(col, 0.35); q.shadowBlur = 3; q.fillStyle = col; draw(); q.restore(); q.fillStyle = col; draw(); } });
  }
  function brushText(g, sp, x, y, u) {                        // ink soaks in left to right with a soft front
    u = clamp(u);
    if (u <= 0) return;
    if (u >= 1) { g.drawImage(sp.c, x - sp.bx, y - sp.by); return; }
    const q = S.tmp.g;
    q.setTransform(1, 0, 0, 1, 0, 0); q.globalCompositeOperation = 'source-over'; q.clearRect(0, 0, sp.w, sp.h);
    q.drawImage(sp.c, 0, 0);
    const e = sp.bx + (sp.width + 120) * u - 60, gr = q.createLinearGradient(e - 50, 0, e + 50, 0);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    q.globalCompositeOperation = 'destination-in'; q.fillStyle = gr; q.fillRect(0, 0, sp.w, sp.h);
    g.drawImage(S.tmp.c, 0, 0, sp.w, sp.h, x - sp.bx, y - sp.by, sp.w, sp.h);
  }
  function sealCanvas() {                                     // a red seal with a carved bamboo
    const N = 92, { c, g } = SH.canvas(N, N), R = rng(1990);
    g.fillStyle = C.red; g.fill(SH.pathFrom(SH.rrect(2, 2, N - 4, N - 4, 7, 1991, { jit: 0.6 })));
    g.globalCompositeOperation = 'destination-out';
    g.lineWidth = 4; g.strokeStyle = '#000'; g.strokeRect(10, 10, N - 20, N - 20);
    g.fillStyle = '#000';
    g.fillRect(40, 20, 9, 54);
    for (const y of [38, 56]) g.fillRect(36, y, 17, 3.5);
    for (const [x, y, a] of [[50, 30, 1.1], [52, 50, 1.45], [38, 44, -1.2]]) { g.save(); g.translate(x, y); g.rotate(a); g.fill(SH.pathFrom(SH.lobe(24, 8, 1992, { jit: 0.2 }))); g.restore(); }
    for (let i = 0; i < 260; i++) { g.globalAlpha = 0.25 + R() * 0.6; g.beginPath(); g.arc(R() * N, R() * N, 0.5 + R() * 1.4, 0, 6.283); g.fill(); }
    return c;
  }

  SH.register({
    id: '19', w: 1080, h: 1920, duration: 8, fps: 30, poster: 6.55,
    fonts: ['600 80px "Spectral"', '400 80px "Spectral"'],
    init(g, W, H) {
      const pp = SH.canvas(W, H), b = pp.g;
      b.fillStyle = C.paper; b.fillRect(0, 0, W, H);
      b.globalCompositeOperation = 'soft-light'; b.globalAlpha = 0.75;
      b.fillStyle = b.createPattern(SH.grain(512, 1901, { fibres: 1800, fibreLen: 12, fibreVar: 46, fine: 8, mottle: 20 }), 'repeat'); b.fillRect(0, 0, W, H);
      b.globalCompositeOperation = 'source-over'; b.globalAlpha = 1;
      b.drawImage(SH.vignette(W, H, 0.12, '70,60,45'), 0, 0);
      S.paper = pp.c;
      S.P = SH.canvas(W, H); S.tmp = SH.canvas(1100, 260);
      // wet washes: mist behind the grove, earth in the cut-away
      const mist = SH.canvas(W, H), m = mist.g;
      m.filter = 'blur(46px)';
      for (const [x, y, rx, ry, a] of [[300, 820, 330, 300, 0.12], [520, 560, 260, 160, 0.08], [760, 1180, 300, 170, 0.06]]) { m.fillStyle = `rgba(90,98,104,${a})`; m.beginPath(); m.ellipse(x, y, rx, ry, 0, 0, 6.283); m.fill(); }
      m.filter = 'none';
      S.mist = mist.c;
      const earth = SH.canvas(W, H), e = earth.g;
      e.filter = 'blur(10px)'; e.fillStyle = rgba(C.earth, 0.16);
      e.fill(SH.pathFrom([[-30, GROUND + 6], ...Array.from({ length: 24 }, (_, i) => [-30 + i * 50, GROUND + 4 + SH.noise1(1902, i * 0.5) * 6]), [1110, 1600], ...Array.from({ length: 24 }, (_, i) => [1110 - i * 50, 1596 + SH.noise1(1903, i * 0.6) * 18])]));
      e.filter = 'none';
      S.earth = earth.c;
      S.ground = bristle(14, 1000, 0.5, 1904, 1.2);
      // culms, leaves, twigs
      CULMS.forEach(cu => { cu.ys = nodesOf(cu.segs); cu.xs = cu.ys.map((_, k) => cu.x + k * cu.lean); cu.img = cu.segs.map((L, k) => bristle(cu.w - k * 0.8, L - 6, cu.a, cu.seed + k, 0.8)); });
      CLUSTERS.forEach((cl, i) => {
        const cu = CULMS[cl.c], ny = cu.ys[cl.n], tone = cu.a;
        const nx = cu.xs[cl.n]; cl.from = [nx + (cl.end[0] > nx ? cu.w * 0.45 : -cu.w * 0.45), ny - 4];
        cl.twig = SH.strip(SH.thruPts(cl.from, [lerp(cl.from[0], cl.end[0], 0.5), lerp(cl.from[1], cl.end[1], 0.5) - 14], cl.end, 14), 6, 2.4, 1930 + i, { wob: 0.15 });
        cl.leaves = cl.ang.map((a, j) => ({ a, cv: leafCanvas(cl.len[j], 26 + (j % 2) * 6, Math.min(0.95, tone * 1.08) * (0.9 + 0.1 * (j % 2)), 1940 + i * 10 + j) }));
      });
      S.shootImg = SHOOT.segs.map((L, k) => bristle(SHOOT.w0 - k * 3, 160, 0.5, 1960 + k, 0.5));
      S.sheath = SH.lobe(70, 22, 1970, { a: 0.7, tip: 1.2, jit: 0.3 });
      S.tip = SH.lobe(76, 34, 1971, { a: 0.85, tip: 1.1, jit: 0.3 });
      // underground stem: segments lying sideways, joints, fine roots
      S.rhizX = [90, 170, 285, 400, 500, 600, 662];
      S.rhizImg = S.rhizX.slice(1).map((x, k) => bristle(26, x - S.rhizX[k] + 2, 0.6, 1975 + k, 0.4));
      const R = rng(1980);
      S.roots = [];
      for (const x of S.rhizX) for (let k = 0; k < 3; k++) { const a = Math.PI / 2 + (R() - 0.5) * 1.3, L = 40 + R() * 60; S.roots.push(SH.thruPts([x, RHIZ + 10], [x + Math.cos(a) * L * 0.5 + (R() - 0.5) * 16, RHIZ + 10 + Math.sin(a) * L * 0.5], [x + Math.cos(a) * L, RHIZ + 10 + Math.sin(a) * L], 10)); }
      // text and seal
      S.t1 = inkText('Bambu nasıl bu kadar', 64); S.t2 = inkText('hızlı büyür?', 104);
      S.l1 = inkText('her boğum', 46, 400); S.l2 = inkText('aynı anda uzar', 46, 400);
      S.l3 = inkText('yer altı gövdesi', 44, 400); S.l4 = inkText('besin taşır', 44, 400);
      S.s1 = inkText('En hızlı büyüyen', 70, 600, C.red); S.s2 = inkText('bitkilerden biri!', 70, 600, C.red);
      S.seal = sealCanvas();
    },
    frame(g, t, W, H) {
      const L = S.P.g;
      L.setTransform(1, 0, 0, 1, 0, 0); L.globalAlpha = 1; L.globalCompositeOperation = 'source-over'; L.filter = 'none';
      L.clearRect(0, 0, W, H);
      paint(L, t, W);
      g.drawImage(S.paper, 0, 0);
      const k = P(t, 6.75, 7.95);
      g.save(); g.globalCompositeOperation = 'multiply';
      if (k <= 0) g.drawImage(S.P.c, 0, 0);
      else if (k < 1) {                                       // water bloom: inside it the ink loosens, spreads and fades
        const r = E.ioC(k) * 1500, blob = SH.pathFrom(SH.blob(560, 1000, r, r * 1.05, 1995, { wob: 0.16, n: 96, freq: 7 }));
        const out = new Path2D(); out.rect(0, 0, W, H); out.addPath(blob);
        g.save(); g.clip(out, 'evenodd'); g.drawImage(S.P.c, 0, 0); g.restore();
        g.save(); g.clip(blob);
        g.fillStyle = `rgba(120,110,95,${(0.06 * (1 - k)).toFixed(3)})`; g.fillRect(0, 0, W, H);
        g.filter = `blur(${(3 + 22 * k).toFixed(1)}px)`; g.globalAlpha = Math.pow(1 - k, 1.25); g.drawImage(S.P.c, 0, 0);
        g.restore();
        g.globalCompositeOperation = 'source-over';
        g.strokeStyle = `rgba(80,70,58,${(0.2 * (1 - k)).toFixed(3)})`; g.lineWidth = 5; g.filter = 'blur(2px)'; g.stroke(blob); g.filter = 'none';   // tide line
      }
      g.restore();
    },
  });

  function paint(g, t, W) {
    g.globalAlpha = clamp(P(t, 0.1, 0.7)); g.drawImage(S.mist, 0, 0); g.globalAlpha = 1;
    g.globalAlpha = clamp(P(t, 2.8, 3.2)); g.drawImage(S.earth, 0, 0); g.globalAlpha = 1;
    // title
    brushText(g, S.t1, 90, 236, P(t, 0.15, 0.75));
    brushText(g, S.t2, 86, 362, P(t, 0.55, 1.1));
    // culms (light one behind), each internode one upward stroke, joints after each stroke
    CULMS.forEach((cu, ci) => {
      cu.segs.forEach((Ls, k) => {
        const u = E.outQ(P(t, cu.t0 + k * cu.dt, cu.t0 + k * cu.dt + cu.dt * 1.15));
        if (u <= 0) return;
        const img = cu.img[k], vis = img.height * u, ang = Math.atan2(cu.xs[k + 1] - cu.xs[k], Ls);
        g.save(); g.translate(cu.xs[k], cu.ys[k] + 1); g.rotate(ang);
        g.drawImage(img, 0, img.height - vis, img.width, vis, -img.width / 2, -vis, img.width, vis);
        g.restore();
        if (u >= 1 && k > 0) nodeMark(g, cu.xs[k], cu.ys[k], cu.w - k * 0.8, cu.a, cu.seed + 50 + k);
      });
      CLUSTERS.filter(cl => cl.c === ci).forEach(cl => {
        const kt = P(t, cl.t0, cl.t0 + 0.12);
        if (kt <= 0) return;
        g.save(); g.globalAlpha = kt; g.fillStyle = rgba(C.ink, cu.a); g.fill(SH.pathFrom(cl.twig)); g.restore();
        cl.leaves.forEach((lf, j) => {
          const kl = E.outQ(P(t, cl.t0 + 0.1 + j * 0.07, cl.t0 + 0.2 + j * 0.07));
          if (kl <= 0) return;
          g.save(); g.translate(cl.end[0], cl.end[1]); g.rotate(lf.a); g.scale(0.4 + 0.6 * kl, kl);
          g.drawImage(lf.cv, -lf.cv.width / 2, -lf.cv.height + 5); g.restore();
        });
      });
    });
    // ground line, underground stem, roots, food travelling to the shoot
    const kg = E.ioS(P(t, 2.6, 3.0));
    if (kg > 0) { const im = S.ground, vis = im.height * kg; g.save(); g.translate(40, GROUND); g.rotate(Math.PI / 2); g.drawImage(im, 0, im.height - vis, im.width, vis, -im.width / 2, -vis, im.width, vis); g.restore(); }
    S.rhizImg.forEach((img, k) => {
      const u = E.outQ(P(t, 2.9 + k * 0.07, 2.98 + k * 0.07));
      if (u <= 0) return;
      const x0 = S.rhizX[k], len = img.height - 8;
      g.save(); g.translate(x0, RHIZ); g.rotate(Math.PI / 2);
      const vis = (len + 8) * u;
      g.drawImage(img, 0, img.height - vis, img.width, vis, -img.width / 2, -vis + 4, img.width, vis);
      g.restore();
      if (u >= 1) { g.save(); g.translate(S.rhizX[k + 1], RHIZ); g.rotate(Math.PI / 2); nodeMark(g, 0, 0, 26, 0.7, 1985 + k); g.restore(); }
    });
    S.roots.forEach((r, i) => { const u = P(t, 3.2 + (i % 7) * 0.03, 3.45 + (i % 7) * 0.03); if (u <= 0) return; g.fillStyle = rgba(C.ink, 0.5); g.fill(SH.pathFrom(SH.strip(SH.partial(r, u), 3.2, 0.8, 1986 + i, { wob: 0.2 }))); });
    const kf = P(t, 3.3, 3.5) * (1 - P(t, 5.4, 5.7));
    if (kf > 0) for (let j = 0; j < 6; j++) {
      const ph = ((t - 3.3) * 0.8 + j / 6) % 1, x = lerp(110, 590, ph), y = RHIZ + Math.sin(ph * 9 + j) * 3;
      g.fillStyle = rgba(C.ink, 0.75 * kf * Math.sin(Math.PI * ph)); g.beginPath(); g.arc(x, y, 5 + 3 * SH.h01(1987, j), 0, 6.283); g.fill();
    }
    // the young shoot: every internode lengthens at the same time, like a telescope
    const kh = P(t, 3.25, 3.45);
    if (kh > 0) {
      const hgt = lerp(0.075, 1, E.ioS(P(t, 3.4, 5.4)));
      let y = RHIZ;
      const nodes = [];
      SHOOT.segs.forEach((Ls, k) => {
        const len = Ls * hgt, img = S.shootImg[k], w = img.width;
        g.save(); g.globalAlpha = kh; g.drawImage(img, SHOOT.x - w / 2, y - len - 4, w, len + 8); g.restore();
        y -= len; nodes.push([y, w - 8]);
      });
      nodes.forEach(([ny, w], k) => {
        nodeMark(g, SHOOT.x, ny, w, 0.75, 1972 + k);
        const side = k % 2 ? 1 : -1;                           // papery sheath clinging at each joint
        g.save(); g.translate(SHOOT.x + side * (w / 2 - 2), ny + 8); g.rotate(side * 0.18); g.fillStyle = rgba(C.ink, 0.62); g.fill(SH.pathFrom(S.sheath)); g.restore();
      });
      g.save(); g.translate(SHOOT.x, y + 6); g.fillStyle = rgba(C.ink, 0.78); g.fill(SH.pathFrom(S.tip)); g.restore();
      const ka = P(t, 3.7, 3.9) * (1 - P(t, 5.5, 5.8));       // little upward marks beside every joint while it grows
      if (ka > 0) nodes.forEach(([ny], k) => {
        if (ny > GROUND - 20 || k === nodes.length - 1) return;
        g.save(); g.translate(SHOOT.x + 46, ny + 10); g.strokeStyle = rgba(C.ink, 0.55 * ka); g.lineWidth = 3.2; g.lineCap = 'round';
        g.beginPath(); g.moveTo(0, 22); g.lineTo(0, -12); g.moveTo(-8, -3); g.lineTo(0, -13); g.lineTo(8, -3); g.stroke(); g.restore();
      });
    }
    // labels
    brushText(g, S.l1, 690, 890, P(t, 4.3, 4.65));
    brushText(g, S.l2, 690, 944, P(t, 4.5, 4.9));
    const kl = E.ioS(P(t, 4.6, 4.85));
    if (kl > 0) { g.fillStyle = rgba(C.ink, 0.6); g.fill(SH.pathFrom(SH.strip(SH.partial(SH.thruPts([680, 872], [652, 860], [630, 826], 12), kl), 2.6, 1, 1996, { wob: 0.1 }))); }
    brushText(g, S.l3, 690, 1462, P(t, 4.9, 5.3));
    brushText(g, S.l4, 690, 1514, P(t, 5.05, 5.4));
    brushText(g, S.s1, 90, 1668, P(t, 5.5, 5.95));
    brushText(g, S.s2, 90, 1752, P(t, 5.75, 6.2));
    const ks = P(t, 6.22, 6.38);
    if (ks > 0) { const s = lerp(1.3, 1, E.outQ(ks)); g.save(); g.globalAlpha = clamp(ks * 2); g.translate(842, 1702); g.rotate(-0.04); g.scale(s, s); g.drawImage(S.seal, -46, -46); g.restore(); }
  }
})();
