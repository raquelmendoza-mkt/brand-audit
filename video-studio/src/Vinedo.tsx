import {Audio, Video} from '@remotion/media';
import {
	AbsoluteFill,
	Composition,
	Easing,
	Img,
	interpolate,
	random,
	Sequence,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {helvetica, poppins} from './fonts';
import marcas from './vinedo-marcas.json';

// Casa Comercial El Viñedo — reel de Karen siguiendo el guión pieza por pieza.
// La base (solo el guión, sin silencios, voz limpia y pegada a cada toma) la arma
// scripts/vinedo_base.py, que deja la posición de cada pieza en vinedo-marcas.json.
// Aquí todo se coloca con tiempos DEL CLIP ORIGINAL: at('metros', 9.32) = el momento
// en que Karen dice "450" dentro del reel. La música se mezcla después con FFmpeg.

const FPS = 30;
const DURATION = marcas.total;
const W = 'work/vinedo';
const BLUE = '#1C6BEA';
const NAVY = '#0B2A5B';

type Pieza = (typeof marcas.piezas)[number];
const PIEZAS: Pieza[] = marcas.piezas;

// Tiempo del clip original -> tiempo en el reel (si cae en una pausa quitada, va al
// inicio de la pieza siguiente)
const at = (clave: string, s: number): number => {
	const ps = PIEZAS.filter((p) => p.clave === clave);
	if (ps.length === 0) throw new Error(`Toma desconocida: ${clave}`);
	for (const p of ps) {
		if (s < p.a) return p.t;
		if (s <= p.b) return p.t + (s - p.a);
	}
	const last = ps[ps.length - 1];
	return last.t + (last.b - last.a);
};
const fin = (clave: string): number => at(clave, 1e9);

// Segundo zoom en los saltos dentro de una misma toma (jump cut dinámico)
const zoomPieza = (t: number): number => {
	const p = [...PIEZAS].reverse().find((q) => t >= q.t);
	return p && p.k % 2 === 1 ? 1.1 : 1;
};

// Persona recortada (texto DETRÁS de ella) — mismos tramos que generó recorte_persona.py
const CUTOUTS = {
	gancho: {dir: `${W}/persona-gancho`, from: 0, frames: 140},
	ubicacion: {dir: `${W}/persona-ubicacion`, from: 21.9, frames: 48},
	metros: {dir: `${W}/persona-metros`, from: 36.867, frames: 370},
	espacios: {dir: `${W}/persona-espacios`, from: 52.3, frames: 398},
	cta: {dir: `${W}/persona-cta`, from: 65.567, frames: 164},
};

// Subtítulos con tiempos del clip original: [toma, inicio, fin, texto]
const CAPTIONS_SRC: [string, number, number, string][] = [
	['gancho', 1.1, 2.9, 'La próxima inauguración'],
	['gancho', 2.9, 3.86, 'en El Viñedo…'],
	['gancho', 3.86, 5.7, '¡puede ser la de tu negocio!'],
	['cinta', 9.0, 10.6, 'Y aquí lo puedes'],
	['cinta', 10.6, 11.85, 'hacer realidad'],
	['corre', 3.2, 4.95, '¡Ya va! Queremos información'],
	['cuentame', 0.8, 1.88, '¿Me puedes comentar más'],
	['cuentame', 1.88, 2.95, 'sobre esta casa comercial?'],
	['pasa', 1.3, 2.26, '¡Pasa!'],
	['ubicacion', 3.72, 4.6, 'Stefany,'],
	['ubicacion', 4.6, 6.1, 'esta casa comercial'],
	['ubicacion', 6.1, 7.5, 'está muy bien ubicada'],
	['ubicacion', 7.69, 9.5, 'en el corazón de El Viñedo,'],
	['ubicacion', 9.5, 11.3, 'rodeada de restaurantes'],
	['ubicacion', 11.3, 11.85, 'y comercios'],
	['ubicacion', 11.85, 13.23, 'muy reconocidos de la ciudad'],
	['niveles', 2.9, 4.95, 'Sí, como puedes observar,'],
	['niveles', 4.95, 6.92, 'la casa cuenta con dos niveles'],
	['metros', 7.75, 9.3, 'Y aquí tienes'],
	['metros', 9.3, 11.3, '450 metros de terreno'],
	['metros', 11.3, 13.55, 'con 600 metros de construcción'],
	['metros', 13.6, 15.1, 'Esta casa comercial'],
	['metros', 15.1, 16.37, 'está dividida en dos niveles,'],
	['metros', 16.69, 18.5, 'con 14 habitaciones,'],
	['metros', 18.5, 20.36, '10 baños y amplios espacios'],
	['marca', 0.95, 1.9, '¡Me encanta el lugar!'],
	['marca', 1.9, 3.93, 'Aquí podría montar mi casa de marcas'],
	['espacios', 2.75, 4.1, '¡Por supuesto, Stefany!'],
	['espacios', 4.1, 5.85, 'Y no solo tu casa de marcas,'],
	['espacios', 5.95, 7.85, 'aquí también puedes implementar'],
	['espacios', 7.85, 8.85, 'clínica,'],
	['espacios', 8.85, 9.23, 'spa,'],
	['espacios', 9.41, 10.61, 'restaurantes.'],
	['espacios', 10.83, 12.45, 'Y lo mejor de todo,'],
	['espacios', 12.45, 14.0, 'te damos la oportunidad'],
	['espacios', 14.0, 15.35, 'de que alquiles la casa'],
	['espacios', 15.35, 16.37, 'por espacios'],
	['cta', 0.55, 1.95, 'Para cortar la próxima cinta'],
	['cta', 1.95, 2.72, 'de tu negocio,'],
	['cta', 2.85, 4.38, 'comenta la palabra VIÑEDO'],
	['cta', 4.38, 5.75, 'y te envío toda la información'],
];
const CAPTIONS = CAPTIONS_SRC.map(([c, a, b, txt]) => [at(c, a), at(c, b), txt] as const);
const KEYWORDS = ['Viñedo', 'VIÑEDO', '450', '600', '14', '10', 'dos niveles', 'negocio', 'espacios', 'casa de marcas', 'restaurantes', 'realidad', 'inauguración', 'clínica', 'spa'];

// Cortes entre piezas (golpe de zoom) + palabras clave
const PUNCHES = [...PIEZAS.slice(1).map((p) => p.t), at('metros', 9.32), at('metros', 11.76), at('metros', 17.4), at('metros', 18.58), at('cta', 4.02)];

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const usePunchScale = () => {
	const t = useCurrentFrame() / FPS;
	let s = 1;
	for (const p of PUNCHES) {
		if (t >= p && t < p + 0.5) {
			s = interpolate(t, [p, p + 0.35], [1.07, 1], {...clamp, easing: ease});
		}
	}
	return s * zoomPieza(t);
};

const slam = (frame: number, a: number) => ({
	opacity: interpolate(frame, [a, a + 4], [0, 1], clamp),
	scale: interpolate(frame, [a, a + 9], [1.35, 1], {...clamp, easing: ease}),
	filter: `blur(${interpolate(frame, [a, a + 7], [14, 0], clamp)}px)`,
});

const rise = (frame: number, a: number) => ({
	opacity: interpolate(frame, [a, a + 7], [0, 1], clamp),
	translate: interpolate(frame, [a, a + 12], ['0px 30px', '0px 0px'], {...clamp, easing: ease}),
	filter: `blur(${interpolate(frame, [a, a + 8], [8, 0], clamp)}px)`,
});

const shadow = '0 4px 26px rgba(0,0,0,0.45), 0 1px 4px rgba(0,0,0,0.4)';

const Big: React.FC<{
	readonly from: number;
	readonly to: number;
	readonly text: string;
	readonly size: number;
	readonly top: number;
	readonly color?: string;
	readonly glow?: boolean;
}> = ({from, to, text, size, top, color = '#FFFFFF', glow = true}) => {
	const frame = useCurrentFrame();
	const a = Math.round(from * FPS);
	const b = Math.round(to * FPS);
	if (frame < a || frame >= b) return null;
	const s = slam(frame, a);
	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				right: 0,
				top,
				textAlign: 'center',
				fontFamily: poppins,
				fontWeight: 800,
				fontSize: size,
				lineHeight: 1,
				letterSpacing: -size * 0.02,
				color,
				whiteSpace: 'nowrap',
				textShadow: glow ? shadow : '0 6px 30px rgba(11,42,91,0.25)',
				...s,
				opacity: s.opacity * interpolate(frame, [b - 5, b], [1, 0], clamp),
			}}
		>
			{text}
		</div>
	);
};

const Small: React.FC<{
	readonly from: number;
	readonly to: number;
	readonly text: string;
	readonly top: number;
	readonly size?: number;
	readonly color?: string;
	readonly spacing?: number;
}> = ({from, to, text, top, size = 52, color = '#FFFFFF', spacing = 0}) => {
	const frame = useCurrentFrame();
	const a = Math.round(from * FPS);
	const b = Math.round(to * FPS);
	if (frame < a || frame >= b) return null;
	const r = rise(frame, a);
	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				right: 0,
				top,
				textAlign: 'center',
				fontFamily: helvetica,
				fontWeight: 700,
				fontSize: size,
				letterSpacing: spacing,
				color,
				textShadow: color === '#FFFFFF' ? shadow : 'none',
				whiteSpace: 'nowrap',
				...r,
				opacity: r.opacity * interpolate(frame, [b - 5, b], [1, 0], clamp),
			}}
		>
			{text}
		</div>
	);
};

const Cutout: React.FC<{readonly dir: string; readonly from: number; readonly frames: number}> = ({dir, from, frames}) => {
	const frame = useCurrentFrame();
	const k = frame - Math.round(from * FPS);
	if (k < 0 || k >= frames) return null;
	return <Img src={staticFile(`${dir}/${String(k).padStart(4, '0')}.webp`)} style={{position: 'absolute', width: '100%', height: '100%'}} />;
};

const Pill: React.FC<{
	readonly from: number;
	readonly to: number;
	readonly text: string;
	readonly icon: React.ReactNode;
	readonly top: number;
}> = ({from, to, text, icon, top}) => {
	const frame = useCurrentFrame();
	const a = Math.round(from * FPS);
	const b = Math.round(to * FPS);
	if (frame < a || frame >= b) return null;
	const pop = interpolate(frame, [a, a + 10], [0.6, 1], {...clamp, easing: Easing.out(Easing.back(2))});
	const o = interpolate(frame, [a, a + 5, b - 5, b], [0, 1, 1, 0], clamp);
	return (
		<div style={{position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: o}}>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 18,
					padding: '18px 34px',
					borderRadius: 999,
					background: 'rgba(255,255,255,0.95)',
					color: NAVY,
					fontFamily: helvetica,
					fontWeight: 700,
					fontSize: 44,
					boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
					scale: String(pop),
				}}
			>
				{icon}
				{text}
			</div>
		</div>
	);
};

const Ico = {
	pin: (c: string) => (
		<svg width="46" height="46" viewBox="0 0 24 24" fill={c}>
			<path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
		</svg>
	),
	plato: (c: string) => (
		<svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
			<path d="M4 3v7a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3M6 12v9M17 3c-1.7 0-3 2-3 5s1.3 4 3 4v9" />
		</svg>
	),
	tienda: (c: string) => (
		<svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinejoin="round">
			<path d="M3 9l1.5-5h15L21 9M3 9h18M3 9c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3M5 12v8h14v-8M10 20v-5h4v5" />
		</svg>
	),
	chat: (c: string) => (
		<svg width="50" height="50" viewBox="0 0 24 24" fill={c}>
			<path d="M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
		</svg>
	),
};

// Confeti al cortar la cinta
const Confetti: React.FC<{readonly at: number}> = ({at: t0}) => {
	const frame = useCurrentFrame();
	const k = frame - Math.round(t0 * FPS);
	if (k < 0 || k > 70) return null;
	const colors = ['#E8173A', '#F5C542', '#FFFFFF', BLUE, '#FF7BA9'];
	const t = k / FPS;
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{new Array(90).fill(0).map((_, i) => {
				const ang = -Math.PI / 2 + (random(`a${i}`) - 0.5) * 2.4;
				const v = 900 + random(`v${i}`) * 1300;
				const x = 540 + Math.cos(ang) * v * t;
				const y = 1150 + Math.sin(ang) * v * t + 0.5 * 2600 * t * t;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: x,
							top: y,
							width: 14 + random(`w${i}`) * 12,
							height: 8 + random(`h${i}`) * 8,
							background: colors[i % colors.length],
							borderRadius: 2,
							rotate: `${random(`r${i}`) * 2160 * t}deg`,
							opacity: interpolate(k, [0, 3, 55, 70], [0, 1, 1, 0], clamp),
						}}
					/>
				);
			})}
		</AbsoluteFill>
	);
};

// Subtítulos: frase corta con pequeño rebote; palabra clave en amarillo
const Captions: React.FC = () => {
	const frame = useCurrentFrame();
	const t = frame / FPS;
	const cur = CAPTIONS.find(([a, b]) => t >= a && t < b);
	if (!cur) return null;
	const k = frame - Math.round(cur[0] * FPS);
	const s = interpolate(k, [0, 6], [0.85, 1], {...clamp, easing: Easing.out(Easing.back(2.2))});
	const o = interpolate(k, [0, 3], [0, 1], clamp);
	const txt = cur[2];
	const kw = KEYWORDS.find((w) => txt.includes(w));
	const parts = kw ? txt.split(kw) : [txt];
	return (
		<div style={{position: 'absolute', left: 60, right: 60, top: 1395, textAlign: 'center', opacity: o, scale: String(s)}}>
			<span
				style={{
					fontFamily: helvetica,
					fontWeight: 700,
					fontSize: 54,
					lineHeight: 1.2,
					color: '#FFFFFF',
					textShadow: '0 2px 10px rgba(0,0,0,0.85), 0 0 3px rgba(0,0,0,0.9)',
				}}
			>
				{parts[0]}
				{kw ? <span style={{color: '#FFD84D'}}>{kw}</span> : null}
				{kw ? parts.slice(1).join(kw) : null}
			</span>
		</div>
	);
};

// "Comenta VIÑEDO": se escribe letra por letra
const Comment: React.FC<{readonly at: number}> = ({at: t0}) => {
	const frame = useCurrentFrame();
	const a = Math.round(t0 * FPS);
	if (frame < a) return null;
	const word = 'VIÑEDO';
	const n = Math.min(word.length, Math.max(0, Math.floor((frame - a - 8) / 3)));
	const pop = interpolate(frame, [a, a + 10], [0.5, 1], {...clamp, easing: Easing.out(Easing.back(2))});
	return (
		<div style={{position: 'absolute', top: 1560, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 20,
					padding: '22px 40px',
					borderRadius: 30,
					background: '#FFFFFF',
					boxShadow: '0 14px 40px rgba(0,0,0,0.35)',
					scale: String(pop),
					opacity: interpolate(frame, [a, a + 4], [0, 1], clamp),
				}}
			>
				{Ico.chat(BLUE)}
				<span style={{fontFamily: helvetica, fontWeight: 400, fontSize: 46, color: NAVY}}>Comenta</span>
				<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 50, color: BLUE, minWidth: 230}}>
					“{word.slice(0, n)}
					{n < word.length && frame % 16 < 8 ? '|' : ''}”
				</span>
			</div>
		</div>
	);
};

// Destello cálido al entrar a cada render de IA
const Flash: React.FC<{readonly at: number}> = ({at: t0}) => {
	const frame = useCurrentFrame();
	const a = Math.round(t0 * FPS);
	const o = interpolate(frame, [a - 3, a, a + 6], [0, 0.85, 0], clamp);
	return o > 0 ? <AbsoluteFill style={{background: '#FFF8EC', opacity: o}} /> : null;
};

const Sfx: React.FC<{readonly at: number; readonly src: string; readonly volume?: number}> = ({at: t0, src, volume = 0.5}) => (
	<Sequence from={Math.max(0, Math.round(t0 * FPS))} durationInFrames={3 * FPS} name={src}>
		<Audio src={staticFile(src)} volume={volume} />
	</Sequence>
);

// Momentos clave (en el reel)
const T = {
	inaug: at('gancho', 2.12),
	vinedo: at('gancho', 3.18),
	negocio: at('gancho', 4.2),
	tuNegocio: at('gancho', 4.72),
	snip: at('cinta', 8.12),
	dron: at('dron', 0),
	dronAereo: at('dron', 2.4),
	corazon: at('ubicacion', 8.75),
	rest: at('ubicacion', 10.4),
	comercios: at('ubicacion', 11.3),
	dosNiveles: at('niveles', 5.92),
	ia1: at('ia1', 0),
	ia2: at('ia2', 0.2),
	m450: at('metros', 9.32),
	m600: at('metros', 11.76),
	m2niv: at('metros', 15.68),
	m14: at('metros', 17.4),
	m10: at('metros', 18.58),
	casaMarca: at('marca', 3.15),
	clinica: at('espacios', 7.88),
	spa: at('espacios', 8.9),
	restaurantes: at('espacios', 9.45),
	finRest: at('espacios', 10.6),
	alquila: at('espacios', 12.5),
	porEspacios: at('espacios', 15.4),
	comenta: at('cta', 3.0),
	vinedoCta: at('cta', 4.0),
	pill: at('cta', 4.4),
};

export const VinedoComponent: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const scale = usePunchScale();
	const t = frame / fps;
	const end = interpolate(t, [DURATION - 0.3, DURATION], [1, 0], clamp);
	const iaZoom = t >= T.ia1 && t < fin('ia2') ? interpolate(t, [T.ia1, fin('ia2')], [1, 1.08]) : 1;
	const inRange = (a: number, b: number) => t >= a && t < b;

	return (
		<AbsoluteFill style={{background: '#000'}}>
			<AbsoluteFill style={{scale: String(scale * iaZoom), transformOrigin: '50% 40%', opacity: end}}>
				<Video src={staticFile(`${W}/base.mp4`)} premountFor={fps} style={{position: 'absolute', width: '100%', height: '100%'}} />
			</AbsoluteFill>

			<AbsoluteFill style={{opacity: end}}>
				{/* ---------- Títulos DETRÁS de la persona ---------- */}
				<Big from={T.inaug} to={T.vinedo} text="INAUGURACIÓN" size={126} top={905} />
				<Big from={T.vinedo} to={at('gancho', 3.9)} text="EL VIÑEDO" size={150} top={890} />
				<Big from={T.tuNegocio} to={fin('gancho')} text="TU NEGOCIO" size={150} top={890} />

				<Big from={T.corazon} to={T.rest} text="EL VIÑEDO" size={170} top={770} color={BLUE} glow={false} />

				<Big from={T.m450} to={T.m600} text="450 m²" size={250} top={560} color={BLUE} glow={false} />
				<Big from={T.m600} to={T.m2niv} text="600 m²" size={250} top={490} color={BLUE} glow={false} />
				<Big from={T.m2niv} to={T.m14} text="2 NIVELES" size={190} top={450} color={BLUE} glow={false} />
				<Big from={T.m14} to={T.m10} text="14" size={300} top={330} color={BLUE} glow={false} />
				<Big from={T.m10} to={fin('metros')} text="10" size={300} top={320} color={BLUE} glow={false} />

				<Big from={T.clinica} to={T.finRest} text="CLÍNICA" size={130} top={150} color={BLUE} glow={false} />
				<Big from={T.spa} to={T.finRest} text="SPA" size={130} top={280} color={NAVY} glow={false} />
				<Big from={T.restaurantes} to={T.finRest} text="RESTAURANTES" size={100} top={405} color={BLUE} glow={false} />

				<Big from={T.alquila} to={fin('espacios')} text="SE ALQUILA" size={140} top={250} color={BLUE} glow={false} />
				<Big from={T.porEspacios} to={fin('espacios')} text="POR ESPACIOS" size={112} top={400} color={NAVY} glow={false} />

				<Big from={T.vinedoCta} to={DURATION} text="VIÑEDO" size={240} top={500} />

				{/* Persona recortada delante de los títulos (mismo zoom que el video) */}
				<AbsoluteFill style={{scale: String(scale), transformOrigin: '50% 40%'}}>
					{inRange(T.inaug - 0.1, fin('gancho')) ? <Cutout {...CUTOUTS.gancho} /> : null}
					{inRange(T.corazon - 0.1, T.rest) ? <Cutout {...CUTOUTS.ubicacion} /> : null}
					{inRange(T.m450 - 0.1, fin('metros')) ? <Cutout {...CUTOUTS.metros} /> : null}
					{inRange(T.clinica - 0.1, fin('espacios')) ? <Cutout {...CUTOUTS.espacios} /> : null}
					{t >= T.vinedoCta - 0.1 ? <Cutout {...CUTOUTS.cta} /> : null}
				</AbsoluteFill>

				{/* ---------- Textos delante ---------- */}
				<Small from={at('gancho', 1.1)} to={T.vinedo} text="LA PRÓXIMA" top={815} size={58} spacing={8} />
				<Small from={T.vinedo} to={at('gancho', 3.9)} text="en" top={815} size={58} />
				<Small from={T.negocio} to={fin('gancho')} text="puede ser la de" top={810} size={58} />
				<Confetti at={T.snip} />

				{/* Dron con IA */}
				<Small from={T.dron + 0.15} to={T.dronAereo - 0.05} text="CASA COMERCIAL" top={1580} size={50} spacing={12} />
				<Pill from={T.dronAereo} to={fin('dron')} text="El Viñedo · Valencia" icon={Ico.pin('#E8173A')} top={260} />
				<Big from={T.dronAereo + 0.1} to={fin('dron')} text="EL VIÑEDO" size={170} top={1520} />

				<Pill from={T.rest} to={fin('ubicacion')} text="Restaurantes" icon={Ico.plato(BLUE)} top={240} />
				<Pill from={T.comercios} to={fin('ubicacion')} text="Comercios reconocidos" icon={Ico.tienda(BLUE)} top={350} />

				<Big from={T.dosNiveles} to={fin('niveles')} text="2 NIVELES" size={170} top={250} color={BLUE} glow={false} />
				<Small from={T.dosNiveles + 0.15} to={fin('niveles')} text="planta baja + planta alta" top={440} size={50} color={NAVY} />

				<Flash at={T.ia1} />
				<Flash at={T.ia2} />

				<Small from={T.m450 + 0.1} to={T.m600} text="DE TERRENO" top={470} size={50} color={NAVY} spacing={8} />
				<Small from={T.m600 + 0.1} to={T.m2niv} text="DE CONSTRUCCIÓN" top={400} size={50} color={NAVY} spacing={8} />
				<Small from={T.m14 + 0.1} to={T.m10} text="HABITACIONES" top={250} size={56} color={NAVY} spacing={8} />
				<Small from={T.m10 + 0.1} to={fin('metros')} text="BAÑOS" top={240} size={56} color={NAVY} spacing={8} />

				<Small from={T.casaMarca - 0.05} to={fin('marca')} text="Tu" top={250} size={56} />
				<Big from={T.casaMarca} to={fin('marca')} text="CASA DE MARCAS" size={108} top={320} />

				<Small from={T.comenta} to={DURATION} text="Comenta la palabra" top={430} size={56} />
				<Comment at={T.pill} />

				<Captions />
			</AbsoluteFill>

			{/* ---------- Efectos de sonido ---------- */}
			<Sfx at={T.inaug - 0.06} src="sfx/remotion/whip.wav" volume={0.42} />
			<Sfx at={T.inaug} src="sfx/impacto.wav" volume={0.38} />
			<Sfx at={T.vinedo} src="sfx/pop.wav" volume={0.3} />
			<Sfx at={T.tuNegocio - 0.06} src="sfx/remotion/whip.wav" volume={0.42} />
			<Sfx at={fin('gancho') - 0.08} src="sfx/whoosh-corto.wav" volume={0.35} />
			<Sfx at={T.snip - 0.05} src="sfx/remotion/shutter-modern.wav" volume={0.4} />
			<Sfx at={T.snip} src="sfx/impacto.wav" volume={0.45} />
			<Sfx at={T.snip + 0.05} src="sfx/sparkle.wav" volume={0.4} />
			<Sfx at={T.dron - 0.12} src="sfx/whoosh.wav" volume={0.45} />
			<Sfx at={T.dronAereo} src="sfx/remotion/whip.wav" volume={0.4} />
			<Sfx at={T.dronAereo + 0.1} src="sfx/remotion/ding.wav" volume={0.32} />
			<Sfx at={at('corre', 0) - 0.08} src="sfx/whoosh-corto.wav" volume={0.38} />
			<Sfx at={at('cuentame', 0) - 0.05} src="sfx/swipe.wav" volume={0.32} />
			<Sfx at={at('pasa', 0) - 0.06} src="sfx/whoosh-corto.wav" volume={0.32} />
			<Sfx at={at('ubicacion', 0) - 0.06} src="sfx/swipe.wav" volume={0.32} />
			<Sfx at={T.corazon - 0.05} src="sfx/remotion/whip.wav" volume={0.42} />
			<Sfx at={T.corazon} src="sfx/impacto.wav" volume={0.35} />
			<Sfx at={T.rest} src="sfx/pop.wav" volume={0.3} />
			<Sfx at={T.comercios} src="sfx/pop.wav" volume={0.3} />
			<Sfx at={at('niveles', 0) - 0.1} src="sfx/whoosh.wav" volume={0.38} />
			<Sfx at={T.dosNiveles - 0.05} src="sfx/remotion/whip.wav" volume={0.4} />
			<Sfx at={T.dosNiveles} src="sfx/ding.wav" volume={0.28} />
			<Sfx at={T.ia1 - 0.15} src="sfx/whoosh.wav" volume={0.45} />
			<Sfx at={T.ia1 + 0.3} src="sfx/sparkle.wav" volume={0.38} />
			<Sfx at={T.ia2 - 0.12} src="sfx/whoosh-corto.wav" volume={0.4} />
			<Sfx at={T.ia2 + 0.4} src="sfx/sparkle.wav" volume={0.32} />
			<Sfx at={at('metros', 7.69) - 0.12} src="sfx/whoosh.wav" volume={0.4} />
			<Sfx at={T.m450 - 0.05} src="sfx/remotion/whip.wav" volume={0.42} />
			<Sfx at={T.m450} src="sfx/impacto.wav" volume={0.4} />
			<Sfx at={T.m600 - 0.05} src="sfx/remotion/whip.wav" volume={0.42} />
			<Sfx at={T.m600} src="sfx/impacto.wav" volume={0.4} />
			<Sfx at={T.m2niv - 0.05} src="sfx/remotion/whip.wav" volume={0.38} />
			<Sfx at={T.m14} src="sfx/pop.wav" volume={0.33} />
			<Sfx at={T.m14 + 0.03} src="sfx/ding.wav" volume={0.26} />
			<Sfx at={T.m10} src="sfx/pop.wav" volume={0.33} />
			<Sfx at={T.m10 + 0.03} src="sfx/ding.wav" volume={0.26} />
			<Sfx at={at('marca', 0) - 0.08} src="sfx/whoosh-corto.wav" volume={0.36} />
			<Sfx at={T.casaMarca} src="sfx/sparkle.wav" volume={0.33} />
			<Sfx at={at('espacios', 2.69) - 0.1} src="sfx/whoosh.wav" volume={0.38} />
			<Sfx at={T.clinica} src="sfx/pop.wav" volume={0.33} />
			<Sfx at={T.spa} src="sfx/pop.wav" volume={0.33} />
			<Sfx at={T.restaurantes} src="sfx/pop.wav" volume={0.33} />
			<Sfx at={T.alquila - 0.05} src="sfx/remotion/whip.wav" volume={0.42} />
			<Sfx at={T.alquila} src="sfx/impacto.wav" volume={0.38} />
			<Sfx at={T.porEspacios - 0.05} src="sfx/remotion/whip.wav" volume={0.42} />
			<Sfx at={T.porEspacios} src="sfx/impacto.wav" volume={0.36} />
			<Sfx at={at('cta', 0.55) - 0.1} src="sfx/whoosh.wav" volume={0.4} />
			<Sfx at={T.comenta} src="sfx/pop.wav" volume={0.28} />
			<Sfx at={T.vinedoCta - 0.06} src="sfx/remotion/whip.wav" volume={0.48} />
			<Sfx at={T.vinedoCta} src="sfx/impacto.wav" volume={0.45} />
			<Sfx at={T.pill} src="sfx/remotion/snapchat-notification.wav" volume={0.32} />
			<Sfx at={T.pill + 0.25} src="sfx/teclado-iphone.wav" volume={0.28} />
		</AbsoluteFill>
	);
};

export const VinedoComposition: React.FC = () => {
	return (
		<Composition
			id="CasaComercialVinedo"
			component={VinedoComponent}
			durationInFrames={marcas.frames}
			fps={FPS}
			width={1080}
			height={1920}
		/>
	);
};
