'use strict';
/* 10 · Hayal Perdesi — a candle-lit shadow-play screen. Puppets are translucent dyed leather:
   colour multiplies the light, dark outlines, punched holes let pure light through, joints swing,
   rods are visible. Distance from the screen = blur. Lettering is cut out of a dark cartouche. */
(() => {
  const { E, P, clamp, lerp, bump, rng, mix, darken, lighten, rgba, noise1 } = SH;
  const C = {
    light: '#FBEFD2', warm: '#F2C77E', amber: '#C9772F', frame: '#2B1A12', gold: '#C8A04A', line: '#2A1A12',
    saffron: '#E3A33C', madder: '#B8432F', indigo: '#3E5C8A', leaf: '#5E8B4A', plum: '#6A3D5A', moon: '#F0D06A', mouse: '#7D8FA6',
  };
  const S = {};
  // one leather part: dyed fill with punched holes (even-odd), dark outline; cached as a sprite
  function leather(pts, col, seed, holes = [], o = {}) {
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), pad = 12;
    const x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad, x1 = Math.max(...xs) + pad, y1 = Math.max(...ys) + pad;
    const { c, g } = SH.canvas(x1 - x0, y1 - y0);
    g.translate(-x0, -y0);
    const p = SH.pathFrom(pts);
    for (const [hx, hy, hr] of holes) { p.moveTo(hx + hr, hy); p.arc(hx, hy, hr, 0, Math.PI * 2); }
    g.fillStyle = rgba(col, o.alpha ?? 0.88); g.fill(p, 'evenodd');
    g.save(); g.clip(p, 'evenodd'); g.globalAlpha = 0.25; g.fillStyle = g.createPattern(SH.grain(256, seed, { fibres: 120, fine: 30, mottle: 40 }), 'repeat'); g.globalCompositeOperation = 'multiply'; g.fillRect(x0, y0, x1 - x0, y1 - y0); g.restore();
    g.strokeStyle = C.line; g.lineWidth = o.line ?? 4; g.lineJoin = 'round'; g.stroke(p);
    return { c, x0, y0 };
  }
  function dots(cx, cy, r, n, rr) { return Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r, rr]; }); }
  // place a part on the screen: multiply onto the light; blur grows with distance from the screen
  function show(g, sp, x, y, o = {}) {
    const d = o.d || 0;
    g.save(); g.translate(x, y); if (o.rot) g.rotate(o.rot); const s = (o.s ?? 1) * (1 + d * 0.5); g.scale((o.sx ?? 1) * s, s);
    g.globalCompositeOperation = 'multiply'; g.globalAlpha = (o.alpha ?? 1) * (1 - d * 0.75);
    if (d > 0.02) g.filter = `blur(${(d * 22).toFixed(1)}px)`;
    g.drawImage(sp.c, sp.x0, sp.y0);
    g.restore();
  }
  function rod(g, x, y, d = 0, alpha = 1) {             // the operator's stick, slightly further from the screen
    g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.55 * alpha * (1 - d * 0.8); g.filter = `blur(${(2 + d * 20).toFixed(1)}px)`;
    g.strokeStyle = C.line; g.lineWidth = 9; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (1800 - y) * 0.12, 1800); g.stroke(); g.restore();
  }
  function cartouche(text, size, seed) {                // dark plaque with the lettering cut out (light shines through)
    const t = SH.textSprite(text, size, { fam: 'Cormorant Garamond', wt: 700, col: '#000' });
    const w = t.width + 110, h = size * 1.45;
    const { c, g } = SH.canvas(w + 20, h + 20);
    g.translate(10, 10);
    const pts = [[h * 0.4, 0], [w - h * 0.4, 0], [w, h / 2], [w - h * 0.4, h], [h * 0.4, h], [0, h / 2]];
    g.fillStyle = rgba(C.frame, 0.92); g.fill(SH.pathFrom(pts));
    g.globalCompositeOperation = 'destination-out'; g.drawImage(t.c, w / 2 - t.bx - t.width / 2, h * 0.5 + size * 0.34 - t.by);
    for (const [x, y] of [[h * 0.28, h / 2], [w - h * 0.28, h / 2]]) { g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fill(); }
    g.globalCompositeOperation = 'source-over'; g.strokeStyle = rgba(C.gold, 0.9); g.lineWidth = 3; g.stroke(SH.pathFrom(pts.map(([x, y]) => [x + (x < w / 2 ? 9 : -9), y + (y < h / 2 ? 7 : y > h / 2 ? -7 : 0)])));
    return { c, x0: -(w + 20) / 2, y0: -(h + 20) / 2 };
  }

  SH.register({
    id: '10', w: 1080, h: 1920, duration: 8, fps: 30, poster: 3.6,
    fonts: ['700 80px "Cormorant Garamond"', '600 80px "Cormorant Garamond"'],
    init(g, W, H) {
      // the lit screen: warm centre, amber edges, a fine cloth weave
      const sc = SH.canvas(W, H), b = sc.g, gr = b.createRadialGradient(540, 900, 120, 540, 960, 1150);
      gr.addColorStop(0, '#FFF6DF'); gr.addColorStop(0.5, C.light); gr.addColorStop(0.85, C.warm); gr.addColorStop(1, C.amber);
      b.fillStyle = gr; b.fillRect(0, 0, W, H);
      b.globalCompositeOperation = 'multiply'; b.globalAlpha = 0.03;
      for (let y = 0; y < H; y += 3) { b.fillStyle = y % 6 ? '#8a6a40' : '#b08a58'; b.fillRect(0, y, W, 1); }
      for (let x = 0; x < W; x += 3) { b.fillStyle = '#8a6a40'; b.fillRect(x, 0, 1, H); }
      S.screen = sc.c;
      // the frame: dark wood with a gold rule and corner rosettes
      const fr = SH.canvas(W, H), f = fr.g;
      f.fillStyle = C.frame; f.fillRect(0, 0, W, H);
      f.globalCompositeOperation = 'soft-light'; f.globalAlpha = 0.5; f.fillStyle = f.createPattern(SH.grain(512, 101), 'repeat'); f.fillRect(0, 0, W, H);
      f.globalCompositeOperation = 'source-over'; f.globalAlpha = 1; f.clearRect(56, 120, W - 112, H - 240);
      f.strokeStyle = C.gold; f.lineWidth = 4; f.strokeRect(46, 110, W - 92, H - 220);
      for (const [x, y] of [[46, 110], [W - 46, 110], [46, H - 110], [W - 46, H - 110]]) { f.fillStyle = C.gold; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; f.beginPath(); f.arc(x + Math.cos(a) * 16, y + Math.sin(a) * 16, 6, 0, Math.PI * 2); f.fill(); } }
      S.frame = fr.c;
      S.title = [cartouche('Baykuş geceleri', 96, 1), cartouche('nasıl görür?', 96, 2)];
      S.lab1 = cartouche('Kocaman gözler ışığı toplar', 66, 3);
      S.lab2 = cartouche('Başını çok uzağa çevirir', 66, 4);
      // original puppets: crescent moon, branch, owl (jointed), mouse
      const cres = [];
      for (let a = 100; a <= 260; a += 4) cres.push([Math.cos(a * Math.PI / 180) * 110, Math.sin(a * Math.PI / 180) * 110]);
      for (let a = 236; a >= 124; a -= 4) cres.push([50 + Math.cos(a * Math.PI / 180) * 88, Math.sin(a * Math.PI / 180) * 88]);
      S.moon = leather(SH.jitterPts(cres, 10, 0.5), C.moon, 10, [[-78, -30, 7], [-88, 6, 7], [-76, 40, 7], [-60, 70, 6], [-60, -64, 6]]);
      S.branch = leather([[0, -18], [520, -40], [600, -10], [520, 20], [300, 22], [0, 24]], C.line, 11, [], { alpha: 0.95 });
      S.leaves = [0, 1, 2].map(i => leather(SH.lobe(110, 54, 12 + i, { a: 0.9 }), C.leaf, 12 + i, [[0, -55, 8], [0, -30, 6]]));
      S.body = leather(SH.blob(0, 0, 92, 130, 20, { wob: 0.04 }).map(([x, y]) => [x * (y < 0 ? 0.9 : 1), y]), C.saffron, 20, [[0, 40, 10], [-30, 70, 7], [30, 70, 7], [-40, 10, 7], [40, 10, 7], [0, 95, 7]]);
      S.head = leather(SH.catmullPts([[-92, -40], [-78, -128], [-36, -78], [0, -82], [36, -78], [78, -128], [92, -40], [96, 10], [66, 58], [0, 78], [-66, 58], [-96, 10], [-92, -40]], 70), C.madder, 21, [[-40, -10, 30], [40, -10, 30], [0, 52, 6]]);
      S.eyeRim = [-40, 40].map((x, i) => leather(SH.blob(0, 0, 40, 40, 22 + i, { wob: 0.01 }), C.saffron, 22 + i, [[0, 0, 26]]));
      S.wing = leather([[0, 0], [70, 30], [150, 140], [110, 160], [40, 120], [-10, 60]], C.indigo, 24, [[60, 70, 9], [90, 110, 8], [40, 40, 7]]);
      S.beak = leather([[-14, 0], [14, 0], [0, 30]], C.saffron, 25);
      S.mouse = leather(SH.blob(0, 0, 70, 38, 30, { wob: 0.04 }).map(([x, y]) => [x, Math.min(y, 30)]), C.mouse, 30, [[30, -10, 6]]);
      S.ear = leather(SH.blob(0, 0, 24, 24, 31), C.mouse, 31, [[0, 0, 10]]);
      S.vig = SH.vignette(W, H, 0.16, '90,40,10', 0.5, 0.45);
    },
    frame(g, t, W, H) {
      // candle flicker
      const fl = 0.95 + 0.05 * (0.5 + 0.5 * noise1(7, t * 9)) + 0.015 * noise1(8, t * 23);
      g.drawImage(S.screen, 0, 0);
      g.save(); g.globalCompositeOperation = 'screen'; const glow = g.createRadialGradient(560, 980, 60, 560, 980, 900);
      glow.addColorStop(0, `rgba(255,214,140,${(0.45 * fl).toFixed(3)})`); glow.addColorStop(1, 'rgba(255,214,140,0)'); g.fillStyle = glow; g.fillRect(0, 0, W, H); g.restore();
      g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = `rgb(${Math.round(255 * fl)},${Math.round(250 * fl)},${Math.round(240 * fl)})`; g.fillRect(0, 0, W, H); g.restore();
      const away = E.inQ(P(t, 7.1, 7.9));              // loop: everything is pulled away from the screen
      const near = (a, b) => 1 - E.outC(P(t, a, b));     // arriving puppets start away from the screen
      // title cartouches rise on rods
      S.title.forEach((sp, i) => {
        const k = E.outBack(P(t, 0.15 + i * 0.2, 0.75 + i * 0.2), 1.2), d = Math.max(near(0.15 + i * 0.2, 0.85 + i * 0.2) * 0.6, away);
        if (k <= 0) return;
        const y = lerp(1900, 300 + i * 150, k);
        show(g, sp, 540, y, { d });
      });
      // moon and branch
      const mk = E.outC(P(t, 0.5, 1.3)), md = Math.max(near(0.5, 1.4) * 0.5, away);
      if (mk > 0) { rod(g, 300, lerp(1300, 680, mk) + 100, md); show(g, S.moon, 300, lerp(1300, 680, mk), { d: md, rot: -0.3 }); }
      const bk = E.outC(P(t, 0.7, 1.3)), bd = Math.max(near(0.7, 1.4) * 0.4, away);
      if (bk > 0) {
        const bx = lerp(1150, 420, bk);
        show(g, S.branch, bx, 1120, { d: bd });
        S.leaves.forEach((lf, i) => show(g, lf, bx + 120 + i * 150, 1104, { d: bd, rot: [-0.6, 0.2, 0.7][i] + 0.06 * Math.sin(t * 2 + i) }));
        rod(g, bx + 300, 1130, bd);
      }
      // the owl flies in and lands; jointed wings, eyes catch the light, head turns
      if (t > 1.1) {
        g.save(); g.translate(640, 1000); g.scale(1.35, 1.35); g.translate(-640, -1000);
        const fly = E.ioC(P(t, 1.1, 2.4)), ox = lerp(-200, 640, fly), oy = lerp(700, 960, fly) - bump(fly) * 120, od = Math.max((1 - fly) * 0.25, away);
        const up = fly < 1 ? (0.5 + 0.5 * Math.sin(t * 12)) * 1.3 : 0.04 * Math.sin(t * 2);
        rod(g, ox, oy + 120, od);
        show(g, S.wing, ox - 52, oy - 30, { d: od, rot: -(0.15 - up), sx: -1 });
        show(g, S.wing, ox + 52, oy - 30, { d: od, rot: 0.15 - up });
        show(g, S.body, ox, oy + 40, { d: od });
        const turn = P(t, 4.3, 5.5), sx = Math.cos(turn * Math.PI * 2);          // the head turns away and back
        g.save(); g.translate(ox, oy - 110); g.scale(Math.abs(sx) < 0.05 ? 0.05 : sx, 1); g.translate(-ox, -(oy - 110));
        show(g, S.head, ox, oy - 110, { d: od });
        if (sx > 0) { S.eyeRim.forEach((er, i) => show(g, er, ox + (i ? 40 : -40), oy - 120, { d: od })); show(g, S.beak, ox, oy - 100, { d: od }); }
        g.restore();
        // 1 · the big eyes gather light: brighter pupils and converging rays from the moon
        const glow = P(t, 2.7, 3.2) * (1 - P(t, 4.2, 4.4));
        if (glow > 0 && sx > 0) {
          g.save(); g.globalCompositeOperation = 'lighter';
          for (const ex of [-40, 40]) { const gr2 = g.createRadialGradient(ox + ex, oy - 120, 0, ox + ex, oy - 120, 46); gr2.addColorStop(0, `rgba(255,240,190,${(0.9 * glow).toFixed(3)})`); gr2.addColorStop(1, 'rgba(255,240,190,0)'); g.fillStyle = gr2; g.fillRect(ox + ex - 50, oy - 170, 100, 100); }
          g.restore();
          g.save(); g.globalCompositeOperation = 'multiply'; g.strokeStyle = rgba(C.line, 0.6 * glow); g.lineWidth = 4; g.setLineDash([2, 16]); g.lineCap = 'round';
          for (const ex of [-40, 40]) { g.beginPath(); g.moveTo(270, 640); g.lineTo(ox + ex, oy - 120); g.stroke(); }
          g.restore();
        }
        // 2 · how far it can turn: a dotted arc around the head
        const arc = P(t, 4.3, 5.4) * (1 - P(t, 5.9, 6.2));
        if (arc > 0) { g.save(); g.globalCompositeOperation = 'multiply'; g.strokeStyle = rgba(C.madder, 0.85); g.lineWidth = 6; g.setLineDash([3, 14]); g.lineCap = 'round'; g.beginPath(); g.arc(ox, oy - 110, 150, -Math.PI / 2, -Math.PI / 2 + arc * Math.PI * 1.5); g.stroke(); g.restore(); }
        g.restore();
      }
      // the mouse scurries past at the end
      const mo = P(t, 5.8, 7.0);
      if (mo > 0 && mo < 1) { const mx = lerp(1250, -250, mo), my = 1690 + Math.abs(Math.sin(t * 18)) * -10; show(g, S.mouse, mx, my, { d: away, s: 1.4 }); show(g, S.ear, mx - 56, my - 48, { d: away, s: 1.4 }); g.save(); g.globalCompositeOperation = 'multiply'; g.strokeStyle = C.line; g.lineWidth = 4; g.beginPath(); g.moveTo(mx + 92, my + 8); g.quadraticCurveTo(mx + 160, my - 40, mx + 220, my + 14); g.stroke(); g.restore(); }
      // cut-out labels on rods
      [[S.lab1, 2.9, 4.2], [S.lab2, 4.4, 6.0]].forEach(([sp, a, b2]) => {
        const k = E.outBack(P(t, a, a + 0.5), 1.2) * (1 - E.inC(P(t, b2, b2 + 0.35)));
        if (k <= 0.01) return;
        const y = lerp(1900, 1560, k), d = Math.max(near(a, a + 0.6) * 0.5, away);
        show(g, sp, 540, y, { d });
      });
      g.drawImage(S.vig, 0, 0);
      g.drawImage(S.frame, 0, 0);
    },
  });
})();
