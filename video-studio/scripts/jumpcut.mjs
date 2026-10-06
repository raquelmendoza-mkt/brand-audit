#!/usr/bin/env node
// Jump cuts automáticos: detecta los silencios con FFmpeg y los elimina,
// dejando un pequeño margen para que los cortes no se sientan bruscos.
//
// Uso: node scripts/jumpcut.mjs <entrada> <salida> [umbral_dB=-35] [silencio_min_seg=0.4]

import {execFileSync, spawnSync} from 'node:child_process';

const [input, output, thresholdArg = '-35', minArg = '0.4'] = process.argv.slice(2);
if (!input || !output) {
	console.error('Uso: node scripts/jumpcut.mjs <entrada> <salida> [umbral_dB] [silencio_min_seg]');
	process.exit(1);
}
const PAD = 0.12; // segundos de aire que se conservan a cada lado de un corte

const duration = Number(
	execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', input]).toString().trim(),
);
const detect = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', input, '-af', `silencedetect=noise=${thresholdArg}dB:d=${minArg}`, '-f', 'null', '-'], {
	encoding: 'utf8',
});
const silences = [];
let start = null;
for (const line of detect.stderr.split('\n')) {
	const s = line.match(/silence_start: (-?[\d.]+)/);
	const e = line.match(/silence_end: ([\d.]+)/);
	if (s) start = Math.max(0, Number(s[1]));
	if (e && start !== null) {
		silences.push([start, Number(e[1])]);
		start = null;
	}
}
if (start !== null) silences.push([start, duration]);

// Segmentos con voz = lo que queda entre silencios, con margen
const keep = [];
let cursor = 0;
for (const [s, e] of silences) {
	const segEnd = Math.min(duration, s + PAD);
	if (segEnd - cursor > 0.05) keep.push([cursor, segEnd]);
	cursor = Math.max(cursor, e - PAD);
}
if (duration - cursor > 0.05) keep.push([cursor, duration]);

if (keep.length === 0) {
	console.error('Todo el audio está por debajo del umbral. Prueba un umbral más bajo, p. ej. -45.');
	process.exit(1);
}

const kept = keep.reduce((a, [s, e]) => a + (e - s), 0);
console.error(`${silences.length} silencios encontrados. Duración: ${duration.toFixed(1)} s -> ${kept.toFixed(1)} s`);

let filter = '';
keep.forEach(([s, e], i) => {
	filter += `[0:v]trim=start=${s.toFixed(3)}:end=${e.toFixed(3)},setpts=PTS-STARTPTS[v${i}];`;
	filter += `[0:a]atrim=start=${s.toFixed(3)}:end=${e.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st=${Math.max(0, e - s - 0.02).toFixed(3)}:d=0.02[a${i}];`;
});
filter += keep.map((_, i) => `[v${i}][a${i}]`).join('') + `concat=n=${keep.length}:v=1:a=1[v][a]`;

execFileSync(
	'ffmpeg',
	['-hide_banner', '-loglevel', 'error', '-stats', '-y', '-i', input, '-filter_complex', filter, '-map', '[v]', '-map', '[a]',
		'-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', output],
	{stdio: 'inherit'},
);
console.error(`Listo: ${output}`);
