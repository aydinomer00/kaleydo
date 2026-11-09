'use strict';
/* 11 · Ebru Akışı — paper marbling done with marbling mathematics. Every ink drop is a polygon;
   a new drop of radius r at c pushes every existing point p to c + (p−c)·√(1 + r²/|p−c|²); a stylus
   dragged along a path shifts points along it by z·λ/(d+λ). The whole history is replayed for
   each frame (deterministic), so the pattern can be scrubbed to any time. */
(() => {
  const { E, P, clamp, lerp, bump, rng, mix, darken, lighten, rgba } = SH;
  const C = { ground: '#F3EAD8', indigo: '#2D4A7A', lapis: '#3E6DB5', turq: '#4FA3A5', ochre: '#D9A441', madder: '#B5473A', green: '#5E8F4E', greenL: '#8DB36A', ink: '#22304F' };
  const S = {};

  function circle(cx, cy, r, n) { return Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; }); }
  function applyDrop(polys, cx, cy, r) {
    const r2 = r * r;
    for (const pl of polys) for (const p of pl.pts) {
      const dx = p[0] - cx, dy = p[1] - cy, d2 = dx * dx + dy * dy || 1e-6, k = Math.sqrt(1 + r2 / d2);
      p[0] = cx + dx * k; p[1] = cy + dy * k;
    }
  }
  function applyStroke(polys, ax, ay, bx, by, z, lam) {  // stylus dragged from A to B
    const vx = bx - ax, vy = by - ay, L = Math.hypot(vx, vy) || 1, ux = vx / L, uy = vy / L;
    for (const pl of polys) for (const p of pl.pts) {
      const tx = p[0] - ax, ty = p[1] - ay, along = clamp((tx * ux + ty * uy) / L);
      const qx = ax + vx * along, qy = ay + vy * along, d = Math.hypot(p[0] - qx, p[1] - qy);
      const s = (z * lam) / (d + lam);
      p[0] += ux * s; p[1] += uy * s;
    }
  }
  function distToPath(px, py, path) {
    let best = 1e9, nx = 0, ny = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const [ax, ay] = path[i], [bx, by] = path[i + 1], vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy || 1;
      const u = clamp(((px - ax) * vx + (py - ay) * vy) / L2), qx = ax + vx * u, qy = ay + vy * u, d = Math.hypot(px - qx, py - qy);
      if (d < best) { best = d; nx = (px - qx) / (d || 1); ny = (py - qy) / (d || 1); }
    }
    return [best, nx, ny];
  }
  function applyPart(polys, path, width) {               // the river parts the floating inks
    for (const pl of polys) for (const p of pl.pts) {
      const [d, nx, ny] = distToPath(p[0], p[1], path);
      if (d < width * 1.6) { const push = (width * 1.6 - d) * 0.62; p[0] += nx * push; p[1] += ny * push; }
    }
  }
  function refine(polys, maxEdge = 14, cap = 2400) {     // keep stretched outlines smooth
    for (const pl of polys) {
      if (pl.pts.length > cap) continue;
      const out = [];
      for (let i = 0; i < pl.pts.length; i++) {
        const a = pl.pts[i], b = pl.pts[(i + 1) % pl.pts.length];
        out.push(a);
        if (Math.hypot(b[0] - a[0], b[1] - a[1]) > maxEdge) out.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
      }
      pl.pts = out;
    }
  }

  SH.register({
    id: '11', w: 1080, h: 1920, duration: 8, fps: 30, poster: 6.6,
    fonts: ['400 80px "Marcellus"'],
    init(g, W, H) {
      const R = rng(1101), ops = [];
      const cols = [C.indigo, C.turq, C.ochre, C.madder, C.green, C.lapis];
      for (let i = 0; i < 32; i++) ops.push({ type: 'drop', t0: 0.1 + i * 0.014, dur: 0.35, x: 40 + R() * 1000, y: 540 + R() * 1340, r: 16 + R() * 24, col: cols[i % cols.length] });
      for (const [x, y, r, col, t0] of [[170, 820, 125, C.green, 0.7], [910, 900, 135, C.green, 0.8], [250, 1080, 95, C.greenL, 0.95], [830, 1150, 105, C.greenL, 1.05], [130, 1330, 115, C.ochre, 1.2], [950, 1370, 125, C.ochre, 1.3], [540, 640, 74, C.lapis, 1.5], [540, 640, 42, C.turq, 1.7]])
        ops.push({ type: 'drop', t0, dur: 0.45, x, y, r, col });
      for (let k = 0; k < 2; k++) {                      // a gentle wave comb across the whole bath: the ebru veins
        const y = 900 + k * 420, pts = Array.from({ length: 13 }, (_, i) => [-40 + i * 95, y + Math.sin(i * 1.1 + k * 2) * 40]);
        pts.slice(0, -1).forEach((p, i) => ops.push({ type: 'stroke', t0: 2.0 + k * 0.2 + i * 0.02, dur: 0.12, a: p, b: pts[i + 1], z: 16, lam: 60 }));
      }
      const river = SH.catmullPts([[540, 690], [640, 820], [440, 990], [650, 1150], [430, 1310], [610, 1480], [540, 1700]], 90);
      S.river = river;
      for (let i = 0; i < 6; i++) ops.push({ type: 'part', t0: 2.5 + i * 0.28, dur: 0.4, upto: (i + 1) / 6 });
      for (const [x, r, t0] of [[180, 190, 4.6], [880, 200, 4.75], [540, 230, 4.95], [330, 120, 5.25], [760, 120, 5.4]]) ops.push({ type: 'drop', t0, dur: 0.6, x, y: 1830, r, col: x === 540 ? C.indigo : C.lapis });
      for (let k = 0; k < 3; k++) {                    // waves combed through the sea
        const y = 1680 + k * 70, pts = Array.from({ length: 13 }, (_, i) => [-40 + i * 95, y + Math.sin(i * 1.3 + k) * 26]);
        pts.slice(0, -1).forEach((p, i) => ops.push({ type: 'stroke', t0: 6.0 + k * 0.15 + i * 0.03, dur: 0.1, a: p, b: pts[i + 1], z: 22, lam: 26 }));
      }
      S.ops = ops.sort((a, b) => a.t0 - b.t0);
      const tray = SH.canvas(W, H), b = tray.g;
      b.fillStyle = C.ground; b.fillRect(0, 0, W, H);
      b.globalCompositeOperation = 'soft-light'; b.globalAlpha = 0.5; b.fillStyle = b.createPattern(SH.grain(512, 1102, { fibres: 500 }), 'repeat'); b.fillRect(0, 0, W, H);
      S.tray = tray.c;
      S.paperTex = b.createPattern(SH.grain(512, 1103, { fibres: 700 }), 'repeat');
      S.t1 = SH.textSprite('Nehirler denize', 92, { fam: 'Marcellus', wt: 400, col: C.ink });
      S.t2 = SH.textSprite('nasıl ulaşır?', 92, { fam: 'Marcellus', wt: 400, col: C.madder });
      S.labels = ['1 · Dağlarda doğar', '2 · Kıvrıla kıvrıla akar', '3 · Denize kavuşur'].map(s => SH.textSprite(s, 54, { fam: 'Marcellus', wt: 400, col: C.ink }));
    },
    frame(g, t, W, H) {
      g.drawImage(S.tray, 0, 0);
      // replay the marbling history up to t
      const polys = [];
      let strokes = 0;
      for (const op of S.ops) {
        if (t < op.t0) break;
        const k = P(t, op.t0, op.t0 + op.dur);
        if (op.type === 'drop') {
          const r = op.r * E.outC(k);
          applyDrop(polys, op.x, op.y, r);
          polys.push({ col: op.col, pts: circle(op.x, op.y, r, Math.max(48, Math.round(op.r * 2.2))) });
        } else if (op.type === 'part') {
          const n = Math.max(2, Math.round(S.river.length * op.upto));
          applyPart(polys, S.river.slice(0, n), 34 * E.ioS(k));
          refine(polys);
        } else {
          applyStroke(polys, op.a[0], op.a[1], op.b[0], op.b[1], op.z * E.ioS(k), op.lam);
          if (++strokes % 6 === 0) refine(polys);
        }
      }
      // float the inks: each colour a soft, slightly darker-edged shape
      g.save();
      for (const pl of polys) {
        const p = SH.pathFrom(pl.pts);
        g.fillStyle = pl.col; g.fill(p);
        g.strokeStyle = rgba(darken(pl.col, 0.25), 0.5); g.lineWidth = 1.6; g.stroke(p);
      }
      // the river ribbon flows down from its source, thin at the spring and wide at the mouth
      const flow = E.ioS(P(t, 2.5, 4.3));
      if (flow > 0) {
        const part = SH.partial(S.river, flow);
        if (part.length > 2) {
          const prof = u => 18 + 70 * u * flow;
          const rib = SH.strip(part, 0, 0, 1110, { profile: prof, wob: 0.08, cap: true });
          const rp = SH.pathFrom(rib);
          g.fillStyle = C.lapis; g.fill(rp); g.strokeStyle = rgba(darken(C.lapis, 0.3), 0.6); g.lineWidth = 2; g.stroke(rp);
          g.save(); g.clip(rp); g.strokeStyle = C.turq; g.lineCap = 'round';
          for (const [off, w] of [[0, 10], [-18, 4], [18, 4]]) { g.lineWidth = w; g.beginPath(); part.forEach((q, i) => { const r = part[Math.min(part.length - 1, i + 1)], a = Math.atan2(r[1] - q[1], r[0] - q[0]) + Math.PI / 2, o = off * (i / part.length) + Math.sin(i * 0.35) * 5; i ? g.lineTo(q[0] + Math.cos(a) * o, q[1] + Math.sin(a) * o) : g.moveTo(q[0], q[1]); }); g.stroke(); }
          g.restore();
        }
      }
      g.globalCompositeOperation = 'soft-light'; g.globalAlpha = 0.45; g.fillStyle = S.paperTex; g.fillRect(0, 0, W, H);
      g.restore();
      // title label pasted on the sheet
      const tk = E.outC(P(t, 0.3, 0.8));
      if (tk > 0) {
        g.save(); g.globalAlpha = tk; g.translate(0, (1 - tk) * -20);
        g.fillStyle = 'rgba(248,242,228,0.94)'; g.shadowColor = 'rgba(30,30,50,0.25)'; g.shadowBlur = 14; g.shadowOffsetY = 5;
        g.beginPath(); g.roundRect(110, 200, 860, 270, 20); g.fill(); g.shadowColor = 'transparent';
        g.strokeStyle = rgba(C.indigo, 0.8); g.lineWidth = 3; g.beginPath(); g.roundRect(124, 214, 832, 242, 14); g.stroke();
        SH.drawSprite(g, S.t1, 540, 316, { ax: 0.5 }); SH.drawSprite(g, S.t2, 540, 424, { ax: 0.5 });
        g.restore();
      }
      [[1.6, 3.2, 540, 560], [3.6, 5.0, 300, 1240], [5.5, 9, 540, 1580]].forEach(([a, b2, x, y], i) => {
        const k = E.outC(P(t, a, a + 0.4)) * (1 - P(t, b2, b2 + 0.3));
        if (k <= 0) return;
        const sp = S.labels[i], w = sp.width + 60;
        g.save(); g.globalAlpha = k; g.fillStyle = 'rgba(248,242,228,0.92)'; g.shadowColor = 'rgba(30,30,50,0.25)'; g.shadowBlur = 10; g.shadowOffsetY = 4;
        g.beginPath(); g.roundRect(x - w / 2, y - 52, w, 80, 40); g.fill(); g.restore();
        SH.drawSprite(g, sp, x, y + 4, { ax: 0.5, alpha: k });
      });
      // loop: a sheet is laid on the bath and lifted, leaving clean water
      const lay = E.inOutC ? 0 : 0, down = E.ioC(P(t, 7.0, 7.45)), up = E.ioC(P(t, 7.55, 8.0));
      if (down > 0) {
        if (up > 0) g.drawImage(S.tray, 0, 0);
        const y = up > 0 ? lerp(0, -H - 60, up) : lerp(-H - 60, 0, down);
        g.save(); g.shadowColor = 'rgba(30,25,20,0.35)'; g.shadowBlur = 40; g.shadowOffsetY = 18;
        g.fillStyle = '#FBF6EC'; g.fillRect(-20, y, W + 40, H + 20); g.restore();
        g.save(); g.globalCompositeOperation = 'soft-light'; g.globalAlpha = 0.5; g.fillStyle = S.paperTex; g.fillRect(-20, y, W + 40, H + 20); g.restore();
        void lay;
      }
    },
  });
})();
