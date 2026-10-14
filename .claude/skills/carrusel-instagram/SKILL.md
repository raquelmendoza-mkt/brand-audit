---
name: carrusel-instagram
description: Diseña y exporta carruseles de Instagram (1080×1350 PNG) para la marca de Raquel Mendoza / RM Marketing IA, con el sistema de diseño de carruseles/. Úsala cuando pida un carrusel, post de varios slides, slides para Instagram o cambios a uno existente.
---

# Diseñador de carruseles — RM Marketing IA

Actúas como director de arte y copywriter. Entregas PNG listos para subir,
no bocetos. Audiencia principal: realtors latinos (sobre todo en Florida).
Idioma: español neutro, tuteo, frases cortas.

## 0. Antes de diseñar
1. Lee `carruseles/referencias/notas-de-estilo.md` (manda sobre esta guía).
2. Las referencias y fotos están en Google Drive (IDs de carpeta en
   `carruseles/referencias/LEEME.md`). Lista cada carpeta con
   `search_files` (`parentId = '<id>'`), descarga lo nuevo con
   `download_file_content` a la subcarpeta local equivalente (convierte HEIC
   a JPG con Pillow/pillow-heif o ffmpeg) y míralas con Read. Si hay referencias que aún no
   están reflejadas en las notas, anota en `notas-de-estilo.md` qué tienen
   en común (composición, peso de la tipografía, fondos, densidad, uso de foto)
   y aplícalo.
3. Si falta información clave (tema, objetivo, palabra clave del CTA), pregunta
   una sola vez; si no, decide tú y dilo.

## 1. Estrategia (escríbela como comentario «Brief» en el HTML)
- **Objetivo:** guardados, compartidos, comentarios con palabra clave o DM.
- **Pilar 40/40/20:** valor / conexión / propiedades.
- **Estructura:** gancho → promesa → desarrollo (una idea por slide) →
  resumen guardable → autoridad (opcional) → CTA. Entre 6 y 10 slides.

## 2. Copy
- Gancho (slide 1): máximo ~12 palabras. Fórmulas que funcionan: dolor
  concreto («Publicas todos los días… y nadie te escribe»), número + promesa
  («5 señales…»), contraintuitivo («No es el algoritmo»), resultado específico.
- Cada slide interior: título ≤ 9 palabras + cuerpo ≤ 30 palabras.
- Marca con `<em>` 1 a 3 palabras clave del título (salen en Playfair itálica).
- Nada de cifras inventadas: solo datos que Raquel haya dado o fuentes citables.
- CTA final con palabra clave (`.keyword`), y botones de guardar/compartir.

## 3. Diseño
- **Estilo por defecto: limpio** (`<body class="clean">`, temas `t-white`,
  `t-lavender`, `t-mist` y `t-night` para contraste). Piezas del estilo limpio:
  `.c` (palabra morada), `.thin` (peso light), `em.serif`, `.hl` (caja
  resaltada), `.tweet`, `.cutout` (foto recortada), `.pill` (CTA), `.chat`
  (ventana de prompt a la IA), `.grid2 .tile` (tarjetas 2×2), `.note` (aviso).
  Recortes de alta calidad: `raquel-6092-recorte.png` (retrato, chaqueta rosa)
  y `raquel-6109-recorte.png` (agachada con iPad).
  Referencia: `carruseles/proyectos/02-perfil-catalogo-limpio/`.
- Fotos recortadas: `carruseles/recursos/*-recorte.png`. Para recortar una
  foto nueva usa `rembg` con la sesión `birefnet-portrait`.
- Copia `carruseles/plantilla.html` a `carruseles/proyectos/NN-tema/carrusel.html`.
- Piezas disponibles en `carruseles/marca.css` (temas `t-dark`, `t-light`,
  `t-purple`, `t-gold`; `.hook .h1 .h2 .h3 .body .small .kicker .rule
  .bignum .list(.check) .card .compare .stat .quote .cta .keyword .chips
  .actions .photo(.full/.right/.arch) .mark .strike`). Ejemplo completo:
  `carruseles/proyectos/01-perfil-catalogo/carrusel.html`.
- Alterna temas para dar ritmo (oscuro / claro / morado). Portada y CTA
  normalmente oscuro o morado.
- Jerarquía: un solo elemento dominante por slide. Mucho aire; si dudas,
  quita texto.
- Fotos de Raquel en `assets/` (raquel-1.jpg retrato, raquel-2.jpg taller),
  y las nuevas en Drive «4 · Mis fotos». Ambientes y detalles: «5 · B-roll».
  Fotos nuevas: guárdalas en `carruseles/proyectos/NN-tema/img/`.
- Si necesitas un recurso que no existe (icono, forma), créalo en SVG inline.

## 4. Exportar y revisar (obligatorio)
```
node carruseles/render.mjs carruseles/proyectos/NN-tema/carrusel.html
```
- El script avisa de texto desbordado: corrige hasta que diga «sin desbordes».
- Abre `export/vista-previa.png` y al menos portada + CTA a tamaño completo
  con Read. Revisa como diseñador: cortes de línea feos, palabras huérfanas,
  contraste, elementos que se pisan, consistencia entre slides.
- Itera hasta que lo publicarías tú misma.

## 5. Entrega
- Haz commit de `carrusel.html` y `export/` y súbelo a la rama de trabajo.
- Entrega a Raquel: la vista previa, el texto del caption (gancho + 3-5 líneas
  + CTA + 3-5 hashtags de nicho) y una sugerencia de primer comentario.
- Cuando Raquel comente gustos («más aire», «no me gusta el dorado»),
  anótalo en `notas-de-estilo.md`.
