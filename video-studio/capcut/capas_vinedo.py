#!/usr/bin/env python3
"""Exporta El Viñedo a CapCut POR CAPAS: se ve idéntico a Remotion y sigue siendo editable.

Uso: python3 capcut/capas_vinedo.py --semilla input/capcut/semilla.zip [--hasta 27.1]

Capas del proyecto (de abajo hacia arriba):
  principal          fondo.mp4: video + B-roll con los mismos zooms, cortado pieza por pieza
  graficos-remotion  graficos.mov (ProRes 4444 con transparencia): títulos, íconos, confeti y la
                     persona recortada (texto DETRÁS de ella)
  subtitulos-remotion subtitulos.mov (ProRes 4444 con transparencia, solo la franja de abajo): se
                     puede borrar y usar los subtítulos automáticos de CapCut
  voz / musica / sfx audio en pistas separadas (misma mezcla que el reel, a -14 LUFS)

Límite: las capas de Remotion están "horneadas" al tiempo del reel; si en CapCut se mueve o se
alarga un corte del fondo, hay que mover también los gráficos (o volver a exportar desde aquí).
"""
import json
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import rm_capcut  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
os.chdir(ROOT)
W = 'public/work/vinedo'
CAP = 'out/capas'
os.makedirs(CAP, exist_ok=True)
H = float(sys.argv[sys.argv.index('--hasta') + 1]) if '--hasta' in sys.argv else None
marcas = json.load(open('src/vinedo-marcas.json'))
H = min(H or marcas['total'], marcas['total'])
FR = round(H * 30)


def ff(*args):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *args], check=True)


def render(capa, salida, *extra):
    if not os.path.exists(salida):
        print(f'Renderizando capa {capa}...')
        subprocess.run(['npx', 'remotion', 'render', 'CasaComercialVinedo', salida, f'--frames=0-{FR - 1}',
                        f'--props={json.dumps({"capa": capa})}', '--log=error', *extra], check=True)


ALFA = ['--codec=prores', '--prores-profile=4444', '--pixel-format=yuva444p10le', '--image-format=png', '--concurrency=3']
render('fondo', f'{CAP}/fondo.mp4', '--crf=16', '--muted', '--concurrency=2')
render('graficos', f'{CAP}/graficos-master.mov', *ALFA)
render('subtitulos', f'{CAP}/subtitulos-master.mov', *ALFA)
render('sfx', f'{CAP}/sfx-master.wav', '--codec=wav')

# ProRes 4444 a calidad visualmente idéntica (PSNR ~60 dB) y la mitad del peso. Los subtítulos
# solo ocupan una franja: se recortan a 1080x280 (y 1300-1580) y en CapCut se colocan en y=-0.5
# (centro de la franja = 1440 px; CapCut mide en mitades de lienzo desde el centro, + = arriba)
SUB_Y0, SUB_H = 1300, 280
for c, vf in (('graficos', []), ('subtitulos', ['-vf', f'crop=1080:{SUB_H}:0:{SUB_Y0}'])):
    if not os.path.exists(f'{CAP}/{c}.mov'):
        ff('-i', f'{CAP}/{c}-master.mov', *vf, '-c:v', 'prores_ks', '-profile:v', '4', '-pix_fmt', 'yuva444p10le',
           '-qscale:v', '9', '-alpha_bits', '8', '-vendor', 'apl0', f'{CAP}/{c}.mov')
SUB_TY = round((960 - (SUB_Y0 + SUB_H / 2)) / 960, 6)

# --- Audio en pistas separadas, con la misma mezcla del reel (ducking de la música bajo la voz)
voz, sfx, mus = f'{CAP}/voz-crudo.wav', f'{CAP}/sfx-master.wav', f'{CAP}/musica-crudo.wav'
ff('-i', f'{W}/base.mp4', '-t', str(H), '-vn', '-ac', '2', '-ar', '48000', voz)
ff('-i', voz, '-i', sfx, '-i', f'{W}/musica-electro.wav', '-filter_complex',
   '[0:a][1:a]amix=inputs=2:normalize=0:duration=first[sc];'
   f'[2:a]atrim=0:{H},volume=0.26[m];[m][sc]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=350,'
   f'afade=t=out:st={H - 1.2}:d=1.2', '-ar', '48000', mus)


def lufs(f):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', f, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r)[-1]), float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', r)[-1])


ff('-i', voz, '-i', sfx, '-i', mus, '-filter_complex', 'amix=inputs=3:normalize=0:duration=first', f'{CAP}/mezcla.wav')
li, pico = lufs(f'{CAP}/mezcla.wav')
g = min(-14 - li, -1.0 - pico)  # a -14 LUFS sin pasar de -1 dB de pico
for src, dst in ((voz, 'voz'), (sfx, 'sfx'), (mus, 'musica')):
    ff('-i', src, '-t', str(H), '-af', f'volume={g:.2f}dB', '-c:a', 'aac', '-b:a', '256k', f'{CAP}/{dst}.m4a')
print(f'Mezcla: {li:.1f} LUFS -> ganancia {g:+.1f} dB')

# --- Vista previa: lo que debe verse en CapCut (fondo + capas + audio)
ff('-i', f'{CAP}/fondo.mp4', '-i', f'{CAP}/graficos.mov', '-i', f'{CAP}/subtitulos.mov', '-i', f'{CAP}/voz.m4a', '-i', f'{CAP}/sfx.m4a', '-i', f'{CAP}/musica.m4a',
   '-filter_complex', f'[0:v][1:v]overlay=format=auto[a];[a][2:v]overlay=0:{SUB_Y0}:format=auto,format=yuv420p[v];'
   '[3:a][4:a][5:a]amix=inputs=3:normalize=0:duration=first[au]',
   '-map', '[v]', '-map', '[au]', '-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', f'{CAP}/vista-previa.mp4')

# --- Plan de CapCut
video = []
for p in marcas['piezas']:
    a, b = p['t'], min(p['t'] + p['b'] - p['a'], H)
    if a < H - 0.05:
        video.append({'archivo': f'{CAP}/fondo.mp4', 'desde': round(a, 3), 'hasta': round(b, 3), 'en': round(a, 3), 'volumen': 0})
plan = {
    'nombre': f'RM - Vinedo por capas {int(H)}s', 'ancho': 1080, 'alto': 1920, 'fps': 30,
    'video': video,
    'superpuestos': [
        {'archivo': f'{CAP}/graficos.mov', 'en': 0, 'desde': 0, 'hasta': H, 'pista': 'graficos-remotion'},
        {'archivo': f'{CAP}/subtitulos.mov', 'en': 0, 'desde': 0, 'hasta': H, 'y': SUB_TY, 'pista': 'subtitulos-remotion'},
    ],
    'audio': [{'archivo': f'{CAP}/{n}.m4a', 'en': 0, 'desde': 0, 'hasta': H, 'volumen': 1.0, 'pista': n} for n in ('voz', 'musica', 'sfx')],
}
json.dump(plan, open(f'{CAP}/plan-capas.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
semilla = sys.argv[sys.argv.index('--semilla') + 1] if '--semilla' in sys.argv else None
d, z, datos = rm_capcut.construir(plan, semilla)
print(f'Listo: {z} ({os.path.getsize(z) / 1048576:.1f} MB) · {datos["duration"] / 1e6:.1f} s · {len(datos["tracks"])} pistas')
for a in dict.fromkeys(rm_capcut.avisos):
    print('  Aviso:', a)
