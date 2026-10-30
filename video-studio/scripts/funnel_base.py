#!/usr/bin/env python3
"""Base del reel TOFU · MOFU · BOFU (input/funnel/IMG_3921.MOV, 2 min -> ~39 s).

Uso: python3 scripts/funnel_base.py

Elige las frases del guión (tiempos de faster-whisper, ver IMG_3921.MOV.trans.json), deja la
mejor toma de las repetidas al final, limpia la voz con DeepFilterNet, inserta el gancho de
referencia (IMG_3929, Christian Villar) y escribe:
  public/work/funnel/base.mp4      video 1080x1920 30 fps con la voz limpia, ya cortado
  public/work/funnel/gancho-*.mp4  los 3 ganchos de referencia para los celulares
  src/funnel-marcas.json           cada pieza: id, inicio en el reel, duración, texto
"""
import json
import os
import subprocess

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
os.chdir(ROOT)
IN = 'input/funnel'
W = 'public/work/funnel'
os.makedirs(W, exist_ok=True)
DF = '.models/bin/deep-filter'

# (id, fuente, desde, hasta, texto)
PIEZAS = [
    ('hook', 'M', 0.22, 3.34, 'TOFU, MOFU y BOFU para asesores inmobiliarios.'),
    ('tofu', 'M', 3.40, 3.84, 'TOFU,'),
    ('atraccion', 'M', 5.08, 7.62, 'aquí es donde tú vas a hacer el ángulo de atracción,'),
    ('pregunta', 'M', 11.72, 13.84, '¿qué es mejor, comprar o alquilar?'),
    ('gancho', 'G', 0.0, 3.05, '(gancho de referencia: Christian Villar)'),
    ('tendencias', 'M', 15.82, 17.20, 'Te puedes unir a tendencias'),
    ('alcance', 'M', 17.44, 19.06, 'para llegar a muchas más personas.'),
    ('mofu', 'M', 22.87, 23.64, 'Middle of the funnel:'),
    ('confianza', 'M', 26.79, 28.86, 'tú estás educando, estás emitiendo confianza.'),
    ('zonas', 'M', 32.03, 34.72, 'Aquí tú puedes hablar sobre zonas para comprar,'),
    ('documentos', 'M', 34.98, 37.12, 'documentos que necesitas para comprar o para vender.'),
    ('bofu', 'M', 39.64, 41.32, 'Y al final, que es el BOFU,'),
    ('conversion', 'M', 43.70, 45.64, 'aquí lo que vas a hacer es conversión.'),
    ('casos', 'M', 68.30, 69.64, 'Vas a subir casos de éxito,'),
    ('dias', 'M', 69.88, 72.00, 'número de días en los que cerraste una vivienda,'),
    ('testimonios', 'M', 72.40, 74.26, 'vas a subir testimonios de tus clientes.'),
    ('resultados', 'M', 85.30, 87.44, 'Cuando muestras resultados reales, esas personas'),
    ('clientes', 'M', 89.62, 91.06, 'terminan siendo clientes.'),
    ('importante', 'M', 112.93, 115.58, 'Es muy importante siempre utilizar TOFU, MOFU y BOFU'),
    ('vender', 'M', 116.45, 118.75, 'para vender y captar más.'),
]
FUENTES = {'M': f'{IN}/IMG_3921.MOV', 'G': f'{IN}/complemento/IMG_3929.MP4'}


def run(*a):
    subprocess.run(a, check=True)


def lufs(f):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', f, '-af', 'loudnorm=I=-16:TP=-1.5:print_format=json', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
    return float(json.loads(r[r.rindex('{'):])['input_i'])


# Voz limpia de la toma principal (DeepFilterNet + EQ de voz + compresión suave), a -16 LUFS
voz = f'{W}/voz.wav'
if not os.path.exists(voz):
    run('ffmpeg', '-v', 'error', '-y', '-i', FUENTES['M'], '-map', '0:a:0', '-ac', '1', '-ar', '48000', '-af', 'highpass=f=90', f'{W}/voz-raw.wav')
    os.makedirs(f'{W}/df', exist_ok=True)
    run(DF, '-D', '-a', '40', '-o', f'{W}/df', f'{W}/voz-raw.wav')
    run('ffmpeg', '-v', 'error', '-y', '-i', f'{W}/df/voz-raw.wav', '-af',
        'highpass=f=100,equalizer=f=300:t=q:w=1.2:g=-2,equalizer=f=4000:t=q:w=1.0:g=2,'
        'acompressor=threshold=-24dB:ratio=3:attack=8:release=120:makeup=2', f'{W}/voz-eq.wav')
    g = -16 - lufs(f'{W}/voz-eq.wav')
    run('ffmpeg', '-v', 'error', '-y', '-i', f'{W}/voz-eq.wav', '-af', f'volume={g:.2f}dB,alimiter=limit=0.89', voz)

# Gancho de referencia con su audio a -16 LUFS
gan = f'{W}/gancho-audio.wav'
if not os.path.exists(gan):
    run('ffmpeg', '-v', 'error', '-y', '-i', FUENTES['G'], '-t', '4', '-vn', '-ac', '1', '-ar', '48000', f'{W}/gancho-raw.wav')
    g = -16 - lufs(f'{W}/gancho-raw.wav')
    run('ffmpeg', '-v', 'error', '-y', '-i', f'{W}/gancho-raw.wav', '-af', f'volume={g:.2f}dB,alimiter=limit=0.89', gan)

# Clips de los 3 ganchos (para los celulares), mudos, 30 fps
for n in ('3927', '3928', '3929'):
    dst = f'{W}/gancho-{n}.mp4'
    if not os.path.exists(dst):
        run('ffmpeg', '-v', 'error', '-y', '-i', f'{IN}/complemento/IMG_{n}.MP4', '-t', '6', '-an', '-vf', 'fps=30,format=yuv420p',
            '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', dst)

# Base: video de cada pieza + su audio, con microfundidos para que no haya clics en los cortes
ent = ['-i', FUENTES['M'], '-i', voz, '-i', FUENTES['G'], '-i', gan]
fil, cad, marcas, t = [], '', [], 0.0
for k, (pid, src, a, b, txt) in enumerate(PIEZAS):
    d = b - a
    vi, ai = (0, 1) if src == 'M' else (2, 3)
    fil.append(f'[{vi}:v]trim={a}:{b},setpts=PTS-STARTPTS,fps=30,scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,'
               f'crop=1080:1920,setsar=1,format=yuv420p[v{k}]')
    fil.append(f'[{ai}:a]atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d=0.015,afade=t=out:st={d - 0.03:.3f}:d=0.03[a{k}]')
    cad += f'[v{k}][a{k}]'
    marcas.append({'id': pid, 'fuente': src, 't': round(t, 3), 'd': round(d, 3), 'a': a, 'texto': txt})
    t += d
fil.append(f'{cad}concat=n={len(PIEZAS)}:v=1:a=1[v][a]')
run('ffmpeg', '-v', 'error', '-y', *ent, '-filter_complex', ';'.join(fil), '-map', '[v]', '-map', '[a]',
    '-c:v', 'libx264', '-crf', '15', '-preset', 'slow', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', f'{W}/base.mp4')
json.dump({'total': round(t, 3), 'frames': round(t * 30), 'piezas': marcas}, open('src/funnel-marcas.json', 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)
print(f'Base: {t:.2f} s en {len(PIEZAS)} piezas -> {W}/base.mp4')
