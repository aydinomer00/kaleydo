#!/usr/bin/env python3
"""Deterministic procedural sound effects for the paper-cut explainer, plus the cue sheet and mix.

Stock sound sites often refuse downloads from cloud render machines (here: HTTP 403), so every
effect is synthesised here (filtered noise, oscillators, envelopes). Each effect is written to
sfx/<name>.wav and placed at its exact timestamp with ffmpeg (adelay + amix) → out/sfx_mix.wav.

    python3 tools/sfx.py          # writes sfx/*.wav, sfx/cues.json, out/sfx_mix.wav
"""
import json
import os
import subprocess
import wave

import numpy as np

SR = 48000
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SFX = os.path.join(ROOT, 'sfx')
DURATION = 25.0          # must match js/core.js
TS = DURATION / 25.0     # story clock → seconds (cue times below are on the 25-unit story clock)


def T(dur):
    return np.arange(int(dur * SR)) / SR


def noise(n, seed):
    return np.random.default_rng(seed).standard_normal(n)


def band(x, lo=None, hi=None):
    """Zero-phase FFT filter with gentle 4th-order skirts."""
    n = len(x)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    m = np.ones_like(f)
    if lo:
        m /= 1 + (lo / np.maximum(f, 1.0)) ** 4
    if hi:
        m /= 1 + (f / hi) ** 4
    return np.fft.irfft(X * m, n)


def sweep_band(x, centers, width_oct=0.9, frame=1024, hop=256):
    """Time-varying band-pass (gaussian on log-frequency) by STFT overlap-add."""
    win = np.hanning(frame)
    pad = np.concatenate([np.zeros(frame), x, np.zeros(frame)])
    out = np.zeros_like(pad)
    norm = np.zeros_like(pad)
    f = np.fft.rfftfreq(frame, 1 / SR)
    lf = np.log2(np.maximum(f, 20.0))
    for start in range(0, len(pad) - frame, hop):
        tc = (start - frame + frame / 2) / SR
        fc = centers(min(max(tc, 0.0), len(x) / SR))
        mask = np.exp(-0.5 * ((lf - np.log2(fc)) / (width_oct / 2)) ** 2)
        seg = np.fft.irfft(np.fft.rfft(pad[start:start + frame] * win) * mask, frame)
        out[start:start + frame] += seg * win
        norm[start:start + frame] += win ** 2
    out /= np.maximum(norm, 1e-6)
    return out[frame:frame + len(x)]


def fades(x, a=0.002, r=0.01):
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    x = x.copy()
    x[:na] *= np.linspace(0, 1, na)
    x[-nr:] *= np.linspace(1, 0, nr)
    return x


def peak(x, p=0.9):
    return x / (np.max(np.abs(x)) + 1e-9) * p


def tone(freqs, t):
    ph = 2 * np.pi * np.cumsum(freqs) / SR
    return np.sin(ph)


# ---------------------------------------------------------------- the sounds
def paper_slide(seed, dur=0.38):
    t = T(dur)
    x = band(noise(len(t), seed), 900, 6500)
    grain = band(noise(len(t), seed + 1), None, 90)
    grain = 0.55 + 0.45 * grain / (np.max(np.abs(grain)) + 1e-9)
    u = t / dur
    env = (u ** 0.45) * (1 - u) ** 1.7
    return fades(peak(x * grain * env))


def paper_pop(seed, pitch=150):
    t = T(0.14)
    thump = tone(pitch - 60 * t, t) * np.exp(-t / 0.035)
    click = band(noise(len(t), seed), 1200, 7000) * np.exp(-t / 0.008)
    return fades(peak(0.85 * thump + 0.45 * click), 0.001, 0.02)


def flip(seed):
    t = T(0.16)
    x = band(noise(len(t), seed), 1500, 6000)
    env = np.exp(-((t - 0.025) / 0.012) ** 2) + 0.7 * np.exp(-((t - 0.085) / 0.014) ** 2)
    return fades(peak(x * env))


def ding(freq, seed):
    t = T(0.5)
    x = (np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.13)
         + 0.33 * np.sin(2 * np.pi * 2 * freq * t) * np.exp(-t / 0.06)
         + 0.12 * np.sin(2 * np.pi * 3.01 * freq * t) * np.exp(-t / 0.035))
    x += 0.25 * band(noise(len(t), seed), 2000, 9000) * np.exp(-t / 0.003)
    return fades(peak(x), 0.001, 0.05)


def plip(seed, f0=520.0, f1=1500.0):
    t = T(0.17)
    f = f0 + (f1 - f0) * (1 - np.exp(-t / 0.02))
    return fades(peak(tone(f, t) * np.exp(-t / 0.045)), 0.001, 0.03)


def bloop(seed):
    t = T(0.16)
    f = 280 + 480 * (1 - np.exp(-t / 0.03))
    return fades(peak(tone(f, t) * np.exp(-t / 0.05) * (1 - np.exp(-t / 0.004))), 0.001, 0.03)


def buzz(seed, dur, f0=228.0, bend=0.0, breath=0.16):
    """Bee wings: bright harmonic buzz with vibrato; bend > 0 approaches (pitch falls), < 0 leaves."""
    t = T(dur)
    u = t / dur
    wob = band(noise(len(t), seed), None, 8)
    wob /= np.max(np.abs(wob)) + 1e-9
    f = f0 * (1 + 0.018 * np.sin(2 * np.pi * 6.3 * t) + 0.012 * wob) * (1 + bend * (0.5 - u))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum(np.sin(k * ph) / k ** 1.15 for k in range(1, 15))
    x = band(x, 140, 2600) + breath * band(noise(len(t), seed + 1), 700, 4000)
    x *= 0.85 + 0.15 * np.sin(2 * np.pi * 9 * t)
    env = np.minimum(1, t / 0.09) * np.minimum(1, (dur - t) / 0.2)
    return fades(peak(x * env))


def fan(seed, dur):
    t = T(dur)
    x = buzz(seed, dur, 188.0, 0.0, 0.3)
    air = band(noise(len(t), seed + 5), 200, 1400)
    air = air / (np.max(np.abs(air)) + 1e-9) * (0.55 + 0.45 * np.sin(2 * np.pi * 0.9 * t) ** 2)
    env = np.minimum(1, t / 0.4) * np.minimum(1, (dur - t) / 0.5)
    return fades(peak((0.7 * x + 0.5 * air) * env))


def whoosh(seed, dur=0.6, lo=320.0, hi=2600.0):
    t = T(dur)
    def centre(tc):
        b = np.sin(np.pi * min(max(tc / dur, 0), 1)) ** 1.2
        return lo * (hi / lo) ** b
    x = sweep_band(noise(len(t), seed), centre)
    u = t / dur
    return fades(peak(x * np.sin(np.pi * u) ** 1.4))


def thud(seed):
    t = T(0.38)
    f = 60 + 55 * np.exp(-t / 0.05)
    low = tone(f, t) * np.exp(-t / 0.12)
    slap = band(noise(len(t), seed), 150, 2500) * np.exp(-t / 0.025)
    return fades(peak(0.9 * low + 0.6 * slap), 0.001, 0.05)


def chime(seed):
    t = T(2.0)
    x = np.zeros_like(t)
    for i, fr in enumerate([1046.5, 1318.5, 1568.0, 2093.0]):
        tt = np.clip(t - i * 0.075, 0, None)
        on = (t >= i * 0.075).astype(float)
        a = 1.0 if i < 3 else 0.45
        x += on * a * (np.sin(2 * np.pi * fr * tt) + 0.12 * np.sin(2 * np.pi * fr * 2.76 * tt) * np.exp(-tt / 0.2)) * np.exp(-tt / 0.75)
    return fades(peak(x), 0.002, 0.2)


def sparkle(seed):
    t = T(0.5)
    x = np.zeros_like(t)
    for i, fr in enumerate([2637.0, 3136.0, 3520.0, 4186.0]):
        tt = np.clip(t - i * 0.045, 0, None)
        x += (t >= i * 0.045) * np.sin(2 * np.pi * fr * tt) * np.exp(-tt / 0.1)
    return fades(peak(x), 0.001, 0.05)


def cap(seed):
    t = T(0.1)
    x = 0.8 * tone(330 - 80 * t, t) * np.exp(-t / 0.03) + 0.6 * band(noise(len(t), seed), 200, 1800) * np.exp(-t / 0.012)
    return fades(peak(x), 0.001, 0.02)


SOUNDS = {
    'slide_a': lambda: paper_slide(11, 0.42), 'slide_b': lambda: paper_slide(12, 0.32), 'slide_c': lambda: paper_slide(13, 0.55),
    'pop_a': lambda: paper_pop(21, 150), 'pop_b': lambda: paper_pop(22, 175), 'pop_c': lambda: paper_pop(23, 128),
    'flip': lambda: flip(31),
    'plip_a': lambda: plip(41, 520, 1500), 'plip_b': lambda: plip(42, 600, 1700), 'plip_c': lambda: plip(43, 470, 1350),
    'bloop': lambda: bloop(51),
    'buzz_in': lambda: buzz(61, 1.45, 236, 0.10), 'buzz_fly': lambda: buzz(62, 2.5, 228, 0.05),
    'buzz_short': lambda: buzz(63, 0.7, 240, 0.08), 'buzz_out': lambda: buzz(64, 0.65, 232, -0.1), 'buzz_end': lambda: buzz(65, 1.05, 236, 0.08),
    'buzz_flutter': lambda: buzz(66, 0.3, 244, 0.0),
    'fan': lambda: fan(71, 4.9),
    'whoosh': lambda: whoosh(81, 0.62), 'whoosh_s': lambda: whoosh(82, 0.38, 500, 3200), 'whoosh_l': lambda: whoosh(83, 0.95, 220, 2000),
    'thud': lambda: thud(91), 'chime': lambda: chime(101), 'sparkle': lambda: sparkle(111), 'cap': lambda: cap(121),
    **{f'ding{i}': (lambda i=i: ding([784.0, 880.0, 987.8, 1046.5, 1174.7, 1318.5][i], 130 + i)) for i in range(6)},
}

# (story time, sound, volume, pan -1..1) — sparse and tied to visible actions
CUES = [
    (0.00, 'slide_c', 0.42, -0.2),                                   # meadow layers rise
    (0.22, 'pop_b', 0.22, 0.1), (0.62, 'pop_a', 0.3, -0.15),         # stems, petals open
    (0.82, 'pop_c', 0.3, 0.15), (0.88, 'pop_b', 0.28, -0.3),         # "bal" highlight lands
    (0.66, 'buzz_in', 0.34, 0.6),                                    # bee arrives
    (2.05, 'pop_a', 0.36, -0.1),                                     # lands on the flower
    (2.25, 'slide_a', 0.36, 0.0), (2.57, 'whoosh_s', 0.3, -0.3),     # title lifts away, step card 1
    (2.95, 'plip_a', 0.42, -0.05), (3.40, 'plip_b', 0.4, -0.05), (3.85, 'plip_c', 0.4, -0.05),   # nectar sipped
    (3.45, 'pop_c', 0.42, -0.4),                                     # lens opens
    (4.85, 'slide_b', 0.28, -0.3),                                   # lens closes
    (5.08, 'buzz_fly', 0.34, 0.2), (5.15, 'whoosh_l', 0.34, 0.4),    # flight + camera pan
    (5.48, 'slide_a', 0.32, -0.3),                                   # step card 2
    (6.12, 'pop_c', 0.3, 0.3), (6.30, 'pop_a', 0.28, 0.25), (6.48, 'pop_b', 0.32, 0.2),   # hive is assembled
    (7.55, 'pop_a', 0.34, -0.1),                                     # lands on the hive
    (7.76, 'flip', 0.3, 0.3),                                        # house bee turns
    (8.55, 'plip_b', 0.46, 0.0), (8.86, 'sparkle', 0.26, 0.15),      # nectar handed over
    (9.30, 'whoosh', 0.42, 0.0), (9.33, 'slide_b', 0.26, 0.0),       # paper-lens iris
    (10.08, 'buzz_short', 0.3, -0.5), (10.38, 'slide_a', 0.32, -0.3),
    (10.90, 'plip_c', 0.46, 0.0),                                    # drop falls into the cell
    *[(11.6 + i * 0.13, f'ding{i}', 0.24, -0.3 + i * 0.12) for i in range(6)],   # 1-6 sides
    (11.36, 'buzz_out', 0.26, -0.5),
    (12.05, 'pop_b', 0.24, 0.0),
    (13.33, 'slide_a', 0.32, -0.3), (13.45, 'flip', 0.26, -0.2),
    (13.62, 'fan', 0.27, 0.0), (13.82, 'whoosh_s', 0.24, -0.4),
    (14.45, 'bloop', 0.2, 0.3), (15.30, 'bloop', 0.18, 0.1), (16.10, 'bloop', 0.2, 0.35), (16.95, 'bloop', 0.18, 0.15), (17.70, 'bloop', 0.2, 0.3),
    (18.62, 'thud', 0.55, 0.05),                                     # "Bal oldu!" badge lands
    (19.02, 'slide_b', 0.26, 0.2), (19.33, 'slide_a', 0.32, -0.3),
    (19.62, 'cap', 0.22, -0.4), (19.95, 'cap', 0.2, -0.2), (20.25, 'cap', 0.22, 0.0), (20.55, 'cap', 0.2, 0.2), (20.85, 'cap', 0.2, 0.35),
    (21.25, 'whoosh_l', 0.46, 0.0), (21.30, 'slide_c', 0.36, 0.0),   # honey-drip sheet
    (22.32, 'pop_a', 0.26, -0.4), (22.50, 'pop_b', 0.24, 0.4), (22.68, 'pop_c', 0.24, -0.3),   # flowers around the jar
    (22.55, 'buzz_end', 0.32, -0.6), (23.55, 'pop_a', 0.3, 0.0),    # bee comes home
    (23.25, 'slide_b', 0.28, 0.0),                                   # banner
    (23.60, 'chime', 0.34, 0.0),                                     # thank-you chime
    (24.05, 'sparkle', 0.2, 0.2), (24.30, 'buzz_flutter', 0.2, 0.0),
]


def write_wav(path, x):
    y = np.clip(x, -1, 1)
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((y * 32767).astype('<i2').tobytes())


def main():
    os.makedirs(SFX, exist_ok=True)
    os.makedirs(os.path.join(ROOT, 'out'), exist_ok=True)
    for name, fn in SOUNDS.items():
        write_wav(os.path.join(SFX, f'{name}.wav'), fn())
    cues = [{'t': round(t * TS, 4), 'sound': n, 'vol': v, 'pan': p} for t, n, v, p in sorted(CUES)]
    with open(os.path.join(SFX, 'cues.json'), 'w') as f:
        json.dump(cues, f, indent=1)
    # place every cue at its exact time with ffmpeg
    args = ['ffmpeg', '-loglevel', 'error', '-y']
    chains = []
    for i, c in enumerate(cues):
        args += ['-i', os.path.join(SFX, f"{c['sound']}.wav")]
        gl, gr = np.cos((c['pan'] + 1) * np.pi / 4), np.sin((c['pan'] + 1) * np.pi / 4)
        d = int(round(c['t'] * 1000))
        chains.append(f"[{i}:a]volume={c['vol']:.3f},pan=stereo|c0={gl * 1.414:.3f}*c0|c1={gr * 1.414:.3f}*c0,adelay={d}|{d}[c{i}]")
    mix = ''.join(f'[c{i}]' for i in range(len(cues)))
    graph = ';'.join(chains) + f";{mix}amix=inputs={len(cues)}:normalize=0:duration=longest,volume=2dB,alimiter=limit=0.9:level=disabled,apad=whole_dur={DURATION}[out]"
    args += ['-filter_complex', graph, '-map', '[out]', '-t', str(DURATION), '-ar', str(SR), '-ac', '2', os.path.join(ROOT, 'out', 'sfx_mix.wav')]
    subprocess.run(args, check=True)
    print(f'{len(SOUNDS)} sounds, {len(cues)} cues → out/sfx_mix.wav')


if __name__ == '__main__':
    main()
