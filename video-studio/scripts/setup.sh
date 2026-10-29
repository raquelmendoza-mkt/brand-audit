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

# Efectos de sonido sintetizados (siempre disponibles, sin internet)
if [[ ! -f public/sfx/tecla-mecanica.wav ]]; then
	python3 -I scripts/sfx.py >/dev/null
fi

# Efectos grabados de @remotion/sfx: solo si remotion.media está permitido en la red
if [[ ! -d public/sfx/remotion ]] && curl -sSf -m 10 -o /dev/null https://remotion.media/whoosh.wav 2>/dev/null; then
	echo "Descargando efectos de sonido de Remotion..."
	mkdir -p public/sfx/remotion
	for s in whoosh whip ding mouse-click switch page-turn shutter-modern snapchat-notification vine-boom record-scratch; do
		curl -sSf -m 30 -o "public/sfx/remotion/$s.wav" "https://remotion.media/$s.wav" || rm -f "public/sfx/remotion/$s.wav"
	done
fi

# Recorte de personas (texto detrás del sujeto): MediaPipe + modelo de Google
if ! python3 -c "import mediapipe" 2>/dev/null; then
	echo "Instalando MediaPipe..."
	pip install -q mediapipe 2>/dev/null || pip install -q --break-system-packages mediapipe
	command -v apt-get >/dev/null && ! ldconfig -p | grep -q libEGL.so.1 && apt-get install -y -q libegl1 libgles2 >/dev/null 2>&1 || true
fi
SEG=.models/mediapipe/selfie_multiclass_256x256.tflite
if [[ ! -f $SEG ]]; then
	mkdir -p .models/mediapipe
	curl -sSf -o "$SEG" https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite
fi

# Sincronía labios-voz (scripts/sincronia.py): Face Landmarker de MediaPipe
FACE=.models/mediapipe/face_landmarker.task
if [[ ! -f $FACE ]]; then
	curl -sSf -o "$FACE" https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task || true
fi

# Limpieza de voz con IA (DeepFilterNet 3, binario autónomo, sin Python ni GPU)
DF=.models/bin/deep-filter
if [[ ! -x $DF ]]; then
	echo "Descargando DeepFilterNet..."
	mkdir -p .models/bin
	case "$(uname -s)-$(uname -m)" in
		Darwin-arm64) DFB=aarch64-apple-darwin ;;
		Darwin-x86_64) DFB=x86_64-apple-darwin ;;
		*) DFB=x86_64-unknown-linux-musl ;;
	esac
	curl -sSfL -o "$DF" "https://github.com/Rikorose/DeepFilterNet/releases/download/v0.5.6/deep-filter-0.5.6-$DFB" && chmod +x "$DF" || rm -f "$DF"
fi

# Chrome reciente para render (las transiciones con shader necesitan Chrome 149+)
CH=.models/chrome/chrome-headless-shell-linux64/chrome-headless-shell
if [[ ! -x $CH ]] && [[ $(uname -s) == Linux ]]; then
	echo "Descargando Chrome headless reciente..."
	v=$(curl -sSf https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json | python3 -c "import json,sys; print(json.load(sys.stdin)['channels']['Stable']['version'])") || v=""
	if [[ -n $v ]]; then
		mkdir -p .models/chrome
		curl -sSf -o .models/chrome/hs.zip "https://storage.googleapis.com/chrome-for-testing-public/$v/linux64/chrome-headless-shell-linux64.zip" \
			&& python3 -c "import zipfile; zipfile.ZipFile('.models/chrome/hs.zip').extractall('.models/chrome')" && chmod +x "$CH"
		rm -f .models/chrome/hs.zip
	fi
fi

# Emojis 3D (Microsoft Fluent Emoji, MIT)
if [[ ! -f src/emoji3d-lista.json ]] || [[ ! -f public/emoji3d/casa.png ]]; then
	python3 -I scripts/emojis3d.py >/dev/null || true
fi

# Conector con CapCut (pyCapCut, Apache-2.0; MediaInfo para leer duraciones)
if ! python3 -c "import pycapcut" 2>/dev/null; then
	echo "Instalando el conector de CapCut..."
	pip install -q pycapcut==0.0.4 2>/dev/null || pip install -q --break-system-packages pycapcut==0.0.4
fi
python3 -c "import pymediainfo,sys; sys.exit(0 if pymediainfo.MediaInfo.can_parse() else 1)" 2>/dev/null || \
	(command -v apt-get >/dev/null && apt-get install -y -q libmediainfo0v5 >/dev/null 2>&1) || true

# Biblioteca de fuentes: Google Fonts (OFL) en public/fonts y Fontshare (ITF FFL, fuera de git) en public/fonts/fontshare
if [[ ! -f src/fuentes-lista.json ]] || [[ ! -f public/fonts/cormorant-garamond-400.woff2 ]] || [[ ! -f public/fonts/fontshare/satoshi-400.woff2 ]]; then
	echo "Descargando fuentes..."
	python3 -I scripts/fuentes.py >/dev/null
fi

# Herramientas de análisis en un entorno aislado (.venv-ia, no toca el Python del sistema):
# faster-whisper (transcripción + detección de voz Silero), PySceneDetect, OpenCV, librosa, pyCapCut
PAQ="faster-whisper==1.2.1 scenedetect==0.7.2 opencv-python-headless librosa==1.0.0 soundfile==0.14.0 pillow numpy pycapcut==0.0.4 pymediainfo"
if ! .venv-ia/bin/python -c "import faster_whisper, scenedetect, cv2, librosa, pycapcut" 2>/dev/null; then
	echo "Instalando herramientas de análisis (.venv-ia)..."
	if command -v uv >/dev/null; then
		uv venv -q .venv-ia && VIRTUAL_ENV=.venv-ia uv pip install -q $PAQ
	else
		python3 -m venv .venv-ia && .venv-ia/bin/pip install -q $PAQ
	fi
fi
# Whisper large-v3-turbo para faster-whisper (1.6 GB; mucho más preciso en español que small)
if [[ ! -d .models/hf/hub/models--mobiuslabsgmbh--faster-whisper-large-v3-turbo ]]; then
	echo "Descargando Whisper turbo (1.6 GB)..."
	HF_HOME=.models/hf .venv-ia/bin/python -c "from huggingface_hub import snapshot_download; snapshot_download('mobiuslabsgmbh/faster-whisper-large-v3-turbo')" >/dev/null 2>&1 \
		|| echo "  No se pudo (Hugging Face bloqueado): usa scripts/transcribe.mjs o flujo_auto.py --modelo small"
fi

echo "Estudio listo."
