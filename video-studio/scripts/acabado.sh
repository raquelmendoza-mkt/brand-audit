#!/usr/bin/env bash
# Acabado profesional (posproducción) con FFmpeg + DeepFilterNet.
# Uso: bash scripts/acabado.sh <comando> [argumentos]   (sin argumentos lista los comandos)
set -euo pipefail
cd "$(dirname "$0")/.."
DF=.models/bin/deep-filter

ayuda() {
	cat <<'EOF'
Comandos:
  color <in> <out> <lujo|limpio|calido|cine|vivo|noche>
        Etalonaje por estilo (en el video, no en Remotion). lujo = suave y cálido con negros
        levantados; limpio = blancos neutros para interiores; calido = hogar acogedor;
        cine = teal & orange; vivo = comida/producto; noche = exteriores nocturnos.
  escalar <in> <out>          Lleva clips 720p (p. ej. Higgsfield) a 1080x1920 con lanczos + nitidez CAS.
  estabilizar <in> <out>      Quita temblor de cámara en mano (vid.stab, 2 pasadas).
  lenta <in> <out> <factor>   Cámara lenta real con fotogramas interpolados (factor 2 = mitad de velocidad).
  grano <in> <out> [fuerza]   Grano de película fino (fuerza 4-10, por defecto 6).
  limpiar-voz <in> <out> [db] Limpia la voz con IA (DeepFilterNet 3, sin retardo) + EQ de presencia
                              + compresión suave. db = reducción máxima (por defecto 40; 100 = total).
  normalizar <in> <out> [lufs] Volumen final medido en 2 pasadas (por defecto -14 LUFS, pico -1.5 dB).
  entregar <in> <out> [mb]    Exporta para redes: H.264 high, AAC 256k, faststart. Si pasa de <mb>
                              (por defecto 95, límite de GitHub 100) hace 2 pasadas al tamaño justo.
                              Crea además <out>-preview.mp4 de 540p para enviar por el chat.
  revisar <in>                Hoja de contactos (1 cuadro por segundo) + volumen + datos técnicos.
EOF
}

dur() { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }

case "${1:-}" in
color)
	in=$2 out=$3 p=$4
	case $p in
	lujo) vf="colortemperature=temperature=5600:mix=0.25,eq=contrast=1.05:saturation=0.9:gamma=1.02,curves=all='0/0.035 0.25/0.24 0.5/0.5 0.75/0.77 1/0.97',colorbalance=rh=0.025:bh=-0.02" ;;
	limpio) vf="colortemperature=temperature=6800:mix=0.35,eq=brightness=0.015:contrast=1.04:saturation=1.02,curves=all='0/0 0.5/0.52 1/1'" ;;
	calido) vf="colortemperature=temperature=5000:mix=0.35,eq=contrast=1.04:saturation=1.06,colorbalance=rm=0.02:bm=-0.02" ;;
	cine) vf="colorbalance=rs=-0.05:bs=0.06:rh=0.06:gh=0.015:bh=-0.05,curves=all='0/0.02 0.25/0.22 0.5/0.5 0.75/0.79 1/0.98',eq=saturation=0.95" ;;
	vivo) vf="eq=contrast=1.08:saturation=1.18:gamma=0.98,cas=0.3" ;;
	noche) vf="colortemperature=temperature=7500:mix=0.3,eq=contrast=1.1:saturation=1.05:gamma=1.05,curves=all='0/0.02 0.5/0.48 1/1'" ;;
	*) echo "Estilo desconocido: $p"; exit 1 ;;
	esac
	ffmpeg -v error -y -i "$in" -vf "$vf,format=yuv420p" -c:v libx264 -preset slow -crf 15 -c:a copy "$out"
	;;
escalar)
	ffmpeg -v error -y -i "$2" -vf "scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920,cas=0.55,format=yuv420p" \
		-c:v libx264 -preset slow -crf 14 -c:a copy "$3"
	;;
estabilizar)
	t=$(mktemp -d)
	ffmpeg -v error -y -i "$2" -vf vidstabdetect=shakiness=6:accuracy=15:result="$t/tr.trf" -f null -
	ffmpeg -v error -y -i "$2" -vf "vidstabtransform=input=$t/tr.trf:smoothing=25:zoom=4,unsharp=5:5:0.6,format=yuv420p" \
		-c:v libx264 -preset slow -crf 15 -c:a copy "$3"
	rm -rf "$t"
	;;
lenta)
	f=$4
	ffmpeg -v error -y -i "$2" -an -vf "minterpolate=fps=$(python3 -c "print(30*$f)"):mi_mode=mci:mc_mode=aobmc:vsbmc=1,setpts=$f*PTS,fps=30,format=yuv420p" \
		-c:v libx264 -preset slow -crf 15 "$3"
	;;
grano)
	ffmpeg -v error -y -i "$2" -vf "noise=c0s=${4:-6}:c0f=t+u,format=yuv420p" -c:v libx264 -preset slow -crf 15 -c:a copy "$3"
	;;
limpiar-voz)
	[[ -x $DF ]] || { echo "Falta DeepFilterNet: ejecuta bash scripts/setup.sh"; exit 1; }
	t=$(mktemp -d)
	ffmpeg -v error -y -i "$2" -map 0:a:0 -ac 1 -ar 48000 -af highpass=f=100 -c:a pcm_s16le "$t/voz.wav"
	"$DF" -D -a "${4:-40}" -o "$t/df" "$t/voz.wav" >/dev/null 2>&1
	ffmpeg -v error -y -i "$2" -i "$t/df/voz.wav" -map 0:v? -map 1:a -c:v copy \
		-af "highpass=f=110,equalizer=f=280:t=q:w=1.2:g=-2.5,equalizer=f=3500:t=q:w=1.0:g=2.5,acompressor=threshold=-24dB:ratio=3:attack=8:release=120:makeup=2" \
		-c:a aac -b:a 256k "$3"
	rm -rf "$t"
	;;
normalizar)
	l=${4:--14}
	m=$(ffmpeg -i "$2" -af "loudnorm=I=$l:TP=-1.5:LRA=11:print_format=json" -f null - 2>&1 | sed -n '/{/,/}/p')
	g=$(python3 -c "import json,sys; d=json.loads(sys.argv[1]); print(f\"measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}\")" "$m")
	ffmpeg -v error -y -i "$2" -c:v copy -af "loudnorm=I=$l:TP=-1.5:LRA=11:$g:linear=true,aresample=48000" -c:a aac -b:a 256k "$3"
	;;
entregar)
	in=$2 out=$3 mb=${4:-95}
	ffmpeg -v error -y -i "$in" -c:v libx264 -preset slow -crf 17 -profile:v high -pix_fmt yuv420p -c:a aac -b:a 256k -movflags +faststart "$out"
	size=$(( $(stat -c %s "$out") / 1048576 ))
	if (( size > mb )); then
		d=$(dur "$in")
		kb=$(python3 -c "print(int(($mb*8*1024*0.97)/$d - 256))")
		t=$(mktemp -d)
		ffmpeg -v error -y -i "$in" -c:v libx264 -preset slow -b:v ${kb}k -pass 1 -passlogfile "$t/p" -an -f null /dev/null
		ffmpeg -v error -y -i "$in" -c:v libx264 -preset slow -b:v ${kb}k -pass 2 -passlogfile "$t/p" -profile:v high -pix_fmt yuv420p \
			-c:a aac -b:a 256k -movflags +faststart "$out"
		rm -rf "$t"
	fi
	ffmpeg -v error -y -i "$out" -vf scale=540:-2 -c:v libx264 -crf 27 -preset slow -c:a aac -b:a 128k -movflags +faststart "${out%.mp4}-preview.mp4"
	ls -la "$out" "${out%.mp4}-preview.mp4"
	;;
revisar)
	in=$2
	ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate:format=duration,size -of compact "$in"
	ffmpeg -i "$in" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tail -2
	n=$(python3 -c "import math; print(math.ceil($(dur "$in")))")
	ffmpeg -v error -y -i "$in" -vf "fps=1,scale=180:-1,drawtext=text='%{pts\:hms}':x=4:y=4:fontsize=16:fontcolor=yellow:box=1,tile=10x$(( (n + 9) / 10 ))" -frames:v 1 "${in%.*}-hoja.jpg"
	echo "Hoja de contactos: ${in%.*}-hoja.jpg"
	;;
*) ayuda ;;
esac
