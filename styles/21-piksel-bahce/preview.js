'use strict';
/* 21 · Piksel Bahçe — an original retro pixel-art scene: a 180×320 canvas scaled ×6 with hard pixels, a small fixed
   palette, ordered (Bayer) dithering for skies and water, 1-px dark outlines, sprites animated at 6–8 fps, a typed
   dialog box and a stage bar. The life cycle plays like a tiny game level; a diamond wipe resets it. */
(() => {
  const { E, P, clamp, lerp, stepT } = SH;
  const LW = 180, LH = 320, K = 6;
  const C = {
    ink: '#1B1B2F', white: '#FFFFFF', sky0: '#6EC1F0', sky1: '#9AD6F7', sky2: '#C8ECFF', sun: '#FFE27A', sunD: '#FFC23D',
    hill0: '#5DBB63', hill1: '#3E8E4A', reed: '#7DA83A', reedD: '#55772A', cat: '#7B4A2A',
    w0: '#47B0DC', w1: '#3A93C8', w2: '#2C76B0', w3: '#225A93', w4: '#1C467A', foam: '#E6F8FF',
    sand0: '#E9C46A', sand1: '#CFA24E', weed: '#2E9B5F', weedD: '#1F7046', pad: '#4CAF50', padD: '#2E7D32', padL: '#8BD46E',
    pink: '#FF8FB1', yellow: '#FFD54F', red: '#FF6B6B', panel: '#2A2F55', grey: '#6C7090',
    green: '#7AC74F', greenD: '#4E9A2E', belly: '#D9F2A0', tad: '#3C3A4A', tadL: '#6E6A80', jelly: '#BDEBFA',
  };
  const S = {};
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
  const rgbOf = SH.hex2rgb;

  // ---- pixel tools ------------------------------------------------------------------------------------------
  function sprite(w, h, palette, draw, outline = C.ink) {    // vector drawing → hard pixels snapped to a palette + 1-px outline
    const { c, g } = SH.canvas(w, h);
    draw(g);
    const img = g.getImageData(0, 0, w, h), d = img.data, pal = palette.map(rgbOf), solid = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      if (d[i * 4 + 3] < 110) { d[i * 4 + 3] = 0; continue; }
      let best = 0, bd = 1e9;
      for (let k = 0; k < pal.length; k++) { const p = pal[k], e = (d[i * 4] - p[0]) ** 2 + (d[i * 4 + 1] - p[1]) ** 2 + (d[i * 4 + 2] - p[2]) ** 2; if (e < bd) { bd = e; best = k; } }
      d[i * 4] = pal[best][0]; d[i * 4 + 1] = pal[best][1]; d[i * 4 + 2] = pal[best][2]; d[i * 4 + 3] = 255; solid[i] = 1;
    }
    if (outline) {
      const o = rgbOf(outline);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (solid[i]) continue;
        if ((x > 0 && solid[i - 1]) || (x < w - 1 && solid[i + 1]) || (y > 0 && solid[i - w]) || (y < h - 1 && solid[i + w])) { d[i * 4] = o[0]; d[i * 4 + 1] = o[1]; d[i * 4 + 2] = o[2]; d[i * 4 + 3] = 255; }
      }
    }
    g.putImageData(img, 0, 0);
    return c;
  }
  const _txt = new Map();
  function ptext(str, size, col, o = {}) {                     // Press Start 2P rasterised to hard pixels, optional outline + shadow
    const key = `${str}|${size}|${col}|${o.outline}|${o.shadow}`;
    if (_txt.has(key)) return _txt.get(key);
    const m = SH.canvas(4, 4).g; m.font = `400 ${size}px "Press Start 2P"`;
    const w = Math.ceil(m.measureText(str).width) + 4, h = size * 2 + 4;
    // the font squeezes accented capitals to lowercase height; draw the plain capital and add the accent above it
    const ACC = { 'İ': ['I', 'dot'], 'Ö': ['O', 'dia'], 'Ü': ['U', 'dia'], 'Ğ': ['G', 'breve'] }, sc = size / 8, base = Math.round(size * 1.25);
    const capTop = base - 7 * sc;
    const cv = sprite(w, h + 2 * sc, [col], g => {
      g.translate(0, 2 * sc); g.font = `400 ${size}px "Press Start 2P"`; g.fillStyle = col;
      Array.from(str).forEach((ch, i) => {
        const x = 2 + i * size, a = ACC[ch];
        g.fillText(a ? a[0] : ch, x, base);
        if (!a) return;
        const y = capTop - 2 * sc;
        if (a[1] === 'dot') g.fillRect(x + 3 * sc, y, 2 * sc, sc);
        if (a[1] === 'dia') { g.fillRect(x + sc, y, 2 * sc, sc); g.fillRect(x + 4 * sc, y, 2 * sc, sc); }
        if (a[1] === 'breve') { g.fillRect(x + sc, y - sc, sc, sc); g.fillRect(x + 5 * sc, y - sc, sc, sc); g.fillRect(x + 2 * sc, y, 3 * sc, sc); }
      });
    }, o.outline || null);
    let y0 = cv.height, y1 = 0;                                // trim to the inked rows
    const d = cv.getContext('2d').getImageData(0, 0, w, cv.height).data;
    for (let y = 0; y < cv.height; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3]) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const sh = o.shadow ? 1 : 0, out = SH.canvas(w + sh, y1 - y0 + 1 + sh);
    if (o.shadow) { out.g.globalCompositeOperation = 'source-over'; out.g.drawImage(cv, 0, y0, w, y1 - y0 + 1, 1, 1, w, y1 - y0 + 1); out.g.globalCompositeOperation = 'source-in'; out.g.fillStyle = o.shadow; out.g.fillRect(0, 0, w + 1, y1 - y0 + 2); out.g.globalCompositeOperation = 'source-over'; }
    out.g.drawImage(cv, 0, y0, w, y1 - y0 + 1, 0, 0, w, y1 - y0 + 1);
    const r = { c: out.c, w: out.c.width, h: out.c.height, adv: m.measureText(str).width, oy: y0 - 2 * sc - base };   // oy: top row relative to the baseline
    _txt.set(key, r);
    return r;
  }
  function dither(g, x0, y0, w, h, cols, tf) {                 // ordered dithering between palette steps
    const img = g.getImageData(x0, y0, w, h), d = img.data, rgb = cols.map(rgbOf), n = cols.length - 1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const v = clamp(tf(x0 + x, y0 + y)) * n;
      let i = Math.floor(v);
      if (v - i > BAYER[((y0 + y) & 3) * 4 + ((x0 + x) & 3)]) i++;
      const p = rgb[Math.min(n, i)], k = (y * w + x) * 4;
      d[k] = p[0]; d[k + 1] = p[1]; d[k + 2] = p[2]; d[k + 3] = 255;
    }
    g.putImageData(img, x0, y0);
  }
  const px = (g, x, y, col, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), w, h); };
  function blit(g, cv, x, y, flip = false) {
    x = Math.round(x); y = Math.round(y);
    if (!flip) { g.drawImage(cv, x, y); return; }
    g.save(); g.translate(x + cv.width, y); g.scale(-1, 1); g.drawImage(cv, 0, 0); g.restore();
  }
  function star(g, x, y, k) {                                  // 3-frame sparkle
    const f = Math.floor(k * 4);
    if (f <= 0 || f >= 4) return;
    const r = f === 2 ? 3 : 1, col = f === 2 ? C.white : C.yellow;
    px(g, x - r, y, col, r * 2 + 1, 1); px(g, x, y - r, col, 1, r * 2 + 1);
    if (f === 2) { px(g, x - 1, y - 1, C.yellow); px(g, x + 1, y + 1, C.yellow); px(g, x + 1, y - 1, C.yellow); px(g, x - 1, y + 1, C.yellow); }
  }

  // ---- characters ---------------------------------------------------------------------------------------------
  function tadpole(phase, legs = 0) {                           // head left; tail wiggles with the phase; legs: 0, 1 (back), 2 (all)
    const w = legs === 2 ? 26 : 24, h = 14;
    return sprite(w, h, [C.tad, C.tadL, C.white, C.green, C.greenD], g => {
      const by = 7;
      g.fillStyle = C.tadL; g.beginPath(); g.moveTo(9, by - 2.5);
      for (let i = 0; i <= 10; i++) { const x = 9 + i * 1.3, y = by + Math.sin(phase + i * 0.7) * (i * 0.28); g.lineTo(x, y - (2.6 - i * 0.22)); }
      for (let i = 10; i >= 0; i--) { const x = 9 + i * 1.3, y = by + Math.sin(phase + i * 0.7) * (i * 0.28); g.lineTo(x, y + (2.6 - i * 0.22)); }
      g.closePath(); g.fill();
      if (legs >= 1) { g.fillStyle = C.greenD; g.fillRect(10, by + 2, 2, 4); g.fillRect(9, by + 5, 4, 1.5); }
      if (legs >= 2) { g.fillStyle = C.greenD; g.fillRect(4, by + 3, 1.6, 3); g.fillRect(3, by + 5, 3, 1.4); }
      g.fillStyle = legs >= 2 ? C.greenD : C.tad; g.beginPath(); g.ellipse(7, by, legs >= 2 ? 6.2 : 5.6, legs >= 2 ? 4.4 : 4.2, 0, 0, 6.283); g.fill();
      g.fillStyle = C.white; g.fillRect(3, by - 2, 2, 2);
    });
  }
  function frog(blink = false) {                               // sitting, facing left
    return sprite(32, 24, [C.green, C.greenD, C.belly, C.white, C.ink, C.pink], g => {
      g.fillStyle = C.greenD; g.beginPath(); g.ellipse(22, 17, 7, 5, -0.2, 0, 6.283); g.fill();             // back leg
      g.fillRect(14, 21, 11, 2);                                                                              // back foot
      g.fillStyle = C.green; g.beginPath(); g.ellipse(17, 14, 11, 7, -0.25, 0, 6.283); g.fill();            // body
      g.beginPath(); g.ellipse(10, 11, 8, 5.5, 0, 0, 6.283); g.fill();                                        // head
      g.beginPath(); g.arc(10, 6, 3.6, 0, 6.283); g.fill();                                                    // eye bump
      g.fillStyle = C.belly; g.beginPath(); g.ellipse(11, 16, 6.5, 3.2, -0.2, 0, 6.283); g.fill();
      g.fillStyle = C.greenD; g.fillRect(6, 17, 2, 5); g.fillRect(4, 21, 5, 2);                               // front leg
      for (const [x, y] of [[19, 10], [23, 12], [21, 14]]) g.fillRect(x, y, 2, 2);                           // spots
      if (blink) { g.fillStyle = C.greenD; g.fillRect(8, 5, 5, 2); }
      else { g.fillStyle = C.white; g.fillRect(8, 4, 4, 4); g.fillStyle = C.ink; g.fillRect(8, 5, 2, 2); }
      g.fillStyle = C.ink; g.fillRect(3, 12, 7, 1);                                                           // mouth
      g.fillStyle = C.pink; g.fillRect(9, 13, 2, 1);
    });
  }
  const egg = (k) => sprite(8, 8, [C.jelly, C.ink, C.white], g => { g.fillStyle = C.jelly; g.beginPath(); g.arc(4, 4, 3.2, 0, 6.283); g.fill(); g.fillStyle = C.white; g.fillRect(2, 2, 1, 1); g.fillStyle = C.ink; g.fillRect(k ? 4 : 3, 3, 2, 2); }, '#5C8FB0');

  SH.register({
    id: '21', w: 1080, h: 1920, duration: 8, fps: 30, poster: 6.6,
    fonts: ['400 16px "Press Start 2P"'],
    init(g, W, H) {
      // ---- static background: dithered sky, sun, hills, reeds, water, light shafts, sand, lily pads
      const bg = SH.canvas(LW, LH), b = bg.g;
      dither(b, 0, 0, LW, 150, [C.sky0, C.sky1, C.sky2], (x, y) => y / 150);
      b.fillStyle = C.sunD; b.beginPath(); b.arc(150, 62, 11, 0, 6.283); b.fill();
      b.fillStyle = C.sun; b.beginPath(); b.arc(150, 62, 9, 0, 6.283); b.fill();
      const hill = (yb, amp, f, ph, col) => { b.fillStyle = col; for (let x = 0; x < LW; x++) { const y = Math.round(yb - amp * (0.5 + 0.5 * Math.sin(x * f + ph)) - amp * 0.3 * Math.sin(x * f * 2.7 + ph)); b.fillRect(x, y, 1, 151 - y); } };
      hill(138, 14, 0.035, 0.6, C.hill0); hill(147, 9, 0.06, 2.1, C.hill1);
      dither(b, 0, 150, LW, 140, [C.w0, C.w1, C.w2, C.w3, C.w4], (x, y) => (y - 150) / 140 - (((x + (y - 150) * 0.55) % 46) < 9 ? 0.18 : 0));
      b.fillStyle = C.sand1; b.fillRect(0, 286, LW, 34);
      for (let x = 0; x < LW; x++) { const y = 283 + Math.round(2 * Math.sin(x * 0.15) + Math.sin(x * 0.41)); b.fillStyle = C.sand0; b.fillRect(x, y, 1, 3); b.fillStyle = C.sand1; b.fillRect(x, y + 3, 1, 37); }
      for (const [x, y, w] of [[20, 288, 5], [64, 289, 3], [112, 287, 6], [150, 289, 4]]) { b.fillStyle = '#9C8A6E'; b.fillRect(x, y, w, 2); b.fillStyle = '#C9B48C'; b.fillRect(x + 1, y, w - 2, 1); }
      const reed = (x, top, lean) => { for (let y = top; y < 200; y++) { const xx = x + Math.round(((200 - y) / 100) * lean); b.fillStyle = C.reedD; b.fillRect(xx, y, 2, 1); b.fillStyle = C.reed; b.fillRect(xx, y, 1, 1); } const xx = x + Math.round(((200 - top) / 100) * lean); b.fillStyle = C.cat; b.fillRect(xx - 1, top - 9, 4, 10); b.fillStyle = '#A0683E'; b.fillRect(xx, top - 8, 1, 7); b.fillStyle = C.reedD; b.fillRect(xx, top - 13, 2, 4); };
      reed(14, 104, 2); reed(22, 116, -3); reed(30, 98, 1); reed(162, 110, -2); reed(170, 120, 2);
      const pad = (cx, cy, rx, ry, seed) => { b.fillStyle = C.ink; b.beginPath(); b.ellipse(cx, cy, rx + 1, ry + 1, 0, 0, 6.283); b.fill(); b.fillStyle = C.padD; b.beginPath(); b.ellipse(cx, cy, rx, ry, 0, 0, 6.283); b.fill(); b.fillStyle = C.pad; b.beginPath(); b.ellipse(cx, cy - 1, rx - 1, ry - 1, 0, 0, 6.283); b.fill(); b.fillStyle = C.padL; b.fillRect(cx - rx + 4, cy - ry + 1, 5, 1); b.fillStyle = C.w0; b.beginPath(); b.moveTo(cx, cy); b.lineTo(cx + rx + 2, cy - 2); b.lineTo(cx + rx + 2, cy + 2); b.fill(); };
      pad(124, 150, 18, 4, 1); pad(52, 151, 11, 3, 2);
      b.fillStyle = C.ink; b.fillRect(46, 143, 9, 6); b.fillStyle = C.pink; b.fillRect(47, 144, 7, 4); b.fillStyle = C.white; b.fillRect(49, 143, 3, 2); b.fillStyle = C.yellow; b.fillRect(50, 145, 1, 1);
      S.bg = bg.c;
      // the drawing surface (low resolution) and the title
      S.L = SH.canvas(LW, LH);
      S.title1 = ptext('KURBAĞA', 16, C.yellow, { outline: C.ink, shadow: C.ink });
      S.title2 = ptext('NASIL BÜYÜR?', 8, C.white, { outline: C.ink });
      // characters
      S.tad = [0, 1, 2, 3].map(f => tadpole(f * 1.57, 0));
      S.tadL = [0, 1, 2, 3].map(f => tadpole(f * 1.57, 1));
      S.tadF = [0, 1, 2, 3].map(f => tadpole(f * 1.57, 2));
      S.frog = frog(false); S.frogB = frog(true);
      S.egg = [egg(0), egg(1)];
      S.eggs = [[40, 172], [47, 169], [44, 176], [51, 175], [38, 179], [48, 181], [55, 170]];
      S.icons = [egg(0), sprite(14, 8, [C.tad, C.tadL, C.white], g => { g.fillStyle = C.tadL; g.fillRect(6, 3, 6, 2); g.fillStyle = C.tad; g.beginPath(); g.arc(4.5, 4, 3, 0, 6.283); g.fill(); }), sprite(14, 10, [C.tad, C.tadL, C.greenD], g => { g.fillStyle = C.tadL; g.fillRect(6, 3, 6, 2); g.fillStyle = C.greenD; g.fillRect(6, 5, 2, 3); g.fillStyle = C.tad; g.beginPath(); g.arc(4.5, 4, 3, 0, 6.283); g.fill(); }), sprite(14, 11, [C.green, C.greenD, C.white, C.ink], g => { g.fillStyle = C.green; g.beginPath(); g.ellipse(7, 6.5, 5.5, 3.5, 0, 0, 6.283); g.fill(); g.fillRect(3, 2, 3, 3); g.fillRect(8, 2, 3, 3); g.fillStyle = C.white; g.fillRect(4, 2, 1, 1); g.fillRect(9, 2, 1, 1); })];
      S.lines = [['1. YUMURTA', 'SUYA BIRAKILIR'], ['2. İRİBAŞ', 'KUYRUKLA YÜZER'], ['3. BACAKLAR', 'ÖNCE ARKA BACAKLAR'], ['4. KURBAĞA!', 'KUYRUK KAYBOLUR!']].map(pair => pair.map(s => ({ sp: ptext(s, 8, C.white), n: Array.from(s).length })));
      S.hud = ptext('BÜYÜME', 8, C.yellow);
      S.virak = ptext('VIRAK!', 8, C.ink);
      // swim paths (low-res coordinates of the sprite's head)
      S.path2 = SH.catmullPts([[46, 176], [64, 194], [88, 212], [112, 222], [132, 212], [128, 196], [106, 190], [90, 200]], 80);
      S.path3 = SH.catmullPts([[90, 200], [80, 214], [94, 230], [120, 228], [138, 208], [130, 188]], 70);
      S.path4 = SH.catmullPts([[130, 188], [126, 176], [121, 165]], 20);
    },
    frame(g, t, W, H) {
      const L = S.L.g;
      L.setTransform(1, 0, 0, 1, 0, 0); L.globalAlpha = 1; L.globalCompositeOperation = 'source-over'; L.imageSmoothingEnabled = false;
      const tw = t >= 7.475 ? t - 7.475 - 0.525 : t;           // the wipe resets the level halfway: tw runs on from the start state
      scene(L, t, tw < 0 ? 0 : tw);
      wipe(L, t);
      g.imageSmoothingEnabled = false;
      g.drawImage(S.L.c, 0, 0, LW, LH, 0, 0, LW * K, LH * K);
    },
  });

  function scene(L, t, s) {
    // background + loop-safe ambient motion (all periods divide 8 s)
    L.drawImage(S.bg, 0, 0);
    const step = stepT(t, 6);
    for (const [x0, y0, w] of [[18, 66, 26], [92, 84, 20]]) {
      const x = x0 + Math.round(3 * Math.sin((2 * Math.PI * t) / 8));
      px(L, x + 3, y0, C.white, w - 6, 3); px(L, x, y0 + 3, C.white, w, 4); px(L, x + 6, y0 - 3, C.white, w - 14, 3); px(L, x + 1, y0 + 7, '#D6EAF5', w - 2, 1);
    }
    const sh = Math.floor(step * 6) % 16;
    for (let x = 0; x < LW; x++) { if (((x + sh) % 16) < 5) px(L, x, 150, C.foam); if (((x - sh + 64) % 16) < 2) px(L, x, 152, C.sky2); }
    for (let i = 0; i < 6; i++) {                                // bubbles: 3 trips in 8 s
      const ph = ((t * 3) / 8 + i / 6) % 1, x = 18 + i * 29 + Math.round(2 * Math.sin(ph * 12 + i)), y = Math.round(286 - ph * 128);
      if (y < 156) continue;
      px(L, x, y - 1, C.foam, 2, 1); px(L, x - 1, y, C.foam, 1, 2); px(L, x + 2, y, C.foam, 1, 2); px(L, x, y + 2, C.foam, 2, 1);
    }
    for (const [x0, hgt, ph] of [[10, 34, 0], [26, 22, 1], [70, 28, 2], [142, 40, 3], [160, 26, 4]]) for (let i = 0; i < hgt; i++) {
      const x = x0 + Math.round(2 * Math.sin(i * 0.25 + ph + Math.PI * step) * (i / hgt));
      px(L, x, 284 - i, i % 4 < 2 ? C.weed : C.weedD, 2, 1);
    }
    // title
    L.drawImage(S.title1.c, Math.round((LW - S.title1.w) / 2), 8);
    L.drawImage(S.title2.c, Math.round((LW - S.title2.w) / 2), 30);
    // ---- the level (s = level clock; restarts after the wipe)
    const stage = s < 2.1 ? 0 : s < 3.8 ? 1 : s < 5.2 ? 2 : 3;
    // eggs: pop in one by one, wiggle, hatch
    if (s < 2.25) S.eggs.forEach(([x, y], i) => { if (s > 0.5 + i * 0.09) blit(L, S.egg[(Math.floor(stepT(s, 4) * 4) + i) % 2], x - 4, y - 4); });
    star(L, 47, 175, P(s, 2.05, 2.35));
    const wig = Math.floor(stepT(s, 8) * 8) % 4;
    let cx = 0, cy = 0, face = false;
    const follow = (path, u) => { const p = SH.catmull(path, u), q = SH.catmull(path, Math.min(1, u + 0.02)); cx = p[0]; cy = p[1]; face = q[0] > p[0] + 0.05; };
    if (s >= 2.1 && s < 5.6) {
      if (s < 3.8) follow(S.path2, E.ioS(P(s, 2.1, 3.8)));
      else if (s < 5.2) follow(S.path3, E.ioS(P(s, 3.8, 5.2)));
      else follow(S.path4, E.outQ(P(s, 5.2, 5.6)));
      const spr = s < 3.8 ? S.tad[wig] : s < 4.6 ? S.tadL[wig] : S.tadF[wig];
      blit(L, spr, face ? cx - spr.width + 6 : cx - 6, cy - 7, face);
    }
    star(L, Math.round(cx), Math.round(cy) - 9, P(s, 3.8, 4.1)); star(L, Math.round(cx) + 8, Math.round(cy) + 6, P(s, 4.6, 4.9));
    // the frog leaps onto the lily pad
    if (s >= 5.6) {
      const u = P(s, 5.6, 6.0), x = lerp(112, 110, u), y = lerp(150, 126, u) - 22 * 4 * u * (1 - u);
      const blink = s > 6.5 && s < 6.62;
      if (u < 1) { L.save(); L.beginPath(); L.rect(0, 0, LW, 151); L.clip(); blit(L, S.frog, x, y); L.restore(); }
      else blit(L, blink ? S.frogB : S.frog, 110, 126);
      for (let i = 0; i < 6; i++) {                              // splashes: at take-off and at landing
        for (const [t0, sx] of [[5.6, 118], [6.0, 122]]) {
          const k = P(s, t0, t0 + 0.35);
          if (k <= 0 || k >= 1) continue;
          const vx = (i - 2.5) * 6, x2 = sx + vx * k, y2 = 149 - 22 * k + 30 * k * k;
          px(L, x2, y2, i % 2 ? C.foam : C.white, 2, 2);
        }
      }
      if (s > 6.15 && s < 6.95) {                                 // speech bubble
        const bx = 58, by = 104, n = Math.min(6, Math.floor((s - 6.15) * 30));
        px(L, bx, by, C.ink, 58, 16); px(L, bx + 1, by + 1, C.white, 56, 14); px(L, bx + 46, by + 16, C.ink, 6, 2); px(L, bx + 48, by + 15, C.white, 3, 2); px(L, bx + 50, by + 18, C.ink, 3, 2);
        L.save(); L.beginPath(); L.rect(bx + 5, by, 6 * 8 * (n / 6) + 1, 16); L.clip(); L.drawImage(S.virak.c, bx + 5, by + 4); L.restore();
      }
    }
    // dialog box with typed text
    const kb = P(s, 0.45, 0.6);
    if (kb > 0) {
      const hh = Math.round(36 * kb), y0 = 252 + Math.round((36 - hh) / 2);
      px(L, 3, y0, C.white, 174, hh); px(L, 4, y0 + 1, C.ink, 172, hh - 2); if (hh > 4) { px(L, 5, y0 + 2, C.grey, 170, 1); px(L, 5, y0 + hh - 3, C.grey, 170, 1); }
      if (kb >= 1) {
        const t0 = [0.7, 2.25, 3.95, 5.3][stage], lines = S.lines[stage];
        let n = Math.floor((s - t0) * 30);
        lines.forEach((ln, li) => {
          const vis = clamp(n, 0, ln.n); n -= ln.n;
          if (vis <= 0) return;
          const x = 8, base = 268 + li * 13;
          L.save(); L.beginPath(); L.rect(x, base - 12, 2 + vis * 8, 16); L.clip(); L.drawImage(ln.sp.c, x, base + ln.sp.oy); L.restore();
        });
        if (n > 4 && Math.floor(s * 4) % 2 === 0) { px(L, 166, 280, C.yellow, 5, 1); px(L, 167, 281, C.yellow, 3, 1); px(L, 168, 282, C.yellow, 1, 1); }
      }
    }
    // stage bar
    px(L, 0, 292, C.ink, LW, 28); px(L, 0, 292, C.grey, LW, 1);
    L.drawImage(S.hud.c, 6, 302);
    const lit = [0.8, 2.25, 3.95, 5.3];
    for (let i = 0; i < 4; i++) {
      const x = 62 + i * 29, on = s >= lit[i];
      px(L, x, 297, on ? C.yellow : C.grey, 24, 18); px(L, x + 1, 298, on ? C.panel : C.ink, 22, 16);
      L.save(); L.globalAlpha = on ? 1 : 0.35; const ic = S.icons[i]; L.drawImage(ic, x + 12 - Math.floor(ic.width / 2), 306 - Math.floor(ic.height / 2)); L.restore();
      if (i < 3) px(L, x + 24, 305, s >= lit[i + 1] ? C.yellow : C.grey, 5, 2);
    }
  }

  function wipe(L, t) {                                          // diamonds grow along the diagonal, then shrink away
    const close = P(t, 7.0, 7.45), open = P(t, 7.5, 7.95);
    if (close <= 0 || open >= 1) return;
    const cell = 12;
    L.fillStyle = C.ink;
    for (let gy = 0; gy <= LH / cell; gy++) for (let gx = 0; gx <= LW / cell; gx++) {
      const delay = (gx + gy) / (LW / cell + LH / cell);
      const k = open > 0 ? 1 - clamp(open * 1.6 - delay * 0.6) : clamp(close * 1.6 - delay * 0.6);
      const r = Math.round(k * cell);
      if (r <= 0) continue;
      const cx = gx * cell + cell / 2, cy = gy * cell + cell / 2;
      for (let dy = -r; dy <= r; dy++) { const hw = r - Math.abs(dy); L.fillRect(cx - hw, cy + dy, hw * 2 + 1, 1); }
    }
  }
})();
