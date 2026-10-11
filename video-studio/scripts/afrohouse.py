#!/usr/bin/env python3
"""Genera una pista de afro house original, libre de derechos, para reels.

Uso: python3 scripts/afrohouse.py <salida.wav> <segundos> [--bpm 122] [--calma INICIO FIN]

- Groove afro: bombo a negras, palmas en 2 y 4, shaker en semicorcheas con swing,
  congas y clave en patrón 3-3-2, hi-hat abierto a contratiempo.
- Bajo profundo sincopado y acordes en La menor (Am - F - C - G) con "bombeo".
- Melodía de marimba a partir del compás 5 y pad suave para dar euforia.
- --calma: tramo (en segundos) sin bombo y con filtro, para momentos de tensión;
  vuelve con un redoble de congas y el "drop".
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
p.add_argument('--bpm', type=float, default=122)
p.add_argument('--calma', type=float, nargs=2, default=None)
a = p.parse_args()

rng = np.random.default_rng(23)
N = int(a.seconds * SR) + SR
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


def calm(time):
    return a.calma is not None and a.calma[0] <= time < a.calma[1]


# --- Instrumentos ---
def kick():
    tt = t(0.4)
    f = 48 + 120 * np.exp(-tt * 40)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 7.5)
    click = filt(rng.normal(0, 1, len(tt)), 'high', 3000) * np.exp(-tt * 300) * 0.15
    return np.tanh((body + click) * 1.6) * 0.95


def clap():
    tt = t(0.35)
    n = rng.normal(0, 1, len(tt))
    env = sum(np.exp(-np.maximum(tt - d, 0) * 60) * (tt >= d) for d in (0, 0.01, 0.022)) + 0.5 * np.exp(-tt * 9)
    return filt(n * env, 'band', [900, 5000]) * 0.5


def shaker(acc):
    tt = t(0.06)
    n = rng.normal(0, 1, len(tt))
    env = np.minimum(tt / 0.008, 1) * np.exp(-tt * 55)
    return filt(n * env, 'high', 6500) * (0.32 if acc else 0.16)


def hat_open():
    tt = t(0.22)
    return filt(rng.normal(0, 1, len(tt)) * np.exp(-tt * 16), 'high', 8000) * 0.22


def conga(pitch, slap=False):
    tt = t(0.3)
    f = pitch * (1 + 0.35 * np.exp(-tt * 60))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * (18 if not slap else 30))
    if slap:
        s += filt(rng.normal(0, 1, len(tt)), 'band', [1500, 5000]) * np.exp(-tt * 70) * 0.5
    return s * 0.45


def clave():
    tt = t(0.08)
    return (np.sin(2 * np.pi * 2500 * tt) + 0.4 * np.sin(2 * np.pi * 3700 * tt)) * np.exp(-tt * 70) * 0.18


def bass(m, d):
    tt = t(d)
    f = hz(m)
    s = np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(2 * np.pi * 2 * f * tt)
    env = np.minimum(tt / 0.005, 1) * np.exp(-tt * 3) * np.minimum(1, (d - tt) / 0.02)
    return np.tanh(s * env * 1.8) * 0.5


def stab(notes, d, bright=3200):
    tt = t(d)
    s = np.zeros(len(tt))
    for m in notes:
        for det in (-0.006, 0.006):
            ph = (tt * hz(m) * (1 + det)) % 1
            s += 2 * ph - 1
    env = np.minimum(tt / 0.004, 1) * np.exp(-tt * 9)
    return filt(s * env, 'low', bright) * 0.07


def marimba(m, d=0.5):
    tt = t(d)
    f = hz(m)
    s = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 9) + 0.35 * np.sin(2 * np.pi * 4 * f * tt) * np.exp(-tt * 30)
    return s * np.minimum(tt / 0.002, 1) * 0.2


def pad(notes, d):
    tt = t(d)
    s = np.zeros(len(tt))
    for m in notes:
        for det in (-0.01, -0.003, 0.004, 0.011):
            s += np.sin(2 * np.pi * hz(m) * (1 + det) * tt + rng.uniform(0, 6))
    env = np.minimum(tt / 0.6, 1) * np.minimum(1, (d - tt) / 0.5)
    return filt(s * env, 'low', 2200) * 0.025


# Progresión Am - F - C - G (raíces MIDI del bajo y acordes en voz media)
prog = [(45, [57, 60, 64, 67]), (41, [57, 60, 65, 69]), (48, [55, 60, 64, 67]), (43, [55, 59, 62, 67])]
mel = [  # (semicorchea, nota) un motivo de 2 compases, estilo marimba afro
    (0, 76), (3, 74), (6, 72), (8, 74), (10, 76), (14, 79),
    (16, 81), (19, 79), (22, 76), (24, 74), (27, 72), (30, 74),
]
K, C, HO = kick(), clap(), hat_open()
nbars = int(np.ceil(a.seconds / bar)) + 1
for b in range(nbars):
    t0 = b * bar
    root, chord = prog[b % 4]
    quiet = calm(t0) or calm(t0 + bar - 0.01)
    for q in range(4):
        tb = t0 + q * beat
        if not quiet:
            add(K, tb)
            i = int(tb * SR)
            if i >= N:
                continue
            dip = 1 - 0.6 * np.exp(-t(beat) * 14)
            e = min(N, i + len(dip))
            duck[i:e] = np.minimum(duck[i:e], dip[: e - i])
            add(HO, tb + beat / 2, pan=0.2)
        if q in (1, 3):
            add(C, tb, vol=0.55 if quiet else 1.0)
    for k in range(16):
        swing = 0.012 if k % 2 else 0
        add(shaker(k % 4 == 2), t0 + k * s16 + swing, pan=-0.35, vol=0.7 if quiet else 1)
    # Congas y clave en 3-3-2
    for k, (pitch, slap) in {0: (196, False), 3: (262, True), 6: (196, False), 10: (330, False), 11: (262, True), 14: (196, False)}.items():
        add(conga(pitch, slap), t0 + k * s16, pan=0.35)
    for k in (0, 3, 6, 10, 12):
        add(clave(), t0 + k * s16, pan=-0.2, vol=0.8)
    if not quiet:
        # Bajo sincopado
        for k, dur, oct_ in ((0, 3, 0), (3, 2, 0), (6, 2, 12), (8, 3, 0), (11, 2, 0), (14, 2, 12)):
            add(bass(root - 12 + oct_, dur * s16 * 0.95), t0 + k * s16)
        # Acordes a contratiempo
        for k in (2, 5, 8, 10, 13):
            add(stab(chord, s16 * 2.2), t0 + k * s16, pan=-0.15 if k % 2 else 0.15)
        # Marimba a partir del compás 5
        if b >= 4:
            for k, m in mel:
                st = (b % 2) * 16
                if st <= k < st + 16:
                    add(marimba(m), t0 + (k - st) * s16, pan=0.25)
    else:
        add(stab(chord, bar * 0.9, bright=900) * 2.2, t0)
    add(pad(chord, bar), t0, vol=0.6 if quiet else 1.0)
    # Redoble de congas justo antes de volver del tramo en calma
    if a.calma is not None and t0 < a.calma[1] <= t0 + bar:
        for k in range(8):
            add(conga(196 + 30 * k, k % 2 == 1), a.calma[1] - (8 - k) * s16, pan=0.3, vol=0.8 + 0.05 * k)

# Bombeo: todo lo que no es bombo respira con él
L *= 0.6 + 0.4 * duck
R *= 0.6 + 0.4 * duck
mix = np.stack([L, R], 1)[: int(a.seconds * SR)]
fo = int(1.8 * SR)
mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5
mix /= np.max(np.abs(mix)) + 1e-9
mix = np.tanh(mix * 1.5) / np.tanh(1.5) * 0.9
with wave.open(a.out, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print(f'Afro house listo: {a.out} ({a.seconds:.1f} s, {a.bpm:.0f} BPM)')
