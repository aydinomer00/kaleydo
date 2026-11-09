'use strict';
/* 03 · Hamur Dünyası — plasticine stop-motion. Every piece is "inflated" once: its silhouette is
   blurred into a height map, normals come from finite differences, then diffuse + specular light
   from the top-left and fingerprint noise are baked into a sprite. Text can be modelled (raised)
   or pressed into a slab (debossed) through the same height map. */
(() => {
  const { E, P, clamp, lerp, bump, rng, mix, darken, lighten, rgba, stepT } = SH;
  const C = {
    back1: '#CFE6EA', back2: '#F6E7C8', ground: '#86BD6B', snail: '#D9C2A3', shell1: '#E07B39', shell2: '#F4D9A6',
    eye: '#2C2A33', red: '#E25B4C', yellow: '#F3C64B', teal: '#3FA7A0', plaque: '#FFF1DC', ink: '#3A2E2A', mush: '#E9D9C2', cap: '#D6533F',
  };
  const S = {};
  const L = (() => { const v = [-0.55, -0.65, 0.53], n = Math.hypot(...v); return v.map(x => x / n); })();
  const Hh = (() => { const v = [L[0], L[1], L[2] + 1], n = Math.hypot(...v); return v.map(x => x / n); })();

  // model one clay piece: shape(g) paints the silhouette in white; press(g) paints dents (debossed text)
  function clay(w, h, color, seed, shape, o = {}) {
    const pad = 34, W2 = Math.ceil(w + pad * 2), H2 = Math.ceil(h + pad * 2);
    const m = SH.canvas(W2, H2); m.g.translate(pad, pad); m.g.fillStyle = '#fff'; shape(m.g);
    const hb = SH.canvas(W2, H2); hb.g.filter = `blur(${o.round || 12}px)`; hb.g.drawImage(m.c, 0, 0);
    let pr = null;
    if (o.press) { const p = SH.canvas(W2, H2); p.g.translate(pad, pad); p.g.fillStyle = '#fff'; o.press(p.g); const pb = SH.canvas(W2, H2); pb.g.filter = 'blur(2.5px)'; pb.g.drawImage(p.c, 0, 0); pr = pb.g.getImageData(0, 0, W2, H2).data; }
    const md = m.g.getImageData(0, 0, W2, H2).data, hd = hb.g.getImageData(0, 0, W2, H2).data;
    const depth = o.depth || 46, R = rng(seed), n = W2 * H2, hgt = new Float32Array(n);
    const fx = R() * W2, fy = R() * H2;                // a fingerprint somewhere on the piece
    for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) {
      const i = y * W2 + x, a = hd[i * 4 + 3] / 255;
      let v = Math.pow(a, 0.7) * depth;
      v += SH.noise2(seed, x * 0.06, y * 0.06) * 1.6 + SH.noise2(seed + 9, x * 0.22, y * 0.22) * 0.5;
      const d = Math.hypot(x - fx, y - fy);
      if (d < 60) v += Math.sin(d * 1.15) * 0.55 * (1 - d / 60);
      if (pr) v -= (pr[i * 4 + 3] / 255) * (o.pressDepth || 9);
      hgt[i] = v;
    }
    const base = SH.hex2rgb(color), out = m.g.createImageData(W2, H2), od = out.data;
    for (let y = 1; y < H2 - 1; y++) for (let x = 1; x < W2 - 1; x++) {
      const i = y * W2 + x, a = md[i * 4 + 3];
      if (!a) continue;
      let nx = -(hgt[i + 1] - hgt[i - 1]) * 0.5, ny = -(hgt[i + W2] - hgt[i - W2]) * 0.5, nz = 1;
      const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
      const dif = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
      const spec = Math.pow(Math.max(0, nx * Hh[0] + ny * Hh[1] + nz * Hh[2]), 34) * (o.gloss ?? 0.42);
      const k = 0.42 + 0.9 * dif;
      for (let c = 0; c < 3; c++) od[i * 4 + c] = clamp(base[c] * k * (c === 0 ? 1.0 : c === 1 ? 0.98 : 0.95) + 255 * spec, 0, 255);
      od[i * 4 + 3] = a;
    }
    const sp = SH.canvas(W2, H2); sp.g.putImageData(out, 0, 0);
    return { c: sp.c, x0: -pad - (o.ox ?? w / 2), y0: -pad - (o.oy ?? h / 2) };
  }
  function put(g, sp, x, y, o = {}) {
    if (!sp) return;
    g.save(); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale((o.sx ?? 1) * (o.s ?? 1), (o.sy ?? 1) * (o.s ?? 1));
    if (o.alpha !== undefined) g.globalAlpha = o.alpha;
    if (o.shadow !== false) { g.shadowColor = 'rgba(60,40,30,0.33)'; g.shadowBlur = 16; g.shadowOffsetX = 5; g.shadowOffsetY = 8; }
    g.drawImage(sp.c, sp.x0, sp.y0);
    g.restore();
  }
  const font = (size) => `900 ${size}px "Grandstander"`;
  function clayText(str, size, color, seed, o = {}) { // modelled letters: rolled clay, lit like the rest
    const w = SH.measure(str, size, 'Grandstander', 900) + 14, h = size * 1.3;
    const sp = clay(w, h, color, seed, g => { g.font = font(size); g.textBaseline = 'alphabetic'; g.fillText(str, 7, size * 1.0); }, { round: o.round || 8, depth: o.depth || 32, gloss: 0.55, ox: 0, oy: size * 1.0 });
    sp.w = w; return sp;
  }
  function plaque(str, size, seed, color = C.plaque) {   // a clay slab with raised clay letters stuck on it
    const tw = SH.measure(str, size, 'Grandstander', 900), w = tw + 150, h = size * 2.0;
    const slab = clay(w, h, color, seed, g => { g.beginPath(); g.roundRect(0, 0, w, h, h * 0.45); g.fill(); }, { round: 12, depth: 34 });
    return { slab, text: clayText(str, size, C.ink, seed + 50, { round: 5, depth: 16 }), w, h };
  }

  SH.register({
    id: '03', w: 1080, h: 1920, duration: 8, fps: 30, poster: 5.9,
    fonts: ['900 80px "Grandstander"', '800 80px "Grandstander"'],
    init(g, W, H) {
      const bg = SH.canvas(W, H), b = bg.g, gr = b.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, C.back1); gr.addColorStop(0.7, C.back2); gr.addColorStop(1, C.back2);
      b.fillStyle = gr; b.fillRect(0, 0, W, H);
      b.globalCompositeOperation = 'soft-light'; b.globalAlpha = 0.5;
      b.fillStyle = b.createPattern(SH.grain(512, 33, { fibres: 0, fine: 16, mottle: 30 }), 'repeat'); b.fillRect(0, 0, W, H);
      S.bg = bg.c;
      S.ground = clay(1240, 600, C.ground, 1, g => { g.beginPath(); g.moveTo(0, 60); for (let x = 0; x <= 1240; x += 40) g.lineTo(x, 40 + Math.sin(x * 0.012) * 26); g.lineTo(1240, 600); g.lineTo(0, 600); g.fill(); }, { round: 16, depth: 50, ox: 0, oy: 0 });
      S.title1 = clayText('Salyangoz evini', 114, C.red, 2);
      S.title2 = clayText('neden taşır?', 114, C.teal, 3);
      S.sun = clay(190, 190, C.yellow, 4, g => { g.beginPath(); g.arc(95, 95, 95, 0, Math.PI * 2); g.fill(); }, { round: 22, depth: 60 });
      S.body = clay(330, 90, C.snail, 5, g => { g.beginPath(); g.ellipse(165, 55, 165, 40, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(290, 30, 46, 46, 0, 0, Math.PI * 2); g.fill(); }, { round: 14, depth: 40, ox: 165, oy: 70 });
      S.stalk = clay(16, 70, C.snail, 6, g => { g.beginPath(); g.roundRect(0, 0, 16, 70, 8); g.fill(); }, { round: 5, depth: 14, ox: 8, oy: 70 });
      S.eye = clay(26, 26, C.eye, 7, g => { g.beginPath(); g.arc(13, 13, 13, 0, Math.PI * 2); g.fill(); }, { round: 6, depth: 16, gloss: 0.9 });
      const coil = (turns, r0, seed) => clay(r0 * 2.3, r0 * 2.3, C.shell1, seed, g => {
        g.beginPath(); g.arc(r0 * 1.15, r0 * 1.15, r0, 0, Math.PI * 2); g.fill();
      }, {
        round: 16, depth: 54, press: g => {                 // the spiral groove pressed into the shell
          g.lineWidth = r0 * 0.11; g.strokeStyle = '#fff'; g.lineCap = 'round'; g.beginPath();
          for (let a = 0; a <= turns * Math.PI * 2; a += 0.05) { const r = r0 * 0.92 * (1 - a / (turns * Math.PI * 2 + 0.6)); g.lineTo(r0 * 1.15 + Math.cos(a) * r, r0 * 1.15 + Math.sin(a) * r); }
          g.stroke();
        }, pressDepth: 16,
      });
      S.shellA = coil(2.4, 120, 8); S.shellB = coil(3.3, 150, 9);
      S.stripe = clay(26, 26, C.shell2, 10, g => { g.beginPath(); g.arc(13, 13, 13, 0, Math.PI * 2); g.fill(); }, { round: 6, depth: 14 });
      S.mushStem = clay(60, 120, C.mush, 11, g => { g.beginPath(); g.roundRect(0, 0, 60, 120, 26); g.fill(); }, { round: 10, depth: 30, ox: 30, oy: 120 });
      S.mushCap = clay(180, 90, C.cap, 12, g => { g.beginPath(); g.ellipse(90, 90, 90, 80, 0, Math.PI, 0); g.fill(); }, { round: 12, depth: 40, ox: 90, oy: 90 });
      S.dot = clay(22, 22, '#FFF6EA', 13, g => { g.beginPath(); g.arc(11, 11, 11, 0, Math.PI * 2); g.fill(); }, { round: 5, depth: 10 });
      S.blade = clay(30, 110, C.ground, 14, g => { g.beginPath(); g.moveTo(15, 0); g.quadraticCurveTo(30, 60, 26, 110); g.lineTo(4, 110); g.quadraticCurveTo(0, 60, 15, 0); g.fill(); }, { round: 6, depth: 14, ox: 15, oy: 110 });
      S.p1 = plaque('Kabuk onu korur', 58, 15);
      S.p2 = plaque('Kabuk onunla büyür', 58, 16);
      S.cloud = clay(300, 120, '#F7F3EA', 40, g => { for (const [x, y, r] of [[70, 80, 50], [140, 55, 62], [215, 78, 48], [150, 92, 40]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); } }, { round: 14, depth: 40 });
      S.birdBody = clay(170, 100, '#5A8FD8', 41, g => { g.beginPath(); g.ellipse(85, 55, 80, 44, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(150, 34, 32, 0, Math.PI * 2); g.fill(); }, { round: 12, depth: 36 });
      S.birdWing = clay(110, 60, '#3F6FB8', 42, g => { g.beginPath(); g.ellipse(55, 30, 55, 26, 0, 0, Math.PI * 2); g.fill(); }, { round: 10, depth: 24, ox: 55, oy: 30 });
      S.beak = clay(40, 26, C.yellow, 43, g => { g.beginPath(); g.moveTo(0, 0); g.lineTo(40, 13); g.lineTo(0, 26); g.fill(); }, { round: 4, depth: 10, ox: 0, oy: 13 });
      S.stem = clay(18, 230, '#5FA35A', 44, g => { g.beginPath(); g.roundRect(0, 0, 18, 230, 9); g.fill(); }, { round: 5, depth: 12, ox: 9, oy: 230 });
      S.petal = clay(56, 56, '#F08AB0', 45, g => { g.beginPath(); g.arc(28, 28, 28, 0, Math.PI * 2); g.fill(); }, { round: 8, depth: 22 });
      S.digit = [1, 2].map(k => clayText(String(k), 70, '#FFF3DD', 60 + k, { round: 5, depth: 16 }));
      S.n = [1, 2].map(k => clay(112, 112, k === 1 ? C.red : C.teal, 20 + k, g => { g.beginPath(); g.arc(56, 56, 56, 0, Math.PI * 2); g.fill(); }, { round: 14, depth: 40 }));
      S.roll = clay(1300, 110, '#F1DCC0', 30, g => { g.beginPath(); g.roundRect(0, 0, 1300, 110, 55); g.fill(); }, { round: 16, depth: 52, ox: 650, oy: 55 });
      S.vig = SH.vignette(W, H, 0.16, '50,40,30');
    },
    frame(g, t, W, H) {
      g.drawImage(S.bg, 0, 0);
      const ts = stepT(t, 12);
      const boil = (i, a) => (SH.h01(i, Math.floor(ts * 12)) - 0.5) * a;
      put(g, S.sun, 880 + boil(1, 3), 620 + boil(2, 3), { s: SH.spring(P(ts, 0.3, 0.9)), shadow: false });
      // the clay ground slab slides in, with grass and a mushroom
      const gy = (1 - SH.spring(P(ts, 0.0, 0.6))) * 500;
      put(g, S.cloud, 250 + Math.sin(ts * 0.5) * 12, 720, { s: SH.spring(P(ts, 0.35, 0.9)) });
      put(g, S.cloud, 800 - Math.sin(ts * 0.5) * 12, 880, { s: 0.75 * SH.spring(P(ts, 0.5, 1.05)) });
      put(g, S.ground, -80, 1440 + gy, { shadow: false });
      put(g, S.stem, 150, 1500 + gy, { rot: -0.05 + boil(7, 0.04) });
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; put(g, S.petal, 150 + Math.cos(a) * 34 - 4, 1270 + gy + Math.sin(a) * 34, { shadow: false }); }
      put(g, S.dot, 146, 1270 + gy, { s: 1.4, shadow: false });
      for (const [x, s, r] of [[90, 1, -0.2], [130, 0.8, 0.15], [980, 1, 0.2], [1020, 0.75, -0.1], [600, 0.7, 0.1]]) put(g, S.blade, x, 1500 + gy + boil(x, 2), { s, rot: r + boil(x + 1, 0.06) });
      put(g, S.mushStem, 900, 1495 + gy); put(g, S.mushCap, 900, 1390 + gy, { rot: boil(5, 0.03) });
      for (const [dx, dy] of [[-40, -45], [20, -60], [45, -30]]) put(g, S.dot, 900 + dx, 1390 + gy + dy, { shadow: false });
      // clay title, modelled letters
      const k1 = SH.spring(P(ts, 0.15, 0.75)), k2 = SH.spring(P(ts, 0.4, 1.0));
      if (k1 > 0) put(g, S.title1, 66, 330 + (1 - k1) * -300, { sy: 0.9 + 0.1 * Math.min(1, k1) });
      if (k2 > 0) put(g, S.title2, 120, 466 + (1 - k2) * -300, { sy: 0.9 + 0.1 * Math.min(1, k2) });
      // the snail: crawl in, hide from the bird's shadow, come out bigger
      const crawl = E.ioS(P(ts, 1.0, 3.0)), hide = bump(P(ts, 3.3, 4.7)), grow = E.ioS(P(ts, 4.8, 6.4));
      const sx = lerp(-300, 470, crawl) + lerp(0, 50, grow), sy = 1440;
      const scale = lerp(1.3, 1.55, grow), stretch = 1 + 0.06 * Math.sin(ts * 10) * (crawl > 0 && crawl < 1 ? 1 : 0);
      // slime trail glistens behind the snail
      if (crawl > 0) {
        g.save(); g.globalAlpha = 0.55; g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 10; g.lineCap = 'round';
        g.beginPath(); g.moveTo(-40, sy + 4); g.lineTo(sx - 150, sy + 4); g.stroke();
        g.globalAlpha = 0.9; g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 2.5; g.setLineDash([18, 26]); g.beginPath(); g.moveTo(-40, sy); g.lineTo(sx - 150, sy); g.stroke();
        g.restore();
      }
      g.save(); g.translate(sx, sy); g.scale(scale, scale);
      const bodyOut = 1 - hide;
      if (bodyOut > 0.02) {
        put(g, S.body, 20 + 30 * (1 - bodyOut), -40, { sx: stretch * (0.35 + 0.65 * bodyOut), sy: 1 / Math.sqrt(stretch) });
        for (const [dx, a] of [[118, -0.35], [142, 0.05]]) {
          const ex = 20 + dx * (0.35 + 0.65 * bodyOut);
          put(g, S.stalk, ex, -80, { rot: a + boil(dx, 0.08), sy: bodyOut, shadow: false });
          put(g, S.eye, ex + Math.sin(a) * 70 * bodyOut, -80 - Math.cos(a) * 70 * bodyOut, { s: bodyOut, shadow: false });
        }
      }
      const shell = grow > 0.5 ? S.shellB : S.shellA, shellS = grow > 0.5 ? lerp(0.86, 1, (grow - 0.5) * 2) : lerp(1, 1.1, grow * 2);
      put(g, shell, -60, -170 + hide * 30, { s: shellS, rot: boil(9, 0.03) });
      g.restore();
      // the bird's shadow sweeps over (why the shell matters)
      const bird = P(t, 3.0, 4.4);
      if (bird > 0 && bird < 1) {
        const bx = lerp(-300, 1400, stepT(E.ioS(bird), 12)), by = 760 + Math.sin(bird * 9) * 20;
        g.save(); g.globalAlpha = 0.2 * bump(bird); g.fillStyle = '#2B2530';
        g.beginPath(); g.ellipse(bx, 1430, 150, 26, 0, 0, Math.PI * 2); g.fill(); g.restore();
        put(g, S.birdBody, bx, by, { s: 1.2 });
        put(g, S.beak, bx + 98, by - 26, { s: 1.2 });
        put(g, S.eye, bx + 82, by - 34, { s: 0.7, shadow: false });
        put(g, S.birdWing, bx - 10, by - 20, { s: 1.2, sy: 1.2 * (Math.floor(ts * 12) % 2 ? 1 : -0.7) });
      }
      // pressed-clay labels with clay number balls
      const labs = [[S.p1, S.n[0], 3.6, 4.85], [S.p2, S.n[1], 5.1, 9]];
      for (const [pl, nb, t0, t1] of labs) {
        const k = P(ts, t0, t0 + 0.5), out = P(ts, t1, t1 + 0.3);
        if (k <= 0 || out >= 1) continue;
        const e = SH.spring(k, 1.1, 6) * (1 - out), y = 960 + (1 - Math.min(1, e)) * 80, x = 600;
        const ne = Math.max(0.01, E.outBack(clamp(k * 1.5 - 0.3), 2) * (1 - out)), di = pl === S.p1 ? 0 : 1;
        g.save(); g.translate(x, y); g.rotate(-0.03); g.scale(Math.max(0.01, e), Math.max(0.01, e));
        put(g, pl.slab, 0, 0); put(g, pl.text, -pl.w / 2 + 104, 22, { shadow: false });
        g.restore();
        put(g, nb, x - pl.w / 2 + 10, y - 6, { s: ne, rot: 0.1 });
        put(g, S.digit[di], x - pl.w / 2 + 10 - 20, y + 20, { s: ne, shadow: false });
      }
      // loop: a rolling pin of clay rolls a fresh sheet down over everything
      const rk = P(t, 7.1, 8.0);
      if (rk > 0) {
        const y = lerp(-140, H + 140, E.inQ(rk) * 0.4 + E.ioC(rk) * 0.6);
        g.save(); g.beginPath(); g.rect(0, 0, W, y); g.clip(); g.drawImage(S.bg, 0, 0); g.restore();
        put(g, S.roll, W / 2, y, { rot: 0.0, shadow: true });
      }
      g.drawImage(S.vig, 0, 0);
    },
  });
})();
