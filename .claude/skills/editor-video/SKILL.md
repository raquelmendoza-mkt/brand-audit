---
name: editor-video
description: Editor de video profesional de RM Marketing IA con Remotion + FFmpeg + Whisper, en video-studio/. Úsalo cuando Raquel pida editar, cortar, subtitular, montar, renderizar o exportar un video; hacer un reel, TikTok, short o story; quitar silencios (jump cuts); añadir música, logo, gancho o CTA; hacer un video de propiedad con fotos; transcribir; cambiar formato (vertical, cuadrado, horizontal); comprimir; o hacer una portada.
---

# Editor de video (video-studio/)

Trabaja siempre dentro de `video-studio/`. Responde en español.

## 0. Preparación (cada sesión nueva)

`bash video-studio/scripts/setup.sh` — instala dependencias y el modelo de Whisper solo si faltan.
En la nube de Claude Code, `remotion.config.ts` usa el Chromium headless preinstalado; no intentes
descargar el de Remotion (remotion.media está bloqueado). Hugging Face también está bloqueado: el
modelo de Whisper sale del paquete npm `sts-whisper-small` (solo pesos ONNX).

## 1. Material

Los videos crudos van en `video-studio/input/` (ignorado por git). Si Raquel los sube a la
conversación, cópialos ahí. Inspecciona siempre primero: `npm run ff -- info input/video.mp4`.

## 2. Elige la herramienta

- **Reel hablado a cámara (lo más común)** → `npm run reel -- input/x.mp4 --hook "..." --cta "..." [--sub "..."] [--handle @...] [--hook-top 780] [--musica input/m.mp3] [--sin-cortes] [--sin-cierre] [--sin-progreso] [--out out/x.mp4]`.
  Hace: vertical 1080x1920 → audio limpio -14 LUFS → jump cuts → Whisper → render Remotion `Reel`.
  Si Raquel no da gancho/CTA, propón uno con la metodología de la skill `remi-ai` (Método CLAVE, hooks) o pregúntale.
- **Propiedad con fotos** → composición `PropertyPromo`: copia las fotos a `public/work/<nombre>/` y
  `npx remotion render PropertyPromo out/x.mp4 --props='{"photos":["work/<nombre>/1.jpg",...],"secondsPerPhoto":3.5,"title":"...","location":"...","price":"...","features":["3 hab","2 baños"],"agent":"...","phone":"..."}'`
- **Portada** → `npx remotion still Thumbnail out/portada.png --props='{"photo":"...","title":"...","highlight":"..."}'`
  (la foto puede salir de `npm run ff -- foto input/x.mp4 00:00:03 public/work/<n>/frame.jpg`).
- **Operaciones sueltas** → `npm run ff -- <comando>` (`npm run ff` lista todos): cortar, vertical
  (`desenfoque` para horizontales sin recortar), cuadrado, horizontal, audio, musica (ducking),
  silencios, unir, transicion, velocidad, subtitulos (SRT quemado), logo, foto, gif, comprimir,
  extraer-audio, fotos-a-video.
- **Algo nuevo (motion graphics, intro, animación de datos, otra plantilla)** → crea una composición
  nueva en `video-studio/src/` y regístrala en `src/Root.tsx`. Antes, carga la skill
  `remotion-best-practices` y sigue sus reglas (animar solo con `useCurrentFrame`/`interpolate`,
  nunca CSS transitions; `premountFor={fps}`; `<Video>` de `@remotion/media`). Usa los tokens y
  fuentes de `src/brand.ts`. Texto: mínimo 84px titulares y 44px apoyo en 1080 de ancho, 80px de
  margen lateral; Syne es muy ancha, comprueba que nada se salga.

## 3. Revisa antes de entregar (obligatorio)

1. Corrige la transcripción: abre `public/work/<n>/captions.json`, arregla palabras mal oídas
   (nombres, marcas, cifras) manteniendo los tiempos y el espacio inicial de cada `text`, y vuelve a
   renderizar con `npx remotion render Reel ... --props=...` (los props están en el log de `reel.mjs`).
2. Mira fotogramas: `npx remotion still <Comp> out/check.png --frame=N --scale=0.33` o
   `ffmpeg -i out/x.mp4 -vf "select='eq(n\,30)+eq(n\,150)',scale=360:-1,tile=2x1" -frames:v 1 check.png`
   y léelos con Read. Busca texto cortado, gancho tapando la cara (ajusta `--hook-top`), subtítulos ilegibles.
3. `npm run ff -- info out/x.mp4`: 1080x1920, 30 fps, h264/aac, cerca de -14 LUFS.

## 4. Entrega

Envía el video con SendUserFile. Los archivos de `out/` y `input/` no se suben a git (son pesados);
solo se hace commit de plantillas y scripts nuevos.
