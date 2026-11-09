'use strict';
/* Video şablonu: bu klasörü videos/<konu>/ olarak kopyala, sonra bu dosyayı seçtiğin stilin rehberine göre doldur.
   Kurallar: her şey t'ye bağlı (window.seek), rastgelelik yalnızca SH.rng / SH.h01 ile, dokular init'te bir kez çizilir.
   Önizleme:  python3 -m http.server  →  http://localhost:8000/videos/<konu>/?play
   Kareler:   node tools/render.cjs videos/<konu>/index.html --stills=1,4,8
   Video:     node tools/render.cjs videos/<konu>/index.html --audio=videos/<konu>/ses.wav --out=videos/<konu>/final.mp4 */
(() => {
  const { E, P, clamp, lerp } = SH;
  const C = { bg: '#F4EFE6', ink: '#1F1B16', accent: '#E2552C', sun: '#F2B33D' };
  const S = {};
  const BEATS = [                                              // zaman çizelgesi: [başlangıç, bitiş, alt yazı]
    [0.0, 3.0, 'Güneş neden parlar?'],
    [3.0, 6.5, 'Çok sıcak gazlardan oluşur'],
    [6.5, 10.0, 'Işığı bize 8 dakikada ulaşır'],
  ];

  SH.register({
    id: 'video', w: 1080, h: 1920, duration: 10, fps: 30, poster: 5,
    fonts: ['800 80px "Bricolage Grotesque"', '600 80px "Inter"'],
    init(g, W, H) {
      const pp = SH.canvas(W, H);
      pp.g.fillStyle = C.bg; pp.g.fillRect(0, 0, W, H);
      pp.g.globalCompositeOperation = 'soft-light'; pp.g.globalAlpha = 0.6;
      pp.g.fillStyle = pp.g.createPattern(SH.grain(512, 7), 'repeat'); pp.g.fillRect(0, 0, W, H);
      S.paper = pp.c;
      S.caps = BEATS.map(([, , s]) => SH.textSprite(s, 64, { fam: 'Inter', wt: 600, col: C.ink }));
      S.title = SH.textSprite('Güneş', 150, { fam: 'Bricolage Grotesque', wt: 800, col: C.ink });
    },
    frame(g, t, W, H) {
      g.drawImage(S.paper, 0, 0);
      const k = E.outBack(P(t, 0.2, 0.9), 1.6);                  // güneş büyüyerek gelir, sonra nefes alır
      if (k > 0) {
        const r = 190 * k * (1 + 0.03 * Math.sin(t * 3));
        g.fillStyle = C.sun; g.beginPath(); g.arc(W / 2, 820, r, 0, Math.PI * 2); g.fill();
      }
      SH.drawSprite(g, S.title, W / 2, 420, { ax: 0.5, alpha: clamp(P(t, 0.1, 0.5)) });
      BEATS.forEach(([a, b], i) => {                              // her alt yazı kayarak gelir, sonraki gelmeden çıkar
        const kin = E.outC(P(t, a + 0.15, a + 0.5)), kout = E.inC(P(t, b - 0.3, b));
        if (kin <= 0 || kout >= 1) return;
        SH.drawSprite(g, S.caps[i], W / 2, 1320 + 30 * (1 - kin), { ax: 0.5, alpha: kin * (1 - kout) });
      });
    },
  });
})();
