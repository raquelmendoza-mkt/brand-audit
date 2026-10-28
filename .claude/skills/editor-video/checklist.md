# Control de calidad antes de entregar

Revisa como lo haría un director creativo exigente. Corrige y vuelve a revisar; no entregues con
algo de esta lista pendiente sin avisarlo.

## Historia y ritmo
- [ ] El gancho se entiende en 1-2 s y hay movimiento desde el primer fotograma (nada de logos al inicio).
- [ ] Sigue el guión pieza por pieza, en orden; no hay silencios, cuentas regresivas ni voz de quien graba.
- [ ] Ningún plano sin propósito dura más de 3-4 s; los saltos de una misma toma llevan mini-zoom.
- [ ] El CTA es claro, se lee entero y se mantiene al menos 1.5 s.

## Imagen
- [ ] Mira con Read una hoja de contactos completa + stills de cada titular (`remotion still --scale=0.25`,
      máximo 3 en paralelo).
- [ ] Ningún texto se sale del cuadro, se corta, tapa la cara o cae en la zona de la interfaz
      (`<ZonaSegura />`: 250 px arriba, 420 px abajo, columna derecha de 140 px).
- [ ] Los textos detrás de la persona se leen (la cabeza tapa solo una parte) y el recorte no parpadea.
- [ ] Contraste suficiente sobre fondos claros; colores y fuentes de UNA sola ficha de estilo.
- [ ] Color coherente entre tomas (mismo preset de `acabado.sh color`); clips de IA escalados y sin
      deformaciones; sin fotogramas negros entre cortes.
- [ ] Sin emojis si el estilo es lujo/minimalista.

## Texto
- [ ] Subtítulos corregidos a mano: nombres propios y de lugares, cifras, marcas (Whisper falla en
      "Viñedo", nombres, montos). Ortografía y tildes en todos los rótulos.
- [ ] Solo datos que Raquel dio: no inventes características, precios ni "incluido".

## Audio
- [ ] Voz limpia (DeepFilterNet), sin chasquidos en los cortes (micro fundidos de 20-40 ms).
- [ ] Voz pegada a su toma (sincronía verificada si hubo cortes finos).
- [ ] Música por debajo de la voz; efectos alineados al corte o palabra exacta, sin saturar.
- [ ] Volumen final: -14 LUFS (con voz/música) o -16 LUFS (solo efectos), pico ≤ -1.2 dB.

## Técnica y entrega
- [ ] `acabado.sh revisar out/final.mp4`: 1080x1920, 30 fps, H.264 high + AAC, faststart.
- [ ] Archivo final en máxima calidad + preview liviana; enlace de GitHub verificado (200 y tamaño).
- [ ] Resumen corto en tabla + lo que Raquel debe confirmar (dudas de transcripción, nombres).
