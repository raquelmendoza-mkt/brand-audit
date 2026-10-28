// Efectos y tipografía cinética del editor: subtítulos karaoke, texto cinético palabra a palabra,
// resaltador, subrayado / círculo / flecha dibujados a mano, sacudida de cámara, barra de progreso,
// notificación tipo iPhone, burbuja de comentario, marco de celular, destello de luz WebGL y
// desenfoque de movimiento. Tiempos en segundos del reel. Ficha: skill editor-video, kit.md.
import {CameraMotionBlur} from '@remotion/motion-blur';
import {LightLeak} from '@remotion/light-leaks';
import {noise2D} from '@remotion/noise';
import {evolvePath} from '@remotion/paths';
import {AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {FUENTES} from '../fonts';
import {clamp, ease} from './Kit';

// ---------------------------------------------------------------------------
// Subtítulos karaoke (palabra activa resaltada)
// ---------------------------------------------------------------------------
/** Palabra con tiempos en segundos del reel (convierte la salida de transcribe.mjs con `palabrasDe`). */
export type Palabra = {readonly texto: string; readonly ini: number; readonly fin: number};

/** JSON de scripts/transcribe.mjs ({text,startMs,endMs}) -> Palabra[], con desfase opcional. */
export const palabrasDe = (json: {text: string; startMs: number; endMs: number}[], desfase = 0): Palabra[] =>
	json.map((w) => ({texto: w.text.trim(), ini: w.startMs / 1000 + desfase, fin: w.endMs / 1000 + desfase}));

/** Agrupa palabras en frases cortas (máx. `max` palabras o corte en pausas > 0.35 s / puntuación). */
export const frases = (ps: Palabra[], max = 4): Palabra[][] => {
	const out: Palabra[][] = [];
	let cur: Palabra[] = [];
	ps.forEach((p, i) => {
		cur.push(p);
		const sig = ps[i + 1];
		if (cur.length >= max || !sig || sig.ini - p.fin > 0.35 || /[.,;:?!]$/.test(p.texto)) {
			out.push(cur);
			cur = [];
		}
	});
	return out;
};

export type EstiloSubtitulo = 'hormozi' | 'caja' | 'minimal' | 'lujo' | 'neon';

const ESTILOS_SUB: Record<EstiloSubtitulo, {fuente: string; peso: number; tam: number; mayus: boolean; color: string; activo: string; caja?: string}> = {
	// Mayúsculas gruesas, palabra activa amarilla y más grande (estilo viral)
	hormozi: {fuente: FUENTES.montserrat, peso: 900, tam: 72, mayus: true, color: '#FFFFFF', activo: '#FFD84D'},
	// Palabra activa dentro de una caja de color (TikTok)
	caja: {fuente: FUENTES.poppins, peso: 800, tam: 64, mayus: false, color: '#FFFFFF', activo: '#FFFFFF', caja: '#7B6FE8'},
	// Minúsculas limpias, activa en blanco, resto atenuado (educativo, elegante)
	minimal: {fuente: FUENTES.inter, peso: 600, tam: 54, mayus: false, color: 'rgba(255,255,255,0.55)', activo: '#FFFFFF'},
	// Serif con cursiva en la activa (lujo)
	lujo: {fuente: FUENTES.cormorant, peso: 500, tam: 66, mayus: false, color: 'rgba(255,255,255,0.75)', activo: '#F3D79A'},
	// Brillo cian (tech / IA)
	neon: {fuente: FUENTES.spaceGrotesk, peso: 700, tam: 60, mayus: true, color: 'rgba(255,255,255,0.7)', activo: '#2EE6D6'},
};

export const SubtitulosKaraoke: React.FC<{
	readonly palabras: Palabra[];
	readonly estilo?: EstiloSubtitulo;
	readonly y?: number;
	readonly maxPalabras?: number;
	readonly claves?: string[]; // palabras que siempre van en color de acento (cifras, marca)
}> = ({palabras, estilo = 'hormozi', y = 1330, maxPalabras = 3, claves = []}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const grupo = frases(palabras, maxPalabras).find((g) => t >= g[0].ini - 0.05 && t < g[g.length - 1].fin + 0.15);
	if (!grupo) return null;
	const e = ESTILOS_SUB[estilo];
	const k0 = frame - Math.round(grupo[0].ini * fps);
	const pop = interpolate(k0, [0, 6], [0.82, 1], {...clamp, easing: Easing.out(Easing.back(2.4))});
	return (
		<div style={{position: 'absolute', left: 70, right: 70, top: y, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: ESTILOS_SUB[estilo].tam * 0.3, scale: String(pop)}}>
			{grupo.map((p, i) => {
				const activa = t >= p.ini && t < p.fin + 0.05;
				const clave = claves.some((c) => p.texto.toLowerCase().includes(c.toLowerCase()));
				const k = frame - Math.round(p.ini * fps);
				const s = activa ? interpolate(k, [0, 4], [1, estilo === 'hormozi' ? 1.12 : 1.04], clamp) : 1;
				const txt = e.mayus ? p.texto.toUpperCase() : p.texto;
				return (
					<span
						key={i}
						style={{
							fontFamily: e.fuente,
							fontWeight: e.peso,
							fontSize: e.tam,
							lineHeight: 1.15,
							fontStyle: estilo === 'lujo' && activa ? 'italic' : 'normal',
							color: activa || clave ? e.activo : e.color,
							scale: String(s),
							padding: e.caja ? '0 0.18em' : 0,
							borderRadius: 14,
							background: e.caja && activa ? e.caja : 'transparent',
							textShadow: estilo === 'neon' && activa ? `0 0 18px ${e.activo}, 0 0 40px ${e.activo}` : '0 3px 0 rgba(0,0,0,0.85), 0 0 14px rgba(0,0,0,0.7)',
							WebkitTextStroke: estilo === 'hormozi' ? '2px rgba(0,0,0,0.9)' : undefined,
							paintOrder: 'stroke fill',
						}}
					>
						{txt}
					</span>
				);
			})}
		</div>
	);
};

// ---------------------------------------------------------------------------
// Texto cinético: cada palabra entra con su propia animación (ganchos, frases potentes)
// ---------------------------------------------------------------------------
export const TextoCinetico: React.FC<{
	readonly from: number;
	readonly to: number;
	readonly texto: string;
	readonly y: number;
	readonly fuente?: string;
	readonly tam?: number;
	readonly color?: string;
	readonly acento?: string;
	readonly destacar?: string[]; // palabras que entran más grandes y en color de acento
	readonly cadencia?: number; // segundos entre palabras
}> = ({from, to, texto, y, fuente = FUENTES.anton, tam = 120, color = '#FFFFFF', acento = '#FFD84D', destacar = [], cadencia = 0.12}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const a = Math.round(from * fps);
	const b = Math.round(to * fps);
	if (frame < a || frame >= b) return null;
	const out = interpolate(frame, [b - 6, b], [1, 0], clamp);
	const palabras = texto.split(' ');
	const tipos = ['arriba', 'escala', 'giro', 'izquierda'] as const;
	return (
		<div style={{position: 'absolute', left: 70, right: 70, top: y, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: tam * 0.25, opacity: out}}>
			{palabras.map((w, i) => {
				const k = frame - a - Math.round(i * cadencia * fps);
				const p = interpolate(k, [0, 9], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.8))});
				const d = destacar.some((x) => w.toLowerCase().includes(x.toLowerCase()));
				const tipo = tipos[i % tipos.length];
				const fx: React.CSSProperties =
					tipo === 'arriba'
						? {translate: `0px ${(1 - p) * 80}px`}
						: tipo === 'escala'
							? {scale: String(0.2 + 0.8 * p)}
							: tipo === 'giro'
								? {rotate: `${(1 - p) * -25}deg`, translate: `0px ${(1 - p) * 40}px`}
								: {translate: `${(1 - p) * -90}px 0px`};
				return (
					<span key={i} style={{display: 'inline-block', fontFamily: fuente, fontSize: d ? tam * 1.25 : tam, lineHeight: 1.05, color: d ? acento : color, opacity: interpolate(k, [0, 3], [0, 1], clamp), textShadow: '0 6px 24px rgba(0,0,0,0.45)', ...fx}}>
						{w.toUpperCase()}
					</span>
				);
			})}
		</div>
	);
};

// ---------------------------------------------------------------------------
// Marcas dibujadas a mano: resaltador, subrayado, círculo y flecha
// ---------------------------------------------------------------------------
/** Resaltador que barre detrás de un texto (pon el texto encima, mismo left/top/ancho). */
export const Resaltador: React.FC<{readonly from: number; readonly to: number; readonly x: number; readonly y: number; readonly ancho: number; readonly alto?: number; readonly color?: string}> = ({
	from,
	to,
	x,
	y,
	ancho,
	alto = 70,
	color = 'rgba(255,216,77,0.85)',
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const a = Math.round(from * fps);
	const b = Math.round(to * fps);
	if (frame < a || frame >= b) return null;
	const w = interpolate(frame - a, [0, 10], [0, ancho], {...clamp, easing: ease});
	return <div style={{position: 'absolute', left: x, top: y, width: w, height: alto, background: color, borderRadius: '6px 18px 10px 22px', rotate: '-1.2deg', opacity: interpolate(frame, [b - 6, b], [1, 0], clamp)}} />;
};

type Dibujo = 'subrayado' | 'circulo' | 'flecha' | 'check' | 'equis';
const TRAZOS: Record<Dibujo, {d: string; vb: string}> = {
	subrayado: {d: 'M5 30 C 80 18, 160 26, 240 20 S 380 14, 395 24', vb: '0 0 400 40'},
	circulo: {d: 'M200 20 C 330 18, 390 70, 380 110 C 368 165, 250 185, 170 178 C 70 170, 10 130, 18 92 C 28 45, 110 22, 215 26', vb: '0 0 400 200'},
	flecha: {d: 'M20 180 C 60 90, 140 40, 250 50 M 250 50 L 215 28 M 250 50 L 222 82', vb: '0 0 280 200'},
	check: {d: 'M20 110 L 85 170 L 230 30', vb: '0 0 250 200'},
	equis: {d: 'M30 30 L 220 190 M 220 30 L 30 190', vb: '0 0 250 220'},
};

/** Trazo hecho "a mano" que se dibuja: subrayar, encerrar en círculo, señalar con flecha, check o equis. */
export const TrazoMano: React.FC<{
	readonly tipo: Dibujo;
	readonly from: number;
	readonly to: number;
	readonly x: number;
	readonly y: number;
	readonly ancho: number;
	readonly color?: string;
	readonly grosor?: number;
	readonly rotar?: number;
}> = ({tipo, from, to, x, y, ancho, color = '#FFD84D', grosor = 9, rotar = 0}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const a = Math.round(from * fps);
	const b = Math.round(to * fps);
	if (frame < a || frame >= b) return null;
	const {d, vb} = TRAZOS[tipo];
	const [, , w, h] = vb.split(' ').map(Number);
	const p = interpolate(frame - a, [0, 14], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const ev = evolvePath(p, d);
	return (
		<svg viewBox={vb} style={{position: 'absolute', left: x, top: y, width: ancho, height: (ancho * h) / w, overflow: 'visible', rotate: `${rotar}deg`, opacity: interpolate(frame, [b - 6, b], [1, 0], clamp), filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.35))'}}>
			<path d={d} fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
		</svg>
	);
};

// ---------------------------------------------------------------------------
// Movimiento de cámara: sacudida (impactos) y desenfoque de movimiento real
// ---------------------------------------------------------------------------
/** Desplazamiento orgánico de sacudida alrededor de `at` (úsalo en translate/rotate de la toma). */
export const sacudida = (frame: number, fps: number, at: number, fuerza = 18, segundos = 0.35): React.CSSProperties => {
	const k = frame - Math.round(at * fps);
	if (k < 0 || k > segundos * fps) return {};
	const amort = 1 - k / (segundos * fps);
	return {translate: `${noise2D('x', k * 0.6, 0) * fuerza * amort}px ${noise2D('y', 0, k * 0.6) * fuerza * amort}px`, rotate: `${noise2D('r', k * 0.5, 1) * 1.2 * amort}deg`};
};

/** Desenfoque de movimiento de cámara real (promedia sub-fotogramas). Envuelve SOLO lo que se mueve rápido. */
export const DesenfoqueMovimiento: React.FC<{readonly children: React.ReactNode; readonly obturador?: number; readonly muestras?: number}> = ({children, obturador = 180, muestras = 8}) => (
	<CameraMotionBlur shutterAngle={obturador} samples={muestras}>
		{children}
	</CameraMotionBlur>
);

/** Destello de luz orgánico (WebGL de @remotion/light-leaks). Ponlo en el corte: crece y se retira. */
export const LuzOrganica: React.FC<{readonly at: number; readonly segundos?: number; readonly semilla?: number; readonly tono?: number}> = ({at, segundos = 1.2, semilla = 3, tono = 0}) => {
	const {fps} = useVideoConfig();
	return (
		<Sequence from={Math.round((at - segundos / 2) * fps)} durationInFrames={Math.round(segundos * fps)}>
			<AbsoluteFill style={{mixBlendMode: 'screen', pointerEvents: 'none'}}>
				<LightLeak seed={semilla} hueShift={tono} />
			</AbsoluteFill>
		</Sequence>
	);
};

// ---------------------------------------------------------------------------
// Interfaz de redes: barra de progreso, notificación, comentario, celular
// ---------------------------------------------------------------------------
/** Barra de progreso fina arriba (retención: el espectador ve cuánto falta). */
export const BarraProgreso: React.FC<{readonly color?: string; readonly y?: number; readonly alto?: number}> = ({color = '#FFFFFF', y = 0, alto = 8}) => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	return (
		<div style={{position: 'absolute', top: y, left: 0, right: 0, height: alto, background: 'rgba(255,255,255,0.2)'}}>
			<div style={{width: `${(frame / durationInFrames) * 100}%`, height: '100%', background: color}} />
		</div>
	);
};

/** Notificación tipo iPhone que baja desde arriba (WhatsApp, Instagram, banco...). */
export const Notificacion: React.FC<{
	readonly from: number;
	readonly to: number;
	readonly app: string;
	readonly titulo: string;
	readonly texto: string;
	readonly icono?: React.ReactNode;
	readonly colorIcono?: string;
	readonly y?: number;
}> = ({from, to, app, titulo, texto, icono, colorIcono = '#25D366', y = 270}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const a = Math.round(from * fps);
	const b = Math.round(to * fps);
	if (frame < a || frame >= b) return null;
	const dy = interpolate(frame, [a, a + 12, b - 8, b], [-260, 0, 0, -260], {...clamp, easing: ease});
	return (
		<div style={{position: 'absolute', top: y, left: 50, right: 50, translate: `0px ${dy}px`}}>
			<div style={{display: 'flex', gap: 26, alignItems: 'center', padding: '28px 32px', borderRadius: 44, background: 'rgba(245,245,247,0.88)', backdropFilter: 'blur(20px)', boxShadow: '0 20px 50px rgba(0,0,0,0.35)'}}>
				<div style={{width: 96, height: 96, borderRadius: 24, background: colorIcono, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>{icono}</div>
				<div style={{flex: 1, fontFamily: FUENTES.inter, color: '#111'}}>
					<div style={{display: 'flex', justifyContent: 'space-between', fontSize: 30, color: '#6b6b70'}}>
						<span>{app.toUpperCase()}</span>
						<span>ahora</span>
					</div>
					<div style={{fontSize: 40, fontWeight: 700, marginTop: 4}}>{titulo}</div>
					<div style={{fontSize: 36, marginTop: 2, color: '#333'}}>{texto}</div>
				</div>
			</div>
		</div>
	);
};

/** Comentario de Instagram que aparece y se escribe solo ("Comenta VIÑEDO"). */
export const Comentario: React.FC<{readonly from: number; readonly to: number; readonly usuario: string; readonly texto: string; readonly y?: number; readonly avatar?: string}> = ({
	from,
	to,
	usuario,
	texto,
	y = 1180,
	avatar = 'linear-gradient(135deg,#F58529,#DD2A7B,#8134AF)',
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const a = Math.round(from * fps);
	const b = Math.round(to * fps);
	if (frame < a || frame >= b) return null;
	const n = Math.min(texto.length, Math.max(0, Math.floor((frame - a - 8) / 2.5)));
	const pop = interpolate(frame, [a, a + 10], [0.6, 1], {...clamp, easing: Easing.out(Easing.back(2))});
	return (
		<div style={{position: 'absolute', top: y, left: 80, right: 80, display: 'flex', justifyContent: 'center', scale: String(pop), opacity: interpolate(frame, [b - 6, b], [1, 0], clamp)}}>
			<div style={{display: 'flex', gap: 22, alignItems: 'center', padding: '22px 34px', borderRadius: 999, background: '#FFFFFF', boxShadow: '0 16px 40px rgba(0,0,0,0.35)', fontFamily: FUENTES.inter}}>
				<div style={{width: 72, height: 72, borderRadius: 999, background: avatar}} />
				<div>
					<div style={{fontSize: 28, fontWeight: 700, color: '#111'}}>{usuario}</div>
					<div style={{fontSize: 40, color: '#111'}}>
						{texto.slice(0, n)}
						{n < texto.length && frame % 14 < 7 ? '|' : ''}
					</div>
				</div>
			</div>
		</div>
	);
};

/** Marco de celular (iPhone) para mostrar perfiles, apps, WhatsApp o un video dentro del video. */
export const Celular: React.FC<{readonly children: React.ReactNode; readonly x?: number; readonly y?: number; readonly ancho?: number; readonly rotar?: number}> = ({children, x = 540, y = 960, ancho = 620, rotar = 0}) => {
	const alto = ancho * 2.06;
	return (
		<div style={{position: 'absolute', left: x - ancho / 2, top: y - alto / 2, width: ancho, height: alto, rotate: `${rotar}deg`, borderRadius: ancho * 0.14, padding: ancho * 0.035, background: 'linear-gradient(145deg,#2b2b2f,#0d0d10)', boxShadow: '0 40px 90px rgba(0,0,0,0.55), inset 0 0 0 3px #3a3a40'}}>
			<div style={{position: 'relative', width: '100%', height: '100%', borderRadius: ancho * 0.11, overflow: 'hidden', background: '#000'}}>
				{children}
				<div style={{position: 'absolute', top: ancho * 0.03, left: '50%', translate: '-50% 0px', width: ancho * 0.3, height: ancho * 0.075, borderRadius: 999, background: '#000'}} />
			</div>
		</div>
	);
};
