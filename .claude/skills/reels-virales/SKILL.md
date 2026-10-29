---
name: reels-virales
description: Edición de reels virales (Instagram, TikTok, Shorts) para RM Marketing IA en video-studio/. Úsalo cuando Raquel pida un reel viral, "que enganche", con ritmo rápido, jump cuts, subtítulos dinámicos, ganchos, listas tipo "3 errores", tendencias o retención alta.
---

# Reels virales

Base técnica: skill `editor-video` (léela primero: preferencias de Raquel, kit, flujos y checklist).
Ficha de estilo: `impacto` (listas, cifras, ofertas) o `dinamico` (reel hablado de marca).

## Estructura que retiene (15-45 s)
1. **0-3 s gancho**: el momento más fuerte primero (resultado, cifra, pregunta, contradicción).
   Texto grande en pantalla desde el fotograma 1 + movimiento. Nunca logo ni saludo al inicio.
2. **3-25 s desarrollo**: una idea por plano, cortes cada 1-2 s, jump cuts sin silencios con
   mini-zoom alterno, texto clave detrás de la persona, `Emoji3D`/`TrazoMano` en palabras clave.
3. **Re-gancho** a mitad ("pero lo mejor es...") con `riser` + `zoomGolpe`.
4. **Cierre**: CTA "Comenta X" (burbuja que se escribe sola) o loop al inicio para revisionados.

## Cómo hacerlo
- Rápido y completo: `.venv-ia/bin/python scripts/flujo_auto.py input/a.mov [...] --nombre X --estilo viral --gancho "..." --cta "Comenta X" --dur 30 [--corregir "Mal=Bien"]`
  → MP4 + proyecto de CapCut + SRT + informe en `out/entregas/X/`.
- Trabajo fino guiado por guión: receta B de `editor-video/flujos.md` (Viñedo) + kit (`SubtitulosKaraoke` estilo `hormozi`, `TextoCinetico`, `sacudida`, `BarraProgreso`).
- Gancho y CTA: si no los da, propón 3 opciones con la skill `remi-ai` (6 tipos de hooks).
- Música: `scripts/electro.py` (122-128 BPM, `--drops` en los segundos clave) y `beats.py` para cortar al ritmo.

## Antes de entregar
Skill `control-calidad-audiovisual`. Extra viral: el gancho se entiende sin sonido, ningún plano
dura más de 3 s sin un cambio (corte, zoom, texto) y la duración real ≤ la pedida (+10 %).
