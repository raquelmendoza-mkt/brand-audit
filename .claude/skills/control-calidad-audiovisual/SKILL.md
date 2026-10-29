---
name: control-calidad-audiovisual
description: Control de calidad audiovisual antes de entregar cualquier video de video-studio/ — técnico (resolución, fps, LUFS, picos, peso), visual (texto cortado, zonas seguras, caras tapadas), audio (voz, sincronía, ducking) y contenido (ortografía, cifras, nombres). Úsalo siempre antes de entregar, o cuando Raquel pida revisar un video.
---

# Control de calidad audiovisual

Lista completa: `editor-video/checklist.md`. Nunca digas "listo" sin haber hecho esto.

## 1. Técnico (medido, no supuesto)
```bash
ffprobe -v error -show_entries stream=codec_name,width,height,avg_frame_rate:format=duration,size -of compact video.mp4
ffmpeg -hide_banner -i video.mp4 -af ebur128=peak=true -f null - 2>&1 | tail -12
```
- 1080x1920, 30 fps, H.264 + AAC; -14 LUFS (±1) con voz, -16 solo efectos; pico ≤ -1 dB.
- Duración dentro de lo pedido (+10 %). Peso: < 30 MB por chat, si no `entregas/` + enlace raw.
- `scripts/flujo_auto.py` ya escribe estas medidas en `informe.md`.

## 2. Visual (míralo con Read)
Extrae fotogramas: inicio (gancho), cada título, cada corte de bloque, cierre:
`ffmpeg -ss <s> -i video.mp4 -frames:v 1 -vf scale=540:-1 f.jpg`.
- Texto completo y dentro de la zona segura; nada sobre la cara; contraste suficiente.
- Sin fotogramas negros, saltos de color entre tomas ni bordes por zoom.

## 3. Audio
- Voz limpia y pareja entre clips; música por debajo de la voz; sin cortes a media palabra
  (escucha los saltos: `afade` de 20-30 ms en cada pieza); efectos en el instante exacto.
- Sincronía labios-voz si hubo dudas: `scripts/sincronia.py`.

## 4. Contenido
- Transcripción revisada: nombres como los da Raquel, cifras exactas, tildes, ¿ ¡.
- El CTA dice exactamente la palabra pedida.

## 5. Informe de entrega
Tabla corta: qué hay en cada momento + medidas técnicas + lo que Raquel debe confirmar.
Distingue: **comprobado** (medido/visto), **experimental** (funciona aquí, falta verlo en su equipo)
y **no disponible**.
