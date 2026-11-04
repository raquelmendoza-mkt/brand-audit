#!/usr/bin/env python3
"""Base del reel "CRECE EN INSTAGRAM ASÍ" (input/crece/original.mov, 21 s).

Uso: python3 scripts/crece_base.py

1. Voz "natural": DeepFilterNet moderado (-a 18) + EQ suave contra la resonancia de la habitación
   + compresión ligera. No cambia el timbre: no hay pitch ni efectos.
2. Cortes: una pieza por frase (tiempos de faster-whisper, input/crece/original.mov.trans.json),
   con 0.08 s de aire antes y la cola real de la última palabra (hasta que la voz cae a -40 dB).
Escribe public/work/crece/base.mp4 y src/crece-marcas.json (piezas con texto e inicio en el reel).
"""
import json
import os
import subprocess

import numpy as np

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
os.chdir(ROOT)
SRC = 'input/crece/original.mov'
W = 'public/work/crece'
DF = '.models/bin/deep-filter'
os.makedirs(f'{W}/df', exist_ok=True)


def run(*a):
    subprocess.run(a, check=True)


voz = f'{W}/voz.wav'
# Limpieza "natural" (la que eligió Raquel entre 3 pruebas): DeepFilterNet con el recorte de ruido
# limitado a 18 dB (-a 18; sin límite la voz quedaba metálica) + EQ suave contra la resonancia de
# la habitación + compresión ligera. Sin expansor: cortaba las colas y la voz se entendía peor.
if not os.path.exists(f'{W}/df18/voz-raw.wav'):
    os.makedirs(f'{W}/df18', exist_ok=True)
    if not os.path.exists(f'{W}/voz-raw.wav'):
        run('ffmpeg', '-v', 'error', '-y', '-i', SRC, '-map', '0:a:0', '-ac', '1', '-ar', '48000', '-af', 'highpass=f=80', f'{W}/voz-raw.wav')
    run(DF, '-D', '-a', '18', '-o', f'{W}/df18', f'{W}/voz-raw.wav')
run('ffmpeg', '-v', 'error', '-y', '-i', f'{W}/df18/voz-raw.wav', '-af',
    'highpass=f=90,equalizer=f=300:t=q:w=1.2:g=-2.5,equalizer=f=3800:t=q:w=1.0:g=1.5,'
    'acompressor=threshold=-22dB:ratio=2:attack=10:release=150:makeup=1.5', voz)

# Envolvente para encontrar la cola real de cada frase
x = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', voz, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True, check=True).stdout, np.int16).astype(float)
n = 160
db = np.array([20 * np.log10(np.sqrt(np.mean(x[i * n:(i + 1) * n] ** 2)) + 1e-9) - 90 for i in range(len(x) // n)])
dur = len(x) / 16000


def cola(s):
    i = int(s * 100)
    while i < len(db) - 1 and db[i] > -40 and i < int((s + 0.35) * 100):
        i += 1
    return min(dur, i / 100 + 0.06)


frases = json.load(open(SRC + '.trans.json'))
piezas, t = [], 0.0
for k, f in enumerate(frases):
    a = max(0.0, f['a'] - 0.08)
    b = cola(f['b'])
    if k + 1 < len(frases):
        b = min(b, frases[k + 1]['a'] - 0.08)
    piezas.append({'id': k, 'a': round(a, 3), 'b': round(b, 3), 't': round(t, 3), 'texto': f['t'], 'palabras': f['w']})
    t += b - a

fil, cad = [], ''
for k, p in enumerate(piezas):
    d = p['b'] - p['a']
    fil.append(f"[0:v]trim={p['a']}:{p['b']},setpts=PTS-STARTPTS,fps=30,format=yuv420p[v{k}]")
    fil.append(f"[1:a]atrim={p['a']}:{p['b']},asetpts=PTS-STARTPTS,afade=t=in:d=0.015,afade=t=out:st={d - 0.03:.3f}:d=0.03[a{k}]")
    cad += f'[v{k}][a{k}]'
fil.append(f'{cad}concat=n={len(piezas)}:v=1:a=1[v][a]')
run('ffmpeg', '-v', 'error', '-y', '-i', SRC, '-i', voz, '-filter_complex', ';'.join(fil), '-map', '[v]', '-map', '[a]',
    '-c:v', 'libx264', '-crf', '15', '-preset', 'slow', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', f'{W}/base.mp4')
json.dump({'total': round(t, 3), 'frames': round(t * 30), 'piezas': piezas}, open('src/crece-marcas.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'{dur:.2f} s -> {t:.2f} s en {len(piezas)} frases')
