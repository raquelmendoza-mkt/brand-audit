#!/usr/bin/env node
// Transcribe un video o audio con Whisper (local, CPU) y genera:
//   <salida>.json  -> subtítulos palabra por palabra en formato Caption de @remotion/captions
//   <salida>.srt   -> subtítulos por frases, para YouTube/Meta o para quemarlos con FFmpeg
//
// Uso: node scripts/transcribe.mjs <entrada> [salida-sin-extension] [--lang es]

import {execFileSync} from 'node:child_process';
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const MODELS_DIR = path.resolve(here, '..', '.models');
const MODEL = 'Xenova/whisper-small';
const SAMPLE_RATE = 16000;

const args = process.argv.slice(2);
const langIdx = args.indexOf('--lang');
const language = langIdx === -1 ? 'spanish' : args.splice(langIdx, 2)[1];
const [input, outArg] = args;
if (!input) {
	console.error('Uso: node scripts/transcribe.mjs <entrada> [salida] [--lang es]');
	process.exit(1);
}
const out = outArg ?? input.replace(/\.[^.]+$/, '');

// 1. Audio mono a 16 kHz en float32 crudo, que es lo que espera Whisper
const tmp = mkdtempSync(path.join(tmpdir(), 'transcribe-'));
const raw = path.join(tmp, 'audio.f32');
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', input, '-vn', '-ac', '1', '-ar', String(SAMPLE_RATE), '-f', 'f32le', raw]);
const buf = readFileSync(raw);
const audio = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
rmSync(tmp, {recursive: true, force: true});

// 2. Whisper local, sin descargas
const {pipeline, env} = await import('@huggingface/transformers');
env.localModelPath = MODELS_DIR;
env.allowRemoteModels = false;

console.error(`Transcribiendo ${(audio.length / SAMPLE_RATE).toFixed(1)} s de audio (${language})...`);
const asr = await pipeline('automatic-speech-recognition', MODEL, {dtype: 'q8', device: 'cpu'});
const result = await asr(audio, {
	language,
	task: 'transcribe',
	return_timestamps: 'word',
	chunk_length_s: 30,
	stride_length_s: 5,
});

// 3. Formato Caption: cada palabra con un espacio delante, tiempos en ms
const captions = result.chunks
	.filter((c) => c.text.trim() !== '')
	.map((c) => {
		const startMs = Math.round(c.timestamp[0] * 1000);
		const endMs = Math.round((c.timestamp[1] ?? c.timestamp[0] + 0.3) * 1000);
		return {
			text: ' ' + c.text.trim(),
			startMs,
			endMs,
			timestampMs: Math.round((startMs + endMs) / 2),
			confidence: null,
		};
	});
writeFileSync(`${out}.json`, JSON.stringify(captions, null, 2));

// 4. SRT por frases: corta en fin de frase, en comas si ya hay 3 palabras,
//    a las 7 palabras o en pausas largas
const fmt = (ms) => {
	const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
	const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
	const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
	return `${h}:${m}:${s},${String(ms % 1000).padStart(3, '0')}`;
};
const cues = [];
let cur = [];
captions.forEach((c, i) => {
	cur.push(c);
	const next = captions[i + 1];
	if (!next || /[.?!]$/.test(c.text) || (/[,;:]$/.test(c.text) && cur.length >= 3) || cur.length >= 7 || next.startMs - c.endMs > 600) {
		cues.push(cur);
		cur = [];
	}
});
const srt = cues
	.map((cue, i) => `${i + 1}\n${fmt(cue[0].startMs)} --> ${fmt(cue.at(-1).endMs)}\n${cue.map((c) => c.text).join('').trim()}\n`)
	.join('\n');
writeFileSync(`${out}.srt`, srt);

console.error(`Listo: ${captions.length} palabras -> ${out}.json y ${out}.srt`);
console.log(result.text.trim());
