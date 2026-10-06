#!/usr/bin/env bash
# Kit de edición con FFmpeg. Uso: scripts/ff.sh <comando> [argumentos]
# Ejecuta `scripts/ff.sh ayuda` para ver todos los comandos.
set -euo pipefail

FF=(ffmpeg -hide_banner -loglevel error -stats -y)
# Calidad de entrega para redes: H.264 + AAC, compatible con Instagram, TikTok, YouTube y WhatsApp
ENC=(-c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -movflags +faststart)

die() { echo "Error: $*" >&2; exit 1; }
need() { [[ $# -ge 1 && -n "${1:-}" ]] || die "faltan argumentos. Ejecuta: scripts/ff.sh ayuda"; }
dur() { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }

cmd="${1:-ayuda}"; shift || true
case "$cmd" in

info) # info <video>  -> duración, resolución, fps, códecs, volumen
	need "${1:-}"
	ffprobe -v error -show_entries format=duration,size,bit_rate:stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels -of default=nw=1 "$1"
	ffmpeg -hide_banner -nostats -i "$1" -af ebur128=framelog=quiet -f null - 2>&1 | grep -E "I:|LRA:|Peak:" | sed 's/^ */loudness /' || true
	;;

cortar) # cortar <entrada> <inicio> <fin> <salida>   (tiempos como 00:01:05.5 o 65.5; corte exacto)
	need "${4:-}"
	"${FF[@]}" -i "$1" -ss "$2" -to "$3" "${ENC[@]}" "$4"
	;;

vertical) # vertical <entrada> <salida> [centro|desenfoque]  -> 1080x1920 30 fps
	need "${2:-}"
	modo="${3:-centro}"
	if [[ $modo == desenfoque ]]; then
		# Video horizontal completo sobre un fondo desenfocado de sí mismo
		vf="[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=30:5,eq=brightness=-0.08[bg];[0:v]scale=1080:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,fps=30,format=yuv420p[v]"
	else
		vf="[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,format=yuv420p[v]"
	fi
	"${FF[@]}" -i "$1" -filter_complex "$vf" -map "[v]" -map 0:a? "${ENC[@]}" "$2"
	;;

cuadrado) # cuadrado <entrada> <salida>  -> 1080x1080 (feed)
	need "${2:-}"
	"${FF[@]}" -i "$1" -vf "scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080,fps=30" "${ENC[@]}" "$2"
	;;

horizontal) # horizontal <entrada> <salida>  -> 1920x1080 (YouTube)
	need "${2:-}"
	"${FF[@]}" -i "$1" -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30" "${ENC[@]}" "$2"
	;;

audio) # audio <entrada> <salida>  -> limpia ruido, quita graves de fondo y normaliza a -14 LUFS (estándar de redes)
	need "${2:-}"
	"${FF[@]}" -i "$1" -af "highpass=f=80,afftdn=nf=-25,acompressor=threshold=-20dB:ratio=3:attack=5:release=100,loudnorm=I=-14:TP=-1.5:LRA=11" -c:v copy -c:a aac -b:a 192k -ar 48000 "$2"
	;;

musica) # musica <video> <musica> <salida> [volumen=0.15]  -> música de fondo que baja sola cuando hablas (ducking)
	need "${3:-}"
	vol="${4:-0.15}"
	"${FF[@]}" -i "$1" -stream_loop -1 -i "$2" -filter_complex \
		"[1:a]volume=${vol},afade=t=in:d=1[m];[0:a]asplit=2[voz][sc];[m][sc]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[duck];[voz][duck]amix=inputs=2:duration=first:normalize=0,afade=t=out:st=$(echo "$(dur "$1") - 1.5" | bc):d=1.5[a]" \
		-map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest "$3"
	;;

silencios) # silencios <entrada> <salida> [umbral_dB=-35] [min_seg=0.4]  -> jump cuts: elimina pausas y muletillas silenciosas
	need "${2:-}"
	node "$(dirname "$0")/jumpcut.mjs" "$1" "$2" "${3:--35}" "${4:-0.4}"
	;;

unir) # unir <salida> <video1> <video2> [...]  -> concatena clips (los re-codifica para que siempre funcione)
	need "${3:-}"
	out="$1"; shift
	inputs=(); filt=""; i=0
	for f in "$@"; do inputs+=(-i "$f"); filt+="[$i:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,setsar=1[v$i];[$i:a]aresample=48000[a$i];"; i=$((i+1)); done
	for ((j=0; j<i; j++)); do filt+="[v$j][a$j]"; done
	filt+="concat=n=$i:v=1:a=1[v][a]"
	"${FF[@]}" "${inputs[@]}" -filter_complex "$filt" -map "[v]" -map "[a]" "${ENC[@]}" "$out"
	;;

transicion) # transicion <video1> <video2> <salida> [tipo=fade] [dur=0.5]  -> une dos clips con transición (fade, slideleft, circleopen, wipeleft, dissolve...)
	need "${3:-}"
	t="${4:-fade}"; d="${5:-0.5}"
	off=$(echo "$(dur "$1") - $d" | bc)
	"${FF[@]}" -i "$1" -i "$2" -filter_complex \
		"[0:v]fps=30,format=yuv420p,setsar=1[a0];[1:v]fps=30,format=yuv420p,setsar=1[b0];[a0][b0]xfade=transition=$t:duration=$d:offset=$off[v];[0:a][1:a]acrossfade=d=$d[a]" \
		-map "[v]" -map "[a]" "${ENC[@]}" "$3"
	;;

velocidad) # velocidad <entrada> <salida> <factor>  -> 1.25 = 25% más rápido (mantiene el tono de voz)
	need "${3:-}"
	"${FF[@]}" -i "$1" -filter_complex "[0:v]setpts=PTS/$3[v];[0:a]atempo=$3[a]" -map "[v]" -map "[a]" "${ENC[@]}" "$2"
	;;

subtitulos) # subtitulos <video> <archivo.srt> <salida>  -> quema subtítulos simples (para estilo animado usa Remotion)
	need "${3:-}"
	style="FontName=DejaVu Sans,FontSize=16,Bold=1,PrimaryColour=&H00FAFAFA,OutlineColour=&H000E0E0E,BorderStyle=1,Outline=3,Shadow=0,Alignment=2,MarginV=90"
	"${FF[@]}" -i "$1" -vf "subtitles='$2':force_style='$style'" "${ENC[@]}" "$3"
	;;

logo) # logo <video> <logo.png> <salida> [ancho=180]  -> marca de agua arriba a la derecha
	need "${3:-}"
	"${FF[@]}" -i "$1" -i "$2" -filter_complex "[1:v]scale=${4:-180}:-1,format=rgba,colorchannelmixer=aa=0.85[l];[0:v][l]overlay=W-w-50:60" "${ENC[@]}" "$3"
	;;

foto) # foto <video> <tiempo> <salida.jpg>  -> captura un fotograma (para portadas)
	need "${3:-}"
	"${FF[@]}" -ss "$2" -i "$1" -frames:v 1 -q:v 2 "$3"
	;;

gif) # gif <entrada> <salida.gif> [ancho=540] [fps=12]
	need "${2:-}"
	"${FF[@]}" -i "$1" -vf "fps=${4:-12},scale=${3:-540}:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse" "$2"
	;;

comprimir) # comprimir <entrada> <salida> [crf=26]  -> archivo más liviano (WhatsApp, correo)
	need "${2:-}"
	"${FF[@]}" -i "$1" -c:v libx264 -preset slow -crf "${3:-26}" -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "$2"
	;;

extraer-audio) # extraer-audio <video> <salida.mp3>
	need "${2:-}"
	"${FF[@]}" -i "$1" -vn -c:a libmp3lame -q:a 2 "$2"
	;;

fotos-a-video) # fotos-a-video <carpeta> <salida> [seg_por_foto=3]  -> slideshow vertical con zoom suave (para algo más elaborado usa PropertyPromo)
	need "${2:-}"
	s="${3:-3}"; n=$((s*30))
	tmp=$(mktemp -d); i=0
	for f in "$1"/*.{jpg,jpeg,png,JPG,PNG}; do
		[[ -e $f ]] || continue
		"${FF[@]}" -loop 1 -i "$f" -t "$s" -vf "scale=2160:3840:force_original_aspect_ratio=increase,crop=2160:3840,zoompan=z='min(zoom+0.0008,1.12)':d=$n:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30,format=yuv420p" -c:v libx264 -crf 20 "$tmp/$(printf %03d $i).mp4"
		echo "file '$tmp/$(printf %03d $i).mp4'" >> "$tmp/lista.txt"; i=$((i+1))
	done
	[[ $i -gt 0 ]] || die "no hay fotos .jpg/.png en $1"
	"${FF[@]}" -f concat -safe 0 -i "$tmp/lista.txt" -c copy -movflags +faststart "$2"
	rm -rf "$tmp"
	;;

ayuda|*)
	echo "Kit FFmpeg de RM Marketing IA. Comandos:"
	grep -E '^[a-z-]+\) #' "$0" | sed -E 's/^[a-z-]+\) # /  /'
	;;
esac
