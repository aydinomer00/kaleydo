'use strict';
/* 18 · Tebeşir Tahtası — a classroom chalkboard: green slate with ghosts of old lessons, a wooden frame and tray,
   coloured chalk lines that skip over the board's tooth, a soft dusty halo, handwriting in chalk.
   The lesson is drawn live; a felt eraser sweeps the board clean in big strokes and returns to the tray. */
(() => {
  const { E, P, clamp, lerp, rng, mix, rgba, stepT } = SH;
  const C = {
    wall: '#E7DEC8', wood: '#9C6B3A', woodL: '#BC8A52', woodD: '#6E4626', board: '#2C4A3E',
    white: '#F2F0E6', yellow: '#F5DE6E', pink: '#F2A3B5', blue: '#93CBEA', green: '#A9DB8C', felt: '#55555E',
  };
  const S = {};
  const BD = { x: 42, y: 96, w: 996, h: 1638 };              // the writable board
  const TRAY = 1734;
  const B = [360, 1150], PHI = 0.62, LEN = 600, WID = 360;    // leaf base, tilt, size
  const SUN = [880, 560];
  const ER = { w: 160, h: 420 };                              // eraser footprint while wiping
  const ERASE = [[930, 320], [150, 320], [150, 715], [930, 715], [930, 1110], [150, 1110], [150, 1510], [930, 1510], [820, 1640]];
  const T_ER = [6.6, 6.72, 7.72, 7.95];                       // lift, wipe start, wipe end, back on the tray

  const lp2 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
  const leafPt = (s, side) => {                                // point on the leaf: s along the midrib, side −1..1 across
    const hw = (WID / 2) * Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(s, 0.75))), 0.8) * side;
    const ax = Math.sin(PHI), ay = -Math.cos(PHI), px = Math.cos(PHI), py = Math.sin(PHI);
    return [B[0] + ax * LEN * s + px * hw, B[1] + ay * LEN * s + py * hw];
  };

  function wrapDraw(size, x, y, r, fn) { for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) { if (x + ox < -r || x + ox > size + r || y + oy < -r || y + oy > size + r) continue; fn(x + ox, y + oy); } }
  function toothTex() {                                        // where chalk does not stick: specks + soft mottling
    const N = 512, { c, g } = SH.canvas(N, N), R = rng(1801);
    g.fillStyle = '#000';
    for (let i = 0; i < 30000; i++) {
      const a = 0.25 + R() * 0.75, x = R() * N, y = R() * N, r = 0.5 + R() * R() * 2.2;
      g.globalAlpha = a; wrapDraw(N, x, y, 4, (px, py) => { g.beginPath(); g.ellipse(px, py, r * 1.6, r, 0.15, 0, 6.283); g.fill(); });
    }
    g.globalAlpha = 1;
    for (let i = 0; i < 60; i++) {
      const x = R() * N, y = R() * N, r = 20 + R() * 60;
      wrapDraw(N, x, y, r, (px, py) => { const gr = g.createRadialGradient(px, py, 0, px, py, r); gr.addColorStop(0, 'rgba(0,0,0,0.2)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(px - r, py - r, r * 2, r * 2); });
    }
    return c;
  }
  const chalkText = (s, size, col) => SH.textSprite(s, size, { fam: 'Kalam', wt: 700, col });
  function write(g, sp, x, y, u, o = {}) {
    u = clamp(u);
    if (u <= 0) return;
    const cw = u >= 1 ? sp.w : sp.bx + sp.width * u;
    g.save(); g.translate(x - (o.ax || 0) * sp.width, y);
    g.drawImage(sp.c, 0, 0, cw, sp.h, -sp.bx, -sp.by, cw, sp.h);
    g.restore();
  }
  function chalk(g, pts, u, col, w, seed, o = {}) {           // a chalk stroke: a firm pass + a broken, wandering pass
    if (u <= 0) return;
    const p = SH.partial(pts, u);
    if (p.length < 2) return;
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = col;
    if (o.dash) g.setLineDash(o.dash);
    const a0 = g.globalAlpha * (o.a ?? 0.95);
    g.globalAlpha = a0; g.lineWidth = w; g.stroke(SH.pathFrom(p, false));
    g.globalAlpha = a0 * 0.55; g.lineWidth = w * 0.5; g.stroke(SH.pathFrom(SH.jitterPts(p, seed, w * 0.45, false), false));
    g.restore();
  }
  function head(g, pts, col, w, len = 26) {
    const n = pts.length, [x, y] = pts[n - 1], [px, py] = pts[Math.max(0, n - 4)], a = Math.atan2(y - py, x - px);
    for (const s of [-1, 1]) chalk(g, [[x, y], [x - Math.cos(a + s * 0.55) * len, y - Math.sin(a + s * 0.55) * len]], 1, col, w, 1810 + s);
  }
  function chalkArrow(g, a, k, b, u, col, w = 7, o = {}) {
    const pts = SH.thruPts(a, k, b, 30);
    chalk(g, pts, u, col, w, 1820 + Math.round(a[0]), o);
    if (u >= 0.98) head(g, pts, col, w);
  }
  const circlePts = (cx, cy, r, n = 40, a0 = -1.9, turns = 1.06) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (i / n) * Math.PI * 2 * turns; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
  const wavy = (x0, x1, y, seed, amp = 4) => { const n = Math.max(8, Math.round((x1 - x0) / 16)); return Array.from({ length: n + 1 }, (_, i) => [lerp(x0, x1, i / n), y + SH.noise1(seed, i * 0.4) * amp]); };

  // the eraser path: cumulative lengths for constant-speed travel
  function pathAt(pts, cum, s) {
    const L = cum[cum.length - 1] * clamp(s);
    let i = 1;
    while (i < cum.length - 1 && cum[i] < L) i++;
    const k = (L - cum[i - 1]) / (cum[i] - cum[i - 1] || 1), a = pts[i - 1], b = pts[i];
    return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), Math.atan2(b[1] - a[1], b[0] - a[0])];
  }
  function eraserBack(g, x, y, rot, alpha = 1, sc = 1) {              // pressed against the board: we see its wooden back
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(sc, sc); g.globalAlpha *= alpha;
    g.shadowColor = alpha < 0.5 ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0.45)'; g.shadowBlur = 22; g.shadowOffsetX = 8; g.shadowOffsetY = 12;
    g.fillStyle = C.felt; g.fill(S.erFelt);
    g.shadowColor = 'rgba(0,0,0,0)';
    g.drawImage(S.erWood, -ER.w / 2 - 2, -ER.h / 2 - 2);
    g.restore();
  }
  function eraserSide(g, x, y, alpha = 1) {                   // resting on the tray: we see its side
    g.save(); g.translate(x, y); g.globalAlpha *= alpha;
    g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 10; g.shadowOffsetY = 5;
    g.fillStyle = C.felt; g.fillRect(-115, -16, 230, 18);
    g.shadowColor = 'rgba(0,0,0,0)';
    g.fillStyle = '#B57C45'; g.fillRect(-115, -50, 230, 36);
    g.fillStyle = 'rgba(255,240,210,0.35)'; g.fillRect(-115, -50, 230, 5);
    g.strokeStyle = 'rgba(90,50,20,0.35)'; g.lineWidth = 1.5; for (const yy of [-38, -29, -22]) { g.beginPath(); g.moveTo(-110, yy); g.bezierCurveTo(-40, yy - 3, 40, yy + 3, 110, yy); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(-115, -2, 230, 3);
    g.restore();
  }

  SH.register({
    id: '18', w: 1080, h: 1920, duration: 8, fps: 30, poster: 6.6,
    fonts: ['700 80px "Kalam"'],
    init(g, W, H) {
      S.tooth = toothTex();
      // ---- static scene: wall, frame, board with ghosts, tray with chalk sticks
      const sc = SH.canvas(W, H), b = sc.g, R = rng(1802);
      b.fillStyle = C.wall; b.fillRect(0, 0, W, H);
      b.globalCompositeOperation = 'soft-light'; b.globalAlpha = 0.6; b.fillStyle = b.createPattern(SH.grain(512, 1803, { fibres: 200 }), 'repeat'); b.fillRect(0, 0, W, H);
      b.globalCompositeOperation = 'source-over'; b.globalAlpha = 1;
      b.save(); b.shadowColor = 'rgba(60,40,20,0.45)'; b.shadowBlur = 30; b.shadowOffsetY = 14; b.fillStyle = C.wood; b.fillRect(16, 70, W - 32, TRAY - 70 + 26); b.restore();
      const frame = new Path2D(); frame.rect(16, 70, W - 32, TRAY - 70 + 26); frame.rect(BD.x, BD.y, BD.w, BD.h);
      SH.paper(b, frame, { color: C.wood, z: 0, tex: 0.9, seed: 5, rule: 'evenodd', ew: 2.4 });
      b.save(); b.clip(frame, 'evenodd'); b.strokeStyle = 'rgba(70,40,15,0.28)'; b.lineWidth = 1.4;
      for (let i = 0; i < 46; i++) { const y = 74 + R() * (TRAY - 60); b.beginPath(); b.moveTo(10, y); for (let x = 10; x <= W; x += 60) b.lineTo(x, y + Math.sin(x * 0.01 + i) * 3); b.stroke(); }
      for (let i = 0; i < 40; i++) { const x = 20 + R() * (W - 40); b.beginPath(); b.moveTo(x, 70); for (let y = 70; y <= TRAY + 30; y += 60) b.lineTo(x + Math.sin(y * 0.01 + i) * 3, y); b.stroke(); }
      b.restore();
      // board slate
      b.fillStyle = C.board; b.fillRect(BD.x, BD.y, BD.w, BD.h);
      b.save(); b.beginPath(); b.rect(BD.x, BD.y, BD.w, BD.h); b.clip();
      b.globalCompositeOperation = 'soft-light'; b.globalAlpha = 0.8; b.fillStyle = b.createPattern(SH.grain(256, 1804, { fine: 26, mottle: 34, fibres: 0, cell: 16 }), 'repeat'); b.fillRect(BD.x, BD.y, BD.w, BD.h);
      b.globalCompositeOperation = 'source-over'; b.globalAlpha = 1;
      // ghosts of earlier lessons: eraser swirls, half-erased sums
      b.filter = 'blur(16px)'; b.strokeStyle = 'rgba(235,240,230,0.055)'; b.lineCap = 'round';
      for (let i = 0; i < 14; i++) { const cx = BD.x + R() * BD.w, cy = BD.y + R() * BD.h, r = 120 + R() * 260; b.lineWidth = 60 + R() * 70; b.beginPath(); b.arc(cx, cy, r, R() * 6.28, R() * 6.28 + 1.2 + R() * 1.6); b.stroke(); }
      b.filter = 'blur(2.5px)'; b.fillStyle = 'rgba(235,240,230,0.075)';
      for (const [s, x, y, sz] of [['2 + 3 = 5', 600, 1270, 70], ['A a  B b  C c', 110, 1820 - 160, 64], ['7 x 8', 760, 250, 60], ['ağaç', 160, 590, 70]]) { b.font = `700 ${sz}px "Kalam"`; b.fillText(s, x, y); }
      b.filter = 'none';
      b.restore();
      // inner shadow of the frame on the board
      b.save(); b.beginPath(); b.rect(BD.x, BD.y, BD.w, BD.h); b.clip(); b.shadowColor = 'rgba(0,0,0,0.55)'; b.shadowBlur = 18; b.lineWidth = 30; b.strokeStyle = '#000'; b.strokeRect(BD.x - 15, BD.y - 15, BD.w + 30, BD.h + 30); b.restore();
      // tray: top surface, front face, shadow on the wall
      b.save(); b.shadowColor = 'rgba(60,40,20,0.5)'; b.shadowBlur = 20; b.shadowOffsetY = 14; b.fillStyle = C.woodD; b.fillRect(8, TRAY + 36, W - 16, 32); b.restore();
      b.fillStyle = C.woodL; b.fillRect(8, TRAY, W - 16, 38);
      b.fillStyle = 'rgba(255,240,210,0.35)'; b.fillRect(8, TRAY, W - 16, 3);
      b.fillStyle = C.woodD; b.fillRect(8, TRAY + 38, W - 16, 30);
      b.fillStyle = 'rgba(0,0,0,0.25)'; b.fillRect(8, TRAY + 38, W - 16, 3);
      b.fillStyle = 'rgba(245,242,232,0.5)';                // chalk dust in the tray
      for (let i = 0; i < 900; i++) { const x = 20 + R() * (W - 40), y = TRAY + 6 + Math.pow(R(), 0.6) * 30; b.globalAlpha = 0.15 + R() * 0.5; b.beginPath(); b.arc(x, y, 0.6 + R() * 1.6, 0, 6.283); b.fill(); }
      b.globalAlpha = 1;
      for (const [x0, x1, col] of [[150, 290, '#F1EFE6'], [330, 430, C.yellow], [470, 548, C.pink], [960 - 70, 1000, C.blue]]) {
        b.save(); b.shadowColor = 'rgba(40,25,10,0.35)'; b.shadowBlur = 6; b.shadowOffsetY = 3;
        b.fillStyle = col; b.fill(SH.pathFrom(SH.rrect(x0, TRAY + 10, x1 - x0, 17, 8, x0, { jit: 0.4 }))); b.restore();
        b.fillStyle = 'rgba(255,255,255,0.35)'; b.fillRect(x0 + 6, TRAY + 12, x1 - x0 - 12, 4);
        b.fillStyle = 'rgba(0,0,0,0.12)'; b.fillRect(x0 + 6, TRAY + 22, x1 - x0 - 12, 4);
      }
      S.scene = sc.c;
      // eraser parts
      S.erFelt = SH.pathFrom(SH.rrect(-ER.w / 2 - 6, -ER.h / 2 - 6, ER.w + 12, ER.h + 12, 16, 1805, { jit: 0.3 }));
      const ew = SH.canvas(ER.w + 4, ER.h + 4), e = ew.g;
      e.translate(2, 2);
      const wp = SH.pathFrom(SH.rrect(0, 0, ER.w, ER.h, 14, 1806, { jit: 0.2 }));
      SH.paper(e, wp, { color: '#B57C45', z: 0, tex: 0.9, seed: 7, ew: 3 });
      e.save(); e.clip(wp); e.strokeStyle = 'rgba(90,50,20,0.35)'; e.lineWidth = 1.6;
      for (let i = 0; i < 9; i++) { const x = 12 + i * 15 + R() * 6; e.beginPath(); e.moveTo(x, 0); e.bezierCurveTo(x + 6, ER.h * 0.3, x - 6, ER.h * 0.7, x + 2, ER.h); e.stroke(); }
      e.fillStyle = 'rgba(40,24,10,0.25)'; e.fill(SH.pathFrom(SH.rrect(ER.w / 2 - 18, 40, 36, ER.h - 80, 18, 1807, { jit: 0.2 })));   // finger groove
      e.restore();
      S.erWood = ew.c;
      S.layer = SH.canvas(W, H); S.mask = SH.canvas(W, H); S.res = SH.canvas(W, H);
      // fresh residue the eraser leaves: streaks along its motion (revealed through the swept mask)
      const rs = SH.canvas(W, H), r = rs.g;
      r.strokeStyle = 'rgba(240,242,236,1)'; r.lineCap = 'round'; r.filter = 'blur(4px)';
      for (let i = 0; i < 700; i++) { const x = BD.x + R() * BD.w, y = BD.y + R() * BD.h, L = 60 + R() * 260; r.globalAlpha = 0.03 + R() * 0.06; r.lineWidth = 6 + R() * 22; r.beginPath(); r.moveTo(x, y); r.lineTo(x + L, y + (R() - 0.5) * 30); r.stroke(); }
      S.resTex = rs.c;
      // eraser path lengths
      S.cum = [0]; for (let i = 1; i < ERASE.length; i++) S.cum.push(S.cum[i - 1] + Math.hypot(ERASE[i][0] - ERASE[i - 1][0], ERASE[i][1] - ERASE[i - 1][1]));
      // lesson geometry
      const N = 60;
      S.leafOut = [...Array.from({ length: N + 1 }, (_, i) => leafPt(i / N, -1)), ...Array.from({ length: N }, (_, i) => leafPt(1 - (i + 1) / N, 1))];
      S.leafPath = SH.pathFrom(S.leafOut);
      S.midrib = Array.from({ length: 21 }, (_, i) => leafPt(-0.02 + (i / 20) * 0.97, 0));
      S.veins = [];
      for (let k = 0; k < 6; k++) { const s = 0.16 + k * 0.12; for (const side of [-1, 1]) S.veins.push(SH.thruPts(leafPt(s, 0), lp2(leafPt(s + 0.06, 0), leafPt(s + 0.1, side * 0.75), 0.6), leafPt(s + 0.12, side * 0.82), 10)); }
      S.stem = SH.catmullPts([leafPt(0, 0), [372, 1230], [398, 1310], [420, 1390]], 30);
      S.hatch = [];
      for (let k = -24; k < 30; k++) { const x0 = 140 + k * 26; S.hatch.push([[x0, 1220], [x0 + 520, 520]]); }
      // text
      S.t1 = chalkText('Yapraklar nasıl', 96, C.white); S.t2 = chalkText('besin yapar?', 96, C.white);
      S.lSun = chalkText('güneş ışığı', 48, C.yellow); S.lWater = chalkText('su (kökten)', 48, C.blue);
      S.lCO2 = chalkText('karbondioksit', 48, C.white); S.lSugar = chalkText('şeker', 60, C.pink); S.lO2 = chalkText('oksijen', 52, C.blue);
      S.foto = chalkText('FOTOSENTEZ', 104, C.yellow);
      // the formula row, centred: ışık + su + CO2 → şeker + O2
      const fs = 62, pieces = [['ışık', C.yellow], [' + ', C.white], ['su', C.blue], [' + ', C.white], ['CO', C.white, '2'], ['→'], ['şeker', C.pink], [' + ', C.white], ['O', C.blue, '2']];
      let x = 0;
      S.formula = pieces.map(([s, col, sub]) => {
        if (s === '→') { const it = { arrow: true, x, w: 96 }; x += 96; return it; }
        const sp = chalkText(s, fs, col), it = { sp, x, sub: sub ? chalkText(sub, 38, col) : null };
        x += sp.width + (sub ? 26 : 0) + 4; return it;
      });
      S.formulaX = 540 - x / 2;
    },
    frame(g, t, W, H) {
      g.drawImage(S.scene, 0, 0);
      const L = S.layer.g;
      L.setTransform(1, 0, 0, 1, 0, 0); L.globalAlpha = 1; L.globalCompositeOperation = 'source-over'; L.filter = 'none';
      L.clearRect(0, 0, W, H);
      lesson(L, t);
      L.globalCompositeOperation = 'destination-out'; L.globalAlpha = 0.85; L.fillStyle = SH.pattern(L, S.tooth); L.fillRect(BD.x, BD.y, BD.w, BD.h);
      // eraser sweep: wipe the chalk inside the swept band, leave fresh smudges that settle before the loop
      const sw = P(t, T_ER[1], T_ER[2]);
      if (sw > 0) {
        const M = S.mask.g;
        M.setTransform(1, 0, 0, 1, 0, 0); M.clearRect(0, 0, W, H); M.fillStyle = '#fff';
        const total = S.cum[S.cum.length - 1], n = Math.ceil((total * sw) / 14);
        for (let i = 0; i <= n; i++) { const [x, y, a] = pathAt(ERASE, S.cum, Math.min(sw, (i * 14) / total)); M.setTransform(1, 0, 0, 1, x, y); M.rotate(Math.cos(a) * 0.08); M.fillRect(-ER.w / 2, -ER.h / 2, ER.w, ER.h); }
        M.setTransform(1, 0, 0, 1, 0, 0);
        L.globalCompositeOperation = 'destination-out'; L.globalAlpha = 1; L.drawImage(S.mask.c, 0, 0);
        const fade = 1 - P(t, 7.55, 7.95);
        if (fade > 0) {
          const Rg = S.res.g; Rg.globalCompositeOperation = 'source-over'; Rg.clearRect(0, 0, W, H); Rg.drawImage(S.resTex, 0, 0);
          Rg.globalCompositeOperation = 'destination-in'; Rg.drawImage(S.mask.c, 0, 0); Rg.globalCompositeOperation = 'source-over';
          g.save(); g.globalAlpha = fade; g.beginPath(); g.rect(BD.x, BD.y, BD.w, BD.h); g.clip(); g.drawImage(S.res.c, 0, 0); g.restore();
        }
      }
      // chalk halo, then the chalk itself
      g.save(); g.beginPath(); g.rect(BD.x, BD.y, BD.w, BD.h); g.clip();
      g.globalAlpha = 0.32; g.filter = 'blur(3px)'; g.drawImage(S.layer.c, 0, 0); g.filter = 'none'; g.globalAlpha = 1;
      g.drawImage(S.layer.c, 0, 0);
      g.restore();
      // the eraser: resting, lifting, wiping (with dust), returning
      const rest = [815, TRAY + 2];
      if (t < T_ER[0] || t >= T_ER[3]) eraserSide(g, rest[0], rest[1]);
      else if (t < T_ER[1]) {
        const k = E.ioC(P(t, T_ER[0], T_ER[1])), [x, y] = lp2(rest, ERASE[0], k);
        eraserSide(g, x, y, 1 - k); eraserBack(g, x, y, lerp(Math.PI / 2, 0, k), k, lerp(0.55, 1, k));
      } else if (t < T_ER[2]) {
        dust(g, sw);
        for (let j = 3; j >= 0; j--) { const [x, y, a] = pathAt(ERASE, S.cum, Math.max(0, sw - j * 0.012)); eraserBack(g, x, y, Math.cos(a) * 0.08, j ? 0.12 : 1); }
      } else {
        const k = E.ioC(P(t, T_ER[2], T_ER[3])), end = ERASE[ERASE.length - 1], [x, y] = lp2(end, rest, k);
        dust(g, 1, t - T_ER[2]);
        eraserBack(g, x, y, lerp(0, Math.PI / 2, k), 1 - k, lerp(1, 0.55, k)); eraserSide(g, x, y, k);
      }
    },
  });

  function dust(g, sw, extra = 0) {                          // chalk dust left behind the eraser, drifting down
    const total = S.cum[S.cum.length - 1], speed = total / (T_ER[2] - T_ER[1]), n = Math.floor((total * sw) / 40);
    g.save(); g.fillStyle = C.white;
    for (let i = Math.max(0, n - 80); i <= n; i++) {
      const si = (i * 40) / total, [x, y] = pathAt(ERASE, S.cum, si), age = ((sw - si) * total) / speed + extra;
      for (let k = 0; k < 3; k++) {
        const a = 0.3 * (1 - age / 0.45);
        if (a <= 0) continue;
        const ox = (SH.h01(1830 + k, i) - 0.5) * ER.w, oy = (SH.h01(1840 + k, i) - 0.5) * ER.h;
        g.globalAlpha = a; g.beginPath(); g.arc(x + ox + (SH.h01(1850 + k, i) - 0.5) * 60 * age, y + oy + 90 * age * age + 30 * age, 3 + 6 * SH.h01(1860 + k, i) + 10 * age, 0, 6.283); g.fill();
      }
    }
    g.restore();
  }

  function lesson(g, t) {
    t *= 1.06;                                                 // the lesson clock runs a touch fast so it ends before the wipe
    const tt = Math.min(t, T_ER[1] * 1.06);                    // cyclic bits freeze once the wipe starts
    // title
    write(g, S.t1, 96, 300, P(t, 0.15, 0.6));
    write(g, S.t2, 150, 410, P(t, 0.55, 0.95));
    chalk(g, wavy(146, 160 + S.t2.width, 438, 1870, 4), E.ioS(P(t, 0.95, 1.1)), C.white, 7, 1871);
    // leaf: hatch fill (side of the chalk), outline, stem, veins
    const kh = P(t, 1.8, 2.2);
    if (kh > 0) {
      g.save(); g.clip(S.leafPath);
      S.hatch.forEach((h, i) => chalk(g, h, clamp(kh * 1.8 - (i / S.hatch.length) * 0.8), C.green, 18, 1880 + i, { a: 0.3 }));
      g.restore();
    }
    chalk(g, S.leafOut, E.ioS(P(t, 1.05, 1.55)), C.green, 8, 1872);
    chalk(g, S.stem, P(t, 1.3, 1.5), C.green, 10, 1873);
    chalk(g, S.midrib, P(t, 1.45, 1.7), C.green, 6, 1874);
    S.veins.forEach((v, i) => chalk(g, v, P(t, 1.6 + (i >> 1) * 0.05, 1.75 + (i >> 1) * 0.05), C.green, 4.5, 1890 + i));
    // sun, rays, label, light beams
    chalk(g, circlePts(SUN[0], SUN[1], 58), P(t, 2.0, 2.25), C.yellow, 8, 1875);
    const tw = Math.floor(stepT(tt, 6) * 6) % 2;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.2, r1 = 104 + ((i + tw) % 2 ? 10 : -4);
      chalk(g, [[SUN[0] + Math.cos(a) * 78, SUN[1] + Math.sin(a) * 78], [SUN[0] + Math.cos(a) * r1, SUN[1] + Math.sin(a) * r1]], P(t, 2.2 + i * 0.02, 2.28 + i * 0.02), C.yellow, 7, 1900 + i);
    }
    write(g, S.lSun, SUN[0], 452, P(t, 2.35, 2.65), { ax: 0.5 });
    [[[800, 618], [740, 660], [662, 712]], [[838, 650], [790, 712], [742, 790]], [[770, 600], [700, 618], [622, 650]]]
      .forEach(([a, k, b], i) => chalkArrow(g, a, k, b, E.ioS(P(t, 2.55 + i * 0.1, 2.85 + i * 0.1)), C.yellow, 6, { dash: [16, 14] }));
    // water climbing the stem
    const kw = P(t, 2.9, 3.1);
    if (kw > 0) {
      for (let j = 0; j < 3; j++) {
        const ph = ((tt - 2.9) * 0.9 + j / 3) % 1, s = 1 - ph, i = Math.min(S.stem.length - 2, Math.floor(s * (S.stem.length - 1)));
        const [x, y] = S.stem[i], [nx, ny] = S.stem[i + 1], a = Math.atan2(y - ny, x - nx), ax = x + Math.cos(a + Math.PI / 2) * 30, ay = y + Math.sin(a + Math.PI / 2) * 30;
        g.save(); g.globalAlpha = kw * Math.min(1, Math.sin(Math.PI * ph) * 2);
        chalk(g, [[ax - Math.cos(a - 0.7) * 20, ay - Math.sin(a - 0.7) * 20], [ax, ay], [ax - Math.cos(a + 0.7) * 20, ay - Math.sin(a + 0.7) * 20]], 1, C.blue, 7, 1910 + j);
        g.restore();
      }
    }
    write(g, S.lWater, 454, 1394, P(t, 3.0, 3.3));
    // carbon dioxide drifting in from the air
    write(g, S.lCO2, 80, 742, P(t, 3.3, 3.65));
    const kc = P(t, 3.35, 3.55);
    if (kc > 0) {
      for (let j = 0; j < 3; j++) {
        const ph = ((tt - 3.35) * 0.7 + j / 3) % 1, x = lerp(110, 300, ph), y = 840 + j * 44 + Math.sin(ph * 7 + j) * 8;
        g.save(); g.globalAlpha = kc * Math.min(1, Math.sin(Math.PI * ph) * 2.2);
        chalk(g, circlePts(x, y, 17 + j * 3, 22), 1, C.white, 5, 1920 + j); g.restore();
      }
      chalkArrow(g, [104, 1004], [210, 990], [318, 960], E.ioS(P(t, 3.45, 3.7)), C.white, 6);
    }
    // sugar made inside the leaf
    const hx = 566, hy = 958;
    chalk(g, Array.from({ length: 7 }, (_, i) => [hx + Math.cos(i * Math.PI / 3 + 0.5) * 24, hy + Math.sin(i * Math.PI / 3 + 0.5) * 24]), P(t, 3.85, 4.05), C.pink, 6, 1930);
    write(g, S.lSugar, 548, 1046, P(t, 3.95, 4.3), { ax: 0.5 });
    // oxygen leaving the leaf
    const ko = P(t, 4.4, 4.6);
    if (ko > 0) {
      for (let j = 0; j < 3; j++) {
        const ph = ((tt - 4.4) * 0.65 + j / 3) % 1, x = lerp(730, 960, ph), y = 990 + j * 46 - ph * 40 + Math.sin(ph * 6 + j) * 8;
        g.save(); g.globalAlpha = ko * Math.min(1, Math.sin(Math.PI * ph) * 2.2);
        chalk(g, circlePts(x, y, 16 + j * 3, 22), 1, C.blue, 5, 1940 + j); g.restore();
      }
      chalkArrow(g, [700, 1112], [790, 1128], [900, 1110], E.ioS(P(t, 4.5, 4.75)), C.blue, 6);
    }
    write(g, S.lO2, 772, 1214, P(t, 4.6, 4.95));
    // formula, then the word itself
    S.formula.forEach((it, i) => {
      const k = P(t, 5.05 + i * 0.09, 5.2 + i * 0.09), x = S.formulaX + it.x, y = 1534;
      if (it.arrow) { chalkArrow(g, [x + 8, y - 22], [x + 48, y - 24], [x + 86, y - 22], E.ioS(k), C.white, 7); return; }
      write(g, it.sp, x, y, k);
      if (it.sub) write(g, it.sub, x + it.sp.width + 2, y + 14, clamp(k * 2 - 1));
    });
    write(g, S.foto, 540, 1668, P(t, 5.95, 6.35), { ax: 0.5 });
    const fx0 = 540 - S.foto.width / 2 - 10, fx1 = 540 + S.foto.width / 2 + 10;
    chalk(g, wavy(fx0, fx1, 1690, 1950, 3), E.ioS(P(t, 6.3, 6.45)), C.yellow, 7, 1951);
    chalk(g, wavy(fx0 + 30, fx1 - 30, 1708, 1952, 3), E.ioS(P(t, 6.4, 6.55)), C.yellow, 6, 1953);
  }
})();
