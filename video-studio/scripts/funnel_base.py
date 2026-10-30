#!/usr/bin/env python3
"""Base del reel TOFU · MOFU · BOFU (input/funnel/IMG_3921.MOV, 2 min -> ~39 s).

Uso: python3 scripts/funnel_base.py

Elige las frases del guión (tiempos de faster-whisper, ver IMG_3921.MOV.trans.json), deja la
mejor toma de las repetidas al final, limpia la voz con DeepFilterNet, inserta los 3 ganchos de
referencia (IMG_3927-29, con su audio), la escena extra de BOFU (IMG_3937) y escribe:
  public/work/funnel/base.mp4      video 1080x1920 30 fps con la voz limpia, ya cortado
  public/work/funnel/gancho-*.mp4  los 3 ganchos de referencia para los celulares (+ .jpg fijo)
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

# (id, fuente, desde, hasta, texto). Piezas seguidas de la misma frase se leen como una sola toma
PIEZAS = [
    ('hook', 'M', 0.22, 3.34, 'TOFU, MOFU y BOFU para asesores inmobiliarios.'),
    ('tofu', 'M', 3.40, 7.62, 'TOFU, que es el top of the funnel, aquí es donde tú vas a hacer el ángulo de atracción,'),
    ('ejemplo', 'M', 10.66, 13.84, 'como por ejemplo, ¿qué es mejor, comprar o alquilar?'),
    ('g28', 'G28', 0.0, 1.76, '(gancho: ¿Qué conviene más, comprar o rentar?)'),
    ('g27', 'G27', 0.36, 2.40, '(gancho: ¿Qué es mejor? ¿Comprar una casa o alquilarla?)'),
    ('g29', 'G29', 0.0, 3.05, '(gancho: Christian Villar, con estadísticas)'),
    ('tendencias', 'M', 15.82, 19.06, 'Te puedes unir a tendencias también para llegar a muchas más personas.'),
    ('mofu', 'M', 22.87, 23.64, 'Middle of the funnel:'),
    ('confianza', 'M', 26.79, 28.86, 'tú estás educando, estás emitiendo confianza.'),
    ('zonas', 'M', 32.03, 33.27, 'Aquí tú puedes hablar sobre'),
    ('zonas2', 'M', 33.71, 34.72, 'zonas para comprar,'),  # quita la pausa de "sobre… zonas"
    ('documentos', 'M', 34.98, 37.12, 'documentos que necesitas para comprar o para vender.'),
    ('bofu', 'M', 39.64, 41.32, 'Y al final, que es el BOFU,'),
    ('conversion', 'M', 43.70, 45.64, 'aquí lo que vas a hacer es conversión.'),
    ('casos', 'M', 68.30, 69.64, 'Vas a subir casos de éxito,'),
    ('dias', 'M', 69.88, 72.00, 'número de días en los que cerraste una vivienda,'),
    ('testimonios', 'M', 72.40, 74.26, 'vas a subir testimonios de tus clientes.'),
    ('roomtour', 'N', 0.0, 6.96, 'Y en el BOFU también es importante que puedas incluir room tours inmobiliarios, las captaciones que tienes actualmente, pero siempre saliendo detrás de cámara.'),
    ('catalogo', 'N', 7.02, 8.36, 'No hagas un perfil catálogo.'),
    ('resultados', 'M', 85.30, 87.44, 'Cuando muestras resultados reales, esas personas'),
    ('clientes', 'M', 89.62, 91.06, 'terminan siendo clientes.'),
    ('importante', 'M', 112.93, 115.58, 'Es muy importante siempre utilizar TOFU, MOFU y BOFU'),
    ('vender', 'M', 116.45, 118.75, 'para vender y captar más.'),
]
FUENTES = {'M': f'{IN}/IMG_3921.MOV', 'N': f'{IN}/IMG_3937.MOV', 'G27': f'{IN}/complemento/IMG_3927.MP4',
           'G28': f'{IN}/complemento/IMG_3928.MP4', 'G29': f'{IN}/complemento/IMG_3929.MP4'}


def run(*a):
    subprocess.run(a, check=True)


def lufs(f):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', f, '-af', 'loudnorm=I=-16:TP=-1.5:print_format=json', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
    return float(json.loads(r[r.rindex('{'):])['input_i'])


def voz_limpia(src, dst):
    """DeepFilterNet + EQ de voz + compresión suave, a -16 LUFS."""
    if os.path.exists(dst):
        return
    base = os.path.splitext(os.path.basename(dst))[0]
    run('ffmpeg', '-v', 'error', '-y', '-i', src, '-map', '0:a:0', '-ac', '1', '-ar', '48000', '-af', 'highpass=f=90', f'{W}/{base}-raw.wav')
    os.makedirs(f'{W}/df', exist_ok=True)
    run(DF, '-D', '-a', '40', '-o', f'{W}/df', f'{W}/{base}-raw.wav')
    run('ffmpeg', '-v', 'error', '-y', '-i', f'{W}/df/{base}-raw.wav', '-af',
        'highpass=f=100,equalizer=f=300:t=q:w=1.2:g=-2,equalizer=f=4000:t=q:w=1.0:g=2,'
        'acompressor=threshold=-24dB:ratio=3:attack=8:release=120:makeup=2', f'{W}/{base}-eq.wav')
    g = -16 - lufs(f'{W}/{base}-eq.wav')
    run('ffmpeg', '-v', 'error', '-y', '-i', f'{W}/{base}-eq.wav', '-af', f'volume={g:.2f}dB,alimiter=limit=0.89', dst)


AUDIO = {'M': f'{W}/voz.wav', 'N': f'{W}/voz-bofu.wav'}
voz_limpia(FUENTES['M'], AUDIO['M'])
voz_limpia(FUENTES['N'], AUDIO['N'])

# Ganchos de referencia: su audio original a -16 LUFS (solo el tramo usado, para medir bien) y
# el clip mudo a 30 fps + un fotograma fijo para los celulares de los lados
for k in ('G27', 'G28', 'G29'):
    n = '39' + k[1:]
    a, b = next((p[2], p[3]) for p in PIEZAS if p[1] == k)
    AUDIO[k] = f'{W}/gancho-{n}.wav'
    if not os.path.exists(AUDIO[k]):
        run('ffmpeg', '-v', 'error', '-y', '-i', FUENTES[k], '-vn', '-ac', '1', '-ar', '48000', f'{W}/gancho-{n}-raw.wav')
        run('ffmpeg', '-v', 'error', '-y', '-ss', str(a), '-to', str(b), '-i', f'{W}/gancho-{n}-raw.wav', f'{W}/gancho-{n}-tramo.wav')
        g = -16 - lufs(f'{W}/gancho-{n}-tramo.wav')
        run('ffmpeg', '-v', 'error', '-y', '-i', f'{W}/gancho-{n}-raw.wav', '-af', f'volume={g:.2f}dB,alimiter=limit=0.89', AUDIO[k])
    if not os.path.exists(f'{W}/gancho-{n}.mp4'):
        run('ffmpeg', '-v', 'error', '-y', '-i', FUENTES[k], '-t', '6', '-an', '-vf', 'fps=30,format=yuv420p',
            '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', f'{W}/gancho-{n}.mp4')
    run('ffmpeg', '-v', 'error', '-y', '-ss', str(a + 0.3), '-i', FUENTES[k], '-frames:v', '1', '-q:v', '2', '-update', '1', f'{W}/gancho-{n}.jpg')

# Base: video de cada pieza + su audio, con microfundidos para que no haya clics en los cortes
orden = list(FUENTES)
ent = []
for k in orden:
    ent += ['-i', FUENTES[k], '-i', AUDIO[k]]
fil, cad, marcas, t = [], '', [], 0.0
for k, (pid, src, a, b, txt) in enumerate(PIEZAS):
    d = b - a
    vi = orden.index(src) * 2
    ai = vi + 1
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
