#!/usr/bin/env node
// Video crudo -> Reel terminado, en un solo comando:
//   1. FFmpeg: formato vertical 1080x1920 a 30 fps y audio limpio a -14 LUFS
//   2. FFmpeg: jump cuts (quita silencios), salvo con --sin-cortes
//   3. Whisper: subtítulos palabra por palabra
//   4. Remotion: gancho + subtítulos animados + barra de progreso + cierre con CTA
//
// Uso:
//   npm run reel -- input/video.mp4 --hook "Texto del gancho" --cta "¿Quieres el método?" \
//     [--sub "Escríbeme MÉTODO"] [--handle @raquelmendoza.ia] [--hook-top 780] \
//     [--sin-cortes] [--sin-cierre] [--sin-progreso] [--musica input/musica.mp3] [--out out/mi-reel.mp4]

import {execFileSync} from 'node:child_process';
import {copyFileSync, existsSync, mkdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const flag = (name) => {
	const i = argv.indexOf(name);
	return i === -1 ? undefined : argv.splice(i, 2)[1];
};
const bool = (name) => {
	const i = argv.indexOf(name);
	if (i !== -1) argv.splice(i, 1);
	return i !== -1;
};

const hook = flag('--hook') ?? '';
const cta = flag('--cta') ?? '¿Quieres saber más?';
const ctaSub = flag('--sub') ?? '';
const handle = flag('--handle') ?? '@raquelmendoza.ia';
const hookTop = Number(flag('--hook-top') ?? 780);
const music = flag('--musica');
const outArg = flag('--out');
const noCuts = bool('--sin-cortes');
const noEnd = bool('--sin-cierre');
const noProgress = bool('--sin-progreso');
const [input] = argv;
if (!input || !existsSync(input)) {
	console.error('Uso: npm run reel -- <video> --hook "..." --cta "..." (ver encabezado de scripts/reel.mjs)');
	process.exit(1);
}

const name = path.basename(input).replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-');
const work = path.join(root, 'public', 'work', name);
mkdirSync(work, {recursive: true});
const run = (cmd, args) => execFileSync(cmd, args, {stdio: 'inherit', cwd: root});
const ff = path.join(root, 'scripts', 'ff.sh');

console.error('\n1/4  Formato vertical y audio...');
run(ff, ['vertical', path.resolve(input), path.join(work, '1-vertical.mp4')]);
run(ff, ['audio', path.join(work, '1-vertical.mp4'), path.join(work, '2-audio.mp4')]);

let current = path.join(work, '2-audio.mp4');
if (!noCuts) {
	console.error('\n2/4  Jump cuts...');
	run(ff, ['silencios', current, path.join(work, '3-cortes.mp4')]);
	current = path.join(work, '3-cortes.mp4');
} else {
	console.error('\n2/4  Sin jump cuts');
}
if (music) {
	run(ff, ['musica', current, path.resolve(music), path.join(work, '4-musica.mp4')]);
}
const finalSrc = path.join(work, 'final.mp4');
copyFileSync(music ? path.join(work, '4-musica.mp4') : current, finalSrc);

console.error('\n3/4  Transcribiendo...');
// Se transcribe la versión sin música para que Whisper solo oiga la voz
run('node', [path.join(root, 'scripts', 'transcribe.mjs'), current, path.join(work, 'captions')]);

const duration = Number(
	execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', finalSrc]).toString().trim(),
);

console.error('\n4/4  Renderizando con Remotion...');
const out = path.resolve(outArg ?? path.join(root, 'out', `${name}-reel.mp4`));
const props = {
	video: `work/${name}/final.mp4`,
	captionsFile: `work/${name}/captions.json`,
	durationInSeconds: duration,
	hook,
	hookTop,
	cta: noEnd ? '' : cta,
	ctaSub,
	handle,
	showProgress: !noProgress,
};
run('npx', ['remotion', 'render', 'Reel', out, `--props=${JSON.stringify(props)}`]);
console.error(`\nReel listo: ${out}\nSubtítulos SRT: ${path.join(work, 'captions.srt')}`);
