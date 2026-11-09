---
name: yeni-stil
description: Kaleydo'ya yeni bir görsel stil ekler (önizleme kodu, meta.json, style.md, 8 sn önizleme videosu, site verisi). Bir görselden (poster, ekran görüntüsü, çizim) ya da tarif edilen bir görünümden çalışır. "Bu görselden yeni stil çıkar", "26. stil olarak ekle", "suluboya gibi ama kolaj olsun, yeni stil yap", "add a new style from this image" gibi isteklerde kullan.
---

# Yeni stil eklemek

Amaç, mevcut 25 stilden **belirgin şekilde farklı**, kodla (Canvas 2D) üretilebilen, çocuk videolarına uygun yeni bir görsel dil kurmak ve depoya tam olarak eklemek.

## 1. Görünümü çözümle

Referans görsel ya da tarif üzerinden şunları yaz:

- **Palet:** 5–7 renk, her biri hex ve Türkçe adıyla.
- **Malzeme ve yüzey:** neyden yapılmış gibi duruyor (kâğıt, taş, ışık, kumaş…), dokular, kenarlar, gölgeler, ışığın yönü.
- **Yazı:** hangi karakterde bir font (OFL lisanslı, Türkçe harfleri olan), boyutlar, büyük/küçük harf.
- **Kompozisyon alışkanlıkları,** **imza öğeleri** (3–5 tane) ve **bir imza geçişi** (son 1 sn'de sahneyi başa döndüren).

Belirli bir markayı, karakteri ya da var olan bir ürünün görünümünü kopyalama; görünümün ilkelerini çıkar. `site/data.js` içindeki stillerle karşılaştır; çok benzeyen varsa farkı netleştir.

## 2. Font

1. Fontsource'tan `latin` ve `latin-ext` alt kümelerinin `woff2` dosyalarını `fonts/` klasörüne indir (ör. `adi-latin-700-normal.woff2`).
2. Türkçe harfleri doğrula:
   ```bash
   python3 -c "from fontTools.ttLib import TTFont; cm=TTFont('fonts/ADI-latin-ext-700-normal.woff2').getBestCmap(); print(all(ord(c) in cm for c in 'ĞğİŞş'))"
   ```
3. `engine/fonts.css` dosyasına mevcut satırlarla aynı biçimde `@font-face` ekle (unicode-range dahil); lisans metnini `fonts/licenses/` altına koy.

## 3. Önizlemeyi yaz

- Sıradaki numarayla klasör aç: `styles/NN-turkce-ad/` (küçük harf, Türkçe karakter yok).
- `preview.js`: `SH.register({ id: 'NN', w: 1080, h: 1920, duration: 8, fps: 30, poster, fonts, init, frame })`. Konuyu çocuklara uygun bir doğa sorusu seç (ör. "Kar taneleri neden altıgen?").
- Kurallar: deterministik (`SH.rng`, `SH.h01`, `SH.noise2`), dokular `init`'te, `frame` sadece birleştirir; **8. saniye ile 0. saniye aynı görünmeli** (döngü). İmza geçişi son ~1 sn'de.
- Yazılar x 80–900, y 190–1450 arasında; büyük harfte i → İ.
- Mevcut stillerin kodu iyi bir başlangıç: benzer tekniği kullanan bir `preview.js` aç ve yardımcılarını uyarla.

## 4. Kontrol ve video

```bash
node tools/render.cjs NN-turkce-ad --stills=1,3,5,7,7.9
node tools/render.cjs NN-turkce-ad
```

Kareleri aç ve bak; çakışma, okunurluk, eksik harf, döngü dikişi. Sonra `previews/NN-turkce-ad.mp4` ve `.jpg` oluşur.

## 5. Künye ve rehber

- `meta.json` (diğer stillerle aynı alanlar):
  `id, slug, name, nameEn, category (el-yapimi | miras | baski-cizim | isik-dijital), tagline, bestFor, examples[3], palette[[hex, ad]], fonts[], signature[], preview{topic, duration}`
- `style.md` (İngilizce, diğerleriyle aynı başlıklar): `Palette`, `Material and surface`, `Typography`, `Composition habits`, `Signature devices`, `How to build it (Canvas 2D)`, `Motion`, `Transitions`, `Information design`, `Sound (synthesise)`, `Avoid`. Bu metin prompt oluşturucuda olduğu gibi kullanılır; yapay zekânın stili yeniden kurabileceği kadar somut yaz (renk kodları, piksel ölçüleri, kolaylaştırma adları, süreler).

## 6. Siteyi güncelle

```bash
node tools/build-site.cjs --kapak
```

README'deki stil tablosuna yeni satırı ekle. Kullanıcıya önizleme videosunu ve kapak karesini göster.
