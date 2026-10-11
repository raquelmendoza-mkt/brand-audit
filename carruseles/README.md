# Carruseles de Instagram · RM Marketing IA

Sistema para diseñar carruseles con tu marca y exportarlos como PNG de
1080 × 1350 listos para subir.

```
carruseles/
├── marca.css          sistema de diseño: colores, Poppins + Playfair, piezas
├── carrusel.js        cabecera, numeración, barra de progreso y control de calidad
├── render.mjs         exporta los PNG
├── plantilla.html     punto de partida para un carrusel nuevo
├── fonts/             fuentes locales (no dependen de internet)
├── referencias/       ← aquí subes los carruseles que te gustan
└── proyectos/
    └── 01-perfil-catalogo/
        ├── carrusel.html
        └── export/    01.png … 09.png + vista-previa.png
```

## Pedir un carrusel
Basta con decir el tema, por ejemplo: «Hazme un carrusel sobre cómo
preparar una casa para fotos, CTA con la palabra FOTOS». El proceso
completo está en `.claude/skills/carrusel-instagram/SKILL.md`.

## Exportar a mano
```
node carruseles/render.mjs carruseles/proyectos/01-perfil-catalogo/carrusel.html
node carruseles/render.mjs <carrusel.html> --jpg       # JPG
node carruseles/render.mjs <carrusel.html> --scale 2   # doble resolución
```
Requiere Node y Playwright (`npm i -g playwright && npx playwright install chromium`).
Para ver el carrusel sin exportar, abre `carrusel.html` en el navegador.
