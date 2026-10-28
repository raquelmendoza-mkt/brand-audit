# Kit del editor (`src/kit/Kit.tsx`)

```tsx
import {Texto, Linea, Rotulo, Contador, BotonCTA, Grano, Vineta, Degradados, Destello, Flash,
  camara, entradaToma, Polvo, ZonaSegura} from './kit/Kit';
import {FUENTES, PARES} from './fonts';
```
Todos los tiempos van en **segundos del reel** (`from`/`to`/`at`). Demo con todo funcionando:
composición `KitDemo` (carpeta Kit) en `src/kit/Muestras.tsx`; úsala como plantilla.

| Pieza | Para qué | Ejemplo |
|---|---|---|
| `<Texto entrada="...">` | Texto con entrada pro: `subir` (apoyo), `mascara` (titular elegante), `desenfoque` (minimal), `espaciado` (marcas/antetítulos, letterSpacing en `em`), `golpe` (cifras), `letras` (ganchos) | `<Texto from={0.3} to={2.8} entrada="mascara" style={{position:'absolute',top:350,left:0,right:0,textAlign:'center',fontFamily:PARES.lujo.titulo,fontSize:120,color:'#fff'}}>Tu próximo hogar</Texto>` |
| `<Linea>` | Línea fina que se dibuja (separadores, subrayados) | `<Linea from={1} to={3} x={540} y={500} ancho={160} />` |
| `<Rotulo>` | Lower third: "01 · SALA" + titular + línea dorada | `<Rotulo from={1} to={3.5} numero="01" antetitulo="Sala" titulo="Amplia y luminosa" />` |
| `<Contador>` | Cifras que suben (precio, m²) con formato 695.000.000 | `<Contador from={3} to={6} valor={695000000} prefijo="$" style={{...}} />` |
| `<BotonCTA>` | Botón con toque, onda, brillo que respira y reflejo | `<BotonCTA from={35} texto="AGENDAR VISITA" />` |
| `<Grano>` | Grano de película (0.04-0.08) para unificar IA + celular | `<Grano intensidad={0.05} />` |
| `<Vineta>` | Oscurece bordes, foco al centro | `<Vineta fuerza={0.35} />` |
| `<Degradados>` | Legibilidad arriba/abajo | `<Degradados arriba={0.4} abajo={0.5} />` |
| `<Destello>` | Light leak cálido en un corte (lujo) | `<Destello at={5.9} />` |
| `<Flash>` | Flash blanco breve (energía) | `<Flash at={12.3} />` |
| `camara(tipo, p, fuerza)` | Movimiento de cámara sobre fotos: `acercar`, `alejar`, `derecha`, `izquierda`, `subir`, `bajar` | `style={camara('acercar', frame / durFrames)}` |
| `entradaToma(tipo, k)` | Entrada de cada toma: `golpe`, `zoomDesenfoque`, `barrido` (whip pan), `fundido` | `style={entradaToma('zoomDesenfoque', frame)}` dentro de la `Sequence` |
| `<Polvo>` | Partículas doradas suaves para cierres | `<Polvo cantidad={40} />` |
| `<ZonaSegura>` | Solo revisión: pinta lo que tapa la interfaz de Instagram/TikTok | `--props='{"zonas":true}'` en un still |

Orden de capas recomendado: tomas → `Degradados` → títulos que van DETRÁS de la persona → recorte
de la persona (mismo `scale` que el video) → textos de apoyo / píldoras / subtítulos → `Vineta` →
`Grano` → `Destello`/`Flash` → efectos de sonido.

Otras piezas ya hechas en composiciones (cópialas cuando sirvan):
- Subtítulos con palabra clave resaltada, `at(toma, segundo)` para mapear tiempos del clip original,
  confeti, íconos tipo emoji en círculos, tomas de apoyo (B-roll) con zoom: `src/Vinedo.tsx`.
- Píldoras de especificación, número + rótulo (`Stat`), precio que cuenta, botón dorado: `src/Felipe.tsx`.
- Palabras "transparentosas" moradas (blend modes) detrás de la persona: `src/Dia2.tsx`.
- Teléfono con grilla de propiedades, checklist animado, tarjetas, botón seguir: `src/Catalogo.tsx`.
- Cierre con círculo que se expande y regalo: `src/PromoTextos.tsx`. Cierre negro/dorado: `src/RoomTour.tsx`.

## Efectos de sonido (`public/sfx/`, generados por `scripts/sfx.py`)

| Uso | Archivos |
|---|---|
| Cortes / transiciones | `whoosh`, `whoosh-corto`, `swipe`, `remotion/whoosh`, `remotion/whip` |
| Lujo / suave | `aire`, `aire-corto`, `texto` (textos que entran), `tic`, `brillo`, `reveal` (precio, logo), `sub` |
| Titulares e impacto | `impacto`, `sub`, `remotion/vine-boom`, `riser` (antes de revelar) |
| Interfaz / redes | `pop`, `click`, `tecla`, `teclado-iphone`, `remotion/mouse-click`, `remotion/snapchat-notification`, `ping`, `ding`, `remotion/ding` |
| Otros | `sparkle`, `error`, `remotion/shutter-modern`, `remotion/page-turn`, `remotion/record-scratch`, `remotion/switch` |

Volúmenes de referencia (con voz): whoosh 0.35-0.45, impacto 0.35-0.45, pop 0.26-0.33, ding 0.26-0.3,
teclado 0.25-0.3. Adelanta los whooshes 0.06-0.12 s al corte para que el pico caiga en el cambio.
