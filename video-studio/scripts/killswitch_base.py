#!/usr/bin/env python3
"""Base del reel "¿Cómo prevenir que te bloqueen Claude en Venezuela?" (input/killswitch/original.mov).

Uso: python3 scripts/killswitch_base.py

Guión recortado al máximo (tiempos de faster-whisper): gancho 1 (cámara 0.5), la mejor toma de
"Muchos usuarios..." (había dos), sin frases repetidas, el respaldo antes del CTA y sin "sígueme".
Dentro de cada pieza se quitan además las pausas >= 0.25 s (los silencios de las oclusivas como
"Kill Switch" o "Tokio" son más cortos y no se tocan). Voz "natural" (DeepFilterNet -a 18 + EQ).
Cada pieza lleva su encuadre: 1.0x o 1.15x hecho en FFmpeg (HD), alternando para cambiar de
ángulo; el gancho queda abierto (es la toma 0.5).
Escribe public/work/killswitch/base.mp4 y src/killswitch-marcas.json.
"""
import json
import os
import subprocess

import numpy as np

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
os.chdir(ROOT)
SRC = 'input/killswitch/original.mov'
W = 'public/work/killswitch'
DF = '.models/bin/deep-filter'
os.makedirs(f'{W}/df18', exist_ok=True)
CARA = (580, 790)  # cara en las tomas a cámara (fuera del gancho)
# Recortes a medida (ancho, alto, x, y): de 53 a 69 s del original hay sillas apiladas en el borde
# derecho; se recorta a 964 px de ancho pegado a la izquierda y abajo (se ve más el pecho)
RECORTE = {pid: (964, 1714, 0, 206) for pid in ('proxy', 'extension', 'mascara1', 'mascara2')}

# (id, desde, hasta, zoom, texto)
PIEZAS = [
    ('gancho', 0.00, 3.54, 1.0, '¿Cómo prevenir que te bloqueen tu cuenta de Claude si te encuentras en Venezuela?'),
    ('usuarios', 8.08, 10.84, 1.0, 'Muchos usuarios ya han manifestado que le han bloqueado su cuenta de Claude.'),
    ('prevenir', 10.94, 12.70, 1.08, '¿Cómo podemos prevenir esto? Te muestro.'),
    ('cookies', 19.78, 24.28, 1.0, 'La primera opción es que puedas borrar todas las cookies de tu navegador que normalmente frecuentas Claude'),
    ('unvpn', 24.26, 27.52, 1.0, 'y además utilices un solo VPN con una sola dirección IP.'),
    ('tokio', 28.40, 31.46, 1.0, 'no puedes utilizar uno ayer que sale que estás en Tokio,'),
    ('eeuu', 31.76, 34.24, 1.0, 'hoy que sales que estás en Estados Unidos y mañana en Singapur,'),
    ('baneo', 34.30, 38.50, 1.08, 'porque esto hace de que Anthropic te detecte con una actividad inusual y te baneen.'),
    ('proton', 43.68, 45.74, 1.0, 'Esto puedes hacerlo a través de ProtonVPN,'),
    ('kill', 48.42, 53.30, 1.0, 'Y si no, puedes utilizar Kill Switch, el cual protege la misma dirección IP cada vez que utilices VPN.'),
    ('proxy', 53.58, 56.66, 1.0, 'Otra recomendación es que en vez de utilizar VPNs, utilices Proxys.'),
    ('extension', 56.64, 59.68, 1.0, 'Los Proxys los puedes realizar como una extensión de tu navegador web.'),
    ('mascara1', 65.68, 66.28, 1.0, 'Es como que,'),
    ('mascara2', 66.52, 69.54, 1.0, 'se coloca una máscara y siempre vas a aparecer en el mismo sitio.'),
    ('bloquearon', 70.72, 73.42, 1.0, 'Supongamos que tú me dices, mira Raquel, ya me bloquearon, ¿qué hago?'),
    ('familiar', 74.84, 79.48, 1.0, 'la otra alternativa que tienes es si posees un familiar que tenga una documentación del extranjero,'),
    ('cuenta', 79.92, 83.60, 1.0, 'pueda él registrarse, abrir una nueva cuenta y te dé el acceso para que tú lo uses.'),
    ('sinfamiliar1', 83.56, 84.64, 1.0, 'Pero si me dices,'),
    ('sinfamiliar2', 86.10, 87.26, 1.0, 'no cuento con otro familiar,'),
    ('solucion', 88.96, 90.68, 1.0, 'tranquilo que para todo hay solución.'),
    ('herramientas', 90.72, 94.78, 1.08, 'Porque hay varias herramientas de inteligencia artificial que hacen el trabajo similar a Claude.'),
    ('flujos', 95.04, 99.40, 1.0, 'De hecho, te pueden crear flujos automatizados con IA, páginas web, desarrollos y más.'),
    ('respaldo', 106.44, 110.38, 1.0, 'Sin embargo, recuerda siempre realizar el respaldo de tu cuenta actual de Claude.'),
    ('pierdas', 110.36, 113.50, 1.0, 'No vaya a ser de que pasen unas circunstancias y pierdas todo.'),
    ('cta', 99.60, 106.12, 1.0, 'Así que comenta aquí la palabra IA y yo te voy a compartir estas herramientas al privado para que puedas emplearlas y tengas esta opción.'),
]
MIN_PAUSA, AIRE, UMBRAL = 0.25, 0.06, -36
# Frases dichas muy suave ("Kill Switch" ronda -37 dB): sin cortes internos o se come sílabas
SIN_CORTES = {'kill', 'herramientas'}


def run(*a):
    subprocess.run(a, check=True)


voz = f'{W}/voz.wav'
if not os.path.exists(f'{W}/df18/voz-raw.wav'):
    run('ffmpeg', '-v', 'error', '-y', '-i', SRC, '-map', '0:a:0', '-ac', '1', '-ar', '48000', '-af', 'highpass=f=80', f'{W}/voz-raw.wav')
    run(DF, '-D', '-a', '18', '-o', f'{W}/df18', f'{W}/voz-raw.wav')
run('ffmpeg', '-v', 'error', '-y', '-i', f'{W}/df18/voz-raw.wav', '-af',
    'highpass=f=90,equalizer=f=300:t=q:w=1.2:g=-2.5,equalizer=f=3800:t=q:w=1.0:g=1.5,'
    'acompressor=threshold=-22dB:ratio=2:attack=10:release=150:makeup=1.5', voz)

x = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', SRC, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True, check=True).stdout, np.int16).astype(float)
n = 320
db = np.array([20 * np.log10(np.sqrt(np.mean(x[i * n:(i + 1) * n] ** 2)) + 1e-9) - 90 for i in range(len(x) // n)])


def sin_pausas(a, b):
    """Parte [a, b] quitando silencios internos >= MIN_PAUSA."""
    tr, t0, i = [], a, int(a / 0.02)
    while i < int(b / 0.02):
        if db[i] < UMBRAL:
            j = i
            while j < int(b / 0.02) and db[j] < UMBRAL:
                j += 1
            s0, s1 = i * 0.02, j * 0.02
            if s1 - s0 >= MIN_PAUSA and s0 > a + 0.1 and s1 < b - 0.1:
                tr.append([t0, s0 + AIRE])
                t0 = s1 - AIRE
            i = j
        else:
            i += 1
    tr.append([t0, b])
    return [t for t in tr if t[1] - t[0] > 0.05]


def lufs_tramo(a, b):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-ss', str(a), '-to', str(b), '-i', voz, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    import re
    v = re.findall(r'I:\s+(-?[\d.]+) LUFS', r)
    return float(v[-1]) if v else -20.0


# Nivel parejo entre frases: cada pieza se lleva al nivel medio (la de "Kill Switch" se dijo
# más suave y se notaba el salto). Ganancia limitada a ±6 dB.
NIVELES = {pid: lufs_tramo(a, b) for pid, a, b, _, _ in PIEZAS}
OBJ = float(np.median(list(NIVELES.values())))
GANANCIA = {pid: max(-6.0, min(6.0, OBJ - v)) for pid, v in NIVELES.items()}
COLA = 0.4  # respiro final (la frase ya termina completa: "...y tengas esta opción")

fil, cad, marcas, t, k = [], '', [], 0.0, 0
for pid, a, b, z, txt in PIEZAS:
    t_ini = t
    for ta, tb in ([[a, b]] if pid in SIN_CORTES else sin_pausas(a, b)):
        d = tb - ta
        if pid in RECORTE:
            cw, ch, cx, cy = RECORTE[pid]
            enc = f'crop={cw}:{ch}:{cx}:{cy},scale=1080:1920:flags=lanczos+accurate_rnd+full_chroma_int,cas=0.45'
        elif z == 1.0:
            enc = 'scale=1080:1920'
        else:
            cw, ch = round(1080 / z / 2) * 2, round(1920 / z / 2) * 2
            cx, cy = round(CARA[0] - CARA[0] / z), round(CARA[1] - CARA[1] / z)
            enc = f'crop={cw}:{ch}:{cx}:{cy},scale=1080:1920:flags=lanczos+accurate_rnd+full_chroma_int,cas=0.45'
        fil.append(f'[0:v]trim={ta:.3f}:{tb:.3f},setpts=PTS-STARTPTS,fps=30,{enc},setsar=1,format=yuv420p[v{k}]')
        fil.append(f'[1:a]atrim={ta:.3f}:{tb:.3f},asetpts=PTS-STARTPTS,volume={GANANCIA[pid]:.2f}dB,afade=t=in:d=0.012,afade=t=out:st={max(0, d - 0.02):.3f}:d=0.02[a{k}]')
        cad += f'[v{k}][a{k}]'
        marcas.append({'id': pid, 'a': round(ta, 3), 't': round(t, 3), 'd': round(d, 3), 'zoom': z})
        t += d
        k += 1
fil.append(f'{cad}concat=n={k}:v=1:a=1[vc][ac]')
fil.append(f'[vc]tpad=stop_mode=clone:stop_duration={COLA}[v];[ac]apad=pad_dur={COLA}[a]')
run('ffmpeg', '-v', 'error', '-y', '-i', SRC, '-i', voz, '-filter_complex', ';'.join(fil), '-map', '[v]', '-map', '[a]',
    '-c:v', 'libx264', '-crf', '11', '-preset', 'slow', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', f'{W}/base.mp4')
json.dump({'total': round(t + COLA, 3), 'voz': round(t, 3), 'frames': round((t + COLA) * 30), 'tramos': marcas}, open('src/killswitch-marcas.json', 'w'), indent=1)
print(f'{t + COLA:.2f} s en {len(PIEZAS)} piezas ({k} tramos); ganancias: ' + ', '.join(f'{p} {g:+.1f}' for p, g in GANANCIA.items() if abs(g) > 1.5))
