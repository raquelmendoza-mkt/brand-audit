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

## Íconos (`src/kit/Iconos.tsx`)
Muestra: `npx remotion still Iconos out/iconos.png` (todas las placas + emojis 3D).

| Pieza | Para qué | Ejemplo |
|---|---|---|
| `<Emoji3D nombre="casa">` | 84 emojis 3D de Microsoft Fluent (MIT) con volumen y sombra; claves en español en `src/emoji3d-lista.json` (casa, llave, dinero, fuego, chispas, cohete, diamante, calendario, ubicacion, check, corazon, fiesta, cama, ducha, carro, camara, grafica, megafono, cara-lentes...). Entradas `rebote`, `giro`, `caida`, `zoom`, `desenfoque`; flotan solos. Añadir más: `python3 -I scripts/emojis3d.py "Nombre en inglés"` | `<Emoji3D nombre="llave" from={1} to={3} x={830} y={1080} tam={190} entrada="giro" />` |
| `<Icono nombre="cama" estilo="...">` | 100+ íconos de Phosphor con nombre en español (`ICONOS`: cama, bano, area, parqueadero, ascensor, piscina, seguridad, ubicacion, whatsapp, instagram, tiktok, dinero, calendario, ia...) en placas: `vidrio` (sobre fotos, lujo), `dorado` (lujo), `solido` (marca), `neon` (tech/noche), `emoji` (círculo brillante tipo WhatsApp), `simple`. `fondo`/`color` para colores de marca, `pulso` = anillo que late | `<Icono nombre="ubicacion" from={6} to={9} x={900} y={560} estilo="emoji" pulso />` |
| `<IconoDibujado nombre="diamante">` | Ícono de línea (Lucide) que se dibuja trazo a trazo y brilla al terminar (lujo, explicativos) | `<IconoDibujado nombre="llave" from={2} to={4} x={540} y={700} />` |
| `<FilaIconos items={[...]}>` | Fila de especificaciones ícono + texto, escalonada (3 hab · 2 baños · 100 m²) | `items={[{icono:'cama',texto:'3 hab'},{icono:'bano',texto:'2 baños'}]}` |

Reglas: lujo/minimalista → `vidrio`, `dorado` o `IconoDibujado` (nunca emojis); dinámico → `emoji`,
`solido` o `Emoji3D`; impacto → `Emoji3D` grandes; moderno → `neon`. Máximo 3 íconos a la vez, mismo estilo.

## Transiciones (`src/kit/Transiciones.tsx`)
`<TransitionSeries.Transition presentation={transicion('glitch')} timing={linearTiming({durationInFrames: 12})} />`
Prueba cualquiera: `npx remotion still PruebaTransicion out/t.png --frame=29 --props='{"tipo":"glitch"}'`.

| Estilo | Transiciones (todas probadas en render) |
|---|---|
| Lujo / elegante | `fundido`, `ventana` (se abre un marco redondeado), `cortina` (diagonal con borde de luz), `zoomSueno`, `desenfoqueLineal`, `iris` |
| Dinámico | `barrido` (whip pan), `zoomGolpe` (zoom a través), `empujon` (push cut con flash), `zoomDesenfoque`, `deslizarDesenfoque`, `deslizar` |
| Impacto / tech | `glitch` (RGB + franjas), `destello` (quemado a blanco), `zoomCruzado`, `quemadura` (film burn) |
| Clásicas | `cortinilla`, `voltear`, `reloj`, `deslizarArriba` |

`quemadura`, `zoomCruzado`, `zoomSueno`, `desenfoqueLineal`, `zoomDesenfoque`, `deslizarDesenfoque` son
shaders WebGL: necesitan Chrome 149+ (lo baja `setup.sh` a `.models/chrome` y `remotion.config.ts` lo
usa solo). Duración típica: 8-14 fotogramas en dinámico, 18-30 en lujo.
Sin TransitionSeries (cortes manuales): `entradaToma()` + `<Destello />` / `<Flash />` / `<LuzOrganica />`.

## Efectos y tipografía cinética (`src/kit/Efectos.tsx`)
Demo: composición `EfectosDemo` (props `{"subtitulos":"hormozi|caja|minimal|lujo|neon"}`).

| Pieza | Para qué |
|---|---|
| `<SubtitulosKaraoke palabras={palabrasDe(json, desfase)} estilo="hormozi">` | Subtítulos palabra por palabra con la activa resaltada: `hormozi` (mayúsculas gruesas, amarillo, viral), `caja` (palabra en caja de color, TikTok), `minimal`, `lujo` (serif, cursiva dorada), `neon`. `claves` = palabras siempre en color (cifras, marca). `json` = salida de `transcribe.mjs` |
| `<TextoCinetico texto="..." destacar={['todo']}>` | Gancho palabra por palabra, cada una con su animación (sube, escala, gira, entra de lado) |
| `<Resaltador>` | Marcador que barre detrás de una palabra |
| `<TrazoMano tipo="circulo\|subrayado\|flecha\|check\|equis">` | Trazos "a mano" que se dibujan para señalar, encerrar o tachar |
| `sacudida(frame, fps, at)` | Sacudida orgánica de cámara en impactos (ponla en el `style` de la capa de tomas) |
| `<DesenfoqueMovimiento>` | Motion blur real (sub-fotogramas) para elementos que se mueven rápido |
| `<LuzOrganica at={3}>` | Destello de luz orgánico WebGL (@remotion/light-leaks) en un corte |
| `<BarraProgreso>` | Barra fina arriba (retención) |
| `<Notificacion app titulo texto icono>` | Notificación tipo iPhone que baja (WhatsApp de un cliente, venta, cita) |
| `<Comentario usuario texto>` | Comentario de Instagram que se escribe solo (CTA "Comenta X") |
| `<Celular>` | Marco de iPhone para mostrar un video, perfil o app dentro del video |

Formas y trazos extra: `@remotion/shapes` (estrella, flecha, globo de diálogo, corazón, polígonos) y
`@remotion/paths` (`evolvePath` para dibujar cualquier SVG). Ruido orgánico: `@remotion/noise`.
Animaciones Lottie (iconos animados de LottieFiles): `@remotion/lottie` con el JSON descargado en
`public/lottie/` (comprueba antes que el dominio de descarga no esté bloqueado).

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
| Variaciones (no repetir) | `whoosh-2`, `whoosh-3`, `sube` (algo entra), `baja` (algo sale), `impacto-2` (metálico) |
| Cine / tensión | `braam` (tráiler), `drop` (caída de bajo), `reverso` (platillo al revés ANTES del corte), `latido`, `riser` |
| Dinero / redes | `caja` (ka-ching: precios, ventas), `notificacion` (tres tonos), `obturador` (foto), `burbuja`, `tecla-mecanica`, `glitch` |
| Otros | `sparkle`, `error`, `remotion/shutter-modern`, `remotion/page-turn`, `remotion/record-scratch`, `remotion/switch` |

Diseño de sonido como un pro: capas (whoosh + impacto + brillo en un titular importante), `reverso`
o `riser` terminando EXACTO en el corte, alterna variaciones para que no suene repetido, y deja
respirar: no todos los cortes llevan efecto. Con música: corta y anima en los beats (`beats.py`).

Volúmenes de referencia (con voz): whoosh 0.35-0.45, impacto 0.35-0.45, pop 0.26-0.33, ding 0.26-0.3,
teclado 0.25-0.3. Adelanta los whooshes 0.06-0.12 s al corte para que el pico caiga en el cambio.
