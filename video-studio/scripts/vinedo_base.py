#!/usr/bin/env python3
"""Monta la base del reel Casa Comercial El Viñedo (v2: solo el guión, sin silencios).

1. Limpia la voz de cada clip con DeepFilterNet (red neuronal; sin retardo con -D),
   quita retumbe, da presencia y nivela cada clip a -16 LUFS.
2. Corta cada toma en "piezas" de habla (sin pausas) y las une a 1080x1920/30 fps.
   El audio de cada pieza se recorta con la MISMA entrada y la MISMA duración en
   fotogramas que el video, así la voz siempre va pegada a los labios.
3. Guarda public/work/vinedo/marcas.json con la posición de cada pieza, para que
   Remotion coloque subtítulos y títulos a partir de los tiempos del clip original.
"""
import json
import os
import subprocess

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
IN = os.path.join(ROOT, 'input', 'vinedo')
OUT = os.path.join(ROOT, 'public', 'work', 'vinedo')
TMP = os.path.join(OUT, 'tramos')
VOZ = os.path.join(OUT, 'voz')
DF = os.path.join(ROOT, '.models', 'bin', 'deep-filter')
os.makedirs(TMP, exist_ok=True)
os.makedirs(VOZ, exist_ok=True)

# (clave, archivo, [(entrada, salida), ...], tramos a silenciar)
# Las piezas salen de detectar la voz sobre el audio limpio (pausas > 0.28 s fuera).
TOMAS = [
    ('gancho', 'IMG_1842.MOV', [(1.00, 5.65)], []),
    ('cinta', 'IMG_1842.MOV', [(7.85, 11.80)], [(7.85, 8.95)]),     # corta la cinta; fuera la voz de quien graba
    ('dron', 'ia/ia_161546.mp4', [(0.0, 4.2)], []),
    ('corre', 'IMG_1897.MOV', [(3.15, 4.92)], []),
    ('cuentame', 'IMG_1848.MOV', [(0.74, 2.94)], []),
    ('pasa', 'IMG_1900.MOV', [(1.29, 2.25)], []),
    ('ubicacion', 'IMG_1854.MOV', [(3.70, 7.49), (7.69, 13.21)], []),
    ('niveles', 'IMG_1861.MOV', [(2.88, 6.91)], []),
    ('ia1', 'ia/ia_155457.mp4', [(0.0, 2.9)], []),
    ('ia2', 'ia/ia_155256.mp4', [(0.2, 3.03)], []),
    ('metros', 'IMG_1871.MOV', [(7.69, 16.36), (16.69, 20.35)], []),
    ('marca', 'IMG_1872.MOV', [(0.82, 3.92)], []),
    ('espacios', 'IMG_1879.MOV', [(2.69, 9.22), (9.41, 10.60), (10.83, 16.38)], []),
    ('cta', 'IMG_1837.MOV', [(0.55, 1.01), (1.16, 2.71), (2.82, 6.30)], []),
]

VF = 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,format=yuv420p'


def run(cmd):
    subprocess.run(cmd, check=True)


def voz_limpia(arch):
    """Audio completo del clip, limpio y nivelado (se cachea)."""
    base = os.path.splitext(os.path.basename(arch))[0]
    dst = os.path.join(VOZ, f'{base}.wav')
    if os.path.exists(dst):
        return dst
    raw = os.path.join(VOZ, f'{base}-raw.wav')
    run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(IN, arch), '-map', '0:a:0', '-ac', '1', '-ar', '48000',
         '-af', 'highpass=f=100', '-c:a', 'pcm_s16le', raw])
    dfdir = os.path.join(VOZ, 'df')
    os.makedirs(dfdir, exist_ok=True)
    run([DF, '-D', '-a', '40', '-o', dfdir, raw])
    eq = os.path.join(VOZ, f'{base}-eq.wav')
    run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(dfdir, f'{base}-raw.wav'), '-af',
         'highpass=f=110,equalizer=f=280:t=q:w=1.2:g=-2.5,equalizer=f=3500:t=q:w=1.0:g=2.5,'
         'acompressor=threshold=-24dB:ratio=3:attack=8:release=120:makeup=2', eq])
    # Nivel por clip (medido, ganancia lineal) para que todas las voces suenen igual
    st = subprocess.run(['ffmpeg', '-i', eq, '-af', 'loudnorm=I=-16:TP=-1.5:print_format=json', '-f', 'null', '-'],
                        capture_output=True, text=True).stderr
    m = json.loads(st[st.rindex('{'):])
    gain = -16 - float(m['input_i'])
    run(['ffmpeg', '-v', 'error', '-y', '-i', eq, '-af', f'volume={gain:.2f}dB,alimiter=limit=0.89', '-c:a', 'pcm_s16le', dst])
    return dst


lista = []
piezas = []
t = 0.0
for clave, arch, rangos, mudos in TOMAS:
    ia = arch.startswith('ia/')
    voz = None if ia else voz_limpia(arch)
    for k, (a, b) in enumerate(rangos):
        n = round((b - a) * 30)
        dur = n / 30
        dst = os.path.join(TMP, f'{clave}-{k}.mov')
        cmd = ['ffmpeg', '-v', 'error', '-y', '-ss', f'{a}', '-i', os.path.join(IN, arch)]
        if ia:
            cmd += ['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono', '-map', '0:v', '-map', '1:a']
            af = f'atrim=0:{dur}'
        else:
            cmd += ['-ss', f'{a}', '-i', voz, '-map', '0:v', '-map', '1:a']
            vol = ''.join(f",volume=enable='between(t,{ma - a:.3f},{mb - a:.3f})':volume=0" for ma, mb in mudos)
            af = f'atrim=0:{dur}{vol},afade=t=in:d=0.02,afade=t=out:st={dur - 0.03:.3f}:d=0.03'
        cmd += ['-vf', VF, '-af', f'{af},apad,atrim=0:{dur},asetpts=N/SR/TB', '-frames:v', str(n),
                '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-c:a', 'pcm_s16le', '-ar', '48000', '-ac', '1', dst]
        run(cmd)
        lista.append(dst)
        piezas.append({'clave': clave, 'k': k, 'a': a, 'b': round(a + dur, 4), 't': round(t, 4), 'frames': n})
        t += dur

with open(os.path.join(TMP, 'lista.txt'), 'w') as f:
    for p in lista:
        f.write(f"file '{p}'\n")
run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', os.path.join(TMP, 'lista.txt'),
     '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ac', '2', os.path.join(OUT, 'base.mp4')])
json.dump({'piezas': piezas, 'total': round(t, 4), 'frames': sum(p['frames'] for p in piezas)},
          open(os.path.join(OUT, 'marcas.json'), 'w'), indent=1)
for p in piezas:
    print(f"{p['t']:7.2f}s  {p['clave']}-{p['k']}  [{p['a']}–{p['b']}]")
print('total', round(t, 3))
