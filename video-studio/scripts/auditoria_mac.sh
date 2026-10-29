#!/usr/bin/env bash
# Auditoría de la Mac de Raquel: SOLO LEE (no instala, no borra, no cambia nada).
# Uso (en Terminal, dentro de ~/Documents/brand-audit/video-studio):
#   bash scripts/auditoria_mac.sh > ~/Desktop/auditoria-mac.txt
# y comparte ese archivo para que Claude vea qué hay instalado.
v() { command -v "$1" >/dev/null 2>&1 && { "$@" 2>&1 | head -1; } || echo "no instalado"; }
echo "== Equipo"
sw_vers 2>/dev/null | tr '\n' ' '; echo
echo "Procesador: $(sysctl -n machdep.cpu.brand_string 2>/dev/null) · núcleos: $(sysctl -n hw.ncpu 2>/dev/null)"
echo "RAM: $(( $(sysctl -n hw.memsize 2>/dev/null || echo 0) / 1073741824 )) GB"
echo "Disco libre: $(df -h ~ | awk 'NR==2{print $4}')"
echo "== Herramientas"
echo "Homebrew: $(v brew --version)"
echo "Node: $(v node --version) · npm: $(v npm --version)"
echo "Python: $(v python3 --version) · pip: $(v pip3 --version | cut -d' ' -f1-2) · uv: $(v uv --version)"
echo "FFmpeg: $(v ffmpeg -version | cut -d' ' -f1-3)"
echo "Git: $(v git --version)"
echo "Claude Code: $(v claude --version)"
echo "Remotion del proyecto: $(node -p "require('./node_modules/remotion/package.json').version" 2>/dev/null || echo 'sin node_modules (ejecuta npm ci)')"
echo "== CapCut"
APP=$(ls -d /Applications/CapCut*.app 2>/dev/null | head -1)
echo "App: ${APP:-no encontrada en /Applications}"
[[ -n $APP ]] && echo "Versión: $(defaults read "$APP/Contents/Info" CFBundleShortVersionString 2>/dev/null)"
P=~/Movies/CapCut/User\ Data/Projects/com.lveditor.draft
echo "Carpeta de proyectos: $([[ -d $P ]] && echo "$P ($(ls "$P" | wc -l | tr -d ' ') elementos)" || echo 'no encontrada (mira CapCut > Configuración > Proyectos)')"
echo "CapCut abierto ahora: $(pgrep -x CapCut >/dev/null && echo sí || echo no)"
echo "== Claude Code / MCP"
for f in ~/.claude.json ~/.claude/settings.json .mcp.json ../.mcp.json; do
	[[ -f $f ]] && echo "$f: $(python3 -c "import json,sys; d=json.load(open(sys.argv[1])); print('servidores MCP:', ', '.join(d.get('mcpServers', {})) or 'ninguno')" "$f" 2>/dev/null)"
done
echo "== Python del estudio"
[[ -x .venv-ia/bin/python ]] && .venv-ia/bin/python -c "import faster_whisper, scenedetect, cv2, librosa; print('.venv-ia OK')" 2>/dev/null || echo ".venv-ia no instalado (bash scripts/setup.sh)"
