'use strict';
/* 08 · Origami — folded paper: everything is built from flat facets, each shaded by which way it
   faces, with thin crease highlights. The hero crane folds itself from a square (triangle-by-
   triangle morph), the flock flies in a V, and the whole sheet accordion-folds away at the end. */
(() => {
  const { E, P, clamp, lerp, bump, rng, mix, darken, lighten, rgba } = SH;
  const C = { sky1: '#CFE3EA', sky2: '#F5EEE2', red: '#D64545', white: '#F7F3EC', indigo: '#2F3B66', teal: '#6FA39A', tealD: '#4E857F', tealL: '#9CC6BB', sun: '#F2A93B', ink: '#25304F' };
  const S = {};
  let TEXP = null;

  // a facet: triangle + colour + light amount (−1 dark … +1 lit)
  function facet(g, a, b, c, col, lit, o = {}) {
    const p = new Path2D(); p.moveTo(a[0], a[1]); p.lineTo(b[0], b[1]); p.lineTo(c[0], c[1]); p.closePath();
    g.fillStyle = lit >= 0 ? mix(col, '#FFFFFF', lit * 0.45) : mix(col, '#10131F', -lit * 0.42);
    g.fill(p);
    if (o.tex !== false) { g.save(); g.globalCompositeOperation = 'soft-light'; g.globalAlpha = 0.5; g.fillStyle = TEXP; g.fill(p); g.restore(); }
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1.2; g.stroke(p);   // crease highlight
  }
  // the crane, as triangles in local coords (facing right); wing angle w (−1..1)
  function craneTris(w) {
    const wy = -150 * w, wy2 = -110 * w;
    return [
      [[-20, 0], [60, -10], [10, 40], 'b', 0.35], [[-20, 0], [10, 40], [-60, 20], 'b', -0.2],     // body
      [[10, -6], [-20, wy - 20], [60, -10], 'w', 0.55], [[10, -6], [40, wy2 - 10], [60, -10], 'w', 0.1], // far / near wing
      [[50, -8], [120, -110], [70, 10], 'n', 0.25], [[120, -110], [150, -100], [124, -96], 'h', -0.1],  // neck + head
      [[-30, 10], [-140, -90], [-50, 22], 't', -0.35],                                               // tail
    ];
  }
  function squareTris() {                               // the same 7 triangles laid out as a flat square
    const s = 120, q = [[-s, -s], [s, -s], [s, s], [-s, s]], c = [0, 0];
    return [[q[0], c, q[1]], [q[1], c, q[2]], [q[2], c, q[3]], [q[3], c, q[0]], [[-s, -s], [0, -s], c], [[s, s], [0, s], c], [[s, -s], [s, 0], c]];
  }
  function drawCrane(g, x, y, s, w, fold = 1, col = C.red, flip = 1) {
    const T = craneTris(w), Q = squareTris();
    g.save(); g.translate(x, y); g.scale(s * flip, s);
    T.forEach((tri, i) => {
      const q = Q[i];
      const v = [0, 1, 2].map(k => [lerp(q[k][0], tri[k][0], fold), lerp(q[k][1], tri[k][1], fold)]);
      facet(g, v[0], v[1], v[2], col, lerp(i % 2 ? -0.15 : 0.2, tri[4], fold));
    });
    g.restore();
  }
  function ribbon(text, size) {                         // folded paper strip with a dog-ear fold
    const t = SH.textSprite(text, size, { fam: 'Josefin Sans', wt: 700, col: C.white }), w = t.width + 90, h = size * 1.5;
    const { c, g } = SH.canvas(w + 70, h + 40);
    g.translate(50, 14);
    g.shadowColor = 'rgba(30,40,60,0.3)'; g.shadowBlur = 12; g.shadowOffsetY = 6;
    g.fillStyle = C.indigo; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, 0); g.lineTo(w - 22, h / 2); g.lineTo(w, h); g.lineTo(0, h); g.closePath(); g.fill();
    g.shadowColor = 'transparent';
    g.fillStyle = darken(C.indigo, 0.35); g.beginPath(); g.moveTo(0, 0); g.lineTo(-38, h * 0.5); g.lineTo(0, h); g.closePath(); g.fill();   // folded-back end
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, 0); g.lineTo(w - 11, h / 4); g.lineTo(0, h / 2); g.closePath(); g.fill();
    g.drawImage(t.c, 45 - t.bx, h * 0.5 + size * 0.36 - t.by);
    return { c, x0: -50, y0: -14 };
  }

  SH.register({
    id: '08', w: 1080, h: 1920, duration: 8, fps: 30, poster: 6.2,
    fonts: ['700 80px "Josefin Sans"', '600 80px "Josefin Sans"'],
    init(g, W, H) {
      TEXP = g.createPattern(SH.grain(256, 80, { fibres: 300, fine: 14, mottle: 10 }), 'repeat');
      const bg = SH.canvas(W, H), b = bg.g, gr = b.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, C.sky1); gr.addColorStop(0.75, C.sky2); b.fillStyle = gr; b.fillRect(0, 0, W, H);
      b.globalCompositeOperation = 'soft-light'; b.globalAlpha = 0.6; b.fillStyle = b.createPattern(SH.grain(512, 81), 'repeat'); b.fillRect(0, 0, W, H);
      b.globalCompositeOperation = 'source-over'; b.globalAlpha = 1;
      TEXP = b.createPattern(SH.grain(256, 80, { fibres: 300, fine: 14, mottle: 10 }), 'repeat');
      // faceted sun
      for (let i = 0; i < 8; i++) { const a0 = (i / 8) * Math.PI * 2, a1 = ((i + 1) / 8) * Math.PI * 2; facet(b, [880, 560], [880 + Math.cos(a0) * 110, 560 + Math.sin(a0) * 110], [880 + Math.cos(a1) * 110, 560 + Math.sin(a1) * 110], C.sun, i % 2 ? 0.25 : -0.05); }
      // folded mountains: each peak = a lit and a shaded face
      const peaks = [[-60, 1700, 260, 1250, 560, 1700, C.tealL], [300, 1720, 620, 1180, 980, 1720, C.teal], [640, 1740, 900, 1330, 1160, 1740, C.tealL], [-100, 1920, 220, 1500, 560, 1920, C.tealD], [420, 1920, 760, 1480, 1180, 1920, C.teal]];
      for (const [x0, y0, px, py, x1, y1, col] of peaks) { facet(b, [x0, y0], [px, py], [px + (x1 - x0) * 0.05, y0], col, 0.25); facet(b, [px, py], [x1, y1], [px + (x1 - x0) * 0.05, y0], col, -0.3); }
      S.bg = bg.c;
      S.t1 = SH.textSprite('Turnalar nasıl', 110, { fam: 'Josefin Sans', wt: 700, col: C.ink });
      S.t2 = SH.textSprite('göç eder?', 110, { fam: 'Josefin Sans', wt: 700, col: C.red });
      S.r1 = ribbon('1 · V düzeninde uçarlar', 60);
      S.r2 = ribbon('2 · Lider sırayla değişir', 60);
    },
    frame(g, t, W, H) {
      g.drawImage(S.bg, 0, 0);
      const draw = () => {
        // title folds down like a flap
        const k1 = E.outBack(P(t, 0.1, 0.6), 1.3), k2 = E.outBack(P(t, 0.3, 0.8), 1.3);
        if (k1 > 0) { g.save(); g.translate(90, 250); g.scale(1, Math.max(0.01, k1)); SH.drawSprite(g, S.t1, 0, 60); g.restore(); }
        if (k2 > 0) { g.save(); g.translate(90, 380); g.scale(1, Math.max(0.01, k2)); SH.drawSprite(g, S.t2, 0, 60); g.restore(); }
        // the hero crane folds itself from a square, then joins the flock as its leader
        const fold = E.ioC(P(t, 0.6, 1.9)), flyOff = E.ioC(P(t, 2.0, 3.0));
        const flap = Math.sin(t * 7) * 0.5 + 0.2;
        // the flock in a V, sweeping up across the sky; leader swaps at ~5 s
        const base = [lerp(-200, 640, E.outC(P(t, 2.0, 4.2))), lerp(1300, 960, E.outC(P(t, 2.0, 4.2)))];
        const swap = E.ioC(P(t, 4.9, 6.1));
        const slots = [[0, 0], [-160, 110], [-160, -110], [-320, 220], [-320, -220], [-480, 330]];
        if (t > 2.0) slots.forEach((sl, i) => {
          let s0 = sl;
          if (i === 0) s0 = [lerp(0, -480, swap), lerp(0, -330, swap)];
          else if (i === 1) s0 = [lerp(-160, 0, swap), lerp(110, 0, swap)];
          else if (i === 5) s0 = [lerp(-480, -160, swap), lerp(330, 110, swap)];
          const x = base[0] + s0[0] + Math.sin(t * 2 + i) * 6, y = base[1] + s0[1] * 0.85 + Math.cos(t * 2.4 + i) * 6;
          drawCrane(g, x, y, 0.82, Math.sin(t * 7 + i * 0.8) * 0.6 + 0.2, 1, i === 0 ? C.red : [C.indigo, C.tealD, C.red, C.indigo, C.tealD][i - 1]);
        });
        if (t < 3.0) {
          const x = lerp(540, 640, flyOff), y = lerp(1060, 960, flyOff), s = lerp(1.4, 0.82, flyOff), op = 1 - P(t, 2.6, 3.0);
          g.save(); g.globalAlpha = op;
          drawCrane(g, x, y, s * E.outBack(P(t, 0.25, 0.6), 1.5), fold > 0.95 ? flap * flyOff + 0.15 * (1 - flyOff) : 0.15, fold, C.red);
          g.restore();
        }
        // folded-paper ribbons
        const rk1 = E.outBack(P(t, 3.2, 3.6), 1.6) * (1 - P(t, 4.8, 5.0)), rk2 = E.outBack(P(t, 5.0, 5.4), 1.6);
        if (rk1 > 0) { g.save(); g.translate(110, 1330); g.scale(Math.max(0.01, rk1), 1); g.drawImage(S.r1.c, S.r1.x0, S.r1.y0); g.restore(); }
        if (rk2 > 0) { g.save(); g.translate(110, 1330); g.scale(Math.max(0.01, rk2), 1); g.drawImage(S.r2.c, S.r2.x0, S.r2.y0); g.restore(); }
      };
      // loop: the whole sheet accordion-folds to the right and reveals the plain backdrop
      const af = P(t, 7.1, 7.95);
      if (af <= 0) { draw(); return; }
      const snap = SH.canvas(W, H), sg = snap.g, keep = g;
      sg.drawImage(S.bg, 0, 0);
      const G2 = g; g = sg; draw(); g = G2;                // render the scene into the snapshot
      const N = 6, e = E.ioC(af), sw = W / N, th = e * Math.PI * 0.5, wv = sw * Math.cos(th), total = wv * N, x0 = W - total;
      for (let i = 0; i < N; i++) {
        g.save(); g.translate(x0 + i * wv, 0); g.scale(Math.max(0.001, wv / sw), 1);
        g.drawImage(snap.c, i * sw, 0, sw, H, 0, 0, sw, H);
        g.fillStyle = i % 2 ? `rgba(20,25,45,${(0.45 * e).toFixed(3)})` : `rgba(255,255,255,${(0.25 * e).toFixed(3)})`; g.fillRect(0, 0, sw, H);
        g.restore();
      }
      void keep;
    },
  });
})();
