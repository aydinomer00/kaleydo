'use strict';
/* Video · Google'da arayınca neler oluyor? (30 sn, 9:16) — stil 17 · Doğa Defteri.
   Üç defter sayfası: örümcek botlar ve dizin → soru veri merkezine gider, sonuçlar sıralanır → ana fikir ve kapanış.
   Yardımcılar styles/17-doga-defteri/preview.js dosyasından alındı. */
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

  // ---- video: "Google'da arayınca neler oluyor?" (30 s, three notebook pages) ----------------------------------
  const FLIPS = [[12.3, 13.4], [22.6, 23.6], [28.9, 30.0]];
  const NODES = [[160, 740], [370, 670], [575, 790], [800, 690], [410, 920], [690, 940]];
  const LINKS = [[0, 1], [1, 2], [2, 3], [1, 4], [2, 5], [4, 5], [3, 5]];
  const BOT_PATH = [0, 1, 2, 5, 3];
  const SLOT_Y = [1170, 1270, 1370];

  function pageIcon(x, y, seed) {                         // a sketched web page: sheet with folded corner and lines
    const w = 86, h = 104, x0 = x - w / 2, y0 = y - h / 2;
    return {
      outline: [[x0, y0], [x0 + w - 22, y0], [x0 + w, y0 + 22], [x0 + w, y0 + h], [x0, y0 + h], [x0, y0]],
      fold: [[x0 + w - 22, y0], [x0 + w - 22, y0 + 22], [x0 + w, y0 + 22]],
      lines: [0, 1, 2, 3].map(k => [[x0 + 14, y0 + 40 + k * 16], [x0 + w - (k === 3 ? 40 : 16), y0 + 40 + k * 16]]),
      wash: washLayer(W0, H0, 0, 0, [[[x0 + 4, y0 + 4], [x0 + w - 4, y0 + 4], [x0 + w - 4, y0 + h - 4], [x0 + 4, y0 + h - 4]]], seed % 2 ? C.sea : C.sand, seed, { jit: 3, pools: 1, ew: 4, a: 0.55 }),
    };
  }
  let W0 = 1080, H0 = 1920;
  const plane = SH.pathFrom([[20, 0], [-16, -13], [-7, 0], [-16, 13]]);
  function slipCanvas(seed, col) {                         // a paper search-result slip
    const { c, g } = SH.canvas(440, 92), R = rng(seed);
    g.fillStyle = '#FCF9F1'; g.fillRect(4, 4, 432, 84);
    g.globalCompositeOperation = 'soft-light'; g.globalAlpha = 0.5; g.fillStyle = g.createPattern(SH.grain(128, seed, { fibres: 60 }), 'repeat'); g.fillRect(4, 4, 432, 84);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    pencil(g, SH.jitterPts(SH.resample([[22, 30], [180 + R() * 120, 30]], 8), seed, 1.5, false), 1, 9, 0.9, seed);
    g.strokeStyle = col; g.globalAlpha = 0.85; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(22, 30); g.lineTo(150 + R() * 120, 30); g.stroke(); g.globalAlpha = 1;
    for (const [y, w] of [[54, 360], [72, 260 + R() * 80]]) pencil(g, SH.resample([[22, y], [22 + w, y]], 10), 1, 3, 0.75, seed + y);
    return c;
  }
  function robot(g, x, y, t, k) {                          // a tiny "crawler" spider-bot, pencil + blue wash
    if (k <= 0) return;
    g.save(); g.translate(x, y); g.globalAlpha *= clamp(k * 3);
    const step = Math.floor(SH.stepT(t, 8) * 8) % 2;
    g.strokeStyle = SH.pattern(g, S.lead); g.lineWidth = 3.4; g.lineCap = 'round';
    for (let i = 0; i < 3; i++) for (const s of [-1, 1]) { const a = s * (0.5 + i * 0.5) + (step ? 0.12 : -0.12) * s; g.beginPath(); g.moveTo(Math.cos(a) * 18 * s, Math.sin(a) * 10 + 8); g.lineTo(Math.cos(a) * 40 * s, Math.sin(a) * 18 + 22); g.stroke(); }
    g.fillStyle = rgba(C.blue, 0.75); g.beginPath(); g.ellipse(2, 4, 26, 22, 0, 0, 6.283); g.fill();
    g.strokeStyle = SH.pattern(g, S.lead); g.lineWidth = 3; g.beginPath(); g.ellipse(0, 2, 26, 22, 0, 0, 6.283); g.stroke();
    g.beginPath(); g.moveTo(0, -20); g.lineTo(-4, -36); g.stroke(); g.fillStyle = C.rust; g.beginPath(); g.arc(-4, -38, 5, 0, 6.283); g.fill();
    g.fillStyle = '#FCF9F1'; for (const ex of [-9, 9]) { g.beginPath(); g.arc(ex, -2, 7, 0, 6.283); g.fill(); } g.fillStyle = '#1E1B1F'; for (const ex of [-8, 10]) { g.beginPath(); g.arc(ex, -1, 3.2, 0, 6.283); g.fill(); }
    g.restore();
  }
  const check = (x, y) => [[x - 14, y], [x - 4, y + 12], [x + 18, y - 16]];
  const ringAround = (cx, cy, rx, ry, seed) => Array.from({ length: 61 }, (_, i) => { const a = ((200 + i * 6.9) * Math.PI) / 180, rr = 1 + 0.07 * (i / 60) + 0.02 * SH.noise1(seed, i * 0.3); return [cx + Math.cos(a) * rx * rr, cy + Math.sin(a) * ry * rr]; });

  SH.register({
    id: 'google-arama', w: 1080, h: 1920, duration: 30, fps: 30, poster: 21.5,
    fonts: ['700 80px "Caveat"', '600 80px "Caveat"', '600 40px "Inter"'],
    init(g, W, H) {
      W0 = W; H0 = H;
      S.lead = leadTex(); S.gran = specks(1703, 1600, '#2A2230', 1.2); S.knock = specks(1704, 2600, '#000', 0.9);
      S.pagePath = SH.pathFrom(SH.rrect(PAGE.x, PAGE.y, PAGE.w, PAGE.h, 12, 1720, { jit: 0.2 }));
      const holes = HOLES.map(x => SH.pathFrom(SH.rrect(x - 7, AX - 11, 14, 22, 7, x, { jit: 0.1 })));
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
      S.tapeA = tapeCanvas(150, 42, C.mint, 1760, 'dots'); S.tapeB = tapeCanvas(170, 44, C.coral, 1761, 'stripe');
      // page 1 · crawler network and index card
      S.icons = NODES.map(([x, y], i) => pageIcon(x, y, 2100 + i));
      S.links = LINKS.map(([a, b], i) => SH.jitterPts(SH.resample([NODES[a], NODES[b]], 12), 2200 + i, 2.5, false));
      S.botRoute = SH.resample(BOT_PATH.map(i => NODES[i]), 6);
      const card = SH.canvas(470, 290), cc = card.g;
      cc.fillStyle = '#FCF9F1'; cc.fillRect(5, 5, 460, 280);
      cc.globalCompositeOperation = 'soft-light'; cc.globalAlpha = 0.5; cc.fillStyle = cc.createPattern(SH.grain(256, 2301, { fibres: 120 }), 'repeat'); cc.fillRect(5, 5, 460, 280);
      cc.globalCompositeOperation = 'source-over'; cc.globalAlpha = 1;
      cc.strokeStyle = 'rgba(194,85,58,0.55)'; cc.lineWidth = 2; cc.beginPath(); cc.moveTo(5, 66); cc.lineTo(465, 66); cc.stroke();
      cc.strokeStyle = 'rgba(47,76,134,0.18)'; cc.lineWidth = 1.5; for (let y = 120; y < 285; y += 56) { cc.beginPath(); cc.moveTo(5, y); cc.lineTo(465, y); cc.stroke(); }
      S.card = card.c;
      S.slips = [slipCanvas(2401, C.blue), slipCanvas(2402, C.rust), slipCanvas(2403, '#3E7D4C')];
      // handwriting
      S.date = leadText('10 Kasım', 50); S.place = leadText('masa başı', 50);
      S.t1 = inkText("Google'da arayınca", 104); S.t2 = inkText('neler oluyor?', 104);
      const red = (s, size = 62) => inkText(s, size, C.rust, 700), ink = (s, size = 52) => inkText(s, size, C.ink, 600);
      S.h1 = red('1. Örümcek botlar'); S.h2 = red('2. Dev bir dizin'); S.h3 = red('3. Soru yola çıkar'); S.h4 = red('4. En faydalısı üstte');
      S.n1 = [ink('sayfadan sayfaya,', 58), ink('linkleri izleyip gezer', 58)];
      S.cardTitle = inkText('DİZİN', 46, C.rust, 700);
      S.entries = [['arı', '12, 48'], ['bal', '7, 33'], ['çiçek', '5, 19']].map(([w, n]) => [ink(w, 50), leadText('...... ' + n, 46)]);
      S.n2 = [ink('kelimeler', 56), ink('not edilir,', 56), ink('kitap dizini', 56), ink('gibi!', 56)];
      S.query = ink('arılar nasıl bal yapar?', 50);
      S.sen = ink('sen', 48); S.dc = ink('veri merkezi', 48);
      S.n3 = [ink('Soru, internetle', 58), ink('veri merkezine uçar', 58)];
      S.ranks = ['1.', '2.', '3.'].map(s => ink(s, 52));
      S.n4 = [ink('binlerce sayfa', 48), ink('tartılır,', 48), ink('en faydalısı', 48), ink('en üste!', 48)];
      S.k1 = inkText('Google o an', 96); S.k2 = inkText('interneti değil,', 96); S.k3 = inkText('kendi dizinini arar!', 92, C.ink, 700);
      S.fast = inkText('1 saniyeden kısa!', 66, C.rust, 700);
      S.f1 = inkText('Takip et,', 96); S.f2 = inkText('devamı gelsin!', 96, C.rust, 700);
      S.fastRing = ringAround(330, 768, 250, 58, 2501);
      S.heartPts = close(SH.heartPts(3.4, 2502).map(([x, y]) => [x + 800, y + 1110]));
      S.heartWash = washLayer(W, H, 0, 0, [SH.heartPts(3.4, 2503).map(([x, y]) => [x + 800, y + 1110])], C.rust, 2504, { jit: 2, pools: 1, ew: 4 });
      // page 2 · sketches
      S.box = SH.jitterPts(SH.resample([[110, 400], [900, 400], [900, 500], [110, 500], [110, 400]], 10), 2601, 2, false);
      S.lens = [...SH.jitterPts(SH.resample(Array.from({ length: 25 }, (_, i) => [846 + Math.cos(i / 24 * 6.283) * 20, 442 + Math.sin(i / 24 * 6.283) * 20]), 5), 2602, 1, false), [861, 457], [878, 476]];
      S.laptop = [[[150, 640], [290, 640], [290, 730], [150, 730], [150, 640]], [[120, 745], [320, 745], [300, 770], [140, 770], [120, 745]]].map((p, i) => SH.jitterPts(SH.resample(p, 8), 2610 + i, 1.6, false));
      S.server = [[[690, 580], [870, 580], [870, 790], [690, 790], [690, 580]], [[710, 605], [850, 605], [850, 650], [710, 650], [710, 605]], [[710, 665], [850, 665], [850, 710], [710, 710], [710, 665]], [[710, 725], [850, 725], [850, 770], [710, 770], [710, 725]], [[730, 812], [830, 812]], [[780, 790], [780, 812]]].map((p, i) => SH.jitterPts(SH.resample(p, 8), 2620 + i, 1.6, false));
      S.lapWash = washLayer(W, H, 0, 0, [[[154, 644], [286, 644], [286, 726], [154, 726]]], C.sea, 2630, { jit: 3, pools: 1, ew: 4, a: 0.6 });
      S.srvWash = washLayer(W, H, 0, 0, [[[694, 584], [866, 584], [866, 786], [694, 786]]], C.sand, 2631, { jit: 4, pools: 2, ew: 5, a: 0.6 });
      S.route = SH.catmullPts([[300, 650], [420, 560], [560, 545], [670, 610]], 50);
    },
    frame(g, t, W, H) {
      g.drawImage(S.desk, 0, 0);
      let pageNo = t < FLIPS[0][1] ? 1 : t < FLIPS[1][1] ? 2 : t < FLIPS[2][1] ? 3 : 4, flip = null;
      for (let i = 0; i < FLIPS.length; i++) if (t >= FLIPS[i][0] && t < FLIPS[i][1]) { flip = E.ioC(P(t, FLIPS[i][0], FLIPS[i][1])); pageNo = i + 1; }
      const cg = S.cur.g;
      cg.setTransform(1, 0, 0, 1, 0, 0); cg.globalAlpha = 1; cg.globalCompositeOperation = 'source-over';
      cg.clearRect(0, 0, W, H); cg.drawImage(S.blank, 0, 0);
      cg.save(); cg.clip(S.pagePath); [null, page1, page2, page3, () => {}][pageNo](cg, t); cg.restore();
      if (flip === null) g.drawImage(S.cur.c, 0, 0);
      else { g.drawImage(S.blank, 0, 0); if (flip < 1) flipPage(g, S.cur.c, flip, W, H); }
      g.drawImage(S.spiral, 0, 0);
    },
  });

  function fields(g, t0) {
    write(g, S.date, 196, 250, P(T, t0, t0 + 0.3));
    write(g, S.place, 598, 250, P(T, t0 + 0.25, t0 + 0.55));
  }
  let T = 0;
  function page1(g, t) {
    T = t;
    fields(g, 0.15);
    write(g, S.t1, 92, 382, P(t, 0.3, 1.1));
    write(g, S.t2, 130, 480, P(t, 1.0, 1.6));
    inkLine(g, hline(126, 140 + S.t2.width, 504, 1791, 3), E.ioS(P(t, 1.55, 1.8)), 4.5);
    // 1 · crawlers
    write(g, S.h1, 100, 600, P(t, 2.2, 2.7));
    inkLine(g, hline(96, 110 + S.h1.width, 614, 1801, 2.5), E.ioS(P(t, 2.65, 2.8)), 3.6, C.rust);
    S.links.forEach((l, i) => pencil(g, l, E.ioS(P(t, 3.1 + i * 0.07, 3.45 + i * 0.07)), 2.6, 0.75, 2220 + i, 1.2));
    S.icons.forEach((ic, i) => {
      const t0 = 2.5 + i * 0.1, kw = E.outC(P(t, t0 + 0.35, t0 + 0.75));
      if (kw > 0) { g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = kw; g.drawImage(ic.wash, 0, 0); g.restore(); }
      pencil(g, ic.outline, E.ioS(P(t, t0, t0 + 0.4)), 3, 0.9, 2240 + i);
      pencil(g, ic.fold, P(t, t0 + 0.35, t0 + 0.45), 2.4, 0.9, 2250 + i);
      ic.lines.forEach((l, k) => pencil(g, l, P(t, t0 + 0.4 + k * 0.04, t0 + 0.5 + k * 0.04), 2, 0.6, 2260 + i * 4 + k, 0.8));
    });
    const ur = E.ioS(P(t, 4.0, 6.6)), pos = SH.partial(S.botRoute, Math.max(0.001, ur)), [bx, by] = pos[pos.length - 1];
    BOT_PATH.forEach((ni, k) => { const reach = k / (BOT_PATH.length - 1); if (ur >= reach - 0.001 && t > 4.0) inkLine(g, check(NODES[ni][0] + 30, NODES[ni][1] - 62), P(t, 4.0 + reach * 2.6, 4.15 + reach * 2.6), 5, C.rust); });
    robot(g, bx, by - 6, t, P(t, 3.8, 4.0));
    write(g, S.n1[0], 100, 1035, P(t, 5.0, 5.5)); write(g, S.n1[1], 100, 1100, P(t, 5.5, 6.2));
    // 2 · index card
    write(g, S.h2, 100, 1175, P(t, 7.0, 7.45));
    inkLine(g, hline(96, 110 + S.h2.width, 1189, 1802, 2.5), E.ioS(P(t, 7.4, 7.55)), 3.6, C.rust);
    const kc = P(t, 7.3, 7.7);
    if (kc > 0) {
      const e = E.outC(kc), sc = lerp(1.1, 1, e);
      g.save(); g.translate(330, 1350); g.rotate(lerp(-0.12, -0.03, e)); g.scale(sc, sc); g.globalAlpha = clamp(kc * 4);
      g.shadowColor = `rgba(50,35,20,${lerp(0.12, 0.3, e).toFixed(3)})`; g.shadowBlur = lerp(30, 10, e); g.shadowOffsetY = lerp(22, 5, e);
      g.drawImage(S.card, -235, -145); g.shadowColor = 'rgba(0,0,0,0)'; g.globalAlpha = 1;
      write(g, S.cardTitle, -205, -98, P(t, 7.85, 8.1));
      S.entries.forEach(([w, n], i) => { write(g, w, -205, -22 + i * 56, P(t, 8.1 + i * 0.5, 8.35 + i * 0.5)); write(g, n, -60, -22 + i * 56, P(t, 8.3 + i * 0.5, 8.6 + i * 0.5)); });
      tape(g, S.tapeA, -205, -140, -0.6, P(t, 7.62, 7.78)); tape(g, S.tapeA, 205, -140, 0.6, P(t, 7.7, 7.86));
      g.restore();
    }
    S.n2.forEach((sp, i) => write(g, sp, 610, 1245 + i * 58 + (i > 1 ? 18 : 0), P(t, 9.9 + i * 0.35, 10.25 + i * 0.35)));
  }
  function page2(g, t) {
    T = t;
    fields(g, 13.5);
    // 3 · the question travels
    write(g, S.h3, 100, 360, P(t, 13.9, 14.35));
    inkLine(g, hline(96, 110 + S.h3.width, 374, 1803, 2.5), E.ioS(P(t, 14.3, 14.45)), 3.6, C.rust);
    pencil(g, S.box, E.ioS(P(t, 14.3, 14.8)), 3.2, 0.9, 2650);
    pencil(g, S.lens, E.ioS(P(t, 14.7, 14.95)), 3.4, 0.9, 2651);
    write(g, S.query, 140, 468, P(t, 14.95, 15.9));
    const kl = E.outC(P(t, 15.7, 16.1));
    if (kl > 0) { g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = kl; g.drawImage(S.lapWash, 0, 0); g.drawImage(S.srvWash, 0, 0); g.restore(); }
    S.laptop.forEach((p, i) => pencil(g, p, E.ioS(P(t, 15.5 + i * 0.1, 15.85 + i * 0.1)), 3, 0.9, 2660 + i));
    S.server.forEach((p, i) => pencil(g, p, E.ioS(P(t, 15.6 + i * 0.08, 15.95 + i * 0.08)), 3, 0.9, 2670 + i));
    const kd = P(t, 16.0, 16.2);
    if (kd > 0) for (let k = 0; k < 3; k++) { g.fillStyle = rgba(k === 1 ? C.rust : '#3E9E58', kd); g.beginPath(); g.arc(830, 628 + k * 60, 6, 0, 6.283); g.fill(); }
    write(g, S.sen, 220, 830, P(t, 16.0, 16.25), { ax: 0.5 });
    write(g, S.dc, 780, 850, P(t, 16.1, 16.6), { ax: 0.5 });
    const ur = E.ioS(P(t, 16.4, 17.5));
    if (ur > 0) {
      const part = SH.partial(S.route, ur);
      g.save(); g.setLineDash([12, 10]); g.lineCap = 'round'; g.strokeStyle = C.rust; g.lineWidth = 4.2; g.stroke(SH.pathFrom(part, false)); g.restore();
      const n = part.length, [x, y] = part[n - 1], [px, py] = part[Math.max(0, n - 3)];
      if (ur < 1) { g.save(); g.translate(x, y); g.rotate(Math.atan2(y - py, x - px)); g.scale(1.6, 1.6); g.fillStyle = C.ink; g.fill(plane); g.restore(); }
    }
    write(g, S.n3[0], 100, 945, P(t, 17.2, 17.65)); write(g, S.n3[1], 100, 1010, P(t, 17.6, 18.2));
    // 4 · ranking
    write(g, S.h4, 100, 1090, P(t, 18.3, 18.8));
    inkLine(g, hline(96, 110 + S.h4.width, 1104, 1804, 2.5), E.ioS(P(t, 18.75, 18.9)), 3.6, C.rust);
    const order = [0, 1, 2], ks = E.ioC(P(t, 20.0, 20.8));
    S.slips.forEach((cv, i) => {
      const k = P(t, 18.8 + i * 0.12, 19.15 + i * 0.12);
      if (k <= 0) return;
      const yA = SLOT_Y[order[i]], yB = SLOT_Y[[1, 2, 0][i]], y = lerp(yA, yB, ks) - (i === 2 ? Math.sin(Math.PI * ks) * 40 : 0), x = 165 + (i === 2 ? Math.sin(Math.PI * ks) * 70 : 0);
      const e = E.outC(k);
      g.save(); g.translate(x, y); g.rotate((i - 1) * 0.015); g.globalAlpha = clamp(k * 4);
      g.shadowColor = `rgba(50,35,20,${lerp(0.1, 0.25, e).toFixed(3)})`; g.shadowBlur = lerp(20, 6, e); g.shadowOffsetY = lerp(14, 3, e);
      g.drawImage(cv, 0, -46); g.restore();
    });
    S.ranks.forEach((sp, i) => write(g, sp, 104, SLOT_Y[i] + 18, P(t, 19.3 + i * 0.1, 19.45 + i * 0.1)));
    inkLine(g, ringAround(140, SLOT_Y[0], 52, 46, 2701), E.ioS(P(t, 20.9, 21.3)), 4, C.rust);
    S.n4.forEach((sp, i) => write(g, sp, 625, 1170 + i * 58 + (i > 1 ? 18 : 0), P(t, 19.4 + i * 0.35, 19.75 + i * 0.35)));
  }
  function page3(g, t) {
    T = t;
    fields(g, 23.7);
    write(g, S.k1, 100, 430, P(t, 23.9, 24.4));
    write(g, S.k2, 100, 535, P(t, 24.35, 25.0));
    write(g, S.k3, 100, 640, P(t, 24.95, 25.7));
    inkLine(g, hline(96, 110 + S.k3.width, 664, 1805, 3), E.ioS(P(t, 25.65, 25.85)), 5, C.rust);
    write(g, S.fast, 330, 790, P(t, 25.9, 26.35), { ax: 0.5 });
    inkLine(g, S.fastRing, E.ioS(P(t, 26.3, 26.65)), 4, C.rust);
    // ending card
    const kc = P(t, 26.6, 27.0);
    if (kc > 0) {
      const e = E.outC(kc), sc = lerp(1.1, 1, e);
      g.save(); g.translate(520, 1080); g.rotate(lerp(0.1, -0.03, e)); g.scale(sc, sc); g.globalAlpha = clamp(kc * 4);
      g.shadowColor = `rgba(50,35,20,${lerp(0.12, 0.3, e).toFixed(3)})`; g.shadowBlur = lerp(30, 10, e); g.shadowOffsetY = lerp(22, 5, e);
      g.fillStyle = '#FCF9F1'; g.fillRect(-370, -170, 740, 340); g.shadowColor = 'rgba(0,0,0,0)'; g.globalAlpha = 1;
      write(g, S.f1, -330, -40, P(t, 27.05, 27.5));
      write(g, S.f2, -330, 70, P(t, 27.45, 28.15));
      tape(g, S.tapeB, -330, -160, -0.5, P(t, 26.9, 27.05)); tape(g, S.tapeB, 330, -160, 0.5, P(t, 26.95, 27.1));
      g.restore();
      const kh = E.outC(P(t, 28.1, 28.4));
      if (kh > 0) { g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = kh; g.drawImage(S.heartWash, 0, 0); g.restore(); inkLine(g, S.heartPts, kh, 3.5, C.rust); }
    }
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
