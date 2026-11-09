'use strict';
/* ==========================================================================
   Kaleydo engine — a small, deterministic Canvas 2D toolkit shared by every
   style. A frame is a pure function of time: seek(t) never depends on the
   previous frame, the wall clock or unseeded randomness.
   ========================================================================== */
(function (G) {
  const SH = (G.SH = {});

  /* ---------------- math & easing ---------------- */
  const clamp = (SH.clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x));
  const lerp = (SH.lerp = (a, b, t) => a + (b - a) * t);
  SH.P = (t, a, b) => clamp((t - a) / (b - a));                    // progress of t through [a, b]
  SH.bump = x => (x <= 0 || x >= 1 ? 0 : Math.sin(Math.PI * x));    // 0 → 1 → 0
  SH.E = {
    lin: x => x,
    inQ: x => x * x,
    outQ: x => 1 - (1 - x) * (1 - x),
    ioQ: x => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2),
    inC: x => x * x * x,
    outC: x => 1 - Math.pow(1 - x, 3),
    ioC: x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    outQu: x => 1 - Math.pow(1 - x, 5),
    ioS: x => x * x * (3 - 2 * x),
    outExpo: x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    outBack: (x, k = 1.6) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 + (k + 1) * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2)),
    inBack: (x, k = 1.6) => (k + 1) * x * x * x - k * x * x,
  };
  // damped settle 0 → 1 with a small physical overshoot
  SH.spring = (x, cyc = 1.25, damp = 6) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.exp(-damp * x) * Math.cos(x * Math.PI * 2 * cyc) * (1 - x));
  // stop-motion clock: hold each pose for 1/fps seconds
  SH.stepT = (t, fps = 12) => Math.floor(t * fps + 1e-6) / fps;

  /* ---------------- deterministic randomness ---------------- */
  function hash32(x) {
    x |= 0;
    x ^= x >>> 16; x = Math.imul(x, 0x7feb352d);
    x ^= x >>> 15; x = Math.imul(x, 0x846ca68b);
    x ^= x >>> 16;
    return x >>> 0;
  }
  SH.hash32 = hash32;
  const h01 = (SH.h01 = (seed, i) => hash32(Math.imul(seed | 0, 0x27d4eb2d) ^ hash32((i | 0) + 0x632be5ab)) / 4294967296);
  SH.h2 = (seed, i, j) => h01(seed, hash32(Math.imul(i | 0, 0x1b873593) ^ (j | 0)));
  // mulberry32 stream seeded through the hash, so neighbouring seeds are unrelated
  SH.rng = seed => {
    let a = hash32((seed ^ 0x9e3779b9) | 0);
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const noise1 = (SH.noise1 = (seed, x) => {               // smooth value noise in [-1, 1]
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    const a = h01(seed, i), b = h01(seed, i + 1);
    return (a + (b - a) * u) * 2 - 1;
  });
  const noise2 = (SH.noise2 = (seed, x, y) => {            // 2D value noise in [-1, 1]
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = SH.h2(seed, ix, iy), b = SH.h2(seed, ix + 1, iy), c = SH.h2(seed, ix, iy + 1), d = SH.h2(seed, ix + 1, iy + 1);
    return lerp(lerp(a, b, u), lerp(c, d, u), v) * 2 - 1;
  });
  SH.fbm2 = (seed, x, y, oct = 4) => {
    let s = 0, a = 0.5, f = 1, n = 0;
    for (let o = 0; o < oct; o++) { s += a * noise2(seed + o * 101, x * f, y * f); n += a; a *= 0.5; f *= 2.03; }
    return s / n;
  };
  SH.loopNoise = (seed, ang, freq) => {                    // periodic noise around a closed outline
    const x = (ang / (Math.PI * 2)) * freq, i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    const a = h01(seed, ((i % freq) + freq) % freq), b = h01(seed, (((i + 1) % freq) + freq) % freq);
    return (a + (b - a) * u) * 2 - 1;
  };

  /* ---------------- colour ---------------- */
  const hx = (SH.hex2rgb = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; });
  const _mix = new Map();
  const mixc = (SH.mix = (c1, c2, t) => {
    const k = c1 + c2 + t.toFixed(3);
    let v = _mix.get(k);
    if (v) return v;
    const a = hx(c1), b = hx(c2);
    v = '#' + [0, 1, 2].map(i => Math.round(a[i] + (b[i] - a[i]) * clamp(t)).toString(16).padStart(2, '0')).join('');
    _mix.set(k, v);
    return v;
  });
  SH.lighten = (c, t) => mixc(c, '#FFFDF8', t);
  SH.darken = (c, t) => mixc(c, '#1E1712', t);
  SH.rgba = (c, a) => { const [r, g, b] = hx(c); return `rgba(${r},${g},${b},${a})`; };

  /* ---------------- geometry: hand-made outlines ---------------- */
  const addPts = (SH.addPts = (p, pts, closed = true) => {
    p.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]);
    if (closed) p.closePath();
    return p;
  });
  SH.pathFrom = (pts, closed = true) => addPts(new Path2D(), pts, closed);
  SH.rotPts = (pts, cx, cy, a) => {
    const c = Math.cos(a), s = Math.sin(a);
    return pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]);
  };
  SH.tfPts = (pts, x, y, s = 1, a = 0) => {
    const c = Math.cos(a) * s, n = Math.sin(a) * s;
    return pts.map(([px, py]) => [x + px * c - py * n, y + px * n + py * c]);
  };
  // displace an outline along its normals: slow wobble + fine scissor jitter
  const jitterPts = (SH.jitterPts = (pts, seed, amp, closed = true) => {
    const n = pts.length, out = [];
    for (let i = 0; i < n; i++) {
      const a = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], b = pts[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
      let nx = -(b[1] - a[1]), ny = b[0] - a[0];
      const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
      const d = amp * (noise1(seed, i * 0.31) * 0.65 + noise1(seed + 911, i * 1.9) * 0.35);
      out.push([pts[i][0] + nx * d, pts[i][1] + ny * d]);
    }
    return out;
  });
  SH.blob = (cx, cy, rx, ry, seed, o = {}) => {
    const n = o.n || Math.max(28, Math.round((rx + ry) * 0.62));
    const wob = o.wob ?? 0.022, jit = o.jit ?? 0.55, rot = o.rot || 0, cr = Math.cos(rot), sr = Math.sin(rot), pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      let k = 1 + wob * SH.loopNoise(seed, a, o.freq || 5) + wob * 0.5 * SH.loopNoise(seed + 3, a, 11);
      if (o.bumps) k += o.bumps[1] * (Math.pow(Math.abs(Math.sin((a * o.bumps[0]) / 2)), 0.6) - 0.6);
      const j = jit * SH.loopNoise(seed + 17, a, Math.max(8, n >> 1));
      const x = Math.cos(a) * (rx * k + j), y = Math.sin(a) * (ry * k + j);
      pts.push([cx + x * cr - y * sr, cy + x * sr + y * cr]);
    }
    return pts;
  };
  SH.rrect = (x, y, w, h, r, seed, o = {}) => {
    const sp = o.sp || 7, pts = [];
    r = Math.max(0.01, Math.min(r, w / 2, h / 2));
    const seg = (x0, y0, x1, y1) => {
      const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / sp));
      for (let i = 0; i < n; i++) pts.push([x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n]);
    };
    const arc = (cx, cy, a0) => {
      const n = Math.max(2, Math.round((r * Math.PI) / 2 / sp));
      for (let i = 0; i < n; i++) { const a = a0 + ((Math.PI / 2) * i) / n; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    };
    seg(x + r, y, x + w - r, y); arc(x + w - r, y + r, -Math.PI / 2);
    seg(x + w, y + r, x + w, y + h - r); arc(x + w - r, y + h - r, 0);
    seg(x + w - r, y + h, x + r, y + h); arc(x + r, y + h - r, Math.PI / 2);
    seg(x, y + h - r, x, y + r); arc(x + r, y + r, Math.PI);
    return jitterPts(pts, seed, o.jit ?? 0.6);
  };
  SH.polyPts = (verts, seed, o = {}) => {
    const sp = o.sp || 7, pts = [];
    for (let i = 0; i < verts.length; i++) {
      const a = verts[i], b = verts[(i + 1) % verts.length];
      const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / sp));
      for (let k = 0; k < n; k++) pts.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
    }
    return jitterPts(pts, seed, o.jit ?? 0.6);
  };
  SH.quadPts = (p0, p1, p2, n) => {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      out.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]);
    }
    return out;
  };
  SH.qp = (p0, p1, p2, t) => { const u = 1 - t; return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]; };
  SH.thruPts = (a, k, b, n) => SH.quadPts(a, [2 * k[0] - (a[0] + b[0]) / 2, 2 * k[1] - (a[1] + b[1]) / 2], b, n);
  SH.catmull = (pts, u) => {
    const n = pts.length - 1, f = clamp(u) * n, i = Math.min(n - 1, Math.floor(f)), t = f - i;
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n, i + 2)], t2 = t * t, t3 = t2 * t;
    const c = k => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
    return [c(0), c(1)];
  };
  SH.catmullPts = (pts, n) => Array.from({ length: n + 1 }, (_, i) => SH.catmull(pts, i / n));
  // a strip following a spine (stems, legs, strokes); optional rounded ends
  SH.strip = (spine, w0, w1, seed, o = {}) => {
    const n = spine.length, L = [], R = [];
    let tx = 1, ty = 0, sx = 1, sy = 0;
    for (let i = 0; i < n; i++) {
      const a = spine[Math.max(0, i - 1)], b = spine[Math.min(n - 1, i + 1)];
      tx = b[0] - a[0]; ty = b[1] - a[1];
      const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      if (i === 0) { sx = tx; sy = ty; }
      const t = n > 1 ? i / (n - 1) : 0;
      const prof = o.profile ? o.profile(t) : lerp(w0, w1, t);
      const w = prof * 0.5 * (1 + (o.wob ?? 0.05) * noise1(seed, i * 0.6));
      L.push([spine[i][0] - ty * w, spine[i][1] + tx * w]);
      R.push([spine[i][0] + ty * w, spine[i][1] - tx * w]);
    }
    const out = L.slice();
    if (o.cap) {
      const e = spine[n - 1], w = (o.profile ? o.profile(1) : w1) * 0.5;
      for (let k = 1; k < 6; k++) { const th = (Math.PI * k) / 6; out.push([e[0] + w * (-ty * Math.cos(th) + tx * Math.sin(th)), e[1] + w * (tx * Math.cos(th) + ty * Math.sin(th))]); }
    }
    for (let i = n - 1; i >= 0; i--) out.push(R[i]);
    if (o.cap || o.cap0) {
      const s0 = spine[0], w = (o.profile ? o.profile(0) : w0) * 0.5;
      for (let k = 1; k < 6; k++) { const th = (Math.PI * k) / 6; out.push([s0[0] + w * (sy * Math.cos(th) - sx * Math.sin(th)), s0[1] + w * (-sx * Math.cos(th) - sy * Math.sin(th))]); }
    }
    return out;
  };
  // petal / leaf / wing / drop lobe: base at (0,0), tip at (0,-len)
  SH.lobe = (len, wid, seed, o = {}) => {
    const n = o.n || 30, pts = [], a = o.a ?? 0.8, b = o.tip ?? 0.85;
    const prof = s => (wid / 2) * Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(s, a))), b);
    for (let i = 0; i <= n; i++) { const s = i / n; pts.push([prof(s), -len * s]); }
    for (let i = n - 1; i > 0; i--) { const s = i / n; pts.push([-prof(s), -len * s]); }
    return jitterPts(pts, seed, o.jit ?? 0.55);
  };
  SH.hexPts = (cx, cy, r, seed, o = {}) => {
    const v = [];
    for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 3 + (o.rot || 0); v.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    return SH.polyPts(v, seed, { sp: o.sp || 6, jit: o.jit ?? 0.55 });
  };
  SH.starPts = (cx, cy, r0, r1, n, rot = -Math.PI / 2) => {
    const pts = [];
    for (let i = 0; i < n * 2; i++) { const r = i & 1 ? r0 : r1, a = rot + (i * Math.PI) / n; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    return pts;
  };
  SH.ringPath = (cx, cy, r0, r1, seed, o = {}) => {
    const p = new Path2D();
    addPts(p, SH.blob(cx, cy, r1, r1, seed, { wob: o.wob ?? 0.006, jit: o.jit ?? 0.55 }));
    addPts(p, SH.blob(cx, cy, r0, r0, seed + 1, { wob: o.wob ?? 0.006, jit: o.jit ?? 0.55 }));
    return p;
  };
  SH.heartPts = (s, seed) => jitterPts(Array.from({ length: 64 }, (_, i) => {
    const t = (i / 64) * Math.PI * 2;
    return [16 * Math.pow(Math.sin(t), 3) * s, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * s];
  }), seed, 0.4);
  // resample a polyline at a fixed spacing (for stroke effects)
  SH.resample = (pts, step) => {
    const out = [pts[0]];
    let carry = 0;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      let d = step - carry;
      while (d <= L) { const t = d / L; out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); d += step; }
      carry = L - (d - step);
    }
    return out;
  };
  SH.polyLen = pts => { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; };
  SH.partial = (pts, u) => {                               // first u (0..1) of a polyline by length
    if (u >= 1) return pts.slice();
    const total = SH.polyLen(pts) * Math.max(0, u), out = [pts[0]];
    let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (acc + L >= total) { const t = L ? (total - acc) / L : 0; out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); return out; }
      acc += L; out.push(b);
    }
    return out;
  };

  /* ---------------- canvases & textures ---------------- */
  SH.canvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return { c, g: c.getContext('2d') }; };
  SH.devScale = g => { const m = g.getTransform(); return Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)); };
  // tileable mid-grey grain: fine noise + soft mottle + fibres. Use with soft-light/overlay/multiply.
  SH.grain = (size, seed, o = {}) => {
    const { c, g } = SH.canvas(size, size), R = SH.rng(seed), img = g.createImageData(size, size), cell = o.cell || 32, gw = size / cell, grid = [];
    for (let i = 0; i < gw * gw; i++) grid.push(R());
    const Gd = (ix, iy) => grid[(((iy % gw) + gw) % gw) * gw + (((ix % gw) + gw) % gw)];
    const fine = o.fine ?? 12, mottle = o.mottle ?? 26;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const gx = x / cell, gy = y / cell, ix = Math.floor(gx), iy = Math.floor(gy), fx = gx - ix, fy = gy - iy;
      const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
      const m = lerp(lerp(Gd(ix, iy), Gd(ix + 1, iy), u), lerp(Gd(ix, iy + 1), Gd(ix + 1, iy + 1), u), v);
      const val = 128 + (R() - 0.5) * fine + (m - 0.5) * mottle, k = (y * size + x) * 4;
      img.data[k] = img.data[k + 1] = img.data[k + 2] = val; img.data[k + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    const fibres = o.fibres ?? 1100;
    g.lineCap = 'round';
    for (let i = 0; i < fibres; i++) {
      const x = R() * size, y = R() * size, len = (o.fibreLen || 5) + R() * (o.fibreVar || 24), ang = R() * Math.PI * 2, cu = (R() - 0.5) * 0.9, light = R() < 0.55;
      g.strokeStyle = light ? `rgba(255,255,255,${(0.12 + R() * 0.24).toFixed(3)})` : `rgba(45,30,20,${(0.07 + R() * 0.14).toFixed(3)})`;
      g.lineWidth = 0.6 + R() * 1.2;
      const ex = Math.cos(ang) * len, ey = Math.sin(ang) * len, mx = ex / 2 - Math.sin(ang) * cu * len * 0.3, my = ey / 2 + Math.cos(ang) * cu * len * 0.3;
      for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) {
        const x0 = x + ox, y0 = y + oy;
        if (x0 < -40 || x0 > size + 40 || y0 < -40 || y0 > size + 40) continue;
        g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + mx, y0 + my, x0 + ex, y0 + ey); g.stroke();
      }
    }
    return c;
  };
  const _pat = new WeakMap();
  SH.pattern = (g, cv) => {                                // one CanvasPattern per (context, texture)
    let m = _pat.get(g);
    if (!m) { m = new Map(); _pat.set(g, m); }
    let p = m.get(cv);
    if (!p) { p = g.createPattern(cv, 'repeat'); m.set(cv, p); }
    return p;
  };
  // light falloff from the top-left (or any focus)
  SH.vignette = (w, h, a = 0.2, col = '48,30,14', fx = 0.42, fy = 0.36) => {
    const { c, g } = SH.canvas(w, h), gr = g.createRadialGradient(w * fx, h * fy, h * 0.22, w * 0.5, h * 0.52, h * 0.8);
    gr.addColorStop(0, `rgba(${col},0)`); gr.addColorStop(1, `rgba(${col},${a})`);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    return c;
  };

  /* ---------------- a matte cut-paper piece (shared by paper-based styles) ---------------- */
  SH.paper = (g, path, o) => {
    const m = g.getTransform(), det = m.a * m.d - m.b * m.c, sc = Math.sqrt(Math.abs(det));
    if (sc < 1e-3) return;
    const rule = o.rule || 'nonzero', z = o.z ?? 3, col = o.color;
    g.save();
    if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
    if (z > 0 && o.shadow !== false) {
      const a = (o.sa ?? 0.3) / (1 + z * 0.06);
      g.shadowColor = `rgba(${o.shadowRGB || '58,36,20'},${a.toFixed(3)})`;
      g.shadowBlur = (1.6 + z * 1.3) * sc;
      g.shadowOffsetX = (0.4 + z * 0.5) * sc;
      g.shadowOffsetY = (0.6 + z * 0.8) * sc;
    }
    g.fillStyle = col;
    g.fill(path, rule);
    g.shadowColor = 'rgba(0,0,0,0)'; g.shadowBlur = 0; g.shadowOffsetX = 0; g.shadowOffsetY = 0;
    g.clip(path, rule);
    if (o.edge !== false) {                                // exposed cut edge, lit from the top-left
      const e = (o.ew ?? 1.7) * sc, dx = e * 0.72, dy = e * 0.9;
      const lx = (m.d * dx - m.c * dy) / det, ly = (-m.b * dx + m.a * dy) / det;
      g.fillStyle = o.hi || SH.lighten(col, 0.42);
      g.fill(path, rule);
      g.save();
      g.translate(lx, ly); g.clip(path, rule); g.translate(-lx, -ly);
      g.fillStyle = o.lo || SH.darken(col, 0.2);
      g.fill(path, rule);
      g.translate(-lx, -ly); g.clip(path, rule); g.translate(lx, ly);
      g.fillStyle = col;
      g.fill(path, rule);
      g.restore();
    }
    if (o.shade) o.shade(g);
    const tex = o.tex ?? 0.6;
    if (tex > 0 && SH.TEX) {
      g.globalCompositeOperation = o.texMode || 'soft-light';
      g.globalAlpha *= tex;
      const p = SH.pattern(g, o.texture || SH.TEX), sd = o.seed | 0;
      p.setTransform(new DOMMatrix([1, 0, 0, 1, (sd * 97) % 512, (sd * 61) % 512]));
      g.fillStyle = p;
      g.fill(path, rule);
    }
    g.restore();
  };
  SH.softShadow = (g, x, y, rx, ry, a, rgb = '58,36,20') => {
    g.save(); g.translate(x, y); g.scale(1, ry / rx);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
    gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, Math.PI * 2); g.fill();
    g.restore();
  };

  /* ---------------- type ---------------- */
  const _m = document.createElement('canvas').getContext('2d');
  const fontStr = (SH.font = (size, fam, wt = 400) => `${wt} ${size}px "${fam}"`);
  SH.measure = (str, size, fam, wt = 400, tr = 0) => {
    _m.font = fontStr(size, fam, wt);
    if (!tr) return _m.measureText(str).width;
    let w = 0; for (const ch of str) w += _m.measureText(ch).width + tr;
    return w - tr;
  };
  SH.fillTr = (g, str, x, y, tr = 0) => {
    if (!tr) { g.fillText(str, x, y); return; }
    for (const ch of str) { g.fillText(ch, x, y); x += g.measureText(ch).width + tr; }
  };
  // cached text sprite; o.paint(g, w, h, bx, by, draw) can replace the default fill for material effects
  const _tx = new Map();
  SH.textSprite = (str, size, o = {}) => {
    const fam = o.fam, wt = o.wt || 400, col = o.col || '#222', tr = o.tr || 0;
    const key = `${str}|${size}|${fam}|${wt}|${col}|${tr}|${o.key || ''}`;
    let sp = _tx.get(key);
    if (sp) return sp;
    const width = SH.measure(str, size, fam, wt, tr), pad = Math.ceil(size * (o.pad ?? 0.35));
    const { c, g } = SH.canvas(width + pad * 2, size * 1.6 + pad * 2);
    g.font = fontStr(size, fam, wt); g.textBaseline = 'alphabetic';
    const bx = pad, by = Math.round(pad + size * 1.12);
    const draw = (x = bx, y = by) => SH.fillTr(g, str, x, y, tr);
    if (o.paint) o.paint(g, c.width, c.height, bx, by, draw);
    else { g.fillStyle = col; draw(); }
    sp = { c, w: c.width, h: c.height, bx, by, width, size };
    _tx.set(key, sp);
    return sp;
  };
  SH.drawSprite = (g, sp, x, y, o = {}) => {
    const sc = SH.devScale(g), z = o.z ?? 0;
    g.save();
    if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
    g.translate(x, y);
    if (o.rot) g.rotate(o.rot);
    if (o.sc !== undefined) g.scale(o.sc, o.sc);
    if (z > 0) {
      g.shadowColor = o.shadowColor || `rgba(58,36,20,${(0.3 / (1 + z * 0.06)).toFixed(3)})`;
      g.shadowBlur = (1.4 + z * 1.2) * sc; g.shadowOffsetX = (0.4 + z * 0.5) * sc; g.shadowOffsetY = (0.6 + z * 0.8) * sc;
    }
    if (o.op) g.globalCompositeOperation = o.op;
    g.drawImage(sp.c, -sp.bx - (o.ax || 0) * sp.width, -sp.by);
    g.restore();
  };
  // per-letter layout (prefix widths keep the font's kerning)
  SH.letters = (str, size, o) => {
    const chars = Array.from(str), out = [];
    for (let i = 0; i < chars.length; i++) {
      const x = SH.measure(chars.slice(0, i).join(''), size, o.fam, o.wt, o.tr || 0) + (o.tr ? i * 0 : 0);
      out.push({ ch: chars[i], i, x, cw: SH.measure(chars[i], size, o.fam, o.wt), sp: chars[i] === ' ' ? null : SH.textSprite(chars[i], size, o) });
    }
    return { list: out, width: SH.measure(str, size, o.fam, o.wt, o.tr || 0) };
  };

  /* ---------------- camera ---------------- */
  SH.camApply = (g, c, W, H, par = 1) => {
    const z = 1 + (c.z - 1) * par, x = W / 2 + (c.x - W / 2) * par, y = H / 2 + (c.y - H / 2) * par;
    g.translate(W / 2, H / 2);
    if (c.r) g.rotate(c.r * par);
    g.scale(z, z);
    g.translate(-x, -y);
  };

  /* ---------------- harness: one style per page ---------------- */
  let STYLE = null;
  SH.register = def => { STYLE = def; boot2(); };
  // SH.boot()            → loads styles/<?s=folder>/preview.js (style previews)
  // SH.boot('video.js')  → loads a given script (a video page made from videos/_sablon)
  SH.boot = src => {
    const q = new URLSearchParams(location.search), slug = q.get('s');
    if (!src && !slug) { document.body.insertAdjacentHTML('beforeend', '<p style="color:#ccc;font:16px system-ui;padding:24px">?s=&lt;stil-klasörü&gt; ekleyin</p>'); return; }
    const sc = document.createElement('script');
    sc.src = src || `${slug}/preview.js`;
    document.head.appendChild(sc);
  };
  async function boot2() {
    const cv = document.getElementById('c'), W = STYLE.w || 1080, H = STYLE.h || 1920;
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    const sample = 'AaĞğİıŞşÇçÖöÜü0123456789%:!?,.';
    await Promise.all((STYLE.fonts || []).map(f => document.fonts.load(f, sample)));
    SH.TEX = SH.grain(512, 1234);
    if (STYLE.init) await STYLE.init(g, W, H);
    const D = STYLE.duration || 8, FPS = STYLE.fps || 30;
    const seek = t => {
      if (g.reset) g.reset(); else g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      SH.frameIndex = Math.round(t * FPS);
      STYLE.frame(g, clamp(t, 0, D), W, H);
    };
    G.seek = seek; G.DURATION = D; G.FPS = FPS; G.STYLE_ID = STYLE.id; G.POSTER = STYLE.poster ?? D * 0.6;
    seek(STYLE.poster ?? 0);
    G.__ready = true;
    const q = new URLSearchParams(location.search);
    if (q.has('render')) return;
    let playing = q.has('play'), base = 0, t0 = performance.now(), cur = 0;
    const loop = now => {
      if (!playing) return;
      cur = (base + (now - t0) / 1000) % D;
      seek(cur);
      requestAnimationFrame(loop);
    };
    const toggle = () => { playing = !playing; if (playing) { base = cur; t0 = performance.now(); requestAnimationFrame(loop); } };
    addEventListener('keydown', e => { if (e.code === 'Space') { toggle(); e.preventDefault(); } });
    cv.addEventListener('click', toggle);
    if (playing) requestAnimationFrame(loop);
  }
})(window);
