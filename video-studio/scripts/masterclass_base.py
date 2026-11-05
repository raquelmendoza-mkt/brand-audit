#!/usr/bin/env python3
"""Base del anuncio "Masterclass gratis 27 de noviembre" (input/masterclass/original.mov, 38.7 s).

Uso: python3 scripts/masterclass_base.py

1. Voz "natural" (preferencia de Raquel): DeepFilterNet -a 18 + EQ suave + compresión ligera.
2. Quita las pausas reales (< -35 dB, >= 0.15 s) dejando 0.05 s de aire.
3. Cambio de ángulo cada 3-4 s en los cortes entre frases: tomas alternas a 1.0x y 1.15x hechas
   en FFmpeg (recorte + lanczos + enfoque cas) para que el acercamiento quede en HD.
Escribe public/work/masterclass/base.mp4 y src/masterclass-marcas.json.
"""
import json
import os
import subprocess

import numpy as np

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
os.chdir(ROOT)
SRC = 'input/masterclass/original.mov'
W = 'public/work/masterclass'
DF = '.models/bin/deep-filter'
os.makedirs(f'{W}/df18', exist_ok=True)
UMBRAL, MIN_PAUSA, AIRE = -35, 0.15, 0.05
# Cambios de ángulo (segundo del original) y zoom de cada toma; la cara está en ~(504, 830)
ANGULOS = [0.0, 7.0, 11.2, 13.9, 17.3, 20.0, 22.36, 24.5, 27.4, 30.5, 33.1, 34.7, 36.9]
ZOOMS = [1.0, 1.15]
CARA = (504, 830)


def run(*a):
    subprocess.run(a, check=True)


voz = f'{W}/voz.wav'
if not os.path.exists(f'{W}/df18/voz-raw.wav'):
    run('ffmpeg', '-v', 'error', '-y', '-i', SRC, '-map', '0:a:0', '-ac', '1', '-ar', '48000', '-af', 'highpass=f=80', f'{W}/voz-raw.wav')
    run(DF, '-D', '-a', '18', '-o', f'{W}/df18', f'{W}/voz-raw.wav')
run('ffmpeg', '-v', 'error', '-y', '-i', f'{W}/df18/voz-raw.wav', '-af',
    'highpass=f=90,equalizer=f=300:t=q:w=1.2:g=-2.5,equalizer=f=3800:t=q:w=1.0:g=1.5,'
    'acompressor=threshold=-22dB:ratio=2:attack=10:release=150:makeup=1.5', voz)

x = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', SRC, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True, check=True).stdout, np.int16).astype(float)
n = 320
db = np.array([20 * np.log10(np.sqrt(np.mean(x[i * n:(i + 1) * n] ** 2)) + 1e-9) - 90 for i in range(len(x) // n)])
dur = len(x) / 16000
pausas, i = [], 0
while i < len(db):
    if db[i] < UMBRAL:
        j = i
        while j < len(db) and db[j] < UMBRAL:
            j += 1
        if (j - i) * 0.02 >= MIN_PAUSA:
            pausas.append((i * 0.02, j * 0.02))
        i = j
    else:
        i += 1

tramos, t0 = [], 0.0
for a, b in pausas:
    if a + AIRE > t0:
        tramos.append([t0, a + AIRE])
    t0 = b - AIRE
tramos.append([t0, dur if not pausas or pausas[-1][1] < dur - 0.05 else pausas[-1][0] + 0.3])
# Finales de palabra muy suaves que el umbral cortaba: el tramo que termina cerca se alarga
COLAS = [36.68]  # "únete" (su "-te" final llega a -38 dB)
for tr in tramos:
    for c in COLAS:
        if c - 0.25 < tr[1] < c:
            tr[1] = c
# Partir también en los cambios de ángulo (para que cada toma tenga su zoom)
partes = []
for a, b in tramos:
    cortes = [a] + [c for c in ANGULOS if a < c < b] + [b]
    partes += [[cortes[k], cortes[k + 1]] for k in range(len(cortes) - 1) if cortes[k + 1] - cortes[k] > 0.04]


def zoom_de(s):
    k = max(i for i, c in enumerate(ANGULOS) if c <= s + 1e-6)
    return ZOOMS[k % 2]


fil, cad, marcas, t = [], '', [], 0.0
for k, (a, b) in enumerate(partes):
    z = zoom_de(a)
    d = b - a
    if z == 1.0:
        enc = 'scale=1080:1920'
    else:
        cw, ch = round(1080 / z / 2) * 2, round(1920 / z / 2) * 2
        cx, cy = round(CARA[0] - CARA[0] / z), round(CARA[1] - CARA[1] / z)
        enc = f'crop={cw}:{ch}:{cx}:{cy},scale=1080:1920:flags=lanczos+accurate_rnd+full_chroma_int,cas=0.45'
    fil.append(f'[0:v]trim={a:.3f}:{b:.3f},setpts=PTS-STARTPTS,fps=30,{enc},setsar=1,format=yuv420p[v{k}]')
    fil.append(f'[1:a]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.012,afade=t=out:st={max(0, d - 0.02):.3f}:d=0.02[a{k}]')
    cad += f'[v{k}][a{k}]'
    marcas.append({'a': round(a, 3), 't': round(t, 3), 'd': round(d, 3), 'zoom': z})
    t += d
fil.append(f'{cad}concat=n={len(partes)}:v=1:a=1[v][a]')
run('ffmpeg', '-v', 'error', '-y', '-i', SRC, '-i', voz, '-filter_complex', ';'.join(fil), '-map', '[v]', '-map', '[a]',
    '-c:v', 'libx264', '-crf', '11', '-preset', 'slow', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', f'{W}/base.mp4')
json.dump({'total': round(t, 3), 'frames': round(t * 30), 'tramos': marcas}, open('src/masterclass-marcas.json', 'w'), indent=1)
print(f'{dur:.2f} s -> {t:.2f} s ({len(pausas)} pausas, {len(partes)} tramos)')
