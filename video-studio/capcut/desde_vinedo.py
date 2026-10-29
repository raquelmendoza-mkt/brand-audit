#!/usr/bin/env python3
"""Ejemplo: exporta el reel Casa Comercial El Viñedo (versión Remotion) como proyecto de CapCut.

Uso: python3 capcut/desde_vinedo.py [--semilla <proyecto_vacio.zip>]

Reutiliza las piezas sin silencios (src/vinedo-marcas.json), los subtítulos de src/Vinedo.tsx y la
voz limpia con DeepFilterNet. Cada toma entra como clip COMPLETO recortado (se puede alargar o
acortar en CapCut). Sirve de plantilla para exportar cualquier otro proyecto: arma el plan y llama
a rm_capcut.construir().
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
MED = 'out/capcut/_medios-vinedo'
os.makedirs(MED, exist_ok=True)

marcas = json.load(open('src/vinedo-marcas.json'))
piezas = marcas['piezas']
ORIGEN = {  # toma -> clip original
    'gancho': 'IMG_1842', 'cinta': 'IMG_1842', 'corre': 'IMG_1897', 'cuentame': 'IMG_1848', 'pasa': 'IMG_1900',
    'ubicacion': 'IMG_1854', 'niveles': 'IMG_1861', 'metros': 'IMG_1871', 'marca': 'IMG_1872', 'espacios': 'IMG_1879',
    'cta': 'IMG_1837', 'dron': 'ia_161546', 'ia1': 'ia_155457', 'ia2': 'ia_155256',
}


def at(clave, s):
    ps = [p for p in piezas if p['clave'] == clave]
    for p in ps:
        if s < p['a']:
            return p['t']
        if s <= p['b']:
            return p['t'] + (s - p['a'])
    return ps[-1]['t'] + ps[-1]['b'] - ps[-1]['a']


def medio(clip):
    """Clip 1080x1920 30 fps con la voz limpia (o mudo si es de IA)."""
    out = os.path.join(MED, f'{clip}.mp4')
    if os.path.exists(out):
        return out
    if clip.startswith('ia_'):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'input/vinedo/ia/{clip}.mp4', '-an', '-vf',
                        'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30', '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', out], check=True)
    else:
        src = next(f for f in os.listdir('input/vinedo') if f.startswith(clip + '.'))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'input/vinedo/{src}', '-i', f'{W}/voz/{clip}.wav', '-map', '0:v', '-map', '1:a',
                        '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,format=yuv420p',
                        '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-c:a', 'aac', '-b:a', '192k', '-shortest', out], check=True)
    return out


# --- Pista principal: una entrada por pieza (mismos cortes que el reel)
video = []
for p in piezas:
    c = {'archivo': medio(ORIGEN[p['clave']]), 'desde': p['a'], 'hasta': p['b'], 'en': p['t'], 'fundido_audio': [0.02, 0.03]}
    if p['k'] % 2 == 1:
        c['zoom'] = 1.1  # salto dentro de la misma toma: mini zoom
    if p['clave'] in ('dron', 'ia1', 'ia2'):
        c.update({'entrada': 'zoom', 'volumen': 0})
    video.append(c)

# --- Subtítulos: se leen de src/Vinedo.tsx (CAPTIONS_SRC) y se convierten a SRT
tsx = open('src/Vinedo.tsx', encoding='utf-8').read()
bloque = tsx[tsx.index('CAPTIONS_SRC'): tsx.index('];', tsx.index('CAPTIONS_SRC'))]
caps = re.findall(r"\['(\w+)', ([\d.]+), ([\d.]+), '([^']*)'\]", bloque)


def ts(x):
    ms = int(round(x * 1000))
    return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'


srt = os.path.join(MED, 'subtitulos.srt')
with open(srt, 'w', encoding='utf-8') as f:
    for i, (clave, a, b, txt) in enumerate(caps, 1):
        f.write(f'{i}\n{ts(at(clave, float(a)))} --> {ts(at(clave, float(b)))}\n{txt}\n\n')

# --- Títulos (mismos momentos que el reel; el "detrás de la persona" se hace en CapCut con Recorte)
T = lambda c, s: round(at(c, s), 2)  # noqa: E731
titulos = [
    ('INAUGURACIÓN', T('gancho', 2.12), T('gancho', 3.18), 0.05, 13, 'pop'),
    ('EL VIÑEDO', T('gancho', 3.18), T('gancho', 3.9), 0.05, 15, 'pop'),
    ('TU NEGOCIO', T('gancho', 4.72), T('gancho', 5.66), 0.05, 15, 'pop'),
    ('EL VIÑEDO', T('ubicacion', 8.75), T('ubicacion', 10.4), 0.2, 15, 'zoom'),
    ('2 NIVELES', T('niveles', 5.92), T('niveles', 6.9), 0.62, 15, 'pop'),
    ('450 m²', T('metros', 9.32), T('metros', 11.76), 0.42, 22, 'zoom'),
    ('600 m²', T('metros', 11.76), T('metros', 15.68), 0.5, 22, 'zoom'),
    ('2 NIVELES', T('metros', 15.68), T('metros', 17.4), 0.55, 17, 'pop'),
    ('14 HABITACIONES', T('metros', 17.4), T('metros', 18.58), 0.6, 14, 'pop'),
    ('10 BAÑOS', T('metros', 18.58), T('metros', 20.35), 0.6, 16, 'pop'),
    ('CASA DE MARCAS', T('marca', 3.15), T('marca', 3.92), 0.62, 12, 'pop'),
    ('CLÍNICA · SPA · RESTAURANTES', T('espacios', 7.88), T('espacios', 10.6), 0.65, 9, 'maquina'),
    ('SE ALQUILA POR ESPACIOS', T('espacios', 12.5), T('espacios', 16.37), 0.65, 11, 'subir'),
    ('VIÑEDO', T('cta', 4.0), round(marcas['total'], 2), 0.45, 24, 'zoom'),
]
textos = [{'texto': t, 'en': a, 'hasta': b, 'y': y, 'tam': tam, 'fuente': 'poppins', 'negrita': True,
           'color': '#1C6BEA' if t[0].isdigit() or 'NIVELES' in t or 'ESPACIOS' in t else '#FFFFFF', 'borde': None, 'sombra': True,
           'entrada': ent, 'salida': 'desaparecer', 'pista': 'titulos'} for t, a, b, y, tam, ent in titulos]
textos.append({'texto': 'Comenta "VIÑEDO"', 'en': T('cta', 4.4), 'hasta': round(marcas['total'], 2), 'y': -0.62, 'tam': 9, 'fuente': 'montserrat',
               'color': '#1C6BEA', 'fondo': '#FFFFFF', 'entrada': 'maquina', 'bucle': 'pulso', 'pista': 'cta'})

# --- Audio: música + efectos principales
musica = os.path.join(MED, 'musica-electro.m4a')
if not os.path.exists(musica):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'{W}/musica-electro.wav', '-c:a', 'aac', '-b:a', '256k', musica], check=True)
audio = [{'archivo': musica, 'en': 0, 'desde': 0, 'hasta': round(marcas['total'], 2), 'volumen': 0.22, 'fundido': [0.3, 1.2], 'pista': 'musica'}]
for p in piezas[1:]:
    audio.append({'archivo': 'public/sfx/whoosh-corto.wav', 'en': round(max(0, p['t'] - 0.08), 2), 'volumen': 0.35, 'pista': 'sfx-cortes'})
for t, a, *_ in titulos:
    audio.append({'archivo': 'public/sfx/pop.wav', 'en': a, 'volumen': 0.3, 'pista': 'efectos-titulos'})

plan = {
    'nombre': 'RM - Casa Comercial El Vinedo', 'ancho': 1080, 'alto': 1920, 'fps': 30,
    'video': video, 'textos': textos, 'audio': audio,
    'subtitulos': {'srt': srt, 'fuente': 'montserrat', 'tam': 6.5, 'color': '#FFFFFF', 'y': -0.42, 'borde': '#000000'},
    'efectos': [{'efecto': 'destellos', 'en': T('cinta', 8.12), 'hasta': T('cinta', 9.6)}],
}
# Solape de whooshes: separa los que caen en el mismo instante
vistos = {}
for a in audio:
    k = (a.get('pista'), a['en'])
    if k in vistos:
        a['en'] = round(a['en'] + 0.31, 2)
    vistos[(a.get('pista'), a['en'])] = 1
json.dump(plan, open('out/capcut/plan-vinedo.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
semilla = sys.argv[sys.argv.index('--semilla') + 1] if '--semilla' in sys.argv else None
d, z, datos = rm_capcut.construir(plan, semilla)
print(f'Listo: {z} ({os.path.getsize(z) / 1048576:.1f} MB) · {datos["duration"] / 1e6:.1f} s · {len(datos["tracks"])} pistas')
for a in dict.fromkeys(rm_capcut.avisos):
    print('  Aviso:', a)
