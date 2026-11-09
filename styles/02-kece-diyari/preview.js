'use strict';
/* 02 · Keçe Diyarı — a felt quiet-book page. Every piece is pre-cut once into a sprite: fill,
   wool-fibre texture, fuzzy halo of loose fibres, puffy inner shading and a running stitch.
   Pieces move on a 12 fps stop-motion clock; type sits on stitched felt tags. */
(() => {
  const { E, P, clamp, lerp, bump, rng, mix, darken, lighten, rgba, stepT } = SH;
  const C = {
    sky: '#BFD7DF', grass: '#8DBE7A', grassD: '#6FA867', leaf: '#5E9B57', branch: '#8B6A4E', sun: '#F2C14E',
    cream: '#F4E9D8', brown: '#4A3428', cater: '#7CB65A', caterD: '#5E9B45', dots: '#F2C14E', pod: '#A8C97A',
    wingA: '#E8834E', wingB: '#F2C14E', spot: '#5B8BC9', white: '#FFF8EE', thread: '#FFF4E0', red: '#D9594C',
  };
  const S = {};
  let FIB = null;

  function fibreTexture(size, seed) {                  // short curly wool strands on mid-grey
    const { c, g } = SH.canvas(size, size), R = rng(seed);
    g.fillStyle = '#808080'; g.fillRect(0, 0, size, size);
    g.lineCap = 'round';
    for (let i = 0; i < 9000; i++) {
      const x = R() * size, y = R() * size, a = R() * Math.PI * 2, L = 3 + R() * 9, light = R() < 0.5;
      g.strokeStyle = light ? `rgba(255,255,255,${(0.08 + R() * 0.2).toFixed(3)})` : `rgba(0,0,0,${(0.06 + R() * 0.16).toFixed(3)})`;
      g.lineWidth = 0.6 + R() * 0.9;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 1) * L * 0.6, y + Math.sin(a + 1) * L * 0.6, x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke();
    }
    return c;
  }
  function outlineNormals(pts) {
    const n = pts.length;
    return pts.map((p, i) => {
      const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
      let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const L = Math.hypot(nx, ny) || 1;
      return [nx / L, ny / L];
    });
  }
  // cut one felt piece (points in local coords) into a sprite
  function feltPiece(pts, color, seed, o = {}) {
    const R = rng(seed), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), pad = 26;
    const x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad, x1 = Math.max(...xs) + pad, y1 = Math.max(...ys) + pad;
    const { c, g } = SH.canvas(x1 - x0, y1 - y0);
    g.translate(-x0, -y0);
    const path = SH.pathFrom(pts);
    g.fillStyle = color; g.fill(path);
    g.save(); g.clip(path);
    g.globalCompositeOperation = 'soft-light'; g.globalAlpha = 0.95;
    g.fillStyle = g.createPattern(FIB, 'repeat'); g.fillRect(x0, y0, x1 - x0, y1 - y0);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.shadowColor = 'rgba(40,25,15,0.35)'; g.shadowBlur = 14; g.lineWidth = 10; g.strokeStyle = 'rgba(40,25,15,0.35)'; g.stroke(path);   // puffy inner edge
    g.restore();
    // fuzzy halo: loose fibres crossing the cut edge
    const nrm = outlineNormals(pts), res = SH.resample(pts.concat([pts[0]]), 2.6);
    g.lineCap = 'round';
    for (let i = 0; i < res.length; i++) {
      const p = res[i], k = Math.min(nrm.length - 1, Math.floor((i / res.length) * nrm.length)), [nx, ny] = nrm[k];
      for (let j = 0; j < 2; j++) {
        const L = 2 + R() * 6, a = Math.atan2(ny, nx) + (R() - 0.5) * 1.6, sx = p[0] - nx * R() * 3, sy = p[1] - ny * R() * 3;
        g.strokeStyle = R() < 0.5 ? lighten(color, 0.25) : darken(color, 0.15); g.globalAlpha = 0.45 + R() * 0.4; g.lineWidth = 0.7 + R() * 0.8;
        g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.cos(a) * L, sy + Math.sin(a) * L); g.stroke();
      }
    }
    g.globalAlpha = 1;
    if (o.stitch !== false) stitches(g, pts, nrm, o.inset ?? 10, o.thread || C.thread, seed + 1, o.stitchLen);
    if (o.extra) o.extra(g);
    return { c, x0, y0 };
  }
  function stitches(g, pts, nrm, inset, col, seed, len = 10) {   // running stitch along an inset outline
    const inner = pts.map((p, i) => [p[0] - nrm[i][0] * inset, p[1] - nrm[i][1] * inset]);
    stitchLine(g, inner.concat([inner[0]]), col, seed, len);
  }
  function stitchLine(g, line, col, seed, len = 10, gap = 7, w = 3.4) {
    const R = rng(seed), res = SH.resample(line, 1.5);
    let acc = 0, on = true, start = null;
    g.lineCap = 'round';
    for (let i = 1; i < res.length; i++) {
      acc += 1.5;
      if (on && !start) start = res[i - 1];
      if (on && acc >= len) {
        const a = start, b = res[i], j = (R() - 0.5) * 1.2;
        g.strokeStyle = 'rgba(30,20,10,0.35)'; g.lineWidth = w + 1; g.beginPath(); g.moveTo(a[0] + 1, a[1] + 1.5); g.lineTo(b[0] + 1, b[1] + 1.5); g.stroke();
        g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(a[0], a[1] + j); g.lineTo(b[0], b[1] - j); g.stroke();
        acc = 0; on = false; start = null;
      } else if (!on && acc >= gap) { acc = 0; on = true; }
    }
  }
  function put(g, sp, x, y, o = {}) {                  // place a felt sprite with its thick-felt shadow
    if (!sp || (o.s ?? 1) <= 0.001) return;
    g.save(); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale((o.sx ?? 1) * (o.s ?? 1), (o.sy ?? 1) * (o.s ?? 1));
    if (o.alpha !== undefined) g.globalAlpha = o.alpha;
    g.shadowColor = 'rgba(35,45,40,0.32)'; g.shadowBlur = 10 + (o.lift || 0) * 2; g.shadowOffsetX = 2 + (o.lift || 0) * 0.6; g.shadowOffsetY = 4 + (o.lift || 0);
    g.drawImage(sp.c, sp.x0, sp.y0);
    g.restore();
  }
  const circle = (r, seed) => SH.blob(0, 0, r, r, seed, { wob: 0.03, jit: 0.4 });
  function button(r, color, seed) {                    // sewing button with four holes and thread
    return feltPiece(circle(r, seed), color, seed, {
      stitch: false, extra: g => {
        g.fillStyle = darken(color, 0.25);
        for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { g.beginPath(); g.arc(dx * r * 0.22, dy * r * 0.22, r * 0.11, 0, Math.PI * 2); g.fill(); }
        g.strokeStyle = C.thread; g.lineWidth = r * 0.07; g.lineCap = 'round';
        g.beginPath(); g.moveTo(-r * 0.22, -r * 0.22); g.lineTo(r * 0.22, r * 0.22); g.moveTo(r * 0.22, -r * 0.22); g.lineTo(-r * 0.22, r * 0.22); g.stroke();
        g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = r * 0.1; g.beginPath(); g.arc(0, 0, r * 0.78, 3.6, 4.6); g.stroke();
      },
    });
  }
  const tagText = (s, size, col = C.brown) => SH.textSprite(s, size, { fam: 'Baloo 2', wt: 800, col });
  function tag(text, seed) {                           // stitched felt label
    const sp = tagText(text, 56), w = sp.width + 124, h = 104;
    const pts = SH.rrect(-w / 2, -h / 2, w, h, 26, seed, { jit: 0.8 });
    return { sp: feltPiece(pts, C.cream, seed, { inset: 9, thread: C.red }), text: sp, w };
  }
  function putTag(g, T, x, y, k, rot) {
    if (k <= 0) return;
    const e = SH.spring(clamp(k), 1.1, 6);
    put(g, T.sp, x, y - (1 - e) * 60, { rot, s: 1, alpha: clamp(k * 6) });
    g.save(); g.translate(x, y - (1 - e) * 60); g.rotate(rot); SH.drawSprite(g, T.text, 30, 20, { ax: 0.5, alpha: clamp(k * 6) }); g.restore();
  }

  SH.register({
    id: '02', w: 1080, h: 1920, duration: 8, fps: 30, poster: 6.2,
    fonts: ['800 80px "Baloo 2"', '700 80px "Baloo 2"'],
    init(g, W, H) {
      FIB = fibreTexture(512, 202);
      // background page: felt sky, felt hills, a stitched sun
      const bg = SH.canvas(W, H), b = bg.g;
      const sky = feltPiece(SH.rrect(0, 0, W, H, 1, 1, { jit: 0 }), C.sky, 3, { stitch: false });
      b.drawImage(sky.c, sky.x0, sky.y0);
      const hill1 = feltPiece([[-60, 1500], ...SH.catmullPts([[-60, 1500], [260, 1420], [600, 1470], [900, 1400], [1140, 1440]], 40), [1140, 2000], [-60, 2000]], C.grass, 5, { inset: 12 });
      const hill2 = feltPiece([[-60, 1660], ...SH.catmullPts([[-60, 1660], [300, 1600], [700, 1650], [1140, 1590]], 40), [1140, 2000], [-60, 2000]], C.grassD, 6, { inset: 12 });
      [hill1, hill2].forEach(h => { b.save(); b.shadowColor = 'rgba(35,45,40,0.3)'; b.shadowBlur = 12; b.shadowOffsetY = 4; b.drawImage(h.c, h.x0, h.y0); b.restore(); });
      S.bg = bg.c;
      S.sun = feltPiece(circle(86, 20), C.sun, 20, { inset: 12, thread: '#FFF3C4' });
      S.cloud = feltPiece(SH.blob(0, 0, 150, 58, 21, { bumps: [7, 0.18], wob: 0.04 }), C.white, 21, { inset: 11, thread: '#CFE0E6' });
      S.banner = feltPiece(SH.rrect(-470, -105, 940, 210, 40, 30, { jit: 1 }), C.cream, 30, { inset: 14, thread: C.red });
      S.t1 = tagText('Tırtıl nasıl', 92); S.t2 = tagText('kelebek olur?', 92, C.red);
      S.branch = feltPiece(SH.strip(SH.catmullPts([[-80, 820], [300, 860], [640, 830], [1160, 880]], 30), 46, 34, 40, { wob: 0.04 }), C.branch, 40, { inset: 8, thread: '#C8A47E' });
      const leafPts = SH.lobe(520, 250, 41, { a: 0.85, tip: 0.85 }).map(([x, y]) => [-y - 20, x]);
      S.leaf = feltPiece(leafPts, C.leaf, 41, {
        inset: 12, extra: g => { stitchLine(g, [[0, 0], [160, -6], [330, 4], [480, 0]], '#CFE6B8', 42, 12, 6, 3.6); for (const x of [120, 240, 360]) { stitchLine(g, [[x, -3], [x + 70, -70]], '#CFE6B8', 43 + x, 9, 6, 3); stitchLine(g, [[x, 3], [x + 70, 70]], '#CFE6B8', 44 + x, 9, 6, 3); } },
      });
      S.seg = [0, 1].map(k => feltPiece(circle(40, 50 + k), k ? C.cater : C.caterD, 50 + k, { inset: 9, thread: C.dots, stitchLen: 7 }));
      S.head = feltPiece(circle(46, 55), C.cater, 55, { inset: 9, thread: C.dots });
      S.eye = button(15, C.brown, 56);
      S.pom = feltPiece(circle(11, 57), C.red, 57, { stitch: false });
      S.pod = feltPiece(SH.lobe(200, 110, 60, { a: 1.3, tip: 0.6 }).map(([x, y]) => [x, -y]), C.pod, 60, { inset: 12, thread: '#E6F2C9' });
      const wingUp = SH.blob(0, 0, 120, 92, 70, { wob: 0.05, rot: -0.5 }).map(([x, y]) => [x + 100, y - 60]);
      const wingLo = SH.blob(0, 0, 80, 66, 71, { wob: 0.05, rot: 0.6 }).map(([x, y]) => [x + 70, y + 60]);
      const spots = (cx, cy, r, col) => g => { g.fillStyle = col; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill(); g.fillStyle = C.white; g.beginPath(); g.arc(cx + r * 0.25, cy - r * 0.2, r * 0.32, 0, Math.PI * 2); g.fill(); };
      S.wUp = feltPiece(wingUp, C.wingA, 72, { inset: 12, thread: C.wingB, extra: spots(120, -66, 30, C.spot) });
      S.wLo = feltPiece(wingLo, C.wingB, 73, { inset: 10, thread: C.wingA, extra: spots(78, 64, 20, C.spot) });
      S.body = feltPiece(SH.blob(0, 0, 22, 92, 74, { wob: 0.04 }), C.brown, 74, { inset: 7, thread: C.wingB, stitchLen: 7 });
      S.tags = [tag('Tırtıl yaprak yer', 80), tag('Koza örer', 81), tag('Kelebek olur!', 82)];
      S.nums = [1, 2, 3].map(n => ({ b: feltPiece(circle(50, 90 + n), [C.red, C.spot, C.wingA][n - 1], 90 + n, { inset: 8, thread: C.white, stitchLen: 7 }), t: tagText(String(n), 58, C.white) }));
      S.page = feltPiece(SH.rrect(0, 0, W, H, 1, 99, { jit: 0 }), C.sky, 99, { stitch: false });
      S.vig = SH.vignette(W, H, 0.18, '30,40,40');
      const R = rng(7);
      S.trail = SH.catmullPts([[700, 930], [800, 830], [760, 720], [860, 650], [980, 610], [1160, 570]], 60);
      S.wob = Array.from({ length: 20 }, () => R());
    },
    frame(g, t, W, H) {
      g.drawImage(S.bg, 0, 0);
      const ts = stepT(t, 12);                         // stop-motion clock for the puppets
      const boil = (i, a = 1) => (SH.h01(i, Math.floor(ts * 12)) - 0.5) * a;
      put(g, S.sun, 900, 560, { s: E.outBack(P(ts, 0.4, 0.9), 1.6), rot: ts * 0.1 });
      put(g, S.cloud, 230 + Math.sin(ts * 0.6) * 10, 600, { s: E.outBack(P(ts, 0.55, 1.0), 1.6) });
      // title banner drops in and sways like a hung felt sign
      const bk = SH.spring(P(t, 0.05, 0.7), 1.1, 5.5);
      if (bk > 0) {
        const rot = (1 - Math.min(1, bk)) * 0.12 + 0.012 * Math.sin(t * 2.2);
        put(g, S.banner, 540, 300 - (1 - bk) * 420, { rot, lift: 2 });
        g.save(); g.translate(540, 300 - (1 - bk) * 420); g.rotate(rot);
        SH.drawSprite(g, S.t1, 0, -10, { ax: 0.5 }); SH.drawSprite(g, S.t2, 0, 80, { ax: 0.5 });
        g.restore();
      }
      // branch and leaf slide in (the story group is drawn 30 % larger around a pivot)
      g.save(); g.translate(540, 960); g.scale(1.3, 1.3); g.translate(-540, -930);
      const bx = (1 - E.outC(P(ts, 0.5, 1.1))) * -900;
      put(g, S.branch, bx, 0, { lift: 1 });
      put(g, S.leaf, 230 + bx, 1040, { rot: 0.02 + boil(1, 0.01), lift: 1 });
      // 1 · the caterpillar munches along the leaf (inchworm humps)
      const crawl = P(ts, 1.1, 3.0), gather = P(ts, 3.0, 3.7);
      if (ts > 1.0 && gather < 1) {
        const hx = lerp(380, 640, E.ioS(crawl)), base = 1040;
        for (let i = 5; i >= 0; i--) {
          const sx = hx - i * 46 + Math.sin(ts * 9 - i * 0.9) * 6, sy = base - 24 - Math.max(0, Math.sin(ts * 9 - i * 0.9)) * 22;
          const tx = lerp(sx, 700, E.inC(gather)), ty = lerp(sy, 900, E.inC(gather));
          put(g, i === 0 ? S.head : S.seg[i % 2], tx, ty, { s: (i === 0 ? 1 : 0.9 + (i % 2) * 0.06) * (1 - gather * 0.75), rot: boil(10 + i, 0.08) });
          if (i === 0 && gather < 0.4) {
            put(g, S.eye, tx + 14, ty - 10, { s: 1 - gather });
            for (const [dx, a] of [[-6, -1.9], [16, -1.3]]) {
              const ex = tx + dx + Math.cos(a) * 52, ey = ty - 30 + Math.sin(a) * 52;
              g.save(); g.strokeStyle = C.brown; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(tx + dx, ty - 30); g.lineTo(ex, ey); g.stroke(); g.restore();
              put(g, S.pom, ex, ey, { s: 1 - gather });
            }
          }
        }
      }
      // 2 · the chrysalis hangs from the branch, wiggles, opens
      const podIn = E.outBack(P(ts, 3.4, 3.9), 1.4), open = P(ts, 4.6, 5.2);
      if (podIn > 0 && open < 1) {
        g.save(); g.strokeStyle = C.thread; g.lineWidth = 3; g.beginPath(); g.moveTo(700, 846); g.lineTo(700, 880); g.stroke(); g.restore();
        put(g, S.pod, 700, 876, { s: podIn * (1 - open * 0.6), rot: Math.sin(ts * 16) * 0.08 * bump(P(ts, 4.0, 4.6)), sx: 1 + open * 0.4, alpha: 1 - open });
      }
      // 3 · the butterfly unfolds and flies off on a stitched trail
      const unfold = E.outBack(P(ts, 4.8, 5.5), 1.5);
      if (unfold > 0) {
        const fly = E.ioS(P(t, 5.6, 7.4)), p = SH.catmull(S.trail, fly), flap = 0.55 + 0.45 * Math.abs(Math.cos(ts * 9));
        if (fly > 0) { g.save(); stitchLine(g, SH.partial(S.trail, fly * 0.98), C.red, 5, 12, 9, 4); g.restore(); }
        const x = fly > 0 ? p[0] : 700, y = fly > 0 ? p[1] : 930;
        for (const side of [-1, 1]) {
          put(g, S.wUp, x, y, { sx: side * unfold * (fly > 0 ? flap : 1), sy: unfold, lift: 3 });
          put(g, S.wLo, x, y, { sx: side * unfold * (fly > 0 ? flap : 1), sy: unfold, lift: 3 });
        }
        put(g, S.body, x, y, { s: Math.min(1, unfold * 1.2), lift: 4 });
      }
      g.restore();
      // labels: numbered buttons + stitched tags
      const lab = [[1.5, 470, 1390, -0.03], [3.7, 470, 1390, 0.03], [5.4, 500, 1390, -0.03]];
      lab.forEach(([t0, x, y, rot], i) => {
        const k = P(t, t0, t0 + 0.45), out = P(t, i < 2 ? lab[i + 1][0] - 0.25 : 9, i < 2 ? lab[i + 1][0] + 0.05 : 10);
        if (k <= 0 || out >= 1) return;
        const kk = k * (1 - out), T = S.tags[i], bxp = x - T.w / 2 + 6;
        putTag(g, T, x, y, kk, rot);
        const be = E.outBack(clamp((kk - 0.25) * 1.6), 2.2);
        put(g, S.nums[i].b, bxp, y - 4, { s: be, rot: -0.2, lift: 2 });
        if (be > 0.3) SH.drawSprite(g, S.nums[i].t, bxp, y + 14, { ax: 0.5, alpha: clamp((be - 0.3) * 3) });
      });
      // loop: the quiet-book page turns over the scene, hinged on the right edge
      const pk = P(t, 7.15, 8.0);
      if (pk > 0) {
        const e = E.ioC(pk), w = W * Math.sin((Math.PI / 2) * e);
        g.save();
        g.shadowColor = 'rgba(30,40,40,0.4)'; g.shadowBlur = 40; g.shadowOffsetX = -14;
        g.drawImage(S.page.c, 0, 0, W, H, W - w, 0, w, H);
        g.shadowColor = 'transparent';
        g.fillStyle = `rgba(20,30,30,${(0.25 * (1 - e)).toFixed(3)})`; g.fillRect(W - w, 0, w, H);
        g.restore();
      }
      g.drawImage(S.vig, 0, 0);
    },
  });
})();
