#!/usr/bin/env python3
"""Decode a base64 file, resize the image and save it as JPEG.

Usage: resize.py <base64_input_file> <output_jpeg_path> <max_width> [quality=82]
"""
import base64
import sys
from pathlib import Path

import pillow_avif  # noqa: F401 — registers the AVIF decoder with Pillow
from PIL import Image, ImageOps

b64_path = Path(sys.argv[1])
out_path = Path(sys.argv[2])
max_w = int(sys.argv[3])
quality = int(sys.argv[4]) if len(sys.argv) > 4 else 82

raw = b64_path.read_text().strip()
data = base64.b64decode(raw)
tmp_bin = out_path.with_suffix('.bin')
tmp_bin.write_bytes(data)

img = Image.open(tmp_bin)
img = ImageOps.exif_transpose(img)
if img.mode not in ("RGB", "L"):
    img = img.convert("RGB")

w, h = img.size
if w > max_w:
    new_h = int(h * max_w / w)
    img = img.resize((max_w, new_h), Image.LANCZOS)

img.save(out_path, "JPEG", quality=quality, optimize=True, progressive=True)
tmp_bin.unlink(missing_ok=True)
b64_path.unlink(missing_ok=True)

print(f"OK: {out_path} ({out_path.stat().st_size} bytes, {img.size[0]}x{img.size[1]})")
