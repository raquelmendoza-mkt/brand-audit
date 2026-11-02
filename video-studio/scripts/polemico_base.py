#!/usr/bin/env python3
"""Base del reel "Opinión impopular: ¿TikTok le baja el prestigio a una marca?".

Uso: python3 scripts/polemico_base.py

El video ya viene editado (textos y capturas incrustados). Solo se quitan las pausas: tramos
bajo -35 dB de al menos 0.15 s (sin unir microsilencios: están dentro de las palabras); en cada corte se
dejan 0.05 s de aire a cada lado para que no suene cortado. Escribe:
  public/work/polemico/base.mp4   video sin pausas (mismo audio, 30 fps)
  src/polemico-marcas.json        tramos conservados: inicio en el original, en el reel y duración
"""
import json
import os
import subprocess

import numpy as np

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
os.chdir(ROOT)
SRC = 'input/polemico/original.mov'
W = 'public/work/polemico'
os.makedirs(W, exist_ok=True)
UMBRAL, MIN_PAUSA, UNIR, AIRE = -35, 0.15, 0.0, 0.05

dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', SRC], capture_output=True, text=True).stdout)
x = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', SRC, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True, check=True).stdout, np.int16).astype(float)
n = 320  # 20 ms
db = np.array([20 * np.log10(np.sqrt(np.mean(x[i * n:(i + 1) * n] ** 2)) + 1e-9) - 90 for i in range(len(x) // n)])

pausas = []
i = 0
while i < len(db):
    if db[i] < UMBRAL:
        j = i
        while j < len(db) and db[j] < UMBRAL:
            j += 1
        a, b = i * 0.02, j * 0.02
        if pausas and a - pausas[-1][1] < UNIR:
            pausas[-1][1] = b
        else:
            pausas.append([a, b])
        i = j
    else:
        i += 1
pausas = [p for p in pausas if p[1] - p[0] >= MIN_PAUSA]

# Tramos con voz (el final conserva 0.3 s de cola)
tramos, t0 = [], 0.0
for a, b in pausas:
    if a + AIRE > t0:
        tramos.append([t0, a + AIRE])
    t0 = b - AIRE
fin = min(dur, (pausas[-1][0] + 0.3) if pausas and pausas[-1][1] >= dur - 0.05 else dur)
if t0 < fin:
    tramos.append([t0, fin])
tramos = [[round(a, 3), round(b, 3)] for a, b in tramos if b - a > 0.05]

fil, cad, marcas, t = [], '', [], 0.0
for k, (a, b) in enumerate(tramos):
    d = b - a
    fil.append(f'[0:v]trim={a}:{b},setpts=PTS-STARTPTS,fps=30,format=yuv420p[v{k}]')
    fil.append(f'[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d=0.012,afade=t=out:st={max(0, d - 0.02):.3f}:d=0.02[a{k}]')
    cad += f'[v{k}][a{k}]'
    marcas.append({'a': a, 't': round(t, 3), 'd': round(d, 3)})
    t += d
fil.append(f'{cad}concat=n={len(tramos)}:v=1:a=1[v][a]')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', SRC, '-filter_complex', ';'.join(fil), '-map', '[v]', '-map', '[a]',
                '-c:v', 'libx264', '-crf', '15', '-preset', 'slow', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', f'{W}/base.mp4'], check=True)
json.dump({'original': round(dur, 3), 'total': round(t, 3), 'frames': round(t * 30), 'tramos': marcas}, open('src/polemico-marcas.json', 'w'), indent=1)
print(f'{dur:.2f} s -> {t:.2f} s ({len(pausas)} pausas quitadas, {dur - t:.2f} s menos)')
