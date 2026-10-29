---
name: capcut-project-builder
description: Crea proyectos editables de CapCut (Mac 9.x) desde video-studio/ — por capas idénticas a Remotion o 100 % nativos — y explica a Raquel cómo abrirlos. Úsalo cuando pida pasar una edición a CapCut, entregar editable, abrir en CapCut, armar un proyecto de CapCut o cuando un cliente edita en CapCut.
---

# CapCut Project Builder

Documentación técnica completa: `editor-video/capcut.md`. Probado en el CapCut 9.5 de Raquel (Mac).
Necesita la semilla `video-studio/input/capcut/semilla.zip` (proyecto vacío de SU CapCut).

## Elige el modo
| Modo | Se ve | Editable en CapCut | Script |
|---|---|---|---|
| **Por capas** (recomendado si se diseñó en Remotion) | Idéntico a Remotion | Cortes del fondo, audio por pistas, borrar/mover capas; los gráficos NO se editan por dentro | `capcut/capas_vinedo.py` (plantilla) |
| **Nativo** | Parecido (animaciones de CapCut) | Todo: textos, subtítulos, efectos, transiciones de CapCut | `capcut/rm_capcut.py construir plan.json` (`desde_vinedo.py` de ejemplo) |
| **Automático** | Nativo | Todo | `scripts/flujo_auto.py` ya lo genera |

Por capas: la composición necesita una prop `capa` (`fondo`, `graficos`, `subtitulos`, `sfx`) como
`src/Vinedo.tsx`; el script renderiza cada capa (gráficos en ProRes 4444 con transparencia), separa
voz, música y efectos, arma una vista previa y comprueba que coincida con el render normal.
Límite que hay que decir siempre: si se mueve o alarga un corte del fondo en CapCut, los gráficos
no lo siguen (hay que moverlos a mano o volver a exportar).

## Reglas
- Nunca escribir en un proyecto que CapCut tenga abierto; nunca modificar proyectos de Raquel sin
  copia: los proyectos nuevos se crean con nombre propio y no tocan los existentes.
- No prometas que efectos de Remotion se editen dentro de CapCut.
- Medios dentro del proyecto (`materiales/`) con la ruta real de su Mac (sale de la semilla).

## Entrega (instrucciones para Raquel, en este orden)
1. Cierra CapCut (Cmd + Q).
2. Abre Terminal y pega el comando de una línea que descarga y descomprime en
   `~/Movies/CapCut/User Data/Projects/com.lveditor.draft/` (ZIP > 95 MB: en partes, se unen con `cat`).
3. Abre CapCut → el proyecto aparece en la lista → revisa → Exportar.
Pídele que confirme: abre, medios enlazados, capas transparentes, audio por pistas.

## Conectores MCP de CapCut evaluados (oct. 2026)
Ninguno está probado en CapCut 9.x. Opcional en su Mac, tras una prueba con copia de seguridad:
`JmsLdrn/capcut-mcp` (Node, edita proyectos existentes, hace backups). VectCutAPI (más funciones,
HTTP), drhema/mcp-cut y MadeByAdi/capcut-mcp-full: no instalados (duplican lo que ya hacemos o
no declaran licencia/compatibilidad). Detalle en `MANUAL_EDITOR_IA_CLAUDE.md`.
