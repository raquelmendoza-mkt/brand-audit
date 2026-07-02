#!/usr/bin/env python3
"""Build a self-contained standalone HTML with base64-embedded images."""
import base64
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
IMAGES_DIR = BASE_DIR / "images"
SRC_HTML = BASE_DIR / "index.html"
OUT_HTML = BASE_DIR / "manual-standalone.html"

IMAGE_FILES = [
    "hero.jpg", "welcome.jpg", "cta.jpg", "g-wide-1.jpg",
    "g1.jpg", "g2.jpg", "g3.jpg", "g4.jpg",
]


def encode(name: str) -> str:
    src = IMAGES_DIR / name
    data = src.read_bytes()
    b64 = base64.b64encode(data).decode("ascii")
    print(f"  {name}: {len(data) / 1024:.1f} KB (b64 {len(b64) / 1024:.1f} KB)")
    return f"data:image/jpeg;base64,{b64}"


def main():
    print("Encoding images:")
    data_urls = {name: encode(name) for name in IMAGE_FILES}

    html = SRC_HTML.read_text(encoding="utf-8")
    for name, url in data_urls.items():
        for pattern in (f"images/{name}", f"./images/{name}"):
            html = html.replace(pattern, url)

    OUT_HTML.write_text(html, encoding="utf-8")
    kb = OUT_HTML.stat().st_size / 1024
    print(f"\nWrote {OUT_HTML.name} ({kb:.1f} KB)")


if __name__ == "__main__":
    main()
