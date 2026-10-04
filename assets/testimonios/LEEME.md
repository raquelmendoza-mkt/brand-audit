# Carpeta de testimonios nuevos

Aquí van los testimonios que quieras agregar a la propuesta de Ingrid
(`ingrid.html`). Acepta **imágenes y videos**.

## 1. Copia el archivo en esta carpeta

| Tipo | Formatos | Recomendación |
|---|---|---|
| Imagen | `.jpg`, `.png` | Capturas de WhatsApp, comentarios, resultados |
| Video | `.mp4` | Testimonio grabado. Ideal menos de 30 MB y menos de 60 segundos |

Ponle un nombre sencillo, sin espacios ni acentos. Por ejemplo:
`maria-lopez.jpg`, `testimonio-ana.mp4`.

## 2. Anótalo en la landing

Abre `ingrid.html` con un editor de texto y busca esta línea:

```
var TESTIMONIOS_NUEVOS = [
```

Justo debajo, agrega una línea por cada testimonio:

```js
{ tipo: 'imagen', archivo: 'maria-lopez.jpg',   titulo: 'María López · Realtor, Miami' },
{ tipo: 'video',  archivo: 'testimonio-ana.mp4', titulo: 'Ana Pérez · Realtor, Orlando' },
```

- `tipo` es `'imagen'` o `'video'`
- `archivo` es el nombre exacto del archivo que copiaste aquí
- `titulo` es el pie que se muestra debajo

Guarda y listo: la sección «Lo que dicen quienes ya trabajaron conmigo»
aparece sola. Si la lista queda vacía, esa sección no se muestra.

## 3. Importante sobre cómo compartes la propuesta

- **Si envías el archivo `ingrid.html` suelto** (por correo o WhatsApp), esta
  carpeta no viaja con él y los testimonios nuevos no se verán. En ese caso
  pásame los archivos y los incrusto dentro del HTML (las imágenes sí se
  pueden incrustar; los videos pesan demasiado).
- **Si compartes el enlace publicado**, todo se ve sin hacer nada más, porque
  la carpeta se publica junto a la página.

## Enlace de Drive para subirlos

Si prefieres no manejar archivos aquí, sube los testimonios a esta carpeta
de tu Drive y avísame — yo los incorporo:

https://drive.google.com/drive/folders/1xuhvIZMwH152r5-xJb60sahNP_nOWnsi
