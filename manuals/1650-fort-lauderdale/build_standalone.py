#!/usr/bin/env python3
"""Build a self-contained standalone HTML with base64-embedded images.

Re-encodes each source image at a size tuned for its slot on the page,
then swaps every images/<file> reference in index.html for a data URL so
the resulting single file can be dragged straight onto Netlify Drop.
"""
import base64
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageOps

BASE_DIR = Path(__file__).resolve().parent
IMAGES_DIR = BASE_DIR / "images"
SRC_HTML = BASE_DIR / "index.html"
OUT_HTML = BASE_DIR / "manual-standalone.html"

# each file → (max_width, jpeg_quality) for the embedded version
TARGETS = {
    "hero.jpg":    (1400, 78),
    "welcome.jpg": (1000, 78),
    "cta.jpg":     (1200, 65),
    "bedroom.jpg": (800,  78),
    "kitchen.jpg": (800,  78),
}


def encode(name: str) -> str:
    src = IMAGES_DIR / name
    max_w, quality = TARGETS[name]
    img = Image.open(src)
    img = ImageOps.exif_transpose(img)
    if img.mode != "RGB":
        img = img.convert("RGB")
    w, h = img.size
    if w > max_w:
        img = img.resize((max_w, int(h * max_w / w)), Image.LANCZOS)
    buf = BytesIO()
    img.save(buf, "JPEG", quality=quality, optimize=True, progressive=True)
    data = buf.getvalue()
    b64 = base64.b64encode(data).decode("ascii")
    print(f"  {name}: {len(data) / 1024:.1f} KB → b64 {len(b64) / 1024:.1f} KB")
    return f"data:image/jpeg;base64,{b64}"


def main():
    print("Encoding images:")
    data_urls = {name: encode(name) for name in TARGETS}

    html = SRC_HTML.read_text(encoding="utf-8")
    for name, url in data_urls.items():
        for pattern in (f"images/{name}", f"./images/{name}"):
            html = html.replace(pattern, url)

    OUT_HTML.write_text(html, encoding="utf-8")
    kb = OUT_HTML.stat().st_size / 1024
    print(f"\nWrote {OUT_HTML.name} ({kb:.1f} KB)")


if __name__ == "__main__":
    main()
