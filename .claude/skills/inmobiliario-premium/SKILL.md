---
name: inmobiliario-premium
description: Videos inmobiliarios premium para RM Marketing IA en video-studio/ — room tours, presentaciones de propiedades, casas comerciales, desarrollos, lujo minimalista, reels de asesores. Úsalo cuando Raquel pida editar un video de una propiedad, un room tour, un reel inmobiliario o animar fotos de una casa.
---

# Inmobiliario premium

Base técnica: skill `editor-video`. Contenido y estrategia: skill `remi-ai` (Método CLAVE, objeciones,
tipos de cliente). Fichas: `lujo` (minimalista), `arquitectura` (locales, desarrollos), `boutique`
(cálido) o `dinamico` (asesor hablando con energía).

## Estructura (25-45 s)
1. Gancho: la mejor toma o el dato más fuerte (precio, m², ubicación) en los 2 primeros segundos.
2. Recorrido lógico: fachada → social → cocina → habitaciones → baños → extras → vista.
   Descarta tomas de barrio/fachada si Raquel lo pide. 2.5-4 s por toma.
3. Datos en pantalla sincronizados con la voz o la toma: m², habitaciones, baños, niveles
   (`Contador`, píldoras con íconos, texto detrás de la persona en reels hablados).
4. Cierre: agente (nombre con fuente de firma), CTA claro ("Agenda tu visita", "Comenta CASA").

## Cómo hacerlo
- Asesor hablando: `.venv-ia/bin/python scripts/flujo_auto.py ... --estilo inmobiliario --gancho "..." --cta "..."`,
  o la receta B de `flujos.md` para texto detrás de la persona y piezas por guión (ver `src/Vinedo.tsx`).
- Solo fotos: anímalas con `camara()` del kit o con Higgsfield Omni (receta E; **pregunta antes de
  gastar créditos** y di el costo). Composición basada en `src/Felipe.tsx` (lujo) o `src/RoomTour.tsx`.
- Color: `acabado.sh color lujo|limpio|calido`; tomas de IA a 720p → `acabado.sh escalar`.
- En lujo: sin emojis, música elegante o solo efectos de sonido (pregunta).
- ¿Lo retocará en CapCut? skill `capcut-project-builder` (por capas = idéntico).

## Revisión extra
Cifras y nombres exactamente como los da Raquel (zona, precio, "Stefany"); nada de texto sobre
caras; los datos coinciden con lo que dice la voz.
