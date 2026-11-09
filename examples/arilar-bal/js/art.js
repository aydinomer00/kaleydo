'use strict';
/* ==========================================================================
   CUT-PAPER ILLUSTRATION KIT
   Geometry is cut once (cached Path2D, seeded jitter); poses change per frame.
   ========================================================================== */

const PAL = {
  terraD: darken(C.terra, 0.16), terraL: lighten(C.terra, 0.3),
  mustD: darken(C.mustard, 0.22), mustL: lighten(C.mustard, 0.38),
  sageD: darken(C.sage, 0.18), sageDD: darken(C.sage, 0.34), sageL: lighten(C.sage, 0.3),
  blueD: darken(C.blue, 0.22), blueL: lighten(C.blue, 0.42),
  charD: darken(C.char, 0.28),
  thorax: '#C98B4B', pollen: '#E2964B',
  nectar: '#F4DC9A', honey: '#D58E2C', honeyD: '#B4701F',
  wax: '#F5E5BC', wall: '#EABF68', cellBack: '#B07B36', cellDeep: '#8D5D25',
  glass: '#DCE6E2',
};

/* ---------------- BEE (canonical pose faces right; thorax centre at 0,0) ---------------- */
const BEE = (() => {
  const s = 4100, P = {}, ac = [-62, 8], ar = -0.18;
  const R = pts => rotPts(pts, ac[0], ac[1], ar);
  P.abd = pathFrom(blob(-62, 8, 64, 47, s + 1, { rot: ar, wob: 0.018 }));
  P.st1 = pathFrom(R(strip(thruPts([-55, -64], [-48, 8], [-57, 80], 14), 18, 18, s + 2)));
  P.st2 = pathFrom(R(strip(thruPts([-88, -64], [-81, 8], [-90, 80], 14), 17, 17, s + 3)));
  P.tip = pathFrom(R(blob(-128, 8, 22, 44, s + 4)));
  P.sting = pathFrom(R(polyPts([[-121, 3], [-141, 9], [-121, 14]], s + 5, { sp: 3, jit: 0.2 })));
  P.thx = pathFrom(blob(0, -2, 37, 35, s + 6, { bumps: [22, 0.05] }));
  P.head = pathFrom(blob(44, 8, 30, 29, s + 7));
  P.eye = pathFrom(blob(53, 1, 12, 14, s + 8, { jit: 0.3 }));
  P.pupil = pathFrom(blob(56, 2.5, 7, 7.5, s + 9, { jit: 0.2 }));
  P.glint = pathFrom(blob(58.6, -2.2, 2.7, 2.7, s + 10, { jit: 0, n: 14 }));
  P.cheek = pathFrom(blob(41, 22, 6.5, 5.5, s + 11, { jit: 0.2 }));
  P.smile = pathFrom(strip(thruPts([52, 24], [58, 28.5], [64.5, 22.5], 8), 3.4, 3.0, s + 12, { cap: true }));
  P.wingB = pathFrom(lobe(98, 46, s + 13, { a: 0.62, tip: 0.5 }));
  P.wingF = pathFrom(lobe(86, 40, s + 14, { a: 0.62, tip: 0.5 }));
  P.veinB = pathFrom(strip(thruPts([0, -8], [4, -50], [-3, -90], 10), 2.4, 1.4, s + 15));
  P.veinF = pathFrom(strip(thruPts([0, -8], [3, -44], [-3, -78], 10), 2.2, 1.3, s + 16));
  return P;
})();
const BEE_LEGS = [
  { hip: [22, 22], st: [[33, 41], [28, 61]], tu: [[19, 40], [3, 48]] },
  { hip: [2, 28], st: [[7, 45], [0, 63]], tu: [[-8, 42], [-25, 48]] },
  { hip: [-18, 26], st: [[-31, 43], [-27, 64]], tu: [[-35, 38], [-55, 44]] },
];
function beeWing(g, path, vein, ang, alpha, z, seed) {
  g.save(); g.translate(-4, -26); g.rotate(ang + Math.PI / 2);
  paper(g, path, { color: C.card, alpha, z, seed, tex: 0.35, ew: 1.3, sa: 0.22, edge: z > 0 });
  if (z > 0) { g.save(); g.clip(path); paper(g, vein, { color: PAL.blueL, z: 0, edge: false, tex: 0, alpha: alpha * 0.9 }); g.restore(); }
  g.restore();
}
// o: x, y, s, face (-1..1, paper flip passes through 0), rot, wings 'rest'|'fly'|'fan',
//    tuck (legs folded), prob (proboscis 0..1), probAng, pollen 0..1, alt (height over backdrop)
function drawBee(g, o) {
  const fr = o.frame ?? FR.frame, sd = o.seed || 0;
  let face = o.face ?? 1;
  if (Math.abs(face) < 0.07) face = face < 0 ? -0.07 : 0.07;
  const s = o.s ?? 1, tuck = o.tuck ?? 0;
  g.save();
  g.translate(o.x, o.y);
  if (o.alt) softShadow(g, o.alt * 0.55 * s, o.alt * 0.95 * s + 38 * s, 96 * s, 30 * s, 0.12);
  g.rotate(o.rot || 0);
  g.scale(s * face * (o.sqx ?? 1), s * (o.sqy ?? 1));
  const mode = o.wings || 'rest';
  let aB, aF, gB = null;
  if (mode === 'rest') { aB = Math.PI + 0.5; aF = Math.PI + 0.28; }
  else {
    const amp = mode === 'fan' ? 1.35 : 1, poses = [-0.55, 0.05, 0.6], k = ((fr + sd) % 3 + 3) % 3;
    aB = -1.95 + poses[k] * amp; aF = -1.7 + poses[k] * amp * 1.08; gB = -1.95 + poses[(k + 2) % 3] * amp;
  }
  const legs = far => {
    for (let i = 0; i < 3; i++) {
      const L = BEE_LEGS[i], ox = far ? 11 : 0, oy = far ? -7 : 0;
      const kk = [lerp(L.st[0][0], L.tu[0][0], tuck) + ox, lerp(L.st[0][1], L.tu[0][1], tuck) + oy];
      const ff = [lerp(L.st[1][0], L.tu[1][0], tuck) + ox, lerp(L.st[1][1], L.tu[1][1], tuck) + oy];
      const hh = [L.hip[0] + ox, L.hip[1] + oy];
      paper(g, pathFrom(strip(thruPts(hh, kk, ff, 10), 7, 4.6, 4200 + i + (far ? 10 : 0), { cap: true })),
        { color: far ? PAL.charD : C.char, z: far ? 1 : 2, seed: 30 + i, ew: 1.2, tex: 0.4 });
      if (!far && i === 2 && (o.pollen || 0) > 0.01) {
        const r = 11.5 * o.pollen;
        paper(g, pathFrom(blob(lerp(kk[0], ff[0], 0.38) - 2, lerp(kk[1], ff[1], 0.38), r, r * 0.92, 4300, { jit: 0.35 })),
          { color: PAL.pollen, z: 2, seed: 41 });
      }
    }
  };
  legs(true);
  if (gB !== null) beeWing(g, BEE.wingB, BEE.veinB, gB, 0.2, 0, 1);
  beeWing(g, BEE.wingB, BEE.veinB, aB, 0.74, 3.5, 51);
  paper(g, BEE.abd, { color: C.mustard, z: 3, seed: 61 });
  g.save(); g.clip(BEE.abd);
  paper(g, BEE.st1, { color: C.char, z: 1.4, seed: 62, ew: 1.3 });
  paper(g, BEE.st2, { color: C.char, z: 1.4, seed: 63, ew: 1.3 });
  paper(g, BEE.tip, { color: C.char, z: 1.4, seed: 64, ew: 1.3 });
  g.restore();
  paper(g, BEE.sting, { color: C.char, z: 1, seed: 65, edge: false, tex: 0 });
  paper(g, BEE.thx, { color: PAL.thorax, z: 3, seed: 66 });
  if ((o.prob || 0) > 0.01) {
    const pa = o.probAng ?? 1.2, L = 66 * o.prob, p0 = [56, 30];
    const p2 = [p0[0] + Math.cos(pa) * L, p0[1] + Math.sin(pa) * L];
    const p1 = [(p0[0] + p2[0]) / 2 - Math.sin(pa) * 5, (p0[1] + p2[1]) / 2 + Math.cos(pa) * 5];
    paper(g, pathFrom(strip(quadPts(p0, p1, p2, 10), 6, 4.2, 4400, { cap: true })), { color: C.char, z: 1.5, seed: 67, ew: 1.1 });
  }
  paper(g, BEE.head, { color: C.char, z: 3, seed: 68 });
  paper(g, BEE.eye, { color: C.card, z: 1.2, seed: 69, ew: 1.2 });
  paper(g, BEE.pupil, { color: C.char, z: 0.8, seed: 70, ew: 1, tex: 0.3 });
  paper(g, BEE.glint, { color: C.card, z: 0, edge: false, tex: 0 });
  paper(g, BEE.cheek, { color: PAL.terraL, z: 0.6, seed: 71, ew: 1 });
  paper(g, BEE.smile, { color: C.card, z: 0.5, seed: 72, edge: false, tex: 0.2 });
  const wq = q12(FR.s) + sd * 0.37;                 // antennae twitch on the stop-motion clock
  const w1 = noise1(81 + sd, wq * 2.2) * 5, w2 = noise1(83 + sd, wq * 2.2) * 5;
  const ant = (b, k, t, id) => {
    paper(g, pathFrom(strip(thruPts(b, k, t, 10), 4.8, 3.4, id, { cap: true })), { color: C.char, z: 2, seed: id, ew: 1.1, tex: 0.3 });
    paper(g, pathFrom(blob(t[0], t[1], 6, 6, id + 1, { jit: 0.3, n: 18 })), { color: C.char, z: 2, seed: id + 1, ew: 1.1 });
  };
  ant([36, -18], [42, -46], [48 + w2 * 0.6, -71 + w2 * 0.3], 4500);
  ant([46, -16], [60, -40], [72 + w1, -60 + w1 * 0.4], 4510);
  legs(false);
  beeWing(g, BEE.wingF, BEE.veinF, aF, 0.84, 5, 52);
  g.restore();
}

/* ---------------- FLOWERS ---------------- */
function makeFlower(kind, seed) {
  const R = rng(seed), F = { kind, seed, petals: [] };
  const ring = (n, len, wid, col, off, layer, o = {}) => {
    for (let i = 0; i < n; i++) {
      F.petals.push({
        path: pathFrom(lobe(len * (0.93 + 0.14 * R()), wid * (0.9 + 0.2 * R()), seed + i * 13 + layer * 101, { a: o.a ?? 0.75, tip: o.tip ?? 0.7 })),
        ang: off + (i * Math.PI * 2) / n + (R() - 0.5) * 0.1, col, layer, i, n, z: o.z ?? 3,
      });
    }
  };
  switch (kind) {
    case 'hero':
      ring(9, 152, 72, PAL.terraD, 0.35, 0, { z: 2.2 });
      ring(9, 128, 62, C.terra, 0, 1, { z: 3.5 });
      F.center = { r: 56, col: C.mustard }; F.ring = { n: 18, r: 41, dot: 6.2, col: PAL.mustD };
      F.core = { r: 23, col: mixc(C.mustard, C.terra, 0.45) };
      break;
    case 'daisy':
      ring(13, 76, 25, C.card, 0, 1, { tip: 0.6, z: 3 });
      F.center = { r: 24, col: C.mustard }; F.ring = { n: 10, r: 15, dot: 3.6, col: PAL.mustD };
      break;
    case 'corn':
      ring(8, 62, 34, C.blue, 0, 0, { tip: 0.45, z: 2.5 });
      ring(8, 36, 19, PAL.blueD, 0.39, 1, { tip: 0.5, z: 3 });
      F.center = { r: 13, col: darken(C.blue, 0.55) };
      break;
    case 'poppy':
      ring(6, 62, 58, C.terra, 0.2, 1, { tip: 0.4, a: 0.65, z: 3 });
      F.center = { r: 16, col: C.char }; F.ring = { n: 9, r: 23, dot: 3.2, col: C.char };
      break;
    case 'mini':
      ring(6, 46, 32, C.mustard, 0, 1, { tip: 0.5, z: 2.5 });
      F.center = { r: 12, col: C.terra };
      break;
  }
  if (F.center) F.cpath = pathFrom(blob(0, 0, F.center.r, F.center.r, seed + 500));
  if (F.ring) F.dots = Array.from({ length: F.ring.n }, (_, i) => {
    const a = (i / F.ring.n) * Math.PI * 2 + 0.2;
    return pathFrom(blob(Math.cos(a) * F.ring.r, Math.sin(a) * F.ring.r, F.ring.dot, F.ring.dot, seed + 600 + i, { jit: 0.3, n: 16 }));
  });
  if (F.core) F.kpath = pathFrom(blob(0, 0, F.core.r, F.core.r, seed + 700));
  return F;
}
const GLINTS = [[-11, -8, 6.5], [10, -4, 5.5], [-2, 11, 6], [13, 12, 4.5]].map(([x, y, r], i) =>
  ({ path: pathFrom(blob(x, y, r, r * 1.1, 8800 + i, { jit: 0.2, n: 16 })), hl: pathFrom(blob(x - r * 0.3, y - r * 0.35, r * 0.32, r * 0.32, 8810 + i, { jit: 0, n: 10 })) }));
function drawFlower(g, F, o) {
  const open = o.open ?? 1;
  if (open <= 0) return;
  g.save(); g.translate(o.x, o.y); g.rotate(o.rot || 0); g.scale(o.s ?? 1, o.s ?? 1);
  for (const p of F.petals) {
    const st = clamp(open * 1.5 - (p.layer ? 0.2 : 0) - (p.i / p.n) * 0.3);
    if (st <= 0) continue;
    const e = E.outBack(st, 1.2), k = 0.12 + 0.88 * e;
    g.save(); g.rotate(p.ang + (1 - e) * 0.8); g.scale(k, k);
    paper(g, p.path, { color: p.col, z: p.z, seed: F.seed + p.i * 7 + p.layer * 50, shade: creaseShade });
    g.restore();
  }
  const ce = E.outBack(clamp((open - 0.42) / 0.45), 1.8);
  if (ce > 0 && F.cpath) {
    g.save(); g.scale(ce, ce);
    paper(g, F.cpath, { color: F.center.col, z: 3.5, seed: F.seed + 3 });
    if (F.dots) for (let i = 0; i < F.dots.length; i++) paper(g, F.dots[i], { color: F.ring.col, z: 0.8, seed: F.seed + 9 + i, ew: 1, tex: 0.4 });
    if (F.kpath) paper(g, F.kpath, { color: F.core.col, z: 1.4, seed: F.seed + 5 });
    if ((o.nectar || 0) > 0.01) for (const gl of GLINTS) {
      paper(g, gl.path, { color: '#FFF0C2', z: 0.9, alpha: o.nectar, seed: 5, ew: 1, tex: 0.2 });
      paper(g, gl.hl, { color: '#FFFFFF', z: 0, alpha: o.nectar * 0.9, edge: false, tex: 0 });
    }
    g.restore();
  }
  g.restore();
}
function makeLeaf(len, wid, seed, col) { return { path: pathFrom(lobe(len, wid, seed, { a: 0.9, tip: 0.9 })), seed, col }; }
function drawStem(g, x0, y0, x1, y1, o) {
  const grow = o.grow ?? 1;
  if (grow <= 0) return;
  const N = 22, bend = o.bend ?? 26;
  const full = quadPts([x0, y0], [(x0 + x1) / 2 + bend, (y0 + y1) / 2], [x1, y1], N);
  const cnt = Math.max(1, Math.round(N * grow));
  paper(g, pathFrom(strip(full.slice(0, cnt + 1), o.w, o.w * 0.75, o.seed, { cap: true })), { color: o.col || PAL.sageD, z: 2, seed: o.seed });
  if (o.leaves) for (const L of o.leaves) {
    const lg = clamp((grow - L.t) * 4);
    if (lg <= 0) continue;
    const i = Math.round(L.t * N), a = full[Math.max(0, i - 1)], b = full[Math.min(N, i + 1)];
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const wig = 0.05 * noise1(L.leaf.seed, q12(FR.s) * 2.5);
    g.save(); g.translate(full[i][0], full[i][1]); g.rotate(ang + Math.PI / 2 + L.side * 0.95 + wig);
    const e = E.outBack(lg, 1.4); g.scale(e, e);
    paper(g, L.leaf.path, { color: L.leaf.col || C.sage, z: 2.5, seed: L.leaf.seed, shade: creaseShade });
    g.restore();
  }
}

/* ---------------- LANDSCAPE ---------------- */
function hillY(ph, x, base, amp, f1, f2) { return base + amp * Math.sin(x * f1 + ph) + amp * 0.45 * Math.sin(x * f2 + ph * 1.7); }
function hillPts(ph, x0, x1, base, amp, f1, f2, bottom) {
  const pts = [];
  for (let x = x0; x <= x1; x += 9) pts.push([x, hillY(ph, x, base, amp, f1, f2) + 1.3 * noise1(Math.round(ph * 100), x * 0.09)]);
  pts.push([x1, bottom], [x0, bottom]);
  return pts;
}
function makeTuft(seed, h) {
  const R = rng(seed), blades = [], n = 4 + Math.floor(R() * 3);
  for (let i = 0; i < n; i++) {
    const bx = (i - (n - 1) / 2) * 9 + (R() - 0.5) * 6, hh = h * (0.6 + R() * 0.5), lean = bx * 0.9 + (R() - 0.5) * 18;
    blades.push({ path: pathFrom(strip(quadPts([bx, 8], [bx + lean * 0.3, -hh * 0.55], [bx + lean, -hh], 10), 11, 0.8, seed + i)), col: R() < 0.5 ? C.sage : PAL.sageDD, seed: seed + i });
  }
  return blades;
}
function cloudPts(seed, w, h) {
  const R = rng(seed), circ = [], n = 4 + Math.floor(R() * 2);
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), r = h * (0.36 + 0.34 * Math.sin(Math.PI * t)) * (0.85 + 0.3 * R());
    circ.push([(t - 0.5) * w * 0.74, -r * 0.55, r]);
  }
  const cy0 = -h * 0.22, pts = [], N = 130;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2, dx = Math.cos(a), dy = Math.sin(a);
    let best = 0;
    for (const [cx, cy, r] of circ) {
      const ox = -cx, oy = cy0 - cy, b = ox * dx + oy * dy, c2 = ox * ox + oy * oy - r * r, disc = b * b - c2;
      if (disc >= 0) best = Math.max(best, -b + Math.sqrt(disc));
    }
    pts.push([dx * best, Math.min(0, cy0 + dy * best)]);
  }
  return jitterPts(pts, seed, 0.7);
}

/* ---------------- HIVE (origin: bottom centre on the ground) ---------------- */
const HIVE = (() => {
  const s = 5100, P = {};
  P.legL = pathFrom(rrect(-150, -68, 24, 72, 4, s + 1));
  P.legR = pathFrom(rrect(126, -68, 24, 72, 4, s + 2));
  P.board = pathFrom(rrect(-192, -86, 384, 22, 6, s + 3));
  P.low = pathFrom(rrect(-170, -274, 340, 194, 8, s + 4));
  P.lowHand = pathFrom(rrect(-58, -208, 116, 26, 13, s + 5));
  P.slot = pathFrom(rrect(-88, -106, 176, 22, 8, s + 6));
  P.up = pathFrom(rrect(-170, -446, 340, 176, 8, s + 7));
  P.upHand = pathFrom(rrect(-58, -392, 116, 26, 13, s + 8));
  P.roofB = pathFrom(polyPts([[-210, -432], [0, -566], [210, -432], [210, -420], [-210, -420]], s + 9, { sp: 8 }));
  P.roof = pathFrom(polyPts([[-196, -440], [0, -552], [196, -440], [196, -432], [-196, -432]], s + 10, { sp: 8 }));
  P.emb = pathFrom(hexPts(112, -316, 24, s + 11));
  P.embI = pathFrom(hexPts(112, -316, 13, s + 12));
  P.plank1 = pathFrom(strip([[-150, -150], [150, -150]], 4, 4, s + 13));
  P.plank2 = pathFrom(strip([[-150, -330], [60, -330]], 4, 4, s + 14));
  return P;
})();
function drawHive(g, o) {
  const s = FR.s, t0 = o.t0;
  g.save(); g.translate(o.x, o.y); g.scale(o.s, o.s);
  const put = (dt, path, col, z, sd, extra) => {
    const k = P(s, t0 + dt, t0 + dt + 0.5);
    if (k <= 0) return;
    const e = spring(k, 1.1, 6), a = clamp(k * 5);
    g.save(); g.translate(0, (1 - e) * -90); g.globalAlpha *= a;
    paper(g, path, { color: col, z: z + (1 - Math.min(1, e)) * 14, seed: sd });
    if (extra) extra();
    g.restore();
  };
  const wood = mixc(C.mustard, C.card, 0.35), woodD = darken(C.terra, 0.42);
  put(0.0, HIVE.legL, woodD, 2, 1);
  put(0.0, HIVE.legR, woodD, 2, 2);
  put(0.06, HIVE.low, C.blue, 4, 3, () => {
    paper(g, HIVE.plank1, { color: PAL.blueD, z: 0.5, seed: 4, edge: false, tex: 0.3, alpha: 0.55 });
    paper(g, HIVE.lowHand, { color: PAL.blueD, z: 0, seed: 5, ew: 1.4 });
    paper(g, HIVE.slot, { color: C.char, z: 0, seed: 6, ew: 1.4 });
  });
  put(0.02, HIVE.board, wood, 3, 7);
  put(0.2, HIVE.up, C.mustard, 4, 8, () => {
    paper(g, HIVE.plank2, { color: PAL.mustD, z: 0.5, seed: 9, edge: false, tex: 0.3, alpha: 0.5 });
    paper(g, HIVE.upHand, { color: PAL.mustD, z: 0, seed: 10, ew: 1.4 });
  });
  put(0.36, HIVE.roofB, PAL.terraD, 5, 11);
  put(0.4, HIVE.roof, C.terra, 3, 12);
  put(0.55, HIVE.emb, C.card, 2, 13, () => paper(g, HIVE.embI, { color: C.mustard, z: 1, seed: 14 }));
  g.restore();
}

/* ---------------- HONEYCOMB (world B) ---------------- */
const COMB = (() => {
  const R0 = 92, HW = Math.sqrt(3) * R0, VS = 1.5 * R0, RH = R0 - 9.5, cells = [];
  for (let r = -12; r <= 12; r++) {
    for (let c = -6; c <= 7; c++) {
      const x = 540 + c * HW + (r & 1 ? HW / 2 : 0), y = 1000 + r * VS;
      const q = c - (r - (r & 1)) / 2, d = (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
      const seed = 6000 + (r + 20) * 50 + (c + 20);
      const filled = d <= 5.2 + (h01(seed, 1) - 0.5) * 3.2 && !(d > 1 && h01(seed, 2) < 0.06);
      cells.push({
        r, c, x, y, d, seed, filled,
        hole: pathFrom(hexPts(x, y, RH, seed, { jit: 0.7 })),
        deep: pathFrom(hexPts(x + 4, y + 6, RH * 0.6, seed + 1, { jit: 0.5 })),
        cap: pathFrom(hexPts(x, y, RH + 5, seed + 2, { jit: 0.6 })),
      });
    }
  }
  return { R0, HW, VS, RH, cells };
})();

/* ---------------- HONEY JAR (world C) ---------------- */
const JAR = (() => {
  const s = 7100, P = {};
  P.body = pathFrom(rrect(320, 900, 440, 560, 84, s + 1, { sp: 8 }));
  P.inner = pathFrom(rrect(340, 920, 400, 520, 70, s + 2, { sp: 8 }));
  P.neck = pathFrom(rrect(374, 852, 332, 70, 18, s + 3));
  P.lid = pathFrom(rrect(354, 808, 372, 62, 14, s + 4));
  const cl = quadPts([366, 812], [540, 700], [714, 812], 18);
  const sc = [], n = 9, xr = 744, xl = 336, wS = (xr - xl) / n;
  for (let k = 0; k < n; k++) {
    const cx = xr - (k + 0.5) * wS;
    for (let j = 0; j <= 8; j++) { const a = (j / 8) * Math.PI; sc.push([cx + Math.cos(a) * wS * 0.5, 884 + Math.sin(a) * 15]); }
  }
  P.cloth = pathFrom(jitterPts(cl.concat([[744, 884]], sc, [[336, 884]]), s + 5, 0.6));
  P.dots = [];
  for (let iy = 0; iy < 4; iy++) for (let ix = 0; ix < 8; ix++) {
    const x = 380 + ix * 46 + (iy & 1) * 23, y = 790 + iy * 26;
    P.dots.push(pathFrom(blob(x, y, 6, 6, s + 20 + iy * 9 + ix, { jit: 0.3, n: 14 })));
  }
  P.twine = pathFrom(strip(quadPts([344, 858], [540, 874], [736, 858], 14), 10, 10, s + 6));
  P.knot = pathFrom(blob(560, 870, 14, 11, s + 7));
  P.label = pathFrom(rrect(388, 1090, 304, 210, 28, s + 8));
  P.labelIn = pathFrom(rrect(404, 1106, 272, 178, 20, s + 9));
  P.hl1 = pathFrom(strip(quadPts([364, 1000], [352, 1170], [366, 1350], 12), 22, 14, s + 10, { cap: true }));
  P.hl2 = pathFrom(strip(quadPts([396, 948], [392, 985], [394, 1020], 6), 10, 8, s + 11, { cap: true }));
  P.hexes = [[488, 1248], [540, 1248], [592, 1248]].map(([x, y], i) => pathFrom(hexPts(x, y, 15, s + 30 + i)));
  return P;
})();
