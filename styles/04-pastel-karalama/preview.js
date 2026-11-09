'use strict';
/* 04 · Pastel Karalama — a child's wax-crayon drawing in a spiral sketchbook.
   One paper-tooth mask is shared by every colour (the paper decides where wax sticks), so all
   strokes break up in the same places. Shapes are coloured with zig-zag scribbles that spill over
   the line; outlines "boil" (re-jitter) 8 times a second like hand-drawn animation. */
(() => {
  const { E, P, clamp, lerp, bump, rng, rgba } = SH;
  const C = {
    paper: '#FBF8F1', red: '#E5403A', orange: '#F28C28', yellow: '#F7CB2D', green: '#4FAF4A', blue: '#2F7FD1',
    purple: '#7B4FB8', navy: '#24357A', grey: '#8A97A8', brown: '#8C5A3C', skin: '#F4B08C', ring: '#6E7279',
  };
  const S = {};
  let TOOTH = null;
  const PAT = new Map();
  function crayon(g, col) {                              // pattern: colour where the tooth catches wax
    let p = PAT.get(col);
    if (!p) {
      const { c, g: cg } = SH.canvas(512, 512);
      cg.fillStyle = col; cg.fillRect(0, 0, 512, 512);
      cg.globalCompositeOperation = 'destination-in'; cg.drawImage(TOOTH, 0, 0);
      p = g.createPattern(c, 'repeat'); PAT.set(col, p);
    }
    return p;
  }
  function stroke(g, pts, col, w = 14, u = 1, twice = true) {
    if (u <= 0 || pts.length < 2) return;
    const part = u < 1 ? SH.partial(pts, u) : pts;
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = crayon(g, col); g.lineWidth = w;
    const path = () => { g.beginPath(); part.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); };
    path(); g.stroke();
    if (twice) { g.translate(1.5, -1); g.lineWidth = w * 0.7; path(); g.stroke(); }
    g.restore();
  }
  function wobbly(pts, seed, amp) {                      // hand jitter, re-rolled by the boil clock
    return pts.map((p, i) => [p[0] + SH.noise1(seed, i * 0.35) * amp, p[1] + SH.noise1(seed + 50, i * 0.35) * amp]);
  }
  function circlePts(cx, cy, r, n = 48, over = 0.15) {
    return Array.from({ length: n + Math.round(n * over) }, (_, i) => { const a = (i / n) * Math.PI * 2 - 0.6; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
  }
  function scribble(cx, cy, r, seed, step = 15, ang = -0.5, shape = 'circle', ry) {  // zig-zag colouring that spills over
    const R = rng(seed), pts = [], ca = Math.cos(ang), sa = Math.sin(ang), rY = ry ?? r;
    for (let y = -rY, k = 0; y <= rY; y += step, k++) {
      const half = shape === 'circle' ? Math.sqrt(Math.max(0, 1 - (y / rY) ** 2)) * r : r;
      const x = (k % 2 ? 1 : -1) * (half + (R() - 0.3) * 14);
      pts.push([cx + x * ca - y * sa, cy + x * sa + y * ca]);
    }
    return pts;
  }
  const txt = (s, size, col) => SH.textSprite(s, size, { fam: 'Patrick Hand', wt: 400, col, key: 'crayon', paint: (g, w, h, bx, by, draw) => { g.fillStyle = crayon(g, col); draw(); g.globalAlpha = 0.5; draw(bx + 1.5, by - 1); } });
  function label(g, n, s, x, y, k, col = C.navy) {
    if (k <= 0) return;
    const b = Math.floor(FRt * 8);
    stroke(g, wobbly(circlePts(x + 24, y - 20, 30, 40, 0.2), 900 + n + b * 7, 1.6), C.red, 6, E.outC(clamp(k * 1.8)), false);
    const a = clamp((k - 0.15) * 3);
    SH.drawSprite(g, txt(String(n), 50, C.red), x + 24, y, { ax: 0.5, alpha: a });
    SH.drawSprite(g, txt(s, 66, col), x + 72, y + 4, { alpha: a });
  }
  let FRt = 0;

  SH.register({
    id: '04', w: 1080, h: 1920, duration: 8, fps: 30, poster: 6.6,
    fonts: ['400 80px "Patrick Hand"'],
    init(g, W, H) {
      // paper tooth: where the crayon wax catches (≈ 72 % coverage, streaky)
      const { c, g: tg } = SH.canvas(512, 512), img = tg.createImageData(512, 512), R = rng(404);
      for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
        const n = SH.noise2(41, x * 0.18, y * 0.18) * 0.55 + SH.noise2(42, x * 0.6, y * 0.6) * 0.3 + (R() - 0.5) * 0.5 + 0.12 * Math.sin((x + y * 0.4) * 0.35);
        const k = (y * 512 + x) * 4;
        img.data[k] = img.data[k + 1] = img.data[k + 2] = 0; img.data[k + 3] = clamp((n + 0.42) * 3.2) * 255;
      }
      tg.putImageData(img, 0, 0); TOOTH = c;
      const bg = SH.canvas(W, H), b = bg.g;
      b.fillStyle = C.paper; b.fillRect(0, 0, W, H);
      b.globalCompositeOperation = 'soft-light'; b.globalAlpha = 0.7;
      b.fillStyle = b.createPattern(SH.grain(512, 44, { fibres: 200, fine: 20, mottle: 14 }), 'repeat'); b.fillRect(0, 0, W, H);
      b.globalCompositeOperation = 'source-over'; b.globalAlpha = 1;
      for (let x = 70; x < W - 40; x += 62) {             // spiral binding
        b.fillStyle = 'rgba(40,40,45,0.18)'; b.beginPath(); b.arc(x, 74, 11, 0, Math.PI * 2); b.fill();
        b.strokeStyle = C.ring; b.lineWidth = 7; b.lineCap = 'round'; b.beginPath(); b.arc(x, 44, 26, Math.PI * 0.95, Math.PI * 2.3); b.stroke();
        b.strokeStyle = 'rgba(255,255,255,0.6)'; b.lineWidth = 2; b.beginPath(); b.arc(x - 2, 42, 24, Math.PI * 1.15, Math.PI * 1.5); b.stroke();
      }
      S.bg = bg.c;
      const blank = SH.canvas(W, H); blank.g.drawImage(bg.c, 0, 0); S.blank = blank.c;
      S.title1 = ['Gök', 'ku', 'şa', 'ğı'].map((s, i) => txt(s, 156, [C.red, C.orange, C.green, C.blue][i]));
      S.title2 = txt('nasıl oluşur?', 96, C.navy);
      S.sunFill = scribble(230, 640, 92, 1, 14, -0.6);
      S.cloudFill = [scribble(760, 620, 90, 2, 14, 0.4), scribble(870, 640, 80, 3, 14, 0.4), scribble(820, 580, 70, 4, 14, 0.4)];
      S.grass = (() => { const R = rng(5), pts = []; for (let x = -20, k = 0; x <= 1100; x += 13, k++) pts.push([x + (R() - 0.5) * 8, k % 2 ? 1935 : 1640 + Math.sin(x * 0.01) * 22 + (R() - 0.5) * 30]); return pts; })();
      const arcPts = (r) => Array.from({ length: 61 }, (_, i) => { const a = Math.PI + (i / 60) * Math.PI; return [540 + Math.cos(a) * r, 1700 + Math.sin(a) * r * 0.92]; });
      S.bands = [C.red, C.orange, C.yellow, C.green, C.blue, C.purple].map((col, i) => ({ col, pts: arcPts(470 - i * 33) }));
      S.drop = Array.from({ length: 60 }, (_, i) => { const a = (i / 56) * Math.PI * 2; const r = 112 * (1 - 0.32 * Math.max(0, -Math.sin(a)) ** 3); return [540 + Math.cos(a) * r * 0.9, 990 + Math.sin(a) * r + (Math.sin(a) < 0 ? -(Math.max(0, -Math.sin(a)) ** 6) * 70 : 0)]; });
      const Rn = rng(9);
      S.rain = Array.from({ length: 14 }, (_, i) => ({ x: 720 + Rn() * 200, t0: Rn() * 0.9 }));
      S.fan = [C.red, C.orange, C.yellow, C.green, C.blue, C.purple].map((col, i) => ({ col, pts: [[600, 1050], [780 + i * 10, 1150 + i * 26], [960 + i * 18, 1230 + i * 44]] }));
    },
    frame(g, t, W, H) {
      FRt = t;
      const boil = Math.floor(t * 8);                      // hand-drawn line boil
      g.drawImage(S.bg, 0, 0);
      // title: crayon letters scribbled in, word by word
      let x = 88;
      S.title1.forEach((sp, i) => {
        const k = P(t, 0.05 + i * 0.12, 0.3 + i * 0.12);
        if (k > 0) SH.drawSprite(g, sp, x, 330, { alpha: k, rot: (1 - k) * 0.1 });
        x += sp.width;
      });
      SH.drawSprite(g, S.title2, 92, 462, { alpha: P(t, 0.55, 0.9) });
      // sun and rain cloud
      stroke(g, S.sunFill, C.yellow, 18, E.outC(P(t, 0.5, 1.2)));
      stroke(g, wobbly(circlePts(230, 640, 96), 10 + boil, 1.8), C.orange, 8, E.outC(P(t, 0.9, 1.3)), false);
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2, k = P(t, 1.0 + i * 0.03, 1.2 + i * 0.03);
        stroke(g, wobbly([[230 + Math.cos(a) * 120, 640 + Math.sin(a) * 120], [230 + Math.cos(a) * 165, 640 + Math.sin(a) * 165]], 20 + i + boil, 1.5), C.orange, 9, k, false);
      }
      S.cloudFill.forEach((f, i) => stroke(g, f, C.grey, 16, E.outC(P(t, 0.6 + i * 0.12, 1.3 + i * 0.12))));
      if (t > 1.2 && t < 7.2) for (const d of S.rain) {
        const u = ((t - 1.2 + d.t0) % 0.9) / 0.9, y = 700 + u * 200;
        stroke(g, [[d.x, y], [d.x - 8, y + 34]], C.blue, 8, 1, false);
      }
      // 1 · sunlight shines into a raindrop
      const beam = E.ioS(P(t, 1.7, 2.4));
      stroke(g, wobbly([[300, 700], [400, 820], [480, 930]], 30 + boil, 2), C.yellow, 22, beam);
      label(g, 1, 'Güneş ışığı', 70, 900, P(t, 2.0, 2.6));
      // 2 · the drop splits the light into colours
      stroke(g, wobbly(S.drop.concat([S.drop[0], S.drop[1]]), 40 + boil, 1.8), C.blue, 9, E.ioS(P(t, 2.4, 3.0)), false);
      S.fan.forEach((f, i) => stroke(g, wobbly(SH.catmullPts(f.pts, 12), 60 + i + boil, 1.4), f.col, 11, E.ioS(P(t, 3.0 + i * 0.07, 3.6 + i * 0.07)), false));
      label(g, 2, 'Damla rengi ayırır', 60, 1160, P(t, 3.3, 3.9));
      // 3 · a rainbow arcs over the grass, band by band
      stroke(g, S.grass, C.green, 20, E.outC(P(t, 0.3, 1.4)));
      S.bands.forEach((b, i) => stroke(g, wobbly(b.pts, 70 + i, 1.2), b.col, 36, E.ioS(P(t, 4.3 + i * 0.22, 5.0 + i * 0.22))));
      // a kid waves at it
      const kid = P(t, 6.2, 6.7), wave = Math.sin(boil * 1.7) * 0.3;
      if (kid > 0) {
        const kx = 960, ky = 1790, j = (s) => wobbly(s, 80 + boil, 1.4);
        stroke(g, j(circlePts(kx, ky - 150, 34, 30, 0.15)), C.brown, 8, kid, false);
        stroke(g, j([[kx, ky - 116], [kx, ky - 30]]), C.red, 10, kid, false);
        stroke(g, j([[kx, ky - 30], [kx - 26, ky + 30]]), C.navy, 9, kid, false);
        stroke(g, j([[kx, ky - 30], [kx + 26, ky + 30]]), C.navy, 9, kid, false);
        stroke(g, j([[kx, ky - 90], [kx - 40, ky - 60]]), C.brown, 8, kid, false);
        stroke(g, j([[kx, ky - 90], [kx + 30 + Math.cos(-1.1 + wave) * 30, ky - 120 + Math.sin(-1.1 + wave) * 30]]), C.brown, 8, kid, false);
        stroke(g, j([[kx - 14, ky - 140], [kx, ky - 130], [kx + 14, ky - 140]]), C.red, 5, kid, false);
      }
      const k3 = P(t, 5.9, 6.5);
      if (k3 > 0) {
        stroke(g, wobbly(circlePts(392, 1488, 30, 40, 0.2), 903 + boil * 7, 1.6), C.red, 6, E.outC(clamp(k3 * 1.8)), false);
        const a3 = clamp((k3 - 0.15) * 3);
        SH.drawSprite(g, txt('3', 50, C.red), 392, 1508, { ax: 0.5, alpha: a3 });
        SH.drawSprite(g, txt('Gökkuşağı', 66, C.purple), 590, 1512, { ax: 0.5, alpha: a3 });
        SH.drawSprite(g, txt('oluşur!', 66, C.purple), 540, 1580, { ax: 0.5, alpha: a3 });
      }
      // loop: tear the sheet up over the spiral rings; a fresh page waits underneath
      const fk = P(t, 7.1, 8.0);
      if (fk > 0) {
        const e = E.inQ(fk), h = H * Math.cos(e * Math.PI / 2);
        const snap = g.getImageData(0, 0, W, H);
        g.drawImage(S.blank, 0, 0);
        const tmp = SH.canvas(W, H); tmp.g.putImageData(snap, 0, 0);
        g.save(); g.shadowColor = 'rgba(40,40,50,0.35)'; g.shadowBlur = 30; g.shadowOffsetY = 10;
        g.drawImage(tmp.c, 0, 0, W, H, 0, 70 * e, W, Math.max(1, h));
        g.restore();
        g.fillStyle = `rgba(30,30,40,${(0.2 * e).toFixed(3)})`; g.fillRect(0, 70 * e, W, Math.max(1, h));
        for (let x = 70; x < W - 40; x += 62) { g.strokeStyle = C.ring; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.arc(x, 44, 26, Math.PI * 0.95, Math.PI * 2.3); g.stroke(); }
      }
    },
  });
})();
