# Imágenes de la landing

La landing carga cada imagen en **dos intentos**:

1. **Primero** el archivo de este repositorio (`assets/...`) → público y permanente.
2. **Si no está**, la copia de Google Drive → solo funciona si la carpeta de Drive
   está compartida con "Cualquier persona con el enlace".
3. Si ninguna carga, se muestra un marco de respaldo (el diseño no se rompe).

Basta con que funcione **una** de las dos. La opción 1 es la recomendada:
no depende de permisos y no se rompe nunca.

---

## ✅ Opción recomendada: subir las imágenes a este repositorio

Sube estos 5 archivos, **con estos nombres exactos**:

### `assets/fotos/`

| Nombre del archivo | Cuál es | Dónde aparece |
|---|---|---|
| `raquel-1.jpg` | `IMG_6093.JPG` de tu Drive | Sección "¿Quién es Raquel Mendoza?" |

### `assets/testimonios/`

| Nombre del archivo | Cuál es | Qué muestra |
|---|---|---|
| `testimonio-1.jpg` | `IMG_7926.jpg` | 103 clientes potenciales · US$2,61 por lead |
| `testimonio-2.jpg` | `IMG_7925.jpg` | 269 clientes potenciales · US$2,83 por lead |
| `testimonio-3.jpg` | `IMG_7922.jpg` | Mensaje de la clienta: "todo un éxito" |
| `testimonio-4.jpg` | `IMG_7923.jpg` | Agradecimiento tras el cierre |

**Cómo subirlas (desde el navegador, sin instalar nada):**

1. Descarga las 5 imágenes de tu carpeta de Drive a tu computadora.
2. Renómbralas según la tabla de arriba.
3. En GitHub, entra a la carpeta `assets/fotos` → **Add file → Upload files** → arrastra `raquel-1.jpg` → **Commit changes**.
4. Repite en `assets/testimonios` con las cuatro capturas.

> **Comprime la foto antes de subirla.** `IMG_6093.JPG` pesa 6,3 MB y haría la página
> muy lenta. Pásala por [squoosh.app](https://squoosh.app) o similar y déjala por
> debajo de 500 KB. Las cuatro capturas ya están livianas (entre 28 y 74 KB).

---

## Opción alternativa: dejarlas en Drive

Si prefieres no subirlas al repositorio, comparte la carpeta:

1. Clic derecho en **"Landing Meta Ads — Imágenes (Raquel Mendoza)"** en Drive.
2. **Compartir → Acceso general**.
3. Cambiar de *Restringido* a **"Cualquier persona con el enlace"** · rol **Lector**.

Carpeta: https://drive.google.com/drive/folders/18kRKw7Lq583wFsrMGSURv_k0AQaFzsDB

Ten en cuenta que algunos navegadores y clientes de correo bloquean las imágenes
servidas desde Drive, por eso esta opción es el respaldo y no la principal.

---

## Publicar la landing en internet (GitHub Pages)

Para que cualquiera pueda abrirla con un enlace:

1. En este repositorio: **Settings → Pages**.
2. En *Source*, elige **Deploy from a branch**.
3. Branch: `main` (o la rama que uses) · carpeta: `/ (root)` → **Save**.
4. En un par de minutos queda publicada en:
   `https://raquelmendoza-mkt.github.io/brand-audit/propuesta-meta-ads.html`

Con las imágenes subidas al repositorio (opción recomendada), ese enlace funciona
para todo el mundo sin configurar ningún permiso extra.
