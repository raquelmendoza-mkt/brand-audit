#!/usr/bin/env python3
"""Genera efectos de sonido originales (libres de derechos) en public/sfx/.

Uso: python3 scripts/sfx.py [carpeta_salida]

Crea: error.wav, sparkle.wav, impacto.wav, whoosh.wav, whoosh-corto.wav, ping.wav, ding.wav, pop.wav, click.wav,
teclado-iphone.wav (ráfaga de tecleo), tecla.wav (una sola tecla) y swipe.wav.
Línea "premium" (lujo, minimalista): aire.wav (whoosh suave y largo), aire-corto.wav, riser.wav
(subida de tensión 1.5 s), sub.wav (golpe grave cinematográfico), brillo.wav (destello suave),
tic.wav (clic fino de interfaz), texto.wav (soplo cortito para textos que aparecen) y
reveal.wav (barrido + campana suave para revelar precio o logo).
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

print('Efectos listos en', os.path.abspath(out))
for f in sorted(os.listdir(out)):
    if f.endswith('.wav'):
        print(' -', f)
