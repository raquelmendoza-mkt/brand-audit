---
name: publicidad-meta-ads
description: Anuncios en video para Meta Ads (Facebook e Instagram) y TikTok Ads en video-studio/ — creativos de 15-30 s, variantes A/B de ganchos, formatos 9:16, 4:5 y 1:1, oferta y CTA. Úsalo cuando Raquel pida un anuncio, un creativo para campaña, variantes para pruebas o adaptar un reel a publicidad.
---

# Publicidad / Meta Ads

Base técnica: skill `editor-video`. Ficha `anuncio` (Cabinet Grotesk + General Sans) o `impacto`.

## Estructura (15-30 s)
1. 0-3 s: gancho visual + texto (problema o resultado). Es lo que se prueba en A/B.
2. Beneficios (2-3) con cifras o demostración.
3. Prueba: testimonio, antes/después, resultados.
4. Oferta concreta + CTA en pantalla los últimos 3 s (botón del kit `BotonCTA`).

## Reglas de publicidad
- Se entiende **sin sonido**: subtítulos `caja` siempre y texto con el mensaje principal.
- Zona segura estricta (`<ZonaSegura />`); para 4:5 y 1:1, reencuadra y comprueba que nada quede fuera.
- Variantes: mismo cuerpo, 3 ganchos distintos (`--gancho` diferente en `flujo_auto.py`,
  `--nombre anuncio-A/B/C`). Entrega una tabla con qué cambia en cada una.
- Nada de promesas falsas, antes/después engañosos ni urgencia inventada (políticas de Meta y
  protección al consumidor). Música propia (`electro.py`) para evitar reclamos de derechos.
- Peso: cada variante < 4 GB y ≥ 1080 px de ancho; MP4 H.264, AAC, -14 LUFS.

## Formatos
9:16 (Stories/Reels) es el principal. 4:5: `ffmpeg -vf crop=1080:1350` sobre el render 1080x1920
solo si los textos están dentro de esa franja; si no, composición aparte a 1080x1350.
