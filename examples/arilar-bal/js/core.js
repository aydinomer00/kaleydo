'use strict';
/* ==========================================================================
   PAPER ENGINE — deterministic, time-addressable Canvas 2D renderer.
   Every frame is a pure function of time: seek(t) never depends on the
   previous frame, the wall clock, or unseeded randomness.
   ========================================================================== */

const W = 1080, H = 1920, FPS = 30;
const DURATION = 25;          // resolved duration (the topic asks for a 25 s YouTube video)
const BASE = 25;              // the timeline is authored on a 25-unit "story clock" …
const TS = DURATION / BASE;   // … and scaled to the resolved duration, so timing stays proportional

const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
const FR = { s: 0, frame: 0 };          // current story time and frame index

/* ---------- math & easing ---------- */
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const P = (s, a, b) => clamp((s - a) / (b - a));
const bump = x => (x <= 0 || x >= 1 ? 0 : Math.sin(Math.PI * x));
const E = {
  lin: x => x,
  inQ: x => x * x,
  outQ: x => 1 - (1 - x) * (1 - x),
  ioQ: x => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2),
  inC: x => x * x * x,
  outC: x => 1 - Math.pow(1 - x, 3),
  ioC: x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  outQu: x => 1 - Math.pow(1 - x, 5),
  ioS: x => x * x * (3 - 2 * x),
  outBack: (x, k = 1.6) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 + (k + 1) * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2)),
  inBack: (x, k = 1.6) => (k + 1) * x * x * x - k * x * x,
};
// damped settle 0 → 1 with a small physical overshoot (paper landing on a desk)
function spring(x, cyc = 1.25, damp = 6) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return 1 - Math.exp(-damp * x) * Math.cos(x * Math.PI * 2 * cyc) * (1 - x);
}
// stop-motion clock: 12 poses per real second, used for handmade "boil"
function q12(s) { const t = s * TS; return Math.floor(t * 12 + 1e-6) / 12 / TS; }

/* ---------- deterministic randomness ---------- */
function hash32(x) {
  x |= 0;
  x ^= x >>> 16; x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15; x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
}
// independent value for (seed, index): two rounds of a well-mixed integer hash
function h01(seed, i) { return hash32(Math.imul(seed | 0, 0x27d4eb2d) ^ hash32((i | 0) + 0x632be5ab)) / 4294967296; }
// mulberry32 stream, seeded through the hash so neighbouring seeds are unrelated
function rng(seed) {
  let a = hash32((seed ^ 0x9e3779b9) | 0);
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function noise1(seed, x) {                       // smooth value noise, range [-1, 1]
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  const a = h01(seed, i), b = h01(seed, i + 1);
  return (a + (b - a) * u) * 2 - 1;
}
function loopNoise(seed, ang, freq) {            // periodic noise around a closed outline
  const x = (ang / (Math.PI * 2)) * freq;
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  const a = h01(seed, ((i % freq) + freq) % freq), b = h01(seed, (((i + 1) % freq) + freq) % freq);
  return (a + (b - a) * u) * 2 - 1;
}

/* ---------- colour ---------- */
const C = {
  cream: '#F3EBDD', char: '#243139', terra: '#C56B50', mustard: '#E8B65C',
  sage: '#8A9B7C', blue: '#7C9DA5', card: '#FFF8EB',
};
function hx(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
const _mix = new Map();
function mixc(c1, c2, t) {
  const k = c1 + c2 + t.toFixed(3);
  let v = _mix.get(k);
  if (v) return v;
  const a = hx(c1), b = hx(c2);
  v = '#' + [0, 1, 2].map(i => Math.round(a[i] + (b[i] - a[i]) * clamp(t)).toString(16).padStart(2, '0')).join('');
  _mix.set(k, v);
  return v;
}
const lighten = (c, t) => mixc(c, '#FFFCF4', t);
const darken = (c, t) => mixc(c, '#2A1D15', t);
function rgba(c, a) { const [r, g, b] = hx(c); return `rgba(${r},${g},${b},${a})`; }

/* ---------- geometry: hand-cut outlines ---------- */
function addPts(p, pts, closed = true) {
  p.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]);
  if (closed) p.closePath();
  return p;
}
function pathFrom(pts, closed = true) { return addPts(new Path2D(), pts, closed); }
function rotPts(pts, cx, cy, a) {
  const c = Math.cos(a), s = Math.sin(a);
  return pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]);
}
// displace a closed outline along its normals: slow wobble + fine scissor jitter
function jitterPts(pts, seed, amp, closed = true) {
  const n = pts.length, out = [];
  for (let i = 0; i < n; i++) {
    const a = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)];
    const b = pts[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0];
    const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
    const d = amp * (noise1(seed, i * 0.31) * 0.65 + noise1(seed + 911, i * 1.9) * 0.35);
    out.push([pts[i][0] + nx * d, pts[i][1] + ny * d]);
  }
  return out;
}
function blob(cx, cy, rx, ry, seed, o = {}) {
  const n = o.n || Math.max(28, Math.round((rx + ry) * 0.62));
  const wob = o.wob ?? 0.022, jit = o.jit ?? 0.55, rot = o.rot || 0;
  const cr = Math.cos(rot), sr = Math.sin(rot), pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    let k = 1 + wob * loopNoise(seed, a, 5) + wob * 0.5 * loopNoise(seed + 3, a, 11);
    if (o.bumps) k += o.bumps[1] * (Math.pow(Math.abs(Math.sin((a * o.bumps[0]) / 2)), 0.6) - 0.6);
    const j = jit * loopNoise(seed + 17, a, Math.max(8, n >> 1));
    const x = Math.cos(a) * (rx * k + j), y = Math.sin(a) * (ry * k + j);
    pts.push([cx + x * cr - y * sr, cy + x * sr + y * cr]);
  }
  return pts;
}
function rrect(x, y, w, h, r, seed, o = {}) {
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
}
function polyPts(verts, seed, o = {}) {           // straight-edged polygon, cut by hand
  const sp = o.sp || 7, pts = [];
  for (let i = 0; i < verts.length; i++) {
    const a = verts[i], b = verts[(i + 1) % verts.length];
    const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / sp));
    for (let k = 0; k < n; k++) pts.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  return jitterPts(pts, seed, o.jit ?? 0.6);
}
function quadPts(p0, p1, p2, n) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]);
  }
  return out;
}
// quadratic that passes through the middle point (knee, elbow …)
function thruPts(a, k, b, n) { return quadPts(a, [2 * k[0] - (a[0] + b[0]) / 2, 2 * k[1] - (a[1] + b[1]) / 2], b, n); }
// a strip of paper following a spine (stems, legs, antennae, dashes)
function strip(spine, w0, w1, seed, o = {}) {
  const n = spine.length, L = [], R = [];
  let tx = 1, ty = 0, sx = 1, sy = 0;
  for (let i = 0; i < n; i++) {
    const a = spine[Math.max(0, i - 1)], b = spine[Math.min(n - 1, i + 1)];
    tx = b[0] - a[0]; ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    if (i === 0) { sx = tx; sy = ty; }
    const t = n > 1 ? i / (n - 1) : 0;
    const w = lerp(w0, w1, t) * 0.5 * (1 + (o.wob ?? 0.05) * noise1(seed, i * 0.6));
    L.push([spine[i][0] - ty * w, spine[i][1] + tx * w]);
    R.push([spine[i][0] + ty * w, spine[i][1] - tx * w]);
  }
  const out = L.slice();
  if (o.cap) {                                     // rounded tip
    const e = spine[n - 1], w = w1 * 0.5;
    for (let k = 1; k < 6; k++) {
      const th = (Math.PI * k) / 6;
      out.push([e[0] + w * (-ty * Math.cos(th) + tx * Math.sin(th)), e[1] + w * (tx * Math.cos(th) + ty * Math.sin(th))]);
    }
  }
  for (let i = n - 1; i >= 0; i--) out.push(R[i]);
  if (o.cap || o.cap0) {                           // rounded root
    const s0 = spine[0], w = w0 * 0.5;
    for (let k = 1; k < 6; k++) {
      const th = (Math.PI * k) / 6;
      out.push([s0[0] + w * (sy * Math.cos(th) - sx * Math.sin(th)), s0[1] + w * (-sx * Math.cos(th) - sy * Math.sin(th))]);
    }
  }
  return out;
}
// petal / leaf / wing lobe: base at (0,0), tip at (0,-len)
function lobe(len, wid, seed, o = {}) {
  const n = 30, pts = [], a = o.a ?? 0.8, b = o.tip ?? 0.85;
  const prof = s => (wid / 2) * Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(s, a))), b);
  for (let i = 0; i <= n; i++) { const s = i / n; pts.push([prof(s) * (o.skew ? 1 + o.skew * s : 1), -len * s]); }
  for (let i = n - 1; i > 0; i--) { const s = i / n; pts.push([-prof(s), -len * s]); }
  return jitterPts(pts, seed, o.jit ?? 0.55);
}
function hexPts(cx, cy, r, seed, o = {}) {        // pointy-top hexagon
  const v = [];
  for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 3 + (o.rot || 0); v.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return polyPts(v, seed, { sp: o.sp || 6, jit: o.jit ?? 0.55 });
}
function ringPath(cx, cy, r0, r1, seed) {
  const p = new Path2D();
  addPts(p, blob(cx, cy, r1, r1, seed, { wob: 0.006 }));
  addPts(p, blob(cx, cy, r0, r0, seed + 1, { wob: 0.006 }));
  return p;
}
function catmull(pts, u) {
  const n = pts.length - 1, f = clamp(u) * n, i = Math.min(n - 1, Math.floor(f)), t = f - i;
  const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n, i + 2)];
  const t2 = t * t, t3 = t2 * t;
  const c = k => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
  return [c(0), c(1)];
}

/* ---------- paper material ---------- */
let TEXCV = null, TEXP = null, BGCV = null, VIG = null;

// tileable fibre texture, mid-grey so it can both lighten and darken via soft-light
function makeFiberTexture(size, seed) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  const R = rng(seed), img = g.createImageData(size, size), cell = 32, gw = size / cell, grid = [];
  for (let i = 0; i < gw * gw; i++) grid.push(R());
  const G = (ix, iy) => grid[(((iy % gw) + gw) % gw) * gw + (((ix % gw) + gw) % gw)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gx = x / cell, gy = y / cell, ix = Math.floor(gx), iy = Math.floor(gy);
      const fx = gx - ix, fy = gy - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
      const m = lerp(lerp(G(ix, iy), G(ix + 1, iy), u), lerp(G(ix, iy + 1), G(ix + 1, iy + 1), u), v);
      const val = 128 + (R() - 0.5) * 12 + (m - 0.5) * 26;
      const k = (y * size + x) * 4;
      img.data[k] = img.data[k + 1] = img.data[k + 2] = val; img.data[k + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  g.lineCap = 'round';
  for (let i = 0; i < 1100; i++) {
    const x = R() * size, y = R() * size, len = 5 + R() * 24, ang = R() * Math.PI * 2, cu = (R() - 0.5) * 0.9;
    const light = R() < 0.55;
    g.strokeStyle = light ? `rgba(255,255,255,${(0.12 + R() * 0.24).toFixed(3)})` : `rgba(45,30,20,${(0.07 + R() * 0.14).toFixed(3)})`;
    g.lineWidth = 0.6 + R() * 1.2;
    const ex = Math.cos(ang) * len, ey = Math.sin(ang) * len;
    const mx = ex / 2 - Math.sin(ang) * cu * len * 0.3, my = ey / 2 + Math.cos(ang) * cu * len * 0.3;
    for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) {
      const x0 = x + ox, y0 = y + oy;
      if (x0 < -40 || x0 > size + 40 || y0 < -40 || y0 > size + 40) continue;
      g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + mx, y0 + my, x0 + ex, y0 + ey); g.stroke();
    }
  }
  return c;
}
function makeBackground() {
  const bw = W + 900, bh = H + 900;
  const c = document.createElement('canvas'); c.width = bw; c.height = bh;
  const g = c.getContext('2d');
  g.fillStyle = C.cream; g.fillRect(0, 0, bw, bh);
  const R = rng(77);
  for (let i = 0; i < 46; i++) {                   // a large sheet is never perfectly even
    const x = R() * bw, y = R() * bh, r = 140 + R() * 420, light = R() < 0.5;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, light ? 'rgba(255,251,242,0.20)' : 'rgba(150,108,66,0.055)');
    gr.addColorStop(1, light ? 'rgba(255,251,242,0)' : 'rgba(150,108,66,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  g.globalCompositeOperation = 'soft-light'; g.globalAlpha = 0.85;
  g.fillStyle = g.createPattern(TEXCV, 'repeat'); g.fillRect(0, 0, bw, bh);
  return c;
}
function makeVignette() {                          // light falls in from the top-left
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(W * 0.42, H * 0.36, H * 0.22, W * 0.5, H * 0.52, H * 0.8);
  gr.addColorStop(0, 'rgba(48,30,14,0)');
  gr.addColorStop(1, 'rgba(48,30,14,0.20)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  return c;
}

function devScale(g) { const m = g.getTransform(); return Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)); }

/* paper(): one cut piece of matte paper.
   - warm cast shadow whose offset/blur grow with elevation z (screen-space light, top-left)
   - exposed cut edge: light band on edges facing the light, dark band on the far side
   - stable fibre texture anchored to the piece (it moves with the paper)            */
function paper(g, path, o) {
  const m = g.getTransform();
  const det = m.a * m.d - m.b * m.c;
  const sc = Math.sqrt(Math.abs(det));
  if (sc < 1e-3) return;
  const rule = o.rule || 'nonzero', z = o.z ?? 3, col = o.color;
  g.save();
  if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
  if (z > 0 && o.shadow !== false) {
    const a = (o.sa ?? 0.3) / (1 + z * 0.06);
    g.shadowColor = `rgba(58,36,20,${a.toFixed(3)})`;
    g.shadowBlur = (1.6 + z * 1.3) * sc;
    g.shadowOffsetX = (0.4 + z * 0.5) * sc;
    g.shadowOffsetY = (0.6 + z * 0.8) * sc;
  }
  g.fillStyle = col;
  g.fill(path, rule);
  g.shadowColor = 'rgba(0,0,0,0)'; g.shadowBlur = 0; g.shadowOffsetX = 0; g.shadowOffsetY = 0;
  g.clip(path, rule);
  if (o.edge !== false) {
    const e = (o.ew ?? 1.7) * sc, dx = e * 0.72, dy = e * 0.9;
    const lx = (m.d * dx - m.c * dy) / det, ly = (-m.b * dx + m.a * dy) / det;
    g.fillStyle = o.hi || lighten(col, 0.42);
    g.fill(path, rule);
    g.save();
    g.translate(lx, ly); g.clip(path, rule); g.translate(-lx, -ly);
    g.fillStyle = o.lo || darken(col, 0.2);
    g.fill(path, rule);
    g.translate(-lx, -ly); g.clip(path, rule); g.translate(lx, ly);
    g.fillStyle = col;
    g.fill(path, rule);
    g.restore();
  }
  if (o.shade) o.shade(g);
  const tex = o.tex ?? 0.6;
  if (tex > 0) {
    g.globalCompositeOperation = 'soft-light';
    g.globalAlpha *= tex;
    const sd = o.seed | 0;
    TEXP.setTransform(new DOMMatrix([1, 0, 0, 1, (sd * 97) % 512, (sd * 61) % 512]));
    g.fillStyle = TEXP;
    g.fill(path, rule);
  }
  g.restore();
}
// fold/crease shading: half of a creased piece faces the light, the other half turns away
function creaseShade(g) {
  const m = g.getTransform(), l = Math.hypot(m.a, m.b) || 1;
  const d = ((m.a / l) * -0.62 + (m.b / l) * -0.78) * Math.sign(m.a * m.d - m.b * m.c || 1);
  const lit = `rgba(255,250,238,${(0.12 * Math.abs(d)).toFixed(3)})`, dim = `rgba(45,28,18,${(0.15 * Math.abs(d)).toFixed(3)})`;
  g.fillStyle = d > 0 ? lit : dim; g.fillRect(0, -600, 600, 1200);
  g.fillStyle = d > 0 ? dim : lit; g.fillRect(-600, -600, 600, 1200);
}
// shadow-free soft contact shadow (for things hovering over the backdrop)
function softShadow(g, x, y, rx, ry, a) {
  g.save(); g.translate(x, y); g.scale(1, ry / rx);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
  gr.addColorStop(0, `rgba(58,36,20,${a})`); gr.addColorStop(1, 'rgba(58,36,20,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, Math.PI * 2); g.fill();
  g.restore();
}

/* ---------- cut-paper type ---------- */
const TXT = new Map();
const _mctx = document.createElement('canvas').getContext('2d');
function fontStr(size, fam, wt) { return `${wt} ${size}px "${fam}"`; }
function measure(str, size, fam = 'Baloo 2', wt = 600, tr = 0) {
  _mctx.font = fontStr(size, fam, wt);
  if (!tr) return _mctx.measureText(str).width;
  let w = 0; for (const ch of str) w += _mctx.measureText(ch).width + tr;
  return w - tr;
}
function fillTr(g, str, x, y, tr) {
  if (!tr) { g.fillText(str, x, y); return; }
  for (const ch of str) { g.fillText(ch, x, y); x += g.measureText(ch).width + tr; }
}
// text rendered as cut paper letters: light cut edge, fibre texture; shadow added at draw time
function tsprite(str, size, o = {}) {
  const fam = o.fam || 'Baloo 2', wt = o.wt || 600, col = o.col || C.char, tr = o.tr || 0;
  const key = `${str}|${size}|${fam}|${wt}|${col}|${tr}`;
  let sp = TXT.get(key);
  if (sp) return sp;
  const font = fontStr(size, fam, wt), width = measure(str, size, fam, wt, tr);
  const pad = Math.ceil(size * 0.3), w = Math.ceil(width + pad * 2), h = Math.ceil(size * 1.55 + pad * 2);
  const c = document.createElement('canvas'); c.width = Math.max(2, w); c.height = h;
  const g = c.getContext('2d');
  g.font = font; g.textBaseline = 'alphabetic';
  const bx = pad, by = Math.round(pad + size * 1.1), e = Math.max(1.1, size * 0.02);
  g.fillStyle = lighten(col, 0.5); fillTr(g, str, bx, by, tr);
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = col; fillTr(g, str, bx + e * 0.72, by + e * 0.9, tr);
  const t = document.createElement('canvas'); t.width = c.width; t.height = h;
  const tg = t.getContext('2d');
  tg.fillStyle = tg.createPattern(TEXCV, 'repeat'); tg.fillRect(0, 0, t.width, h);
  tg.globalCompositeOperation = 'destination-in'; tg.drawImage(c, 0, 0);
  g.globalCompositeOperation = 'soft-light'; g.globalAlpha = 0.7; g.drawImage(t, 0, 0);
  sp = { c, w: c.width, h, bx, by, width, size };
  TXT.set(key, sp);
  return sp;
}
function drawSprite(g, sp, x, y, o = {}) {
  const sc = devScale(g), z = o.z ?? 3;
  g.save();
  if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
  g.translate(x, y);
  if (o.rot) g.rotate(o.rot);
  if (o.sc !== undefined) g.scale(o.sc, o.sc);
  if (z > 0) {
    g.shadowColor = `rgba(58,36,20,${(0.3 / (1 + z * 0.06)).toFixed(3)})`;
    g.shadowBlur = (1.4 + z * 1.2) * sc;
    g.shadowOffsetX = (0.4 + z * 0.5) * sc;
    g.shadowOffsetY = (0.6 + z * 0.8) * sc;
  }
  g.drawImage(sp.c, -sp.bx - (o.ax || 0) * sp.width, -sp.by);
  g.restore();
}
// per-letter layout (prefix widths keep the font's kerning)
function letters(str, size, o = {}) {
  const fam = o.fam || 'Baloo 2', wt = o.wt || 600, out = [];
  const chars = Array.from(str);
  for (let i = 0; i < chars.length; i++) {
    const x = measure(chars.slice(0, i).join(''), size, fam, wt);
    const cw = measure(chars[i], size, fam, wt);
    out.push({ ch: chars[i], x, cw, sp: chars[i] === ' ' ? null : tsprite(chars[i], size, o) });
  }
  return { list: out, width: measure(str, size, fam, wt) };
}

/* ---------- virtual camera ---------- */
function camApply(g, c, par = 1) {
  const z = 1 + (c.z - 1) * par, x = 540 + (c.x - 540) * par, y = 960 + (c.y - 960) * par;
  g.translate(W / 2, H / 2);
  if (c.r) g.rotate(c.r * par);
  g.scale(z, z);
  g.translate(-x, -y);
}
function toScreen(c, wx, wy, par = 1) {
  const z = 1 + (c.z - 1) * par, x = 540 + (c.x - 540) * par, y = 960 + (c.y - 960) * par;
  return [W / 2 + (wx - x) * z, H / 2 + (wy - y) * z];
}
