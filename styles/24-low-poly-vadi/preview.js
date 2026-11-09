'use strict';
/* 24 · Low-Poly Vadi — a faceted 3D diorama rendered in Canvas 2D: a triangulated terrain block with flat-shaded
   facets, layered rock on its cut faces, cone trees and paper-flat clouds under a low-poly sky. The camera sways
   gently. Mountains rise as two plates push together; at the end every facet shrinks to a point and regrows. */
(() => {
  const { E, P, clamp, lerp, rng, mix } = SH;
  const S = {};
  const F = 1500, CX = 540, CY = 1010;
  const NX = 28, NZ = 22, X0 = -5, X1 = 5, Z0 = -4, Z1 = 4, BOTTOM = -2.6;
  const PEAKS = [[0.1, -2.5, 2.7, 0.9, 1.0], [0.35, 0.2, 3.3, 1.0, 1.1], [-0.35, 2.6, 2.5, 0.9, 0.9], [1.6, -1.0, 1.3, 0.8, 0.9], [-1.7, 1.1, 1.2, 0.8, 0.9], [1.2, 2.0, 1.0, 0.7, 0.8]];
  const LAYERS = ['#C9A26B', '#A87F4F', '#D8B98A', '#8B6A45', '#6E5338'];
  const LIGHT = (() => { const v = [-0.45, 0.8, 0.4], l = Math.hypot(...v); return v.map(c => c / l); })();
  const TREES = [[-4.1, -2.8], [-3.4, -0.6], [-4.3, 1.2], [-3.0, 2.9], [-2.7, -3.2], [3.2, -2.9], [4.2, -0.9], [3.5, 1.6], [4.4, 3.0], [2.8, 0.4]];

  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = a => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const hexRgb = SH.hex2rgb;

  function height(x, z, fold) {
    let m = 0;
    for (const [px, pz, a, sx, sz] of PEAKS) m += a * Math.exp(-((x - px) ** 2) / (2 * sx * sx) - ((z - pz) ** 2) / (2 * sz * sz));
    m += 0.9 * Math.exp(-(x * x) / (2 * 1.4 * 1.4));
    return 0.14 * SH.noise2(2401, x * 0.6, z * 0.6) + 0.07 * SH.noise2(2402, x * 1.8, z * 1.8) + fold * m;
  }
  function camera(t) {
    const yaw = -0.55 + 0.09 * Math.sin((2 * Math.PI * t) / 8), pitch = 0.5, D = 18.5, tg = [0, 0.5, 0];
    const cp = [tg[0] + D * Math.sin(yaw) * Math.cos(pitch), tg[1] + D * Math.sin(pitch), tg[2] + D * Math.cos(yaw) * Math.cos(pitch)];
    const fwd = norm(sub(tg, cp)), right = norm(cross(fwd, [0, 1, 0])), up = cross(right, fwd);
    return { cp, fwd, right, up };
  }
  const project = (p, c) => { const d = sub(p, c.cp), z = dot(d, c.fwd); return [CX + (F * dot(d, c.right)) / z, CY - (F * dot(d, c.up)) / z, z]; };
  function shadeCol(hex, n, vary = 0) {
    const k = 0.5 + 0.5 * Math.max(0, dot(n, LIGHT)) + vary, [r, g, b] = hexRgb(hex);
    return `rgb(${Math.min(255, r * k) | 0},${Math.min(255, g * k) | 0},${Math.min(255, b * k) | 0})`;
  }
  function terrainCol(h, x, snowLine) {
    if (h > snowLine) return '#F4F7FB';
    const plate = x < 0 ? '#6DBF5A' : '#5DB07A';
    if (h < 0.5) return plate;
    if (h < 1.2) return mix(plate, '#8C8A4B', clamp((h - 0.5) / 0.7));
    return mix('#8C7A55', '#8E8F99', clamp((h - 1.2) / 1.2));
  }

  // build every visible polygon for this moment, sorted far → near
  function buildScene(t, s) {
    const cam = camera(t), fold = E.ioS(P(s, 1.9, 4.6)), squeeze = 1 - 0.1 * fold, snowLine = lerp(4.5, 2.0, P(s, 4.6, 5.3));
    const items = [];
    const V = [];
    for (let i = 0; i <= NX; i++) for (let j = 0; j <= NZ; j++) {
      const gx = lerp(X0, X1, i / NX) + (i > 0 && i < NX ? (SH.h2(2410, i, j) - 0.5) * 0.18 : 0), gz = lerp(Z0, Z1, j / NZ) + (j > 0 && j < NZ ? (SH.h2(2411, i, j) - 0.5) * 0.18 : 0);
      const h = height(gx, gz, fold);
      V.push({ w: [gx * squeeze, h, gz], h, gx });
    }
    const at = (i, j) => V[i * (NZ + 1) + j];
    const tri = (a, b, c, col, idx, n) => {
      const pa = project(a, cam), pb = project(b, cam), pc = project(c, cam);
      items.push({ p: [pa, pb, pc], z: (pa[2] + pb[2] + pc[2]) / 3, col: shadeCol(col, n, (SH.h01(2412, idx) - 0.5) * 0.06), idx });
    };
    let idx = 0;
    for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) {
      const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
      for (const [p, q, r] of (i + j) % 2 ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]]) {
        let n = norm(cross(sub(q.w, p.w), sub(r.w, p.w)));
        if (n[1] < 0) n = n.map(v => -v);
        const h = (p.h + q.h + r.h) / 3;
        tri(p.w, q.w, r.w, terrainCol(h, (p.gx + q.gx + r.gx) / 3, snowLine), idx++, n);
      }
    }
    // cut faces with rock layers: the four sides, culled when they face away
    const side = (list, outward) => {
      const mid = list[Math.floor(list.length / 2)].w;
      if (dot(outward, sub(cam.cp, mid)) <= 0) return;
      for (let k = 0; k < list.length - 1; k++) {
        const A = list[k], B = list[k + 1];
        const bnd = v => [v.h, ...[1, 2, 3, 4].map(L => v.h * (1 - 0.13 * L) - 0.5 * L), BOTTOM];
        const ba = bnd(A), bb = bnd(B);
        for (let L = 0; L < 5; L++) {
          const p1 = [A.w[0], ba[L], A.w[2]], p2 = [B.w[0], bb[L], B.w[2]], p3 = [B.w[0], Math.max(BOTTOM, bb[L + 1]), B.w[2]], p4 = [A.w[0], Math.max(BOTTOM, ba[L + 1]), A.w[2]];
          tri(p1, p2, p3, LAYERS[L], idx++, outward); tri(p1, p3, p4, LAYERS[L], idx++, outward);
        }
      }
    };
    side(Array.from({ length: NX + 1 }, (_, i) => at(i, NZ)), [0, 0, 1]);
    side(Array.from({ length: NX + 1 }, (_, i) => at(i, 0)), [0, 0, -1]);
    side(Array.from({ length: NZ + 1 }, (_, j) => at(0, j)), [-1, 0, 0]);
    side(Array.from({ length: NZ + 1 }, (_, j) => at(NX, j)), [1, 0, 0]);
    // cone trees that pop up on the plates
    TREES.forEach(([tx, tz], k) => {
      const kt = E.outBack(P(s, 5.6 + k * 0.06, 5.9 + k * 0.06), 1.6);
      if (kt <= 0) return;
      const x = tx * squeeze, y = height(tx, tz, fold), r = 0.3 * kt, hh = 1.0 * kt, apex = [x, y + hh, tz];
      const base = [0, 1, 2].map(q => { const a = (q / 3) * Math.PI * 2 + 0.4; return [x + Math.cos(a) * r, y + 0.02, tz + Math.sin(a) * r]; });
      for (let q = 0; q < 3; q++) {
        const p1 = base[q], p2 = base[(q + 1) % 3];
        let n = norm(cross(sub(p2, p1), sub(apex, p1)));
        if (dot(n, sub([x, y + hh * 0.3, tz], p1)) > 0) n = n.map(v => -v);
        if (dot(n, sub(cam.cp, p1)) <= 0) continue;
        tri(p1, p2, apex, q % 2 ? '#2F7D4A' : '#3A9A57', 9000 + k * 3 + q, n);
      }
    });
    // push arrows lying on the plates
    const ka = P(s, 1.6, 1.9) * (1 - P(s, 4.6, 5.0));
    if (ka > 0) {
      const pulse = 0.25 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 1.5 * s));
      for (const dir of [1, -1]) {
        const shape = [[0, -0.32], [0.8, -0.32], [0.8, -0.7], [1.6, 0], [0.8, 0.7], [0.8, 0.32], [0, 0.32]];
        const bx = dir * (-4.4 + pulse) * squeeze, y = 0.5;
        const top = shape.map(([u, v]) => project([bx + dir * u * ka, y, v * ka], cam));
        const zz = top.reduce((m, p) => m + p[2], 0) / top.length;
        items.push({ p: top, z: zz - 0.5, col: shadeCol('#F06A3B', [0, 1, 0]), idx: 9500 + dir });
        items.push({ p: shape.map(([u, v]) => project([bx + dir * u * ka, y - 0.18, v * ka], cam)), z: zz - 0.45, col: '#A8401F', idx: 9600 + dir });
      }
    }
    items.sort((a, b) => b.z - a.z);
    return { items, fold, cam };
  }

  SH.register({
    id: '24', w: 1080, h: 1920, duration: 8, fps: 30, poster: 6.4,
    fonts: ['800 80px "Exo 2"', '700 80px "Exo 2"'],
    init(g, W, H) {
      const R = rng(2420);
      // low-poly sky: a triangle grid shaded from the gradient
      const sky = SH.canvas(W, H), k = sky.g, cols = ['#7FB7E3', '#A9CDEB', '#D6E2EC', '#F6DCC4', '#F9C9A4'];
      const skyAt = y => { const u = clamp(y / H) * (cols.length - 1), i = Math.min(cols.length - 2, Math.floor(u)); return mix(cols[i], cols[i + 1], u - i); };
      const sg = k.createLinearGradient(0, 0, 0, H); cols.forEach((c, i) => sg.addColorStop(i / (cols.length - 1), c));
      k.fillStyle = sg; k.fillRect(0, 0, W, H);
      const step = 120, rows = Math.ceil(H / (step * 0.87)) + 3, cw = Math.floor(W / step) + 4, pts = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cw; c++) pts.push([(c - 1) * step + (r % 2) * step * 0.5 + (R() - 0.5) * 50, (r - 1) * step * 0.87 + (R() - 0.5) * 40]);
      for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cw - 1; c++) {
        const a = pts[r * cw + c], b = pts[r * cw + c + 1], d = pts[(r + 1) * cw + c], e = pts[(r + 1) * cw + c + 1];
        if (!a || !b || !d || !e) continue;
        for (const tr of r % 2 ? [[a, b, e], [a, e, d]] : [[a, b, d], [b, e, d]]) {
          const cy = (tr[0][1] + tr[1][1] + tr[2][1]) / 3;
          k.fillStyle = mix(skyAt(cy), R() < 0.5 ? '#FFFFFF' : '#C8D6E8', R() * 0.12); k.strokeStyle = k.fillStyle; k.lineWidth = 1;
          k.beginPath(); k.moveTo(...tr[0]); k.lineTo(...tr[1]); k.lineTo(...tr[2]); k.closePath(); k.fill(); k.stroke();
        }
      }
      S.sky = sky.c;
      S.clouds = [[160, 560, 1.0], [800, 470, 0.8], [620, 700, 0.6]].map(([x, y, s], i) => ({ x, y, s, pts: Array.from({ length: 9 }, (_, q) => { const a = (q / 9) * Math.PI * 2; return [Math.cos(a) * (110 + R() * 40) * s, Math.sin(a) * (40 + R() * 14) * s - (Math.sin(a) < 0 ? 26 * s : 0)]; }) }));
      S.layer = SH.canvas(W, H);
      const title = (s, size) => SH.textSprite(s, size, { fam: 'Exo 2', wt: 800, col: '#1F2D4D', key: 'facet', pad: 0.4, paint: (q, w, h, bx, by, draw) => {
        q.save(); q.fillStyle = 'rgba(255,255,255,0.55)'; q.translate(4, 5); draw(); q.restore();
        q.save(); q.fillStyle = '#2B3F6B'; draw(); q.globalCompositeOperation = 'source-atop';                 // three flat facets across the letters
        q.fillStyle = '#22355C'; q.beginPath(); q.moveTo(0, by - size * 0.36); q.lineTo(w, by - size * 0.5); q.lineTo(w, h); q.lineTo(0, h); q.fill();
        q.fillStyle = '#1A2846'; q.beginPath(); q.moveTo(0, by - size * 0.1); q.lineTo(w, by - size * 0.2); q.lineTo(w, h); q.lineTo(0, h); q.fill(); q.restore();
      } });
      S.t1 = title('Dağlar nasıl', 110); S.t2 = title('oluşur?', 110);
      S.caps = [['Yer kabuğu dev', 'parçalardan oluşur'], ['Parçalar çok', 'yavaşça itişir'], ['Kara kırışır ve', 'yükselir: DAĞ!'], ['Bu iş milyonlarca', 'yıl sürer']].map(([a, b]) => [a, b].map(s => SH.textSprite(s, 46, { fam: 'Exo 2', wt: 700, col: '#FFFFFF' })));
      S.capTimes = [[0.7, 1.8], [1.9, 3.1], [3.2, 4.6], [4.7, 6.8]];
      S.capCol = ['#E55B3C', '#F0A030', '#5DA9E9', '#7BC67E'];
      S.lblTime = SH.textSprite('zaman', 36, { fam: 'Exo 2', wt: 700, col: '#1F2D4D' });
      S.lblMil = SH.textSprite('milyonlarca yıl', 36, { fam: 'Exo 2', wt: 700, col: '#1F2D4D' });
    },
    frame(g, t, W, H) {
      const s = t < 7.45 ? t : 0;                               // the story resets while the facets are collapsed
      g.drawImage(S.sky, 0, 0);
      for (const c of S.clouds) {                                // paper-flat clouds drifting (loop-safe)
        const x = c.x + 40 * Math.sin((2 * Math.PI * t) / 8 + c.y);
        g.fillStyle = 'rgba(255,255,255,0.92)'; g.beginPath(); c.pts.forEach(([px, py], i) => (i ? g.lineTo(x + px, c.y + py) : g.moveTo(x + px, c.y + py))); g.closePath(); g.fill();
        g.fillStyle = 'rgba(205,220,236,0.9)'; g.beginPath(); c.pts.forEach(([px, py], i) => { const yy = Math.max(c.y + 6, c.y + py); return i ? g.lineTo(x + px, yy) : g.moveTo(x + px, yy); }); g.closePath(); g.fill();
      }
      // soft shadow under the floating block
      g.save(); g.filter = 'blur(30px)'; g.fillStyle = 'rgba(40,50,80,0.22)'; g.beginPath(); g.ellipse(560, 1500, 420, 60, 0, 0, Math.PI * 2); g.fill(); g.restore();
      const { items, fold, cam } = buildScene(t, s);
      // shrink every facet to its centre and regrow (signature transition)
      const out = P(t, 6.85, 7.3), back = P(t, 7.45, 7.95);
      for (const it of items) {
        let k = 1;
        if (out > 0 || back > 0) {
          const cy = it.p.reduce((m, p) => m + p[1], 0) / it.p.length, d = SH.h01(2430, it.idx) * 0.35 + ((cy - 600) / 1000) * 0.3;
          k = back > 0 ? E.outQ(clamp(back * 1.6 - d)) : 1 - E.inQ(clamp(out * 1.6 - d));
          if (t >= 7.3 && t < 7.45) k = 0;
          if (k <= 0) continue;
        }
        let pts = it.p;
        if (k < 1) { const cx = pts.reduce((m, p) => m + p[0], 0) / pts.length, cy = pts.reduce((m, p) => m + p[1], 0) / pts.length; pts = pts.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]); }
        g.fillStyle = it.col; g.strokeStyle = it.col; g.lineWidth = 1.2; g.lineJoin = 'round';
        g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); g.stroke();
      }
      // the plate boundary glows before the push
      const kb = P(s, 0.7, 1.0) * (1 - P(s, 2.4, 3.0));
      if (kb > 0 && out <= 0) {
        g.save(); g.strokeStyle = `rgba(255,90,50,${(0.9 * kb).toFixed(3)})`; g.lineWidth = 7; g.shadowColor = '#FF5A32'; g.shadowBlur = 16; g.lineJoin = 'round';
        g.beginPath(); for (let j = 0; j <= 40; j++) { const z = lerp(Z0, Z1, j / 40), p = project([0, height(0, z, fold) + 0.04, z], cam); j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke(); g.restore();
      }
      // title and step captions
      SH.drawSprite(g, S.t1, 540, 236, { ax: 0.5 }); SH.drawSprite(g, S.t2, 540, 352, { ax: 0.5 });
      S.capTimes.forEach(([a, b], i) => {
        const k = E.outC(P(s, a, a + 0.25)) * (1 - E.inC(P(s, b, b + 0.2)));
        if (k <= 0) return;
        const [l1, l2] = S.caps[i], w = Math.max(l1.width, l2.width) + 150, x = 540 - w / 2, y = 420 + (1 - k) * 20;
        g.save(); g.globalAlpha = k;
        g.fillStyle = 'rgba(31,45,77,0.88)'; g.beginPath(); g.moveTo(x + 18, y); g.lineTo(x + w, y); g.lineTo(x + w, y + 112); g.lineTo(x, y + 112); g.lineTo(x, y + 18); g.closePath(); g.fill();
        g.fillStyle = S.capCol[i]; g.beginPath(); g.moveTo(x + 22, y + 26); g.lineTo(x + 76, y + 26); g.lineTo(x + 76, y + 86); g.lineTo(x + 22, y + 86); g.closePath(); g.fill();
        g.fillStyle = '#FFFFFF'; g.font = '800 40px "Exo 2"'; g.textAlign = 'center'; g.fillText(String(i + 1), x + 49, y + 70); g.textAlign = 'left';
        SH.drawSprite(g, l1, x + 104, y + 50); SH.drawSprite(g, l2, x + 104, y + 98);
        g.restore();
      });
      // time bar: how long the folding takes
      const kt = P(s, 1.9, 2.2) * (1 - P(s, 6.6, 6.85));
      if (kt > 0) {
        g.save(); g.globalAlpha = kt;
        const x0 = 170, x1 = 910, y = 1660;
        g.fillStyle = 'rgba(31,45,77,0.18)'; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.lineTo(x1 - 14, y + 22); g.lineTo(x0 - 14, y + 22); g.closePath(); g.fill();
        const xf = lerp(x0, x1, fold);
        g.fillStyle = '#F0A030'; g.beginPath(); g.moveTo(x0, y); g.lineTo(xf, y); g.lineTo(xf - 14, y + 22); g.lineTo(x0 - 14, y + 22); g.closePath(); g.fill();
        g.fillStyle = '#1F2D4D'; for (let i = 0; i <= 8; i++) g.fillRect(lerp(x0, x1, i / 8) - 1.5, y + 28, 3, 12);
        SH.drawSprite(g, S.lblTime, x0 - 14, y - 22);
        SH.drawSprite(g, S.lblMil, x1, y - 22, { ax: 1, alpha: P(s, 4.3, 4.7) });
        g.restore();
      }
    },
  });
})();
