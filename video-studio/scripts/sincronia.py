#!/usr/bin/env python3
"""Mide la sincronía labios-voz de un tramo de video.

Uso: python3 scripts/sincronia.py <video> <inicio_s> <duracion_s> [--x 0.5] [--stream 0]

Abre la boca de la persona (MediaPipe Face Landmarker) fotograma a fotograma y la
compara con la energía de la voz. Imprime el desfase: positivo = el audio llega
tarde respecto a la imagen; negativo = el audio va adelantado.
--x: posición horizontal aproximada (0-1) de la cara que habla si hay varias.
"""
import argparse
import os
import subprocess

import numpy as np
import mediapipe as mp
from mediapipe.tasks.python import BaseOptions, vision

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
MODEL = os.path.join(ROOT, '.models', 'mediapipe', 'face_landmarker.task')
p = argparse.ArgumentParser()
p.add_argument('video')
p.add_argument('start', type=float)
p.add_argument('dur', type=float)
p.add_argument('--x', type=float, default=None)
p.add_argument('--stream', type=int, default=0)
p.add_argument('--crop', default=None, help='x,y,w,h en píxeles de un cuadro 1080x1920 (zona de la cara)')
a = p.parse_args()
FPS, Wd, Hd = 30, 540, 960

vf = f'fps={FPS},scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920'
if a.crop:
    cx, cy, cw, ch = a.crop.split(',')
    vf += f',crop={cw}:{ch}:{cx}:{cy}'
    Wd, Hd = int(cw), int(ch)
else:
    vf += f',scale={Wd}:{Hd}'
raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(a.start), '-t', str(a.dur), '-i', a.video, '-vf', vf, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                     capture_output=True, check=True).stdout
frames = np.frombuffer(raw, np.uint8).reshape(-1, Hd, Wd, 3)
lm = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=MODEL), num_faces=3, running_mode=vision.RunningMode.VIDEO))
mouth = []
for i, fr in enumerate(frames):
    r = lm.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(fr)), int(i * 1000 / FPS))
    best = None
    for f in r.face_landmarks:
        cx = np.mean([q.x for q in f])
        if best is None or (a.x is not None and abs(cx - a.x) < abs(best[0] - a.x)) or (a.x is None and (f[152].y - f[10].y) > best[2]):
            best = (cx, f, f[152].y - f[10].y)
    if best is None:
        mouth.append(np.nan)
    else:
        f = best[1]
        mouth.append((f[14].y - f[13].y) / (f[152].y - f[10].y))
mouth = np.array(mouth)
ok = ~np.isnan(mouth)
mouth[~ok] = np.nanmean(mouth) if ok.any() else 0

pcm = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(a.start), '-t', str(a.dur), '-i', a.video, '-map', f'0:a:{a.stream}',
                      '-ac', '1', '-ar', '16000', '-af', 'highpass=f=150,lowpass=f=3500', '-f', 's16le', '-'], capture_output=True, check=True).stdout
x = np.frombuffer(pcm, np.int16).astype(float)
hop = 16000 // 120  # envolvente a 120 Hz para más resolución
env = np.array([np.sqrt(np.mean(x[i:i + hop * 2] ** 2) + 1) for i in range(0, len(x) - hop * 2, hop)])
env = np.log(env)
# Boca interpolada a 120 Hz
tm = np.arange(len(mouth)) / FPS
te = np.arange(len(env)) / 120
m = np.interp(te, tm, mouth)
z = lambda v: (v - v.mean()) / (v.std() + 1e-9)
m, e = z(m), z(env)
best, lag_best = -9, 0
for lag in range(-60, 61):  # +-0.5 s
    if lag >= 0:
        c = np.mean(m[: len(m) - lag] * e[lag:]) if lag < len(m) else 0
    else:
        c = np.mean(m[-lag:] * e[: len(e) + lag])
    if c > best:
        best, lag_best = c, lag
print(f'caras detectadas en {ok.mean() * 100:.0f}% de fotogramas | desfase audio {lag_best / 120 * 1000:+.0f} ms | correlación {best:.2f}')
