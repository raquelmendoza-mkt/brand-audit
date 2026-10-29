# Conector con CapCut (`video-studio/capcut/`)

CapCut no tiene API oficial. Usamos **pyCapCut** (código abierto, Apache-2.0): no entra a la cuenta
ni a los servidores de CapCut, solo escribe archivos de proyecto locales que el CapCut de escritorio
de Raquel abre como un proyecto propio, 100 % editable (cada cosa en su pista). Ella exporta.

## Cuándo usarlo
- Raquel quiere retocar en CapCut (cambiar un texto, mover un corte, poner una plantilla o efecto
  de CapCut) sobre lo que hicimos aquí.
- Entregas para clientes que editan en CapCut.
- Lo que solo existe en Remotion (texto detrás de la persona con recorte por fotograma, kit de
  íconos, transiciones con shader) NO pasa a CapCut como animación: se entrega el video de Remotion,
  o en CapCut se reconstruye con sus herramientas (Recorte automático, plantillas). Avísalo.

## Semilla (una vez por computadora y cada vez que actualice CapCut)
Los CapCut recientes (8.7+, 9.x) leen la línea de tiempo de `Timelines/<id>/draft_info.json` y
rechazan proyectos con estructura vieja ("ruta inusual"). Por eso se parte de un proyecto vacío
creado por SU CapCut. Pídele a Raquel:
1. CapCut (Mac) → **Nuevo proyecto** → sin agregar nada → nómbralo **RM Semilla** → cierra CapCut
   por completo (Cmd + Q), para que guarde.
2. Finder → **Ir → Ir a la carpeta** (Shift + Cmd + G) →
   `~/Movies/CapCut/User Data/Projects/com.lveditor.draft/` (si cambió la ubicación: CapCut →
   Configuración → Proyectos → Ubicación del borrador).
3. Clic derecho en la carpeta **RM Semilla** → **Comprimir** → sube `RM Semilla.zip` a Drive (carpeta
   compartida por enlace) y avisa. Guárdala en `input/capcut/semilla.zip`.
4. Dile también su versión de CapCut (CapCut → Acerca de CapCut).
De la semilla salen la ruta real de su carpeta de proyectos (para enlazar los medios) y la
estructura exacta de su versión. Windows: `C:\Users\<usuario>\AppData\Local\CapCut\User Data\Projects\com.lveditor.draft\`.

## Construir un proyecto
1. Arma un plan JSON (formato completo en el docstring de `capcut/rm_capcut.py`):
   `video` (pista principal: archivo, desde, hasta, en, zoom, entrada, transicion, filtro...),
   `superpuestos` (B-roll), `textos` (texto, en, hasta, fuente, tam, color, x/y, entrada, salida,
   bucle, borde, fondo, pista), `subtitulos` (SRT), `audio` (música/efectos con pista y fundidos),
   `efectos` (efectos de escena).
2. `python3 capcut/rm_capcut.py construir plan.json --semilla input/capcut/semilla.zip`
   → `out/capcut/<nombre>/` + `out/capcut/<nombre>.zip` (los medios van dentro, en `materiales/`).
3. `python3 capcut/rm_capcut.py catalogo` lista los nombres en español: transiciones (fundido,
   destello, acercar, alejar, barrido-*, deslizar-*, desenfoque, glitch, girar, sacudida, luz, zoom),
   entradas/salidas de video y de texto (pop, maquina, zoom, subir, rebote, desenfoque, glitch,
   karaoke, brillo, onda), bucles de texto (flotar, brillo, onda, temblor, latido, pulso), filtros
   (limpio, natural, calido, frio, vivo), efectos (destellos, flash, brillo, vineta, pelicula,
   desenfoque, sacudida, enfoque) y fuentes nativas (poppins, montserrat, playfair, cinzel, anton,
   bebas, oswald, didot, futura, dmsans). También acepta el nombre nativo exacto de CapCut
   (1.100+ transiciones, 250 entradas, 180 animaciones de texto, 450 filtros, 1.500 efectos).
   Los avisos dicen si algo es de **CapCut Pro** o no existe.
4. Ejemplo completo: `python3 capcut/desde_vinedo.py --semilla ...` exporta el reel de El Viñedo
   (piezas sin silencios, voz limpia, subtítulos, títulos, música y efectos) desde la versión Remotion.

## Medios y tamaño
- Usa clips 1080x1920 30 fps con la voz YA limpia (DeepFilterNet), H.264 CRF 20-21, música en M4A:
  un reel de 70 s queda en ~60 MB. Clips completos (no solo el tramo) para poder alargar en CapCut.
- Fuentes: Helvetica no existe en CapCut; usa Montserrat o DM Sans como apoyo.
- Posiciones: `x`/`y` en mitades de lienzo (y = 0.6 arriba, -0.45 zona de subtítulos).

## Entrega a Raquel
1. ZIP < 30 MB → SendUserFile; si no, `entregas/` + enlace raw de GitHub (máx. 95 MB).
2. Instrucciones: cierra CapCut → descomprime el ZIP → mueve la carpeta del proyecto a
   `~/Movies/CapCut/User Data/Projects/com.lveditor.draft/` → abre CapCut → aparece en Proyectos
   (si no, entra y sal de otro proyecto o reinicia CapCut) → edita → Exportar.
3. Si CapCut marca "medios no encontrados": se construyó sin semilla o movió la carpeta; reconstruye
   con la semilla (no la hagas reenlazar a mano).
4. Nunca escribas en un proyecto que CapCut tenga abierto: lo sobrescribe al cerrar.
