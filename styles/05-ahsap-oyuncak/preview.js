'use strict';
/* 05 · Ahşap Oyuncak — painted wooden toys on a birch tabletop. Pieces are baked once: a per-pixel
   colour function (paint over visible grain, chipped edges showing raw wood) lit through a bevel
   height map (flat faces, rounded edges). Toys move like hand-moved props on a 12 fps clock. */
(() => {
  const { E, P, clamp, lerp, bump, rng, mix, darken, lighten, stepT } = SH;
  const C = {
    wall: '#DCEDE4', birch: '#E9CC9E', birchD: '#C9A26E', raw: '#E7C48E', ring: '#B9874F', bark: '#6B4428',
    red: '#D94B3C', green: '#4E9F55', yellow: '#F2B93B', blue: '#3F7CC4', cream: '#FFF3DF', ink: '#3B2A1E',
  };
  const S = {};
  const L = (() => { const v = [-0.5, -0.62, 0.6], n = Math.hypot(...v); return v.map(x => x / n); })();
  const Hv = (() => { const v = [L[0], L[1], L[2] + 1], n = Math.hypot(...v); return v.map(x => x / n); })();
  // grain value at a point: wavy fibres + occasional dark lines
  const grain = (seed, x, y, sc = 1) => {
    const w = SH.noise2(seed, x * 0.004 * sc, y * 0.03 * sc) * 18 + SH.noise2(seed + 1, x * 0.02, y * 0.2) * 3;
    const v = Math.sin((y * sc + w) * 0.55) * 0.5 + 0.5;
    return Math.pow(v, 6) * 0.8 + SH.noise2(seed + 2, x * 0.3, y * 2) * 0.12;
  };
  // bake one wooden piece: shape(g) paints the silhouette, colorAt(x, y, edge) gives the surface colour
  function wood(w, h, seed, shape, colorAt, o = {}) {
    const pad = 24, W2 = Math.ceil(w + pad * 2), H2 = Math.ceil(h + pad * 2);
    const m = SH.canvas(W2, H2); m.g.translate(pad, pad); m.g.fillStyle = '#fff'; shape(m.g);
    const hb = SH.canvas(W2, H2); hb.g.filter = `blur(${o.bevel || 6}px)`; hb.g.drawImage(m.c, 0, 0);
    const md = m.g.getImageData(0, 0, W2, H2).data, hd = hb.g.getImageData(0, 0, W2, H2).data;
    const hgt = new Float32Array(W2 * H2), depth = o.depth || 26;
    for (let i = 0; i < W2 * H2; i++) { const a = hd[i * 4 + 3] / 255; hgt[i] = SH.E.ioS(clamp(a * 1.6)) * depth; }
    const out = m.g.createImageData(W2, H2), od = out.data, R = rng(seed);
    for (let y = 1; y < H2 - 1; y++) for (let x = 1; x < W2 - 1; x++) {
      const i = y * W2 + x, a = md[i * 4 + 3];
      if (!a) continue;
      let nx = -(hgt[i + 1] - hgt[i - 1]) * 0.5, ny = -(hgt[i + W2] - hgt[i - W2]) * 0.5, nz = 1;
      const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
      const dif = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]), spec = Math.pow(Math.max(0, nx * Hv[0] + ny * Hv[1] + nz * Hv[2]), 40) * (o.gloss ?? 0.25);
      const edge = 1 - clamp(hd[i * 4 + 3] / 255 * 1.4);
      const col = colorAt(x - pad, y - pad, edge, R);
      const k = 0.5 + 0.75 * dif;
      for (let c = 0; c < 3; c++) od[i * 4 + c] = clamp(col[c] * k + 255 * spec, 0, 255);
      od[i * 4 + 3] = a;
    }
    const sp = SH.canvas(W2, H2); sp.g.putImageData(out, 0, 0);
    return { c: sp.c, x0: -pad - (o.ox ?? w / 2), y0: -pad - (o.oy ?? h / 2) };
  }
  // paint over grain, with chips at the edges showing raw wood
  const painted = (hex, seed, chips = 0.5) => {
    const p = SH.hex2rgb(hex), r = SH.hex2rgb(C.raw);
    return (x, y, edge) => {
      const gv = grain(seed, x, y), chip = edge > 0.15 && SH.noise2(seed + 7, x * 0.12, y * 0.12) > 0.62 - edge * chips;
      const base = chip ? r : p, dk = chip ? 0.35 : 0.12;
      return base.map(v => v * (1 - gv * dk));
    };
  };
  const rawWood = (seed, sc = 1) => { const r = SH.hex2rgb(C.raw); return (x, y) => { const gv = grain(seed, x, y, sc); return r.map(v => v * (1 - gv * 0.38)); }; };
  function put(g, sp, x, y, o = {}) {
    if (!sp) return;
    g.save(); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale((o.sx ?? 1) * (o.s ?? 1), (o.sy ?? 1) * (o.s ?? 1));
    if (o.alpha !== undefined) g.globalAlpha = o.alpha;
    if (o.shadow !== false) { g.shadowColor = 'rgba(70,45,25,0.35)'; g.shadowBlur = 14; g.shadowOffsetX = 6; g.shadowOffsetY = 9; }
    g.drawImage(sp.c, sp.x0, sp.y0);
    g.restore();
  }
  const font = s => `900 ${s}px "Nunito"`;
  function woodText(str, size, hex, seed) {
    const w = SH.measure(str, size, 'Nunito', 900) + 10;
    return wood(w, size * 1.25, seed, g => { g.font = font(size); g.fillText(str, 5, size * 1.0); }, painted(hex, seed, 0.3), { bevel: 5, depth: 24, ox: 0, oy: size });
  }

  SH.register({
    id: '05', w: 1080, h: 1920, duration: 8, fps: 30, poster: 6.4,
    fonts: ['900 80px "Nunito"', '800 80px "Nunito"'],
    init(g, W, H) {
      // wall and birch tabletop
      const bg = SH.canvas(W, H), b = bg.g;
      b.fillStyle = C.wall; b.fillRect(0, 0, W, 1320);
      b.globalCompositeOperation = 'soft-light'; b.globalAlpha = 0.5; b.fillStyle = b.createPattern(SH.grain(512, 50, { fibres: 0, fine: 10, mottle: 24 }), 'repeat'); b.fillRect(0, 0, W, 1320);
      b.globalCompositeOperation = 'source-over'; b.globalAlpha = 1;
      const tb = b.createImageData(W, H - 1300), td = tb.data, bc = SH.hex2rgb(C.birch);
      for (let y = 0; y < H - 1300; y++) for (let x = 0; x < W; x++) {
        const gv = grain(51, x, y * 1.6), k = (y * W + x) * 4, shade = 1 - (y / (H - 1300)) * 0.12;
        for (let c = 0; c < 3; c++) td[k + c] = bc[c] * (1 - gv * 0.3) * shade; td[k + 3] = 255;
      }
      b.putImageData(tb, 0, 1300);
      const lip = b.createLinearGradient(0, 1300, 0, 1330); lip.addColorStop(0, 'rgba(255,245,225,0.7)'); lip.addColorStop(1, 'rgba(255,245,225,0)');
      b.fillStyle = lip; b.fillRect(0, 1300, W, 30);
      b.fillStyle = 'rgba(60,40,20,0.25)'; b.fillRect(0, 1296, W, 4);
      S.bg = bg.c;
      S.t1 = woodText('Ağaçlar yaşını', 112, C.green, 2);
      S.t2 = woodText('nasıl saklar?', 112, C.red, 3);
      // toy tree: base block, peg trunk, lollipop canopy
      S.base = wood(220, 70, 10, g => { g.beginPath(); g.roundRect(0, 0, 220, 70, 12); g.fill(); }, painted(C.red, 10), { oy: 70 });
      S.trunk = wood(56, 230, 11, g => { g.beginPath(); g.roundRect(0, 0, 56, 230, 26); g.fill(); }, rawWood(11, 0.6), { oy: 230 });
      S.canopy = wood(300, 300, 12, g => { g.beginPath(); g.arc(150, 150, 150, 0, Math.PI * 2); g.fill(); }, painted(C.green, 12), { bevel: 10, depth: 34 });
      // the log slice: concentric rings, wide and narrow years, bark around the edge
      const ringR = [52, 104, 152, 200, 236, 290], RR = 330;
      S.ringR = ringR;
      const rc = SH.hex2rgb(C.raw), rk = SH.hex2rgb(C.ring), bk = SH.hex2rgb(C.bark);
      S.disk = wood(RR * 2, RR * 2, 20, g => { g.beginPath(); g.arc(RR, RR, RR, 0, Math.PI * 2); g.fill(); }, (x, y) => {
        const dx = x - RR, dy = y - RR, a = Math.atan2(dy, dx), r = Math.hypot(dx, dy) + SH.noise2(21, Math.cos(a) * 2 + 9, Math.sin(a) * 2 + 9) * 7;
        if (r > ringR[5] + 14) { const n = SH.noise2(22, x * 0.08, y * 0.08); return bk.map(v => v * (0.8 + n * 0.25)); }
        let d = 1e9, prev = 0;
        for (const q of ringR) { d = Math.min(d, Math.abs(r - q)); if (r > q) prev = q; }
        const late = Math.exp(-d * d / 18), early = 1 - clamp((r - prev) / 60) * 0.25;
        const crack = Math.abs(Math.sin(a * 3 + 0.4)) < 0.012 && r > 40 ? 0.5 : 0;
        return rc.map((v, i) => lerp(v * early, rk[i] * 0.85, late) * (1 - crack) * (1 - SH.noise2(23, r * 0.5, a * 30) * 0.05));
      }, { bevel: 7, depth: 30, gloss: 0.15 });
      S.tokens = ringR.map((r, i) => wood(64, 64, 30 + i, g => { g.beginPath(); g.arc(32, 32, 32, 0, Math.PI * 2); g.fill(); }, painted([C.yellow, C.blue, C.red, C.green, C.yellow, C.blue][i], 30 + i, 0.2), { bevel: 5, depth: 18 }));
      S.digits = ringR.map((_, i) => SH.textSprite(String(i + 1), 40, { fam: 'Nunito', wt: 900, col: C.cream }));
      S.sign = wood(560, 120, 40, g => { g.beginPath(); g.roundRect(0, 0, 560, 120, 22); g.fill(); }, painted(C.cream, 40, 0.4), { bevel: 6, depth: 22 });
      S.signTxt = SH.textSprite('Her halka = 1 yıl', 60, { fam: 'Nunito', wt: 900, col: C.ink });
      S.badge = wood(420, 150, 41, g => { g.beginPath(); g.roundRect(0, 0, 420, 150, 75); g.fill(); }, painted(C.yellow, 41, 0.4), { bevel: 8, depth: 28 });
      S.badgeTxt = SH.textSprite('6 yaşında!', 76, { fam: 'Nunito', wt: 900, col: C.ink });
      S.peg = wood(30, 90, 42, g => { g.beginPath(); g.roundRect(0, 0, 30, 90, 14); g.fill(); }, rawWood(42), { oy: 90 });
      S.vig = SH.vignette(W, H, 0.18, '60,40,20');
    },
    frame(g, t, W, H) {
      g.drawImage(S.bg, 0, 0);
      const ts = stepT(t, 12), boil = (i, a) => (SH.h01(i, Math.floor(ts * 12)) - 0.5) * a;
      // loop: everything tips over and drops off the table at the end
      const fall = P(t, 7.15, 8.0), fy = 2200 * fall * fall, fr = fall * 1.4;
      // wooden letters drop in
      const k1 = SH.spring(P(ts, 0.05, 0.6)), k2 = SH.spring(P(ts, 0.3, 0.85));
      if (k1 > 0) put(g, S.t1, 70, 330 - (1 - k1) * 260 + fy, { rot: boil(1, 0.01) - fr * 0.2 });
      if (k2 > 0) put(g, S.t2, 110, 470 - (1 - k2) * 260 + fy, { rot: boil(2, 0.01) + fr * 0.25 });
      // the toy tree stacks itself on the table
      const b1 = SH.spring(P(ts, 0.6, 1.0)), b2 = SH.spring(P(ts, 0.8, 1.2)), b3 = SH.spring(P(ts, 1.0, 1.45));
      g.save(); g.translate(230, 1360 + fy); g.rotate(-fr * 0.5);
      if (b1 > 0) put(g, S.base, 0, -(1 - b1) * 300);
      if (b2 > 0) put(g, S.trunk, 0, -66 - (1 - b2) * 400);
      if (b3 > 0) put(g, S.canopy, 0, -380 - (1 - b3) * 500, { rot: boil(3, 0.02) });
      g.restore();
      // the log slice rolls in like a wheel and stands on the table
      const roll = E.outC(P(t, 1.5, 2.7)), cx = lerp(1500, 690, roll) + boil(4, 2), cy = 1300 - 330 + fy;
      const wob = Math.sin(P(t, 2.6, 3.2) * Math.PI * 3) * 0.04 * (1 - P(t, 2.6, 3.2));
      g.save(); g.translate(cx, cy); g.rotate(-(1500 - cx) / 330 + wob + fr * 0.8);
      put(g, S.disk, 0, 0);
      // 1 · count the rings along one ray: one ring, one year
      S.ringR.forEach((r, i) => {
        const k = P(ts, 3.2 + i * 0.32, 3.45 + i * 0.32);
        if (k <= 0) return;
        const e = E.outBack(k, 2.2), a = -2.5 + i * 0.62, x = Math.cos(a) * (r - 22), y = Math.sin(a) * (r - 22);
        g.save(); g.strokeStyle = 'rgba(255,248,230,0.75)'; g.lineWidth = 5; g.beginPath(); g.arc(0, 0, r, -Math.PI, Math.PI * (-1 + 2 * clamp(k * 2))); g.stroke(); g.restore();
        g.save(); g.translate(x, y); g.rotate(-(-(1500 - cx) / 330 + wob + fr * 0.8));
        put(g, S.tokens[i], 0, 0, { s: e, shadow: true });
        if (e > 0.5) SH.drawSprite(g, S.digits[i], 0, 15, { ax: 0.5, alpha: clamp((e - 0.5) * 3) });
        g.restore();
      });
      g.restore();
      // sign and badge on pegs at the front of the table
      const sk = SH.spring(P(ts, 2.9, 3.4));
      if (sk > 0) {
        g.save(); g.translate(560, 1690 + fy + (1 - sk) * 400); g.rotate(-0.02 + fr * 0.3);
        put(g, S.peg, -180, 120); put(g, S.peg, 180, 120);
        put(g, S.sign, 0, 0); SH.drawSprite(g, S.signTxt, 0, 21, { ax: 0.5 });
        g.restore();
      }
      const bk = SH.spring(P(ts, 5.4, 5.9));
      if (bk > 0) {
        g.save(); g.translate(800, 640 + fy - (1 - bk) * 200); g.rotate(0.07 + boil(9, 0.01) - fr * 0.4); g.scale(Math.min(1.08, bk), Math.min(1.08, bk));
        put(g, S.badge, 0, 0); SH.drawSprite(g, S.badgeTxt, 0, 26, { ax: 0.5 });
        g.restore();
      }
      g.drawImage(S.vig, 0, 0);
    },
  });
})();
