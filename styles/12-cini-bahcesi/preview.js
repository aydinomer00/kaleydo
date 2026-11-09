'use strict';
/* 12 · Çini Bahçesi — an underglaze-painted tile panel. Motifs are painted with a brush under a
   glossy glaze: outline first, then colour (cobalt, turquoise, sage, raised coral red), all slightly
   softened; grout lines cut through the painting; every tile has its own tint and gloss streak.
   The loop flips every tile over to its blank face in a diagonal wave. */
(() => {
  const { E, P, clamp, lerp, bump, rng, mix, darken, lighten, rgba } = SH;
  const C = { slip: '#F7F4EC', grout: '#D9D3C4', cobalt: '#1F4E9B', turq: '#2BA3A7', red: '#C8402E', sage: '#4E8B4E', line: '#1B2840', white: '#FFFFFF' };
  const T = 180, COLS = 6, ROWS = 11, OX = (1080 - COLS * T) / 2, OY = (1920 - ROWS * T) / 2;
  const S = {};

  function brushFill(g, path, col, k, seed) {           // underglaze colour with brush streaks
    if (k <= 0) return;
    g.save(); g.clip(path); g.globalAlpha = Math.min(1, k * 1.5) * 0.93; g.fillStyle = col; g.fill(path);
    g.globalAlpha = 0.22 * Math.min(1, k * 1.5); g.strokeStyle = darken(col, 0.18); g.lineWidth = 3;
    const R = rng(seed);
    for (let i = 0; i < 26; i++) { const y = R() * 1920, x = R() * 1080; g.beginPath(); g.moveTo(x - 200, y); g.quadraticCurveTo(x, y + (R() - 0.5) * 40, x + 200, y + (R() - 0.5) * 30); g.stroke(); }
    g.restore();
  }
  function outline(g, pts, u, w = 4) {                  // the dark contour painted first
    if (u <= 0) return;
    const part = SH.partial(pts, u);
    if (part.length < 2) return;
    g.save(); g.filter = 'blur(0.6px)'; g.strokeStyle = C.line; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); part.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); g.restore();
  }
  const closed = pts => pts.concat([pts[0], pts[1]]);
  function painted(g, pts, col, t, a, b, seed, w = 4) {  // outline (first 55 %) then colour
    const k = P(t, a, b);
    if (k <= 0) return;
    brushFill(g, SH.pathFrom(pts), col, (k - 0.45) / 0.55, seed);
    outline(g, closed(pts), Math.min(1, k / 0.55), w);
  }
  function tulipPetal(open, side) {                      // slender petal with a pointed, flicked tip
    const len = 290, wid = 128, pts = SH.lobe(len, wid, 90 + side, { a: 0.95, tip: 0.7, jit: 0.3 });
    const ang = side * lerp(0.08, 0.5, open);
    return SH.tfPts(pts, 540, 800, 1, ang);
  }

  SH.register({
    id: '12', w: 1080, h: 1920, duration: 8, fps: 30, poster: 6.2,
    fonts: ['800 80px "Alegreya"', '700 80px "Alegreya"'],
    init(g, W, H) {
      // blank glazed tiles (each with its own tint and gloss), plus cobalt border friezes
      const blank = SH.canvas(W, H), b = blank.g, R = rng(1201);
      b.fillStyle = C.grout; b.fillRect(0, 0, W, H);
      S.tiles = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const x = OX + c * T, y = OY + r * T, tint = (R() - 0.5) * 0.04;
        b.fillStyle = tint > 0 ? mix(C.slip, '#FFFFFF', tint * 10) : mix(C.slip, '#E9E2D0', -tint * 10);
        b.beginPath(); b.roundRect(x + 3, y + 3, T - 6, T - 6, 6); b.fill();
        S.tiles.push({ r, c, x, y });
      }
      b.globalCompositeOperation = 'soft-light'; b.globalAlpha = 0.25; b.fillStyle = b.createPattern(SH.grain(512, 1202, { fibres: 0, fine: 18, mottle: 30 }), 'repeat'); b.fillRect(0, 0, W, H);
      b.globalCompositeOperation = 'source-over'; b.globalAlpha = 1;
      // friezes (row 0 and the last row): cobalt band with white quatrefoils and red buds
      for (const r of [0, ROWS - 1]) for (let c = 0; c < COLS; c++) {
        const x = OX + c * T, y = OY + r * T;
        b.save(); b.beginPath(); b.roundRect(x + 3, y + 3, T - 6, T - 6, 6); b.clip();
        b.fillStyle = C.cobalt; b.fillRect(x, y + 30, T, T - 60);
        for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) { b.fillStyle = C.white; b.beginPath(); b.ellipse(x + T / 2 + dx * 24, y + T / 2 + dy * 24, 20, 20, 0, 0, Math.PI * 2); b.fill(); }
        b.fillStyle = C.red; b.beginPath(); b.arc(x + T / 2, y + T / 2, 14, 0, Math.PI * 2); b.fill();
        b.fillStyle = C.turq; for (const dx of [0, T]) { b.beginPath(); b.arc(x + dx, y + T / 2, 22, 0, Math.PI * 2); b.fill(); }
        b.restore();
      }
      S.blank = blank.c;
      // gloss: a diagonal highlight streak and edge pooling per tile (drawn over everything)
      const gl = SH.canvas(W, H), q = gl.g;
      for (const tl of S.tiles) {
        const gr = q.createLinearGradient(tl.x, tl.y, tl.x + T, tl.y + T);
        gr.addColorStop(0.18, 'rgba(255,255,255,0)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.32)'); gr.addColorStop(0.42, 'rgba(255,255,255,0)');
        q.fillStyle = gr; q.beginPath(); q.roundRect(tl.x + 3, tl.y + 3, T - 6, T - 6, 6); q.fill();
        q.strokeStyle = 'rgba(40,60,90,0.12)'; q.lineWidth = 6; q.stroke();
      }
      S.gloss = gl.c;
      S.grout = (() => { const p = new Path2D(); for (let c = 0; c <= COLS; c++) p.rect(OX + c * T - 3, 0, 6, H); for (let r = 0; r <= ROWS; r++) p.rect(0, OY + r * T - 3, W, 6); return p; })();
      // motifs
      S.soil = [[OX, 1540], ...SH.catmullPts([[OX, 1540], [300, 1520], [540, 1545], [780, 1520], [OX + COLS * T, 1540]], 40), [OX + COLS * T, 1720], [OX, 1720]];
      S.bulb = SH.tfPts(SH.lobe(190, 170, 1203, { a: 1.3, tip: 0.6 }), 540, 1650, 1, Math.PI).map(([x, y]) => [x, y - 190]);
      S.roots = [-40, -14, 14, 40].map(dx => SH.thruPts([540 + dx * 0.4, 1650], [540 + dx, 1690], [540 + dx * 1.5, 1715], 10));
      S.stem = SH.thruPts([540, 1480], [566, 1140], [540, 800], 30);
      S.leafL = SH.tfPts(SH.lobe(560, 120, 1204, { a: 0.75, tip: 0.9 }), 530, 1490, 1, -0.45);
      S.leafR = SH.tfPts(SH.lobe(500, 112, 1205, { a: 0.75, tip: 0.9 }), 552, 1470, 1, 0.52);
      S.sun = SH.blob(880, 470, 70, 70, 1206, { bumps: [12, 0.18], wob: 0.01 });
      S.sunIn = SH.blob(880, 470, 38, 38, 1207, { wob: 0.01 });
      S.t1 = SH.textSprite('Lale nasıl', 112, { fam: 'Alegreya', wt: 800, col: C.cobalt });
      S.t2 = SH.textSprite('açar?', 112, { fam: 'Alegreya', wt: 800, col: C.red });
      S.labels = ['1 · Soğan kışın uyur', '2 · Baharda filizlenir', '3 · Güneşte açar'].map(s => SH.textSprite(s, 50, { fam: 'Alegreya', wt: 700, col: C.cobalt }));
    },
    frame(g, t, W, H) {
      const paint = gg => {
        gg.drawImage(S.blank, 0, 0);
        const G0 = g; g = gg;
        // title painted as an inscription
        const tk = E.outC(P(t, 0.2, 0.9));
        if (tk > 0) { g.save(); g.beginPath(); g.rect(0, 0, 160 + tk * 900, H); g.clip(); SH.drawSprite(g, S.t1, 540, 308, { ax: 0.5 }); SH.drawSprite(g, S.t2, 540, 474, { ax: 0.5 }); g.restore(); }
        // ground band with scale pattern, the bulb and its roots
        painted(g, S.soil, C.cobalt, t, 0.6, 1.3, 1);
        if (t > 1.2) { g.save(); g.clip(SH.pathFrom(S.soil)); g.globalAlpha = Math.min(1, (t - 1.2) * 3) * 0.9; g.strokeStyle = C.white; g.lineWidth = 4; for (let y = 1580; y < 1730; y += 40) for (let x = OX + ((y / 40) % 2) * 30; x < 1080; x += 60) { g.beginPath(); g.arc(x, y, 22, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); } g.restore(); }
        painted(g, S.bulb, C.white, t, 0.9, 1.6, 2, 4);
        if (t > 1.3) { g.save(); g.clip(SH.pathFrom(S.bulb)); g.globalAlpha = Math.min(1, (t - 1.3) * 3) * 0.85; g.strokeStyle = C.turq; g.lineWidth = 6; for (const dx of [-38, 0, 38]) { g.beginPath(); g.moveTo(540 + dx, 1650); g.quadraticCurveTo(540 + dx * 1.6, 1550, 540 + dx * 0.3, 1470); g.stroke(); } g.restore(); }
        S.roots.forEach((rt, i) => outline(g, rt, P(t, 1.2 + i * 0.05, 1.7 + i * 0.05), 4));
        // sprout, saz leaves, stem
        outline(g, S.stem, E.ioS(P(t, 1.8, 3.6)), 10);
        if (t > 1.8) { const sk = E.ioS(P(t, 1.8, 3.6)); g.save(); g.strokeStyle = C.sage; g.lineWidth = 6; g.lineCap = 'round'; const part = SH.partial(S.stem, sk); g.beginPath(); part.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); g.restore(); }
        painted(g, S.leafL, C.sage, t, 2.1, 3.1, 3);
        painted(g, S.leafR, C.sage, t, 2.4, 3.4, 4);
        // the bud forms and opens: petals in raised coral red with white veins
        const bud = E.outBack(P(t, 3.4, 4.2), 1.4), open = E.ioC(P(t, 4.6, 5.8));
        if (bud > 0) {
          g.save(); g.translate(540, 800); g.scale(bud, bud); g.translate(-540, -800);
          for (const side of [-1, 1, 0]) {
            const pts = side === 0 ? SH.tfPts(SH.lobe(310, 130, 1210, { a: 0.95, tip: 0.7, jit: 0.3 }), 540, 800, 1, 0) : tulipPetal(open, side);
            const p = SH.pathFrom(pts);
            g.save(); g.shadowColor = 'rgba(120,30,20,0.35)'; g.shadowBlur = 3; g.shadowOffsetY = 2; brushFill(g, p, C.red, 1, 1220 + side); g.restore();
            outline(g, closed(pts), 1, 4);
            g.save(); g.clip(p); g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 4; const ang = side === 0 ? 0 : side * lerp(0.08, 0.5, open);
            g.beginPath(); g.moveTo(540, 790); g.lineTo(540 + Math.sin(ang) * 240, 800 - Math.cos(ang) * 240); g.stroke(); g.restore();
          }
          g.restore();
        }
        // sun rosette
        const sk2 = E.outBack(P(t, 4.8, 5.4), 1.6);
        if (sk2 > 0) { g.save(); g.translate(880, 470); g.rotate((1 - sk2) * -1.2 + t * 0.05); g.scale(sk2, sk2); g.translate(-880, -470); brushFill(g, SH.pathFrom(S.sun), C.turq, 1, 9); outline(g, closed(S.sun), 1, 4); brushFill(g, SH.pathFrom(S.sunIn), C.cobalt, 1, 10); outline(g, closed(S.sunIn), 1, 3); g.restore(); }
        // labels on white cartouches with a cobalt rule
        [[1.2, 2.3], [2.4, 4.4], [5.0, 9]].forEach(([a, b2], i) => {
          const k = E.outC(P(t, a, a + 0.4)) * (1 - P(t, b2, b2 + 0.3));
          if (k <= 0) return;
          const sp = S.labels[i], w = sp.width + 80;
          g.save(); g.globalAlpha = k; g.fillStyle = C.white; g.beginPath(); g.roundRect(64, 900 - 50, w, 80, 40); g.fill();
          g.strokeStyle = C.cobalt; g.lineWidth = 4; g.stroke(); g.restore();
          SH.drawSprite(g, sp, 64 + 40, 900 + 6, { alpha: k });
        });
        g.fillStyle = C.grout; g.fill(S.grout);
        g.drawImage(S.gloss, 0, 0);
        g = G0;
      };
      // loop: tiles flip over in a diagonal wave and come back blank
      const fk = P(t, 6.9, 7.95);
      if (fk <= 0) { paint(g); return; }
      const snap = SH.canvas(W, H); paint(snap.g);
      const blank = S.blank;
      g.fillStyle = '#B9B2A2'; g.fillRect(0, 0, W, H);
      for (const tl of S.tiles) {
        const d = (tl.r + tl.c) / (ROWS + COLS - 2), k = clamp((fk - d * 0.6) / 0.4), th = k * Math.PI, sx = Math.cos(th);
        g.save(); g.translate(tl.x + T / 2, tl.y + T / 2); g.scale(Math.abs(sx) < 0.02 ? 0.02 : Math.abs(sx), 1); g.translate(-(tl.x + T / 2), -(tl.y + T / 2));
        g.drawImage(sx > 0 ? snap.c : blank, tl.x, tl.y, T, T, tl.x, tl.y, T, T);
        if (sx <= 0) g.drawImage(S.gloss, tl.x, tl.y, T, T, tl.x, tl.y, T, T);
        g.fillStyle = `rgba(30,40,60,${(0.35 * (1 - Math.abs(sx))).toFixed(3)})`; g.fillRect(tl.x, tl.y, T, T);
        g.restore();
      }
    },
  });
})();
