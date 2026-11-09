'use strict';
/* ==========================================================================
   STORY — "Arılar nasıl bal yapar?"   (story clock s = t / TS)
   World A  meadow → flight → hive (one continuous camera)
   ⟶ paper-lens iris ⟶ World B  inside the comb (deposit, fanning, capping)
   ⟶ honey-drip sheet ⟶ World C  the jar · thank you · love nature
   ========================================================================== */

const T = {
  beeIn: 0.7, beeLand: 2.05, titleOut: 2.25,
  prob: 2.7, lens: 3.45, lensOut: 4.85,
  takeoff: 5.1, pan0: 5.15, pan1: 7.45, hive: 6.05, land2: 7.55, turn: 7.75,
  push0: 7.6, push1: 8.45, hand: 8.45,
  iris0: 9.3, iris1: 10.3,
  fill0: 11.05, count0: 11.6,
  fan0: 13.45, evap0: 14.0, evap1: 18.2, badge: 18.35,
  cap0: 19.5,
  wipe0: 21.25, wipe1: 22.65, cut: 21.95,
  jar0: 21.95, flowersC: 22.3, thanks: 22.3, beeC0: 22.55, beeC1: 23.55, sub: 23.25, heart: 24.0,
};
const STEPS = [
  { n: 1, txt: 'Nektar toplar', tin: 2.55, tout: 5.3 },
  { n: 2, txt: 'Kovana taşır', tin: 5.47, tout: 10.2 },
  { n: 3, txt: 'Peteğe koyar', tin: 10.37, tout: 13.15 },
  { n: 4, txt: 'Kanatla kurutur', tin: 13.32, tout: 19.15 },
  { n: 5, txt: 'Mumla kapatır', tin: 19.32, tout: 99 },
];

/* ---------- shared HUD pieces ---------- */
const CARDS = new Map();
function cardPath(w, h, seed, r = 24) {
  const k = `${w}|${h}|${seed}|${r}`;
  let p = CARDS.get(k);
  if (!p) { p = pathFrom(rrect(0, 0, w, h, r, seed)); CARDS.set(k, p); }
  return p;
}
const DISC = pathFrom(blob(0, 0, 50, 50, 9600));
const DOT = pathFrom(blob(0, 0, 9, 9, 9601, { jit: 0.3, n: 18 }));
const NUMD = pathFrom(blob(0, 0, 32, 32, 9602, { jit: 0.4 }));
const PHEX = Array.from({ length: 5 }, (_, i) => ({ o: pathFrom(hexPts(0, 0, 22, 9700 + i)), i: pathFrom(hexPts(0, 0, 14.5, 9710 + i, { jit: 0.4 })) }));
const DROPP = pathFrom(rotPts(lobe(46, 36, 9300, { a: 1.8, tip: 0.5 }), 0, 0, Math.PI));
const DROPH = pathFrom(blob(-6, 26, 5, 7, 9301, { jit: 0, n: 12 }));
const BADGE = { o: pathFrom(blob(0, 0, 150, 150, 9960, { bumps: [24, 0.07], wob: 0.01 })), i: pathFrom(blob(0, 0, 116, 116, 9961, { wob: 0.01 })) };
const HEART = pathFrom(jitterPts(Array.from({ length: 60 }, (_, i) => {
  const t = (i / 60) * Math.PI * 2;
  return [16 * Math.pow(Math.sin(t), 3) * 2.4, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 2.4];
}), 9970, 0.5));
function qp(p0, p1, p2, t) { const u = 1 - t; return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]; }
function pathState(pts, s, a, b, ease) {
  const f = x => catmull(pts, ease(P(x, a, b)));
  const p = f(s), e = 0.015, p0 = f(s - e), p1 = f(s + e);
  return { p, v: [(p1[0] - p0[0]) / (2 * e), (p1[1] - p0[1]) / (2 * e)] };
}
function lineStrip(x0, y0, x1, y1, w, seed) {
  if (Math.hypot(x1 - x0, y1 - y0) < 1) return null;
  return pathFrom(strip([[x0, y0], [lerp(x0, x1, 0.5), lerp(y0, y1, 0.5)], [x1, y1]], w, w, seed));
}

/* ==========================================================================
   WORLD A — meadow, flight, hive
   ========================================================================== */
const A = {};
const BS1 = 1.45, BS2 = 1.1;                         // bee scale on the flower / at the hive
let PTS1, PTS2;
function plantDef(kind, seed, x, y, s, bx, w, bend, t0, leafSide) {
  return {
    F: makeFlower(kind, seed), x, y, s, bx, w, bend, t0,
    leaves: leafSide ? [{ t: 0.45, side: leafSide, leaf: makeLeaf(64 * s, 28 * s, seed + 40, C.sage) }] : [],
  };
}
function buildA() {
  A.sun = { x: 852, y: 662, disc: pathFrom(blob(0, 0, 96, 96, 9001)), inner: pathFrom(blob(-6, -7, 68, 68, 9002)), rays: [] };
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    A.sun.rays.push(pathFrom(strip([[Math.cos(a) * 120, Math.sin(a) * 120], [Math.cos(a) * 152, Math.sin(a) * 152]], 17, 10, 9010 + i, { cap: true, cap0: true })));
  }
  A.clouds = [
    { x: 215, y: 640, path: pathFrom(cloudPts(9100, 300, 120)), t: 0.2, from: -520 },
    { x: 1340, y: 560, path: pathFrom(cloudPts(9101, 360, 140)), t: 0, from: 0 },
    { x: 2120, y: 730, path: pathFrom(cloudPts(9102, 280, 110)), t: 0, from: 0 },
  ];
  A.hills = [
    { par: 0.62, col: PAL.sageL, path: pathFrom(hillPts(1.3, -900, 3400, 1500, 40, 0.0031, 0.0071, 2900)), z: 4, t: -0.16, seed: 21 },
    { par: 0.82, col: C.sage, path: pathFrom(hillPts(4.1, -900, 3400, 1612, 34, 0.0042, 0.0093, 2900)), z: 5, t: -0.08, seed: 22 },
  ];
  A.gy = x => hillY(7.7, x, 1712, 22, 0.0052, 0.011);
  A.ground = pathFrom(hillPts(7.7, -500, 3100, 1712, 22, 0.0052, 0.011, 2800));
  A.tufts = [];
  for (let i = 0; i < 28; i++) {
    const x = -120 + i * 112 + (h01(31, i) - 0.5) * 60;
    A.tufts.push({ x, y: A.gy(x) + 6, blades: makeTuft(9200 + i, 44 + h01(32, i) * 28) });
  }
  A.hero = plantDef('hero', 300, 470, 1120, 1.15, 488, 21, 34, 0.5, 0);
  A.hero.leaves = [{ t: 0.3, side: 1, leaf: makeLeaf(124, 54, 320, C.sage) }, { t: 0.52, side: -1, leaf: makeLeaf(104, 46, 321, PAL.sageL) }];
  A.flowers = [
    plantDef('daisy', 310, 150, 1432, 1.0, 168, 12, -22, 0.55, 1),
    plantDef('daisy', 311, 905, 1398, 0.9, 884, 11, 24, 0.7, -1),
    plantDef('corn', 312, 722, 1522, 0.95, 736, 10, 14, 0.85, 1),
    plantDef('poppy', 313, 302, 1556, 0.9, 292, 11, -12, 0.95, 0),
    plantDef('mini', 314, 1130, 1500, 1.0, 1140, 10, 12, 0.6, 1),
    plantDef('daisy', 315, 1300, 1420, 1.05, 1290, 12, -16, 0.6, -1),
    plantDef('corn', 316, 1480, 1545, 0.9, 1490, 10, 10, 0.6, 0),
    plantDef('poppy', 317, 2190, 1560, 0.85, 2200, 10, 10, 0.6, 1),
    plantDef('daisy', 318, 2330, 1470, 0.9, 2318, 11, -12, 0.6, 0),
  ];
  A.hive = { x: 1830, y: A.gy(1830) + 4, s: 1.25 };
  A.landY = A.hive.y - 86 * A.hive.s - 62 * BS2 + 2;  // thorax height of a bee standing on the landing board
  A.fx = 1722; A.hx = 1938;                            // forager / house bee on the board
  A.handX = (A.fx + A.hx) / 2; A.handY = A.landY + (30 + Math.sin(0.62) * 27.7) * BS2;
  // where the forager stands on the hero flower: proboscis tip just inside the flower's centre
  const pb = [56 * BS1 + Math.cos(1.95) * 66 * BS1, 30 * BS1 + Math.sin(1.95) * 66 * BS1];
  A.perch = [A.hero.x - pb[0], A.hero.y + 22 - pb[1]];
  A.fore = [1588, 1640, 2068, 2112].map((x, i) => ({ x, y: A.gy(x) + 8, blades: makeTuft(9300 + i, 40 + i * 6) }));
  const [qx, qy] = A.perch;
  PTS1 = [[1320, 640], [940, 600], [660, 740], [400, 760], [236, 846], [272, 962], [qx - 30, qy - 26], [qx, qy]];
  PTS2 = [[qx, qy], [qx + 50, qy - 120], [700, 800], [1080, 820], [1420, 1000], [1640, 1290], [A.fx, A.landY - 70], [A.fx, A.landY]];
}
function camA(s) {
  let x = 540, y = 960, z = 1, k;
  k = E.ioS(P(s, 2.0, 5.1)); x = lerp(x, 525, k); y = lerp(y, 990, k); z = lerp(z, 1.06, k);
  k = E.ioC(P(s, T.pan0, T.pan1)); x = lerp(x, 1800, k); y = lerp(y, 1250, k); z = lerp(z, 1.0, k);
  k = E.ioC(P(s, T.push0, T.push1)); x = lerp(x, A.handX, k); y = lerp(y, A.handY - 28, k); z = lerp(z, 1.7, k);
  k = E.inQ(P(s, T.iris0, T.iris1)); y = lerp(y, A.handY, k); z *= 1 + 0.4 * k;
  return { x, y, z };
}
function heroSway(s) {                                  // the hero flower and its visitor move together
  const quiet = P(s, 1.7, 2.1) * (1 - P(s, 5.05, 5.4));
  return 0.028 * (1 - quiet * 0.85) * Math.sin(s * 1.25 + 6.1) + 0.006 * noise1(300, q12(s) * 3);
}
function dipA(s) { return 10 * bump(P(s, T.beeLand - 0.05, T.beeLand + 0.5)) - 6 * bump(P(s, T.takeoff - 0.05, T.takeoff + 0.35)); }
function heroHead(s) {
  const f = A.hero, by = A.gy(f.bx) + 18, sw = heroSway(s), dx = f.x - f.bx, dy = f.y - by;
  return [f.bx + dx * Math.cos(sw) - dy * Math.sin(sw), by + dx * Math.sin(sw) + dy * Math.cos(sw) + dipA(s), sw];
}
function plant(f, s, gy, hero) {
  const grow = E.outC(P(s, f.t0 - 0.35, f.t0 + 0.2));
  if (grow <= 0) return;
  const by = gy(f.bx) + 18;
  let hx, hy, sw;
  if (hero) [hx, hy, sw] = heroHead(s);
  else {
    sw = 0.028 * Math.sin(s * 1.25 + f.x * 0.013) + 0.007 * noise1(f.F.seed, q12(s) * 3);
    const dx = f.x - f.bx, dy = f.y - by;
    hx = f.bx + dx * Math.cos(sw) - dy * Math.sin(sw); hy = by + dx * Math.sin(sw) + dy * Math.cos(sw);
  }
  drawStem(ctx, f.bx, by, hx, hy + 8, { w: f.w, grow, seed: f.F.seed + 1, bend: f.bend, leaves: f.leaves });
  if (grow > 0.97) {
    const nectar = hero ? (0.75 + 0.25 * Math.sin(s * 9)) * P(s, 2.45, 2.75) * (1 - P(s, 4.6, 5.0)) : 0;
    drawFlower(ctx, f.F, { x: hx, y: hy, s: f.s, open: P(s, f.t0 + 0.2, f.t0 + 0.9), rot: sw, nectar });
  }
}
function tuft(t) {
  const sw = 0.04 * noise1(t.blades[0].seed, q12(FR.s) * 2);
  ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(sw);
  for (const b of t.blades) paper(ctx, b.path, { color: b.col, z: 1.5, seed: b.seed, ew: 1.2 });
  ctx.restore();
}
function forager(s) {
  if (s < T.beeIn) return null;
  const o = { s: BS1, seed: 0, wings: 'fly', tuck: 1, alt: 70, face: 1, rot: 0, prob: 0, pollen: 0 };
  if (s < T.beeLand) {
    const st = pathState(PTS1, s, T.beeIn, T.beeLand, E.outC), land = P(s, 1.8, T.beeLand);
    o.x = st.p[0]; o.y = st.p[1] + Math.sin(s * 14) * 6 * (1 - land);
    o.face = lerp(clamp(st.v[0] / 70, -1, 1), 1, E.ioS(P(s, 1.8, 2.0)));
    o.rot = clamp(st.v[1] / 3200, -0.22, 0.22) * Math.sign(o.face);
    o.tuck = 1 - land; o.alt = 70 * (1 - land);
  } else if (s < T.takeoff) {
    const [hx, hy] = heroHead(s);
    o.x = A.perch[0] + (hx - A.hero.x); o.y = A.perch[1] + (hy - A.hero.y);
    const lk = P(s, T.beeLand, T.beeLand + 0.35);
    o.sqy = 1 - 0.08 * bump(lk); o.sqx = 1 + 0.05 * bump(lk);
    o.wings = 'rest'; o.tuck = 0; o.alt = 0;
    o.prob = E.outC(P(s, T.prob, T.prob + 0.3)) * (1 - E.inC(P(s, 4.9, 5.08)));
    o.probAng = 1.95;
    o.pollen = E.outBack(P(s, 3.6, 4.4), 1.5);
    o.rot = heroHead(s)[2] * 0.6 + (o.prob > 0.5 ? 0.022 * Math.sin(q12(s) * 11) : 0);
  } else if (s < T.land2) {
    const st = pathState(PTS2, s, T.takeoff, T.land2, E.ioC);
    const tk = P(s, T.takeoff, T.takeoff + 0.25), land = P(s, T.land2 - 0.25, T.land2), air = Math.min(tk, 1 - land);
    o.x = st.p[0]; o.y = st.p[1] + Math.sin(s * 14) * 6 * air;
    o.rot = clamp(st.v[1] / 3200, -0.22, 0.22) * air;
    o.s = lerp(BS1, BS2, E.ioS(P(s, 5.3, 7.35)));
    o.tuck = air; o.alt = 70 * air; o.pollen = 1;
  } else {
    [o.x, o.y] = PTS2[7];
    const lk = P(s, T.land2, T.land2 + 0.35);
    o.sqy = 1 - 0.08 * bump(lk); o.sqx = 1 + 0.05 * bump(lk);
    o.s = BS2; o.wings = 'rest'; o.tuck = 0; o.alt = 0; o.pollen = 1;
    o.prob = 0.42 * E.outC(P(s, T.hand - 0.05, T.hand + 0.12)) * (1 - P(s, 9.0, 9.15));
    o.probAng = 0.62;
  }
  return o;
}
function houseBee(s) {
  const k = P(s, T.hive + 0.72, T.hive + 1.02);
  if (k <= 0) return null;
  const e = E.outBack(k, 2.2);
  return {
    x: A.hx, y: A.landY, s: e * BS2, seed: 7, wings: 'rest', tuck: 0, alt: 0, pollen: 0,
    face: lerp(1, -1, E.ioS(P(s, T.turn, T.turn + 0.24))),
    prob: 0.42 * E.outC(P(s, T.hand - 0.05, T.hand + 0.12)) * (1 - P(s, 9.0, 9.15)), probAng: 0.62,
  };
}
function trail(pts, s, a, b, ease, fadeAt) {
  if (s < a) return;
  const fade = 1 - P(s, fadeAt, fadeAt + 0.45);
  if (fade <= 0) return;
  const u1 = ease(P(s, a, b)), u0 = ease(P(s - 1.0, a, b)), step = 0.011;
  for (let k = Math.ceil(u0 / step); k <= Math.floor(u1 / step) - 3; k++) {
    if (k & 1) continue;
    const u = k * step, p = catmull(pts, u), q = catmull(pts, u + step * 0.85);
    const al = (1 - (u1 - u) / Math.max(0.001, u1 - u0)) * fade;
    const path = lineStrip(p[0], p[1], q[0], q[1], 6, 9500 + k);
    if (al > 0.03 && path) paper(ctx, path, { color: C.char, z: 1.2, alpha: al * 0.5, edge: false, tex: 0 });
  }
}
function nectarDrops(s) {                              // flower → proboscis → bee
  if (s < 2.9 || s > 5) return;
  const f = forager(s), sc = f.s;
  const p0 = [f.x + 56 * sc, f.y + 30 * sc], p1 = [p0[0] + Math.cos(1.95) * 66 * sc * f.prob, p0[1] + Math.sin(1.95) * 66 * sc * f.prob];
  for (let i = 0; i < 3; i++) {
    const k = P(s, 2.95 + i * 0.45, 3.37 + i * 0.45);
    if (k <= 0 || k >= 1) continue;
    const x = lerp(p1[0], p0[0], E.ioS(k)), y = lerp(p1[1], p0[1], E.ioS(k)), r = 7.5 * bump(clamp(k * 1.2));
    paper(ctx, pathFrom(blob(x, y, r, r, 9400 + i, { jit: 0.2, n: 16 })), { color: '#FFE9A8', z: 1, seed: 3 });
  }
}
function handDrop(s) {                                 // forager → house bee
  const k = P(s, 8.55, 8.9);
  if (k > 0 && k < 1) {
    const reach = (56 + Math.cos(0.62) * 27.7) * BS2, x0 = A.fx + reach, x1 = A.hx - reach, y = A.handY;
    const e = E.ioS(k), x = lerp(x0, x1, e), yy = y - 22 * bump(e), r = 10;
    paper(ctx, pathFrom(blob(x, yy, r, r * 1.08, 9410, { jit: 0.2, n: 18 })), { color: '#FFE9A8', z: 2, seed: 4 });
  }
  const sk = P(s, 8.85, 9.25);
  if (sk > 0 && sk < 1) {
    for (let i = 0; i < 4; i++) {
      const a = -0.6 + i * 0.45, d = 30 + 40 * E.outC(sk), sz = 9 * bump(sk);
      const x = A.handX + 34 + Math.cos(a - 1.2) * d, y = A.handY - 26 + Math.sin(a - 1.2) * d;
      ctx.save(); ctx.translate(x, y); ctx.rotate(0.785); ctx.scale(sz / 9, sz / 9);
      paper(ctx, SPARK, { color: C.mustard, z: 1.5, seed: 9 + i });
      ctx.restore();
    }
  }
}
const SPARK = pathFrom(polyPts([[0, -12], [3, -3], [12, 0], [3, 3], [0, 12], [-3, 3], [-12, 0], [-3, -3]], 9420, { sp: 3, jit: 0.2 }));
function drawWorldA(s) {
  const cam = camA(s);
  ctx.save(); camApply(ctx, cam, 0.12); ctx.drawImage(BGCV, 540 - BGCV.width / 2, 960 - BGCV.height / 2); ctx.restore();
  // sun (far layer, pops up, rays turn on the stop-motion clock)
  const sk = spring(P(s, 0.12, 0.77));
  if (sk > 0) {
    ctx.save(); camApply(ctx, cam, 0.3); ctx.translate(A.sun.x, A.sun.y + (1 - Math.min(1, sk)) * 140); ctx.scale(sk, sk);
    ctx.save(); ctx.rotate(q12(s) * 0.12);
    for (let i = 0; i < 12; i++) paper(ctx, A.sun.rays[i], { color: PAL.mustD, z: 2, seed: 30 + i, ew: 1.4 });
    ctx.restore();
    paper(ctx, A.sun.disc, { color: C.mustard, z: 3.5, seed: 31 });
    paper(ctx, A.sun.inner, { color: lighten(C.mustard, 0.3), z: 1.5, seed: 32 });
    ctx.restore();
  }
  ctx.save(); camApply(ctx, cam, 0.45);
  for (const c of A.clouds) {
    const k = c.from ? E.outC(P(s, c.t, c.t + 0.9)) : 1;
    ctx.save(); ctx.translate(c.x + (1 - k) * c.from + Math.sin(s * 0.45 + c.x) * 12, c.y);
    paper(ctx, c.path, { color: C.card, z: 9, seed: c.x | 0, sa: 0.22 });
    ctx.restore();
  }
  ctx.restore();
  for (const h of A.hills) {
    const k = spring(P(s, h.t, h.t + 0.7));
    ctx.save(); camApply(ctx, cam, h.par); ctx.translate(0, (1 - k) * 600);
    paper(ctx, h.path, { color: h.col, z: h.z, seed: h.seed });
    ctx.restore();
  }
  ctx.save(); camApply(ctx, cam, 1);
  const vx0 = cam.x - 540 / cam.z - 260, vx1 = cam.x + 540 / cam.z + 260;
  const gk = spring(P(s, 0.0, 0.7));
  ctx.save(); ctx.translate(0, (1 - gk) * 600);
  for (const f of A.flowers) if (f.x > vx0 && f.x < vx1) plant(f, s, A.gy, false);
  if (A.hero.x > vx0 && A.hero.x < vx1) plant(A.hero, s, A.gy, true);
  paper(ctx, A.ground, { color: PAL.sageD, z: 6, seed: 77 });
  for (const t of A.tufts) if (t.x > vx0 && t.x < vx1) tuft(t);
  ctx.restore();
  if (s > T.hive - 0.1 && vx1 > A.hive.x - 300) {
    drawHive(ctx, { x: A.hive.x, y: A.hive.y, s: A.hive.s, t0: T.hive });
    for (const t of A.fore) tuft(t);
  }
  trail(PTS1, s, T.beeIn, T.beeLand, E.outC, 2.0);
  trail(PTS2, s, T.takeoff, T.land2, E.ioC, 7.35);
  const hb = houseBee(s); if (hb) drawBee(ctx, hb);
  const fb = forager(s); if (fb) drawBee(ctx, fb);
  nectarDrops(s);
  handDrop(s);
  ctx.restore();
}

/* ---------- paper-lens iris: A → B ---------- */
function drawIris(s) {
  const k = E.ioC(P(s, T.iris0, T.iris1)), cam = camA(s);
  const [x0, y0] = toScreen(cam, A.handX, A.handY);
  const cx = lerp(x0, 540, k), cy = lerp(y0, 960, k), r = lerp(30, 1190, k), zB = lerp(0.62, 1.0, k);
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
  drawWorldBContent(s, { x: 540 - (cx - 540) / zB, y: 1000 - (cy - 960) / zB, z: zB });
  ctx.restore();
  const ring = new Path2D();
  addPts(ring, blob(cx, cy, r + 32, r + 32, 9950, { wob: 0.004, n: 260 }));
  addPts(ring, blob(cx, cy, r, r, 9951, { wob: 0.004, n: 260 }));
  paper(ctx, ring, { color: C.card, z: 10, rule: 'evenodd', seed: 50 });
  const rim = new Path2D();
  addPts(rim, blob(cx, cy, r + 2, r + 2, 9952, { wob: 0.004, n: 240 }));
  addPts(rim, blob(cx, cy, r - 7, r - 7, 9953, { wob: 0.004, n: 240 }));
  paper(ctx, rim, { color: C.char, z: 1.5, rule: 'evenodd', seed: 51 });
}

/* ==========================================================================
   WORLD B — inside the comb
   ========================================================================== */
let DROPS = [], FOCUS = null;
function buildB() {
  FOCUS = COMB.cells.find(c => c.d === 0 && c.r === 0);
  const R = rng(4242);
  const cand = COMB.cells.filter(c => c.filled && c.x > 160 && c.x < 960 && c.y > 760 && c.y < 1640 && c.d > 0);
  for (let i = 0; i < 30; i++) {
    const c = cand[Math.floor(R() * cand.length)];
    DROPS.push({ c, t0: 14.0 + (i / 30) * 3.9 + R() * 0.15, dur: 1.15 + R() * 0.4, dx: 70 + R() * 120, rise: 210 + R() * 150, sz: 1.1 + R() * 0.35, sd: i });
  }
}
function camB(s) {
  let x = 540, y = 1000, z = 1, k;
  k = E.ioC(P(s, 13.25, 14.1)); x = lerp(x, 560, k); y = lerp(y, 1040, k); z = lerp(z, 1.08, k);
  k = E.ioC(P(s, 19.1, 19.8)); x = lerp(x, 540, k); y = lerp(y, 1000, k); z = lerp(z, 1.0, k);
  return { x, y, z };
}
function cellState(c, s) {
  if (!c.filled) return { level: 0, evap: 0 };
  const fs = c.d === 0 ? T.fill0 : 12.0 + c.d * 0.17 + h01(c.seed, 5) * 0.25;
  const ev = E.ioS(P(s, T.evap0 + h01(c.seed, 6) * 0.5, T.evap1 - 0.3 + h01(c.seed, 7) * 0.3));
  return { level: 0.82 * E.outC(P(s, fs, fs + (c.d === 0 ? 0.55 : 0.45))) * (1 - 0.14 * ev), evap: ev };
}
function capStart(c) { return T.cap0 + clamp(((c.x - 60) / 960) * 0.45 + ((c.y - 380) / 1500) * 1.05) * 1.3 + h01(c.seed, 8) * 0.12; }
function drawComb(s, cb) {
  const hw = W / 2 / cb.z, hh = H / 2 / cb.z;
  const x0 = cb.x - hw - 60, x1 = cb.x + hw + 60, y0 = cb.y - hh - 60, y1 = cb.y + hh + 60;
  ctx.fillStyle = PAL.cellBack; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  const vis = COMB.cells.filter(c => c.x > x0 - 100 && c.x < x1 + 100 && c.y > y0 - 100 && c.y < y1 + 100);
  const RH = COMB.RH;
  for (const c of vis) {
    const st = cellState(c, s);
    if (st.level < 0.002) { paper(ctx, c.deep, { color: PAL.cellDeep, z: 0, edge: false, tex: 0.5, seed: c.seed }); continue; }
    const top = c.y + RH - 2 * RH * st.level, amp = 3.4 * (1 - st.evap * 0.75), ph = s * 2.3 + c.seed * 0.7, pts = [];
    for (let i = 0; i <= 12; i++) { const x = c.x - RH - 4 + ((2 * RH + 8) * i) / 12; pts.push([x, top + amp * Math.sin(i * 0.9 + ph)]); }
    pts.push([c.x + RH + 4, c.y + RH + 6], [c.x - RH - 4, c.y + RH + 6]);
    const col = mixc(PAL.nectar, PAL.honey, st.evap);
    ctx.save(); ctx.clip(c.hole);
    paper(ctx, c.deep, { color: darken(PAL.cellDeep, 0.1), z: 0, edge: false, tex: 0.4, seed: c.seed });
    paper(ctx, pathFrom(pts), { color: col, z: 1.4, seed: c.seed + 5, ew: 2.2, hi: lighten(col, 0.55), lo: darken(col, 0.12), tex: 0.45 });
    ctx.restore();
  }
  const wall = new Path2D();
  wall.rect(x0, y0, x1 - x0, y1 - y0);
  for (const c of vis) wall.addPath(c.hole);
  paper(ctx, wall, { color: PAL.wall, z: 4.5, rule: 'evenodd', seed: 7, ew: 2.3, sa: 0.45 });
  for (const c of vis) {
    if (!c.filled) continue;
    const k = P(s, capStart(c), capStart(c) + 0.32);
    if (k <= 0) continue;
    const e = E.outBack(k, 1.3), sc = lerp(1.3, 1, e), z = lerp(16, 1.8, E.outC(k));
    ctx.save(); ctx.translate(c.x, c.y); ctx.scale(sc, sc); ctx.translate(-c.x, -c.y);
    paper(ctx, c.cap, {
      color: PAL.wax, z, seed: c.seed + 9, alpha: clamp(k * 5), shade: g => {
        const gr = g.createRadialGradient(c.x - RH * 0.32, c.y - RH * 0.36, RH * 0.1, c.x, c.y, RH * 1.1);
        gr.addColorStop(0, 'rgba(255,253,244,0.55)'); gr.addColorStop(0.55, 'rgba(255,253,244,0)'); gr.addColorStop(1, 'rgba(140,92,34,0.22)');
        g.fillStyle = gr; g.fillRect(c.x - RH * 1.3, c.y - RH * 1.3, RH * 2.6, RH * 2.6);
      },
    });
    ctx.restore();
  }
}
function countEdges(s) {                               // "6 kenar": each wall of the cell is counted
  const k0 = P(s, T.count0, T.count0 + 0.1), out = P(s, 12.95, 13.2);
  if (k0 <= 0 || out >= 1) return;
  const RH = COMB.RH - 1, cx = FOCUS.x, cy = FOCUS.y;
  const V = i => { const a = -Math.PI / 2 + (i * Math.PI) / 3; return [cx + Math.cos(a) * RH, cy + Math.sin(a) * RH]; };
  for (let i = 0; i < 6; i++) {
    const k = P(s, T.count0 + i * 0.13, T.count0 + i * 0.13 + 0.17);
    if (k <= 0) continue;
    const a = V(i), b = V(i + 1), e = E.outC(k) * (1 - E.inC(out));
    const path = lineStrip(a[0], a[1], lerp(a[0], b[0], e), lerp(a[1], b[1], e), 11, 9800 + i);
    if (path) paper(ctx, path, { color: C.terra, z: 2.5, seed: 70 + i, ew: 1.2 });
    const ang = -Math.PI / 3 + (i * Math.PI) / 3, d = RH * 0.866 + 58;
    const ne = E.outBack(P(s, T.count0 + i * 0.13 + 0.08, T.count0 + i * 0.13 + 0.38), 2) * (1 - E.inBack(out, 1.2));
    if (ne > 0.01) {
      ctx.save(); ctx.translate(cx + Math.cos(ang) * d, cy + Math.sin(ang) * d); ctx.scale(ne, ne);
      paper(ctx, NUMD, { color: C.card, z: 4, seed: 80 + i });
      drawSprite(ctx, tsprite(String(i + 1), 46, { wt: 700 }), 0, 16, { z: 0.8, ax: 0.5 });
      ctx.restore();
    }
  }
}
function beesB(s) {
  // the forager arrives, pours its nectar into the cell, and leaves
  if (s > T.iris0 && s < 12.0) {
    const o = { s: 1.1, seed: 3, wings: 'fly', tuck: 1, alt: 60, face: 1, rot: 0, prob: 0, pollen: 1 };
    const PB1 = [[-160, 690], [120, 760], [330, 846], [420, 862]], PB2 = [[420, 862], [300, 700], [60, 560], [-260, 520]];
    if (s < 10.75) {
      const st = pathState(PB1, s, 10.1, 10.75, E.outC), land = P(s, 10.55, 10.75);
      o.x = st.p[0]; o.y = st.p[1] + Math.sin(s * 14) * 5 * (1 - land); o.tuck = 1 - land; o.alt = 60 * (1 - land);
      o.rot = clamp(st.v[1] / 3200, -0.2, 0.2);
    } else if (s < 11.35) {
      [o.x, o.y] = PB1[3]; o.wings = 'rest'; o.tuck = 0; o.alt = 0;
      o.prob = 0.5 * E.outC(P(s, 10.78, 10.9)) * (1 - P(s, 11.15, 11.3)); o.probAng = 0.9;
    } else {
      const st = pathState(PB2, s, 11.35, 11.95, E.inC);
      o.x = st.p[0]; o.y = st.p[1]; o.face = -1; o.rot = 0.15; o.tuck = P(s, 11.35, 11.5);
    }
    drawBee(ctx, o);
    const dk = P(s, 10.86, 11.12);                     // the nectar drop falls into the cell
    if (dk > 0 && dk < 1) {
      const p0 = [420 + 1.1 * (56 + Math.cos(0.9) * 33), 862 + 1.1 * (30 + Math.sin(0.9) * 33)], p1 = [FOCUS.x - 6, FOCUS.y + 28];
      const e = E.inQ(dk), x = lerp(p0[0], p1[0], e), y = lerp(p0[1], p1[1], e) - 18 * bump(e);
      ctx.save(); ctx.translate(x, y); ctx.scale(0.42, 0.42);
      paper(ctx, DROPP, { color: PAL.nectar, z: 2, seed: 5 }); paper(ctx, DROPH, { color: '#FFFFFF', z: 0, alpha: 0.8, edge: false, tex: 0 });
      ctx.restore();
    }
  }
  // two fanning bees
  if (s >= T.fan0) {
    const fan = s > T.fan0 + 0.25 && s < 18.55;
    const F = [{ x: 300, y: 830, seed: 11 }, { x: 800, y: 1420, seed: 12 }];
    for (let i = 0; i < 2; i++) {
      const k = P(s, T.fan0 + i * 0.12, T.fan0 + i * 0.12 + 0.35);
      if (k <= 0) continue;
      drawBee(ctx, {
        x: F[i].x, y: F[i].y - 24 * (1 - E.outC(k)), s: 1.05, seed: F[i].seed, face: lerp(-0.07, -1, E.outBack(k, 1.6)),
        wings: fan ? 'fan' : 'rest', tuck: 0, alt: 0, pollen: 0, rot: fan ? 0.015 * Math.sin(q12(s) * 13 + i) : 0,
      });
      if (fan) {                                       // fanning arcs behind the wings
        const fr = FR.frame + i;
        for (let j = 0; j < 2; j++) {
          const a0 = -2.3 + j * 0.35 + (fr % 2) * 0.12, path = pathFrom(strip(Array.from({ length: 8 }, (_, m) => {
            const a = a0 + m * 0.09; return [F[i].x + 30 + Math.cos(a) * (122 + j * 22), F[i].y - 20 + Math.sin(a) * (122 + j * 22)];
          }), 6, 2, 9850 + j));
          paper(ctx, path, { color: C.card, z: 2, alpha: 0.85, seed: 90 + j, edge: false, tex: 0.2 });
        }
      }
    }
  }
}
function windB(s) {                                    // ribbons of moving air across the comb
  if (s < T.fan0 + 0.3 || s > 18.6) return;
  const fade = P(s, T.fan0 + 0.3, T.fan0 + 0.7) * (1 - P(s, 18.2, 18.6));
  const src = [[330, 800], [830, 1390]];
  for (let b = 0; b < 2; b++) for (let k = 0; k < 3; k++) {
    const ph = ((s - T.fan0) * 0.85 + k * 0.33 + b * 0.17) % 1, head = ph * 1.45, tail = head - 0.42;
    const a = Math.max(0, tail), z = Math.min(1, head);
    if (z - a < 0.03) continue;
    const pts = [];
    for (let i = 0; i <= 16; i++) {
      const u = a + ((z - a) * i) / 16, x = src[b][0] + 40 + u * 760;
      pts.push([x, src[b][1] - 60 + k * 34 + 22 * Math.sin(u * 7 + k + b) - u * 90]);
    }
    paper(ctx, pathFrom(strip(pts, 3, 9, 9870 + k + b * 3)), { color: C.card, z: 2.5, alpha: 0.9 * fade, seed: 95 + k, edge: false, tex: 0.25 });
  }
}
function dropsB(s) {                                   // water leaves the nectar
  if (s < T.evap0 || s > 18.6) return;
  for (const d of DROPS) {
    const u = (s - d.t0) / d.dur;
    if (u <= 0 || u >= 1) continue;
    const st = cellState(d.c, s), y0 = d.c.y + COMB.RH - 2 * COMB.RH * st.level;
    const x = d.c.x + d.dx * E.inQ(u) + 10 * Math.sin(u * 7 + d.sd), y = y0 - 20 - d.rise * E.outQ(u);
    const sc = d.sz * (u < 0.15 ? E.outBack(u / 0.15, 1.6) : 1) * (1 - 0.8 * E.inQ(clamp((u - 0.55) / 0.45)));
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.rotate(0.15 * Math.sin(u * 5 + d.sd));
    paper(ctx, DROPP, { color: C.blue, z: 4, alpha: 1 - clamp((u - 0.86) / 0.14), seed: 100 + d.sd });
    paper(ctx, DROPH, { color: C.card, z: 0, alpha: 0.85, edge: false, tex: 0 });
    ctx.restore();
  }
}
function drawWorldBContent(s, cb) {
  ctx.save(); camApply(ctx, cb, 1);
  drawComb(s, cb);
  countEdges(s);
  windB(s);
  beesB(s);
  dropsB(s);
  ctx.restore();
}
function drawWorldB(s) { drawWorldBContent(s, camB(s)); }

/* ==========================================================================
   HUD — title, step cards, progress, call-outs, lens, gauge, badge
   ========================================================================== */
function letterLine(str, size, x, y, t0, s, seed, o = {}) {
  const L = letters(str, size, { wt: 700, col: o.col || C.char });
  for (let i = 0; i < L.list.length; i++) {
    const it = L.list[i];
    if (!it.sp) continue;
    const k = P(s, t0 + i * 0.035, t0 + i * 0.035 + 0.45);
    if (k <= 0) continue;
    const e = spring(k, 1.2, 6.5), lift = 1 - Math.min(1, e);
    ctx.save(); ctx.translate(x + it.x + it.cw / 2, y - size * 0.35 + (1 - e) * -90); ctx.rotate((h01(seed, i) - 0.5) * 0.6 * lift);
    drawSprite(ctx, it.sp, -it.cw / 2, size * 0.35, { z: 2.5 + lift * 8, alpha: clamp(k * 6) });
    ctx.restore();
  }
  return L.width;
}
const BLOB_BAL = pathFrom(blob(0, 0, 118, 66, 9990, { wob: 0.05 }));
function drawTitle(s) {
  if (s > 2.9) return;
  const eo = E.inBack(P(s, T.titleOut, T.titleOut + 0.42), 1.3);
  ctx.save(); ctx.translate(0, eo * -640);
  const kk = E.outC(P(s, -0.2, 0.25));
  if (kk > 0) drawSprite(ctx, tsprite('DOĞAYI SEVELİM', 34, { fam: 'Nunito', wt: 900, col: C.terra, tr: 5 }), 94 - (1 - kk) * 60, 236, { z: 1.2, alpha: kk });
  const bw = measure('bal', 128, 'Baloo 2', 700), bk = spring(P(s, 0.85, 1.3), 1.2, 6);
  if (bk > 0) {
    ctx.save(); ctx.translate(88 + bw / 2 + 4, 470); ctx.rotate(-0.05); ctx.scale(bk * (bw + 56) / 236, bk);
    paper(ctx, BLOB_BAL, { color: C.mustard, z: 2.5, seed: 91 });
    ctx.restore();
  }
  letterLine('Arılar nasıl', 128, 88, 376, 0.05, s, 101);
  letterLine('bal yapar?', 128, 88, 512, 0.4, s, 202);
  ctx.restore();
}
function drawStep(st, s) {
  const pin = P(s, st.tin, st.tin + 0.55), pout = P(s, st.tout, st.tout + 0.34);
  if (pin <= 0 || pout >= 1) return;
  const ei = E.outBack(pin, 1.15), eo = E.inBack(pout, 1.2);
  const sp = tsprite(st.txt, 76, { wt: 600 });
  const w = Math.round(sp.width + 140), h = 126, x = 104, y = 196;
  ctx.save();
  ctx.translate(x + w / 2 + (1 - ei) * -(w + 260), y + h / 2 + eo * -430);
  ctx.rotate((1 - ei) * -0.07 + eo * 0.07);
  ctx.translate(-w / 2, -h / 2);
  paper(ctx, cardPath(w, h, st.n * 17), { color: C.card, z: 6 + eo * 16, seed: st.n * 13 });
  drawSprite(ctx, sp, 96, 90, { z: 1.6 });
  const de = E.outBack(P(s, st.tin + 0.14, st.tin + 0.52), 2.2);
  if (de > 0) {
    ctx.save(); ctx.translate(14, h / 2); ctx.scale(de, de); ctx.rotate((1 - de) * -0.8);
    paper(ctx, DISC, { color: C.terra, z: 4, seed: st.n });
    drawSprite(ctx, tsprite(String(st.n), 64, { wt: 700, col: C.card }), 0, 23, { z: 1, ax: 0.5 });
    ctx.restore();
  }
  ctx.restore();
}
function drawProgress(s) {
  if (s < 2.75) return;
  for (let i = 0; i < 5; i++) {
    const ki = E.outBack(P(s, 2.75 + i * 0.06, 3.15 + i * 0.06), 1.8);
    if (ki <= 0) continue;
    const cur = s >= STEPS[i].tin && (i === 4 || s < STEPS[i + 1].tin);
    const fill = E.outC(P(s, STEPS[i].tin + 0.3, STEPS[i].tin + 0.8));
    const sc = ki * (cur ? 1.18 : 1);
    ctx.save(); ctx.translate(126 + i * 56, 372); ctx.scale(sc, sc);
    paper(ctx, PHEX[i].o, { color: C.card, z: 3, seed: 40 + i });
    ctx.save(); ctx.clip(PHEX[i].i);
    paper(ctx, PHEX[i].i, { color: mixc(C.cream, C.char, 0.1), z: 0, edge: false, seed: 45 + i });
    if (fill > 0) paper(ctx, pathFrom(rrect(-20, 15 - 31 * fill, 40, 40, 2, 9720 + i)), { color: cur ? C.mustard : PAL.honey, z: 1, seed: 47 + i, ew: 1.2 });
    ctx.restore();
    ctx.restore();
  }
}
const PILLS = [
  { id: 1, txt: 'Nektar: çiçeğin tatlı suyu', tin: 3.0, tout: 4.85, pos: [402, 1392], anchor: s => toScreen(camA(s), heroHead(s)[0], heroHead(s)[1]) },
  { id: 2, txt: 'Arkadaşına aktarır', tin: 8.5, tout: 9.2, pos: [540, 716], anchor: s => toScreen(camA(s), A.handX, A.handY - 6) },
  { id: 3, txt: 'Altıgen: 6 kenar', tin: 12.05, tout: 13.05, pos: [540, 1262], anchor: s => toScreen(camB(s), FOCUS.x, FOCUS.y + COMB.RH * 0.87) },
  { id: 4, txt: 'Su buharlaşır', tin: 14.6, tout: 17.7, pos: [792, 742], anchor: s => toScreen(camB(s), 760, 1000) },
  { id: 5, txt: 'Balmumu kapak', tin: 19.95, tout: 21.25, pos: [680, 1330], anchor: s => toScreen(camB(s), 620, 1138) },
];
function drawPill(p, s) {
  const k = P(s, p.tin, p.tin + 0.5), ko = P(s, p.tout, p.tout + 0.28);
  if (k <= 0 || ko >= 1) return;
  const [ax, ay] = p.anchor(s), [cx, cy] = p.pos;
  const sp = tsprite(p.txt, 47, { fam: 'Nunito', wt: 800 });
  const w = Math.round(sp.width + 60), h = 82, x0 = cx - w / 2, y0 = cy - h / 2;
  const lk = E.outC(clamp(k / 0.55)) * (1 - E.inC(ko));
  const sx = clamp(ax, x0 + 34, x0 + w - 34), sy = ay < y0 ? y0 + 6 : ay > y0 + h ? y0 + h - 6 : cy;
  if (lk > 0.01) {
    const path = lineStrip(sx, sy, lerp(sx, ax, lk), lerp(sy, ay, lk), 4.5, 9800 + p.id);
    if (path) paper(ctx, path, { color: C.char, z: 1.6, edge: false, tex: 0, seed: 3 });
    const dk = E.outBack(clamp((lk - 0.82) / 0.18), 2);
    if (dk > 0) { ctx.save(); ctx.translate(ax, ay); ctx.scale(dk, dk); paper(ctx, DOT, { color: C.char, z: 2, seed: 4 }); ctx.restore(); }
  }
  const pk = E.outBack(clamp((k - 0.25) / 0.75), 1.8) * (1 - E.inBack(ko, 1.4));
  if (pk > 0.01) {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(pk, pk); ctx.translate(-w / 2, -h / 2);
    paper(ctx, cardPath(w, h, 900 + p.id, 40), { color: C.card, z: 5, seed: 20 + p.id });
    drawSprite(ctx, sp, 30, 57, { z: 1.4 });
    ctx.restore();
  }
}
const LENS = (() => {
  const r = 165, L = { r };
  L.base = pathFrom(blob(0, 0, r + 22, r + 22, 9900, { wob: 0.008 }));
  L.win = pathFrom(blob(0, 0, r, r, 9901, { wob: 0.006 }));
  L.ring = ringPath(0, 0, r - 3, r + 8, 9902);
  L.bg = pathFrom(rrect(-r - 10, -r - 10, 2 * r + 20, 2 * r + 20, 4, 9903));
  L.band1 = pathFrom(strip(thruPts([124, -210], [108, 0], [126, 210], 12), 66, 66, 9904));
  L.band2 = pathFrom(strip(thruPts([-120, -210], [-140, 0], [-120, 210], 12), 46, 46, 9905));
  L.sac = pathFrom(blob(-6, 34, 98, 86, 9906, { wob: 0.045 }));
  L.sacIn = pathFrom(blob(-6, 36, 84, 72, 9907, { wob: 0.045 }));
  L.tube = [[-112, -200], [-104, -104], [-46, -46]];
  L.tubeP = pathFrom(strip(quadPts(L.tube[0], L.tube[1], L.tube[2], 12), 32, 28, 9908));
  L.tubeIn = pathFrom(strip(quadPts(L.tube[0], L.tube[1], L.tube[2], 12), 15, 12, 9909));
  return L;
})();
function drawLens(s) {
  const k = P(s, T.lens, T.lens + 0.5), ko = P(s, T.lensOut, T.lensOut + 0.3);
  if (k <= 0 || ko >= 1) return;
  const f = forager(s), cam = camA(s);
  const [ax, ay] = toScreen(cam, f.x - 62 * f.s, f.y + 8 * f.s);
  const cx = 300, cy = 700, r = LENS.r;
  const mv = E.outC(clamp(k * 1.4)) * (1 - E.inC(ko)), e = E.outBack(k, 1.5) * (1 - E.inBack(ko, 1.3));
  const px = lerp(ax, cx, mv), py = lerp(ay, cy, mv);
  // leader from the lens rim to the abdomen
  const ang = Math.atan2(ay - py, ax - px), ex = px + Math.cos(ang) * (r + 20) * e, ey = py + Math.sin(ang) * (r + 20) * e;
  const lp = lineStrip(ex, ey, ax, ay, 4.5, 9811);
  if (lp && mv > 0.2) { paper(ctx, lp, { color: C.char, z: 1.6, edge: false, tex: 0, seed: 3, alpha: clamp((mv - 0.2) * 3) }); ctx.save(); ctx.translate(ax, ay); paper(ctx, DOT, { color: C.char, z: 2, seed: 4 }); ctx.restore(); }
  if (e < 0.01) return;
  ctx.save(); ctx.translate(px, py); ctx.scale(e, e);
  paper(ctx, LENS.base, { color: C.card, z: 10, seed: 5 });
  ctx.save(); ctx.clip(LENS.win);
  paper(ctx, LENS.bg, { color: lighten(C.mustard, 0.5), z: 0, seed: 7, edge: false });
  paper(ctx, LENS.band1, { color: C.char, z: 2.5, seed: 8 });
  paper(ctx, LENS.band2, { color: C.char, z: 2.5, seed: 9 });
  paper(ctx, LENS.tubeP, { color: C.card, z: 2.5, seed: 10 });
  paper(ctx, LENS.tubeIn, { color: lighten(C.mustard, 0.15), z: 0, seed: 11, edge: false });
  paper(ctx, LENS.sac, { color: C.card, z: 4.5, seed: 12 });
  const lv = E.ioS(P(s, 3.62, 4.8)) * 0.86;
  ctx.save(); ctx.clip(LENS.sacIn);
  paper(ctx, LENS.sacIn, { color: mixc(C.cream, C.mustard, 0.15), z: 0, seed: 14, edge: false });
  if (lv > 0.01) {
    const top = 108 - 144 * lv, pts = [];
    for (let i = 0; i <= 14; i++) pts.push([-104 + i * 15, top + 4.5 * Math.sin(i * 0.8 + s * 5)]);
    pts.push([110, 140], [-104, 140]);
    paper(ctx, pathFrom(pts), { color: PAL.nectar, z: 1.4, seed: 13, hi: '#FFF7DC', ew: 2 });
  }
  ctx.restore();
  for (let i = 0; i < 4; i++) {                         // drops travel down into the sac
    const dk = P(s, 3.55 + i * 0.32, 3.95 + i * 0.32);
    if (dk <= 0 || dk >= 1) continue;
    const p = dk < 0.75 ? qp(LENS.tube[0], LENS.tube[1], LENS.tube[2], dk / 0.75) : [lerp(-46, -14, (dk - 0.75) / 0.25), lerp(-46, 10, (dk - 0.75) / 0.25)];
    ctx.save(); ctx.translate(p[0], p[1]); ctx.scale(0.36, 0.36);
    paper(ctx, DROPP, { color: PAL.nectar, z: 2, seed: 15 + i });
    ctx.restore();
  }
  ctx.restore();
  paper(ctx, LENS.ring, { color: C.char, z: 1.5, rule: 'evenodd', seed: 6 });
  const tk = E.outBack(P(s, T.lens + 0.3, T.lens + 0.7), 1.8);
  if (tk > 0) {                                        // tag
    const sp = tsprite('Bal midesi', 44, { fam: 'Nunito', wt: 800 }), w = Math.round(sp.width + 56);
    ctx.save(); ctx.translate(0, -r - 36); ctx.rotate(-0.04); ctx.scale(tk, tk); ctx.translate(-w / 2, -38);
    paper(ctx, cardPath(w, 76, 931, 36), { color: C.mustard, z: 5, seed: 33 });
    drawSprite(ctx, sp, 28, 53, { z: 1.2 });
    ctx.restore();
  }
  ctx.restore();
}
function drawGauge(s) {
  const k = P(s, 13.8, 14.3), ko = P(s, 19.0, 19.32);
  if (k <= 0 || ko >= 1) return;
  const ei = E.outBack(k, 1.2), eo = E.inBack(ko, 1.2);
  const x = 104, y = 436, w = 650, h = 172;
  const v = Math.round(lerp(80, 18, E.ioS(P(s, 14.2, 18.2))));
  ctx.save(); ctx.translate(x + (1 - ei) * -(w + 220) + eo * -(w + 220), y); ctx.rotate((1 - ei) * 0.05);
  paper(ctx, cardPath(w, h, 950), { color: C.card, z: 6, seed: 60 });
  drawSprite(ctx, tsprite('SU ORANI', 30, { fam: 'Nunito', wt: 900, col: C.char, tr: 4 }), 30, 50, { z: 1 });
  drawSprite(ctx, tsprite('yaklaşık', 30, { fam: 'Nunito', wt: 800, col: C.terra }), 30 + measure('SU ORANI', 30, 'Nunito', 900, 4) + 16, 50, { z: 1 });
  drawSprite(ctx, tsprite('%' + v, 86, { wt: 700, col: C.char }), 28, 146, { z: 1.6 });
  const bx = 250, by = 96, bw = 370, bh = 44;
  ctx.save(); ctx.translate(bx, by);
  paper(ctx, cardPath(bw, bh, 951, 22), { color: mixc(C.cream, C.char, 0.1), z: 0, seed: 61, edge: false });
  const fw = Math.max(bh, Math.round((bw * v) / 100));
  paper(ctx, cardPath(fw, bh, 952, 22), { color: C.blue, z: 2, seed: 62 });
  ctx.translate(fw - 22, bh / 2); ctx.scale(0.5, 0.5); ctx.translate(0, -24);
  paper(ctx, DROPP, { color: PAL.blueL, z: 1, seed: 63 });
  ctx.restore();
  ctx.restore();
}
function drawBadge(s) {
  const k = P(s, T.badge, T.badge + 0.42), ko = P(s, 19.0, 19.3);
  if (k <= 0 || ko >= 1) return;
  const e = E.outC(k), sc = lerp(1.7, 1, e) + 0.04 * bump(P(s, T.badge + 0.36, T.badge + 0.6)), z = lerp(34, 5, e);
  const eo = E.inBack(ko, 1.3);
  ctx.save(); ctx.translate(596 + eo * 620, 1196 - eo * 120); ctx.rotate(-0.12 + eo * 0.3); ctx.scale(sc, sc);
  ctx.globalAlpha = clamp(k * 6);
  paper(ctx, BADGE.o, { color: C.mustard, z, seed: 70 });
  paper(ctx, BADGE.i, { color: C.card, z: 1.2, seed: 71 });
  drawSprite(ctx, tsprite('Bal', 72, { wt: 700 }), 0, -4, { z: 1, ax: 0.5 });
  drawSprite(ctx, tsprite('oldu!', 56, { wt: 700, col: C.terra }), 0, 56, { z: 1, ax: 0.5 });
  ctx.restore();
}
function drawHUD(s) {
  drawTitle(s);
  for (const p of PILLS) drawPill(p, s);
  drawLens(s);
  drawGauge(s);
  drawBadge(s);
  drawProgress(s);
  for (const st of STEPS) drawStep(st, s);
}

/* ==========================================================================
   SIGNATURE TRANSITION 2 — the honey-drip sheet (B → C)
   ========================================================================== */
const WIPE = (() => {
  const HS = 3300;
  const make = (seed, nd, maxLen) => {
    const R = rng(seed), drips = [];
    for (let i = 0; i < nd; i++) drips.push({ x: -40 + ((i + 0.5) / nd) * 1160 + (R() - 0.5) * 60, w: 46 + R() * 60, len: 40 + R() * maxLen });
    const pts = [];
    for (let x = -60; x <= 1140; x += 12) pts.push([x, 7 * Math.sin(x * 0.011 + seed)]);
    pts.push([1140, HS]);
    for (let x = 1140; x >= -60; x -= 5) {
      let y = HS + 8 * Math.sin(x * 0.02 + seed);
      for (const d of drips) { const u = (x - d.x) / (d.w / 2); if (Math.abs(u) < 1) y = Math.max(y, HS + d.len * Math.pow(1 - u * u, 0.3)); }
      pts.push([x, y]);
    }
    return pathFrom(jitterPts(pts, seed, 0.8));
  };
  return { HS, back: make(31, 9, 230), front: make(32, 11, 160) };
})();
function drawWipe(s) {
  const k = P(s, T.wipe0, T.wipe1);
  if (k <= 0 || k >= 1) return;
  const yb = lerp(-260, 5400, E.ioQ(k));
  ctx.save(); ctx.translate(0, yb + 90 - WIPE.HS); paper(ctx, WIPE.back, { color: PAL.honeyD, z: 14, seed: 120, sa: 0.38 }); ctx.restore();
  ctx.save(); ctx.translate(0, yb - WIPE.HS); paper(ctx, WIPE.front, { color: PAL.honey, z: 10, seed: 121 }); ctx.restore();
}

/* ==========================================================================
   WORLD C — the jar, thank you, love nature
   ========================================================================== */
const CW = {};
function buildC() {
  CW.gy = x => hillY(2.2, x, 1500, 24, 0.006, 0.013);
  CW.back = pathFrom(hillPts(5.5, -200, 1300, 1402, 34, 0.0045, 0.01, 2100));
  CW.ground = pathFrom(hillPts(2.2, -200, 1300, 1500, 24, 0.006, 0.013, 2100));
  CW.tufts = [40, 150, 290, 440, 640, 800, 930, 1050].map((x, i) => ({ x, y: CW.gy(x) + 6, blades: makeTuft(9400 + i, 40 + (i % 3) * 10) }));
  CW.flowers = [
    plantDef('hero', 330, 168, 1352, 0.5, 182, 13, -20, T.flowersC + 0.2, 1),
    plantDef('daisy', 331, 930, 1404, 0.85, 914, 11, 18, T.flowersC + 0.3, -1),
    plantDef('corn', 332, 868, 1512, 0.8, 878, 10, 10, T.flowersC + 0.4, 0),
    plantDef('poppy', 333, 236, 1530, 0.8, 242, 10, -8, T.flowersC + 0.35, 0),
    plantDef('mini', 334, 64, 1470, 0.9, 70, 9, 6, T.flowersC + 0.45, 0),
  ];
  CW.comb = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3 - r; c++) {
    const x = 832 + c * 50 + r * 25, y = 1452 - r * 43;
    CW.comb.push({ o: pathFrom(hexPts(x, y, 29, 9500 + r * 5 + c)), i: pathFrom(hexPts(x, y, 22, 9510 + r * 5 + c)) });
  }
  CW.blobA = pathFrom(blob(0, 0, 200, 70, 9991, { wob: 0.05 }));
  CW.banner = null;
}
function drawJar(s) {
  paper(ctx, JAR.body, { color: PAL.glass, z: 7, seed: 81 });
  const lvl = lerp(0.2, 0.86, E.ioC(P(s, T.jar0, T.jar0 + 0.9)));
  const top = 1440 - 520 * lvl, pts = [];
  for (let i = 0; i <= 16; i++) { const x = 330 + i * 26; pts.push([x, top + 5 * Math.sin(i * 0.7 + s * 3) * (1 - P(s, 22.6, 23.4) * 0.7)]); }
  pts.push([760, 1460], [330, 1460]);
  ctx.save(); ctx.clip(JAR.inner);
  paper(ctx, pathFrom(pts), { color: PAL.honey, z: 1.8, seed: 82, hi: lighten(PAL.honey, 0.5) });
  paper(ctx, pathFrom(strip(quadPts([430, top + 30], [416, 1200], [440, 1420], 10), 44, 30, 9530)), { color: lighten(PAL.honey, 0.25), z: 0.5, seed: 83, alpha: 0.85 });
  ctx.restore();
  paper(ctx, JAR.hl1, { color: C.card, z: 0.8, alpha: 0.75, edge: false, tex: 0.2, seed: 84 });
  paper(ctx, JAR.hl2, { color: C.card, z: 0.8, alpha: 0.75, edge: false, tex: 0.2, seed: 85 });
  paper(ctx, JAR.label, { color: C.terra, z: 3, seed: 86 });
  paper(ctx, JAR.labelIn, { color: C.card, z: 0.8, seed: 87 });
  drawSprite(ctx, tsprite('BAL', 100, { wt: 700 }), 540, 1226, { ax: 0.5, z: 1.8 });
  JAR.hexes.forEach((h, i) => paper(ctx, h, { color: i === 1 ? C.mustard : PAL.honey, z: 1.2, seed: 88 + i }));
  paper(ctx, JAR.neck, { color: PAL.glass, z: 2, seed: 89 });
  paper(ctx, JAR.lid, { color: C.char, z: 3, seed: 90 });
  paper(ctx, JAR.cloth, { color: C.card, z: 5, seed: 91 });
  ctx.save(); ctx.clip(JAR.cloth);
  for (let i = 0; i < JAR.dots.length; i++) paper(ctx, JAR.dots[i], { color: C.terra, z: 0.6, seed: 92 + i, ew: 1 });
  ctx.restore();
  paper(ctx, JAR.twine, { color: C.char, z: 2, seed: 93 });
  paper(ctx, JAR.knot, { color: C.char, z: 2.5, seed: 94 });
}
function drawWorldC(s) {
  ctx.drawImage(BGCV, -450, -450);
  // sun peeking in the corner, the same sun as the meadow
  ctx.save(); ctx.translate(930, 760); ctx.scale(0.8, 0.8);
  ctx.save(); ctx.rotate(q12(s) * 0.12);
  for (let i = 0; i < 12; i++) paper(ctx, A.sun.rays[i], { color: PAL.mustD, z: 2, seed: 30 + i, ew: 1.4 });
  ctx.restore();
  paper(ctx, A.sun.disc, { color: C.mustard, z: 3.5, seed: 31 });
  paper(ctx, A.sun.inner, { color: lighten(C.mustard, 0.3), z: 1.5, seed: 32 });
  ctx.restore();
  paper(ctx, CW.back, { color: PAL.sageL, z: 4, seed: 23 });
  for (const f of CW.flowers) plant(f, s, CW.gy, false);
  paper(ctx, CW.ground, { color: C.sage, z: 6, seed: 24 });
  for (const t of CW.tufts) tuft(t);
  softShadow(ctx, 560, 1466, 250, 34, 0.18);
  drawJar(s);
  for (const c of CW.comb) { paper(ctx, c.o, { color: PAL.wall, z: 3, seed: 95 }); paper(ctx, c.i, { color: PAL.wax, z: 1.2, seed: 96 }); }
  // the bee comes home to the jar
  if (s > T.beeC0) {
    const PC = [[-170, 560], [180, 520], [520, 470], [770, 560], [650, 680], [560, 686]];
    const o = { s: 0.95, seed: 0, wings: 'fly', tuck: 1, alt: 60, face: 1, rot: 0, pollen: 1 };
    if (s < T.beeC1) {
      const st = pathState(PC, s, T.beeC0, T.beeC1, E.outC), land = P(s, T.beeC1 - 0.25, T.beeC1);
      o.x = st.p[0]; o.y = st.p[1] + Math.sin(s * 14) * 5 * (1 - land);
      o.face = lerp(clamp(st.v[0] / 240, -1, 1), -1, E.ioS(P(s, T.beeC1 - 0.3, T.beeC1 - 0.05)));
      o.rot = clamp(st.v[1] / 3200, -0.2, 0.2) * Math.sign(o.face); o.tuck = 1 - land; o.alt = 60 * (1 - land);
    } else {
      [o.x, o.y] = PC[5]; o.face = -1; o.tuck = 0; o.alt = 0;
      const lk = P(s, T.beeC1, T.beeC1 + 0.35); o.sqy = 1 - 0.08 * bump(lk); o.sqx = 1 + 0.05 * bump(lk);
      o.wings = s > 24.3 && s < 24.55 ? 'fly' : 'rest';
    }
    drawBee(ctx, o);
  }
  const hk = P(s, T.heart, T.heart + 1.0);
  if (hk > 0) {
    const e = E.outBack(clamp(hk * 3), 2);
    ctx.save(); ctx.translate(652 + 16 * hk, 704 - 42 * E.outQ(hk)); ctx.rotate(-0.2 + 0.08 * Math.sin(hk * 6)); ctx.scale(e * 0.9, e * 0.9);
    paper(ctx, HEART, { color: C.terra, z: 5, seed: 97 });
    ctx.restore();
  }
  // thank-you type
  const w1 = measure('Teşekkürler,', 124, 'Baloo 2', 700), w2 = measure('arılar!', 124, 'Baloo 2', 700);
  const bk = spring(P(s, T.thanks + 0.55, T.thanks + 1.0), 1.2, 6);
  if (bk > 0) {
    ctx.save(); ctx.translate(540 + 4, 450); ctx.rotate(0.04); ctx.scale(bk * (w2 + 70) / 400, bk);
    paper(ctx, CW.blobA, { color: C.mustard, z: 2.5, seed: 98 });
    ctx.restore();
  }
  letterLine('Teşekkürler,', 124, 540 - w1 / 2, 352, T.thanks, s, 303);
  letterLine('arılar!', 124, 540 - w2 / 2, 488, T.thanks + 0.36, s, 404);
  const sk = E.outBack(P(s, T.sub, T.sub + 0.5), 1.4);
  if (sk > 0) {
    const sp = tsprite('Doğayı sev, arıları koru.', 46, { fam: 'Nunito', wt: 900, col: C.card }), w = Math.round(sp.width + 64), h = 82;
    ctx.save(); ctx.translate(540, 576); ctx.rotate(-0.02 + (1 - sk) * 0.2); ctx.scale(sk, sk); ctx.translate(-w / 2, -h / 2);
    paper(ctx, cardPath(w, h, 960, 18), { color: C.terra, z: 6, seed: 99 });
    drawSprite(ctx, sp, 32, 56, { z: 1.2 });
    ctx.restore();
  }
}

/* ==========================================================================
   FRAME
   ========================================================================== */
function seek(t) {
  const s = clamp(t, 0, DURATION) / TS;
  FR.s = s; FR.frame = Math.round(t * FPS);
  if (ctx.reset) ctx.reset(); else ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  if (s < T.cut) {
    if (s < T.iris1) { drawWorldA(s); if (s >= T.iris0) drawIris(s); }
    else drawWorldB(s);
    drawHUD(s);
  } else drawWorldC(s);
  drawWipe(s);
  ctx.drawImage(VIG, 0, 0);
}

async function init() {
  TEXCV = makeFiberTexture(512, 1234);
  TEXP = ctx.createPattern(TEXCV, 'repeat');
  BGCV = makeBackground();
  VIG = makeVignette();
  const sample = 'AaĞğİıŞşÇçÖöÜü%0123456789,.!?:';
  await Promise.all(['600 80px "Baloo 2"', '700 80px "Baloo 2"', '800 40px "Nunito"', '900 40px "Nunito"'].map(f => document.fonts.load(f, sample)));
  buildA(); buildB(); buildC();
  window.seek = seek;
  window.DURATION = DURATION; window.FPS = FPS;
  seek(0);
  window.__ready = true;
}
init();

/* preview player (only for a person watching in a browser; rendering uses seek) */
(() => {
  if (location.search.includes('render')) return;
  let playing = false, t0 = 0, base = 0, cur = 0;
  const loop = now => {
    if (!playing) return;
    cur = Math.min(DURATION, base + (now - t0) / 1000);
    if (window.seek) window.seek(cur);
    if (cur >= DURATION) { playing = false; return; }
    requestAnimationFrame(loop);
  };
  addEventListener('keydown', e => {
    if (e.code === 'Space') { playing = !playing; if (playing) { if (cur >= DURATION) cur = 0; base = cur; t0 = performance.now(); requestAnimationFrame(loop); } e.preventDefault(); }
    if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') { cur = clamp(cur + (e.code === 'ArrowRight' ? 1 : -1), 0, DURATION); base = cur; t0 = performance.now(); if (window.seek) window.seek(cur); }
  });
  cv.addEventListener('click', () => dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' })));
})();
