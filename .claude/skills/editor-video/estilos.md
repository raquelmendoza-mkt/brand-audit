# Fichas de estilo

Elige UNA ficha por video y respétala de principio a fin: la coherencia es lo que hace que un
video se vea profesional. Fuentes: `PARES.<estilo>` en `src/fonts.ts` (titulo / apoyo / firma).
Muestra visual: `npx remotion still Tipografias out/tipografias.png`.

Reglas comunes (todas las fichas)
- Lienzo 1080x1920, 30 fps. **Zona segura**: nada importante en los 250 px de arriba, los 420 px de
  abajo ni en la columna derecha de 140 px desde y=900 (iconos de Instagram/TikTok). Comprueba con
  `<ZonaSegura />` del kit en un still y quítalo del render final.
- Márgenes laterales mínimos de 80 px. Titulares ≥ 84 px, apoyo ≥ 40 px, subtítulos 50-56 px.
- Un titular por momento: máximo 2 niveles de texto a la vez (antetítulo + titular, o titular + 2-3 píldoras).
- Los 3 primeros segundos deciden: abre con el momento más llamativo (no con logo ni saludo), una
  pregunta o promesa clara y movimiento en pantalla desde el fotograma 1.
- Texto legible sin sonido: subtítulos siempre en reels hablados (la mayoría ve sin audio).
- Contraste: sombra suave (`0 4px 26px rgba(0,0,0,.45)`), `<Degradados />` o píldora detrás del
  texto. Sobre paredes blancas, nunca texto dorado o claro sin fondo.
- Sincroniza cada texto y cada efecto de sonido con la palabra o el corte exacto (tiempos de Whisper
  o de las piezas), nunca "más o menos".

---

## lujo — Inmobiliaria de lujo / minimalista
Para: penthouses, apartamentos premium, room tours "limpios" (Felipe).
- Fuentes: **Cormorant Garamond 500** (titulares, cifras) + **Montserrat 400-500** con espaciado
  amplio (0.3-0.45em, MAYÚSCULAS pequeñas) + **Great Vibes** solo para el nombre del agente.
- Colores: blanco, negro carbón `#111418`, dorado champán `#D9B36A` (acento, líneas, botón).
- Sin emojis ni iconos de colores. Acentos con líneas finas (`<Linea />`) y puntos dorados.
- Ritmo: tomas de 2.5-4 s, movimientos de cámara lentos (`acercar`/`derecha`, fuerza 0.6-1).
- Transiciones: `zoomDesenfoque` o `fundido` + `<Destello />` cálido; cortes secos solo en el gancho.
- Textos: entradas `mascara`, `espaciado`, `desenfoque`. Nada de "golpes".
- Acabado: `acabado.sh color lujo`, `<Vineta fuerza={0.35} />`, `<Grano intensidad={0.05} />`.
- Sonido: `aire`, `aire-corto`, `texto`, `tic`, `brillo`, `reveal` (precio), `sub` (logo/cierre).
  Música opcional: piano/deep house elegante (`afrohouse.py --estilo elegante`) o solo efectos.
- Cierre: nombre del agente + antetítulo + `<BotonCTA texto="AGENDAR VISITA" />` + `<Polvo />`.
- Íconos: `vidrio`/`dorado` o `IconoDibujado`. Subtítulos: `lujo`. Transiciones: `ventana`, `cortina`, `zoomSueno`.

## dinamico — Reel de marca de Raquel (por defecto)
Para: reels hablados, tips, contenido educativo, promos de propiedades con energía.
- Fuentes: **Poppins 700-800** (titulares) + **Helvetica** (subtítulos y apoyo).
- Colores: blanco + un acento por video (azul `#1C6BEA` inmobiliario, morado RM `#7B6FE8`,
  amarillo `#FFD84D` para palabras clave en subtítulos).
- Ritmo: cortes cada 1-3 s, jump cuts sin silencios con mini-zoom alterno (1.0 / 1.1) en cada salto.
- Texto clave **detrás de la persona** (recorte MediaPipe), cifras grandes con golpe.
- Transiciones: `golpe` en cada corte, `Flash` en cambios de bloque.
- Sonido: whoosh en cada corte, whip + impacto en titulares, pop en píldoras, ding en cifras,
  teclado en CTA escritos. Música electro/afro house 122-128 BPM con ducking (-13 dB bajo la voz).
- Cierre: palabra del CTA gigante detrás de la persona + burbuja "Comenta 'X'" que se escribe sola.
- Íconos: `emoji`/`solido` o `Emoji3D`. Subtítulos: `hormozi` o `caja`. Transiciones: `barrido`, `zoomGolpe`, `empujon`.

## impacto — Viral / ofertas / listas
Para: "3 errores...", precios llamativos, lanzamientos, comparativas.
- Fuentes: **Anton** o **Bebas Neue** (titulares en MAYÚSCULAS) + **Inter 600** (apoyo).
- Colores: blanco y negro con un color de alto contraste (rojo `#E8173A` o amarillo `#FFD84D`).
- Ritmo: muy rápido (0.8-1.5 s por plano), números con `<Contador />`, entradas `golpe` y `letras`.
- Sonido: `impacto`, `sub`, `whoosh-corto`, `error` (lo que NO hay que hacer), `riser` antes de revelar.
- Íconos: `Emoji3D` grandes y `TrazoMano` (equis / check / círculo). Subtítulos: `hormozi`. Transiciones: `glitch`, `destello`.

## editorial — Revista / marca personal premium
Para: entrevistas, testimonios, perfiles de agentes, contenido de autoridad.
- Fuentes: **Playfair Display 500-700** (con cursiva para una palabra) + **Inter 400**.
- Colores: crema `#F4EFE6`, negro, un acento terracota `#B5562F` o verde oliva `#5E6B3A`.
- Composición: mucho aire, texto alineado a la izquierda con margen de 90 px, rótulos numerados.
- Transiciones: `fundido`, `mascara`. Sonido: `texto`, `tic`, `aire-corto`.

## moda — Boutique, belleza, productos
Para: tiendas como Detallitos Dyan, cosmética, ropa.
- Fuentes: **Bodoni Moda 500** + **Jost 400**; firma **Pinyon Script**.
- Colores: rosa empolvado `#F2C9D0`, negro, dorado. Color `vivo` para producto.
- Ritmo medio, macros del producto con `acercar`, `brillo` en el producto estrella.

## arquitectura — Constructoras, desarrollos, locales comerciales
- Fuentes: **Cinzel 500** (titulares) + **Josefin Sans 300-400**; detalle **Italiana**.
- Colores: gris piedra `#8A8D91`, blanco, negro, acento cobre `#B87333`.
- Planos aéreos (dron con IA), líneas y retículas finas, datos técnicos en rótulos numerados.

## moderno — Tecnología, IA, cursos
- Fuentes: **Space Grotesk 500-700** + **Inter**.
- Colores: negro `#0B0D10`, blanco, acento eléctrico `#7B6FE8` o cian `#2EE6D6`.
- Sonido: `tic`, `tecla`, `swipe`, `riser`, `glitch`. Animaciones de interfaz (tarjetas, cursores, checks).
- Íconos: `neon`. Subtítulos: `neon` o `minimal`. Transiciones: `glitch`, `zoomCruzado`. Usa `Celular` y `Notificacion`.

## agencia — Marca personal premium / estudio creativo
Para: Raquel como marca (RM Marketing IA), lanzamientos de cursos, testimonios de clientes.
- Fuentes: **Clash Display 600** (titulares, poco texto, tamaño grande) + **Satoshi 400-500** (apoyo
  y subtítulos). Fontshare: se bajan con `scripts/fuentes.py` (no van a git).
- Colores: crema `#F4EFE6`, negro `#0E0E10`, un acento (morado RM `#7B6FE8`).
- Ritmo: medio (2-3 s), entradas `mascara` y `letras`, cortes con `zoomCruzado`.
- Sonido: `aire`, `tic`, `reveal`; música elegante baja o afro house suave.
- Subtítulos: `minimal` o `caja`. Íconos: `IconoDibujado` o `solido`.

## anuncio — Meta Ads / publicidad directa
Para: anuncios de 15-30 s con oferta, beneficio y llamada a la acción clara.
- Fuentes: **Cabinet Grotesk 800** (titular y cifras) + **General Sans 500** (apoyo). General Sans
  no trae "²": escribe "m2" o usa Satoshi para esa línea.
- Estructura: gancho 0-3 s (problema o resultado) → 2-3 beneficios con cifras → prueba (testimonio,
  antes/después) → oferta → CTA con botón y texto en pantalla durante 3 s.
- Ritmo rápido; texto siempre dentro de la zona segura; subtítulos `caja` (se leen sin sonido).
- Sonido: `whoosh`, `pop`, `ding` en cifras, `riser` antes de la oferta.

## boutique — Editorial cálido
Para: propiedades boutique, historias, testimonios largos, gastronomía.
- Fuentes: **Fraunces 400-600** (titulares, cursiva 300-400 para acentos) + **General Sans 400**.
- Colores: arena `#E9DFD0`, terracota `#B4643C`, verde oliva `#5E6B4E`.
- Ritmo lento (3-4 s), `acabado.sh color calido`, `<Grano intensidad={0.06} />`, transiciones `fundido`.

---

## Colorimetría (FFmpeg, antes de Remotion)
`bash scripts/acabado.sh color <in> <out> <estilo>`:
- `limpio` interiores con blancos neutros (corrige el amarillo de bombillos) · `lujo` suave, cálido,
  negros levantados · `calido` hogar acogedor · `cine` teal & orange · `vivo` comida/producto ·
  `noche` exteriores nocturnos.
- Aplica el MISMO estilo a todas las tomas del video para que el recorrido se vea continuo.
- Clips de IA (720p): primero `escalar`, después `color`.
