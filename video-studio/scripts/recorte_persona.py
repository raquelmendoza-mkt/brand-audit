#!/usr/bin/env python3
"""Recorta a la persona de un tramo de video, fotograma a fotograma, para poner
texto DETRÁS de ella en Remotion (se apila: video -> texto -> persona recortada).

Uso: python3 scripts/recorte_persona.py <video> <inicio_s> <fin_s> <carpeta_salida> [--fps 30]

Genera <carpeta_salida>/0000.webp, 0001.webp... (RGBA, persona con fondo
transparente) y imprime dónde está la parte alta de la cabeza en cada momento,
para colocar el texto. Usa MediaPipe (modelo selfie_multiclass de Google) con un
suavizado temporal para que el borde no parpadee.
"""
import argparse
import os
import subprocess

import numpy as np
from PIL import Image, ImageFilter

import mediapipe as mp
from mediapipe.tasks.python import BaseOptions, vision

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
MODEL = os.path.join(ROOT, '.models', 'mediapipe', 'selfie_multiclass_256x256.tflite')

p = argparse.ArgumentParser()
p.add_argument('video')
p.add_argument('start', type=float)
p.add_argument('end', type=float)
p.add_argument('out')
p.add_argument('--fps', type=int, default=30)
a = p.parse_args()
os.makedirs(a.out, exist_ok=True)

probe = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', a.video],
                       capture_output=True, text=True, check=True).stdout.strip().split(',')
W, H = int(probe[0]), int(probe[1])
proc = subprocess.Popen(['ffmpeg', '-v', 'error', '-ss', str(a.start), '-i', a.video, '-t', str(a.end - a.start),
                         '-vf', f'fps={a.fps}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)

seg = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(
    base_options=BaseOptions(model_asset_path=MODEL),
    running_mode=vision.RunningMode.VIDEO,
    output_confidence_masks=True,
))

prev = None
i = 0
heads = []
while True:
    raw = proc.stdout.read(W * H * 3)
    if len(raw) < W * H * 3:
        break
    rgb = np.frombuffer(raw, np.uint8).reshape(H, W, 3)
    res = seg.segment_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb), int(i * 1000 / a.fps))
    person = np.squeeze(1.0 - res.confidence_masks[0].numpy_view())
    m = np.array(Image.fromarray((np.clip(person, 0, 1) * 255).astype(np.uint8)).resize((W, H), Image.BILINEAR), np.float32) / 255
    # Suavizado temporal: evita que el borde "tiemble" entre fotogramas
    m = m if prev is None else 0.65 * m + 0.35 * prev
    prev = m
    # Contraste del borde: limpio pero sin dientes de sierra
    alpha = np.clip((m - 0.35) / 0.3, 0, 1)
    alpha_img = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
    rgba = Image.fromarray(rgb).convert('RGBA')
    rgba.putalpha(alpha_img)
    rgba.save(os.path.join(a.out, f'{i:04d}.webp'), quality=92, method=4)
    rows = np.where(alpha.max(axis=1) > 0.5)[0]
    heads.append(int(rows[0]) if len(rows) else -1)
    i += 1
proc.wait()
seg.close()

print(f'{i} fotogramas en {a.out}')
valid = [h for h in heads if h >= 0]
if valid:
    print(f'Parte alta de la cabeza (px desde arriba): min {min(valid)}, max {max(valid)}, mediana {int(np.median(valid))}')
    step = max(1, i // 10)
    print('Muestra (fotograma: y):', ', '.join(f'{k}:{heads[k]}' for k in range(0, i, step)))
