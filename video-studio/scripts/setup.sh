#!/usr/bin/env bash
# Deja el estudio listo: dependencias de Node y modelo de Whisper.
# Es seguro ejecutarlo varias veces: solo instala lo que falte.
set -euo pipefail
cd "$(dirname "$0")/.."

command -v ffmpeg >/dev/null || { echo "Falta FFmpeg. Instálalo: https://ffmpeg.org/download.html (Mac: brew install ffmpeg)"; exit 1; }

if [[ ! -d node_modules/remotion ]]; then
	echo "Instalando dependencias..."
	# onnxruntime-node intenta descargar binarios de GPU que no necesitamos
	ONNXRUNTIME_NODE_INSTALL=skip ONNXRUNTIME_NODE_INSTALL_CUDA=skip npm ci --no-audit --no-fund
fi

MODEL=.models/Xenova/whisper-small
if [[ ! -f $MODEL/onnx/encoder_model_quantized.onnx ]]; then
	echo "Descargando modelo de Whisper (165 MB)..."
	# Los pesos de Xenova/whisper-small publicados en npm (Hugging Face no siempre es accesible).
	# Solo contiene archivos de datos: se extrae con tar, sin ejecutar nada del paquete.
	tmp=$(mktemp -d)
	(cd "$tmp" && npm pack sts-whisper-small@1.0.0 --silent >/dev/null && tar -xzf sts-whisper-small-1.0.0.tgz)
	mkdir -p .models
	cp -r "$tmp/package/models/Xenova" .models/
	rm -rf "$tmp"
fi

echo "Estudio listo."
