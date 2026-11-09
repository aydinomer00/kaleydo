'use strict';
/* 16 · Çizgi Roman — a printed comic page: heavy ink panels with white gutters, Ben-Day dot fills,
   flat process colours printed slightly off-register from the black line art, yellow caption boxes,
   burst balloons with sound words. Panels arrive one by one; the page dissolves in growing dots. */
(() => {
  const { E, P, clamp, lerp, bump, rng, mix, darken, lighten, rgba, stepT } = SH;
  const C = { paper: '#FBF6E9', ink: '#141414', cyan: '#2E9BD6', mag: '#E2367A', yellow: '#FFD23F', red: '#E23A2E', sky: '#BFE3F5', cloud: '#7D8BA6', cloudD: '#4E5A76', green: '#3FA34D', ice: '#E6F7FF' };
  const S = {};
  const PANELS = [[54, 520, 972, 470], [54, 1020, 972, 470], [54, 1520, 972, 340]];

  function dots(col, step, r, bg) {                       // Ben-Day dot tile
    const { c, g } = SH.canvas(step * 2, step * 2);
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, step * 2, step * 2); }
    g.fillStyle = col;
    for (const [x, y] of [[step / 2, step / 2], [step * 1.5, step * 1.5], [step * 1.5, step / 2], [step / 2, step * 1.5]]) { if ((x + y) % (step * 2) === step) continue; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
    return c;
  }
  function burst(n, r0, r1, seed) { const R = rng(seed); return Array.from({ length: n * 2 }, (_, i) => { const a = (i / (n * 2)) * Math.PI * 2, r = i % 2 ? r0 * (0.8 + R() * 0.3) : r1 * (0.85 + R() * 0.3); return [Math.cos(a) * r, Math.sin(a) * r]; }); }
  function inked(g, path, fill, lw = 7, off = [3, 2]) {   // colour plate (off-register) + key line
    if (fill) { g.save(); g.translate(off[0], off[1]); g.fillStyle = fill; g.fill(path); g.restore(); }
    g.lineWidth = lw; g.lineJoin = 'round'; g.strokeStyle = C.ink; g.stroke(path);
  }
  function caption(g, text, x, y, k) {
    if (k <= 0) return;
    const sp = SH.textSprite(text, 40, { fam: 'Nunito', wt: 900, col: C.ink }), w = sp.width + 44, h = 66;
    g.save(); g.translate(x, y); g.scale(1, E.outBack(k, 1.8));
    g.fillStyle = C.yellow; g.fillRect(0, 0, w, h); g.lineWidth = 5; g.strokeStyle = C.ink; g.strokeRect(0, 0, w, h);
    SH.drawSprite(g, sp, 22, 47);
    g.restore();
  }

  SH.register({
    id: '16', w: 1080, h: 1920, duration: 8, fps: 30, poster: 3.9,
    fonts: ['400 80px "Bangers"', '900 80px "Nunito"'],
    init(g, W, H) {
      const pp = SH.canvas(W, H), b = pp.g;
      b.fillStyle = C.paper; b.fillRect(0, 0, W, H);
      b.globalCompositeOperation = 'soft-light'; b.globalAlpha = 0.6; b.fillStyle = b.createPattern(SH.grain(512, 1601, { fibres: 300, fine: 10, mottle: 30 }), 'repeat'); b.fillRect(0, 0, W, H);
      S.paper = pp.c;
      S.dSky = g.createPattern(dots(C.cyan, 16, 3.2, C.paper), 'repeat');
      S.dCloud = g.createPattern(dots(C.cloudD, 14, 4.2, C.cloud), 'repeat');
      S.dMag = g.createPattern(dots(C.mag, 14, 3.4, C.yellow), 'repeat');
      S.dGreen = g.createPattern(dots('#1F7A30', 14, 3.6, C.green), 'repeat');
      S.title = SH.textSprite('ŞİMŞEK NASIL ÇAKAR?', 128, { fam: 'Bangers', wt: 400, col: C.yellow, tr: 4, paint: (q, w, h, bx, by, draw) => { q.lineJoin = 'round'; q.font = '400 128px "Bangers"'; q.strokeStyle = C.ink; q.lineWidth = 16; q.fillStyle = C.ink; draw(bx + 8, by + 8); for (const [dx, dy] of [[0, 0]]) { q.save(); q.lineWidth = 14; let x = bx; for (const ch of 'ŞİMŞEK NASIL ÇAKAR?') { q.strokeText(ch, x + dx, by + dy); x += q.measureText(ch).width + 4; } q.restore(); } q.fillStyle = C.yellow; draw(); } });
      S.cloudPath = SH.pathFrom(SH.blob(540, 730, 420, 170, 1602, { bumps: [11, 0.16], wob: 0.03, jit: 1.5 }));
      S.bolt = SH.pathFrom([[470, 1040], [560, 1040], [520, 1170], [600, 1170], [480, 1330], [520, 1220], [450, 1220]]);
      S.burst1 = SH.pathFrom(SH.tfPts(burst(14, 80, 150, 1603), 780, 1180, 1, 0));
      S.burst2 = SH.pathFrom(SH.tfPts(burst(16, 90, 170, 1604), 540, 1690, 1, 0));
      S.ground = SH.pathFrom([[54, 1400], [300, 1360], [560, 1380], [800, 1350], [1026, 1380], [1026, 1490], [54, 1490]]);
      S.trunk = SH.pathFrom([[478, 1385], [486, 1290], [474, 1270], [506, 1270], [498, 1290], [506, 1385]]);
      S.tree = SH.pathFrom(SH.blob(492, 1230, 70, 62, 1607, { bumps: [8, 0.16], wob: 0.03, jit: 1 }));
      const R = rng(1605);
      S.ice = Array.from({ length: 12 }, () => [160 + R() * 760, 650 + R() * 160, R() * 6.28, 16 + R() * 10]);
    },
    frame(g, t, W, H) {
      g.drawImage(S.paper, 0, 0);
      const ts = stepT(t, 12);
      const page = gg => {
        // title logo, slanted
        const tk = E.outBack(P(t, 0.05, 0.5), 1.8);
        if (tk > 0) { gg.save(); gg.translate(540, 300); gg.rotate(-0.06); gg.scale(tk, tk); SH.drawSprite(gg, S.title, 0, 30, { ax: 0.5 }); gg.restore(); }
        PANELS.forEach(([x, y, w, h], i) => {
          const k = P(t, [0.3, 2.3, 4.6][i], [0.6, 2.6, 4.9][i]);
          if (k <= 0) return;
          gg.save(); gg.beginPath(); gg.rect(x, y, w, h * E.outC(k)); gg.clip();
          // panel art
          if (i === 0) {                                  // 1 · ice collides inside the cloud, charges separate
            gg.fillStyle = S.dSky; gg.fillRect(x, y, w, h);
            inked(gg, S.cloudPath, S.dCloud, 7);
            gg.save(); gg.clip(S.cloudPath);
            for (const [ix, iy, a, r] of S.ice) {
              const jx = ix + Math.cos(a + ts * 9) * 22, jy = iy + Math.sin(a * 1.7 + ts * 11) * 16;
              inked(gg, SH.pathFrom(SH.blob(jx, jy, r, r, Math.round(ix), { wob: 0.08, jit: 0.4 })), C.ice, 4, [2, 1]);
              gg.strokeStyle = C.ink; gg.lineWidth = 3; gg.beginPath(); gg.moveTo(jx - r - 18, jy); gg.lineTo(jx - r - 6, jy); gg.moveTo(jx - r - 14, jy + 8); gg.lineTo(jx - r - 4, jy + 8); gg.stroke();   // motion ticks
            }
            const sep = E.ioS(P(t, 1.0, 2.0));
            for (let j = 0; j < 7; j++) {
              const px = 270 + j * 90, plus = j % 2 === 0;
              const yy = lerp(730, plus ? 648 : 836, sep) + Math.sin(ts * 8 + j) * 4;
              gg.save(); gg.globalAlpha = clamp(sep * 3); gg.lineCap = 'round';
              const sym = (col, w) => { gg.strokeStyle = col; gg.lineWidth = w; gg.beginPath(); gg.moveTo(px - 22, yy); gg.lineTo(px + 22, yy); if (plus) { gg.moveTo(px, yy - 22); gg.lineTo(px, yy + 22); } gg.stroke(); };
              sym(C.ink, 20); sym(plus ? C.red : C.cyan, 11);
              gg.restore();
            }
            gg.restore();
          } else if (i === 1) {                           // 2 · the spark jumps to the ground: lightning
            const flash = t > 3.0 && t < 3.6 && Math.floor(t * 20) % 2 === 0;
            gg.fillStyle = flash ? C.yellow : S.dSky; gg.fillRect(x, y, w, h);
            inked(gg, SH.pathFrom(SH.blob(540, 980, 520, 120, 1606, { bumps: [9, 0.2] })), S.dCloud, 7);
            inked(gg, S.ground, S.dGreen, 7); inked(gg, S.trunk, '#8B5A2B', 5); inked(gg, S.tree, S.dGreen, 6);
            const strike = P(t, 2.9, 3.1);
            if (strike > 0) {
              gg.save(); gg.beginPath(); gg.rect(0, 1000, W, 400 * strike); gg.clip();
              gg.shadowColor = 'rgba(255,240,150,0.9)'; gg.shadowBlur = 30; inked(gg, S.bolt, C.yellow, 7, [0, 0]); gg.restore();
              for (let r = 0; r < 4; r++) { gg.strokeStyle = C.ink; gg.lineWidth = 4; const a = -2.4 + r * 0.5; gg.beginPath(); gg.moveTo(500 + Math.cos(a) * 60, 1340 + Math.sin(a) * 60); gg.lineTo(500 + Math.cos(a) * 110, 1340 + Math.sin(a) * 110); gg.stroke(); }
            }
            const bk = E.outBack(P(t, 3.1, 3.4), 2.4);
            if (bk > 0) { gg.save(); gg.translate(780, 1180); gg.rotate(0.12); gg.scale(bk, bk); gg.translate(-780, -1180); inked(gg, S.burst1, S.dMag, 7); SH.drawSprite(gg, SH.textSprite('ÇAT!', 104, { fam: 'Bangers', wt: 400, col: C.red }), 780, 1215, { ax: 0.5 }); gg.restore(); }
          } else {                                        // 3 · the heated air bursts: thunder
            gg.fillStyle = C.sky; gg.fillRect(x, y, w, h);
            for (let r = 0; r < 4; r++) { const u = ((t - 5.0) * 0.8 - r * 0.25); if (u <= 0) continue; const rr = 60 + (u % 1) * 520; gg.strokeStyle = C.ink; gg.lineWidth = 7 * (1 - (u % 1)); gg.beginPath(); gg.arc(540, 1690, rr, Math.PI * 1.05, Math.PI * 1.95); gg.stroke(); }
            const bk = E.outBack(P(t, 5.2, 5.6), 2.4) * (1 + 0.05 * Math.sin(ts * 30) * bump(P(t, 5.6, 6.6)));
            if (bk > 0) { gg.save(); gg.translate(540, 1690); gg.scale(bk, bk); gg.translate(-540, -1690); inked(gg, S.burst2, C.yellow, 7); SH.drawSprite(gg, SH.textSprite('GÜM!', 120, { fam: 'Bangers', wt: 400, col: C.red }), 540, 1730, { ax: 0.5 }); gg.restore(); }
          }
          gg.restore();
          gg.lineWidth = 9; gg.strokeStyle = C.ink; gg.strokeRect(x, y, w, h * E.outC(k));
        });
        caption(gg, '1 · BULUTTA YÜKLER AYRILIR', 74, 536, P(t, 0.9, 1.2));
        caption(gg, '2 · KIVILCIM YERE ATLAR: ŞİMŞEK!', 74, 1036, P(t, 2.7, 3.0));
        caption(gg, '3 · ISINAN HAVA GÜRLER', 74, 1536, P(t, 5.0, 5.3));
        caption(gg, 'IŞIK SESTEN HIZLIDIR!', 520, 1790, P(t, 6.0, 6.3));
      };
      const dis = P(t, 7.1, 7.95);
      page(g);
      if (dis > 0) {                                    // loop: the page dissolves into growing paper dots
        const step = 54, r = E.inQ(dis) * step * 0.75;
        g.save(); g.fillStyle = C.paper;
        for (let y = -step; y < H + step; y += step) for (let x = -step; x < W + step; x += step) { g.beginPath(); g.arc(x + ((y / step) % 2 ? step / 2 : 0), y, r, 0, Math.PI * 2); g.fill(); }
        g.restore();
        if (dis > 0.85) { g.globalAlpha = (dis - 0.85) / 0.15; g.drawImage(S.paper, 0, 0); g.globalAlpha = 1; }
      }
    },
  });
})();
