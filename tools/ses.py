#!/usr/bin/env python3
"""Kaleydo ses aracı: ses efektlerini ve hafif bir fon müziğini kodla üretir, bir zaman çizelgesine göre karıştırır.
Dışarıdan ses dosyası indirmez (stok ses siteleri bulut makinelerinden indirmeyi çoğu zaman engeller).

    python3 tools/ses.py liste                          # hazır seslerin adları ve kısa açıklamaları
    python3 tools/ses.py dinle pop out/pop.wav          # tek bir sesi dosyaya yaz
    python3 tools/ses.py karistir cues.json ses.wav     # cues.json'daki zamanlara göre karışım (48 kHz stereo)

cues.json örneği:
    {
      "duration": 25,
      "music": "yumusak",                 # "yok" | "yumusak" | "neseli"   (isteğe bağlı)
      "cues": [
        {"t": 0.4, "s": "pop"},
        {"t": 1.0, "s": "swish", "gain": -3, "pan": -0.3},
        {"t": 2.2, "s": "chime", "pitch": 1.25}
      ]
    }

Her ses deterministiktir (sabit tohum). Karışım yaklaşık -16 LUFS'e getirilir (BS.1770 benzeri ölçüm), tepeler yumuşak sınırlayıcıyla -1 dBFS'nin altında tutulur.
Gerekenler: Python 3, NumPy.
"""
import json
import sys
import wave

import numpy as np

SR = 48000


def T(dur):
    return np.arange(int(dur * SR)) / SR


def noise(n, seed):
    return np.random.default_rng(seed).standard_normal(n)


def band(x, lo=None, hi=None):
    """Sıfır fazlı FFT filtresi, yumuşak eteklerle."""
    n = len(x)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    m = np.ones_like(f)
    if lo:
        m /= 1 + (lo / np.maximum(f, 1.0)) ** 4
    if hi:
        m /= 1 + (f / hi) ** 4
    return np.fft.irfft(X * m, n)


def env(n, attack, decay, curve=4.0):
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    d = np.exp(-curve * np.maximum(t - attack, 0) / max(decay, 1e-4))
    return a * d


def norm(x, peak=0.9):
    m = np.max(np.abs(x)) or 1.0
    return x / m * peak


def tone(freqs, dur, decay, partials=((1, 1.0),), attack=0.004):
    t = T(dur)
    out = np.zeros_like(t)
    for f in np.atleast_1d(freqs):
        for mult, amp in partials:
            out += amp * np.sin(2 * np.pi * f * mult * t)
    return out * env(len(t), attack, decay)


def chirp(f0, f1, dur, decay, kind='exp'):
    t = T(dur)
    k = t / dur
    f = f0 * (f1 / f0) ** k if kind == 'exp' else f0 + (f1 - f0) * k
    phase = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(phase) * env(len(t), 0.003, decay)


# ---- the sound library ---------------------------------------------------------------------------------------------
def s_pop():
    return norm(chirp(900, 420, 0.12, 0.05) + 0.25 * band(noise(int(0.12 * SR), 1), 2000, 8000) * env(int(0.12 * SR), 0.001, 0.01))


def s_tap():
    n = int(0.15 * SR)
    return norm(band(noise(n, 2), 600, 3000) * env(n, 0.001, 0.02) + 0.8 * tone(820, 0.15, 0.05))


def s_click():
    n = int(0.03 * SR)
    return norm(band(noise(n, 3), 1500, 9000) * env(n, 0.0005, 0.004))


def s_thud():
    n = int(0.35 * SR)
    return norm(chirp(120, 55, 0.35, 0.12) + 0.3 * band(noise(n, 4), None, 400) * env(n, 0.002, 0.05))


def s_swish(dur=0.35, seed=5):
    n = int(dur * SR)
    x = noise(n, seed)
    lo = band(x, 300, 1500)
    hi = band(x, 1500, 7000)
    k = np.linspace(0, 1, n)
    return norm((lo * (1 - k) + hi * k) * np.sin(np.pi * k) ** 1.5)


def s_whoosh():
    return norm(s_swish(0.9, 6) * 0.6 + band(noise(int(0.9 * SR), 7), 80, 500) * np.sin(np.pi * np.linspace(0, 1, int(0.9 * SR))) ** 2)


def s_paper():
    n = int(0.4 * SR)
    rng = np.random.default_rng(8)
    x = np.zeros(n)
    for _ in range(60):
        i = rng.integers(0, n - 400)
        x[i:i + 300] += rng.standard_normal(300) * np.exp(-np.arange(300) / 40)
    return norm(band(x, 1200, 9000) * np.sin(np.pi * np.linspace(0, 1, n)))


def s_page():
    n = int(0.55 * SR)
    k = np.linspace(0, 1, n)
    flutter = 0.6 + 0.4 * np.sin(2 * np.pi * 24 * k * (1 - 0.5 * k))
    return norm(band(noise(n, 9), 400, 6000) * flutter * np.sin(np.pi * k) ** 1.2)


def s_chime():
    return norm(tone(1046.5, 1.6, 0.9, ((1, 1.0), (2.76, 0.4), (5.4, 0.18))))


def s_ding():
    return norm(tone(880, 0.9, 0.45, ((1, 1.0), (2.0, 0.3), (3.0, 0.12))))


def s_sparkle():
    out = np.zeros(int(0.9 * SR))
    for i, f in enumerate([1568, 2093, 2637, 3136, 2349]):
        s = tone(f, 0.4, 0.18, ((1, 1.0), (2.76, 0.25)))
        o = int(i * 0.09 * SR)
        out[o:o + len(s)] += s * (0.9 - i * 0.1)
    return norm(out)


def s_drip():
    return norm(chirp(500, 1600, 0.14, 0.06))


def s_bubble():
    return norm(chirp(300, 900, 0.09, 0.05) * 0.8)


def s_buzz():
    t = T(1.0)
    f = 210 + 8 * np.sin(2 * np.pi * 6 * t)
    saw = 2 * ((np.cumsum(f) / SR) % 1) - 1
    return norm(band(saw, 150, 1800) * np.sin(np.pi * np.linspace(0, 1, len(t))) ** 0.6)


def s_rise():
    t = T(0.7)
    return norm(chirp(300, 1200, 0.7, 0.7) * np.sin(np.pi * np.linspace(0, 1, len(t))) ** 0.5)


def s_chalk():
    n = int(0.45 * SR)
    trem = 0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 18 * T(0.45)))
    return norm(band(noise(n, 10), 2500, 9000) * trem * np.sin(np.pi * np.linspace(0, 1, n)))


def s_wind():
    n = int(2.0 * SR)
    k = np.linspace(0, 1, n)
    return norm(band(noise(n, 11), 200, 900) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.8 * k)) * np.sin(np.pi * k))


def s_splash():
    n = int(0.6 * SR)
    x = band(noise(n, 12), 500, 7000) * env(n, 0.005, 0.25)
    d = s_drip()
    x[:len(d)] += 0.4 * d
    return norm(x)


SOUNDS = {
    'pop': (s_pop, 'kısa, yumuşak pıt: bir şey belirince'),
    'tap': (s_tap, 'tahta tıkırtısı: kart, düğme, taş'),
    'click': (s_click, 'çok kısa tık: imleç, küçük parça'),
    'thud': (s_thud, 'boğuk küt: ağır bir şey yere oturunca'),
    'swish': (s_swish, 'hızlı hışırtı: kayan kart, geçiş'),
    'whoosh': (s_whoosh, 'uzun vınlama: büyük geçiş'),
    'paper': (s_paper, 'kâğıt hışırtısı'),
    'page': (s_page, 'sayfa çevirme'),
    'chime': (s_chime, 'çan: önemli bilgi, final'),
    'ding': (s_ding, 'kısa zil: adım tamamlandı'),
    'sparkle': (s_sparkle, 'pırıltı: sihirli an, parıltı'),
    'drip': (s_drip, 'damla'),
    'bubble': (s_bubble, 'kabarcık'),
    'buzz': (s_buzz, 'vızıltı: arı, böcek'),
    'rise': (s_rise, 'yükselen ton: büyüme, açılış'),
    'chalk': (s_chalk, 'tebeşir / kalem cızırtısı'),
    'wind': (s_wind, 'rüzgâr'),
    'splash': (s_splash, 'su sıçraması'),
}


def music(kind, dur):
    """Basit, döngüye uygun fon müziği: pentatonik melodi + yumuşak akorlar (davul yok)."""
    t = T(dur)
    out = np.zeros_like(t)
    bpm = 84 if kind == 'yumusak' else 108
    beat = 60 / bpm
    chords = [(261.6, 329.6, 392.0), (220.0, 261.6, 329.6), (174.6, 220.0, 261.6), (196.0, 246.9, 293.7)]
    bar = beat * 4
    for i in range(int(np.ceil(dur / bar))):
        c = chords[i % 4]
        s0 = int(i * bar * SR)
        seg = T(min(bar, dur - i * bar))
        if len(seg) == 0:
            break
        pad = sum(np.sin(2 * np.pi * f * seg) for f in c) / 3
        pad *= np.minimum(1, seg / 0.3) * np.minimum(1, (seg[-1] - seg + 1e-3) / 0.3)
        out[s0:s0 + len(seg)] += 0.25 * pad
    scale = [523.3, 587.3, 659.3, 784.0, 880.0]
    rng = np.random.default_rng(21)
    step = beat if kind == 'yumusak' else beat / 2
    for i in range(int(dur / step)):
        if rng.random() < 0.35:
            continue
        f = scale[rng.integers(0, len(scale))]
        n = tone(f, step * 1.8, step * 0.9, ((1, 1.0), (2, 0.15)))
        s0 = int(i * step * SR)
        out[s0:s0 + len(n)] += 0.18 * n[:max(0, len(out) - s0)]
    fade = int(0.05 * SR)
    out[:fade] *= np.linspace(0, 1, fade)
    out[-fade:] *= np.linspace(1, 0, fade)
    return out


def loudness(st):
    """BS.1770 tarzı tümleşik yüksek ses (LUFS): K-ağırlık (FFT ile), 400 ms bloklar, mutlak ve göreli kapı."""
    f = np.fft.rfftfreq(len(st), 1 / SR)
    shelf = 1 + (10 ** (4 / 20) - 1) * (f ** 2 / (f ** 2 + 1681.0 ** 2))
    hp = (f / 38.0) ** 2 / (1 + (f / 38.0) ** 2)
    k = shelf * hp
    w = np.stack([np.fft.irfft(np.fft.rfft(st[:, c]) * k, len(st)) for c in range(st.shape[1])], axis=1)
    blk, hop = int(0.4 * SR), int(0.1 * SR)
    z = np.array([np.sum(np.mean(w[i:i + blk] ** 2, axis=0)) for i in range(0, max(1, len(w) - blk + 1), hop)]) + 1e-12
    lb = -0.691 + 10 * np.log10(z)
    keep = lb > -70
    if not keep.any():
        return -70.0
    rel = -0.691 + 10 * np.log10(np.mean(z[keep])) - 10
    keep &= lb > rel
    return float(-0.691 + 10 * np.log10(np.mean(z[keep])))


def soft_limit(x, knee=0.75, ceil=0.84):
    a = np.abs(x)
    over = a > knee
    y = x.copy()
    y[over] = np.sign(x[over]) * (knee + (ceil - knee) * np.tanh((a[over] - knee) / (ceil - knee)))
    return y


def write_wav(path, stereo):
    data = (np.clip(stereo, -1, 1) * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


def mix(cfg):
    dur = float(cfg['duration'])
    n = int(dur * SR)
    L = np.zeros(n)
    R = np.zeros(n)
    cache = {}
    for c in cfg.get('cues', []):
        name = c['s']
        if name not in SOUNDS:
            raise SystemExit(f'bilinmeyen ses: {name} (liste için: python3 tools/ses.py liste)')
        if name not in cache:
            cache[name] = SOUNDS[name][0]()
        s = cache[name]
        p = float(c.get('pitch', 1.0))
        if p != 1.0:
            idx = np.arange(0, len(s) - 1, p)
            s = np.interp(idx, np.arange(len(s)), s)
        g = 10 ** (float(c.get('gain', 0)) / 20) * 0.5
        pan = float(c.get('pan', 0))
        o = int(float(c['t']) * SR)
        if o >= n:
            continue
        s = s[:n - o]
        L[o:o + len(s)] += s * g * np.sqrt((1 - pan) / 2) * 1.414
        R[o:o + len(s)] += s * g * np.sqrt((1 + pan) / 2) * 1.414
    kind = cfg.get('music', 'yok')
    if kind in ('yumusak', 'neseli'):
        m = music(kind, dur) * 10 ** (-18 / 20)
        L += m
        R += m
    both = np.stack([L, R], axis=1)
    for _ in range(2):                                   # aim at -16 LUFS; a soft limiter keeps peaks under -1 dBFS
        both = soft_limit(both * 10 ** ((-16.0 - loudness(both)) / 20))
    return both


def main(argv):
    if len(argv) < 2 or argv[1] == 'liste':
        for k, (_, d) in SOUNDS.items():
            print(f'{k:8s} {d}')
        return
    if argv[1] == 'dinle' and len(argv) == 4:
        s = SOUNDS[argv[2]][0]() * 0.7
        write_wav(argv[3], np.stack([s, s], axis=1))
        print(f'{argv[2]} → {argv[3]}')
        return
    if argv[1] == 'karistir' and len(argv) == 4:
        with open(argv[2], encoding='utf-8') as f:
            cfg = json.load(f)
        write_wav(argv[3], mix(cfg))
        print(f'{len(cfg.get("cues", []))} ses, {cfg["duration"]} sn → {argv[3]}')
        return
    print(__doc__)


if __name__ == '__main__':
    main(sys.argv)
