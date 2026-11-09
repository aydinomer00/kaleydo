'use strict';
/* 07 · Karton Atölye — a corrugated-cardboard factory diorama. Pieces are cut from a kraft texture
   with vertical flutes; cut edges show the wavy fluting; labels are marker on masking tape; a red
   ink stamp lands on the result. The loop opens and closes like the flaps of a box. */
(() => {
  const { E, P, clamp, lerp, bump, rng, mix, darken, lighten, rgba, stepT } = SH;
  const C = {
    kraft: '#C79A66', kraftD: '#A97C4C', kraftL: '#DDB886', edge: '#E6C89A', marker: '#1F1D1C', tape: '#E9D7A6',
    blue: '#3D7CC9', red: '#D23B33', paper: '#F4F1EA', pulp: '#D9D3C6', water: '#8DBBD6', news: '#B9B4AA',
  };
  const S = {};
  let KRAFT = null;
  function kraftTexture(w, h, seed) {
    const { c, g } = SH.canvas(w, h), img = g.createImageData(w, h), d = img.data, base = SH.hex2rgb(C.kraft), R = rng(seed);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const flute = Math.sin((x / 15) * Math.PI * 2) * 0.035;                       // corrugation under the liner
      const n = SH.noise2(seed, x * 0.006, y * 0.006) * 0.03 + SH.noise2(seed + 1, x * 0.35, y * 0.06) * 0.035 + (R() - 0.5) * 0.06;
      const k = (y * w + x) * 4;
      for (let i = 0; i < 3; i++) d[k + i] = clamp(base[i] * (1 + flute + n), 0, 255);
      d[k + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    g.globalAlpha = 0.18; g.strokeStyle = '#7A5530'; g.lineWidth = 1;
    for (let i = 0; i < (w * h) / 900; i++) { const x = R() * w, y = R() * h, a = R() * 6.28, l = 3 + R() * 8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    return c;
  }
  // a piece cut from cardboard: textured fill, a pale cut edge with the wavy flute, a thick shadow
  function card(pts, seed, o = {}) {
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), pad = 30;
    const x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad, x1 = Math.max(...xs) + pad, y1 = Math.max(...ys) + pad;
    const { c, g } = SH.canvas(x1 - x0, y1 - y0);
    g.translate(-x0, -y0);
    const path = SH.pathFrom(pts);
    g.save(); g.clip(path);
    g.drawImage(KRAFT, -((seed * 37) % 400), -((seed * 53) % 400));
    if (o.tint) { g.globalCompositeOperation = 'multiply'; g.fillStyle = o.tint; g.fillRect(x0, y0, x1 - x0, y1 - y0); g.globalCompositeOperation = 'source-over'; }
    g.lineWidth = 16; g.strokeStyle = C.edge; g.stroke(path);                         // exposed cut edge
    g.lineWidth = 2.2; g.strokeStyle = rgba(C.kraftD, 0.9);
    const res = SH.resample(pts.concat([pts[0]]), 2);
    g.beginPath();
    res.forEach((p, i) => { const q = res[Math.min(res.length - 1, i + 1)], a = Math.atan2(q[1] - p[1], q[0] - p[0]) + Math.PI / 2, w = Math.sin(i * 1.4) * 2.6 + 4; const x = p[0] + Math.cos(a) * w, y = p[1] + Math.sin(a) * w; i ? g.lineTo(x, y) : g.moveTo(x, y); });
    g.stroke();
    g.restore();
    if (o.draw) o.draw(g);
    return { c, x0, y0 };
  }
  function put(g, sp, x, y, o = {}) {
    if (!sp) return;
    g.save(); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale((o.sx ?? 1) * (o.s ?? 1), (o.sy ?? 1) * (o.s ?? 1));
    if (o.alpha !== undefined) g.globalAlpha = o.alpha;
    if (o.shadow !== false) { g.shadowColor = 'rgba(55,35,15,0.4)'; g.shadowBlur = 12; g.shadowOffsetX = 5; g.shadowOffsetY = 8; }
    g.drawImage(sp.c, sp.x0, sp.y0);
    g.restore();
  }
  function marker(g, pts, w = 11, col = C.marker, u = 1) {      // felt-tip line with a little bleed
    if (u <= 0) return;
    const p = u < 1 ? SH.partial(pts, u) : pts;
    if (p.length < 2) return;
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = rgba(col, 0.25); g.lineWidth = w + 3; g.beginPath(); p.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.stroke();
    g.strokeStyle = col; g.lineWidth = w; g.stroke(); g.restore();
  }
  function tape(w, h, seed, text) {                     // masking tape with torn ends and marker writing
    const R = rng(seed), pts = [];
    for (let y = 0; y <= h; y += 6) pts.push([R() * 7, y]);
    for (let y = h; y >= 0; y -= 6) pts.push([w - R() * 7, y]);
    const { c, g } = SH.canvas(w + 10, h + 10);
    g.translate(5, 5);
    g.fillStyle = rgba(C.tape, 0.92); g.fill(SH.pathFrom(pts));
    g.save(); g.clip(SH.pathFrom(pts)); g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.25; g.drawImage(KRAFT, 0, 0, w, h * 3, 0, 0, w, h * 3); g.restore();
    g.fillStyle = 'rgba(255,255,255,0.28)'; g.fillRect(0, h * 0.18, w, h * 0.12);
    if (text) { const sp = SH.textSprite(text, h * 0.72, { fam: 'Amatic SC', wt: 700, col: C.marker }); g.drawImage(sp.c, w / 2 - sp.bx - sp.width / 2, h * 0.78 - sp.by); }
    return { c, x0: -(w + 10) / 2, y0: -(h + 10) / 2 };
  }
  function stamp(text, size, seed) {                     // red rubber stamp with uneven ink
    const t = SH.textSprite(text, size, { fam: 'Amatic SC', wt: 700, col: C.red });
    const w = t.width + 70, h = size * 1.35;
    const { c, g } = SH.canvas(w + 20, h + 20);
    g.translate(10, 10);
    g.strokeStyle = C.red; g.lineWidth = 9; g.beginPath(); g.roundRect(4, 4, w - 8, h - 8, 18); g.stroke();
    g.drawImage(t.c, w / 2 - t.bx - t.width / 2, h * 0.5 + size * 0.36 - t.by);
    g.globalCompositeOperation = 'destination-out';
    const R = rng(seed);
    for (let i = 0; i < 900; i++) { g.globalAlpha = 0.2 + R() * 0.6; g.fillRect(R() * w, R() * h, 1 + R() * 4, 1 + R() * 3); }
    return { c, x0: -(w + 20) / 2, y0: -(h + 20) / 2 };
  }

  SH.register({
    id: '07', w: 1080, h: 1920, duration: 8, fps: 30, poster: 6.4,
    fonts: ['700 80px "Amatic SC"'],
    init(g, W, H) {
      KRAFT = kraftTexture(1500, 2400, 70);
      const bg = SH.canvas(W, H); bg.g.drawImage(KRAFT, 0, 0);
      bg.g.fillStyle = 'rgba(80,50,20,0.12)'; for (let x = 0; x < W; x += 15) bg.g.fillRect(x, 0, 3, H);
      S.bg = bg.c;
      S.sign = card(SH.rrect(-470, -170, 940, 340, 10, 1, { jit: 2.5 }), 1, {
        draw: g => {
          const a = SH.textSprite('KÂĞIT NASIL', 150, { fam: 'Amatic SC', wt: 700, col: C.marker }), b = SH.textSprite('GERİ DÖNÜŞÜR?', 150, { fam: 'Amatic SC', wt: 700, col: C.blue });
          g.drawImage(a.c, -a.bx - a.width / 2, -14 - a.by); g.drawImage(b.c, -b.bx - b.width / 2, 126 - b.by);
        },
      });
      S.tapeS = tape(170, 56, 2);
      S.bin = card(SH.polyPts([[-130, -150], [130, -150], [105, 150], [-105, 150]], 3, { sp: 8, jit: 1.5 }), 3, {
        tint: '#7FB0EC', draw: g => {
          g.strokeStyle = C.blue; g.lineWidth = 11; g.lineCap = 'round';
          for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + k * (Math.PI * 2 / 3); g.beginPath(); g.arc(0, 10, 58, a + 0.25, a + 1.75); g.stroke(); const e = a + 1.75; g.beginPath(); g.moveTo(Math.cos(e) * 58, 10 + Math.sin(e) * 58); g.lineTo(Math.cos(e - 0.3) * 80, 10 + Math.sin(e - 0.3) * 80); g.stroke(); }
        },
      });
      S.tank = card(SH.polyPts([[-150, -110], [150, -110], [150, 140], [-150, 140]], 4, { sp: 8, jit: 1.5 }), 4);
      S.press = card(SH.polyPts([[-120, -190], [120, -190], [120, 120], [-120, 120]], 5, { sp: 8, jit: 1.5 }), 5);
      S.belt = card(SH.polyPts([[-560, -34], [560, -34], [560, 34], [-560, 34]], 6, { sp: 10, jit: 1.5 }), 6, { tint: '#B9B2A6' });
      S.news = card(SH.blob(0, 0, 46, 40, 7, { wob: 0.18, jit: 2 }), 7, { tint: '#E4E1DA', draw: g => { g.strokeStyle = '#555'; g.lineWidth = 3; for (let y = -20; y < 25; y += 9) { g.beginPath(); g.moveTo(-28, y); g.lineTo(22, y + 3); g.stroke(); } } });
      S.box = card(SH.polyPts([[-44, -36], [44, -36], [44, 36], [-44, 36]], 8, { sp: 6, jit: 1.2 }), 8, { draw: g => { g.strokeStyle = C.marker; g.lineWidth = 4; g.beginPath(); g.moveTo(-44, -6); g.lineTo(44, -6); g.stroke(); } });
      S.roll = card(SH.blob(0, 0, 70, 70, 9, { wob: 0.01, jit: 0.8 }), 9, { tint: '#FFFFFF', draw: g => { g.strokeStyle = 'rgba(120,110,100,0.5)'; g.lineWidth = 2; for (let r = 14; r < 66; r += 7) { g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); } g.fillStyle = C.kraftD; g.beginPath(); g.arc(0, 0, 14, 0, Math.PI * 2); g.fill(); } });
      S.labels = [['1 · TOPLA', 360], ['2 · SUYLA HAMUR', 470], ['3 · PRESLE, KURUT', 520]].map(([s, w], i) => tape(w, 120, 20 + i, s));
      S.stamp = stamp('YENİ KÂĞIT!', 120, 30);
      S.flap = card(SH.polyPts([[0, -20], [W / 2 + 30, -20], [W / 2 + 30, H + 20], [0, H + 20]], 40, { sp: 14, jit: 2 }), 40, { tint: '#A9835A' });
    },
    frame(g, t, W, H) {
      g.drawImage(S.bg, 0, 0);
      const ts = stepT(t, 12), boil = (i, a) => (SH.h01(i, Math.floor(ts * 12)) - 0.5) * a;
      // title sign taped to the wall
      const sk = SH.spring(P(ts, 0.3, 0.8));
      if (sk > 0) {
        put(g, S.sign, 540, 360 - (1 - sk) * 500, { rot: -0.02 + boil(1, 0.008) });
        if (t > 0.9) { put(g, S.tapeS, 160, 220, { rot: -0.7 }); put(g, S.tapeS, 920, 220, { rot: 0.7 }); }
      }
      // the factory line slides up (drawn 30 % larger around a pivot)
      const fk = SH.spring(P(ts, 0.8, 1.3)), off = (1 - fk) * 900;
      g.save(); g.translate(540, 1150); g.scale(1.3, 1.3); g.translate(-540, -1120);
      put(g, S.belt, 540, 1200 + off);
      for (let x = 30; x < 1080; x += 70) {                // rollers drawn in marker, turning
        const a = t * 5 + x;
        g.save(); g.translate(x, 1200 + off); g.strokeStyle = C.marker; g.lineWidth = 5; g.beginPath(); g.arc(0, 0, 20, 0, Math.PI * 2); g.stroke();
        g.beginPath(); g.moveTo(Math.cos(a) * 18, Math.sin(a) * 18); g.lineTo(-Math.cos(a) * 18, -Math.sin(a) * 18); g.stroke(); g.restore();
      }
      put(g, S.bin, 210, 990 + off, { rot: boil(2, 0.01) });
      put(g, S.tank, 540, 1030 + off);
      // pulp water level with bubbles inside the tank
      if (fk > 0.9) {
        g.save(); g.beginPath(); g.rect(400, 960, 280, 200); g.clip();
        g.fillStyle = rgba(C.water, 0.85); g.fillRect(400, 1010 + Math.sin(t * 3) * 4, 280, 160);
        for (let i = 0; i < 9; i++) { const u = ((t * 0.7 + i * 0.11) % 1), bx = 420 + i * 30, by = 1150 - u * 140; g.fillStyle = C.pulp; g.beginPath(); g.arc(bx + Math.sin(u * 6 + i) * 6, by, 9 + (i % 3) * 4, 0, Math.PI * 2); g.fill(); }
        g.restore();
        marker(g, [[400, 1000], [680, 1000]], 6, C.blue);
      }
      put(g, S.press, 840, 990 + off);
      for (const [dy, dir] of [[-75, 1], [45, -1]]) {        // press rollers
        g.save(); g.translate(840, 990 + dy + off); g.strokeStyle = C.marker; g.lineWidth = 9; g.beginPath(); g.arc(0, 0, 50, 0, Math.PI * 2); g.stroke();
        const a = t * 4 * dir; g.lineWidth = 6; g.beginPath(); g.moveTo(Math.cos(a) * 44, Math.sin(a) * 44); g.lineTo(-Math.cos(a) * 44, -Math.sin(a) * 44); g.stroke(); g.restore();
      }
      // 1 · old paper rides the belt into the bin
      const ride = P(ts, 1.4, 2.6);
      if (ride > 0 && ride < 1) {
        put(g, S.news, lerp(1150, 230, E.ioS(ride)), 1140 + off - bump(clamp(ride * 1.25 - 0.25)) * 120, { rot: ride * 6 });
        put(g, S.box, lerp(1300, 230, E.ioS(clamp(ride * 1.15))), 1135 + off - bump(clamp(ride * 1.15 * 1.25 - 0.25)) * 120, { rot: ride * -4 });
      }
      // 2 · pulp blobs move from the bin to the tank
      for (let i = 0; i < 4; i++) {
        const u = P(ts, 2.6 + i * 0.18, 3.4 + i * 0.18);
        if (u <= 0 || u >= 1) continue;
        g.fillStyle = C.pulp; g.beginPath(); g.ellipse(lerp(260, 520, u), 1150 + off - bump(u) * 160, 26, 20, 0, 0, Math.PI * 2); g.fill();
        g.strokeStyle = C.marker; g.lineWidth = 3; g.stroke();
      }
      // 3 · a clean sheet comes out of the press and winds onto a new roll
      const sheet = P(ts, 3.9, 5.2), rs = 0.4 + 0.6 * E.outC(sheet);
      if (sheet > 0) {
        g.save(); g.fillStyle = C.paper; g.shadowColor = 'rgba(50,30,10,0.3)'; g.shadowBlur = 8; g.shadowOffsetY = 4;
        g.fillRect(830, 1090 + off, 18, lerp(0, 330, Math.min(1, sheet * 1.4))); g.restore();
        put(g, S.roll, 840, 1460 + off, { s: rs, rot: t * 3 });
      }
      g.restore();
      // tape labels
      [[1.8, 3.0, 280, 1500], [3.0, 4.2, 540, 1500], [4.2, 9, 400, 1720]].forEach(([a, b, x, y], i) => {
        const k = P(ts, a, a + 0.25), o2 = P(ts, b, b + 0.2);
        if (k <= 0 || o2 >= 1) return;
        put(g, S.labels[i], x, y, { rot: [-0.04, 0.03, -0.02][i], s: E.outBack(k, 2) * (1 - o2) });
      });
      // the stamp slams onto the new roll
      const st = P(t, 5.7, 6.0);
      if (st > 0) put(g, S.stamp, 560, 1530, { rot: -0.12, s: lerp(1.6, 1, E.outC(st)), alpha: clamp(st * 4), shadow: false });
      // loop: box flaps open at the start and close at the end
      const open = 1 - E.ioC(P(t, 0.0, 0.55)), close = E.ioC(P(t, 7.35, 8.0)), f = Math.max(open, close);
      if (f > 0.001) {
        for (const side of [-1, 1]) {
          g.save(); g.translate(side < 0 ? 0 : W, 0); g.scale(-side * Math.max(0.001, f), 1);
          g.shadowColor = 'rgba(40,25,10,0.5)'; g.shadowBlur = 30; g.shadowOffsetX = 12;
          g.drawImage(S.flap.c, S.flap.x0, S.flap.y0);
          g.shadowColor = 'transparent';
          const sh = g.createLinearGradient(0, 0, W / 2 + 30, 0); sh.addColorStop(0, 'rgba(40,25,10,0.05)'); sh.addColorStop(1, `rgba(40,25,10,${(0.25 + 0.35 * (1 - f)).toFixed(3)})`);
          g.fillStyle = sh; g.fillRect(0, 0, W / 2 + 30, H);
          g.fillStyle = 'rgba(255,240,215,0.5)'; g.fillRect(W / 2 + 18, 0, 6, H);
          g.restore();
        }
      }
    },
  });
})();
