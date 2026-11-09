'use strict';
/* 09 · Pop-up Kitap — a pop-up book: the cover opens, cardstock layers stand up from the gutter
   (vertical scale from the hinge, darker while tilted, a shadow on the page), a pull-tab drives
   the action and labels hide under lift-the-flaps. The book closes again at the end of the loop. */
(() => {
  const { E, P, clamp, lerp, bump, rng, mix, darken, lighten, rgba } = SH;
  const C = {
    wall: '#E9DFCD', page: '#FBF6EA', pageD: '#E6DCC8', cover: '#2E5E4E', coverL: '#3F7A66', gold: '#E2B85B',
    soil: '#8A5A3B', soilD: '#6E452C', seed: '#C79A5B', root: '#F1E3C8', stem: '#5DA35A', leaf: '#7CC46B', leafD: '#4F9A55',
    trunk: '#8B5E3C', sun: '#F4B740', ink: '#2C2620', red: '#D2533F',
  };
  const S = {};
  const FOLD = 1330;                                       // gutter line where pop-ups are glued
  // a pop-up layer: drawn standing (k = 1) or folded flat (k = 0) about its base line
  function stand(g, k, baseY, fn, o = {}) {
    if (k <= 0.005) return;
    const sy = Math.sin((Math.PI / 2) * clamp(k));
    g.save();
    // its shadow on the page behind, longer while it rises
    g.save(); g.clip(S.backClip); g.translate(-22 * sy, -14 * sy); g.globalAlpha = 0.16 * sy; g.filter = 'blur(7px)'; fn(g, true); g.restore();
    g.translate(0, baseY); g.scale(1, sy); g.translate(0, -baseY);
    if (sy < 0.999) g.filter = `brightness(${(0.68 + 0.32 * sy).toFixed(3)})`;   // darker while still tilted
    fn(g, false);
    g.restore();
  }
  const piece = (g, path, color, sh, o = {}) => { if (sh) { g.fillStyle = '#000'; g.fill(path); } else SH.paper(g, path, { color, z: o.z ?? 3, seed: o.seed || 1, ew: 1.8, tex: 0.45 }); };
  function flapCard(text, n) {
    const t = SH.textSprite(text, 58, { fam: 'DM Sans', wt: 700, col: C.ink }), nn = SH.textSprite(String(n), 50, { fam: 'DM Serif Display', wt: 400, col: C.page });
    return { t, nn, w: t.width + 150, h: 104 };
  }

  SH.register({
    id: '09', w: 1080, h: 1920, duration: 8, fps: 30, poster: 6.0,
    fonts: ['400 80px "DM Serif Display"', '700 80px "DM Sans"', '500 80px "DM Sans"'],
    init(g, W, H) {
      const bg = SH.canvas(W, H), b = bg.g, gr = b.createRadialGradient(540, 900, 200, 540, 1100, 1300);
      gr.addColorStop(0, '#F3EADA'); gr.addColorStop(1, C.wall); b.fillStyle = gr; b.fillRect(0, 0, W, H);
      b.globalCompositeOperation = 'soft-light'; b.globalAlpha = 0.6; b.fillStyle = b.createPattern(SH.grain(512, 90), 'repeat'); b.fillRect(0, 0, W, H);
      S.bg = bg.c;
      S.pageL = SH.pathFrom(SH.polyPts([[540, FOLD], [70, FOLD - 30], [36, 1720], [540, 1760]], 1, { sp: 10, jit: 0.4 }));
      S.pageR = SH.pathFrom(SH.polyPts([[540, FOLD], [1010, FOLD - 30], [1044, 1720], [540, 1760]], 2, { sp: 10, jit: 0.4 }));
      S.cover = SH.pathFrom(SH.rrect(40, FOLD - 40, 1000, 440, 16, 3, { jit: 0.4 }));
      S.back = SH.pathFrom(SH.polyPts([[64, FOLD - 600], [1016, FOLD - 600], [1016, FOLD], [64, FOLD]], 7, { sp: 10, jit: 0.4 }));
      S.backClip = new Path2D(); S.backClip.rect(64, FOLD - 600, 952, 600);
      S.clouds = [[260, 900, 110, 40], [760, 1010, 90, 34]].map(([x, y, rx, ry], i) => SH.pathFrom(SH.blob(x, y, rx, ry, 80 + i, { bumps: [7, 0.2], wob: 0.04 })));
      S.soil = SH.pathFrom([[150, FOLD], ...SH.catmullPts([[150, 1110], [330, 1090], [540, 1105], [760, 1088], [930, 1112]], 40), [930, FOLD]]);
      S.seed = SH.pathFrom(SH.blob(540, 1215, 34, 22, 5, { wob: 0.05 }));
      S.trunk = SH.pathFrom(SH.polyPts([[505, FOLD], [520, 900], [560, 900], [575, FOLD]], 6, { sp: 8, jit: 0.6 }));
      S.can = [[540, 760, 300, 210, C.leafD], [540, 700, 250, 180, C.stem], [540, 640, 190, 140, C.leaf]].map(([x, y, rx, ry, col], i) => ({ p: SH.pathFrom(SH.blob(x, y, rx, ry, 10 + i, { bumps: [10, 0.12], wob: 0.04 })), col }));
      S.sun = SH.pathFrom(SH.blob(880, 560, 80, 80, 20, { bumps: [12, 0.08], wob: 0.01 }));
      S.tab = SH.pathFrom(SH.polyPts([[0, -34], [120, -34], [150, 0], [120, 34], [0, 34]], 30, { sp: 6, jit: 0.4 }));
      S.tabT = SH.textSprite('ÇEK', 36, { fam: 'DM Sans', wt: 700, col: C.page });
      S.t1 = SH.textSprite('Tohum nasıl', 120, { fam: 'DM Serif Display', wt: 400, col: C.ink });
      S.t2 = SH.textSprite('ağaç olur?', 120, { fam: 'DM Serif Display', wt: 400, col: C.cover });
      S.coverT = SH.textSprite('Tohum', 110, { fam: 'DM Serif Display', wt: 400, col: C.gold });
      S.flaps = ['Filizlenir', 'Fidan olur', 'Ağaç olur'].map((s, i) => flapCard(s, i + 1));
    },
    frame(g, t, W, H) {
      g.drawImage(S.bg, 0, 0);
      const open = E.ioC(P(t, 0.15, 0.9)) * (1 - E.ioC(P(t, 7.45, 8.0)));      // book opens, then closes for the loop
      const fold = (a, b) => E.outBack(P(t, a, b), 1.4) * (1 - E.ioC(P(t, 7.1, 7.55)));
      SH.softShadow(g, 540, 1745, 560, 60, 0.28);
      // spread
      if (open > 0.02) {
        g.save(); g.globalAlpha = Math.min(1, open * 3);
        SH.paper(g, S.pageL, { color: C.page, z: 2, seed: 3, shade: gg => { const gr = gg.createLinearGradient(540, 0, 70, 0); gr.addColorStop(0, 'rgba(90,70,40,0.28)'); gr.addColorStop(0.25, 'rgba(90,70,40,0)'); gg.fillStyle = gr; gg.fillRect(0, 1200, 1080, 600); } });
        SH.paper(g, S.pageR, { color: C.page, z: 2, seed: 4, shade: gg => { const gr = gg.createLinearGradient(540, 0, 1010, 0); gr.addColorStop(0, 'rgba(90,70,40,0.28)'); gr.addColorStop(0.25, 'rgba(90,70,40,0)'); gg.fillStyle = gr; gg.fillRect(0, 1200, 1080, 600); } });
        g.strokeStyle = 'rgba(120,100,70,0.35)'; g.lineWidth = 2; for (let i = 1; i <= 4; i++) { g.beginPath(); g.moveTo(40 + i * 3, 1722 + i * 6); g.lineTo(540, 1762 + i * 6); g.lineTo(1040 - i * 3, 1722 + i * 6); g.stroke(); }
        g.restore();
      }
      // the back page stands up as the book opens (90°): a painted sky page behind the pop-ups
      if (open > 0.02) {
        stand(g, open, FOLD, (gg, sh) => {
          if (sh) return;
          SH.paper(gg, S.back, { color: '#EAF3F4', z: 2, seed: 8, shade: q => { const gr = q.createLinearGradient(0, FOLD - 600, 0, FOLD); gr.addColorStop(0, 'rgba(120,175,205,0.45)'); gr.addColorStop(1, 'rgba(120,175,205,0)'); q.fillStyle = gr; q.fillRect(0, FOLD - 600, 1080, 600); const gs = q.createLinearGradient(0, FOLD - 60, 0, FOLD); gs.addColorStop(0, 'rgba(90,70,40,0)'); gs.addColorStop(1, 'rgba(90,70,40,0.22)'); q.fillStyle = gs; q.fillRect(0, FOLD - 60, 1080, 60); } });
          S.clouds.forEach((cp, i) => SH.paper(gg, cp, { color: '#FFFFFF', z: 2, seed: 81 + i }));
        });
      }
      // pop-ups (back to front): sun, tree, soil panel with seed and roots, sprout
      stand(g, fold(4.3, 4.9) * open, 1140, (gg, sh) => piece(gg, S.sun, C.sun, sh, { seed: 21 }));
      if (t > 4.0) {
        stand(g, fold(4.0, 4.6) * open, FOLD, (gg, sh) => piece(gg, S.trunk, C.trunk, sh, { seed: 22 }));
        S.can.forEach((c2, i) => stand(g, fold(4.3 + i * 0.25, 4.9 + i * 0.25) * open, FOLD - 380 + i * 30, (gg, sh) => piece(gg, c2.p, c2.col, sh, { seed: 23 + i, z: 4 })));
      }
      stand(g, fold(0.5, 1.1) * open, FOLD, (gg, sh) => {
        piece(gg, S.soil, C.soil, sh, { seed: 30 });
        if (sh) return;
        const crack = P(t, 1.4, 1.7), root = E.outC(P(t, 1.5, 2.6));
        SH.paper(gg, S.seed, { color: C.seed, z: 2, seed: 31 });
        if (crack > 0) { gg.strokeStyle = C.soilD; gg.lineWidth = 3; gg.beginPath(); gg.moveTo(530, 1200); gg.lineTo(540, 1214); gg.lineTo(552, 1205); gg.stroke(); }
        if (root > 0) {
          gg.strokeStyle = C.root; gg.lineCap = 'round';
          for (const [dx, len, w] of [[0, 90, 7], [-30, 60, 4], [28, 66, 4]]) {
            const pts = SH.partial(SH.thruPts([540 + dx * 0.2, 1232], [540 + dx * 0.8, 1232 + len * 0.5], [540 + dx * 1.6, 1232 + len], 12), root);
            gg.lineWidth = w; gg.beginPath(); pts.forEach((p, i) => (i ? gg.lineTo(p[0], p[1]) : gg.moveTo(p[0], p[1]))); gg.stroke();
          }
        }
      });
      // sprout grows (driven by the pull-tab), becomes a sapling
      const sprout = E.outC(P(t, 1.6, 2.6)), sap = E.ioC(P(t, 2.7, 3.8)), hide = P(t, 4.2, 4.6);
      if (sprout > 0 && hide < 1) {
        const h = lerp(0, 150, sprout) + lerp(0, 230, sap), top = 1195 - h;
        g.save(); g.globalAlpha = (1 - hide) * Math.min(1, open * 2);
        SH.paper(g, SH.pathFrom(SH.strip([[540, 1200], [544, (1200 + top) / 2], [540, top]], 12 + sap * 8, 9 + sap * 6, 40)), { color: C.stem, z: 3, seed: 41 });
        const leaf = (x, y, a, s) => { g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s); SH.paper(g, SH.pathFrom(SH.lobe(90, 50, 42, { a: 0.9 })), { color: C.leaf, z: 3, seed: 42 }); g.restore(); };
        leaf(540, top + 10, -1.0, sprout); leaf(540, top + 10, 1.0, sprout);
        if (sap > 0) { leaf(542, top + 120, -1.2, sap); leaf(540, top + 170, 1.15, sap * 0.9); }
        g.restore();
      }
      // pull-tab at the right page edge
      if (open > 0.6) {
        const pull = E.ioC(P(t, 1.0, 1.6)) * (1 - P(t, 6.8, 7.2));
        g.save(); g.translate(880 + pull * 70, 1560);
        SH.paper(g, S.tab, { color: C.red, z: 3, seed: 50 }); SH.drawSprite(g, S.tabT, 54, 13, { ax: 0.5 });
        g.restore();
      }
      // lift-the-flap labels on the left page
      [[1.9, 2.8], [2.9, 4.2], [4.9, 9]].forEach(([a, b2], i) => {
        const k = E.outBack(P(t, a, a + 0.45), 1.4) * (1 - P(t, b2, b2 + 0.25)) * (1 - P(t, 7.1, 7.4));
        if (k <= 0.01) return;
        const F = S.flaps[i], x = 300, y = 1560;
        g.save(); g.translate(x, y); g.scale(1, Math.max(0.02, k)); g.translate(-F.w / 2, -F.h / 2);
        SH.paper(g, SH.pathFrom(SH.rrect(0, 0, F.w, F.h, 14, 60 + i)), { color: C.page, z: 4, seed: 60 + i });
        g.fillStyle = C.cover; g.beginPath(); g.arc(56, F.h / 2, 34, 0, Math.PI * 2); g.fill();
        SH.drawSprite(g, F.nn, 56, F.h / 2 + 18, { ax: 0.5 }); SH.drawSprite(g, F.t, 104, F.h / 2 + 20);
        g.restore();
      });
      // closed cover (start and end of the loop) flips open around the spine
      if (open < 0.999) {
        const sx = Math.cos(open * Math.PI);
        g.save(); g.translate(540, 0); g.scale(sx, 1); g.translate(-540, 0);
        SH.paper(g, S.cover, { color: sx > 0 ? C.cover : C.coverL, z: 6, seed: 70 });
        if (sx > 0.2) SH.drawSprite(g, S.coverT, 540, FOLD + 200, { ax: 0.5, alpha: (sx - 0.2) / 0.8 });
        g.restore();
      }
      // title
      const tk = E.outC(P(t, 0.6, 1.1)) * (1 - E.inC(P(t, 7.3, 7.8)));
      SH.drawSprite(g, S.t1, 540, 300 + (1 - tk) * 30, { ax: 0.5, alpha: tk });
      SH.drawSprite(g, S.t2, 540, 430 + (1 - tk) * 30, { ax: 0.5, alpha: tk });
    },
  });
})();
