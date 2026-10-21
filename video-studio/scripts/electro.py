#!/usr/bin/env python3
"""Genera una pista electro / afro house muy movida, original y libre de derechos.

Uso: python3 scripts/electro.py <salida.wav> <segundos> [--bpm 128] [--drops 8.6 31.1]

- Bombo a negras con "bombeo" fuerte (sidechain), palmas en 2 y 4, hi-hats en
  semicorcheas con acentos, hi-hat abierto a contratiempo, congas afro y shaker.
- Bajo rodante a contratiempo (estilo house) y acordes "supersaw" brillantes.
- Arpegio pluck que sube la energía, subida de ruido (riser) + redoble antes de cada
  --drops (segundos) y platillo/impacto justo en el drop.
Requiere numpy y scipy.
"""
import argparse
import wave

import numpy as np
from scipy.signal import butter, lfilter

SR = 48000
p = argparse.ArgumentParser()
p.add_argument('out')
p.add_argument('seconds', type=float)
p.add_argument('--bpm', type=float, default=128)
p.add_argument('--drops', type=float, nargs='*', default=[])
a = p.parse_args()

rng = np.random.default_rng(7)
N = int((a.seconds + 1) * SR)
beat = 60 / a.bpm
s16 = beat / 4
bar = 4 * beat
L = np.zeros(N)
R = np.zeros(N)
duck = np.ones(N)


def filt(x, kind, f, order=2):
    b, aa = butter(order, np.array(f) / (SR / 2), btype=kind)
    return lfilter(b, aa, x)


def t(d):
    return np.arange(int(d * SR)) / SR


def add(sig, start, pan=0.0, vol=1.0):
    i = int(start * SR)
    if i >= N or i < 0:
        return
    e = min(N, i + len(sig))
    L[i:e] += sig[: e - i] * vol * (1 - max(0, pan))
    R[i:e] += sig[: e - i] * vol * (1 + min(0, pan))


def hz(m):
    return 440 * 2 ** ((m - 69) / 12)


def kick():
    tt = t(0.35)
    f = 50 + 140 * np.exp(-tt * 45)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 8)
    click = filt(rng.normal(0, 1, len(tt)), 'high', 3500) * np.exp(-tt * 400) * 0.25
    return np.tanh((body + click) * 2.2)


def clap():
    tt = t(0.3)
    n = rng.normal(0, 1, len(tt))
    env = sum(np.exp(-np.maximum(tt - d, 0) * 70) * (tt >= d) for d in (0, 0.008, 0.017)) + 0.6 * np.exp(-tt * 12)
    return filt(n * env, 'band', [1000, 6000]) * 0.6


def hat(open_=False, acc=False):
    tt = t(0.25 if open_ else 0.05)
    n = rng.normal(0, 1, len(tt))
    env = np.exp(-tt * (14 if open_ else 70))
    return filt(n * env, 'high', 8000) * ((0.3 if open_ else 0.18) * (1.4 if acc else 1))


def conga(pitch, slap=False):
    tt = t(0.25)
    f = pitch * (1 + 0.35 * np.exp(-tt * 60))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * (20 if not slap else 32))
    if slap:
        s += filt(rng.normal(0, 1, len(tt)), 'band', [1500, 5000]) * np.exp(-tt * 70) * 0.5
    return s * 0.38


def bass(m, d):
    tt = t(d)
    ph = (tt * hz(m)) % 1
    saw = 2 * ph - 1
    env = np.minimum(tt / 0.004, 1) * np.exp(-tt * 6)
    return np.tanh(filt(saw * env, 'low', 900) * 2.5) * 0.42


def supersaw(notes, d, bright=5000):
    tt = t(d)
    s = np.zeros(len(tt))
    for m in notes:
        for det in (-0.012, -0.005, 0.0, 0.005, 0.012):
            ph = (tt * hz(m) * (1 + det) + rng.uniform()) % 1
            s += 2 * ph - 1
    env = np.minimum(tt / 0.005, 1) * np.exp(-tt * 5)
    return filt(s * env, 'low', bright) * 0.035


def pluck(m):
    tt = t(0.22)
    ph = (tt * hz(m)) % 1
    sq = np.sign(ph - 0.5)
    return filt(sq * np.exp(-tt * 18), 'low', 4200) * 0.11


def riser(d):
    tt = t(d)
    p_ = tt / d
    n = rng.normal(0, 1, len(tt))
    s = filt(n, 'band', [400, 7000]) * p_ ** 2.2
    tone = np.sin(2 * np.pi * np.cumsum(300 + 1400 * p_ ** 2) / SR) * p_ ** 2 * 0.15
    return (s * 0.35 + tone)


def crash():
    tt = t(2.0)
    return filt(rng.normal(0, 1, len(tt)), 'high', 5000) * np.exp(-tt * 2.2) * 0.35


def impact():
    tt = t(1.0)
    f = 40 + 80 * np.exp(-tt * 15)
    return np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 4) * 2) * 0.7


# Am - F - C - G (raíces del bajo y acordes en voz media-alta)
prog = [(45, [69, 72, 76]), (41, [69, 72, 77]), (48, [67, 72, 76]), (43, [67, 71, 74])]
arp = [0, 2, 1, 2, 0, 2, 1, 3]
K, C = kick(), clap()
nb = int(np.ceil(a.seconds / bar)) + 1


def near_drop(time, before):
    return any(0 <= d - time < before for d in a.drops)


for b in range(nb):
    t0 = b * bar
    root, chord = prog[b % 4]
    intro = b < 1
    for q in range(4):
        tb = t0 + q * beat
        build = near_drop(tb, bar)  # el compás antes de un drop: sin bombo, tensión
        if not build:
            add(K, tb, vol=0.95)
            i = int(tb * SR)
            if i < N:
                dip = 1 - 0.7 * np.exp(-t(beat) * 12)
                e = min(N, i + len(dip))
                duck[i:e] = np.minimum(duck[i:e], dip[: e - i])
        if q in (1, 3):
            add(C, tb, vol=0.7 if build else 1.0)
        add(hat(open_=True), tb + beat / 2, pan=0.25)
    for k in range(16):
        add(hat(acc=k % 4 == 2), t0 + k * s16 + (0.008 if k % 2 else 0), pan=-0.3)
    # Congas afro en 3-3-2
    for k, (pitch, slap) in {0: (200, False), 3: (270, True), 6: (200, False), 10: (330, False), 11: (270, True), 14: (200, False)}.items():
        add(conga(pitch, slap), t0 + k * s16, pan=0.35, vol=0.85)
    if intro:
        continue
    # Bajo rodante: semicorcheas a contratiempo
    for k in range(16):
        if k % 4 != 0:
            add(bass(root - 12 + (12 if k % 4 == 2 else 0), s16 * 0.9), t0 + k * s16)
    # Acordes supersaw a contratiempo
    for k in (2, 6, 10, 13):
        add(supersaw(chord, s16 * 2.5), t0 + k * s16, pan=-0.2 if k % 2 else 0.2)
    # Arpegio pluck desde el compás 3
    if b >= 3:
        for k in range(16):
            n_ = chord[arp[k % 8] % 3] + (12 if arp[k % 8] == 3 else 0)
            add(pluck(n_), t0 + k * s16, pan=0.3 if k % 2 else -0.3, vol=0.9)

# Subidas y drops
for d in a.drops:
    add(riser(bar), d - bar, vol=0.9)
    for k in range(8):  # redoble de caja que acelera
        add(clap() * (0.4 + 0.08 * k), d - (8 - k) * s16, vol=0.8)
    add(crash(), d, vol=1.0)
    add(impact(), d, vol=0.9)

L *= 0.5 + 0.5 * duck
R *= 0.5 + 0.5 * duck
mix = np.stack([L, R], 1)[: int(a.seconds * SR)]
fo = int(1.2 * SR)
mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5
mix /= np.max(np.abs(mix)) + 1e-9
mix = np.tanh(mix * 1.8) / np.tanh(1.8) * 0.9
with wave.open(a.out, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print(f'Electro house listo: {a.out} ({a.seconds:.1f} s, {a.bpm:.0f} BPM, drops en {a.drops})')
