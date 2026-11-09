'use strict';
/* 22 · Gece Işıltısı — a moonlit meadow at night: deep blue gradient sky, twinkling stars, silhouettes with moon rims,
   and living light. Glow is additive ('lighter') with soft blooms; text glows softly in a rounded face.
   A firefly paints a long trail of light across the screen, the glow floods the frame and settles on a calm night. */
(() => {
  const { E, P, clamp, lerp, rng, rgba } = SH;
  const C = { sky0: '#070A22', sky1: '#141C47', sky2: '#26306A', sky3: '#10163A', tree: '#0D1333', grass: '#060A1D', moon: '#F4F1DE', glow: '#D8FF6A', warm: '#FFF3B0', text: '#FFF6D2', label: '#E6EEFF', cool: '#8FD3FF', shell: '#2A2638', shield: '#F2C14E', spot: '#E0623A' };
  const S = {};
  const HERO = { x: 470, y: 900, sc: 1.2 };
  const LANT = [262, 26];                                      // lantern centre in hero-local coordinates
  const TAU = Math.PI * 2;

  function glowSprite(r, inner, mid) {
    const { c, g } = SH.canvas(r * 2, r * 2), gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, inner); gr.addColorStop(0.18, mid); gr.addColorStop(0.5, rgba(C.glow, 0.16)); gr.addColorStop(1, rgba(C.glow, 0));
    g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2);
    return c;
  }
  const glowText = (s, size, wt, col, glowCol, blur) => SH.textSprite(s, size, {
    fam: 'Comfortaa', wt, col, key: 'glow' + blur, pad: 0.6,
    paint: (q, w, h, bx, by, draw) => { q.save(); q.shadowColor = glowCol; q.shadowBlur = blur; q.fillStyle = col; draw(); draw(); q.restore(); q.fillStyle = col; draw(); },
  });
  function reveal(g, sp, x, y, u, o = {}) {                     // letters brighten left to right
    u = clamp(u);
    if (u <= 0) return;
    const cw = u >= 1 ? sp.w : sp.bx + sp.width * u + 30;
    g.save(); if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
    g.drawImage(sp.c, 0, 0, Math.min(sp.w, cw), sp.h, x - (o.ax || 0) * sp.width - sp.bx, y - sp.by, Math.min(sp.w, cw), sp.h);
    g.restore();
  }
  function glowLine(g, pts, u, w = 3, col = C.warm) {
    if (u <= 0) return;
    const p = SH.partial(pts, u);
    if (p.length < 2) return;
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.shadowColor = col; g.shadowBlur = 14; g.strokeStyle = col; g.lineWidth = w; g.stroke(SH.pathFrom(p, false));
    if (u >= 1) { const [x, y] = p[p.length - 1]; g.fillStyle = col; g.beginPath(); g.arc(x, y, w * 2, 0, TAU); g.fill(); }
    g.restore();
  }
  function arrowHead(g, x, y, a, col, w = 3, L = 16) {
    g.save(); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.shadowColor = col; g.shadowBlur = 10; g.beginPath();
    for (const s of [-1, 1]) { g.moveTo(x, y); g.lineTo(x - Math.cos(a + s * 0.55) * L, y - Math.sin(a + s * 0.55) * L); }
    g.stroke(); g.restore();
  }

  // ---- the hero firefly (side view, facing left; local units ≈ px)
  function hero(g, t, lit, flap) {
    const rim = 'rgba(190,205,255,0.45)';
    // translucent hind wings, beating
    const wa = flap ? (Math.floor(t * 30) % 2 ? -0.95 : -0.35) : -0.6;
    for (const [dx, k] of [[10, 1], [-6, 0.8]]) {
      g.save(); g.translate(-10 + dx, -30); g.rotate(wa * k);
      g.fillStyle = 'rgba(200,220,255,0.16)'; g.strokeStyle = 'rgba(215,230,255,0.4)'; g.lineWidth = 2;
      g.beginPath(); g.ellipse(170, 0, 175, 40, 0, 0, TAU); g.fill(); g.stroke();
      g.strokeStyle = 'rgba(215,230,255,0.22)'; g.beginPath(); g.moveTo(10, 0); g.quadraticCurveTo(170, -12, 330, 0); g.moveTo(40, 8); g.quadraticCurveTo(170, 18, 300, 14); g.stroke();
      g.restore();
    }
    // legs
    g.strokeStyle = '#1A1722'; g.lineWidth = 6; g.lineCap = 'round'; g.lineJoin = 'round';
    for (const [x0, a1, a2] of [[-70, 1.9, 2.4], [-30, 1.6, 2.0], [10, 1.2, 1.6]]) { const kx = x0 + Math.cos(a1) * 50, ky = 40 + Math.sin(a1) * 50; g.beginPath(); g.moveTo(x0, 36); g.lineTo(kx, ky); g.lineTo(kx + Math.cos(a2) * 46, ky + Math.sin(a2) * 46); g.stroke(); }
    // abdomen with segments and the lantern at its tip
    const abd = new Path2D(); abd.ellipse(140, 20, 160, 56, 0.06, 0, TAU);
    g.fillStyle = '#3B3242'; g.fill(abd);
    g.save(); g.clip(abd);
    g.fillStyle = '#56495E'; g.fillRect(-40, 34, 400, 60);
    const lg = g.createLinearGradient(196, 0, 300, 0); lg.addColorStop(0, '#C9D88A'); lg.addColorStop(1, '#F1FFC2');
    g.fillStyle = lg; g.fillRect(212, -60, 120, 140);
    if (lit > 0) { g.globalAlpha = lit; g.fillStyle = '#FBFFE6'; g.fillRect(212, -60, 120, 140); g.globalAlpha = 1; }
    g.strokeStyle = 'rgba(20,16,26,0.55)'; g.lineWidth = 3;
    for (const x of [40, 90, 140, 186, 212, 250]) { g.beginPath(); g.moveTo(x, -50); g.quadraticCurveTo(x + 12, 20, x, 90); g.stroke(); }
    g.restore();
    g.strokeStyle = rim; g.lineWidth = 3; g.beginPath(); g.ellipse(140, 20, 160, 56, 0.06, Math.PI * 1.15, Math.PI * 1.75); g.stroke();
    // wing covers (elytra), raised, dark with pale margins
    for (const [a, sh] of [[-0.42, 0.75], [-0.22, 1]]) {
      g.save(); g.translate(-40, -26); g.rotate(a);
      const el = new Path2D(); el.ellipse(120, 0, 135, 30, 0, 0, TAU);
      g.fillStyle = SH.mix(C.shell, '#000000', 1 - sh); g.fill(el);
      g.strokeStyle = '#BFAE7E'; g.lineWidth = 4; g.stroke(el);
      g.strokeStyle = rim; g.lineWidth = 2; g.beginPath(); g.ellipse(120, 0, 135, 30, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
      g.restore();
    }
    // head, eye, antennae
    g.strokeStyle = '#1A1722'; g.lineWidth = 5;
    for (const [ex, ey] of [[-270, -100], [-262, -60]]) { g.beginPath(); g.moveTo(-140, -6); g.quadraticCurveTo(-190, ex === -270 ? -70 : -36, ex, ey); g.stroke(); }
    g.fillStyle = '#1E1A24'; g.beginPath(); g.arc(-122, 10, 30, 0, TAU); g.fill();
    g.fillStyle = '#0B0A10'; g.beginPath(); g.arc(-138, 6, 15, 0, TAU); g.fill();
    g.fillStyle = 'rgba(220,235,255,0.9)'; g.beginPath(); g.arc(-142, 1, 4.5, 0, TAU); g.fill();
    // the shield over the head: yellow with a red spot and a dark stripe
    const sh = new Path2D(); sh.ellipse(-72, -18, 74, 46, -0.1, 0, TAU);
    g.fillStyle = C.shield; g.fill(sh);
    g.save(); g.clip(sh); g.fillStyle = C.spot; g.beginPath(); g.ellipse(-62, -22, 34, 22, -0.1, 0, TAU); g.fill(); g.fillStyle = '#1E1A24'; g.fillRect(-70, -70, 14, 100); g.restore();
    g.strokeStyle = rim; g.lineWidth = 3; g.beginPath(); g.ellipse(-72, -18, 74, 46, -0.1, Math.PI * 1.1, Math.PI * 1.8); g.stroke();
  }

  SH.register({
    id: '22', w: 1080, h: 1920, duration: 8, fps: 30, poster: 6.55,
    fonts: ['700 80px "Comfortaa"', '600 80px "Comfortaa"'],
    init(g, W, H) {
      const R = rng(2201);
      const bg = SH.canvas(W, H), b = bg.g, gr = b.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, C.sky0); gr.addColorStop(0.42, C.sky1); gr.addColorStop(0.66, C.sky2); gr.addColorStop(1, C.sky3);
      b.fillStyle = gr; b.fillRect(0, 0, W, H);
      b.globalCompositeOperation = 'soft-light'; b.globalAlpha = 0.25; b.fillStyle = b.createPattern(SH.grain(256, 2202, { fibres: 0, fine: 16, mottle: 20 }), 'repeat'); b.fillRect(0, 0, W, H);
      b.globalCompositeOperation = 'source-over'; b.globalAlpha = 1;
      // moon with halo
      const mh = b.createRadialGradient(925, 170, 30, 925, 170, 300); mh.addColorStop(0, 'rgba(225,232,255,0.30)'); mh.addColorStop(1, 'rgba(225,232,255,0)');
      b.fillStyle = mh; b.fillRect(600, 0, 480, 480);
      const mc = SH.canvas(160, 160), m = mc.g;
      m.fillStyle = C.moon; m.beginPath(); m.arc(80, 80, 56, 0, TAU); m.fill();
      m.globalCompositeOperation = 'destination-out'; m.beginPath(); m.arc(56, 66, 50, 0, TAU); m.fill();
      b.drawImage(mc.c, 845, 90);
      // far trees, then hill
      b.fillStyle = C.tree;
      for (let x = -40; x < W + 40; x += 34) { const h0 = 1270 - 40 * SH.noise1(2203, x * 0.01) - (R() < 0.18 ? 60 : 0); b.beginPath(); b.arc(x, h0, 32 + R() * 22, 0, TAU); b.fill(); }
      b.fillRect(0, 1260, W, 200);
      b.fillStyle = '#0A0F2A'; b.beginPath(); b.moveTo(0, 1360); for (let x = 0; x <= W; x += 40) b.lineTo(x, 1350 - 30 * Math.sin(x * 0.004 + 0.8)); b.lineTo(W, H); b.lineTo(0, H); b.fill();
      S.bg = bg.c;
      // foreground grass and flower silhouettes (static) with a faint moon rim
      const fg = SH.canvas(W, H), f = fg.g;
      for (let i = 0; i < 150; i++) {
        const x = R() * W, h = 120 + R() * 300, lean = (R() - 0.5) * 90, y0 = H + 10;
        const spine = SH.thruPts([x, y0], [x + lean * 0.3, y0 - h * 0.55], [x + lean, y0 - h], 10);
        f.fillStyle = i % 3 ? C.grass : '#080D24'; f.fill(SH.pathFrom(SH.strip(spine, 14, 1.5, 2204 + i, { wob: 0.1 })));
      }
      for (const [x, y] of [[150, 1600], [860, 1560], [990, 1660], [60, 1700]]) {
        f.strokeStyle = C.grass; f.lineWidth = 5; f.beginPath(); f.moveTo(x, H); f.quadraticCurveTo(x + 10, (y + H) / 2, x, y); f.stroke();
        f.fillStyle = C.grass; for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU; f.beginPath(); f.ellipse(x + Math.cos(a) * 16, y + Math.sin(a) * 16, 12, 5, a, 0, TAU); f.fill(); }
        f.fillStyle = 'rgba(180,195,255,0.18)'; f.beginPath(); f.arc(x + 4, y - 6, 9, 0, TAU); f.fill();
      }
      S.fg = fg.c;
      // stars
      S.stars = Array.from({ length: 150 }, () => ({ x: R() * W, y: R() * 1200, r: 0.7 + Math.pow(R(), 3) * 2.6, f: 1 + Math.floor(R() * 3), ph: R() * TAU, a: 0.4 + R() * 0.6 }));
      // ambient fireflies over the meadow: periodic drift and blink
      S.flies = Array.from({ length: 34 }, (_, i) => ({ x: 40 + R() * 1000, y: 1330 + R() * 470, ax: 20 + R() * 40, ay: 10 + R() * 26, p1: R() * TAU, p2: R() * TAU, k: 2 + Math.floor(R() * 3), ph: R() * TAU, s: 0.5 + R() * 0.6 }));
      S.glow = glowSprite(70, 'rgba(255,255,235,1)', 'rgba(216,255,106,0.75)');
      S.big = glowSprite(300, 'rgba(255,255,240,0.95)', 'rgba(216,255,106,0.55)');
      // text
      S.t1 = glowText('Ateşböcekleri', 96, 700, C.text, 'rgba(255,236,150,0.9)', 26);
      S.t2 = glowText('nasıl parlar?', 96, 700, C.text, 'rgba(255,236,150,0.9)', 26);
      const lab = s => glowText(s, 44, 600, C.label, 'rgba(160,200,255,0.8)', 14);
      S.l1 = lab('ışık organı');
      S.l2a = lab('özel madde'); S.l2b = lab('+ oksijen = ışık!');
      S.l3a = lab('soğuk ışık:'); S.l3b = lab('neredeyse hiç ısınmaz');
      S.l4a = lab('yanıp sönerek'); S.l4b = lab('haberleşirler');
      S.trail = SH.catmullPts([[-90, 1720], [300, 1520], [760, 1270], [420, 960], [200, 660], [650, 430], [1180, 240]], 160);
      S.pair = [[300, 1560], [492, 1652]];
    },
    frame(g, t, W, H) {
      const s = t < 7.55 ? t : 0;                               // the story clock restarts under the flood of light
      g.drawImage(S.bg, 0, 0);
      // stars (periods divide 8 s)
      for (const st of S.stars) {
        const a = st.a * (0.55 + 0.45 * Math.sin((TAU * st.f * t) / 8 + st.ph));
        g.fillStyle = `rgba(235,240,255,${a.toFixed(3)})`; g.beginPath(); g.arc(st.x, st.y, st.r, 0, TAU); g.fill();
        if (st.r > 2.4) { g.fillRect(st.x - st.r * 3, st.y - 0.5, st.r * 6, 1); g.fillRect(st.x - 0.5, st.y - st.r * 3, 1, st.r * 6); }
      }
      // ambient fireflies (always on, loop-safe)
      g.save(); g.globalCompositeOperation = 'lighter';
      for (const fl of S.flies) {
        const x = fl.x + fl.ax * Math.sin((TAU * t) / 8 + fl.p1), y = fl.y + fl.ay * Math.sin((TAU * 2 * t) / 8 + fl.p2);
        const b = Math.pow(Math.max(0, Math.sin((TAU * fl.k * t) / 8 + fl.ph)), 5);
        g.globalAlpha = 0.15 + 0.85 * b; g.drawImage(S.glow, x - 70 * fl.s, y - 70 * fl.s, 140 * fl.s, 140 * fl.s);
      }
      g.restore();
      story(g, s, W, H);
      g.drawImage(S.fg, 0, 0);
      labels(g, s);
      transition(g, t, W, H);
    },
  });

  function story(g, s, W, H) {
    // title
    reveal(g, S.t1, 90, 300, P(s, 0.2, 0.9));
    reveal(g, S.t2, 90, 418, P(s, 0.55, 1.2));
    // the hero flies in and keeps hovering
    const kf = P(s, 0.8, 1.9);
    if (kf <= 0) return;
    const e = E.outC(kf), hx = lerp(1300, HERO.x, e), hy = lerp(640, HERO.y, e) + 12 * Math.sin(TAU * 0.5 * s), rot = lerp(-0.25, 0.02, e);
    const lit = clamp(P(s, 1.8, 2.1) * (0.75 + 0.25 * Math.sin(TAU * 0.8 * s)));
    const lx = hx + HERO.sc * (LANT[0] * Math.cos(rot) - LANT[1] * Math.sin(rot)), ly = hy + HERO.sc * (LANT[0] * Math.sin(rot) + LANT[1] * Math.cos(rot));
    S.lant = [lx, ly];
    if (lit > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.85 * lit; const r = 300 * (0.85 + 0.15 * lit); g.drawImage(S.big, lx - r, ly - r, r * 2, r * 2); g.restore(); }
    g.save(); g.translate(hx, hy); g.rotate(rot); g.scale(HERO.sc, HERO.sc); hero(g, s, lit, true); g.restore();
    if (lit > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.6 * lit; g.drawImage(S.glow, lx - 80, ly - 80, 160, 160); g.restore(); }
    // 1 · the light organ
    glowLine(g, [[lx + 10, ly + 66], [lx + 16, ly + 100], [lx - 14, ly + 126]], E.ioS(P(s, 2.0, 2.3)));

    // 2 · a special substance meets oxygen → light (blue oxygen dots fly in and flash)
    for (let i = 0; i < 9; i++) {
      const t0 = 2.7 + i * 0.09, k = P(s, t0, t0 + 0.45), fl = P(s, t0 + 0.45, t0 + 0.7);
      const sx = lx + 60 + 150 * SH.h01(2210, i), sy = ly - 260 + 120 * SH.h01(2211, i);
      if (k > 0 && k < 1) { const x = lerp(sx, lx - 10 + 30 * SH.h01(2212, i), E.inQ(k)), y = lerp(sy, ly + 10, E.inQ(k)); g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(143,211,255,0.9)'; g.shadowColor = C.cool; g.shadowBlur = 12; g.beginPath(); g.arc(x, y, 7, 0, TAU); g.fill(); g.restore(); }
      if (fl > 0 && fl < 1) { g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(255,255,220,${(1 - fl).toFixed(3)})`; g.lineWidth = 4; g.beginPath(); g.arc(lx, ly + 10, 20 + 70 * fl, 0, TAU); g.stroke(); g.restore(); }
    }

    // 3 · cold light: a thermometer that stays low
    const kt = P(s, 3.6, 3.9);
    if (kt > 0) {
      g.save(); g.globalAlpha = kt; g.strokeStyle = C.cool; g.lineWidth = 4; g.shadowColor = C.cool; g.shadowBlur = 12;
      g.beginPath(); g.moveTo(96, 1170); g.lineTo(96, 1100); g.arc(110, 1100, 14, Math.PI, 0); g.lineTo(124, 1170); g.stroke();
      g.beginPath(); g.arc(110, 1190, 24, -1.2, Math.PI + 1.2); g.stroke();
      g.fillStyle = C.cool; g.beginPath(); g.arc(110, 1190, 15, 0, TAU); g.fill(); g.fillRect(105, 1150 + 20 * (1 - kt), 10, 40 - 20 * (1 - kt));
      g.restore();
    }

    // 4 · two fireflies talking in flashes, signal rings travelling between them
    const kp = P(s, 4.4, 4.7);
    if (kp > 0) {
      const flashes = [[0, 4.7], [0, 4.92], [1, 5.3], [1, 5.52], [0, 5.9], [1, 6.2]];
      S.pair.forEach(([x, y], who) => {
        let b = 0.25;
        for (const [w2, tf] of flashes) if (w2 === who) b = Math.max(b, Math.exp(-Math.pow((s - tf) / 0.07, 2)));
        g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = kp * b; g.drawImage(S.glow, x - 110, y - 110, 220, 220); g.restore();
        g.fillStyle = 'rgba(20,18,30,0.9)'; g.beginPath(); g.ellipse(x - 10, y - 4, 12, 6, -0.3, 0, TAU); g.fill();
      });
      for (const [w2, tf] of flashes) {
        const k = P(s, tf, tf + 0.45);
        if (k <= 0 || k >= 1) continue;
        const [x, y] = S.pair[w2];
        g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(216,255,106,${(0.7 * (1 - k)).toFixed(3)})`; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 20 + 150 * k, 0, TAU); g.stroke(); g.restore();
      }

    }
  }

  function labels(g, s) {
    if (s < 0.8) return;
    const ly = S.lant ? S.lant[1] : 931;
    reveal(g, S.l1, 640, ly + 180, P(s, 2.15, 2.6));
    reveal(g, S.l2a, 640, 560, P(s, 2.75, 3.15));
    reveal(g, S.l2b, 640, 618, P(s, 3.0, 3.5));
    reveal(g, S.l3a, 160, 1150, P(s, 3.7, 4.0));
    reveal(g, S.l3b, 160, 1206, P(s, 3.85, 4.4));
    reveal(g, S.l4a, 600, 1500, P(s, 4.5, 4.9));
    reveal(g, S.l4b, 600, 1556, P(s, 4.65, 5.1));
  }

  function transition(g, t, W, H) {                             // light painting: a firefly draws a trail that floods the frame
    const k = P(t, 6.75, 7.35);
    if (k <= 0) return;
    if (t < 7.55) {
      const p = SH.partial(S.trail, E.ioQ(k)), w = 10 + 460 * E.inQ(P(t, 7.0, 7.5));
      g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
      g.filter = 'blur(10px)'; g.strokeStyle = 'rgba(216,255,106,0.55)'; g.lineWidth = w * 1.6 + 30; g.stroke(SH.pathFrom(p, false));
      g.filter = 'blur(3px)'; g.strokeStyle = 'rgba(255,255,225,0.85)'; g.lineWidth = w * 0.5 + 6; g.stroke(SH.pathFrom(p, false));
      g.filter = 'none';
      const [x, y] = p[p.length - 1];
      g.drawImage(S.big, x - 160, y - 160, 320, 320);
      g.restore();
    }
    const flood = t < 7.55 ? E.inQ(P(t, 7.2, 7.55)) : 1 - E.outQ(P(t, 7.55, 7.95));
    if (flood > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,250,215,${(0.92 * flood).toFixed(3)})`; g.fillRect(0, 0, W, H); g.restore(); }
  }
})();
