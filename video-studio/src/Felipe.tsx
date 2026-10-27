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

// Room tour del apartamento en Simón Bolívar, La América (Medellín) para Felipe Peláez Real.
// 7 ambientes animados con Google Omni (Higgsfield) + fotos con movimiento de cámara,
// especificaciones con emojis en cada ambiente, precio y botón "Agendar visita".
// La música se mezcla después con FFmpeg.

const FPS = 30;
const W = 'work/felipe';
const GOLD = '#D9B36A';
const INK = '#111418';

type Motion = 'zoomIn' | 'zoomOut' | 'panLeft' | 'panRight';
type Scene = {
	readonly src: string;
	readonly kind: 'omni' | 'foto';
	readonly from: number;
	readonly dur: number;
	readonly motion?: Motion;
	readonly dim?: boolean;
};

const SCENES: Scene[] = [
	{src: 'omni/1-pasillo.mp4', kind: 'omni', from: 0, dur: 3.0},
	{src: 'omni/2-entrada.mp4', kind: 'omni', from: 3.0, dur: 2.9},
	{src: 'omni/3-sala.mp4', kind: 'omni', from: 5.9, dur: 3.0},
	{src: 'fotos/f08.jpg', kind: 'foto', from: 8.9, dur: 2.0, motion: 'zoomIn'},
	{src: 'omni/4-cocina.mp4', kind: 'omni', from: 10.9, dur: 3.0},
	{src: 'omni/5-habitacion.mp4', kind: 'omni', from: 13.9, dur: 3.0},
	{src: 'omni/6-vestier.mp4', kind: 'omni', from: 16.9, dur: 3.0},
	{src: 'fotos/f17.jpg', kind: 'foto', from: 19.9, dur: 1.6, motion: 'panRight'},
	{src: 'fotos/f14.jpg', kind: 'foto', from: 21.5, dur: 1.6, motion: 'zoomIn'},
	{src: 'omni/7-bano.mp4', kind: 'omni', from: 23.1, dur: 3.0},
	{src: 'fotos/f11.jpg', kind: 'foto', from: 26.1, dur: 1.7, motion: 'zoomOut'},
	{src: 'fotos/f05.jpg', kind: 'foto', from: 27.8, dur: 1.8, motion: 'zoomIn'},
	{src: 'fotos/f24.jpg', kind: 'foto', from: 29.6, dur: 1.9, motion: 'panLeft'},
	{src: 'fotos/f21.jpg', kind: 'foto', from: 31.5, dur: 3.6, motion: 'zoomIn', dim: true},
	{src: 'omni/1-pasillo.mp4', kind: 'omni', from: 35.1, dur: 5.4, dim: true},
];
const DURATION = 40.5;

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const sec = (s: number) => Math.round(s * FPS);

const Shot: React.FC<{readonly scene: Scene}> = ({scene}) => {
	const frame = useCurrentFrame();
	const n = sec(scene.dur);
	const p = frame / n;
	// Golpe de zoom al entrar + movimiento continuo de cámara en las fotos
	const punch = interpolate(frame, [0, 9], [1.08, 1], {...clamp, easing: ease});
	let s = 1;
	let x = 0;
	if (scene.motion === 'zoomIn') s = interpolate(p, [0, 1], [1.04, 1.16]);
	if (scene.motion === 'zoomOut') s = interpolate(p, [0, 1], [1.16, 1.04]);
	if (scene.motion === 'panRight') {
		s = 1.14;
		x = interpolate(p, [0, 1], [-50, 50]);
	}
	if (scene.motion === 'panLeft') {
		s = 1.14;
		x = interpolate(p, [0, 1], [50, -50]);
	}
	const style: React.CSSProperties = {position: 'absolute', width: '100%', height: '100%', objectFit: 'cover'};
	return (
		<AbsoluteFill style={{scale: String(punch * s), translate: `${x}px 0px`}}>
			{scene.kind === 'omni' ? (
				<Video src={staticFile(`${W}/${scene.src}`)} muted style={style} />
			) : (
				<Img src={staticFile(`${W}/${scene.src}`)} style={style} />
			)}
			{scene.dim ? <AbsoluteFill style={{background: 'rgba(10,12,16,0.55)', backdropFilter: 'blur(6px)'}} /> : null}
		</AbsoluteFill>
	);
};

const rise = (frame: number, a: number) => ({
	opacity: interpolate(frame, [a, a + 7], [0, 1], clamp),
	translate: interpolate(frame, [a, a + 12], ['0px 34px', '0px 0px'], {...clamp, easing: ease}),
	filter: `blur(${interpolate(frame, [a, a + 8], [8, 0], clamp)}px)`,
});
const slam = (frame: number, a: number) => ({
	opacity: interpolate(frame, [a, a + 4], [0, 1], clamp),
	scale: interpolate(frame, [a, a + 9], [1.35, 1], {...clamp, easing: ease}),
	filter: `blur(${interpolate(frame, [a, a + 7], [14, 0], clamp)}px)`,
});
const fadeOut = (frame: number, b: number) => interpolate(frame, [b - 5, b], [1, 0], clamp);
const shadow = '0 4px 26px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.45)';

// Texto visible entre [from, to)
const Txt: React.FC<{
	readonly from: number;
	readonly to: number;
	readonly top: number;
	readonly children: React.ReactNode;
	readonly big?: boolean;
	readonly size?: number;
	readonly color?: string;
	readonly spacing?: number;
}> = ({from, to, top, children, big, size, color = '#FFFFFF', spacing = 0}) => {
	const frame = useCurrentFrame();
	const a = sec(from);
	const b = sec(to);
	if (frame < a || frame >= b) return null;
	const anim = big ? slam(frame, a) : rise(frame, a);
	return (
		<div
			style={{
				position: 'absolute',
				left: 40,
				right: 40,
				top,
				textAlign: 'center',
				fontFamily: big ? poppins : helvetica,
				fontWeight: big ? 800 : 700,
				fontSize: size ?? (big ? 130 : 56),
				lineHeight: 1.05,
				letterSpacing: big ? -(size ?? 130) * 0.02 : spacing,
				color,
				textShadow: shadow,
				...anim,
				opacity: anim.opacity * fadeOut(frame, b),
			}}
		>
			{children}
		</div>
	);
};

// Etiqueta de especificación: emoji + texto en una píldora de vidrio
const Chip: React.FC<{readonly from: number; readonly to: number; readonly emoji: string; readonly text: string; readonly top: number; readonly gold?: boolean}> = ({
	from,
	to,
	emoji,
	text,
	top,
	gold,
}) => {
	const frame = useCurrentFrame();
	const a = sec(from);
	const b = sec(to);
	if (frame < a || frame >= b) return null;
	const pop = interpolate(frame, [a, a + 11], [0.5, 1], {...clamp, easing: Easing.out(Easing.back(2.2))});
	const x = interpolate(frame, [a, a + 11], [-60, 0], {...clamp, easing: ease});
	const o = interpolate(frame, [a, a + 5], [0, 1], clamp) * fadeOut(frame, b);
	return (
		<div style={{position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: o}}>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 18,
					padding: '18px 36px 18px 24px',
					borderRadius: 999,
					background: gold ? `linear-gradient(135deg, #F3D79A, ${GOLD})` : 'rgba(255,255,255,0.94)',
					border: '2px solid rgba(255,255,255,0.9)',
					boxShadow: '0 12px 34px rgba(0,0,0,0.3)',
					color: INK,
					fontFamily: helvetica,
					fontWeight: 700,
					fontSize: 46,
					scale: String(pop),
					translate: `${x}px 0px`,
					whiteSpace: 'nowrap',
				}}
			>
				<span style={{fontSize: 54, lineHeight: 1}}>{emoji}</span>
				{text}
			</div>
		</div>
	);
};

// Rótulo en píldora dorada (se lee sobre paredes blancas y fondos oscuros)
const Label: React.FC<{readonly from: number; readonly to: number; readonly top: number; readonly text: string}> = ({from, to, top, text}) => {
	const frame = useCurrentFrame();
	const a = sec(from);
	const b = sec(to);
	if (frame < a || frame >= b) return null;
	const r = rise(frame, a);
	return (
		<div style={{position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center', ...r, opacity: r.opacity * fadeOut(frame, b)}}>
			<div
				style={{
					padding: '12px 34px',
					borderRadius: 999,
					background: `linear-gradient(135deg, #F3D79A, ${GOLD})`,
					boxShadow: '0 10px 28px rgba(0,0,0,0.3)',
					fontFamily: helvetica,
					fontWeight: 700,
					fontSize: 46,
					letterSpacing: 8,
					color: INK,
				}}
			>
				{text}
			</div>
		</div>
	);
};

// Número grande + rótulo (100 m², 3 HABITACIONES...)
const Stat: React.FC<{readonly from: number; readonly to: number; readonly value: string; readonly label: string; readonly top?: number}> = ({from, to, value, label, top = 250}) => (
	<>
		<Txt from={from} to={to} top={top} big size={210}>
			{value}
		</Txt>
		<Label from={from + 0.12} to={to} top={top + 225} text={label} />
	</>
);

// Precio que cuenta hacia arriba
const Price: React.FC<{readonly from: number; readonly to: number}> = ({from, to}) => {
	const frame = useCurrentFrame();
	const a = sec(from);
	const b = sec(to);
	if (frame < a || frame >= b) return null;
	const v = Math.round(interpolate(frame, [a + 6, a + 36], [0, 695], {...clamp, easing: Easing.out(Easing.cubic)}));
	const s = slam(frame, a + 4);
	return (
		<div style={{position: 'absolute', top: 760, left: 0, right: 0, textAlign: 'center', ...s, opacity: s.opacity * fadeOut(frame, b)}}>
			<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 150, color: '#FFFFFF', letterSpacing: -3, textShadow: shadow}}>
				${v}.000.000
			</div>
		</div>
	);
};

// Botón "Agendar visita" con dedo que toca y onda
const CtaButton: React.FC<{readonly from: number}> = ({from}) => {
	const frame = useCurrentFrame();
	const a = sec(from);
	if (frame < a) return null;
	const k = frame - a;
	const tap = 22; // momento del toque
	const pop = interpolate(k, [0, 12], [0.4, 1], {...clamp, easing: Easing.out(Easing.back(2))});
	const press = k >= tap && k < tap + 6 ? 0.92 : 1;
	const ripple = interpolate(k, [tap, tap + 20], [0, 1], clamp);
	const handY = interpolate(k, [8, tap, tap + 8, tap + 22], [260, 30, 45, 230], {...clamp, easing: ease});
	const handO = interpolate(k, [8, 12, tap + 16, tap + 22], [0, 1, 1, 0], clamp);
	const glow = 0.5 + 0.5 * Math.sin(k / 6);
	return (
		<div style={{position: 'absolute', top: 1330, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
			<div style={{position: 'relative', scale: String(pop * press)}}>
				<div
					style={{
						position: 'absolute',
						inset: -20 - ripple * 60,
						borderRadius: 999,
						border: `4px solid rgba(217,179,106,${(1 - ripple) * 0.9})`,
					}}
				/>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 22,
						padding: '34px 64px',
						borderRadius: 999,
						background: `linear-gradient(135deg, #F6DFA8, ${GOLD} 60%, #B98E43)`,
						boxShadow: `0 18px 44px rgba(0,0,0,0.45), 0 0 ${30 + glow * 30}px rgba(217,179,106,0.55)`,
						fontFamily: poppins,
						fontWeight: 800,
						fontSize: 62,
						color: INK,
						whiteSpace: 'nowrap',
					}}
				>
					<span style={{fontSize: 62}}>📅</span>
					AGENDAR VISITA
				</div>
				<div style={{position: 'absolute', right: 40, top: handY, fontSize: 120, opacity: handO, rotate: '-15deg'}}>👆</div>
			</div>
		</div>
	);
};

const Sfx: React.FC<{readonly at: number; readonly src: string; readonly volume?: number}> = ({at, src, volume = 0.5}) => (
	<Sequence from={Math.max(0, sec(at))} durationInFrames={3 * FPS} name={src}>
		<Audio src={staticFile(src)} volume={volume} />
	</Sequence>
);

export const FelipeComponent: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const end = interpolate(frame, [sec(DURATION) - 10, sec(DURATION)], [1, 0], clamp);
	const S = (i: number) => SCENES[i].from;

	return (
		<AbsoluteFill style={{background: '#000'}}>
			<AbsoluteFill style={{opacity: end}}>
				{SCENES.map((sc, i) => (
					<Sequence key={i} from={sec(sc.from)} durationInFrames={sec(sc.dur)} premountFor={fps}>
						<Shot scene={sc} />
					</Sequence>
				))}
				{/* Degradados para que los textos se lean */}
				<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.5) 100%)'}} />

				{/* ---------- Gancho ---------- */}
				<Txt from={0.1} to={1.75} top={330} size={66}>
					¿Tu próximo apartamento
				</Txt>
				<Txt from={0.4} to={1.75} top={410} big size={140}>
					en Medellín?
				</Txt>
				<Chip from={1.75} to={S(1) + 0.05} emoji="✨" text="NUEVO · ESPECTACULAR" top={300} gold />
				<Txt from={1.85} to={S(1) + 0.05} top={420} big size={96}>
					Simón Bolívar
				</Txt>
				<Txt from={2.0} to={S(1) + 0.05} top={525} size={60} color={GOLD} spacing={8}>
					LA AMÉRICA 🏡
				</Txt>

				{/* ---------- Entrada ---------- */}
				<Chip from={S(1) + 0.2} to={S(2)} emoji="🔐" text="Cerradura inteligente" top={1240} />
				<Chip from={S(1) + 0.75} to={S(2)} emoji="🛗" text="Piso 7 con ascensor" top={1360} />

				{/* ---------- Sala, comedor y cocina ---------- */}
				<Stat from={S(2) + 0.1} to={S(3)} value="100 m²" label="DE ÁREA" />
				<Chip from={S(2) + 0.6} to={S(3)} emoji="🛋️" text="Sala" top={1240} />
				<Chip from={S(2) + 1.0} to={S(3)} emoji="🍽️" text="Comedor" top={1360} />
				<Chip from={S(2) + 1.4} to={S(3)} emoji="🏢" text="Estrato 4" top={1480} />

				<Chip from={S(3) + 0.1} to={S(4)} emoji="🌤️" text="No poniente" top={1240} />
				<Chip from={S(3) + 0.5} to={S(4)} emoji="🌇" text="Balcón" top={1360} />
				<Chip from={S(3) + 0.9} to={S(4)} emoji="📺" text="Mueble para TV" top={1480} />

				<Txt from={S(4) + 0.1} to={S(5)} top={300} big size={130}>
					Cocina
				</Txt>
				<Chip from={S(4) + 0.5} to={S(5)} emoji="☕" text="Mueble estación de café" top={1300} />

				{/* ---------- Habitaciones y vestier ---------- */}
				<Stat from={S(5) + 0.1} to={S(6)} value="3" label="HABITACIONES" />
				<Chip from={S(5) + 0.7} to={S(6)} emoji="❄️" text="2 aires acondicionados" top={1300} />

				<Stat from={S(6) + 0.1} to={S(7)} value="2" label="VESTIER" />
				<Chip from={S(6) + 0.7} to={S(7)} emoji="👔" text="Clóset en linox" top={1300} />

				<Chip from={S(7) + 0.1} to={S(8)} emoji="📹" text="Videoportero" top={1300} />
				<Chip from={S(8) + 0.1} to={S(9)} emoji="📷" text="5 cámaras de seguridad" top={1300} />

				{/* ---------- Baños ---------- */}
				<Stat from={S(9) + 0.1} to={S(10)} value="2" label="BAÑOS" />
				<Chip from={S(9) + 0.6} to={S(10)} emoji="🚿" text="2 torres de duchas" top={1240} />
				<Chip from={S(9) + 1.1} to={S(10)} emoji="🪞" text="Espejos en los baños" top={1360} />
				<Chip from={S(10) + 0.1} to={S(11)} emoji="🚽" text="Pozuelo inteligente" top={1300} />

				{/* ---------- Zona de ropas y parqueadero ---------- */}
				<Chip from={S(11) + 0.1} to={S(12)} emoji="🧺" text="Zona de ropas" top={1240} />
				<Chip from={S(11) + 0.5} to={S(12)} emoji="📦" text="Cuarto útil" top={1360} />
				<Txt from={S(12) + 0.1} to={S(13)} top={300} big size={120}>
					Parqueadero
				</Txt>
				<Txt from={S(12) + 0.3} to={S(13)} top={1280} size={110}>
					🚗
				</Txt>

				{/* ---------- Precio ---------- */}
				<Txt from={S(13) + 0.1} to={S(14)} top={640} size={58} color={GOLD} spacing={14}>
					PRECIO DE VENTA
				</Txt>
				<Price from={S(13)} to={S(14)} />
				<Txt from={S(13) + 1.4} to={S(14)} top={960} size={56}>
					Para vivir o invertir 🔑
				</Txt>

				{/* ---------- Cierre ---------- */}
				<Txt from={S(14) + 0.1} to={DURATION} top={420} size={62}>
					Haz clic abajo y agenda tu visita
				</Txt>
				<Txt from={S(14) + 0.25} to={DURATION} top={520} big size={104}>
					Felipe Peláez
				</Txt>
				<Txt from={S(14) + 0.4} to={DURATION} top={640} size={60} color={GOLD} spacing={22}>
					REAL
				</Txt>
				<Txt from={S(14) + 0.6} to={DURATION} top={1180} size={90}>
					👇
				</Txt>
				<CtaButton from={S(14) + 0.7} />
			</AbsoluteFill>

			{/* ---------- Efectos de sonido ---------- */}
			<Sfx at={0.38} src="sfx/remotion/whip.wav" volume={0.42} />
			<Sfx at={0.4} src="sfx/impacto.wav" volume={0.35} />
			<Sfx at={1.72} src="sfx/sparkle.wav" volume={0.35} />
			{SCENES.slice(1).map((sc, i) => (
				<Sfx key={`w${i}`} at={sc.from - 0.1} src={i % 2 ? 'sfx/whoosh-corto.wav' : 'sfx/whoosh.wav'} volume={0.36} />
			))}
			<Sfx at={S(2) + 0.1} src="sfx/impacto.wav" volume={0.32} />
			<Sfx at={S(5) + 0.1} src="sfx/impacto.wav" volume={0.32} />
			<Sfx at={S(6) + 0.1} src="sfx/impacto.wav" volume={0.3} />
			<Sfx at={S(9) + 0.1} src="sfx/impacto.wav" volume={0.3} />
			{[
				S(1) + 0.2, S(1) + 0.75, S(2) + 0.6, S(2) + 1.0, S(2) + 1.4, S(3) + 0.1, S(3) + 0.5, S(3) + 0.9, S(4) + 0.5, S(5) + 0.7, S(6) + 0.7,
				S(7) + 0.1, S(8) + 0.1, S(9) + 0.6, S(9) + 1.1, S(10) + 0.1, S(11) + 0.1, S(11) + 0.5, S(12) + 0.3,
			].map((t, i) => (
				<Sfx key={`p${i}`} at={t} src="sfx/pop.wav" volume={0.26} />
			))}
			<Sfx at={S(13) + 0.1} src="sfx/remotion/whip.wav" volume={0.45} />
			<Sfx at={S(13) + 0.25} src="sfx/teclado-iphone.wav" volume={0.25} />
			<Sfx at={S(13) + 1.2} src="sfx/remotion/ding.wav" volume={0.4} />
			<Sfx at={S(14) + 0.7} src="sfx/pop.wav" volume={0.35} />
			<Sfx at={S(14) + 0.7 + 22 / FPS} src="sfx/remotion/mouse-click.wav" volume={0.6} />
			<Sfx at={S(14) + 0.75 + 22 / FPS} src="sfx/sparkle.wav" volume={0.35} />
		</AbsoluteFill>
	);
};

export const FelipeComposition: React.FC = () => {
	return (
		<Composition
			id="RoomTourFelipe"
			component={FelipeComponent}
			durationInFrames={sec(DURATION)}
			fps={FPS}
			width={1080}
			height={1920}
		/>
	);
};
