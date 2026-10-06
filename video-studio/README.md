# Estudio de video · RM Marketing IA

Tu editor de video: **Remotion** (motion graphics, subtítulos animados, plantillas con tu marca),
**FFmpeg** (cortes, audio, formatos, música) y **Whisper** (transcripción automática en español,
funciona en local, sin pagar API).

## Cómo trabajar con Claude

1. Copia tu video crudo en `video-studio/input/` (o súbelo a la conversación).
2. Pide lo que quieras con palabras normales, por ejemplo:
   - "Edita `input/tip-1.mp4` como reel, gancho: *3 errores al vender tu casa*, CTA: *Escríbeme VENDER*"
   - "Quítale los silencios y ponle música de fondo"
   - "Haz un video de la propiedad con estas 6 fotos, precio $120.000, 3 habitaciones"
   - "Sácame la versión cuadrada para el feed y una portada"
3. Claude te entrega el video terminado en `video-studio/out/`.

## Qué incluye

| Herramienta | Para qué |
|---|---|
| `npm run reel -- <video> --hook "..." --cta "..."` | Video crudo → reel terminado: vertical, audio limpio, sin silencios, subtítulos animados, gancho y cierre |
| Plantilla **Reel** | Tu video + gancho + subtítulos palabra por palabra (resaltado dorado) + barra de progreso + cierre con CTA |
| Plantilla **PropertyPromo** | Video de propiedad solo con fotos: zoom suave, transiciones, ficha con precio y características, cierre con contacto |
| Plantilla **Thumbnail** | Portada vertical con cifra destacada |
| `npm run transcribe -- <video>` | Subtítulos `.json` (para Remotion) y `.srt` (para YouTube/Meta) |
| `npm run ff -- <comando>` | Kit FFmpeg: `cortar`, `vertical`, `cuadrado`, `horizontal`, `audio`, `musica`, `silencios`, `unir`, `transicion`, `velocidad`, `subtitulos`, `logo`, `foto`, `gif`, `comprimir`, `extraer-audio`, `fotos-a-video`. Ejecuta `npm run ff` para ver la ayuda |

Todo usa tu identidad: morado `#7B6FE8`, dorado `#C9943A`, tipografías Syne y DM Sans.

## Usarlo en tu computadora

Necesitas [Node.js](https://nodejs.org) 18 o superior y FFmpeg (`brew install ffmpeg` en Mac).

```bash
cd video-studio
bash scripts/setup.sh   # una sola vez
npm run dev             # abre Remotion Studio en el navegador para ver y ajustar las plantillas
```

## Licencia de Remotion

Remotion es gratis para personas y empresas de hasta 3 personas. Si RM Marketing IA crece
por encima de eso, revisa la [licencia de empresa](https://www.remotion.pro/license).
