# Künye · Google'da arayınca neler oluyor?

- **Görseller:** Tamamı `video.js` ile kodla çizildi (Canvas 2D; Kaleydo stil 17 · Doğa Defteri yardımcıları). Hazır görsel ya da logo kullanılmadı.
- **Sesler:** 72 ses olayı `tools/ses.py` ile kodla üretildi (filtrelenmiş gürültü, osilatörler, zarflar); zaman çizelgesi `cues.json`. Karışım −15,9 LUFS, tepe −1,3 dBFS. Müzik ve seslendirme yok.
- **Yazı tipleri:** Caveat ve Inter · SIL Open Font License 1.1 (`fonts/licenses`).
- **Not:** "Google" adı yalnızca konuyu anlatmak için yazıyla geçer; marka logosu ya da renkleri kullanılmadı.

Yeniden üretmek:

    python3 tools/ses.py karistir videos/google-arama/cues.json videos/google-arama/ses.wav
    node tools/render.cjs videos/google-arama/index.html --audio=videos/google-arama/ses.wav --out=videos/google-arama/final.mp4
