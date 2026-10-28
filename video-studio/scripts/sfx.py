#!/usr/bin/env python3
"""Genera efectos de sonido originales (libres de derechos) en public/sfx/.

Uso: python3 scripts/sfx.py [carpeta_salida]

Crea: error.wav, sparkle.wav, impacto.wav, whoosh.wav, whoosh-corto.wav, ping.wav, ding.wav, pop.wav, click.wav,
teclado-iphone.wav (ráfaga de tecleo), tecla.wav (una sola tecla) y swipe.wav.
Línea "premium" (lujo, minimalista): aire.wav (whoosh suave y largo), aire-corto.wav, riser.wav
(subida de tensión 1.5 s), sub.wav (golpe grave cinematográfico), brillo.wav (destello suave),
tic.wav (clic fino de interfaz), texto.wav (soplo cortito para textos que aparecen) y
reveal.wav (barrido + campana suave para revelar precio o logo).
Variaciones y especiales: whoosh-2/whoosh-3 (no repetir siempre el mismo), sube/baja (barridos con
tono que sube o baja), impacto-2 (golpe metálico), braam (tráiler), drop (caída de bajo), reverso
(platillo al revés, antes de un corte), glitch, caja (ka-ching de dinero), obturador (foto),
notificacion (tres tonos tipo celular), latido, burbuja y tecla-mecanica.
Si remotion.media está permitido en la red, scripts/setup.sh descarga además los
efectos grabados de @remotion/sfx a public/sfx/remotion/.
"""
import os
import sys
import wave

import numpy as np

SR = 48000
rng = np.random.default_rng(11)
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'public', 'sfx')
os.makedirs(out, exist_ok=True)


def t(dur):
    return np.arange(int(dur * SR)) / SR


def onepole(x, cutoff):
    # Filtro paso bajo de un polo con frecuencia de corte variable en el tiempo
    cutoff = np.broadcast_to(cutoff, x.shape)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        a = np.exp(-2 * np.pi * cutoff[i] / SR)
        acc = (1 - a) * x[i] + a * acc
        y[i] = acc
    return y


def bandpass(x, lo, hi):
    return onepole(x, hi) - onepole(x, lo)


def save(name, sig, stereo_pan=None):
    sig = sig / (np.max(np.abs(sig)) + 1e-9) * 0.89
    if stereo_pan is None:
        st = np.stack([sig, sig], axis=1)
    else:
        st = np.stack([sig * (1 - stereo_pan), sig * stereo_pan], axis=1) * 1.6
        st = np.clip(st, -0.95, 0.95)
    with wave.open(os.path.join(out, name), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((st * 32767).astype('<i2').tobytes())


def whoosh(dur):
    tt = t(dur)
    p = tt / dur
    noise = rng.normal(0, 1, len(tt))
    # El filtro sube y baja: aire que pasa cerca
    sweep = 300 + 5200 * np.sin(np.pi * p) ** 2
    sig = bandpass(noise, sweep * 0.35, sweep)
    envl = np.sin(np.pi * np.clip(p, 0, 1)) ** 1.5
    return sig * envl


def bell(f, dur, decay, partials):
    tt = t(dur)
    s = sum(a * np.sin(2 * np.pi * f * m * tt) * np.exp(-tt * decay * (1 + 0.6 * k)) for k, (m, a) in enumerate(partials))
    att = np.minimum(1, tt / 0.002)
    return s * att


def tap(bright=1.0):
    # Tecla del teclado del iPhone: clic corto y seco con un poco de "cuerpo"
    tt = t(0.045)
    noise = rng.normal(0, 1, len(tt))
    click = bandpass(noise, 1800, 6500 * bright) * np.exp(-tt * 260)
    body = np.sin(2 * np.pi * 1150 * tt) * np.exp(-tt * 180) * 0.35
    return click + body


# Whoosh: transición entre cortes
w = whoosh(0.55)
save('whoosh.wav', w)
save('whoosh-corto.wav', whoosh(0.28))

# Swipe: deslizar en la pantalla del celular (más agudo y corto)
tt = t(0.22)
sw = bandpass(rng.normal(0, 1, len(tt)), 2500, 9000) * np.sin(np.pi * tt / 0.22) ** 2
save('swipe.wav', sw)

# Ping: notificación brillante (dos notas rápidas)
p1 = bell(1568, 0.6, 7, [(1, 1), (2.01, 0.35), (3.0, 0.12)])
p2 = bell(2093, 0.8, 6, [(1, 1), (2.01, 0.3), (3.0, 0.1)])
ping = np.zeros(int(0.9 * SR))
ping[: len(p1)] += p1 * 0.8
s = int(0.09 * SR)
ping[s: s + len(p2)] += p2[: len(ping) - s]
save('ping.wav', ping)

# Ding: campanita para resaltar un dato
save('ding.wav', bell(1318.5, 1.2, 4, [(1, 1), (2.76, 0.4), (5.4, 0.15)]))

# Pop: aparición de texto
tt = t(0.12)
f = 900 * np.exp(-tt * 30) + 220
pop = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 40)
save('pop.wav', pop)

# Impacto: golpe grave para títulos que "caen" en pantalla
tt = t(0.9)
f = 38 + 90 * np.exp(-tt * 18)
boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 4.5)
crack = bandpass(rng.normal(0, 1, len(tt)), 200, 4000) * np.exp(-tt * 35) * 0.5
save('impacto.wav', np.tanh((boom + crack) * 2.2))

# Error: dos tonos graves cortos (para "lo que NO debes hacer")
err = np.zeros(int(0.42 * SR))
for k, f0 in enumerate((220, 165)):
    tt = t(0.17)
    tone = np.sign(np.sin(2 * np.pi * f0 * tt)) * 0.5 + np.sin(2 * np.pi * f0 * tt) * 0.5
    seg = onepole(tone, 1800) * np.minimum(tt / 0.005, 1) * np.exp(-tt * 6)
    i = int(k * 0.2 * SR)
    err[i: i + len(seg)] += seg
save('error.wav', err)

# Sparkle: arpegio brillante ascendente (para algo valioso / premium)
sp = np.zeros(int(1.1 * SR))
for k, f0 in enumerate((1568, 1976, 2349, 3136)):
    b = bell(f0, 0.8, 7, [(1, 1), (2.0, 0.25)])
    i = int(k * 0.06 * SR)
    sp[i: i + len(b)] += b[: len(sp) - i] * (0.9 - 0.1 * k)
save('sparkle.wav', sp)

# Click: clic de mouse / botón
save('click.wav', tap(1.4)[: int(0.03 * SR)])

# Una tecla suelta y una ráfaga de tecleo (unas 9 teclas por segundo, ritmo humano)
save('tecla.wav', tap())
dur = 1.6
burst = np.zeros(int(dur * SR))
pos = 0.02
while pos < dur - 0.06:
    k = tap(rng.uniform(0.85, 1.15)) * rng.uniform(0.6, 1.0)
    i = int(pos * SR)
    burst[i: i + len(k)] += k[: len(burst) - i]
    pos += rng.uniform(0.07, 0.16)
save('teclado-iphone.wav', burst)


# ---------------- Línea premium (suave, para lujo / minimalista) ----------------
def aire(dur, top=2600):
    tt = t(dur)
    p = tt / dur
    noise = rng.normal(0, 1, len(tt))
    sweep = 180 + top * np.sin(np.pi * p) ** 2
    sig = bandpass(noise, sweep * 0.4, sweep)
    return sig * np.sin(np.pi * np.clip(p, 0, 1)) ** 2.2


save('aire.wav', aire(0.9))
save('aire-corto.wav', aire(0.45, 3400))

# Riser: ruido que sube + tono que asciende, termina en seco
tt = t(1.5)
p = tt / 1.5
r = bandpass(rng.normal(0, 1, len(tt)), 300 + 3000 * p ** 2, 900 + 7000 * p ** 2) * p ** 2.4
r += np.sin(2 * np.pi * np.cumsum(220 + 880 * p ** 2) / SR) * p ** 3 * 0.25
save('riser.wav', r)

# Sub: golpe grave cinematográfico (sin "crack" agudo)
tt = t(1.6)
f = 32 + 55 * np.exp(-tt * 9)
save('sub.wav', np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 2.6) * 1.6))

# Brillo: glissando suave de campanitas (más delicado que sparkle)
br = np.zeros(int(1.6 * SR))
for k, f0 in enumerate((1760, 2217, 2637, 3520, 4186)):
    b = bell(f0, 1.2, 5, [(1, 1), (2.0, 0.15)])
    i = int(k * 0.045 * SR)
    br[i: i + len(b)] += b[: len(br) - i] * (0.6 - 0.08 * k)
save('brillo.wav', br * 0.7)

# Tic: clic fino de interfaz
tt = t(0.02)
save('tic.wav', bandpass(rng.normal(0, 1, len(tt)), 3000, 9000) * np.exp(-tt * 400))

# Texto: soplo muy corto para textos que entran
save('texto.wav', aire(0.22, 5200) * 0.7)

# Reveal: barrido suave + campana grave/aguda (precio, logo, nombre)
rv = np.zeros(int(2.2 * SR))
w = aire(0.7, 3000)
rv[: len(w)] += w * 0.8
b1 = bell(880, 2.0, 2.2, [(1, 1), (2.0, 0.3), (3.0, 0.1)])
b2 = bell(1760, 1.6, 3, [(1, 1), (2.0, 0.2)])
i = int(0.55 * SR)
rv[i: i + len(b1)] += b1[: len(rv) - i] * 0.6
rv[i: i + len(b2)] += b2[: len(rv) - i] * 0.35
save('reveal.wav', rv)


# ---------------- Variaciones y especiales ----------------
save('whoosh-2.wav', whoosh(0.42) * 0.9)
w3 = whoosh(0.7)
save('whoosh-3.wav', onepole(w3, 2500))

# Barridos con tono: sube (entra algo) / baja (sale algo)
for nombre, f0, f1 in (('sube', 300, 2400), ('baja', 2400, 300)):
    tt = t(0.5)
    p = tt / 0.5
    f = f0 * (f1 / f0) ** p
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.35
    air = bandpass(rng.normal(0, 1, len(tt)), f * 0.5, f * 1.5) * 0.6
    save(f'{nombre}.wav', (tone + air) * np.sin(np.pi * p) ** 1.4)

# Impacto metálico: golpe + resonancias inarmónicas
tt = t(1.4)
met = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) * a for f, d, a in ((110, 3, 1), (277, 4, 0.5), (523, 6, 0.3), (1290, 9, 0.15)))
save('impacto-2.wav', np.tanh((met + bandpass(rng.normal(0, 1, len(tt)), 200, 5000) * np.exp(-tt * 30) * 0.6) * 1.8))

# Braam de tráiler: metales graves desafinados con crescendo y caída
tt = t(2.2)
env = np.minimum(tt / 0.05, 1) * np.exp(-tt * 1.4)
br = np.zeros(len(tt))
for f in (55, 55.6, 82.4, 110.3):
    ph = (tt * f) % 1
    br += 2 * ph - 1
save('braam.wav', np.tanh(onepole(br, 900) * env * 2.5))

# Drop: caída de tono de bajo
tt = t(1.2)
f = 140 * np.exp(-tt * 3) + 35
save('drop.wav', np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 - np.exp(-tt * 40)) * np.exp(-tt * 1.8) * 1.8))

# Reverso: platillo al revés (crece hasta el corte)
tt = t(1.6)
cym = bandpass(rng.normal(0, 1, len(tt)), 4000, 14000) * np.exp(-tt * 2.5)
save('reverso.wav', cym[::-1] * 0.8)

# Glitch: fragmentos digitales cortados
gl = np.zeros(int(0.5 * SR))
pos = 0
while pos < len(gl) - 2000:
    n = int(rng.uniform(0.01, 0.05) * SR)
    kind = rng.integers(0, 3)
    seg_t = np.arange(n) / SR
    if kind == 0:
        seg = np.sign(np.sin(2 * np.pi * rng.uniform(200, 2000) * seg_t))
    elif kind == 1:
        seg = rng.normal(0, 1, n)
    else:
        seg = np.round(np.sin(2 * np.pi * rng.uniform(80, 400) * seg_t) * 4) / 4
    gl[pos: pos + n] += seg[: len(gl) - pos] * rng.uniform(0.4, 1)
    pos += n + int(rng.uniform(0, 0.02) * SR)
save('glitch.wav', gl * 0.7)

# Caja registradora: campanita + monedas
cj = np.zeros(int(1.2 * SR))
b = bell(2637, 1.0, 4, [(1, 1), (2.4, 0.4), (3.9, 0.2)])
cj[int(0.12 * SR): int(0.12 * SR) + len(b)] += b[: len(cj) - int(0.12 * SR)]
for k in range(10):
    c = bell(rng.uniform(3000, 6000), 0.12, 40, [(1, 1), (1.7, 0.5)])
    i = int((0.02 + k * 0.025) * SR)
    cj[i: i + len(c)] += c * 0.35
save('caja.wav', cj)

# Obturador de cámara: dos clics mecánicos
ob = np.zeros(int(0.25 * SR))
for at, br_ in ((0.0, 1.0), (0.09, 0.7)):
    tt = t(0.04)
    c = bandpass(rng.normal(0, 1, len(tt)), 800, 7000) * np.exp(-tt * 120) * br_
    i = int(at * SR)
    ob[i: i + len(c)] += c
save('obturador.wav', ob)

# Notificación: tres tonos ascendentes
nt = np.zeros(int(0.9 * SR))
for k, f0 in enumerate((1318.5, 1568, 2093)):
    b = bell(f0, 0.5, 7, [(1, 1), (2.0, 0.2)])
    i = int(k * 0.11 * SR)
    nt[i: i + len(b)] += b[: len(nt) - i] * 0.7
save('notificacion.wav', nt)

# Latido: dos golpes graves (tensión, expectativa)
lt = np.zeros(int(0.9 * SR))
for at, a in ((0.0, 1.0), (0.22, 0.75)):
    tt = t(0.25)
    f = 45 + 30 * np.exp(-tt * 20)
    c = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 14) * a
    i = int(at * SR)
    lt[i: i + len(c)] += c
save('latido.wav', lt)

# Burbuja: pop acuoso que sube de tono
tt = t(0.14)
f = 300 + 1500 * (tt / 0.14) ** 0.6
save('burbuja.wav', np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 28))

# Tecla mecánica: clic + rebote
tt = t(0.06)
tm = bandpass(rng.normal(0, 1, len(tt)), 1500, 8000) * np.exp(-tt * 180)
tm[int(0.025 * SR):] += bandpass(rng.normal(0, 1, len(tt) - int(0.025 * SR)), 2000, 9000) * 0.4 * np.exp(-tt[: len(tt) - int(0.025 * SR)] * 250)
save('tecla-mecanica.wav', tm)

print('Efectos listos en', os.path.abspath(out))
for f in sorted(os.listdir(out)):
    if f.endswith('.wav'):
        print(' -', f)
