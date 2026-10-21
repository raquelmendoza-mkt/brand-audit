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

// Casa Comercial El Viñedo — reel de Karen siguiendo el guión pieza por pieza:
// gancho (corta la cinta) -> toma de dron con IA -> diálogo con Estefany -> métricas
// detrás de ella -> espacios con las ambientaciones de IA -> cierre "Comenta VIÑEDO".
// La base (cortes sin silencios) la arma scripts/vinedo_base.py; la música se mezcla
// después con FFmpeg (ducking bajo la voz).

const FPS = 30;
const DURATION = 80.2;
const W = 'work/vinedo';
const BLUE = '#1C6BEA';
const NAVY = '#0B2A5B';

// Inicio de cada toma en la base (marcas.json)
const CUTS = [6.9, 11.4, 16.4, 19.667, 22.067, 25.467, 27.667, 37.167, 44.233, 56.7, 59.933, 73.933];
// Golpes de zoom: cada corte + las palabras clave
const PUNCHES = [...CUTS, 1.14, 45.85, 48.25, 53.85, 55.07, 69.67, 77.68];

// Tramos con la persona recortada (texto DETRÁS de ella)
const CUTOUTS = {
	gancho: {dir: `${W}/persona-gancho`, from: 0, frames: 153},
	ubicacion: {dir: `${W}/persona-ubicacion`, from: 27.67, frames: 285},
	metros: {dir: `${W}/persona-metros`, from: 44.23, frames: 374},
	espacios: {dir: `${W}/persona-espacios`, from: 68.0, frames: 178},
	cta: {dir: `${W}/persona-cta`, from: 73.93, frames: 189},
};

// Subtítulos [inicio, fin, texto] (tiempos de la base)
const CAPTIONS: [number, number, string][] = [
	[0.18, 1.9, 'La próxima inauguración'],
	[1.9, 2.9, 'en El Viñedo…'],
	[2.9, 5.0, '¡puede ser la de tu negocio!'],
	[6.97, 8.5, 'Y aquí lo puedes'],
	[8.5, 9.95, 'hacer realidad'],
	[17.9, 19.6, '¡Ya va! Queremos información'],
	[19.8, 20.9, '¿Me puedes comentar más'],
	[20.9, 22.0, 'sobre esta casa comercial?'],
	[22.2, 23.9, 'Ven, pasa'],
	[27.74, 28.6, 'Estefany,'],
	[28.6, 29.84, 'esta casa comercial'],
	[29.84, 31.58, 'está muy bien ubicada'],
	[31.58, 33.1, 'en el corazón de El Viñedo,'],
	[33.26, 35.06, 'rodeada de restaurantes'],
	[35.06, 35.62, 'y comercios'],
	[35.62, 37.1, 'muy reconocidos de la ciudad'],
	[37.3, 40.14, 'Sí, como puedes observar'],
	[40.14, 41.7, 'la casa cuenta con dos niveles'],
	[44.35, 45.85, 'Y aquí tienes'],
	[45.85, 47.87, '450 metros de terreno'],
	[47.87, 49.93, 'con 600 metros de construcción'],
	[50.15, 51.69, 'Esta casa comercial'],
	[51.69, 53.1, 'está dividida en dos niveles,'],
	[53.39, 54.95, 'con 14 habitaciones,'],
	[55.07, 56.65, '10 baños y amplios espacios'],
	[56.87, 57.78, '¡Me encanta el lugar!'],
	[57.81, 59.9, 'Aquí podría montar mi casa de marcas'],
	[60.01, 61.2, '¡Por supuesto, Estefany!'],
	[61.29, 62.95, 'Y no solo tu casa de marcas'],
	[63.29, 65.0, 'Aquí también puedes implementar'],
	[68.17, 69.55, 'Y lo mejor de todo,'],
	[69.67, 71.2, 'te damos la oportunidad'],
	[71.2, 72.5, 'de que alquiles la casa'],
	[72.5, 73.8, 'por espacios'],
	[74.04, 75.72, 'Para cortar la próxima cinta'],
	[75.72, 76.7, 'de tu negocio,'],
	[76.78, 78.15, 'comenta la palabra VIÑEDO'],
	[78.18, 79.85, 'y te envío toda la información'],
];
const KEYWORDS = ['Viñedo', 'VIÑEDO', '450', '600', '14', '10', 'dos niveles', 'negocio', 'espacios', 'casa de marcas', 'restaurantes', 'realidad', 'inauguración'];

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
	return s;
};

// Entrada "golpe" para los títulos grandes
const slam = (frame: number, at: number) => ({
	opacity: interpolate(frame, [at, at + 4], [0, 1], clamp),
	scale: interpolate(frame, [at, at + 9], [1.35, 1], {...clamp, easing: ease}),
	filter: `blur(${interpolate(frame, [at, at + 7], [14, 0], clamp)}px)`,
});

// Entrada suave para textos pequeños
const rise = (frame: number, at: number) => ({
	opacity: interpolate(frame, [at, at + 7], [0, 1], clamp),
	translate: interpolate(frame, [at, at + 12], ['0px 30px', '0px 0px'], {...clamp, easing: ease}),
	filter: `blur(${interpolate(frame, [at, at + 8], [8, 0], clamp)}px)`,
});

const shadow = '0 4px 26px rgba(0,0,0,0.45), 0 1px 4px rgba(0,0,0,0.4)';

// Título grande que aparece en [from, to) con golpe y se desvanece al final
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
				...slam(frame, a),
				opacity: slam(frame, a).opacity * interpolate(frame, [b - 5, b], [1, 0], clamp),
			}}
		>
			{text}
		</div>
	);
};

// Texto pequeño en Helvetica (rótulos sobre los títulos)
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

// Píldora con icono (ubicación, IA, planta baja...)
const Pill: React.FC<{
	readonly from: number;
	readonly to: number;
	readonly text: string;
	readonly icon: React.ReactNode;
	readonly top: number;
	readonly left?: number;
	readonly dark?: boolean;
}> = ({from, to, text, icon, top, left, dark}) => {
	const frame = useCurrentFrame();
	const a = Math.round(from * FPS);
	const b = Math.round(to * FPS);
	if (frame < a || frame >= b) return null;
	const pop = interpolate(frame, [a, a + 10], [0.6, 1], {...clamp, easing: Easing.out(Easing.back(2))});
	const o = interpolate(frame, [a, a + 5, b - 5, b], [0, 1, 1, 0], clamp);
	return (
		<div style={{position: 'absolute', top, left: left ?? 0, right: left === undefined ? 0 : undefined, display: 'flex', justifyContent: 'center', opacity: o}}>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 18,
					padding: '18px 34px',
					borderRadius: 999,
					background: dark ? 'rgba(11,42,91,0.88)' : 'rgba(255,255,255,0.95)',
					color: dark ? '#FFFFFF' : NAVY,
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
	chispa: (c: string) => (
		<svg width="44" height="44" viewBox="0 0 24 24" fill={c}>
			<path d="M12 1l2.4 7.6L22 11l-7.6 2.4L12 21l-2.4-7.6L2 11l7.6-2.4zM19 15l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" />
		</svg>
	),
	casa: (c: string) => (
		<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinejoin="round">
			<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
		</svg>
	),
	chat: (c: string) => (
		<svg width="50" height="50" viewBox="0 0 24 24" fill={c}>
			<path d="M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
		</svg>
	),
};

// Confeti al cortar la cinta
const Confetti: React.FC<{readonly at: number}> = ({at}) => {
	const frame = useCurrentFrame();
	const k = frame - Math.round(at * FPS);
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
				const rot = random(`r${i}`) * 720 * t * 3;
				const o = interpolate(k, [0, 3, 55, 70], [0, 1, 1, 0], clamp);
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
							rotate: `${rot}deg`,
							opacity: o,
						}}
					/>
				);
			})}
		</AbsoluteFill>
	);
};

// Subtítulos: frase corta, entra con pequeño rebote; palabra clave en azul
const Captions: React.FC = () => {
	const frame = useCurrentFrame();
	const t = frame / FPS;
	const cur = CAPTIONS.find(([a, b]) => t >= a && t < b);
	if (!cur) return null;
	const [a] = cur;
	const k = frame - Math.round(a * FPS);
	const s = interpolate(k, [0, 6], [0.85, 1], {...clamp, easing: Easing.out(Easing.back(2.2))});
	const o = interpolate(k, [0, 3], [0, 1], clamp);
	const html = cur[2];
	const kw = KEYWORDS.find((w) => html.includes(w));
	const parts = kw ? html.split(kw) : [html];
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
const Comment: React.FC<{readonly at: number}> = ({at}) => {
	const frame = useCurrentFrame();
	const a = Math.round(at * FPS);
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

const Sfx: React.FC<{readonly at: number; readonly src: string; readonly volume?: number}> = ({at, src, volume = 0.5}) => (
	<Sequence from={Math.round(at * FPS)} durationInFrames={3 * FPS} name={src}>
		<Audio src={staticFile(src)} volume={volume} />
	</Sequence>
);

// Clip de IA encima de la base (la voz de Karen sigue debajo)
const IaClip: React.FC<{readonly at: number; readonly dur: number; readonly src: string; readonly trim?: number}> = ({at, dur, src, trim = 0}) => {
	const {fps} = useVideoConfig();
	return (
		<Sequence from={Math.round(at * fps)} durationInFrames={Math.round(dur * fps)} premountFor={fps}>
			<Video src={staticFile(src)} trimBefore={Math.round(trim * fps)} muted style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover'}} />
		</Sequence>
	);
};

export const VinedoComponent: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const scale = usePunchScale();
	const t = frame / fps;
	const end = interpolate(t, [DURATION - 0.35, DURATION], [1, 0], clamp);

	return (
		<AbsoluteFill style={{background: '#000'}}>
			<AbsoluteFill style={{scale: String(scale), opacity: end}}>
				<Video src={staticFile(`${W}/base.mp4`)} premountFor={fps} style={{position: 'absolute', width: '100%', height: '100%'}} />
				<IaClip at={63.2} dur={2.7} src={`${W}/ia_155457.mp4`} />
				<IaClip at={65.9} dur={2.25} src={`${W}/ia_155256.mp4`} trim={0.25} />
			</AbsoluteFill>

			<AbsoluteFill style={{opacity: end}}>
				{/* ---------- Títulos DETRÁS de la persona ---------- */}
				<Big from={1.14} to={3.72} text="INAUGURACIÓN" size={126} top={905} />
				<Big from={3.72} to={5.6} text="TU NEGOCIO" size={150} top={890} />

				<Big from={31.9} to={33.25} text="EL VIÑEDO" size={170} top={770} color={BLUE} glow={false} />

				<Big from={45.85} to={48.25} text="450 m²" size={250} top={560} color={BLUE} glow={false} />
				<Big from={48.25} to={52.1} text="600 m²" size={250} top={490} color={BLUE} glow={false} />
				<Big from={52.17} to={53.82} text="2 NIVELES" size={190} top={450} color={BLUE} glow={false} />
				<Big from={53.85} to={55.05} text="14" size={300} top={330} color={BLUE} glow={false} />
				<Big from={55.07} to={56.7} text="10" size={300} top={320} color={BLUE} glow={false} />

				<Big from={69.67} to={73.93} text="SE ALQUILA" size={140} top={240} color={BLUE} glow={false} />
				<Big from={72.53} to={73.93} text="POR ESPACIOS" size={112} top={390} color={NAVY} glow={false} />

				<Big from={77.68} to={DURATION} text="VIÑEDO" size={240} top={500} />

				{/* Persona recortada delante de los títulos (mismo zoom que el video) */}
				<AbsoluteFill style={{scale: String(scale)}}>
					{t < 5.6 ? <Cutout {...CUTOUTS.gancho} /> : null}
					{t >= 31.8 && t < 33.3 ? <Cutout {...CUTOUTS.ubicacion} /> : null}
					{t >= 45.8 && t < 56.7 ? <Cutout {...CUTOUTS.metros} /> : null}
					{t >= 69.6 && t < 73.93 ? <Cutout {...CUTOUTS.espacios} /> : null}
					{t >= 77.6 ? <Cutout {...CUTOUTS.cta} /> : null}
				</AbsoluteFill>

				{/* ---------- Textos delante ---------- */}
				<Small from={0.2} to={3.72} text="LA PRÓXIMA" top={815} size={58} spacing={8} />
				<Small from={3.72} to={5.6} text="puede ser la de" top={810} size={58} />
				<Confetti at={6.85} />

				{/* Dron con IA */}
				<Small from={11.55} to={13.75} text="CASA COMERCIAL" top={1580} size={50} spacing={12} />
				<Pill from={13.85} to={16.35} text="El Viñedo · Valencia" icon={Ico.pin('#E8173A')} top={260} />
				<Big from={14.0} to={16.35} text="EL VIÑEDO" size={170} top={1520} />

				<Pill from={25.55} to={27.6} text="Planta baja" icon={Ico.casa(BLUE)} top={240} />
				<Pill from={33.3} to={37.1} text="Restaurantes" icon={Ico.plato(BLUE)} top={240} />
				<Pill from={35.06} to={37.1} text="Comercios reconocidos" icon={Ico.tienda(BLUE)} top={350} />

				<Big from={41.0} to={44.2} text="2 NIVELES" size={170} top={250} color={BLUE} glow={false} />
				<Small from={41.3} to={44.2} text="planta baja + planta alta" top={440} size={50} color={NAVY} />

				<Small from={45.95} to={48.25} text="DE TERRENO" top={470} size={50} color={NAVY} spacing={8} />
				<Small from={48.35} to={52.1} text="DE CONSTRUCCIÓN" top={400} size={50} color={NAVY} spacing={8} />
				<Small from={53.95} to={55.05} text="HABITACIONES" top={250} size={56} color={NAVY} spacing={8} />
				<Small from={55.15} to={56.7} text="BAÑOS" top={240} size={56} color={NAVY} spacing={8} />

				<Small from={58.9} to={59.95} text="Tu" top={250} size={56} />
				<Big from={58.95} to={59.95} text="CASA DE MARCAS" size={108} top={320} />

				{/* Ambientaciones con IA */}
				<Pill from={63.25} to={68.15} text="Ambientación con IA" icon={Ico.chispa('#F5C542')} top={240} dark />
				<Big from={65.03} to={68.15} text="CLÍNICA" size={130} top={720} />
				<Big from={66.03} to={68.15} text="SPA" size={130} top={860} />
				<Big from={67.05} to={68.15} text="RESTAURANTES" size={112} top={1000} />

				<Small from={76.78} to={DURATION} text="Comenta la palabra" top={430} size={56} />
				<Comment at={78.2} />

				<Captions />
			</AbsoluteFill>

			{/* ---------- Efectos de sonido ---------- */}
			<Sfx at={1.08} src="sfx/remotion/whip.wav" volume={0.45} />
			<Sfx at={1.14} src="sfx/impacto.wav" volume={0.4} />
			<Sfx at={3.66} src="sfx/remotion/whip.wav" volume={0.45} />
			<Sfx at={3.72} src="sfx/pop.wav" volume={0.35} />
			<Sfx at={6.8} src="sfx/remotion/shutter-modern.wav" volume={0.35} />
			<Sfx at={6.85} src="sfx/impacto.wav" volume={0.45} />
			<Sfx at={6.9} src="sfx/sparkle.wav" volume={0.4} />
			<Sfx at={11.3} src="sfx/whoosh.wav" volume={0.45} />
			<Sfx at={13.85} src="sfx/remotion/whip.wav" volume={0.4} />
			<Sfx at={14.0} src="sfx/remotion/ding.wav" volume={0.35} />
			<Sfx at={16.3} src="sfx/whoosh-corto.wav" volume={0.4} />
			<Sfx at={17.9} src="sfx/pop.wav" volume={0.3} />
			<Sfx at={19.6} src="sfx/swipe.wav" volume={0.35} />
			<Sfx at={22.0} src="sfx/whoosh-corto.wav" volume={0.38} />
			<Sfx at={25.38} src="sfx/whoosh.wav" volume={0.4} />
			<Sfx at={25.55} src="sfx/pop.wav" volume={0.3} />
			<Sfx at={27.6} src="sfx/swipe.wav" volume={0.35} />
			<Sfx at={31.85} src="sfx/remotion/whip.wav" volume={0.45} />
			<Sfx at={31.9} src="sfx/impacto.wav" volume={0.38} />
			<Sfx at={33.3} src="sfx/pop.wav" volume={0.32} />
			<Sfx at={35.06} src="sfx/pop.wav" volume={0.32} />
			<Sfx at={37.1} src="sfx/whoosh.wav" volume={0.4} />
			<Sfx at={41.0} src="sfx/remotion/whip.wav" volume={0.4} />
			<Sfx at={41.05} src="sfx/ding.wav" volume={0.3} />
			<Sfx at={44.15} src="sfx/whoosh.wav" volume={0.4} />
			<Sfx at={45.8} src="sfx/remotion/whip.wav" volume={0.45} />
			<Sfx at={45.85} src="sfx/impacto.wav" volume={0.42} />
			<Sfx at={48.2} src="sfx/remotion/whip.wav" volume={0.45} />
			<Sfx at={48.25} src="sfx/impacto.wav" volume={0.42} />
			<Sfx at={52.12} src="sfx/remotion/whip.wav" volume={0.4} />
			<Sfx at={53.85} src="sfx/pop.wav" volume={0.35} />
			<Sfx at={53.88} src="sfx/ding.wav" volume={0.28} />
			<Sfx at={55.07} src="sfx/pop.wav" volume={0.35} />
			<Sfx at={55.1} src="sfx/ding.wav" volume={0.28} />
			<Sfx at={56.62} src="sfx/whoosh-corto.wav" volume={0.38} />
			<Sfx at={58.9} src="sfx/sparkle.wav" volume={0.35} />
			<Sfx at={59.88} src="sfx/whoosh.wav" volume={0.4} />
			<Sfx at={63.12} src="sfx/whoosh.wav" volume={0.42} />
			<Sfx at={63.3} src="sfx/sparkle.wav" volume={0.35} />
			<Sfx at={65.03} src="sfx/pop.wav" volume={0.35} />
			<Sfx at={65.85} src="sfx/whoosh-corto.wav" volume={0.38} />
			<Sfx at={66.03} src="sfx/pop.wav" volume={0.35} />
			<Sfx at={67.05} src="sfx/pop.wav" volume={0.35} />
			<Sfx at={68.08} src="sfx/whoosh.wav" volume={0.4} />
			<Sfx at={69.62} src="sfx/remotion/whip.wav" volume={0.45} />
			<Sfx at={69.67} src="sfx/impacto.wav" volume={0.4} />
			<Sfx at={72.5} src="sfx/remotion/whip.wav" volume={0.45} />
			<Sfx at={72.53} src="sfx/impacto.wav" volume={0.38} />
			<Sfx at={73.86} src="sfx/whoosh.wav" volume={0.42} />
			<Sfx at={76.78} src="sfx/pop.wav" volume={0.3} />
			<Sfx at={77.62} src="sfx/remotion/whip.wav" volume={0.5} />
			<Sfx at={77.68} src="sfx/impacto.wav" volume={0.48} />
			<Sfx at={78.2} src="sfx/remotion/snapchat-notification.wav" volume={0.35} />
			<Sfx at={78.45} src="sfx/teclado-iphone.wav" volume={0.3} />
		</AbsoluteFill>
	);
};

export const VinedoComposition: React.FC = () => {
	return (
		<Composition
			id="CasaComercialVinedo"
			component={VinedoComponent}
			durationInFrames={Math.round(DURATION * FPS)}
			fps={FPS}
			width={1080}
			height={1920}
		/>
	);
};
