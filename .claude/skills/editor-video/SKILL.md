---
name: editor-video
description: Editor de video profesional de RM Marketing IA con Remotion + FFmpeg + Whisper + DeepFilterNet + MediaPipe + Higgsfield + conector con CapCut, en video-studio/. Úsalo cuando Raquel pida editar, cortar, subtitular, montar, renderizar o exportar un video; hacer un reel, TikTok, short o story; room tour o video de propiedad; quitar silencios (jump cuts); limpiar el audio; poner texto detrás de la persona; añadir música, efectos de sonido, logo, gancho o CTA; animar fotos con IA; pasar una edición a CapCut o crear un proyecto de CapCut; transcribir; etalonar color; cambiar formato; comprimir o entregar archivos pesados; o hacer una portada.
---

# Editor de video profesional (video-studio/)

Trabaja dentro de `video-studio/` y responde siempre en español. Actúa como editor senior: decide
con criterio, revisa fotogramas antes de entregar y explica en pocas líneas qué hiciste.

Archivos de esta skill (léelos cuando apliquen):
- `estilos.md` — fichas de estilo (lujo, dinámico, impacto, editorial...): fuentes, colores, ritmo,
  transiciones, sonido y tamaños. **Elige una antes de diseñar cualquier video.**
- `kit.md` — componentes de `src/kit/Kit.tsx` (revelados de texto, rótulos, contador, botón CTA,
  grano, viñeta, destellos, movimientos de cámara, zonas seguras) y efectos de sonido disponibles.
- `flujos.md` — recetas probadas: voz limpia + jump cuts por detección de voz, texto detrás de la
  persona, sincronía labios-voz, room tour con Higgsfield Omni, Drive, entregas pesadas.
- `checklist.md` — control de calidad obligatorio antes de entregar.
- `capcut.md` — conector con CapCut: convierte una edición en un PROYECTO DE CAPCUT editable
  (pista por pista, o por capas idénticas a Remotion) que Raquel abre en su CapCut de Mac.

Skills especializadas (usan esta como base): `reels-virales`, `inmobiliario-premium`,
`marca-personal`, `publicidad-meta-ads`, `capcut-project-builder`, `control-calidad-audiovisual`.
Manual para Raquel: `video-studio/MANUAL_EDITOR_IA_CLAUDE.md`.

## 0. Preparación (cada sesión nueva)

`bash video-studio/scripts/setup.sh` — instala lo que falte: dependencias, Whisper, efectos de sonido,
MediaPipe (recorte y caras), DeepFilterNet (limpieza de voz), Chrome reciente (transiciones con
shader), emojis 3D, la biblioteca de fuentes (Google + Fontshare) y el entorno `.venv-ia`
(faster-whisper large-v3-turbo, PySceneDetect, OpenCV, librosa, pyCapCut).
Entorno en la nube: `remotion.config.ts` usa el Chromium preinstalado; Hugging Face y remotion.media
pueden estar bloqueados (Whisper sale del paquete npm `sts-whisper-small`). Renders de prueba: no más
de 3 `remotion still` en paralelo (más agotan la memoria).

## 1. Lo que Raquel prefiere (no lo vuelvas a preguntar)

- **Fuentes por defecto: Poppins (títulos) + Helvetica (apoyo)** salvo que pida otra cosa o el estilo
  sea de lujo/minimalista (ver `estilos.md`). Biblioteca completa en `src/fonts.ts` (`FUENTES`, `PARES`).
- **Calidad máxima**: no comprimas los originales; entrega en 1080x1920. Si pesa más de 30 MB, súbelo
  a `entregas/` del repo y comparte el enlace raw de GitHub (ver `flujos.md`), más una vista previa
  liviana por el chat.
- **La voz siempre pegada a su toma**: nada de voz en off encima de otra imagen salvo que lo pida;
  medir la sincronía si hay dudas.
- **Sin silencios**: deja solo el guión; quita pausas, cuentas regresivas y la voz de quien graba.
- **Audio limpio**: pasa toda voz por DeepFilterNet (`acabado.sh limpiar-voz` o `vinedo_base.py`).
- **Texto clave detrás de la persona** (cifras, nombre del lugar, palabra del CTA) en reels hablados.
- **Música**: movida (afro house / electro) y siempre por debajo de la voz con ducking; en estilos de
  lujo pregunta o usa solo efectos de sonido. Créditos de Higgsfield: **pregunta antes de gastarlos**
  y di el costo (Omni Flash 1.1 ≈ 3 créditos/s a 720p).
- CTA típico: "Comenta la palabra X". Nombres: escríbelos como ella los da (p. ej. "Stefany").

## 2. Elige la herramienta

- **Pedido completo en una frase** ("edita este video como reel inmobiliario de 35 s, con
  subtítulos, música y entrégamelo en CapCut") → `.venv-ia/bin/python scripts/flujo_auto.py
  input/a.mov [input/b.mov] --nombre X --estilo viral|inmobiliario|marca|anuncio --gancho "..."
  --cta "..." --dur 35 [--corregir "Stephanie=Stefany"]`: analiza, limpia la voz, transcribe,
  quita silencios, monta, renderiza, crea el proyecto de CapCut y mide la calidad
  (`out/entregas/X/informe.md`). Revisa los fotogramas `revisar-*.jpg` y la transcripción antes de entregar.
- **Reel hablado a cámara** → `npm run reel -- input/x.mp4 --hook "..." --cta "..." [...]` (rápido) o,
  para un trabajo fino guiado por guión, la receta "voz limpia + piezas" de `flujos.md` (Viñedo).
  Si no hay gancho/CTA, propón uno con la skill `remi-ai` (Método CLAVE, hooks) o pregunta.
- **Room tour / propiedad con fotos** → fotos interiores (descarta barrio, vistas y fachada si lo pide),
  anímalas con Higgsfield Omni (`flujos.md`) o con `camara()` del kit; composición nueva por proyecto
  basada en `src/Felipe.tsx` (lujo) o `src/RoomTour.tsx`; `PropertyPromo` para algo simple.
- **Video ya montado + textos por segmento + cierre de marca** → `PromoTextos`.
- **Motion graphics nuevos** → composición nueva en `src/` registrada en `src/Root.tsx`, usando el kit
  (`src/kit/Kit.tsx`) y una ficha de `estilos.md`. Antes carga `remotion-best-practices`.
- **Íconos, transiciones, subtítulos karaoke, texto cinético, notificaciones, trazos a mano** → kit
  (`src/kit/`: `Kit.tsx`, `Iconos.tsx`, `Transiciones.tsx`, `Efectos.tsx`); ver `kit.md`.
- **Cortar / animar al ritmo de la música** → `python3 -I scripts/beats.py musica.wav beats.json`
  (BPM, beats, compases y golpes fuertes) y usa esos tiempos para cortes, golpes de zoom y títulos.
- **Video horizontal → vertical siguiendo a la persona** → `python3 scripts/reencuadre.py in.mp4 out.mp4`.
- **Acabado** → `bash scripts/acabado.sh` (sin argumentos lista todo): `color <lujo|limpio|calido|cine|vivo|noche>`,
  `escalar` (720p de IA → 1080 nítido), `estabilizar`, `lenta` (cámara lenta interpolada), `grano`,
  `rampa` (speed ramp), `limpiar-voz`, `normalizar` (-14 LUFS, 2 pasadas), `entregar` (tamaño justo + preview), `revisar`.
- **Proyecto editable en CapCut** (Raquel quiere retocar ella, o el cliente edita en CapCut) →
  skill `capcut-project-builder`. **Por capas** (se ve idéntico a Remotion: fondo + gráficos
  transparentes + audio por pistas) con `capcut/capas_vinedo.py` como plantilla, o **nativo**
  con `python3 capcut/rm_capcut.py construir plan.json --semilla input/capcut/semilla.zip`
  (ejemplo `capcut/desde_vinedo.py`). Lo de Remotion no se edita por dentro en CapCut: avísalo.
- **Operaciones sueltas** → `npm run ff -- <comando>` (cortar, vertical, unir, subtítulos SRT, logo, gif...).
- **Música original** (libre de derechos): `scripts/electro.py` (electro/afro house rápido, `--drops`
  en los segundos clave), `scripts/afrohouse.py` (`--estilo afro|elegante`), `scripts/musica.py`.
  Mezcla con ducking: ver `flujos.md`.
- **Portada** → `npx remotion still Thumbnail out/portada.png --props='{...}'`.
- **Muestras para elegir estilo con Raquel** → stills `Tipografias` e `Iconos`, composiciones
  `KitDemo` y `EfectosDemo` (carpeta Kit) y `PruebaTransicion` para cualquier transición.

## 3. Revisa antes de entregar

Sigue `checklist.md`. Mínimo: fotogramas clave vistos con Read (texto cortado, caras tapadas, zonas
seguras), transcripción corregida, sincronía, volumen -14 LUFS (-16 si solo hay efectos), 1080x1920 30 fps.

## 4. Entrega

Envía con SendUserFile si pesa menos de 30 MB; si no, `entregas/` + enlace raw de GitHub + preview.
`input/`, `out/` y `public/work/` no van a git; sí plantillas, scripts y las entregas que Raquel pida.
Resume la entrega en una tabla corta (qué hay en cada momento) y señala lo que debe confirmar ella.
