#!/usr/bin/env python3
"""Conector RM -> CapCut: convierte un plan de edición en un PROYECTO DE CAPCUT editable.

Uso:
  python3 capcut/rm_capcut.py construir <plan.json> [--semilla <carpeta_o_zip_de_proyecto_vacio>] [--salida out/capcut]
  python3 capcut/rm_capcut.py catalogo            (lista los nombres en español disponibles)

Genera <salida>/<nombre>/ (carpeta del proyecto, con los medios en materiales/) y <salida>/<nombre>.zip.
Raquel descomprime el ZIP dentro de su carpeta de proyectos de CapCut:
  Mac:     ~/Movies/CapCut/User Data/Projects/com.lveditor.draft/
  Windows: C:\\Users\\<usuario>\\AppData\\Local\\CapCut\\User Data\\Projects\\com.lveditor.draft\\
y abre CapCut: el proyecto aparece con cortes, textos, subtítulos, música, efectos y transiciones,
todo editable en sus pistas. Exporta ella con el botón Exportar.

Sobre la semilla (recomendado en Mac / CapCut 9+): un proyecto VACÍO creado en su CapCut y cerrado.
De él se toman la estructura exacta de su versión (Timelines/, metadatos) y la ruta real de su
carpeta de proyectos, para que los medios queden enlazados sin "medios no encontrados".
Sin semilla se usa la plantilla de pyCapCut y la ruta de "ruta_proyectos" del plan.

Formato del plan (tiempos en segundos; textos y nombres de efectos en español, ver `catalogo`):
{
  "nombre": "Vinedo RM", "ancho": 1080, "alto": 1920, "fps": 30,
  "ruta_proyectos": "/Users/raquel/Movies/CapCut/User Data/Projects/com.lveditor.draft",
  "video": [   # pista principal, uno tras otro (o con "en" para fijar el inicio)
    {"archivo": "input/x.MOV", "desde": 1.0, "hasta": 5.6, "volumen": 1.0, "velocidad": 1.0,
     "zoom": 1.1, "x": 0, "y": 0, "entrada": "zoom", "salida": null, "transicion": "fundido",
     "filtro": "limpio", "intensidad_filtro": 60, "fundido_audio": [0.03, 0.04]}
  ],
  "superpuestos": [ {"archivo": "...", "en": 12.0, "desde": 0, "hasta": 2, "zoom": 1.0} ],  # B-roll encima
  "textos": [
    {"texto": "INAUGURACIÓN", "en": 1.1, "hasta": 3.2, "fuente": "poppins", "tam": 14, "color": "#FFFFFF",
     "negrita": true, "x": 0, "y": 0.35, "entrada": "pop", "salida": "desaparecer", "bucle": null,
     "borde": "#000000", "sombra": true, "fondo": null, "pista": "titulos"}
  ],
  "subtitulos": {"srt": "x.srt", "fuente": "montserrat", "tam": 7, "color": "#FFFFFF", "y": -0.45, "borde": "#000000"},
  "audio": [ {"archivo": "musica.wav", "en": 0, "desde": 0, "hasta": 30, "volumen": 0.3, "fundido": [0.5, 1.0], "pista": "musica"} ],
  "efectos": [ {"efecto": "destellos", "en": 6.8, "hasta": 8.0} ]
}
"""
import copy
import glob
import json
import os
import shutil
import sys
import time
import uuid
import zipfile

import pycapcut as cc
from pycapcut import trange as _trange  # noqa: F401  (disponible para usos avanzados)

SEC = 1_000_000

# ---------------------------------------------------------------------------
# Diccionario en español -> recursos nativos de CapCut (se toma el primero que exista y sea gratis)
# ---------------------------------------------------------------------------
TRANSICIONES = {
    'fundido': ['叠化'], 'fundido-luz': ['眩光叠化'], 'destello': ['闪白', 'White_Flash'], 'acercar': ['推近'],
    'alejar': ['拉远'], 'barrido-izquierda': ['向左擦除'], 'barrido-derecha': ['向右擦除'], 'barrido-arriba': ['向上擦除'],
    'deslizar-izquierda': ['左移'], 'deslizar-derecha': ['右移'], 'subir': ['上移'], 'desenfoque': ['横向模糊', '亮点模糊'],
    'glitch': ['故障', '彩色故障', '色差故障'], 'girar': ['顺时针旋转', '中轴旋转'], 'sacudida': ['震动', '抖动'],
    'luz': ['炫光', '泛光', '光束'], 'zoom': ['推近', 'Zoom_Transition'],
}
ENTRADAS_VIDEO = {
    'aparecer': ['渐显'], 'zoom': ['动感放大', '放大'], 'reducir': ['动感缩小', '缩小'], 'desenfoque': ['模糊渐显'],
    'subir': ['向上滑动'], 'izquierda': ['向左滑动'], 'derecha': ['向右滑动'], 'sacudida': ['轻微抖动', '左右抖动'],
    'rotar': ['旋转'],
}
SALIDAS_VIDEO = {'desaparecer': ['渐隐'], 'zoom': ['放大'], 'reducir': ['缩小'], 'desenfoque': ['模糊渐隐'], 'subir': ['向上滑动']}
ENTRADAS_TEXTO = {
    'aparecer': ['渐显'], 'pop': ['弹出'], 'maquina': ['打字机'], 'zoom': ['放大'], 'subir': ['向上滑动', '向上弹入'],
    'rebote': ['向上弹入'], 'desenfoque': ['模糊'], 'glitch': ['故障'], 'karaoke': ['卡拉OK'], 'brillo': ['扫光入场'],
    'onda': ['波浪弹入'],
}
SALIDAS_TEXTO = {'desaparecer': ['渐隐'], 'desenfoque': ['模糊'], 'maquina': ['打字机'], 'glitch': ['故障'], 'bajar': ['向下滑动'], 'reducir': ['缩小']}
BUCLES_TEXTO = {'flotar': ['漂浮'], 'brillo': ['漂浮发光'], 'onda': ['波浪'], 'temblor': ['晃动'], 'latido': ['心跳频闪'], 'pulso': ['闪动脉冲']}
FILTROS = {'limpio': ['净透'], 'natural': ['自然'], 'calido': ['暖黄'], 'frio': ['冷调', '冷蓝'], 'vivo': ['鲜艳_I', '鲜艳_II']}
EFECTOS = {
    'destellos': ['细闪', '仙尘闪闪'], 'flash': ['泛光爆闪', '变色闪光'], 'brillo': ['光晕', '光晕_II'], 'vineta': ['暗角'],
    'pelicula': ['胶片', '胶片漏光'], 'luz-pelicula': ['胶片漏光', '胶片漏光_II'], 'desenfoque': ['模糊', '动感模糊'],
    'sacudida': ['抖动', '抖动运镜'], 'enfoque': ['变清晰'], 'congelar': ['定格闪烁'],
}
FUENTES = {
    'poppins': 'Poppins_Bold', 'montserrat': 'Montserrat', 'playfair': 'PlayfairDisplay_Italic', 'cinzel': 'CINZEL',
    'anton': 'Anton', 'bebas': 'BebasNeue', 'oswald': 'Oswald_ExtraLight', 'didot': 'Didot_Medium', 'futura': 'Futura_LT_Pro',
    'dmsans': 'DMSans_BoldItalic', 'publicsans': 'PublicSans',
}

avisos = []


def _elegir(enum, mapa, nombre, tipo):
    """Busca el recurso nativo para un nombre en español (o el nombre nativo directo)."""
    if nombre is None:
        return None
    candidatos = mapa.get(nombre, [nombre])
    for c in candidatos:
        if c in enum.__members__:
            m = enum[c]
            if getattr(m.value, 'is_vip', False):
                avisos.append(f'{tipo} "{nombre}" ({c}) es de CapCut Pro')
            return m
    avisos.append(f'{tipo} "{nombre}" no existe en el catálogo: se omitió')
    return None


def _color(h, default=(1.0, 1.0, 1.0)):
    if not h:
        return default
    h = h.lstrip('#')
    return tuple(int(h[i: i + 2], 16) / 255 for i in (0, 2, 4))


def _tr(ini, dur):
    return cc.Timerange(int(round(ini * SEC)), int(round(dur * SEC)))


_fin_pista = {}


def _hueco(pista, ini, dur):
    """Timerange sin solaparse con lo anterior de la misma pista (absorbe redondeos de microsegundos)."""
    a = max(int(round(ini * SEC)), _fin_pista.get(pista, 0))
    b = int(round((ini + dur) * SEC))
    if b - a < SEC // 30:  # menos de un fotograma: se descarta el solape cediendo el inicio
        b = a + max(int(round(dur * SEC)) - (a - int(round(ini * SEC))), SEC // 30)
    _fin_pista[pista] = b
    return cc.Timerange(a, b - a)


def construir(plan, semilla=None, salida='out/capcut'):
    nombre = plan['nombre']
    W, H, FPS = plan.get('ancho', 1080), plan.get('alto', 1920), plan.get('fps', 30)
    destino = os.path.join(salida, nombre)
    if os.path.exists(destino):
        shutil.rmtree(destino)
    os.makedirs(os.path.join(destino, 'materiales'))

    # --- Semilla: estructura y ruta reales de la versión de CapCut de Raquel
    sem_dir = None
    if semilla:
        if semilla.endswith('.zip'):
            sem_dir = os.path.join(salida, '_semilla')
            shutil.rmtree(sem_dir, ignore_errors=True)
            with zipfile.ZipFile(semilla) as z:
                z.extractall(sem_dir)
            # el zip puede traer la carpeta del proyecto dentro
            hijos = [d for d in glob.glob(os.path.join(sem_dir, '*')) if os.path.isdir(d)]
            if not os.path.exists(os.path.join(sem_dir, 'draft_meta_info.json')) and len(hijos) == 1:
                sem_dir = hijos[0]
        else:
            sem_dir = semilla
        for item in os.listdir(sem_dir):
            src = os.path.join(sem_dir, item)
            if item in ('materiales',) or item.endswith('.bak'):
                continue
            (shutil.copytree if os.path.isdir(src) else shutil.copy2)(src, os.path.join(destino, item))
    meta_path = os.path.join(destino, 'draft_meta_info.json')
    if not os.path.exists(meta_path):
        shutil.copy(cc.assets.get_asset_path('DRAFT_META_TEMPLATE'), meta_path)
    meta = json.load(open(meta_path, encoding='utf-8'))

    # Carpeta de proyectos en la computadora de Raquel (para enlazar los medios)
    raiz = plan.get('ruta_proyectos')
    if not raiz and meta.get('draft_root_path'):
        raiz = meta['draft_root_path']
    if not raiz and meta.get('draft_fold_path'):
        raiz = os.path.dirname(meta['draft_fold_path'].rstrip('/\\'))
    if not raiz:
        raiz = '/Users/USUARIO/Movies/CapCut/User Data/Projects/com.lveditor.draft'
        avisos.append('Sin semilla ni "ruta_proyectos": los medios quedan con ruta genérica y CapCut pedirá volver a enlazarlos')
    sep = '\\' if (':' in raiz[:3] or '\\' in raiz) else '/'
    carpeta_final = raiz.rstrip('/\\') + sep + nombre

    # --- Copia de medios dentro del proyecto
    copiados = {}

    def medio(ruta):
        ruta = os.path.abspath(ruta)
        if ruta not in copiados:
            base = os.path.basename(ruta)
            n = base
            k = 1
            while n in copiados.values():
                n = f'{os.path.splitext(base)[0]}-{k}{os.path.splitext(base)[1]}'
                k += 1
            shutil.copy2(ruta, os.path.join(destino, 'materiales', n))
            copiados[ruta] = n
        return os.path.join(destino, 'materiales', copiados[ruta])

    _fin_pista.clear()
    script = cc.ScriptFile(W, H, FPS)
    script.add_track(cc.TrackType.video, 'principal')

    # --- Pista principal
    t = 0.0
    for c in plan.get('video', []):
        mat = cc.VideoMaterial(medio(c['archivo']))
        desde = c.get('desde', 0.0)
        hasta = min(c.get('hasta', mat.duration / SEC), mat.duration / SEC)
        vel = c.get('velocidad', 1.0)
        dur = (hasta - desde) / vel
        ini = c.get('en', t)
        rango = _hueco('principal', ini, dur)
        seg = cc.VideoSegment(mat, rango, source_timerange=cc.Timerange(int(round(desde * SEC)), int(round(rango.duration * vel))), speed=vel, volume=c.get('volumen', 1.0),
                              clip_settings=cc.ClipSettings(scale_x=c.get('zoom', 1.0), scale_y=c.get('zoom', 1.0), transform_x=c.get('x', 0.0), transform_y=c.get('y', 0.0)))
        if (e := _elegir(cc.IntroType, ENTRADAS_VIDEO, c.get('entrada'), 'Entrada')):
            seg.add_animation(e)
        if (s := _elegir(cc.OutroType, SALIDAS_VIDEO, c.get('salida'), 'Salida')):
            seg.add_animation(s)
        if (f := _elegir(cc.FilterType, FILTROS, c.get('filtro'), 'Filtro')):
            seg.add_filter(f, c.get('intensidad_filtro', 60))
        if c.get('fundido_audio'):
            fi, fo = c['fundido_audio']
            seg.add_fade(f'{fi}s', f'{fo}s')
        if (tr := _elegir(cc.TransitionType, TRANSICIONES, c.get('transicion'), 'Transición')):
            seg.add_transition(tr)
        script.add_segment(seg, 'principal')
        t = (rango.start + rango.duration) / SEC

    # --- Tomas encima (B-roll)
    if plan.get('superpuestos'):
        script.add_track(cc.TrackType.video, 'encima', relative_index=1)
        for c in plan['superpuestos']:
            mat = cc.VideoMaterial(medio(c['archivo']))
            desde = c.get('desde', 0.0)
            hasta = min(c.get('hasta', mat.duration / SEC), mat.duration / SEC)
            rango = _hueco('encima', c['en'], hasta - desde)
            seg = cc.VideoSegment(mat, rango, source_timerange=cc.Timerange(int(round(desde * SEC)), rango.duration), volume=c.get('volumen', 0.0),
                                  clip_settings=cc.ClipSettings(scale_x=c.get('zoom', 1.0), scale_y=c.get('zoom', 1.0)))
            if (e := _elegir(cc.IntroType, ENTRADAS_VIDEO, c.get('entrada'), 'Entrada')):
                seg.add_animation(e)
            script.add_segment(seg, 'encima')

    # --- Textos (cada uno en su pista para poder superponerlos)
    pistas_creadas = set()

    def pista_de(tipo, nombre):
        if nombre not in pistas_creadas:
            script.add_track(tipo, nombre)
            pistas_creadas.add(nombre)
        return nombre

    for i, x in enumerate(plan.get('textos', [])):
        # "pista" agrupa textos que no se pisan (p. ej. todos los títulos); si no, uno por pista
        pista = pista_de(cc.TrackType.text, x.get('pista', f'texto{i + 1}'))
        estilo = cc.TextStyle(size=x.get('tam', 10), bold=x.get('negrita', True), italic=x.get('cursiva', False), color=_color(x.get('color')),
                              align=1, auto_wrapping=True, max_line_width=x.get('ancho_max', 0.82), letter_spacing=x.get('espaciado', 0))
        fuente = x.get('fuente')
        ft = cc.FontType[FUENTES.get(fuente, fuente)] if fuente and FUENTES.get(fuente, fuente) in cc.FontType.__members__ else None
        if fuente and ft is None:
            avisos.append(f'Fuente "{fuente}" no está en CapCut: se usa la predeterminada')
        seg = cc.TextSegment(x['texto'], _hueco(pista, x['en'], x['hasta'] - x['en']), font=ft, style=estilo,
                             clip_settings=cc.ClipSettings(transform_x=x.get('x', 0.0), transform_y=x.get('y', 0.0)),
                             border=cc.TextBorder(color=_color(x['borde']), width=x.get('grosor_borde', 30)) if x.get('borde') else None,
                             shadow=cc.TextShadow(alpha=0.6) if x.get('sombra') else None,
                             background=cc.TextBackground(color=x['fondo'], alpha=x.get('opacidad_fondo', 1.0), round_radius=0.4) if x.get('fondo') else None)
        if (e := _elegir(cc.TextIntro, ENTRADAS_TEXTO, x.get('entrada'), 'Entrada de texto')):
            seg.add_animation(e, duration=f'{x.get("dur_entrada", 0.4)}s')
        if (s := _elegir(cc.TextOutro, SALIDAS_TEXTO, x.get('salida'), 'Salida de texto')):
            seg.add_animation(s, duration=f'{x.get("dur_salida", 0.3)}s')
        if (b := _elegir(cc.TextLoopAnim, BUCLES_TEXTO, x.get('bucle'), 'Bucle de texto')):
            seg.add_animation(b)
        script.add_segment(seg, pista)

    # --- Subtítulos desde SRT
    sub = plan.get('subtitulos')
    if sub:
        fuente = sub.get('fuente', 'montserrat')
        ref = cc.TextSegment('x', _tr(0, 1), font=cc.FontType[FUENTES.get(fuente, fuente)] if FUENTES.get(fuente, fuente) in cc.FontType.__members__ else None,
                             style=cc.TextStyle(size=sub.get('tam', 7), bold=True, color=_color(sub.get('color')), align=1, auto_wrapping=True),
                             clip_settings=cc.ClipSettings(transform_y=sub.get('y', -0.45)),
                             border=cc.TextBorder(color=_color(sub.get('borde', '#000000')), width=sub.get('grosor_borde', 40)) if sub.get('borde', '#000000') else None)
        script.import_srt(sub['srt'], 'subtitulos', style_reference=ref, clip_settings=None)

    # --- Audio (música, voz aparte, efectos)
    for i, a in enumerate(plan.get('audio', [])):
        pista = pista_de(cc.TrackType.audio, a.get('pista', f'audio{i + 1}'))
        mat = cc.AudioMaterial(medio(a['archivo']))
        desde = a.get('desde', 0.0)
        hasta = min(a.get('hasta', mat.duration / SEC), mat.duration / SEC)
        rango = _hueco(pista, a.get('en', 0.0), hasta - desde)
        seg = cc.AudioSegment(mat, rango, source_timerange=cc.Timerange(int(round(desde * SEC)), rango.duration), volume=a.get('volumen', 1.0))
        if a.get('fundido'):
            fi, fo = a['fundido']
            seg.add_fade(f'{fi}s', f'{fo}s')
        script.add_segment(seg, pista)

    # --- Efectos de escena
    if plan.get('efectos'):
        script.add_track(cc.TrackType.effect, 'efectos-escena')
        for e in plan['efectos']:
            if (ef := _elegir(cc.VideoSceneEffectType, EFECTOS, e['efecto'], 'Efecto')):
                script.add_effect(ef, _tr(e['en'], e['hasta'] - e['en']), track_name='efectos-escena')

    # --- Escribir: rutas de medios -> carpeta real en la computadora de Raquel
    contenido = script.dumps()
    local = os.path.abspath(os.path.join(destino, 'materiales'))
    remoto = carpeta_final + sep + 'materiales'
    contenido = contenido.replace(json.dumps(local)[1:-1], json.dumps(remoto)[1:-1])
    if sep == '\\':
        contenido = contenido.replace(json.dumps(remoto)[1:-1] + '/', json.dumps(remoto)[1:-1] + '\\\\')
    datos = json.loads(contenido)
    datos['id'] = str(uuid.uuid4()).upper()
    # Con semilla: se parte del draft_info.json de SU CapCut y se conservan versión, plataforma e id
    # de la línea de tiempo (así su versión lo reconoce como proyecto propio)
    base_sem = None
    for cand in ('draft_info.json', 'draft_content.json'):
        ruta = os.path.join(destino, cand)
        if sem_dir and os.path.exists(ruta):
            try:
                base_sem = json.load(open(ruta, encoding='utf-8'))
                break
            except (json.JSONDecodeError, UnicodeDecodeError):
                avisos.append(f'La semilla trae {cand} cifrado: se usa la plantilla de pyCapCut (puede que esta versión de CapCut no lo abra)')
    if base_sem is not None:
        conservar = {'new_version', 'version', 'platform', 'last_modified_platform', 'id', 'create_time', 'path'}
        for k, v in datos.items():
            if k not in conservar:
                base_sem[k] = v
        timelines = [d for d in glob.glob(os.path.join(destino, 'Timelines', '*')) if os.path.isdir(d)]
        if len(timelines) == 1:
            base_sem['id'] = os.path.basename(timelines[0])
        datos = base_sem
    texto = json.dumps(datos, ensure_ascii=False)
    # Windows lee draft_content.json; Mac lee draft_info.json; CapCut 8.7+ además Timelines/<id>/draft_info.json
    for objetivo in ['draft_content.json', 'draft_info.json'] + [os.path.relpath(p, destino) for p in glob.glob(os.path.join(destino, 'Timelines', '*', 'draft_info.json'))]:
        with open(os.path.join(destino, objetivo), 'w', encoding='utf-8') as f:
            f.write(texto)
    for bak in glob.glob(os.path.join(destino, '**', '*.bak'), recursive=True):
        os.remove(bak)

    ahora = int(time.time() * 1_000_000)
    meta.update({
        'draft_name': nombre, 'draft_fold_path': carpeta_final, 'draft_root_path': raiz,
        'draft_id': str(uuid.uuid4()).upper(), 'tm_draft_create': ahora, 'tm_draft_modified': ahora,
        'tm_duration': datos.get('duration', 0),
    })
    json.dump(meta, open(meta_path, 'w', encoding='utf-8'), ensure_ascii=False)

    zpath = os.path.join(salida, f'{nombre}.zip')
    with zipfile.ZipFile(zpath, 'w', zipfile.ZIP_DEFLATED) as z:
        for r, _, fs in os.walk(destino):
            for fn in fs:
                p = os.path.join(r, fn)
                z.write(p, os.path.join(nombre, os.path.relpath(p, destino)))
    return destino, zpath, datos


def catalogo():
    for titulo, enum, mapa in (('Transiciones', cc.TransitionType, TRANSICIONES), ('Entradas de video', cc.IntroType, ENTRADAS_VIDEO),
                               ('Salidas de video', cc.OutroType, SALIDAS_VIDEO), ('Entradas de texto', cc.TextIntro, ENTRADAS_TEXTO),
                               ('Salidas de texto', cc.TextOutro, SALIDAS_TEXTO), ('Bucles de texto', cc.TextLoopAnim, BUCLES_TEXTO),
                               ('Filtros', cc.FilterType, FILTROS), ('Efectos', cc.VideoSceneEffectType, EFECTOS)):
        print(f'{titulo} ({len(enum.__members__)} nativos): ' + ', '.join(mapa))
    print('Fuentes nativas: ' + ', '.join(FUENTES))
    print('También acepta el nombre nativo exacto de CapCut (p. ej. "transicion": "眩光叠化").')


if __name__ == '__main__':
    if len(sys.argv) < 2 or sys.argv[1] not in ('construir', 'catalogo'):
        print(__doc__)
        sys.exit(1)
    if sys.argv[1] == 'catalogo':
        catalogo()
        sys.exit(0)
    args = sys.argv[2:]
    plan_path = args[0]
    semilla = args[args.index('--semilla') + 1] if '--semilla' in args else None
    salida = args[args.index('--salida') + 1] if '--salida' in args else 'out/capcut'
    plan = json.load(open(plan_path, encoding='utf-8'))
    # Rutas relativas del plan: respecto a video-studio/
    d, z, datos = construir(plan, semilla, salida)
    pistas = [t['type'] for t in datos.get('tracks', [])]
    print(f'Proyecto de CapCut listo: {d}')
    print(f'ZIP para Raquel: {z} ({os.path.getsize(z) / 1048576:.1f} MB) · duración {datos.get("duration", 0) / SEC:.1f} s · pistas: {pistas}')
    for a in dict.fromkeys(avisos):
        print('  Aviso:', a)
