'use strict';
/* 25 · Mozaik Taş — an ancient stone floor mosaic that moves: thousands of tesserae in grout, a zigzag border,
   an inscription made of tiles, a sea of wave rows, a turtle built from stones. The scene is drawn as vector art,
   sampled once per tile and snapped to a small palette of stones; gold tesserae glint. Captions change with a
   wave of flipping tiles, and the signature transition flips every tile back to the opening picture. */
(() => {
  const { E, P, clamp, lerp, rng, mix } = SH;
  const PAL = {
    black: '#2B2522', brownD: '#4A3B30', brown: '#7A4E2D', brownM: '#9C6B3C', brownL: '#B98A52', cream: '#E7D8B5', sand: '#D6BC8A',
    sandD: '#C9A36A', white: '#F3EDE0', seaD: '#1F4E66', sea: '#2E6A84', seaM: '#4A8DA6', seaL: '#79B2C4', green: '#5E7B4C', greenL: '#7F9C5E',
    terra: '#B4553A', gold: '#D9A93B',
  };
  const NAMES = Object.keys(PAL), RGB = NAMES.map(k => SH.hex2rgb(PAL[k])), GOLD = NAMES.indexOf('gold');
  const S = {};
  const MAIN = { x: 40, y: 400, w: 1000, h: 1240, cols: 70, rows: 87 }, SCENE_H = 1290;
  const CAP = { x: 40, y: 1640, w: 1000, h: 240, cols: 143, rows: 34 };
  const NEST = [150, 1182];
  const PATH = [[170, 1140], [230, 980], [300, 820], [420, 660], [600, 600], [800, 700], [850, 880], [740, 990], [560, 1030], [440, 1080], [390, 1112]];
  const CAPTIONS = [['YAVRULAR DOĞDUKLARI', 'KUMSALI HATIRLAR'], ['YILLARCA OKYANUSTA', 'YÜZERLER'], ["DÜNYA'NIN MIKNATIS GÜCÜ", 'PUSULA OLUR'], ['VE AYNI KUMSALA', 'YUMURTLAMAYA DÖNERLER']];
  const CAP_T = [0.3, 1.7, 3.4, 5.2];
  const TAU = Math.PI * 2;

  // ---- tiles ------------------------------------------------------------------------------------------------------
  function grid(reg, seed, gap = 2.6) {                         // jittered rectangles on a regular grid
    const R = rng(seed), cw = reg.w / reg.cols, ch = reg.h / reg.rows, tiles = [];
    for (let j = 0; j < reg.rows; j++) for (let i = 0; i < reg.cols; i++) {
      const jx = (R() - 0.5) * cw * 0.12, jy = (R() - 0.5) * ch * 0.12, sw = cw - gap - R() * cw * 0.1, sh = ch - gap - R() * ch * 0.1;
      tiles.push({ x: reg.x + i * cw + (cw - sw) / 2 + jx, y: reg.y + j * ch + (ch - sh) / 2 + jy, w: sw, h: sh, i, j, v: Math.floor(R() * 3), ph: R() * TAU });
    }
    return tiles;
  }
  const _q = new Map();
  function quantize(r, g, b) {
    const key = (r << 16) | (g << 8) | b;
    let k = _q.get(key);
    if (k !== undefined) return k;
    let bd = 1e9; k = 0;
    for (let n = 0; n < RGB.length; n++) { const p = RGB[n], e = (r - p[0]) ** 2 * 0.3 + (g - p[1]) ** 2 * 0.59 + (b - p[2]) ** 2 * 0.11; if (e < bd) { bd = e; k = n; } }
    _q.set(key, k);
    return k;
  }
  const SS = 4;                                                 // supersampling: each tile votes over SS×SS pixels
  function sample(cv, reg, prefer = null, thr = 5) {           // one palette index per tile, by majority vote (edges never invent a third colour); thin dark strokes win with fewer votes
    const W2 = reg.cols * SS, d = cv.getContext('2d').getImageData(0, 0, W2, reg.rows * SS).data, out = new Uint8Array(reg.cols * reg.rows), votes = new Uint8Array(NAMES.length);
    for (let j = 0; j < reg.rows; j++) for (let i = 0; i < reg.cols; i++) {
      votes.fill(0);
      for (let y = 0; y < SS; y++) for (let x = 0; x < SS; x++) { const k = ((j * SS + y) * W2 + i * SS + x) * 4; votes[quantize(d[k], d[k + 1], d[k + 2])]++; }
      let best = 0; for (let n = 1; n < votes.length; n++) if (votes[n] > votes[best]) best = n;
      if (prefer) for (const pi of prefer) if (votes[pi] >= thr) { best = pi; break; }
      out[j * reg.cols + i] = best;
    }
    return out;
  }
  function paintTiles(g, tiles, cols, t, flip) {                // cols: palette index per tile; flip(tile) → [colour index, scaleY]
    for (let n = 0; n < tiles.length; n++) {
      const tl = tiles[n];
      let c = cols[n], sy = 1;
      if (flip) { const f = flip(tl, n); c = f[0]; sy = f[1]; }
      let st = S.styles[c][tl.v];
      if (c === GOLD) { const k = Math.pow(Math.max(0, Math.sin((TAU * 3 * t) / 8 + tl.ph)), 8); st = S.goldGlint[Math.round(k * 3)]; }
      if (sy < 0.999) { if (sy < 0.05) continue; g.fillStyle = st; g.fillRect(tl.x, tl.y + (tl.h * (1 - sy)) / 2, tl.w, tl.h * sy); g.fillStyle = `rgba(20,14,10,${(0.45 * (1 - sy)).toFixed(3)})`; g.fillRect(tl.x, tl.y + (tl.h * (1 - sy)) / 2, tl.w, tl.h * sy); continue; }
      g.fillStyle = st; g.fillRect(tl.x, tl.y, tl.w, tl.h);
    }
  }

  // ---- the picture (vector), in main-region coordinates 0..1000 × 0..1290 ---------------------------------------
  function turtle(g, x, y, ang, sc, flap) {
    g.save(); g.translate(x, y); g.rotate(ang); g.scale(sc, sc);
    g.lineJoin = 'round'; g.strokeStyle = PAL.black; g.lineWidth = 13;
    const fl = (px, py, rx, ry, a) => { g.save(); g.translate(px, py); g.rotate(a); g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, TAU); g.fillStyle = PAL.greenL; g.fill(); g.stroke(); g.restore(); };
    for (const s of [-1, 1]) { fl(s * 92, -30, 78, 24, s * (0.55 + flap)); fl(s * 52, 92, 36, 18, s * (-0.5 - flap * 0.5)); }
    g.beginPath(); g.ellipse(0, -132, 30, 38, 0, 0, TAU); g.fillStyle = PAL.greenL; g.fill(); g.stroke();
    g.fillStyle = PAL.black; for (const s of [-1, 1]) { g.beginPath(); g.arc(s * 14, -146, 7, 0, TAU); g.fill(); }
    g.beginPath(); g.ellipse(0, 10, 92, 118, 0, 0, TAU); g.fillStyle = PAL.brownM; g.fill(); g.stroke();
    g.save(); g.clip(); g.fillStyle = PAL.brownL;
    for (const [cx, cy] of [[0, -50], [0, 10], [0, 70]]) { g.beginPath(); for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU + Math.PI / 6; g.lineTo(cx + Math.cos(a) * 34, cy + Math.sin(a) * 30); } g.closePath(); g.fill(); g.lineWidth = 10; g.stroke(); }
    g.lineWidth = 10; for (const s of [-1, 1]) for (const yy of [-60, 0, 60]) { g.beginPath(); g.moveTo(s * 32, yy); g.lineTo(s * 100, yy + 14); g.stroke(); }
    g.restore();
    g.restore();
  }
  function scene(g, s, t) {
    // sea in wave rows (moving slowly, loop-safe), beach with foam
    g.fillStyle = PAL.sea; g.fillRect(0, 0, 1000, 1290);
    for (let k = 0; k < 22; k++) {
      g.strokeStyle = k % 3 === 0 ? PAL.seaD : k % 3 === 1 ? PAL.seaM : PAL.sea; g.lineWidth = 15;
      g.beginPath(); for (let x = -20; x <= 1020; x += 20) { const y = 30 + k * 48 + 14 * Math.sin(x * 0.011 + k * 0.9 + (TAU * t) / 4); x === -20 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
    }
    g.fillStyle = PAL.sand; g.beginPath(); g.moveTo(0, 1290); for (let x = 0; x <= 1000; x += 20) g.lineTo(x, 1080 + 24 * Math.sin(x * 0.008 + 0.6)); g.lineTo(1000, 1290); g.fill();
    g.strokeStyle = PAL.white; g.lineWidth = 16; g.beginPath(); for (let x = 0; x <= 1000; x += 20) { const y = 1074 + 24 * Math.sin(x * 0.008 + 0.6) + 6 * Math.sin(x * 0.05 + (TAU * t) / 2); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    // the nest; eggs hatch at the start and new eggs appear at the end
    g.fillStyle = PAL.sandD; g.beginPath(); g.ellipse(NEST[0], NEST[1], 96, 52, 0, 0, TAU); g.fill();
    const eggs = s < 0.45 || s > 6.35;
    if (eggs) { g.fillStyle = PAL.white; g.strokeStyle = PAL.brownL; g.lineWidth = 6; for (const [ex, ey] of [[-50, -10], [-14, -20], [22, -14], [54, -2], [-32, 20], [4, 16], [38, 22]]) { g.beginPath(); g.ellipse(NEST[0] + ex, NEST[1] + ey, 19, 17, 0, 0, TAU); g.fill(); g.stroke(); } }
    // hatchlings dash to the water
    if (s > 0.45 && s < 1.9) for (let k = 0; k < 3; k++) {
      const kk = clamp((s - 0.5 - k * 0.12) / 1.1), x = NEST[0] - 40 + k * 44 + kk * (k - 1) * 30, y = NEST[1] - 20 - kk * 230;
      if (kk < 1) turtle(g, x, y, (k - 1) * 0.2, 0.21, Math.floor(s * 10) % 2 ? 0.3 : -0.2);
    }
    // the journey: gold stones mark the route behind the turtle
    const u = s < 1.7 ? -1 : s < 3.3 ? lerp(0, 0.55, E.ioS(P(s, 1.7, 3.3))) : s < 5.1 ? lerp(0.55, 0.75, P(s, 3.4, 5.1)) : lerp(0.75, 1, E.ioS(P(s, 5.2, 6.2)));
    if (u >= 0) {
      g.fillStyle = PAL.gold;
      for (let k = 0; k <= 60; k++) { const q = k / 60; if (q > u - 0.03) break; const p = SH.catmull(PATH, q); g.beginPath(); g.arc(p[0], p[1], 9, 0, TAU); g.fill(); }
    }
    // medallion: the Earth with its magnetic field lines
    const km = E.outBack(P(s, 3.4, 3.8), 1.3);
    if (km > 0) {
      g.save(); g.translate(760, 250); g.scale(km, km);
      g.fillStyle = PAL.sea; g.beginPath(); g.arc(0, 0, 160, 0, TAU); g.fill();
      g.fillStyle = PAL.green; for (const [bx, by, rx, ry, a] of [[-60, -30, 70, 50, 0.4], [50, 55, 58, 76, -0.3], [62, -78, 40, 28, 0.2]]) { g.beginPath(); g.ellipse(bx, by, rx, ry, a, 0, TAU); g.fill(); }
      g.strokeStyle = PAL.gold; g.lineWidth = 12;
      const pulse = 0.5 + 0.5 * Math.sin(TAU * 1.5 * s);
      for (const rx of [60, 120]) { g.strokeStyle = pulse > 0.5 ? PAL.gold : PAL.seaL; g.beginPath(); g.ellipse(0, 0, rx, 150, 0, 0, TAU); g.stroke(); }
      g.globalAlpha = 1; g.lineWidth = 22; g.strokeStyle = PAL.gold; g.beginPath(); g.arc(0, 0, 166, 0, TAU); g.stroke();
      g.lineWidth = 10; g.strokeStyle = PAL.black; g.beginPath(); g.arc(0, 0, 182, 0, TAU); g.stroke();
      g.restore();
    }
    // the turtle grows on its way out and comes home
    if (u >= 0) {
      const q = Math.max(0.001, u), p = SH.catmull(PATH, q), p2 = SH.catmull(PATH, Math.min(1, q + 0.01)), p0 = SH.catmull(PATH, Math.max(0, q - 0.01));
      const ang = Math.atan2(p2[1] - p0[1], p2[0] - p0[0]) + Math.PI / 2, sc = lerp(0.16, 0.95, E.outQ(clamp(u / 0.5)));
      const flap = Math.sin(t * 7) * 0.25;
      turtle(g, p[0], p[1], u >= 1 ? -0.6 : ang, sc, u >= 1 ? 0 : flap);
      if (km > 0 && s < 5.4) { g.save(); g.translate(p[0] + 120, p[1] - 60); g.rotate(-0.7 + 0.1 * Math.sin(TAU * s)); g.fillStyle = PAL.gold; g.beginPath(); g.moveTo(0, -46); g.lineTo(16, 10); g.lineTo(0, 0); g.lineTo(-16, 10); g.closePath(); g.fill(); g.strokeStyle = PAL.black; g.lineWidth = 8; g.stroke(); g.restore(); }
    }
  }

  SH.register({
    id: '25', w: 1080, h: 1920, duration: 8, fps: 30, poster: 6.5,
    fonts: ['700 80px "Cinzel"'],
    init(g, W, H) {
      // tile colour strings: three tones per stone, four glints for gold
      S.styles = NAMES.map(k => [0.9, 1, 1.09].map(f => { const [r, gg, b] = SH.hex2rgb(PAL[k]); return `rgb(${Math.min(255, r * f) | 0},${Math.min(255, gg * f) | 0},${Math.min(255, b * f) | 0})`; }));
      S.goldGlint = ['#C99A33', '#D9A93B', '#ECC461', '#FFF0B0'];
      // ---- static parts: grout, zigzag border, inscription
      const st = SH.canvas(W, H), b = st.g;
      b.fillStyle = '#B9AE9B'; b.fillRect(0, 0, W, H);
      b.globalCompositeOperation = 'soft-light'; b.globalAlpha = 0.8; b.fillStyle = b.createPattern(SH.grain(256, 2501, { fibres: 0, fine: 40, mottle: 30, cell: 12 }), 'repeat'); b.fillRect(0, 0, W, H);
      b.globalCompositeOperation = 'source-over'; b.globalAlpha = 1;
      const DARK = [NAMES.indexOf('black'), NAMES.indexOf('brownD')];
      const staticRegion = (reg, seed, draw, text = false) => {
        const cv = SH.canvas(reg.cols * SS, reg.rows * SS), q = cv.g;
        q.scale((reg.cols * SS) / reg.w, (reg.rows * SS) / reg.h); draw(q);
        const cols = sample(cv.c, reg, text ? DARK : null, 7);
        paintTiles(b, grid(reg, seed), cols, 0, null);
        return grid(reg, seed);
      };
      const bands = [{ x: 0, y: 0, w: 1080, h: 40, cols: 108, rows: 4 }, { x: 0, y: 1880, w: 1080, h: 40, cols: 108, rows: 4 }, { x: 0, y: 40, w: 40, h: 1840, cols: 4, rows: 184 }, { x: 1040, y: 40, w: 40, h: 1840, cols: 4, rows: 184 }];
      S.relief = [];
      bands.forEach((reg, i) => S.relief.push(...staticRegion(reg, 2510 + i, q => {
        q.fillStyle = PAL.cream; q.fillRect(0, 0, reg.w, reg.h);
        q.fillStyle = PAL.black; const horiz = reg.w > reg.h;
        if (horiz) { q.fillRect(0, 0, reg.w, 10); q.fillRect(0, reg.h - 10, reg.w, 10); q.strokeStyle = PAL.terra; q.lineWidth = 10; q.beginPath(); for (let x = 0; x <= reg.w; x += 20) q.lineTo(x, (x / 20) % 2 ? 12 : 28); q.stroke(); }
        else { q.fillRect(0, 0, 10, reg.h); q.fillRect(reg.w - 10, 0, 10, reg.h); q.strokeStyle = PAL.terra; q.lineWidth = 10; q.beginPath(); for (let y = 0; y <= reg.h; y += 20) q.lineTo((y / 20) % 2 ? 12 : 28, y); q.stroke(); }
      })));
      const TITLE = { x: 40, y: 40, w: 1000, h: 360, cols: 125, rows: 45 };
      S.relief.push(...staticRegion(TITLE, 2520, q => {
        q.fillStyle = PAL.cream; q.fillRect(0, 0, TITLE.w, TITLE.h);
        q.fillStyle = PAL.terra; q.fillRect(0, 16, TITLE.w, 16); q.fillRect(0, TITLE.h - 32, TITLE.w, 16);
        q.fillStyle = PAL.black; q.fillRect(0, TITLE.h - 10, TITLE.w, 10);
        q.font = '700 78px "Cinzel"'; q.textAlign = 'center'; q.fillStyle = PAL.black; q.strokeStyle = PAL.black; q.lineWidth = 3; q.lineJoin = 'round';
        for (const [str, y] of [['DENİZ KAPLUMBAĞASI', 160], ['YUVAYA NASIL DÖNER?', 272]]) { q.strokeText(str, 500, y, 930); q.fillText(str, 500, y, 930); }
        q.fillStyle = PAL.gold; for (const x of [44, 956]) { q.beginPath(); q.moveTo(x, 196); q.lineTo(x + 18, 214); q.lineTo(x, 232); q.lineTo(x - 18, 214); q.closePath(); q.fill(); }
      }, true));
      S.static = st.c;
      // ---- dynamic regions
      S.main = grid(MAIN, 2530); S.cap = grid(CAP, 2531, 1.6);
      S.relief.push(...S.main, ...S.cap);
      S.sc = SH.canvas(MAIN.cols * SS, MAIN.rows * SS);
      // caption states (blank + four captions), sampled once
      S.capCols = [null, ...CAPTIONS].map(lines => {
        const cv = SH.canvas(CAP.cols * SS, CAP.rows * SS), q = cv.g;
        q.scale((CAP.cols * SS) / CAP.w, (CAP.rows * SS) / CAP.h);
        q.fillStyle = PAL.cream; q.fillRect(0, 0, CAP.w, CAP.h);
        q.fillStyle = PAL.black; q.fillRect(0, 0, CAP.w, 8);
        if (lines) { q.font = '700 78px "Cinzel"'; q.textAlign = 'center'; q.fillStyle = PAL.brownD; q.strokeStyle = PAL.brownD; q.lineWidth = 2.5; q.lineJoin = 'round'; for (const [str, y] of [[lines[0], (CAP.h / CAP.rows) * 15], [lines[1], (CAP.h / CAP.rows) * 29]]) { q.strokeText(str, 500, y, 960); q.fillText(str, 500, y, 960); } }
        return sample(cv.c, CAP, [NAMES.indexOf('black'), NAMES.indexOf('brownD')], 7);
      });
      // relief: each tile slightly domed (light top-left, shade bottom-right)
      const rl = SH.canvas(W, H), r = rl.g;
      for (const tl of S.relief) {
        const gr = r.createLinearGradient(tl.x, tl.y, tl.x + tl.w, tl.y + tl.h);
        gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.5, 'rgba(128,128,128,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.5)');
        r.fillStyle = gr; r.fillRect(tl.x, tl.y, tl.w, tl.h);
      }
      S.reliefC = rl.c;
    },
    frame(g, t, W, H) {
      g.drawImage(S.static, 0, 0);
      const render = s => { const q = S.sc.g; q.setTransform((MAIN.cols * SS) / MAIN.w, 0, 0, (MAIN.rows * SS) / SCENE_H, 0, 0); q.globalAlpha = 1; scene(q, s, t); return sample(S.sc.c, MAIN); };
      const tr = P(t, 6.85, 7.95);
      if (tr <= 0) {
        paintTiles(g, S.main, render(t), t, null);
        // caption: a quick flip wave whenever it changes
        let ci = 0; for (let k = 0; k < 4; k++) if (t >= CAP_T[k]) ci = k + 1;
        const tc = CAP_T[ci - 1] ?? -9, prev = Math.max(0, ci - 1);
        paintTiles(g, S.cap, S.capCols[ci], t, (tl, n) => { const f = clamp((t - tc - (tl.i / CAP.cols) * 0.3) / 0.16); return [f < 0.5 ? S.capCols[prev][n] : S.capCols[ci][n], Math.abs(Math.cos(Math.PI * f))]; });
      } else {                                                    // every tile flips back to the opening picture in a diagonal wave
        const endC = render(6.85), startC = render(0);
        const flip = (cols0, cols1, reg) => (tl, n) => { const d = ((tl.x - reg.x) / reg.w + (tl.y - 400) / 1480) * 0.32, f = clamp((t - 6.85 - d) / 0.34); return [f < 0.5 ? cols0[n] : cols1[n], Math.abs(Math.cos(Math.PI * f))]; };
        paintTiles(g, S.main, endC, t, flip(endC, startC, MAIN));
        paintTiles(g, S.cap, S.capCols[4], t, flip(S.capCols[4], S.capCols[0], CAP));
      }
      g.save(); g.globalCompositeOperation = 'soft-light'; g.drawImage(S.reliefC, 0, 0); g.restore();
    },
  });
})();
