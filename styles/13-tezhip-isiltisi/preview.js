'use strict';
/* 13 · Tezhip Işıltısı — an illuminated manuscript page. Everything gilded is drawn into a mask;
   each frame the mask is filled with a burnished-gold gradient whose highlight band slides across
   (the shimmer), plus a fine leaf-crack texture. Lapis panels, cinnabar and white details.
   Story: the Moon's lit half always faces the Sun; from Earth we see a changing part of it. */
(() => {
  const { E, P, clamp, lerp, bump, rng, mix, darken, lighten, rgba } = SH;
  const C = { paper: '#F1E6CC', lapis: '#16285A', lapisL: '#22397A', gold: '#C9A23C', goldD: '#8C6A1F', goldL: '#F6E3A1', red: '#B33A2E', cream: '#F7EFDA', earth: '#2E7FA8', earthG: '#5E9B57' };
  const W0 = 1080, H0 = 1920, IN = 168;                    // inner panel inset
  const S = {};
  const EARTH = [540, 1080], ORBIT = 250, MED = 1560;

  function drawPhase(g, x, y, r, ph, lit = C.cream, dark = '#0E1A3D') {   // ph: 0 new · 0.25 first quarter · 0.5 full
    g.save(); g.fillStyle = dark; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    const a = ph * Math.PI * 2, k = Math.cos(a), waxing = ph < 0.5;
    g.fillStyle = lit; g.beginPath();
    g.arc(x, y, r, -Math.PI / 2, Math.PI / 2, !waxing);                 // the lit half
    g.ellipse(x, y, Math.abs(k) * r, r, 0, Math.PI / 2, -Math.PI / 2, (k > 0) === waxing);   // the terminator
    g.fill(); g.restore();
  }
  // gold mask shapes (white); reveal r animates the frame drawing itself in
  function vine(g, x0, y0, x1, y1, seed, u) {           // a scrolling vine with leaves and rosettes along a band
    const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L, nx = -uy, ny = ux, R = rng(seed);
    const n = Math.floor((L / 18) * u);
    g.lineWidth = 5; g.lineCap = 'round'; g.beginPath();
    for (let i = 0; i <= n; i++) { const s = i * 18, w = Math.sin(s / 46) * 18; const x = x0 + ux * s + nx * w, y = y0 + uy * s + ny * w; i ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
    for (let s = 23; s < L * u; s += 46 * Math.PI / 2) {
      const w = Math.sin(s / 46) * 18, x = x0 + ux * s + nx * w, y = y0 + uy * s + ny * w, side = Math.sign(Math.cos(s / 46)) || 1;
      g.save(); g.translate(x, y); g.rotate(Math.atan2(uy, ux) + side * 0.9); g.fill(SH.pathFrom(SH.lobe(22, 12, seed + s, { jit: 0.1 }))); g.restore();
    }
  }
  function star4(g, x, y, r) { g.beginPath(); SH.starPts(x, y, r * 0.28, r, 4).forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fill(); }

  SH.register({
    id: '13', w: 1080, h: 1920, duration: 8, fps: 30, poster: 4.2,
    fonts: ['700 80px "Cinzel Decorative"', '700 80px "Cinzel"', '600 80px "Cinzel"'],
    init(g, W, H) {
      const pp = SH.canvas(W, H), b = pp.g;
      b.fillStyle = C.paper; b.fillRect(0, 0, W, H);
      b.globalCompositeOperation = 'soft-light'; b.globalAlpha = 0.6; b.fillStyle = b.createPattern(SH.grain(512, 1301, { fibres: 900 }), 'repeat'); b.fillRect(0, 0, W, H);
      const sheen = b.createLinearGradient(0, 0, W, H); sheen.addColorStop(0, 'rgba(255,255,255,0.12)'); sheen.addColorStop(0.5, 'rgba(255,255,255,0)'); sheen.addColorStop(1, 'rgba(120,90,40,0.1)');
      b.globalCompositeOperation = 'source-over'; b.globalAlpha = 1; b.fillStyle = sheen; b.fillRect(0, 0, W, H);   // burnished paper
      S.paper = pp.c;
      S.leaf = SH.grain(256, 1302, { fibres: 0, fine: 40, mottle: 50 });   // gold-leaf texture
      S.mask = SH.canvas(W, H); S.goldBuf = SH.canvas(W, H);
      const R = rng(1303);
      S.stars = Array.from({ length: 42 }, () => [IN + 30 + R() * (W - 2 * IN - 60), 560 + R() * 820, 4 + R() * 9, R()]);
      S.t1 = SH.textSprite('AY NEDEN', 92, { fam: 'Cinzel Decorative', wt: 700, col: '#fff' });
      S.t2 = SH.textSprite('ŞEKİL DEĞİŞTİRİR?', 70, { fam: 'Cinzel Decorative', wt: 700, col: '#fff' });
      S.labels = ['1 · YARISI HEP AYDINLIK', '2 · BİZ KISMINI GÖRÜRÜZ', '3 · BİR TUR: 29,5 GÜN'].map(s => SH.textSprite(s, 40, { fam: 'Cinzel', wt: 700, col: C.cream }));
      S.sunT = SH.textSprite('GÜNEŞ', 30, { fam: 'Cinzel', wt: 700, col: C.goldL });
    },
    frame(g, t, W, H) {
      g.drawImage(S.paper, 0, 0);
      const draw = P(t, 0.05, 1.0), sweep = P(t, 7.05, 7.95);
      // lapis panels: the border band and the night-sky centre (they appear as the frame is drawn)
      const pk = E.outC(P(t, 0.2, 0.9));
      if (pk > 0) {
        g.save(); g.globalAlpha = pk;
        g.fillStyle = C.lapis; g.fillRect(70, 110, W - 140, H - 220);
        g.fillStyle = C.paper; g.fillRect(150, 190, W - 300, H - 380);
        const sky = g.createLinearGradient(0, IN, 0, H - IN); sky.addColorStop(0, C.lapis); sky.addColorStop(1, '#0E1A3D');
        g.fillStyle = sky; g.fillRect(IN, IN + 40, W - 2 * IN, H - 2 * IN - 80);
        g.restore();
      }
      // ---- gold mask for this frame ----
      const m = S.mask.g; m.setTransform(1, 0, 0, 1, 0, 0); m.clearRect(0, 0, W, H); m.fillStyle = '#fff'; m.strokeStyle = '#fff';
      const rule = (x, y, w, h, lw) => { m.lineWidth = lw; m.strokeRect(x, y, w, h); };
      if (draw > 0) {
        m.save(); m.beginPath(); m.rect(0, 0, W * draw * 1.2, H); m.clip();
        rule(50, 90, W - 100, H - 180, 4); rule(62, 102, W - 124, H - 204, 2); rule(158, 198, W - 316, H - 396, 3);
        m.restore();
        vine(m, 110, 150, W - 110, 150, 1, draw); vine(m, 110, H - 150, W - 110, H - 150, 2, draw);
        vine(m, 110, 150, 110, H - 150, 3, draw); vine(m, W - 110, 150, W - 110, H - 150, 4, draw);
        for (const [x, y] of [[110, 150], [W - 110, 150], [110, H - 150], [W - 110, H - 150]]) { const k = E.outBack(P(t, 0.6, 1.0), 1.6); if (k > 0) { m.save(); m.translate(x, y); m.scale(k, k); for (let i = 0; i < 8; i++) { m.save(); m.rotate((i / 8) * Math.PI * 2); m.fill(SH.pathFrom(SH.lobe(34, 18, 9 + i, { jit: 0.1 }))); m.restore(); } m.beginPath(); m.arc(0, 0, 12, 0, Math.PI * 2); m.fill(); m.restore(); } }
      }
      // stars, title lettering
      for (const [x, y, r, ph] of S.stars) { const k = P(t, 0.9 + ph * 0.6, 1.2 + ph * 0.6); if (k > 0) { m.globalAlpha = k * (0.75 + 0.25 * Math.sin(t * 3 + ph * 20)); star4(m, x, y, r); } }
      m.globalAlpha = 1;
      const tk = E.outC(P(t, 0.7, 1.3));
      if (tk > 0) { m.globalAlpha = tk; SH.drawSprite(m, S.t1, W / 2, 330, { ax: 0.5 }); SH.drawSprite(m, S.t2, W / 2, 440, { ax: 0.5 }); m.globalAlpha = 1; }
      // the sun's rays from the left, the orbit, medallion rims
      const rays = E.outC(P(t, 1.3, 2.1));
      if (rays > 0) {
        m.lineWidth = 3; m.globalAlpha = 0.9;
        for (let i = 0; i < 7; i++) { const y = 860 + i * 70; m.beginPath(); m.moveTo(IN + 20, y); m.lineTo(IN + 20 + 210 * rays, y + (EARTH[1] - y) * 0.08 * rays); m.stroke(); m.beginPath(); m.moveTo(IN + 20 + 210 * rays, y + (EARTH[1] - y) * 0.08 * rays); m.lineTo(IN + 6 + 210 * rays, y - 8); m.stroke(); }
        m.globalAlpha = 1;
        m.setLineDash([3, 13]); m.lineWidth = 4; m.beginPath(); m.arc(EARTH[0], EARTH[1], ORBIT, 0, Math.PI * 2 * rays); m.stroke(); m.setLineDash([]);
      }
      const medK = E.outC(P(t, 2.2, 2.8));
      for (let i = 0; i < 8; i++) { if (medK <= 0) break; const x = 225 + i * 90; m.lineWidth = 6; m.beginPath(); m.arc(x, MED, 42 * medK, 0, Math.PI * 2); m.stroke(); }
      // fill the mask with burnished gold; the highlight band slides across (shimmer)
      const gb = S.goldBuf.g; gb.setTransform(1, 0, 0, 1, 0, 0); gb.globalCompositeOperation = 'source-over'; gb.clearRect(0, 0, W, H);
      const off = ((t * 0.18) % 1) * 2 - 0.5;
      const gr = gb.createLinearGradient(W * (off - 0.6), 0, W * (off + 0.6), H * 0.45);
      gr.addColorStop(0, C.goldD); gr.addColorStop(0.35, C.gold); gr.addColorStop(0.5, C.goldL); gr.addColorStop(0.65, C.gold); gr.addColorStop(1, C.goldD);
      gb.fillStyle = gr; gb.fillRect(0, 0, W, H);
      gb.globalCompositeOperation = 'soft-light'; gb.globalAlpha = 0.6; gb.fillStyle = gb.createPattern(S.leaf, 'repeat'); gb.fillRect(0, 0, W, H); gb.globalAlpha = 1;
      gb.globalCompositeOperation = 'destination-in'; gb.drawImage(S.mask.c, 0, 0);
      g.save(); g.shadowColor = 'rgba(40,25,5,0.45)'; g.shadowBlur = 3; g.shadowOffsetY = 2; g.drawImage(S.goldBuf.c, 0, 0); g.restore();
      // cinnabar and white accents on the border band
      if (draw > 0.9) { for (let i = 0; i < 14; i++) { const x = 130 + i * 63; for (const y of [150, H - 150]) { g.fillStyle = i % 2 ? C.red : C.cream; g.beginPath(); g.arc(x + 20, y + 22, 4, 0, Math.PI * 2); g.fill(); } } }
      // Earth, and the Moon orbiting it; the Moon's lit half always faces the Sun (left)
      if (rays > 0) {
        g.save(); g.globalAlpha = rays;
        const eg = g.createRadialGradient(EARTH[0] - 18, EARTH[1] - 18, 6, EARTH[0], EARTH[1], 46); eg.addColorStop(0, '#6FB6D9'); eg.addColorStop(1, C.earth);
        g.fillStyle = eg; g.beginPath(); g.arc(EARTH[0], EARTH[1], 46, 0, Math.PI * 2); g.fill();
        g.fillStyle = C.earthG; g.beginPath(); g.ellipse(EARTH[0] - 10, EARTH[1] - 8, 20, 14, 0.4, 0, Math.PI * 2); g.ellipse(EARTH[0] + 16, EARTH[1] + 16, 12, 9, 0, 0, Math.PI * 2); g.fill();
        SH.drawSprite(g, S.sunT, IN + 60, 830, { alpha: rays });
        g.restore();
      }
      const orbitU = P(t, 2.4, 6.6), theta = Math.PI - orbitU * Math.PI * 2;     // starts between Earth and Sun (new moon)
      if (t > 2.3) {
        const mx = EARTH[0] + Math.cos(theta) * ORBIT, my = EARTH[1] + Math.sin(theta) * ORBIT;
        g.save(); g.fillStyle = '#0E1A3D'; g.beginPath(); g.arc(mx, my, 40, 0, Math.PI * 2); g.fill();
        g.fillStyle = C.cream; g.beginPath(); g.arc(mx, my, 40, Math.PI / 2, Math.PI * 1.5); g.fill();   // the lit half faces the Sun
        g.strokeStyle = C.gold; g.lineWidth = 2; g.beginPath(); g.arc(mx, my, 40, 0, Math.PI * 2); g.stroke(); g.restore();
        // what Earth sees: the current phase lights up its medallion
        const ph = ((Math.PI - theta) / (Math.PI * 2) + 1) % 1, cur = Math.round(ph * 8) % 8;
        for (let i = 0; i < 8; i++) {
          const x = 225 + i * 90, shown = i <= Math.floor(orbitU * 8 + 0.5) || t > 6.6;
          if (!shown) continue;
          drawPhase(g, x, MED, 37, i / 8);
          if (i === cur && t < 6.7) { g.save(); g.globalCompositeOperation = 'lighter'; const hg = g.createRadialGradient(x, MED, 20, x, MED, 70); hg.addColorStop(0, 'rgba(246,227,161,0.5)'); hg.addColorStop(1, 'rgba(246,227,161,0)'); g.fillStyle = hg; g.fillRect(x - 70, MED - 70, 140, 140); g.restore(); }
        }
        // a dotted sight line from Earth to the Moon
        g.save(); g.strokeStyle = rgba(C.goldL, 0.6); g.setLineDash([2, 10]); g.lineWidth = 3; g.beginPath(); g.moveTo(EARTH[0], EARTH[1]); g.lineTo(mx, my); g.stroke(); g.restore();
      }
      // labels in a gold-ruled cartouche above the medallions
      [[2.6, 3.9], [4.0, 5.3], [5.5, 9]].forEach(([a, b2], i) => {
        const k = E.outC(P(t, a, a + 0.4)) * (1 - P(t, b2, b2 + 0.3));
        if (k <= 0) return;
        const sp = S.labels[i], w = sp.width + 70;
        g.save(); g.globalAlpha = k; g.fillStyle = 'rgba(14,26,61,0.92)'; g.beginPath(); g.roundRect(W / 2 - w / 2, 1420 - 46, w, 74, 37); g.fill();
        g.strokeStyle = C.gold; g.lineWidth = 2.5; g.stroke(); g.restore();
        SH.drawSprite(g, sp, W / 2, 1420 + 3, { ax: 0.5, alpha: k });
      });
      // loop: a diagonal sweep turns the page back to blank burnished paper, gold dust at its edge
      if (sweep > 0) {
        const e = E.ioC(sweep), pos = lerp(-0.25, 1.25, e) * (W + H);
        g.save(); g.beginPath(); g.moveTo(0, 0); g.lineTo(pos, 0); g.lineTo(0, pos); g.closePath(); g.clip(); g.drawImage(S.paper, 0, 0); g.restore();
        const R = rng(1309);
        g.save(); g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 160; i++) { const u = R(), d = (R() - 0.3) * 90, x = u * pos, y = pos - x; const px = x + d * 0.7, py = y + d * 0.7; if (px < 0 || py < 0 || px > W || py > H) continue; g.fillStyle = `rgba(246,227,161,${(0.25 + R() * 0.6).toFixed(2)})`; star4(g, px, py, 3 + R() * 7); }
        g.restore();
      }
    },
  });
})();
