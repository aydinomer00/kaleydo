'use strict';
/* 20 · Kum Masası — sand animation on a lightbox: a glowing amber table under a layer of sand. Thick sand reads dark,
   thin sand glows, finger-cleared lines shine with darker rims of pushed sand. Shapes are poured, lines are drawn
   with a fingertip, grains hop; at the end a palm sweeps the table back to an even layer. */
(() => {
  const { E, P, clamp, lerp, rng } = SH;
  const S = {};
  const CREST = 540, CY = 1196, DUNE_X = [-420, 870];
  const WIND = [[-420, 1505], [-150, 1492], [60, 1462], [240, 1402], [380, 1322], [470, 1252], [515, 1214], [CREST, CY]];
  const DMOVE = 72;                                            // how far the dune walks during the clip

  const alphaText = (s, size, wt = 600) => SH.textSprite(s, size, { fam: 'Raleway', wt, col: '#000' });
  function surfY(x) {                                          // top of the dune (dune-local x)
    const p = S.top;
    if (x <= p[0][0]) return p[0][1];
    for (let i = 1; i < p.length; i++) if (p[i][0] >= x) { const a = p[i - 1], b = p[i], k = (x - a[0]) / (b[0] - a[0] || 1); return lerp(a[1], b[1], k); }
    return p[p.length - 1][1];
  }
  // ---- density helpers: everything is drawn as alpha (0 = bare glass, 1 = thick sand) into one canvas
  function addText(d, sp, x, y, u, a = 0.92, ax = 0) {        // poured letters
    u = clamp(u);
    if (u <= 0) return;
    const cw = u >= 1 ? sp.w : sp.bx + sp.width * u;
    d.save(); d.globalAlpha = a; d.filter = 'blur(0.8px)';
    d.drawImage(sp.c, 0, 0, cw, sp.h, x - ax * sp.width - sp.bx, y - sp.by, cw, sp.h);
    d.restore();
  }
  function clearText(d, sp, x, y, u, ax = 0) {                 // letters written with a fingertip: bright, with a rim of pushed sand
    u = clamp(u);
    if (u <= 0) return;
    const cw = u >= 1 ? sp.w : sp.bx + sp.width * u, dx = x - ax * sp.width - sp.bx, dy = y - sp.by;
    d.save(); d.globalAlpha = 0.5; d.shadowColor = '#000'; d.shadowBlur = 7;
    d.drawImage(sp.c, 0, 0, cw, sp.h, dx, dy, cw, sp.h);
    d.restore();
    d.save(); d.globalCompositeOperation = 'destination-out'; d.globalAlpha = 0.94; d.filter = 'blur(0.6px)';
    d.drawImage(sp.c, 0, 0, cw, sp.h, dx, dy, cw, sp.h);
    d.restore();
  }
  function finger(d, pts, u, w, o = {}) {                      // a fingertip line: rim first, then the cleared groove
    if (u <= 0) return;
    const p = SH.partial(pts, u);
    if (p.length < 2) return;
    const path = SH.pathFrom(p, false);
    d.save(); d.lineCap = 'round'; d.lineJoin = 'round';
    if (o.dash) d.setLineDash(o.dash);
    d.globalAlpha = o.rim ?? 0.35; d.filter = 'blur(2px)'; d.lineWidth = w + 10; d.strokeStyle = '#000'; d.stroke(path);
    d.filter = 'blur(0.7px)'; d.globalCompositeOperation = 'destination-out'; d.globalAlpha = o.a ?? 0.92; d.lineWidth = w; d.stroke(path);
    d.restore();
    if (o.head && u >= 0.98) {
      const n = p.length, [x, y] = p[n - 1], [px, py] = p[Math.max(0, n - 4)], an = Math.atan2(y - py, x - px);
      for (const s of [-1, 1]) finger(d, [[x, y], [x - Math.cos(an + s * 0.6) * 28, y - Math.sin(an + s * 0.6) * 28]], 1, w, { rim: o.rim });
    }
  }
  function grains(d, x, y, r, n, seed, spread = 1) {            // loose grains around a front
    d.save(); d.fillStyle = '#000';
    for (let i = 0; i < n; i++) { d.globalAlpha = 0.3 + 0.6 * SH.h01(seed, i); d.beginPath(); d.arc(x + (SH.h01(seed + 1, i) - 0.5) * r * 2 * spread, y + (SH.h01(seed + 2, i) - 0.5) * r * 2, 0.8 + 1.6 * SH.h01(seed + 3, i), 0, 6.283); d.fill(); }
    d.restore();
  }

  SH.register({
    id: '20', w: 1080, h: 1920, duration: 8, fps: 30, poster: 6.5,
    fonts: ['600 80px "Raleway"'],
    init(g, W, H) {
      const R = rng(2001);
      // the lightbox glow
      const gl = SH.canvas(W, H), q = gl.g, gr = q.createRadialGradient(540, 860, 80, 540, 980, 1300);
      gr.addColorStop(0, '#FFF1CC'); gr.addColorStop(0.42, '#F9C978'); gr.addColorStop(0.78, '#DE8C3A'); gr.addColorStop(1, '#9F521C');
      q.fillStyle = gr; q.fillRect(0, 0, W, H);
      S.glow = gl.c;
      // even layer of sand: thin, slightly uneven
      const bs = SH.canvas(W, H), b = bs.g;
      b.fillStyle = 'rgba(0,0,0,0.37)'; b.fillRect(0, 0, W, H);
      b.filter = 'blur(40px)';
      for (let i = 0; i < 40; i++) { const x = R() * W, y = R() * H, r = 80 + R() * 220; b.fillStyle = `rgba(0,0,0,${(R() * 0.08).toFixed(3)})`; b.beginPath(); b.arc(x, y, r, 0, 6.283); b.fill(); }
      b.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 30; i++) { const x = R() * W, y = R() * H, r = 80 + R() * 200; b.fillStyle = `rgba(0,0,0,${(R() * 0.1).toFixed(3)})`; b.beginPath(); b.arc(x, y, r, 0, 6.283); b.fill(); }
      b.filter = 'none';
      S.base = bs.c;
      // grain: holes in the density (speck) and the colour of the sand itself (tex)
      const sp = SH.canvas(256, 256), s = sp.g;
      s.fillStyle = '#000';
      for (let i = 0; i < 7000; i++) { s.globalAlpha = 0.15 + R() * 0.85; s.beginPath(); s.arc(R() * 256, R() * 256, 0.5 + R() * 1.1, 0, 6.283); s.fill(); }
      S.speck = sp.c;
      const tx = SH.canvas(512, 512), t2 = tx.g;
      t2.fillStyle = '#3A2311'; t2.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 26000; i++) { const lt = R() < 0.6; t2.fillStyle = lt ? `rgba(150,96,46,${(0.2 + R() * 0.5).toFixed(2)})` : `rgba(18,10,4,${(0.2 + R() * 0.5).toFixed(2)})`; t2.fillRect(R() * 512, R() * 512, 1 + R() * 1.4, 1 + R() * 1.4); }
      S.tex = tx.c;
      S.D = SH.canvas(W, H); S.SC = SH.canvas(W, H);
      // ground band and the dune (dune-local coordinates; the dune walks right)
      S.groundPath = SH.pathFrom([[-20, 1560], ...Array.from({ length: 23 }, (_, i) => [-20 + i * 50, 1548 + Math.sin(i * 0.7) * 10 + SH.noise1(2002, i * 0.5) * 8]), [1110, 1560], [1110, 1940], [-20, 1940]]);
      S.top = [...SH.catmullPts(WIND, 70), ...Array.from({ length: 20 }, (_, i) => { const u = (i + 1) / 20; return [lerp(CREST, DUNE_X[1], u), lerp(CY, 1520, u) - Math.pow(u, 3) * 40 + Math.sin(u * Math.PI) * 4]; })];
      S.dunePath = SH.pathFrom([...S.top, [DUNE_X[1], 1620], [DUNE_X[0], 1620]]);
      S.contours = [1, 2, 3, 4].map(k => S.top.filter(([x]) => x > -60 + k * 30 && x < CREST - 30 - k * 34).map(([x, y]) => [x, y + 34 * k + Math.sin(x * 0.02 + k) * 4]));
      S.slides = [0, 1, 2].map(k => { const u0 = 0.12 + k * 0.08; return Array.from({ length: 16 }, (_, i) => { const u = u0 + (i / 15) * (0.8 - u0); return [lerp(CREST, DUNE_X[1], u) - 18 + k * 14, lerp(CY, 1505, u) + 20 + k * 6]; }); });
      // text
      S.t1 = alphaText('Kum tepeleri', 104); S.t2 = alphaText('nasıl yürür?', 104);
      S.l1 = alphaText('rüzgâr kumu', 46); S.l2 = alphaText('yukarı taşır', 46);
      S.l3 = alphaText('kum öbür yandan', 46); S.l4 = alphaText('aşağı kayar', 46);
      S.st = alphaText('Tepe adım adım ilerler!', 64);
      S.wind = [0, 1, 2].map(k => Array.from({ length: 30 }, (_, i) => [60 + i * 15 + k * 20, 870 + k * 66 + Math.sin(i * 0.33 + k) * 12]));
      S.sunRays = Array.from({ length: 9 }, (_, i) => { const a = (i / 9) * Math.PI * 2 - 0.3; return [[900 + Math.cos(a) * 88, 300 + Math.sin(a) * 88], [900 + Math.cos(a) * 118, 300 + Math.sin(a) * 118]]; });
    },
    frame(g, t, W, H) {
      const d = S.D.g;
      d.setTransform(1, 0, 0, 1, 0, 0); d.globalCompositeOperation = 'source-over'; d.globalAlpha = 1; d.filter = 'none'; d.fillStyle = '#000'; d.strokeStyle = '#000';
      d.clearRect(0, 0, W, H);
      d.drawImage(S.base, 0, 0);
      scene(d, t, W, H);
      sweep(d, t, W, H);
      d.globalCompositeOperation = 'destination-out'; d.globalAlpha = 0.45; d.fillStyle = SH.pattern(d, S.speck); d.fillRect(0, 0, W, H);
      // light through the sand: glow underneath, sand colour weighted by density on top
      g.drawImage(S.glow, 0, 0);
      const sc = S.SC.g;
      sc.globalCompositeOperation = 'source-over'; sc.clearRect(0, 0, W, H); sc.drawImage(S.D.c, 0, 0);
      sc.globalCompositeOperation = 'source-in'; sc.fillStyle = SH.pattern(sc, S.tex); sc.fillRect(0, 0, W, H);
      sc.globalCompositeOperation = 'source-over';
      g.drawImage(S.SC.c, 0, 0);
    },
  });

  function scene(d, t, W, H) {
    // ground poured from the bottom up
    const kg = E.outQ(P(t, 0.2, 0.8));
    if (kg > 0) {
      const yr = lerp(1960, 1520, kg);
      d.save(); d.beginPath(); d.rect(0, yr, W, 2000); d.clip(); d.globalAlpha = 0.88; d.filter = 'blur(1.5px)'; d.fill(S.groundPath); d.restore();
      if (kg < 1) for (let k = 0; k < 6; k++) grains(d, 90 + k * 180, yr, 18, 40, 2010 + k, 5);
    }
    // title poured, sun cleared with rays
    addText(d, S.t1, 90, 300, P(t, 0.4, 1.0));
    addText(d, S.t2, 90, 418, P(t, 0.8, 1.4));
    const ks = E.outBack(P(t, 0.9, 1.25), 1.4);
    if (ks > 0) {
      const r = 62 * ks;
      d.save(); d.globalAlpha = 0.45; d.filter = 'blur(3px)'; d.lineWidth = 16; d.strokeStyle = '#000'; d.beginPath(); d.arc(900, 300, r + 6, 0, 6.283); d.stroke(); d.restore();
      d.save(); d.globalCompositeOperation = 'destination-out'; d.globalAlpha = 0.96; d.filter = 'blur(1px)'; d.beginPath(); d.arc(900, 300, r, 0, 6.283); d.fill(); d.restore();
    }
    S.sunRays.forEach((ray, i) => finger(d, ray, P(t, 1.2 + i * 0.03, 1.32 + i * 0.03), 9));
    // the dune: poured left to right, then it walks
    const dx = DMOVE * E.ioS(P(t, 3.6, 6.2)), kd = P(t, 1.4, 2.2);
    if (kd > 0) {
      const xr = lerp(-40, 1000, E.ioS(kd));
      d.save(); d.beginPath(); d.rect(-10, 0, xr + 10, H); d.clip(); d.translate(dx, 0); d.globalAlpha = 0.9; d.filter = 'blur(1.5px)'; d.fill(S.dunePath); d.restore();
      if (kd < 1) grains(d, xr, surfY(xr - dx) + 40, 26, 60, 2020 + Math.floor(kd * 20), 1.2);
    }
    // ghost of where the dune stood, and the arrow of its walk
    const kgh = P(t, 3.7, 4.1);
    if (kgh > 0) finger(d, S.top.filter(([x]) => x > -40), kgh, 5, { dash: [4, 16], rim: 0.18, a: 0.7 });
    finger(d, [[480, 1622], [600, 1616], [740, 1622]], E.ioS(P(t, 5.0, 5.35)), 11, { head: true });
    // contour lines on the windward slope and slides on the slip face (they travel with the dune)
    d.save(); d.translate(dx, 0);
    S.contours.forEach((c, i) => finger(d, c, E.ioS(P(t, 2.2 + i * 0.1, 2.6 + i * 0.1)), 6, { rim: 0.25, a: 0.75 }));
    if (t > 3.8) S.slides.forEach((sl, k) => {                 // little avalanches running down the steep face
      const ph = ((t - 3.8) * 0.9 + k / 3) % 1, a = Math.min(1, P(t, 3.8, 4.1) * 3) * (1 - P(t, 6.3, 6.6));
      if (a <= 0) return;
      const pts = SH.partial(sl, ph), tail = Math.max(0, pts.length - 7);
      finger(d, pts.slice(tail), 1, 5, { rim: 0.2 * a, a: 0.8 * a });
    });
    d.restore();
    // wind: fingertip streaks with heads, and the hopping grains it carries
    S.wind.forEach((w, i) => finger(d, w, E.ioS(P(t, 2.6 + i * 0.12, 3.05 + i * 0.12)), 8, { head: true }));
    const kh = P(t, 3.0, 3.3) * (1 - P(t, 6.2, 6.5));
    if (kh > 0) {
      d.save(); d.fillStyle = '#000';
      for (let i = 0; i < 14; i++) {
        const p = ((t - 3.0) * 0.32 + i / 14) % 1;
        let x, y;
        if (p < 0.86) { x = lerp(-30, CREST, p / 0.86); const hp = ((p / 0.86) * 10) % 1; y = surfY(x) - 8 - 34 * 4 * hp * (1 - hp); }
        else { const u = (p - 0.86) / 0.14; x = lerp(CREST + 6, CREST + 260, u); y = surfY(x) - 6; }
        d.globalAlpha = 0.95 * kh * Math.min(1, Math.sin(Math.PI * p) * 4);
        d.beginPath(); d.arc(x + dx, y, 4.5 + 2 * SH.h01(2030, i), 0, 6.283); d.fill();
      }
      d.restore();
    }
    // labels: poured letters on the bright sky, fingertip letters in the dark ground
    addText(d, S.l1, 80, 770, P(t, 2.9, 3.25));
    addText(d, S.l2, 80, 826, P(t, 3.05, 3.4));
    addText(d, S.l3, 636, 900, P(t, 4.2, 4.6));
    addText(d, S.l4, 636, 956, P(t, 4.35, 4.75));
    clearText(d, S.st, 540, 1742, P(t, 5.5, 6.1), 0.5);
  }

  function sweep(d, t, W, H) {                                  // a palm pushes all the sand back into an even layer
    const k = P(t, 6.7, 7.9);
    if (k <= 0) return;
    const xf = lerp(-520, 1620, E.ioQ(k)), front = y => xf + 0.36 * (y - 960) + 30 * Math.sin(y * 0.004 + 1.3) + 10 * SH.noise1(2040, y * 0.02);
    const ys = Array.from({ length: 49 }, (_, i) => -20 + i * 41.5);
    const left = SH.pathFrom([[-30, -30], ...ys.map(y => [front(y), y]), [-30, H + 30]]);
    d.save(); d.globalCompositeOperation = 'destination-out'; d.fill(left); d.restore();
    d.save(); d.clip(left); d.drawImage(S.base, 0, 0);
    d.globalCompositeOperation = 'destination-out'; d.lineCap = 'round';           // fresh palm streaks just behind the front
    d.filter = 'blur(4px)';
    for (let i = 0; i < 16; i++) { const y = -20 + i * 124 + SH.h01(2041, i) * 60, x1 = front(y) - 120; d.globalAlpha = 0.05 + 0.08 * SH.h01(2042, i); d.lineWidth = 10 + 24 * SH.h01(2043, i); d.beginPath(); d.moveTo(x1 - 280, y - 100); d.quadraticCurveTo(x1 - 120, y - 30, x1, y); d.stroke(); }
    d.filter = 'none';
    d.restore();
    // the ridge of pushed sand riding the front, with loose grains ahead of it
    const ridge = (w0, w1, a, bl) => { d.save(); d.globalAlpha = a; d.filter = `blur(${bl}px)`; d.fill(SH.pathFrom([...ys.map(y => [front(y) + w0 + 6 * SH.noise1(2044, y * 0.05), y]), ...ys.slice().reverse().map(y => [front(y) - w1 - 30 * SH.noise1(2045 + w1, y * 0.012), y])])); d.restore(); };
    ridge(6, 150, 0.35, 14); ridge(4, 90, 0.55, 7); ridge(2, 40, 0.75, 3);   // a heap of pushed sand: steep in front, tapering behind
    for (let i = 0; i < 24; i++) { const y = -20 + i * 82; grains(d, front(y) + 24, y, 30, 30, 2050 + i, 0.8); }
  }
})();
