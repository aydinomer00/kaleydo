'use strict';
/* 14 · Linol Oyma — a two-colour relief print. Black shapes are inked onto an offscreen block,
   V-gouge cuts are carved out of them (tapered strokes, destination-out), ink starves in specks,
   and the block is multiplied onto rag paper over a slightly misregistered red block. Carving marks
   re-cut at 8 fps like a run of hand-printed frames; the print peels away at the end. */
(() => {
  const { E, P, clamp, lerp, bump, rng, mix, darken, lighten, rgba, stepT } = SH;
  const C = { paper: '#F2EEE4', ink: '#1C1A19', red: '#D2452F' };
  const S = {};
  const B = { x: 70, y: 560, w: 940, h: 1180 };            // the printed block

  function gouge(g, a, b, w) {                              // one V-gouge cut: pointed at both ends
    const sp = [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], b];
    g.fill(SH.pathFrom(SH.strip(SH.quadPts(sp[0], [sp[1][0] + (b[1] - a[1]) * 0.06, sp[1][1] - (b[0] - a[0]) * 0.06], sp[2], 8), 0, 0, 7, { profile: u => Math.sin(Math.PI * u) * w, wob: 0 })));
  }
  function wolfPath() {                                    // original sitting, howling wolf built from simple masses
    const parts = [], add = pts => parts.push(SH.pathFrom(pts));   // filled one by one (mixed windings would cut holes)
    add(SH.blob(-60, 40, 115, 92, 1, { wob: 0.03, jit: 0.5 }));                 // haunch
    add(SH.blob(20, -40, 72, 128, 2, { rot: -0.3, wob: 0.03 }));               // chest
    add(SH.rrect(26, -20, 30, 150, 12, 3)); add(SH.rrect(70, -20, 28, 150, 12, 4));   // front legs
    add(SH.strip(SH.quadPts([-150, 80], [-250, 70], [-250, -10], 12), 46, 12, 5, { cap: true }));   // tail
    add(SH.blob(70, -170, 46, 74, 6, { rot: 0.5, wob: 0.03 }));                // neck and head
    add(SH.strip(SH.quadPts([78, -200], [118, -252], [150, -305], 10), 62, 26, 7, { cap: true }));  // snout, raised
    add([[20, -214], [30, -318], [72, -236]]); add([[52, -222], [84, -312], [104, -214]]);          // ears
    add(SH.rrect(-150, 110, 70, 40, 18, 8));                                    // hind paw
    return parts;
  }

  SH.register({
    id: '14', w: 1080, h: 1920, duration: 8, fps: 30, poster: 5.8,
    fonts: ['400 80px "Alfa Slab One"', '700 80px "Nunito"'],
    init(g, W, H) {
      const pp = SH.canvas(W, H), b = pp.g;
      b.fillStyle = C.paper; b.fillRect(0, 0, W, H);
      b.globalCompositeOperation = 'soft-light'; b.globalAlpha = 0.7; b.fillStyle = b.createPattern(SH.grain(512, 1401, { fibres: 1400, fine: 16 }), 'repeat'); b.fillRect(0, 0, W, H);
      S.paper = pp.c;
      S.ink = SH.canvas(W, H); S.red = SH.canvas(W, H);
      // ink starvation: specks where the paper shows through the ink
      const st = SH.canvas(W, H), sg = st.g, R = rng(1402);
      for (let i = 0; i < 26000; i++) { sg.fillStyle = `rgba(0,0,0,${(0.25 + R() * 0.75).toFixed(2)})`; const x = R() * W, y = R() * H, r = 0.6 + R() * 1.8; sg.beginPath(); sg.ellipse(x, y, r * (1 + R()), r, R() * 3, 0, Math.PI * 2); sg.fill(); }
      S.starve = st.c;
      S.wolf = wolfPath();
      S.hillFar = [[B.x, 1380], ...SH.catmullPts([[B.x, 1380], [250, 1300], [420, 1350], [640, 1290], [860, 1340], [B.x + B.w, 1300]], 50), [B.x + B.w, B.y + B.h], [B.x, B.y + B.h]];
      S.rock = [[B.x, 1560], ...SH.catmullPts([[B.x, 1560], [300, 1500], [460, 1440], [640, 1450], [780, 1520], [B.x + B.w, 1560]], 40), [B.x + B.w, B.y + B.h], [B.x, B.y + B.h]];
      S.t1 = SH.textSprite('Kurtlar neden', 104, { fam: 'Alfa Slab One', wt: 400, col: C.ink });
      S.t2 = SH.textSprite('uluyor?', 104, { fam: 'Alfa Slab One', wt: 400, col: C.red });
      S.labels = ['1 · Sürüsünü çağırır', '2 · Uzaktakiler cevap verir', "3 · Ay'a değil, sürüsüne ulur!"].map(s => SH.textSprite(s, 50, { fam: 'Alfa Slab One', wt: 400, col: C.ink }));
    },
    frame(g, t, W, H) {
      g.drawImage(S.paper, 0, 0);
      const ts = stepT(t, 8), seed = Math.floor(ts * 8);     // carving re-cut at 8 fps
      const press = E.outC(P(t, 0.0, 0.7)), peel = P(t, 7.0, 7.95);
      // red block: the moon (printed first, 6 px off register)
      const rg = S.red.g; rg.setTransform(1, 0, 0, 1, 0, 0); rg.clearRect(0, 0, W, H);
      rg.fillStyle = C.red; rg.beginPath(); rg.arc(560, 1000, 310, 0, Math.PI * 2); rg.fill();
      rg.globalCompositeOperation = 'destination-out'; rg.fillStyle = '#000';
      const Rr = rng(1403);
      for (let i = 0; i < 70; i++) { const a = Rr() * 6.28, r = Rr() * 290, x = 560 + Math.cos(a) * r, y = 1000 + Math.sin(a) * r; gouge(rg, [x, y], [x + 30 + Rr() * 30, y + (Rr() - 0.5) * 10], 4); }
      rg.drawImage(S.starve, 0, 0); rg.globalCompositeOperation = 'source-over';
      // black block: night sky with a moon-shaped hole, far hills, rock, wolves, carved sound
      const ig = S.ink.g; ig.setTransform(1, 0, 0, 1, 0, 0); ig.globalCompositeOperation = 'source-over'; ig.clearRect(0, 0, W, H);
      ig.fillStyle = C.ink; ig.fillRect(B.x, B.y, B.w, B.h);
      ig.globalCompositeOperation = 'destination-out'; ig.fillStyle = '#000';
      ig.beginPath(); ig.arc(560, 1000, 304, 0, Math.PI * 2); ig.fill();                       // the moon window
      const R = rng(1500 + seed);
      for (let r = 340; r < 620; r += 34) { ig.lineWidth = 6 + (r % 3); ig.strokeStyle = '#000'; ig.beginPath(); ig.arc(560 + (R() - 0.5) * 4, 1000 + (R() - 0.5) * 4, r, -2.9 + R() * 0.2, -0.25 - R() * 0.2); ig.stroke(); }  // halo cuts
      for (let i = 0; i < 70; i++) { const x = B.x + 20 + R() * (B.w - 40), y = B.y + 20 + R() * 260; if (Math.hypot(x - 560, y - 1000) < 640) continue; gouge(ig, [x, y], [x + 40 + R() * 50, y + (R() - 0.5) * 8], 5); }  // sky chips
      ig.globalCompositeOperation = 'source-over'; ig.fillStyle = C.ink; ig.fill(SH.pathFrom(S.hillFar));
      ig.globalCompositeOperation = 'destination-out';
      for (let y = 1330; y < 1560; y += 16) for (let x = B.x + 10; x < B.x + B.w - 10; x += 70 + R() * 30) gouge(ig, [x, y + (R() - 0.5) * 6], [x + 50 + R() * 30, y + (R() - 0.5) * 6], 4);   // far hills read grey
      ig.globalCompositeOperation = 'source-over'; ig.fillStyle = C.ink; ig.fill(SH.pathFrom(S.rock));
      ig.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 40; i++) { const x = B.x + R() * B.w, y = 1560 + R() * 160; gouge(ig, [x, y], [x + 30 + R() * 40, y - 6 - R() * 10], 5); }
      // distant wolves answer (appear at 3 s)
      const ans = P(t, 3.0, 3.3);
      ig.globalCompositeOperation = 'source-over'; ig.fillStyle = C.ink;
      if (ans > 0) for (const [x, y, s, f] of [[230, 1318, 0.3, -1], [880, 1300, 0.28, 1]]) { ig.save(); ig.translate(x, y); ig.scale(f * s, s); S.wolf.forEach(q => ig.fill(q)); ig.restore(); }
      // the hero wolf, head lifted while howling (stepped)
      const howl = t > 1.0 && t < 6.6, lift = howl ? 0.05 * Math.sin(ts * 6) : 0;
      ig.save(); ig.translate(470, 1330); ig.scale(1.25, 1.25); ig.rotate(-lift); S.wolf.forEach(q => ig.fill(q)); ig.restore();
      // fur cut into the wolf
      ig.globalCompositeOperation = 'destination-out';
      ig.save(); ig.translate(470, 1330); ig.scale(1.25, 1.25); ig.rotate(-lift);
      for (let i = 0; i < 30; i++) { const x = -150 + R() * 230, y = -120 + R() * 220; gouge(ig, [x, y], [x - 16 - R() * 12, y + 10 + R() * 8], 2.6); }
      ig.beginPath(); ig.ellipse(84, -196, 13, 5, -0.7, 0, Math.PI * 2); ig.fill();     // carved eye
      ig.restore();
      // sound rings carved into the sky: from the hero, then answers from far away
      const ring = (cx, cy, t0, n, maxR, a0, a1) => { for (let k = 0; k < n; k++) { const u = ((t - t0) * 0.55 - k * 0.22) % 1; if (t < t0 || u < 0) continue; const r = 40 + stepT(u, 8) * maxR; ig.lineWidth = 9 * (1 - u) + 2; ig.strokeStyle = '#000'; ig.beginPath(); ig.arc(cx, cy, r, a0, a1); ig.stroke(); } };
      if (howl) ring(670, 930, 1.2, 4, 440, -1.75, -0.15);
      if (ans > 0 && t < 6.6) { ring(300, 1250, 3.4, 3, 260, -2.6, -0.6); ring(800, 1240, 3.6, 3, 240, -2.5, -0.5); }
      // labels on a carved-out banner along the bottom of the block
      const L = [[1.5, 3.0], [3.1, 4.8], [5.0, 9]];
      L.forEach(([a, b2], i) => {
        const k = P(t, a, a + 0.15) * (1 - P(t, b2, b2 + 0.15));
        if (k <= 0) return;
        ig.fillStyle = '#000'; ig.beginPath(); ig.roundRect(B.x + 40, B.y + B.h - 150, B.w - 80, 110, 10); ig.fill();
      });
      ig.globalCompositeOperation = 'destination-out'; ig.drawImage(S.starve, 0, 0); ig.globalCompositeOperation = 'source-over';
      // print: press the paper onto the blocks (coverage builds), then everything multiplies onto the paper
      const prt = SH.canvas(W, H);
      const pg = prt.g; pg.drawImage(S.paper, 0, 0);
      pg.save(); pg.globalCompositeOperation = 'multiply'; pg.globalAlpha = press; pg.drawImage(S.red.c, 6, -5); pg.drawImage(S.ink.c, 0, 0); pg.restore();
      // title and labels in printed type
      const tk = E.outC(P(t, 0.25, 0.75));
      pg.save(); pg.globalCompositeOperation = 'multiply'; pg.globalAlpha = tk;
      SH.drawSprite(pg, S.t1, 92, 330); SH.drawSprite(pg, S.t2, 92, 470);
      pg.fillStyle = C.red; pg.fillRect(560, 430, 420, 26);
      L.forEach(([a, b2], i) => { const k = P(t, a, a + 0.15) * (1 - P(t, b2, b2 + 0.15)); if (k > 0) { pg.globalAlpha = k; SH.drawSprite(pg, S.labels[i], W / 2, B.y + B.h - 78, { ax: 0.5 }); } });
      pg.restore();
      if (peel <= 0) { g.drawImage(prt.c, 0, 0); return; }
      // loop: the print is peeled off from the bottom-right corner; blank paper underneath
      const e = E.inOutC ? 0 : 0, k = E.ioC(peel), d = k * (W + H) * 1.05;
      void e;
      g.save(); g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, Math.max(0, H - d)); g.lineTo(Math.max(0, W - d), H); g.lineTo(0, H); g.closePath(); g.clip(); g.drawImage(prt.c, 0, 0); g.restore();
      // the curled-back flap (paper back, folded along the diagonal)
      g.save(); g.beginPath(); g.moveTo(W, Math.max(0, H - d)); g.lineTo(Math.max(0, W - d), H); g.lineTo(W - d, H - d); g.closePath();
      g.shadowColor = 'rgba(30,25,20,0.4)'; g.shadowBlur = 24; g.shadowOffsetX = -8; g.shadowOffsetY = -8; g.fillStyle = '#FBF8F1'; g.fill(); g.restore();
    },
  });
})();
