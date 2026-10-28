#!/usr/bin/env python3
"""Descarga la biblioteca de fuentes del editor (Google Fonts, licencia OFL: uso comercial libre).

Uso: python3 -I scripts/fuentes.py            (solo baja las que falten)
     python3 -I scripts/fuentes.py --todas    (vuelve a bajarlas todas)

Guarda el subconjunto "latin" (incluye ñ, tildes, ¿ ¡ y €) en public/fonts/ como
<familia>-<peso>[-italic].woff2 y escribe src/fuentes-lista.json, que src/fonts.ts lee
para registrar cada archivo con loadFont. Para añadir una familia nueva, súmala a FAMILIAS.
"""
import json
import os
import re
import sys
import urllib.request

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'public', 'fonts')
LISTA = os.path.join(ROOT, 'src', 'fuentes-lista.json')
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'

# (nombre en Google Fonts, pesos normales, pesos en cursiva)
FAMILIAS = [
    # Serif de lujo / editorial
    ('Cormorant Garamond', [300, 400, 500, 600, 700], [300, 400, 500]),
    ('Playfair Display', [400, 500, 600, 700, 800, 900], [400, 500, 700]),
    ('Bodoni Moda', [400, 500, 600, 700], [400, 500]),
    ('DM Serif Display', [400], [400]),
    ('Cinzel', [400, 500, 600, 700], []),
    ('Italiana', [400], []),
    # Sans limpias y elegantes
    ('Montserrat', [200, 300, 400, 500, 600, 700, 800, 900], [300, 400]),
    ('Inter', [300, 400, 500, 600, 700, 800, 900], []),
    ('Josefin Sans', [300, 400, 600, 700], []),
    ('Jost', [300, 400, 500, 600], []),
    # Impacto / viral
    ('Bebas Neue', [400], []),
    ('Anton', [400], []),
    ('Archivo Black', [400], []),
    ('Oswald', [400, 500, 600, 700], []),
    ('Space Grotesk', [400, 500, 700], []),
    # Firma / manuscrita (nombres de agentes, toques de lujo)
    ('Great Vibes', [400], []),
    ('Allura', [400], []),
    ('Pinyon Script', [400], []),
]


def slug(name):
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


todas = '--todas' in sys.argv
os.makedirs(OUT, exist_ok=True)
lista = []
for fam, normales, italicas in FAMILIAS:
    ejes = [f'0,{w}' for w in normales] + [f'1,{w}' for w in italicas]
    url = 'https://fonts.googleapis.com/css2?family=' + fam.replace(' ', '+') + ':ital,wght@' + ';'.join(ejes) + '&display=swap'
    css = get(url).decode()
    # Cada bloque viene precedido de un comentario con el subconjunto: nos quedamos con "latin"
    for sub, bloque in re.findall(r'/\* ([a-z-]+) \*/\s*@font-face \{(.*?)\}', css, re.S):
        if sub != 'latin':
            continue
        estilo = re.search(r'font-style: (\w+)', bloque).group(1)
        peso = re.search(r'font-weight: (\d+)', bloque).group(1)
        src = re.search(r'url\((https://[^)]+\.woff2)\)', bloque).group(1)
        nombre = f'{slug(fam)}-{peso}{"-italic" if estilo == "italic" else ""}.woff2'
        destino = os.path.join(OUT, nombre)
        if todas or not os.path.exists(destino):
            with open(destino, 'wb') as f:
                f.write(get(src))
        lista.append({'family': fam, 'weight': peso, 'style': estilo, 'file': f'fonts/{nombre}'})
    print(f'  {fam}: listo')

json.dump(lista, open(LISTA, 'w'), indent=1, ensure_ascii=False)
print(f'{len(lista)} archivos en public/fonts/ · índice en src/fuentes-lista.json')
