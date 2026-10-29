# Manual del Editor de Video con IA (Claude) — RM Marketing IA

Este manual explica, sin términos técnicos, cómo pedirle videos a Claude y qué recibes.
Última actualización: 29 de octubre de 2026.

---

## 1. Dónde está todo

| Qué | Dónde |
|---|---|
| El estudio de edición (donde trabaja Claude, en la nube) | repositorio `brand-audit`, carpeta `video-studio/` |
| Tu copia en la Mac | `~/Documents/brand-audit` |
| Tus proyectos de CapCut | `~/Movies/CapCut/User Data/Projects/com.lveditor.draft` |
| Videos terminados para descargar | carpeta `entregas/` del repositorio (te llega el enlace) |

## 2. Cómo pedir un video

Escribe en una frase qué quieres. Ejemplos que funcionan:

- "Edita este video como **reel inmobiliario viral de 35 segundos**, con subtítulos, música y
  efectos, y **entrégamelo editable en CapCut**."
- "Haz un **anuncio para Meta Ads** de 20 s con 3 ganchos distintos para probar."
- "Reel de **marca personal**: quita los silencios, subtítulos tipo caja, cierre con *Comenta MÉTODO*."
- "**Room tour de lujo** con estas fotos, sin música, minimalista."

Conviene decir: duración, estilo, gancho (o pide que te proponga), palabra del CTA, si va con
música, y si lo quieres también en CapCut. Si no lo dices, Claude usa tus preferencias
(Poppins + Helvetica, calidad máxima, voz limpia, sin silencios, música movida por debajo de la voz).

Sube los clips a la carpeta compartida de Google Drive (o al chat si pesan poco) y avisa.

## 3. Qué recibes

1. **El video terminado** (MP4 1080x1920, 30 fps, volumen estándar de redes −14 LUFS).
2. **El proyecto de CapCut** (si lo pides) y la instrucción de una línea para abrirlo.
3. Los **subtítulos** (archivo SRT) y un pequeño **informe** con medidas y lo que debes confirmar.

Claude revisa fotogramas, sonido y medidas **antes** de entregar. Si algo no se pudo comprobar,
te lo dice.

## 4. CapCut: dos formas de recibir tu proyecto

| | **Por capas** (nuevo) | **Nativo** |
|---|---|---|
| Cómo se ve | **Idéntico** a la versión de Remotion (íconos, fuentes, texto detrás de la persona) | Parecido, con animaciones propias de CapCut |
| Qué puedes editar | Recortar o borrar tomas, volumen de voz/música/efectos por separado, quitar los subtítulos y poner los de CapCut, agregar cosas encima | **Todo**: cada texto, subtítulo, transición y efecto de CapCut |
| Qué NO puedes editar | El diseño de los títulos por dentro (vienen como una capa transparente) | — |
| Ojo | Si mueves un corte, los títulos no se mueven solos | — |

**Para abrir un proyecto en tu Mac:**
1. Cierra CapCut por completo (Cmd + Q).
2. Abre **Terminal** y pega el comando que te manda Claude (descarga y lo pone en tu carpeta de CapCut).
3. Abre CapCut: el proyecto aparece en la lista. Ábrelo, revisa y exporta.

Claude nunca modifica tus proyectos existentes: siempre crea uno nuevo con otro nombre.

Si actualizas CapCut a una versión nueva y un proyecto no abre, Claude te pedirá una **semilla**
nueva (un proyecto vacío creado por tu CapCut, se hace en 1 minuto).

## 5. Herramientas instaladas

**Ya estaban antes de este paquete** (se conservan igual): Remotion 4.0.533 (diseño y animación),
FFmpeg 6.1.1 (cortes, color, audio), Whisper small en JavaScript (transcripción), DeepFilterNet 0.5.6
(limpieza de voz con IA), MediaPipe 1.1.0 (recortar a la persona), pyCapCut 0.0.4 (proyectos de
CapCut), biblioteca de efectos de sonido, emojis 3D y 18 familias de fuentes.

**Nuevas (29 oct. 2026)**, en un entorno aislado `video-studio/.venv-ia` que no toca el resto del equipo:

| Herramienta | Versión | Para qué |
|---|---|---|
| faster-whisper + Whisper large-v3-turbo | 1.2.1 | Transcripción mucho más precisa en español (22 s de video en 12 s) con detección de voz Silero |
| PySceneDetect | 0.7.2 | Detecta cambios de escena en clips largos |
| OpenCV | 5.0 | Análisis de imagen |
| librosa + soundfile | 1.0.0 / 0.14.0 | Análisis de música y ritmo |
| Fuentes Fontshare | — | Clash Display, Satoshi, General Sans, Cabinet Grotesk (licencia gratuita para video y publicidad; no se pueden compartir los archivos, por eso cada equipo las descarga) |
| Fraunces (Google) | — | Serif editorial cálida |

**Evaluadas y NO instaladas** (por qué):
- MoviePy: hace lo mismo que FFmpeg + Remotion, más lento.
- WhisperX: necesita PyTorch (varios GB); faster-whisper ya da los tiempos palabra por palabra.
- Demucs (separar voz de música), SAM2 y Robust Video Matting (recorte avanzado): necesitan PyTorch y
  tarjeta gráfica; en la nube no hay. MediaPipe ya recorta a la persona. Se pueden probar luego en
  tu Mac si tiene chip M (pídelo).
- GSAP / Motion: Remotion ya anima todo con sus propias herramientas; Lottie ya está instalado.

## 6. Conectores (MCP) de CapCut evaluados

| Conector | Resultado |
|---|---|
| **Nuestro constructor** (`capcut/rm_capcut.py`, pyCapCut) | **Elegido.** Probado y funcionando en tu CapCut 9.5 |
| JmsLdrn/capcut-mcp | El mejor de los externos para **editar proyectos que ya existen** (hace copias de seguridad). No probado en CapCut 9.x. Opcional en tu Mac, después de una prueba |
| sun-guannan/VectCutAPI | El más completo y popular, pero duplica lo que ya hacemos y no declara compatibilidad con Mac |
| drhema/mcp-cut | Probado solo con CapCut 8.5; sin efectos ni transiciones |
| MadeByAdi/capcut-mcp-full | No declara licencia; probado con CapCut 8.3 |

Ninguno es oficial: CapCut no tiene API pública. No se instaló ninguno duplicado.

## 7. Skills (especialidades de Claude)

| Skill | Cuándo se usa |
|---|---|
| `editor-video` | Base de todo: herramientas, recetas, preferencias tuyas |
| `reels-virales` | Reels que enganchen: ganchos, ritmo rápido, re-ganchos |
| `inmobiliario-premium` | Propiedades, room tours, lujo, casas comerciales |
| `marca-personal` | Tu marca o la de clientes: educativo, testimonios, cursos |
| `publicidad-meta-ads` | Anuncios de 15-30 s, variantes A/B, formatos |
| `capcut-project-builder` | Pasar cualquier edición a CapCut (por capas o nativo) |
| `control-calidad-audiovisual` | Revisión obligatoria antes de cada entrega |

Estilos visuales disponibles: lujo, editorial, moda, arquitectura, dinámico (el tuyo), impacto,
moderno, **agencia**, **anuncio** y **boutique** (estos 3 con las fuentes nuevas).

## 8. Pruebas realizadas (29 oct. 2026)

| Prueba | Resultado |
|---|---|
| Proyecto nativo de CapCut (El Viñedo 27 s) | **Comprobado** en tu CapCut 9.5: abrió con todo enlazado |
| Proyecto **por capas** (El Viñedo 27 s) | **Comprobado aquí**: las capas juntas son idénticas al video de Remotion. **Falta que lo abras** en tu CapCut para confirmar la transparencia |
| Flujo automático (2 clips, 40 s crudos) | **Comprobado**: reel de 33 s, voz limpia, sin silencios, subtítulos, música, −14 LUFS, proyecto de CapCut, en 6,5 minutos |
| Fuentes nuevas | **Comprobado**: se ven en la lámina de tipografías |

## 9. Límites (para que no haya sorpresas)

- Lo diseñado en Remotion llega a CapCut **como capa**: se ve igual, pero no se edita por dentro.
- Si el video crudo dura mucho más de lo pedido, Claude te avisa y propone qué frases quitar (no
  corta tu contenido a ciegas).
- Créditos de Higgsfield (animar fotos con IA): siempre se piden antes de gastarlos.
- Claude trabaja en la nube: no ve tu Mac directamente. Para ver qué tienes instalado, ejecuta la
  auditoría (sección 10) y comparte el resultado.

## 10. Revisar tu Mac (opcional, no cambia nada)

En Terminal:
```
cd ~/Documents/brand-audit && git pull && cd video-studio && bash scripts/auditoria_mac.sh > ~/Desktop/auditoria-mac.txt
```
Sube `auditoria-mac.txt` al chat. Con eso Claude sabe qué conviene instalar en tu Mac.

## 11. Recomendaciones

1. Abre la prueba por capas en CapCut y confirma que los títulos se ven sobre el video (transparencia).
2. Para la mayoría de reels pide el **flujo automático**; para piezas especiales, edición fina en Remotion.
3. Si quieres editar proyectos viejos de CapCut con IA, el siguiente paso sería probar
   JmsLdrn/capcut-mcp en tu Mac con una copia de seguridad.
