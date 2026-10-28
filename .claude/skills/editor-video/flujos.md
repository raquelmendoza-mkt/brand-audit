# Recetas probadas

## A. Material desde Google Drive
1. Lista la carpeta con el MCP de Drive: `search_files` con `parentId = '<id>'` (pagina con
   `pageToken`; las subcarpetas también hay que listarlas). Lee guiones de Docs con `read_file_content`.
2. Descarga cada archivo a `input/<proyecto>/` con
   `curl -sSL -o x "https://drive.usercontent.google.com/download?id=<ID>&export=download&confirm=t"`.
   Si `file x` dice "HTML", la carpeta no está compartida: pide a Raquel "Compartir → Cualquier
   persona con el enlace (Lector)". No uses `download_file_content` para videos (va en base64 al contexto).
3. Haz proxies 1080x1920/30 fps para analizar y una hoja de contactos de cada clip
   (`acabado.sh revisar` o `fps=8/dur,tile=8x1`) y míralas con Read antes de decidir el montaje.

## B. Reel guiado por guión: voz limpia + piezas sin silencios (`scripts/vinedo_base.py`)
Copia `vinedo_base.py` a `scripts/<proyecto>_base.py` y edita `TOMAS`:
`(clave, archivo, [(entrada, salida), ...], [tramos a silenciar])`.
1. **Limpia primero** (lo hace el script): highpass 100 → DeepFilterNet `-D -a 40` (sin retardo) →
   EQ (-2.5 dB @280 Hz, +2.5 dB @3.5 kHz) → compresor → cada clip nivelado a -16 LUFS.
   Las tomas grabadas con el micrófono del iPhone a distancia (2 pistas de audio estéreo + espacial)
   son las que más ruido traen; las de micrófono de solapa son mono.
2. **Detecta la voz** sobre el audio limpio: `ffmpeg -i voz.wav -af silencedetect=n=-42dB:d=0.15 -f null -`.
   Corta pausas > 0.28 s dejando 0.07 s antes y 0.10 s después de cada tramo de voz. Fuera: cuentas
   regresivas, "¿listo?", voz de quien graba (si cae dentro de una toma útil, súmala a "silenciar").
3. **Transcribe el audio limpio** (`node scripts/transcribe.mjs voz.wav salida --lang es`): las
   palabras salen mucho mejor (p. ej. "El Viñedo" en vez de "el dinero"). Whisper puede inventar
   texto en tramos cortos o con ruido: confirma con la detección de voz.
4. El script recorta video y audio con la MISMA entrada y la MISMA duración en fotogramas, así no
   hay deriva. Escribe `public/work/<p>/marcas.json`; cópialo a `src/<p>-marcas.json` y en Remotion
   coloca todo con `at('toma', segundoDelClipOriginal)` (ver `src/Vinedo.tsx`).
5. Jump cuts dentro de una misma toma: zoom alterno 1.0 / 1.1 (`zoomPieza`) + golpe de zoom.

## C. Texto detrás de la persona
`python3 scripts/recorte_persona.py public/work/<p>/base.mp4 <ini> <fin> public/work/<p>/persona-<n>`
(MediaPipe multiclase, webp con transparencia por fotograma). Imprime dónde está la parte alta de
la cabeza: coloca el titular para que su línea base quede ~100 px por debajo de esa altura (tapa
parte del texto sin ocultar la palabra). Capas: video → titular → recorte (mismo `scale`/`transformOrigin`
que el video) → resto. No pongas tomas de apoyo (B-roll) encima de un tramo con recorte activo.
Fondo blanco → titular en azul/negro; fondo oscuro o fachada → blanco con sombra.

## D. Sincronía labios-voz
- `python3 scripts/sincronia.py <video> <ini> <dur> --crop x,y,w,h` (zona de la cara en 1080x1920)
  mide el desfase con MediaPipe Face Landmarker. Compara el clip original con la base: deben dar el
  mismo valor (el método es ruidoso en absoluto; importa la consistencia).
- Render vs base: correlación directa del audio (8 kHz) en varios puntos → debe dar 0 ms.
- Si Raquel dice que "no se ve sincronizado", revisa además: voz en off sobre otra toma, tramos donde
  la persona mueve la boca pero se oye a otra persona, y pausas largas con la cara en pantalla.

## E. Room tour con Higgsfield (Google Omni)
1. **Pide permiso con el costo exacto**: `generate_video` con `get_cost: true`. Omni Flash 1.1
   (`gemini_omni_flash_1_1`, `mode: image-to-video`, `medias:[{role:'start_image'}]`, `aspect_ratio: '9:16'`,
   `resolution: '720p'`, `duration` 3-10) ≈ 9 créditos por clip de 3 s. Revisa `balance`.
2. Importa cada foto con `media_import_url` usando la URL de descarga de Drive (la subida directa a
   upload.higgsfield.ai puede estar bloqueada).
3. Envía en lote (`generate_video_batch`). Si responde que recomendó un preset, reenvía con
   `declined_preset_id`; si da 429, reenvía ese índice cuando terminen los demás. Espera con `jobs_wait`.
4. Prompt base (inglés): "Real estate room tour. Smooth steady gimbal shot [walking slowly forward /
   slow lateral slide / gentle push in] in this [ambiente + 3 detalles visibles]. Keep the architecture,
   walls, furniture and finishes exactly as in the photo. No people, no new objects, no text.
   Realistic, cinematic, stable camera."
5. Descarga los MP4 de cloudfront a `public/work/<p>/omni/`, `acabado.sh escalar` y el mismo `color`
   para todos. Mira una hoja de contactos de cada clip (deformaciones, objetos inventados).
6. Fotos sin IA: `camara()` del kit (acercar / derecha / alejar), 1.6-2.5 s cada una.

## F. Música y mezcla
- Generar: `python3 -I scripts/electro.py out.wav <seg> --bpm 126 --drops 1.7 31.5` (drops = subida +
  impacto en momentos clave: revelación, renders de IA, precio, CTA).
- Mezcla con ducking bajo la voz (≈13 dB):
  `[0:a]asplit=2[v][sc];[1:a]volume=0.26,volume='if(between(t,A,B),1.8,1)':eval=frame[m];[m][sc]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=350[md];[v][md]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.2:LRA=11`
  (el `volume=if(...)` sube la música en tramos sin voz, p. ej. dron o renders de IA).
- Solo efectos (sin música): normaliza a -16 LUFS con pico -1.5 dB (`volume` + `alimiter`).

## G. Entrega de archivos pesados
- < 30 MB: SendUserFile directo.
- Mayor: `bash scripts/acabado.sh entregar out/x.mp4 out/X-final.mp4 95` (≤ 95 MB, límite de GitHub
  100 MB) → copia a `entregas/` en la raíz del repo → commit + push a la rama de trabajo → comprueba
  `curl -sIL https://github.com/raquelmendoza-mkt/brand-audit/raw/<rama>/entregas/<archivo>` (200 y
  mismo tamaño) → comparte ese enlace + la `-preview.mp4` por el chat.
- El repo es público: no subas material de clientes que Raquel no quiera publicar; si dudas, pregunta.

## H. Montaje al ritmo (beat sync)
1. `python3 -I scripts/beats.py public/work/<p>/musica.wav public/work/<p>/beats.json` → BPM, `beats`,
   `compases` (cada 4) y `fuertes` (golpes marcados). Si conoces el BPM, pásalo con `--bpm`.
2. Cortes de B-roll en `compases` (ritmo lento/lujo) o en `beats` (dinámico); golpes de zoom,
   `Flash` y títulos en `fuertes`; el CTA en el último compás fuerte.
3. Con `electro.py` ya sabes dónde caen los drops (`--drops`): haz coincidir ahí el momento clave.

## I. Material horizontal para reels
`python3 scripts/reencuadre.py input/x.mp4 public/work/<p>/x-vertical.mp4` sigue a la persona
(segmentación MediaPipe, suavizado tipo operador de cámara). Para paisajes o fotos horizontales sin
persona usa `npm run ff -- vertical` con `desenfoque` o `camara('derecha')` del kit.

## J. Rampas de velocidad
`bash scripts/acabado.sh rampa in.mp4 out.mp4 "0-1.2:1,1.2-2.4:0.35,2.4-4:2.2"` (sin audio): ideal en
B-roll de room tour (entra rápido, se frena en el detalle bonito, sale rápido) con un `aire` en cada cambio.
