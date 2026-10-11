import {Audio, Video} from '@remotion/media';
import {
	AbsoluteFill,
	Composition,
	Easing,
	Img,
	interpolate,
	Sequence,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {helvetica, poppins} from './fonts';

// "Día 2 de creación de contenido GRATIS" — misma estructura que el Día 1 de Raquel:
// título de apertura con GRATIS detrás de ella, historia sin subtítulos con whooshes
// y efectos en las transiciones, y cierre ETIQUETA / DÍA 3 / GRATIS.
// La música se mezcla después con FFmpeg (con ducking bajo la voz).

const FPS = 30;
const DURATION = 49.48;
const BASE = 'work/dia2/base.mp4';

// Tramos con la persona recortada (fotogramas webp con transparencia)
const CUT_INICIO = {dir: 'work/dia2/persona-inicio', from: 2.2, frames: 135};
const CUT_FINAL = {dir: 'work/dia2/persona-final', from: 43.1, frames: 191};

// Cortes con "golpe" de zoom (segundos en el video ya recortado)
const PUNCHES = [2.23, 4.63, 6.67, 8.47, 9.67, 11.07, 17.87, 21.63, 24.37, 28.47, 33.67, 35.77, 39.67];

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Escala del video: pequeño zoom que se asienta tras cada corte
const usePunchScale = () => {
	const frame = useCurrentFrame();
	const t = frame / FPS;
	let s = 1;
	for (const p of PUNCHES) {
		if (t >= p && t < p + 0.5) {
			s = interpolate(t, [p, p + 0.35], [1.07, 1], {...clamp, easing: ease});
		}
	}
	return s;
};

// Morado del Día 1: la palabra deja ver la escena teñida (overlay) + un velo de color
const Textured: React.FC<{readonly text: string; readonly size: number; readonly style?: React.CSSProperties}> = ({text, size, style}) => {
	const common: React.CSSProperties = {
		position: 'absolute',
		fontFamily: poppins,
		fontWeight: 800,
		fontSize: size,
		lineHeight: 1,
		letterSpacing: size * 0.01,
		whiteSpace: 'nowrap',
		...style,
	};
	return (
		<>
			<div style={{...common, color: '#A23BEF', mixBlendMode: 'color'}}>{text}</div>
			<div style={{...common, color: '#E07BFF', mixBlendMode: 'overlay'}}>{text}</div>
			<div style={{...common, color: '#8A2BE2', mixBlendMode: 'multiply', opacity: 0.35}}>{text}</div>
		</>
	);
};

// Entrada "golpe" para las palabras grandes
const slam = (frame: number, at: number) => ({
	opacity: interpolate(frame, [at, at + 4], [0, 1], clamp),
	scale: interpolate(frame, [at, at + 9], [1.35, 1], {...clamp, easing: ease, output: 'perceptual-scale' as const}),
	filter: `blur(${interpolate(frame, [at, at + 7], [14, 0], clamp)}px)`,
});

// Entrada suave para textos blancos
const rise = (frame: number, at: number) => ({
	opacity: interpolate(frame, [at, at + 7], [0, 1], clamp),
	translate: interpolate(frame, [at, at + 12], ['0px 34px', '0px 0px'], {...clamp, easing: ease}),
	filter: `blur(${interpolate(frame, [at, at + 8], [8, 0], clamp)}px)`,
});

const out = (frame: number, end: number) => interpolate(frame, [end - 5, end], [1, 0], clamp);

const white: React.CSSProperties = {
	position: 'absolute',
	color: '#FFFFFF',
	textShadow: '0 3px 22px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.45)',
	whiteSpace: 'nowrap',
};

const Cutout: React.FC<{readonly dir: string; readonly from: number; readonly frames: number}> = ({dir, from, frames}) => {
	const frame = useCurrentFrame();
	const k = frame - Math.round(from * FPS);
	if (k < 0 || k >= frames) return null;
	return <Img src={staticFile(`${dir}/${String(k).padStart(4, '0')}.webp`)} style={{position: 'absolute', width: '100%', height: '100%'}} />;
};

const Sfx: React.FC<{readonly at: number; readonly src: string; readonly volume?: number}> = ({at, src, volume = 0.5}) => {
	return (
		<Sequence from={Math.round(at * FPS)} durationInFrames={3 * FPS} name={src}>
			<Audio src={staticFile(src)} volume={volume} />
		</Sequence>
	);
};

export const Dia2Component: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const scale = usePunchScale();
	const f = (s: number) => Math.round(s * fps);

	// Apertura
	const T_DIA = f(2.4);
	const T_CREACION = f(2.76);
	const T_GRATIS = f(3.66);
	const T_PARA = f(3.98);
	const T_OPEN_END = f(6.62);
	// Cierre
	const T_ETIQUETA = f(43.3);
	const T_ASESOR = f(44.2);
	const T_ETIQ_END = f(45.66);
	const T_DIA3 = f(45.72);
	const T_DIA3_END = f(47.55);
	const T_GRATIS2 = f(47.6);

	const openAlpha = out(frame, T_OPEN_END);

	return (
		<AbsoluteFill style={{background: '#000'}}>
			<AbsoluteFill style={{scale: String(scale)}}>
				<Video src={staticFile(BASE)} premountFor={fps} style={{position: 'absolute', width: '100%', height: '100%'}} />
			</AbsoluteFill>

			{/* ---------- Apertura ---------- */}
			{frame >= T_DIA && frame < T_OPEN_END ? (
				<>
					<div style={{position: 'absolute', inset: 0, opacity: openAlpha}}>
						<div style={{...white, left: 86, top: 410, fontFamily: poppins, fontWeight: 700, fontSize: 150, lineHeight: 1, ...rise(frame, T_DIA)}}>Día 2</div>
						<div style={{...white, left: 92, top: 580, fontFamily: helvetica, fontWeight: 400, fontSize: 66, ...rise(frame, T_CREACION)}}>de creación de contenido</div>
					</div>
					{frame >= T_GRATIS ? (
						<div style={{position: 'absolute', inset: 0, opacity: openAlpha}}>
							<Textured text="GRATIS" size={232} style={{left: 74, top: 672, ...slam(frame, T_GRATIS)}} />
						</div>
					) : null}
				</>
			) : null}

			{/* ---------- Cierre ---------- */}
			{frame >= T_ETIQUETA && frame < T_ETIQ_END ? (
				<div style={{position: 'absolute', inset: 0, opacity: out(frame, T_ETIQ_END)}}>
					<Textured text="ETIQUETA" size={178} style={{left: 0, right: 0, textAlign: 'center', top: 300, ...slam(frame, T_ETIQUETA)}} />
				</div>
			) : null}
			{frame >= T_DIA3 && frame < T_DIA3_END ? (
				<div style={{position: 'absolute', inset: 0, opacity: out(frame, T_DIA3_END)}}>
					<Textured text="DÍA 3" size={250} style={{left: 0, right: 0, textAlign: 'center', top: 395, ...slam(frame, T_DIA3)}} />
				</div>
			) : null}
			{frame >= T_GRATIS2 ? <Textured text="GRATIS" size={240} style={{left: 0, right: 0, textAlign: 'center', top: 420, ...slam(frame, T_GRATIS2)}} /> : null}

			{/* Persona recortada delante de las palabras grandes (mismo zoom que el video) */}
			<AbsoluteFill style={{scale: String(scale)}}>
				{frame >= T_GRATIS && frame < T_OPEN_END ? <Cutout {...CUT_INICIO} /> : null}
				{frame >= T_ETIQUETA ? <Cutout {...CUT_FINAL} /> : null}
			</AbsoluteFill>

			{/* Textos blancos que van delante de todo */}
			{frame >= T_PARA && frame < T_OPEN_END ? (
				<div style={{position: 'absolute', inset: 0, opacity: openAlpha}}>
					<div style={{...white, left: 92, top: 1470, fontFamily: helvetica, fontWeight: 400, fontSize: 66, lineHeight: 1.12, ...rise(frame, T_PARA)}}>
						para asesores
						<br />
						inmobiliarios
					</div>
				</div>
			) : null}
			{frame >= T_ASESOR && frame < T_ETIQ_END ? (
				<div style={{position: 'absolute', inset: 0, opacity: out(frame, T_ETIQ_END)}}>
					<div style={{...white, left: 0, right: 0, textAlign: 'center', top: 480, fontFamily: helvetica, fontWeight: 400, fontSize: 62, ...rise(frame, T_ASESOR)}}>
						a un asesor inmobiliario
					</div>
				</div>
			) : null}

			{/* ---------- Efectos de sonido ---------- */}
			<Sfx at={1.93} src="sfx/whoosh.wav" volume={0.45} />
			<Sfx at={3.6} src="sfx/remotion/whip.wav" volume={0.55} />
			<Sfx at={3.66} src="sfx/impacto.wav" volume={0.45} />
			<Sfx at={4.5} src="sfx/whoosh-corto.wav" volume={0.35} />
			<Sfx at={6.4} src="sfx/whoosh.wav" volume={0.42} />
			<Sfx at={7.8} src="sfx/remotion/whip.wav" volume={0.4} />
			<Sfx at={8.5} src="sfx/remotion/mouse-click.wav" volume={0.55} />
			<Sfx at={8.75} src="sfx/ping.wav" volume={0.35} />
			<Sfx at={9.5} src="sfx/whoosh-corto.wav" volume={0.35} />
			<Sfx at={10.95} src="sfx/swipe.wav" volume={0.35} />
			<Sfx at={12.25} src="sfx/teclado-iphone.wav" volume={0.32} />
			<Sfx at={17.6} src="sfx/whoosh.wav" volume={0.4} />
			<Sfx at={21.4} src="sfx/whoosh.wav" volume={0.4} />
			<Sfx at={22.98} src="sfx/impacto.wav" volume={0.5} />
			<Sfx at={24.25} src="sfx/whoosh-corto.wav" volume={0.35} />
			<Sfx at={28.25} src="sfx/whoosh.wav" volume={0.4} />
			<Sfx at={33.9} src="sfx/remotion/shutter-modern.wav" volume={0.45} />
			<Sfx at={34.5} src="sfx/remotion/shutter-modern.wav" volume={0.4} />
			<Sfx at={35.68} src="sfx/swipe.wav" volume={0.35} />
			<Sfx at={38.98} src="sfx/pop.wav" volume={0.35} />
			<Sfx at={39.45} src="sfx/whoosh.wav" volume={0.42} />
			<Sfx at={43.24} src="sfx/remotion/whip.wav" volume={0.5} />
			<Sfx at={43.3} src="sfx/impacto.wav" volume={0.4} />
			<Sfx at={44.2} src="sfx/pop.wav" volume={0.35} />
			<Sfx at={45.66} src="sfx/remotion/whip.wav" volume={0.5} />
			<Sfx at={45.72} src="sfx/impacto.wav" volume={0.4} />
			<Sfx at={47.54} src="sfx/remotion/whip.wav" volume={0.5} />
			<Sfx at={47.6} src="sfx/impacto.wav" volume={0.45} />
			<Sfx at={47.68} src="sfx/remotion/ding.wav" volume={0.35} />
		</AbsoluteFill>
	);
};

export const Dia2Composition: React.FC = () => {
	return (
		<Composition
			id="Dia2"
			component={Dia2Component}
			durationInFrames={Math.round(DURATION * FPS)}
			fps={FPS}
			width={1080}
			height={1920}
		/>
	);
};
