#!/usr/bin/env python3
"""Monta la base del reel Casa Comercial El Viñedo (orden del guión, silencios fuera).

Cada tramo se recorta del original 4K, se lleva a 1080x1920 a 30 fps y se une.
Imprime el inicio de cada tramo en la línea de tiempo final (para Remotion).
"""
import json
import os
import subprocess

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
IN = os.path.join(ROOT, 'input', 'vinedo')
OUT = os.path.join(ROOT, 'public', 'work', 'vinedo')
TMP = os.path.join(OUT, 'tramos')
os.makedirs(TMP, exist_ok=True)

# (clave, archivo, entrada, salida)
TRAMOS = [
    ('gancho', 'IMG_1842.MOV', 1.00, 7.90),      # "La próxima inauguración..." + corta la cinta
    ('realidad', 'IMG_1842.MOV', 9.05, 13.55),   # "Y aquí lo puedes hacer realidad" + va a la puerta
    ('dron', 'ia/ia_161546.mp4', 0.0, 5.0),      # toma de dron hecha con IA
    ('corre', 'IMG_1897.MOV', 1.90, 5.15),       # "Ya va, queremos información"
    ('cuentame', 'IMG_1848.MOV', 0.75, 3.15),    # "¿Me puedes comentar más...?"
    ('pasa', 'IMG_1900.MOV', 0.00, 3.40),        # "Ven, pasa"
    ('broll1', 'IMG_1859.MOV', 0.30, 2.50),      # caminando por planta baja
    ('ubicacion', 'IMG_1854.MOV', 3.95, 13.45),  # ubicación en El Viñedo
    ('niveles', 'IMG_1861.MOV', 2.05, 9.10),     # "cuenta con dos niveles" + escalera
    ('metros', 'IMG_1871.MOV', 7.72, 20.20),     # 450 / 600 / 14 hab / 10 baños
    ('marca', 'IMG_1872.MOV', 0.85, 4.10),       # "aquí podría montar mi casa de marca"
    ('espacios', 'IMG_1879.MOV', 2.80, 16.80),   # clínica, spa... se alquila por espacios
    ('cta', 'IMG_1837.MOV', 0.15, 6.60),         # "comenta la palabra VIÑEDO"
]

VF = 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,format=yuv420p'
lista = []
t = 0.0
marcas = {}
for clave, arch, a, b in TRAMOS:
    src = os.path.join(IN, arch)
    dst = os.path.join(TMP, f'{clave}.mp4')
    dur = b - a
    tiene_audio = not arch.startswith('ia/')
    cmd = ['ffmpeg', '-v', 'error', '-y', '-ss', f'{a}', '-t', f'{dur}', '-i', src]
    if not tiene_audio:
        cmd += ['-f', 'lavfi', '-t', f'{dur}', '-i', 'anullsrc=r=48000:cl=stereo', '-map', '0:v', '-map', '1:a']
    # Micro fundido de audio en cada corte para que no haya "clics"
    af = ('highpass=f=90,loudnorm=I=-16:TP=-1.5:LRA=9,' if tiene_audio else '') + f'aresample=48000,aformat=channel_layouts=stereo,afade=t=in:d=0.03,afade=t=out:st={dur - 0.04:.3f}:d=0.04'
    cmd += ['-vf', VF, '-af', af, '-frames:v', str(round(dur * 30)),
            '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-c:a', 'pcm_s16le', dst.replace('.mp4', '.mov')]
    subprocess.run(cmd, check=True)
    lista.append(dst.replace('.mp4', '.mov'))
    marcas[clave] = round(t, 3)
    t += round(dur * 30) / 30

with open(os.path.join(TMP, 'lista.txt'), 'w') as f:
    for p in lista:
        f.write(f"file '{p}'\n")
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', os.path.join(TMP, 'lista.txt'),
                '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', os.path.join(OUT, 'base.mp4')], check=True)
json.dump({'marcas': marcas, 'total': round(t, 3)}, open(os.path.join(OUT, 'marcas.json'), 'w'), indent=1)
print(json.dumps(marcas, indent=1), 'total', round(t, 3))
