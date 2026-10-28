#!/usr/bin/env python3
"""Reencuadre automático: convierte video horizontal (16:9) a vertical 9:16 SIGUIENDO la cara.

Uso: python3 scripts/reencuadre.py <entrada> <salida.mp4> [--suavizado 0.92] [--x-fija 0.5]

Detecta a la persona en cada fotograma (segmentación MediaPipe selfie_multiclass: funciona en
primer plano y en cuerpo entero; con la cara si se ve, con el cuerpo si no), suaviza el movimiento
como un operador de cámara (sin saltos) y recorta una ventana 9:16 de alto completo centrada en
la persona. Si en un tramo no hay persona, mantiene la última posición (o --x-fija, 0-1).
El audio se copia tal cual. Salida 1080x1920 30 fps.
"""
import argparse
import os
import subprocess

import numpy as np
import mediapipe as mp
from mediapipe.tasks.python import BaseOptions, vision

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
MODEL = os.path.join(ROOT, '.models', 'mediapipe', 'selfie_multiclass_256x256.tflite')
p = argparse.ArgumentParser()
p.add_argument('entrada')
p.add_argument('salida')
p.add_argument('--suavizado', type=float, default=0.92)
p.add_argument('--x-fija', type=float, default=0.5)
a = p.parse_args()

w, h = map(int, subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', a.entrada],
                               capture_output=True, text=True, check=True).stdout.strip().split(',')[:2])
FPS = 30
AW = 640  # análisis a baja resolución
AH = int(h * AW / w) // 2 * 2
proc = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', a.entrada, '-vf', f'fps={FPS},scale={AW}:{AH}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
det = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(base_options=BaseOptions(model_asset_path=MODEL), running_mode=vision.RunningMode.VIDEO, output_category_mask=True))
xs = []
i = 0
while True:
    buf = proc.stdout.read(AW * AH * 3)
    if len(buf) < AW * AH * 3:
        break
    fr = np.frombuffer(buf, np.uint8).reshape(AH, AW, 3)
    r = det.segment_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(fr)), int(i * 1000 / FPS))
    m = np.squeeze(r.category_mask.numpy_view())
    cara = m == 3  # clase 3 = piel de la cara: si se ve, manda la cara
    persona = m > 0
    sel = cara if cara.sum() > 40 else persona
    if sel.sum() > 200:
        cols = np.nonzero(sel)[1]
        xs.append(float(np.median(cols)) / AW)
    else:
        xs.append(np.nan)
    i += 1
proc.wait()
det.close()
xs = np.array(xs)
detectada = float(np.mean(~np.isnan(xs))) * 100 if len(xs) else 0.0
if np.all(np.isnan(xs)):
    xs[:] = a.x_fija
# Rellena huecos con la última posición conocida (o la siguiente al inicio)
ultimo = next((v for v in xs if not np.isnan(v)), a.x_fija)
for k in range(len(xs)):
    if np.isnan(xs[k]):
        xs[k] = ultimo
    else:
        ultimo = xs[k]
# Suavizado de ida y vuelta (sin retraso) tipo operador de cámara
s = a.suavizado
for k in range(1, len(xs)):
    xs[k] = s * xs[k - 1] + (1 - s) * xs[k]
for k in range(len(xs) - 2, -1, -1):
    xs[k] = s * xs[k + 1] + (1 - s) * xs[k]

cw = int(h * 9 / 16) // 2 * 2
if cw > w:
    raise SystemExit('El video ya es vertical o más estrecho que 9:16: usa npm run ff -- vertical')
pos = np.clip(xs * w - cw / 2, 0, w - cw)
# Expresión de recorte por fotograma para FFmpeg (tramos lineales cada 5 fotogramas)
pts = list(range(0, len(pos), 5)) + [len(pos) - 1]
expr = str(int(pos[-1]))
for k0, k1 in reversed(list(zip(pts[:-1], pts[1:]))):
    x0, x1 = pos[k0], pos[k1]
    expr = f"if(lt(n,{k1}),{x0:.1f}+({x1 - x0:.1f})*(n-{k0})/{max(k1 - k0, 1)},{expr})"
# Archivo de filtro (la expresión puede ser larga)
fpath = a.salida + '.filtro.txt'
with open(fpath, 'w') as fh:
    fh.write(f"[0:v]fps={FPS},crop={cw}:{h}:'{expr}':0,scale=1080:1920:flags=lanczos,format=yuv420p[v]")
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', a.entrada, '-filter_complex_script', fpath, '-map', '[v]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'slow',
                '-crf', '15', '-c:a', 'aac', '-b:a', '256k', a.salida], check=True)
os.remove(fpath)
print(f'Reencuadre listo: {a.salida} (persona detectada en {detectada:.0f}% de los fotogramas · ventana {cw}x{h})')
