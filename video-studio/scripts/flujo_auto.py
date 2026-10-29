#!/usr/bin/env python3
"""Flujo automático: clips crudos -> reel terminado (MP4) + proyecto editable de CapCut + informe.

Uso (con el entorno de análisis):
  .venv-ia/bin/python scripts/flujo_auto.py input/a.mov [input/b.mov ...] --nombre casa-x \
      --estilo inmobiliario --gancho "Esta casa lo tiene todo" --cta "Comenta CASA" \
      [--dur 35] [--musica auto|no|ruta.wav] [--semilla input/capcut/semilla.zip] [--modelo turbo|small] \
      [--corregir "Stephanie=Stefany" "Viñedo=El Viñedo"]

Pasos (cada uno deja su archivo en public/work/<nombre>/ y el resultado en out/entregas/<nombre>/):
  1. Análisis: duración, resolución, escenas (PySceneDetect) y volumen de cada clip.
  2. Preparación: vertical 1080x1920 a 30 fps y voz limpia (DeepFilterNet + EQ + nivel parejo).
  3. Transcripción palabra por palabra (faster-whisper con detección de voz Silero).
  4. Cortes: solo las frases habladas (quita silencios y pausas); si pasa de --dur lo avisa.
  5. Base cortada + música con ducking (opcional) + subtítulos (JSON y SRT).
  6. Render en Remotion (composición Reel: gancho, subtítulos animados, barra, cierre con CTA).
  7. Proyecto de CapCut con los mismos cortes (pista por pista) si hay semilla.
  8. Control de calidad: medidas técnicas + 3 fotogramas para revisar, e informe.md.
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys

import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
os.chdir(ROOT)
sys.path.insert(0, os.path.join(ROOT, 'capcut'))
DF = '.models/bin/deep-filter'
MODELOS = {'turbo': 'mobiuslabsgmbh/faster-whisper-large-v3-turbo', 'small': 'Systran/faster-whisper-small'}
# Estilo -> música por defecto y volumen
MUSICA = {'viral': ('electro', 0.2), 'anuncio': ('electro', 0.18), 'inmobiliario': ('elegante', 0.16), 'marca': ('elegante', 0.14)}

ap = argparse.ArgumentParser()
ap.add_argument('clips', nargs='+')
ap.add_argument('--nombre', required=True)
ap.add_argument('--estilo', default='viral', choices=list(MUSICA))
ap.add_argument('--gancho', default='')
ap.add_argument('--cta', default='')
ap.add_argument('--sub', default='')
ap.add_argument('--handle', default='@raquelmendoza.ia')
ap.add_argument('--dur', type=float, default=0)
ap.add_argument('--musica', default='auto')
ap.add_argument('--semilla', default='input/capcut/semilla.zip')
ap.add_argument('--modelo', default='turbo', choices=list(MODELOS))
ap.add_argument('--corregir', nargs='*', default=[], help='"Mal=Bien": corrige nombres en los subtítulos')
arg = ap.parse_args()

nombre = re.sub(r'[^a-zA-Z0-9-_]', '-', arg.nombre)
W = f'public/work/{nombre}'
OUT = f'out/entregas/{nombre}'
os.makedirs(W, exist_ok=True)
os.makedirs(OUT, exist_ok=True)
informe = {'nombre': nombre, 'estilo': arg.estilo, 'clips': [], 'avisos': []}


def ff(*a):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *a], check=True)


def dur(f):
    return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout)


def lufs(f):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', f, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r)[-1]), float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', r)[-1])


def paso(n, txt):
    print(f'\n{n}/8  {txt}', flush=True)


# 1. Análisis
paso(1, 'Analizando clips...')
from scenedetect import ContentDetector, detect  # noqa: E402

for c in arg.clips:
    p = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type,width,height,avg_frame_rate:format=duration',
                                   '-of', 'json', c], capture_output=True, text=True).stdout)
    v = next(s for s in p['streams'] if s['codec_type'] == 'video')
    escenas = [round(a.get_seconds(), 2) for a, _ in detect(c, ContentDetector(threshold=27))]
    informe['clips'].append({'archivo': c, 'duracion': round(float(p['format']['duration']), 2), 'res': f"{v['width']}x{v['height']} (sin girar)",
                             'fps': v['avg_frame_rate'], 'escenas': escenas, 'lufs': lufs(c)[0]})
    print(f"  {os.path.basename(c)}: {informe['clips'][-1]['duracion']} s · {v['width']}x{v['height']} · {len(escenas)} escena(s)")

# 2. Preparación: vertical + voz limpia
paso(2, 'Formato vertical y voz limpia...')
prep = []
for i, c in enumerate(arg.clips):
    dst = f'{W}/clip{i + 1}.mp4'
    if not os.path.exists(dst):
        raw, eq = f'{W}/voz{i + 1}-raw.wav', f'{W}/voz{i + 1}-eq.wav'
        ff('-i', c, '-map', '0:a:0', '-ac', '1', '-ar', '48000', '-af', 'highpass=f=100', '-c:a', 'pcm_s16le', raw)
        os.makedirs(f'{W}/df', exist_ok=True)
        if os.path.exists(DF):
            subprocess.run([DF, '-D', '-a', '40', '-o', f'{W}/df', raw], check=True, capture_output=True)
            limpio = f'{W}/df/{os.path.basename(raw)}'
        else:
            informe['avisos'].append('DeepFilterNet no está instalado: voz sin limpieza IA (ejecuta scripts/setup.sh)')
            limpio = raw
        ff('-i', limpio, '-af', 'highpass=f=110,equalizer=f=280:t=q:w=1.2:g=-2.5,equalizer=f=3500:t=q:w=1.0:g=2.5,'
           'acompressor=threshold=-24dB:ratio=3:attack=8:release=120:makeup=2', eq)
        li = lufs(eq)[0]
        ff('-i', c, '-i', eq, '-map', '0:v:0', '-map', '1:a', '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,format=yuv420p',
           '-af', f'volume={-16 - li:.2f}dB,alimiter=limit=0.89', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-c:a', 'aac', '-b:a', '256k', '-shortest', dst)
    prep.append(dst)

# 3. Transcripción
paso(3, f'Transcribiendo (faster-whisper {arg.modelo})...')
os.environ.setdefault('HF_HOME', os.path.join(ROOT, '.models', 'hf'))
from faster_whisper import WhisperModel  # noqa: E402

modelo = WhisperModel(MODELOS[arg.modelo], device='cpu', compute_type='int8', cpu_threads=os.cpu_count() or 4)
palabras = []  # (clip, inicio, fin, texto)
for i, c in enumerate(prep):
    audio = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', c, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32)
    segs, _ = modelo.transcribe(audio, language='es', word_timestamps=True, vad_filter=True, vad_parameters={'min_silence_duration_ms': 300})
    for s in segs:
        for w in s.words or []:
            txt = w.word.strip()
            for par in arg.corregir:
                mal, bien = par.split('=', 1)
                txt = re.sub(rf'\b{re.escape(mal)}\b', bien, txt, flags=re.I)
            palabras.append((i, w.start, w.end, txt))
if not palabras:
    sys.exit('No se detectó voz en los clips.')

# 4. Cortes: frases habladas (pausa > 0.35 s = corte), con margen para no comerse sílabas
paso(4, 'Quitando silencios...')
frases = []
for p in palabras:
    if frases and frases[-1]['clip'] == p[0] and p[1] - frases[-1]['b'] < 0.35:
        frases[-1]['b'] = p[2]
        frases[-1]['palabras'].append(p)
    else:
        frases.append({'clip': p[0], 'a': p[1], 'b': p[2], 'palabras': [p]})
piezas, t = [], 0.0
for f in frases:
    a = max(0.0, f['a'] - 0.12)
    b = min(dur(prep[f['clip']]), f['b'] + 0.18)
    if piezas and piezas[-1]['clip'] == f['clip'] and a <= piezas[-1]['b']:
        piezas[-1]['b'] = b
        piezas[-1]['palabras'] += f['palabras']
        continue
    piezas.append({'clip': f['clip'], 'a': a, 'b': b, 'palabras': list(f['palabras'])})
for p in piezas:
    p['t'] = t
    t += p['b'] - p['a']
total = t
crudo = sum(c['duracion'] for c in informe['clips'])
print(f'  {crudo:.1f} s crudos -> {total:.1f} s hablados en {len(piezas)} piezas')
if arg.dur and total > arg.dur * 1.1:
    informe['avisos'].append(f'Lo hablado dura {total:.1f} s y pediste {arg.dur:.0f} s: elige qué frases quitar (ver transcripción) o se entrega completo')

# 5. Base cortada, subtítulos y música
paso(5, 'Montando base, subtítulos y música...')
entradas, filtros = [], []
for i, c in enumerate(prep):
    entradas += ['-i', c]
for k, p in enumerate(piezas):
    d = p['b'] - p['a']
    filtros.append(f"[{p['clip']}:v]trim={p['a']:.3f}:{p['b']:.3f},setpts=PTS-STARTPTS[v{k}];"
                   f"[{p['clip']}:a]atrim={p['a']:.3f}:{p['b']:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st={max(0, d - 0.03):.3f}:d=0.03[a{k}]")
cadena = ''.join(f'[v{k}][a{k}]' for k in range(len(piezas)))
base = f'{W}/base.mp4'
ff(*entradas, '-filter_complex', ';'.join(filtros) + f';{cadena}concat=n={len(piezas)}:v=1:a=1[v][a]', '-map', '[v]', '-map', '[a]',
   '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-c:a', 'aac', '-b:a', '256k', base)

caps = []
for p in piezas:
    for _, a, b, txt in p['palabras']:
        s, e = p['t'] + a - p['a'], p['t'] + b - p['a']
        caps.append({'text': ' ' + txt, 'startMs': round(s * 1000), 'endMs': round(e * 1000), 'timestampMs': round((s + e) * 500), 'confidence': None})
json.dump(caps, open(f'{W}/captions.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


def ts(ms):
    return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'


lineas, cur = [], []
for k, c in enumerate(caps):
    cur.append(c)
    sig = caps[k + 1] if k + 1 < len(caps) else None
    if not sig or re.search(r'[.?!]$', c['text']) or len(cur) >= 5 or sig['startMs'] - c['endMs'] > 500:
        lineas.append(cur)
        cur = []
srt = f'{OUT}/{nombre}.srt'
with open(srt, 'w', encoding='utf-8') as f:
    for n, l in enumerate(lineas, 1):
        f.write(f"{n}\n{ts(l[0]['startMs'])} --> {ts(l[-1]['endMs'])}\n{''.join(c['text'] for c in l).strip()}\n\n")

musica = None
if arg.musica == 'auto':
    tipo, vol = MUSICA[arg.estilo]
    musica = f'{W}/musica.wav'
    largo = f'{total + 4:.1f}'
    if tipo == 'electro':
        subprocess.run([sys.executable, '-I', 'scripts/electro.py', musica, largo], check=True, capture_output=True)
    else:
        subprocess.run([sys.executable, '-I', 'scripts/afrohouse.py', musica, largo, '--estilo', 'elegante'], check=True, capture_output=True)
elif arg.musica != 'no':
    musica, vol = arg.musica, MUSICA[arg.estilo][1]
final = base
if musica:
    final = f'{W}/final.mp4'
    ff('-i', base, '-stream_loop', '-1', '-i', musica, '-filter_complex',
       f'[1:a]volume={vol},afade=t=in:d=0.6[m];[0:a]asplit=2[v][sc];[m][sc]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=350[md];'
       f'[v][md]amix=inputs=2:normalize=0:duration=first,afade=t=out:st={max(0, total - 1.2):.2f}:d=1.2[a]',
       '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest', final)

# 6. Render en Remotion
paso(6, 'Renderizando en Remotion...')
mp4 = f'{OUT}/{nombre}.mp4'
props = {'video': final.replace('public/', '', 1), 'captionsFile': f'work/{nombre}/captions.json', 'durationInSeconds': dur(final),
         'hook': arg.gancho, 'hookTop': 780, 'cta': arg.cta, 'ctaSub': arg.sub, 'handle': arg.handle, 'showProgress': True}
crudo_mp4 = f'{W}/render.mp4'
subprocess.run(['npx', 'remotion', 'render', 'Reel', crudo_mp4, f'--props={json.dumps(props, ensure_ascii=False)}', '--log=error'], check=True)
li, pico = lufs(crudo_mp4)
ff('-i', crudo_mp4, '-c:v', 'copy', '-af', f'volume={min(-14 - li, -1 - pico):.2f}dB', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', mp4)

# 7. CapCut (mismos cortes, pista por pista)
paso(7, 'Proyecto de CapCut...')
zip_capcut = None
if arg.semilla and os.path.exists(arg.semilla):
    import rm_capcut

    plan = {'nombre': f'RM - {nombre}', 'ancho': 1080, 'alto': 1920, 'fps': 30,
            'video': [{'archivo': prep[p['clip']], 'desde': round(p['a'], 3), 'hasta': round(p['b'], 3), 'en': round(p['t'], 3),
                       'fundido_audio': [0.02, 0.03], **({'zoom': 1.08} if k % 2 else {})} for k, p in enumerate(piezas)],
            'subtitulos': {'srt': srt, 'fuente': 'montserrat', 'tam': 7, 'color': '#FFFFFF', 'y': -0.45, 'borde': '#000000'},
            'textos': [], 'audio': []}
    if arg.gancho:
        plan['textos'].append({'texto': arg.gancho.upper(), 'en': 0, 'hasta': min(3.0, total), 'y': 0.45, 'tam': 12, 'fuente': 'poppins',
                               'color': '#FFFFFF', 'sombra': True, 'entrada': 'pop', 'pista': 'gancho'})
    if arg.cta:
        plan['textos'].append({'texto': arg.cta, 'en': max(0, total - 3), 'hasta': total, 'y': 0.2, 'tam': 10, 'fuente': 'poppins',
                               'color': '#1C6BEA', 'fondo': '#FFFFFF', 'entrada': 'pop', 'bucle': 'pulso', 'pista': 'cta'})
    if musica:
        plan['audio'].append({'archivo': musica, 'en': 0, 'desde': 0, 'hasta': round(total, 2), 'volumen': vol, 'fundido': [0.5, 1.2], 'pista': 'musica'})
    for p in piezas[1:]:
        plan['audio'].append({'archivo': 'public/sfx/whoosh-corto.wav', 'en': round(max(0, p['t'] - 0.08), 2), 'volumen': 0.3, 'pista': 'sfx-cortes'})
    json.dump(plan, open(f'{W}/plan-capcut.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    _, zip_capcut, _ = rm_capcut.construir(plan, arg.semilla, os.path.join(OUT, 'capcut'))
    informe['avisos'] += list(dict.fromkeys(rm_capcut.avisos))
else:
    informe['avisos'].append('Sin semilla de CapCut: no se creó el proyecto (ver capcut.md)')

# 8. Control de calidad
paso(8, 'Control de calidad...')
v = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,avg_frame_rate', '-of', 'json', mp4],
                              capture_output=True, text=True).stdout)['streams'][0]
li, pico = lufs(mp4)
dfinal = dur(mp4)
qc = {'resolucion': f"{v['width']}x{v['height']}", 'fps': v['avg_frame_rate'], 'duracion': round(dfinal, 2), 'lufs': li, 'pico_dB': pico,
      'ok': v['width'] == 1080 and v['height'] == 1920 and v['avg_frame_rate'] == '30/1' and -15 <= li <= -13 and pico <= -0.9}
for k, x in enumerate((0.15, 0.5, 0.85), 1):
    ff('-ss', f'{dfinal * x:.2f}', '-i', mp4, '-frames:v', '1', '-vf', 'scale=540:-1', '-update', '1', f'{OUT}/revisar-{k}.jpg')
informe.update({'hablado_s': round(total, 2), 'piezas': len(piezas), 'qc': qc, 'mp4': mp4, 'capcut': zip_capcut, 'srt': srt,
                'transcripcion': ' '.join(w[3] for w in palabras)})
json.dump(informe, open(f'{OUT}/informe.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
with open(f'{OUT}/informe.md', 'w', encoding='utf-8') as f:
    f.write(f"# {nombre}\n\n| | |\n|---|---|\n| Video | {os.path.basename(mp4)} · {qc['resolucion']} · {qc['fps']} fps · {qc['duracion']} s |\n"
            f"| Audio | {li:.1f} LUFS · pico {pico:.1f} dB |\n| Cortes | {crudo:.1f} s crudos → {total:.1f} s, {len(piezas)} piezas |\n"
            f"| CapCut | {os.path.basename(zip_capcut) if zip_capcut else 'no'} |\n| Técnico | {'OK' if qc['ok'] else 'REVISAR'} |\n\n"
            f"## Transcripción\n{informe['transcripcion']}\n\n## Avisos\n" + ''.join(f'- {a}\n' for a in informe['avisos'] or ['Ninguno']) +
            '\nRevisa a ojo revisar-1/2/3.jpg (texto cortado, caras tapadas) antes de entregar.\n')
shutil.copy(f'{W}/captions.json', f'{OUT}/subtitulos-palabras.json')
print(f"\nListo en {OUT}/  ·  técnico: {'OK' if qc['ok'] else 'REVISAR'}  ·  {qc['duracion']} s  ·  {li:.1f} LUFS")
for a in informe['avisos']:
    print('  Aviso:', a)
