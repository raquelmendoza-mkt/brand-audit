#!/usr/bin/env python3
"""Descarga emojis 3D de Microsoft Fluent Emoji (licencia MIT) a public/emoji3d/.

Uso: python3 -I scripts/emojis3d.py            (solo los que falten)
     python3 -I scripts/emojis3d.py "Nombre"   (añade uno más; nombre como en github.com/microsoft/fluentui-emoji/tree/main/assets)

Se ven como los emojis "de lujo" de las marcas (volumen, luz, sombra). En Remotion:
<Emoji3D nombre="casa" /> del kit (src/kit/Iconos.tsx). La lista con su clave en español queda en
src/emoji3d-lista.json.
"""
import json
import os
import sys
import urllib.parse
import urllib.request

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'public', 'emoji3d')
LISTA = os.path.join(ROOT, 'src', 'emoji3d-lista.json')
BASE = 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/'

# clave en español -> nombre del recurso en Fluent Emoji
EMOJIS = {
    # Inmobiliaria
    'casa': 'House', 'casa-jardin': 'House with garden', 'edificio': 'Office building', 'construccion': 'Building construction',
    'llave': 'Key', 'llave-antigua': 'Old key', 'candado': 'Locked', 'puerta': 'Door', 'cama': 'Bed', 'sofa': 'Couch and lamp',
    'banera': 'Bathtub', 'ducha': 'Shower', 'inodoro': 'Toilet', 'espejo': 'Mirror', 'cocina': 'Cooking', 'cafe': 'Hot beverage',
    'carro': 'Automobile', 'ascensor': 'Elevator', 'piscina': 'Person swimming', 'arbol': 'Deciduous tree', 'palmera': 'Palm tree',
    'montana': 'Mountain', 'sol': 'Sun', 'ubicacion': 'Round pushpin', 'mapa': 'World map', 'brujula': 'Compass',
    'cesta': 'Basket', 'caja': 'Package', 'camara-video': 'Video camera', 'camara': 'Camera with flash', 'tv': 'Television',
    'copo-nieve': 'Snowflake', 'aire': 'Wind face',
    # Dinero / negocio
    'dinero': 'Money bag', 'billete': 'Dollar banknote', 'dinero-alas': 'Money with wings', 'grafica': 'Chart increasing',
    'calendario': 'Calendar', 'reloj-arena': 'Hourglass done', 'maletin': 'Briefcase', 'apreton': 'Handshake', 'trofeo': 'Trophy',
    'diamante': 'Gem stone', 'corona': 'Crown', 'cohete': 'Rocket', 'bombillo': 'Light bulb', 'megafono': 'Megaphone',
    'campana': 'Bell', 'regalo': 'Wrapped gift', 'etiqueta': 'Label', 'tarjeta': 'Credit card', 'celular': 'Mobile phone',
    'laptop': 'Laptop', 'chat': 'Speech balloon', 'correo': 'Envelope', 'ojo': 'Eyes', 'lupa': 'Magnifying glass tilted left',
    'diana': 'Bullseye', 'iman': 'Magnet', 'robot': 'Robot', 'cerebro': 'Brain',
    # Reacciones / énfasis
    'chispas': 'Sparkles', 'estrella': 'Glowing star', 'fuego': 'Fire', 'cien': 'Hundred points', 'check': 'Check mark button',
    'equis': 'Cross mark', 'alerta': 'Warning', 'prohibido': 'Prohibited', 'fiesta': 'Party popper', 'corazon': 'Red heart',
    'pulgar': 'Thumbs up', 'aplausos': 'Clapping hands', 'senalar-abajo': 'Backhand index pointing down',
    'senalar-arriba': 'Index pointing up', 'mano-ok': 'Ok hand', 'musculo': 'Flexed biceps', 'rayo': 'High voltage',
    'cara-lentes': 'Smiling face with sunglasses', 'cara-asombro': 'Star-struck', 'cara-sorpresa': 'Face screaming in fear',
    'cara-pensando': 'Thinking face', 'cara-dinero': 'Money-mouth face', 'cara-explota': 'Exploding head',
}


def url_de(nombre):
    carpeta = urllib.parse.quote(nombre)
    archivo = nombre.lower().replace(' ', '_')
    # Los que tienen tono de piel están en Default/3D/<archivo>_3d_default.png
    return [f'{BASE}{carpeta}/3D/{archivo}_3d.png', f'{BASE}{carpeta}/Default/3D/{archivo}_3d_default.png']


if len(sys.argv) > 1:
    EMOJIS[sys.argv[1].lower().replace(' ', '-')] = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
lista = {}
fallos = []
for clave, nombre in EMOJIS.items():
    destino = os.path.join(OUT, f'{clave}.png')
    if not os.path.exists(destino):
        for u in url_de(nombre):
            try:
                with urllib.request.urlopen(u, timeout=60) as r:
                    data = r.read()
                open(destino, 'wb').write(data)
                break
            except Exception:
                continue
    if os.path.exists(destino):
        lista[clave] = f'emoji3d/{clave}.png'
    else:
        fallos.append(f'{clave} ({nombre})')
json.dump(lista, open(LISTA, 'w'), indent=1, ensure_ascii=False)
print(f'{len(lista)} emojis 3D en public/emoji3d/')
if fallos:
    print('No encontrados:', ', '.join(fallos))
