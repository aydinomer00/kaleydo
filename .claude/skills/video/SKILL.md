---
name: video
description: Kaleydo deposundaki 25 görsel stilden biriyle çocuklar için kısa bir doğa/bilim videosu (MP4) üretir. "17 numaralı stille 'Karıncalar yolu nasıl bulur?' videosu yap", "kum masası stilinde 30 saniyelik video", "/video 03 Salyangoz evini neden taşır?", "make a video in style 12 about tulips" gibi isteklerde kullan.
---

# Kaleydo ile video üretmek

Kullanıcı bir **stil** (numara ya da ad) ve bir **konu** verir. Gerisini depodaki rehberlere göre sen yaparsın. Eksik bilgi için şu varsayılanları kullan, sormana gerek yok:

| Ayar | Varsayılan |
|---|---|
| Süre | 25 sn (konu metninde süre yazıyorsa o geçerli) |
| Format | Dikey 1080×1920, 30 fps |
| Dil | Türkçe |
| Hedef kitle | 5–10 yaş arası çocuklar |
| Ses | Ses efektleri açık, fon müziği kapalı, seslendirme yok |

## 1. Hazırlık

1. Stili bul: `styles/NN-*/` (numara ya da `meta.json` içindeki `name` ile eşleştir).
2. Şunları oku:
   - `styles/NN-*/style.md` → stilin kuralları (palet, malzeme, yazı, hareket, geçiş, kaçınılacaklar)
   - `styles/NN-*/preview.js` → bu stilin **çalışan kodu**; dokular, yardımcı fonksiyonlar ve imza geçişi buradan alınır
   - `prompts/govde.md` → ortak üretim kuralları (gerçeklik, hikâye akışı, güvenli alan, ses, kontrol)
   - `engine/core.js` içindeki `SH` araçları (kolaylaştırma, gürültü, kâğıt/gölge, yazı sprite'ları, kamera)
3. Konudan kısa bir klasör adı türet (Türkçe harfleri sadeleştir): `videos/karincalar-yol/`. `videos/_sablon/` klasörünü oraya kopyala.

## 2. Bilgi ve hikâye akışı

1. Konu için 3–5 **kesin** bilgi yaz. Emin olmadığın sayıları kullanma; "en hızlılardan biri", "binlerce kilometre", "bilim insanlarına göre" gibi güvenli ifadeler seç.
2. `videos/<klasör>/storyboard.md` dosyasına tabloyu yaz: `zaman | ne görüyoruz | ekrandaki yazı | hareket | ses`. Kanca soru (ilk 2 sn) → 2–4 adım → tek cümlelik sonuç → stilin imza geçişi (son 0,8–1,2 sn). Zamanlar toplamda süreye tam eşit olsun.
3. Konu belirsizse ya da bilgi tartışmalıysa kullanıcıya akışı gösterip onay iste; değilse devam et.

## 3. Çizim

- `video.js` içinde `SH.register({ w, h, duration, fps, poster, fonts, init, frame })` kullan. Her şey `t`'ye bağlı ve deterministik olsun (`SH.rng`, `SH.h01`, `SH.noise2`; `Math.random` ve saat yok).
- Dokuları ve sabit katmanları `init` içinde bir kez çiz; `frame` yalnızca birleştirsin.
- Stilin `preview.js` dosyasındaki yardımcıları (ör. suluboya katmanı, tebeşir dişi, piksel sprite, vitray maskesi) kopyalayıp konuya göre yeni sahneler kur. Örnek konuyu kopyalama; aynı görsel dille yeni sahne icat et.
- Yazılar: en çok 2 satır, satır başına 2–5 kelime; Türkçe harfler (ç ğ ı İ ö ş ü) doğru; büyük harfte i → **İ**. Seçilen fontun bu harfleri içerdiğinden emin ol (`fonts/` içinde latin-ext dosyası olmalı).
- Dikey videoda yazı ve önemli öğeler x 80–900, y 190–1450 aralığında kalsın.

## 4. Kontrol

```bash
node tools/render.cjs videos/<klasör>/index.html --stills=1,4,8,12,16,20,24
```

Kareleri `out/stills/<klasör>/` içinde **gerçekten aç ve bak**: üst üste binme, kesilen yazı, okunurluk, palet dışı renk, eksik harf. Düzelt, tekrar kare al. Hareketi bir kez tarayıcıda izle: `python3 -m http.server` → `http://localhost:8000/videos/<klasör>/?play`.

## 5. Ses

`videos/<klasör>/cues.json` yaz (her görsel olaya bir ses), sonra:

```bash
python3 tools/ses.py liste
python3 tools/ses.py karistir videos/<klasör>/cues.json videos/<klasör>/ses.wav
```

Ses efektlerini indirmeye çalışma; `tools/ses.py` hepsini kodla üretir ve karışımı yaklaşık −16 LUFS'e getirir. Seslendirme istenirse metni `videos/<klasör>/seslendirme.md` olarak yaz; ortamda bir TTS aracı varsa onunla üret, yoksa bunu raporda söyle.

## 6. Video

```bash
node tools/render.cjs videos/<klasör>/index.html --audio=videos/<klasör>/ses.wav --out=videos/<klasör>/final.mp4
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate -of compact videos/<klasör>/final.mp4
```

## 7. Teslim

Kullanıcıya kısaca bildir: dosya yolu, süre ve çözünürlük, kullanılan bilgiler, seslerin nasıl üretildiği, emin olunamayan bir şey varsa o. Klasörde `storyboard.md`, `cues.json`, `final.mp4` ve bir kapak karesi bulunsun.
