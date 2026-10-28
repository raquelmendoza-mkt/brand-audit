#!/usr/bin/env python3
"""Detecta el ritmo de una canción para cortar y animar AL BEAT.

Uso: python3 -I scripts/beats.py <musica.wav|mp3> [salida.json] [--bpm 120]

Calcula los ataques (flujo espectral, con más peso en graves = bombo), prueba cada tempo de 70 a
180 BPM con una rejilla de beats (o usa --bpm si lo sabes), alinea la rejilla de beats con los golpes reales y marca el inicio de cada
compás (cada 4 beats, empezando en el beat más fuerte). Imprime y guarda:
  {"bpm": 124.0, "beats": [0.48, 0.97, ...], "compases": [0.48, 2.42, ...], "fuertes": [...]}
"fuertes" = los ataques más marcados (drops, golpes): ideales para títulos, flashes o impactos.
En Remotion importa el JSON y usa los tiempos para Sequences, PUNCHES o transiciones.
"""
import json
import subprocess
import sys

import numpy as np

args = [a for a in sys.argv[1:] if not a.startswith('--')]
bpm_fijo = float(sys.argv[sys.argv.index('--bpm') + 1]) if '--bpm' in sys.argv else None
if bpm_fijo:
    args = [a for a in args if a != str(sys.argv[sys.argv.index('--bpm') + 1])]
entrada = args[0]
salida = args[1] if len(args) > 1 else None

SR = 22050
pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', entrada, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True, check=True).stdout
x = np.frombuffer(pcm, np.int16).astype(float) / 32768

# Flujo espectral (ataques)
HOP, N = 512, 2048
win = np.hanning(N)
frames = 1 + (len(x) - N) // HOP
spec = np.abs(np.array([np.fft.rfft(x[i * HOP: i * HOP + N] * win) for i in range(frames)]))
spec = np.log1p(spec * 10)
flux = np.maximum(0, np.diff(spec, axis=0)).sum(axis=1)
flux = np.concatenate([[0], flux])
flux -= np.convolve(flux, np.ones(16) / 16, 'same')  # quita la tendencia
flux = np.maximum(flux, 0)
fps = SR / HOP

# Pulso: ataques en graves (bombo, < 250 Hz) + ataques generales con menos peso
graves = spec[:, : int(250 / (SR / N)) + 1]
flux_g = np.concatenate([[0], np.maximum(0, np.diff(graves, axis=0)).sum(axis=1)])
flux_g = np.maximum(flux_g - np.convolve(flux_g, np.ones(16) / 16, 'same'), 0)
pulso = flux_g / (flux_g.max() + 1e-9) + 0.35 * flux / (flux.max() + 1e-9)
t_flux = np.arange(len(flux)) / fps


def puntua(periodo):
    """Mejor fase y puntaje medio de una rejilla de beats con este periodo."""
    mejor, fase = -1.0, 0.0
    for f in np.linspace(0, periodo, 48, endpoint=False):
        idx = np.round(np.arange(f, t_flux[-1], periodo) * fps).astype(int)
        idx = idx[idx < len(pulso)]
        sc = pulso[idx].mean() if len(idx) else 0
        if sc > mejor:
            mejor, fase = sc, f
    return mejor, fase


if bpm_fijo:
    bpm = bpm_fijo
else:
    candidatos = np.arange(70, 181, 0.5)
    sc = np.array([puntua(60 / b)[0] for b in candidatos])
    # Leve preferencia por el rango típico de reels (95-140 BPM)
    peso = np.exp(-((candidatos - 120) / 45) ** 2) * 0.25 + 1
    bpm = float(candidatos[np.argmax(sc * peso)])
periodo = 60 / bpm
_, fase = puntua(periodo)
beats = np.arange(fase, t_flux[-1], periodo)

# Ajuste fino: cada beat al pico de ataque más cercano (±60 ms)
fin = []
for b in beats:
    i0, i1 = int((b - 0.06) * fps), int((b + 0.06) * fps) + 1
    i0, i1 = max(i0, 0), min(i1, len(flux))
    fin.append(round((i0 + int(np.argmax(pulso[i0:i1]))) / fps, 3) if i1 > i0 else round(b, 3))
beats = fin

# Compás: grupo de 4 empezando en el beat que suma más energía
fuerza = [pulso[min(int(b * fps), len(pulso) - 1)] for b in beats]
inicio = int(np.argmax([sum(fuerza[i::4]) for i in range(4)]))
compases = beats[inicio::4]
umbral = np.percentile(flux, 99.3)
fuertes = [round(i / fps, 3) for i in range(1, len(flux) - 1) if flux[i] > umbral and flux[i] >= flux[i - 1] and flux[i] >= flux[i + 1]]
# Separa los fuertes al menos 1 beat
filtrados = []
for f in fuertes:
    if not filtrados or f - filtrados[-1] > periodo:
        filtrados.append(f)

res = {'bpm': round(bpm, 1), 'beats': beats, 'compases': compases, 'fuertes': filtrados}
if salida:
    json.dump(res, open(salida, 'w'), indent=1)
print(f'{res["bpm"]} BPM · {len(beats)} beats · {len(compases)} compases · fuertes: {filtrados[:10]}{"..." if len(filtrados) > 10 else ""}')
print('primeros beats:', beats[:8])
