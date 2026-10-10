#!/usr/bin/env python3
"""Genera una pista de música original, libre de derechos, para fondos de reels.

Uso: python3 scripts/musica.py <salida.wav> <segundos> [--bpm 118] [--estilo movida|suave] [--tono C]

- movida: pop/funk alegre, bombo a negras, palmas en 2 y 4, hi-hats, bajo y acordes con "bombeo"
- suave:  misma progresión, sin batería fuerte, para videos tranquilos
Termina con un fade out. Requiere numpy.
"""
import argparse
import wave

import numpy as np

SR = 48000
NOTES = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}

p = argparse.ArgumentParser()
p.add_argument('out')
p.add_argument('seconds', type=float)
p.add_argument('--bpm', type=float, default=118)
p.add_argument('--estilo', default='movida', choices=['movida', 'suave'])
p.add_argument('--tono', default='C', choices=list(NOTES))
args = p.parse_args()

rng = np.random.default_rng(7)
n = int(SR * args.seconds)
beat = 60 / args.bpm
L = np.zeros(n)
R = np.zeros(n)
root = 48 + NOTES[args.tono]  # C3


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def lowpass(x, cutoff):
    # Filtro de un polo, suficiente para suavizar osciladores
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def add(buf, start, sig):
    s = int(start * SR)
    if s >= n:
        return
    e = min(n, s + len(sig))
    buf[s:e] += sig[: e - s]


def saw(f, dur, detune=0.0):
    t = np.arange(int(dur * SR)) / SR
    ph = (t * f * (1 + detune)) % 1.0
    return 2 * ph - 1


def env(dur, a=0.005, d=0.1, s=0.6, r=0.05):
    m = int(dur * SR)
    e = np.full(m, s)
    ai, di, ri = int(a * SR), int(d * SR), int(r * SR)
    e[:ai] = np.linspace(0, 1, ai, endpoint=False) if ai else e[:ai]
    e[ai:ai + di] = np.linspace(1, s, len(e[ai:ai + di]))
    if ri:
        e[-ri:] *= np.linspace(1, 0, len(e[-ri:]))
    return e


def kick():
    t = np.arange(int(0.35 * SR)) / SR
    f = 50 + 110 * np.exp(-t * 35)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * 0.9


def clap():
    t = np.arange(int(0.25 * SR)) / SR
    noise = rng.uniform(-1, 1, len(t))
    burst = np.exp(-t * 25) + 0.6 * np.exp(-np.maximum(t - 0.012, 0) * 30) * (t > 0.012)
    return lowpass(noise * burst, 3500) * 0.55


def hat(open_=False):
    dur = 0.18 if open_ else 0.05
    t = np.arange(int(dur * SR)) / SR
    noise = rng.uniform(-1, 1, len(t))
    hp = noise - lowpass(noise, 7000)
    return hp * np.exp(-t * (18 if open_ else 70)) * 0.22


# Progresión I - V - vi - IV, un acorde por compás
prog = [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]]
bass_roots = [0, 7, 9, 5]
bar = 4 * beat
bars = int(np.ceil(args.seconds / bar)) + 1

K, C, H = kick(), clap(), hat()
HO = hat(True)
pump = np.ones(n)  # "sidechain": los acordes bajan un instante con cada bombo
for b in range(bars):
    t0 = b * bar
    chord = prog[b % 4]
    for q in range(4):
        tb = t0 + q * beat
        if args.estilo == 'movida':
            add(L, tb, K); add(R, tb, K)
            s = int(tb * SR)
            dip = 1 - 0.55 * np.exp(-np.arange(int(beat * SR)) / SR * 12)
            e = min(n, s + len(dip))
            if s < n:
                pump[s:e] = np.minimum(pump[s:e], dip[: e - s])
            if q in (1, 3):
                add(L, tb, C * 0.9); add(R, tb, C)
            add(L, tb + beat / 2, (HO if q == 3 else H) * 0.8)
            add(R, tb + beat / 2, (HO if q == 3 else H))
            add(L, tb + beat / 4, H * 0.35); add(R, tb + 3 * beat / 4, H * 0.35)
        # Bajo: corcheas con salto de octava
        for e8 in range(2):
            note = root - 12 + bass_roots[b % 4] + (12 if (q * 2 + e8) % 4 == 3 else 0)
            dur = beat / 2 * 0.9
            sig = lowpass(saw(hz(note), dur), 700) * env(dur, d=0.08, s=0.5, r=0.02) * 0.45
            add(L, tb + e8 * beat / 2, sig); add(R, tb + e8 * beat / 2, sig)
    # Acordes: golpes sincopados (estilo funk/pop)
    hits = [0, 0.75, 1.5, 2.5, 3.0] if args.estilo == 'movida' else [0, 2]
    for h in hits:
        dur = beat * (0.45 if args.estilo == 'movida' else 1.9)
        for i, iv in enumerate(chord):
            f = hz(root + 12 + iv)
            a = lowpass(saw(f, dur, -0.004), 2600) * env(dur, d=0.12, s=0.35, r=0.06) * 0.09
            c = lowpass(saw(f, dur, 0.004), 2600) * env(dur, d=0.12, s=0.35, r=0.06) * 0.09
            add(L, t0 + h * beat, a); add(R, t0 + h * beat, c)
    # Melodía corta (campanita) en los compases pares
    if b % 2 == 1:
        for k, (st, iv) in enumerate([(0, 16), (0.5, 14), (1, 12), (1.5, 14), (2.5, 19)]):
            dur = beat * 0.45
            tt = np.arange(int(dur * SR)) / SR
            f = hz(root + 12 + iv)
            bell = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt)) * np.exp(-tt * 7) * 0.12
            add(L, t0 + st * beat, bell * 0.8); add(R, t0 + st * beat + 0.012, bell)

if args.estilo == 'movida':
    # El bombeo afecta a todo menos al bombo, que ya está mezclado; es sutil y suena "vivo"
    L *= 0.75 + 0.25 * pump
    R *= 0.75 + 0.25 * pump

mix = np.stack([L, R], axis=1)
fade = min(2.0, args.seconds / 4)
fi = int(fade * SR)
mix[-fi:] *= np.linspace(1, 0, fi)[:, None]
mix[: int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))[:, None]
mix /= np.max(np.abs(mix)) + 1e-9
mix = np.tanh(mix * 1.4) / np.tanh(1.4) * 0.9  # saturación suave, da cuerpo

with wave.open(args.out, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print(f'Música lista: {args.out} ({args.seconds:.1f} s, {args.bpm:.0f} BPM, {args.estilo})')
