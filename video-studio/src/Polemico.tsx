import {Video} from '@remotion/media';
import {AbsoluteFill, Composition, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {helvetica, poppins} from './fonts';
import marcas from './polemico-marcas.json';

// Reel "Opinión impopular: ¿TikTok le baja el prestigio a una marca?". El video ya trae sus textos
// (título, capturas del chat y la pregunta final); scripts/polemico_base.py solo quita las pausas.
// Aquí se añaden palabras clave en el tramo que no tenía texto (de "creencia limitante" a "el
// nombre de una aplicación"), con el branding del reel TOFU · MOFU · BOFU: Poppins 800 blanco y
// rojo DETRÁS de la persona, antetítulos Helvetica espaciados y tarjetas crema numeradas.
// Todo entre y 300 y 600 (encima de la cabeza): dentro de la cuadrícula 3:4 de Instagram.

const FPS = 30;
const W = 'work/polemico';
const ROJO = '#C8102E';
const TINTA = '#141416';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.22, 1, 0.36, 1);

// Segundo del video original -> segundo del reel (sin pausas)
const at = (s: number): number => {
	for (const p of marcas.tramos) {
		if (s < p.a) return p.t;
		if (s <= p.a + p.d) return p.t + (s - p.a);
	}
	return marcas.total;
};
const f = (s: number) => Math.round(at(s) * FPS);

// Persona recortada (recorte_persona.py sobre la base, de 27.2 s a 41.2 s del reel)
const PERSONA_DESDE = Math.round(27.2 * FPS);
const PERSONA_HASTA = Math.round(41.2 * FPS) - 2;

const Detras: React.FC<{readonly de: number; readonly a: number; readonly lineas: [string, number][]; readonly top: number; readonly size: number; readonly rojas?: number[]}> = ({
	de,
	a,
	lineas,
	top,
	size,
	rojas = [],
}) => {
	const frame = useCurrentFrame();
	const fa = f(de);
	const fb = f(a);
	if (frame < fa || frame >= fb) return null;
	const out = interpolate(frame, [fb - 5, fb], [1, 0], clamp);
	return (
		<div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', opacity: out}}>
			{lineas.map(([texto, s], i) => {
				const a0 = f(s);
				const q = interpolate(frame, [a0, a0 + 10], [0, 1], {...clamp, easing: ease});
				return (
					<div key={texto} style={{overflow: 'hidden', height: size * 0.98, opacity: frame >= a0 ? 1 : 0}}>
						<div
							style={{
								fontFamily: poppins,
								fontWeight: 800,
								fontSize: size,
								lineHeight: 0.98,
								letterSpacing: '-0.02em',
								color: rojas.includes(i) ? ROJO : '#FFFFFF',
								translate: `0px ${(1 - q) * 100}%`,
								textShadow: '0 10px 40px rgba(0,0,0,0.45)',
							}}
						>
							{texto}
						</div>
					</div>
				);
			})}
		</div>
	);
};

const Ante: React.FC<{readonly de: number; readonly a: number; readonly texto: string; readonly top: number}> = ({de, a, texto, top}) => {
	const frame = useCurrentFrame();
	const fa = f(de);
	const fb = f(a);
	if (frame < fa || frame >= fb) return null;
	const q = interpolate(frame, [fa, fa + 12], [0, 1], {...clamp, easing: ease});
	const o = Math.min(q, interpolate(frame, [fb - 5, fb], [1, 0], clamp));
	return (
		<div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', opacity: o, translate: `0px ${(1 - q) * 14}px`}}>
			<span style={{fontFamily: helvetica, fontWeight: 700, fontSize: 32, letterSpacing: `${0.3 + (1 - q) * 0.2}em`, color: '#FFFFFF', textShadow: '0 2px 14px rgba(0,0,0,0.6)'}}>{texto}</span>
		</div>
	);
};

// Tarjeta numerada (1, 2, 3): aparece cuando lo dice y se queda hasta el final de la lista
const Punto: React.FC<{readonly n: number; readonly de: number; readonly a: number; readonly texto: string; readonly top: number}> = ({n, de, a, texto, top}) => {
	const frame = useCurrentFrame();
	const fa = f(de);
	const fb = f(a);
	if (frame < fa || frame >= fb) return null;
	const q = interpolate(frame, [fa, fa + 12], [0, 1], {...clamp, easing: ease});
	const pop = interpolate(frame, [fa, fa + 12], [0.4, 1], {...clamp, easing: Easing.out(Easing.back(2))});
	const o = Math.min(q, interpolate(frame, [fb - 6, fb], [1, 0], clamp));
	return (
		<div style={{position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: o, translate: `${(1 - q) * -40}px 0px`}}>
			<div style={{display: 'flex', alignItems: 'center', gap: 18, background: 'rgba(244,239,231,0.97)', borderRadius: 999, padding: '12px 34px 12px 12px', boxShadow: '0 16px 40px rgba(0,0,0,0.4)', width: 800}}>
				<div style={{width: 64, height: 64, borderRadius: 32, background: ROJO, display: 'flex', alignItems: 'center', justifyContent: 'center', scale: String(pop), flexShrink: 0}}>
					<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 36, color: '#FFFFFF'}}>{n}</span>
				</div>
				<span style={{fontFamily: poppins, fontWeight: 700, fontSize: 38, color: TINTA, lineHeight: 1.05, whiteSpace: 'nowrap'}}>{texto}</span>
			</div>
		</div>
	);
};

const Persona: React.FC = () => {
	const frame = useCurrentFrame();
	if (frame < PERSONA_DESDE || frame > PERSONA_HASTA + 1) return null;
	const k = Math.min(frame - PERSONA_DESDE, PERSONA_HASTA - PERSONA_DESDE);
	return <Img src={staticFile(`${W}/persona2/${String(k).padStart(4, '0')}.webp`)} style={{position: 'absolute', width: '100%', height: '100%'}} />;
};

export const PolemicoComponent: React.FC = () => {
	const frame = useCurrentFrame();
	const conPersona = frame >= f(28.32) && frame < f(42.0);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Video src={staticFile(`${W}/base.mp4`)} style={{position: 'absolute', width: '100%', height: '100%'}} />

			{/* ---------- Palabras clave DETRÁS de la persona (tramo sin texto) ---------- */}
			<Detras de={28.32} a={29.6} lineas={[['CREENCIA', 28.32], ['LIMITANTE', 28.56]]} top={318} size={126} rojas={[1]} />
			<Detras de={29.66} a={31.68} lineas={[['TIKTOK =', 29.66], ['¿SOLO BAILES?', 31.0]]} top={318} size={112} rojas={[1]} />
			<Detras de={31.72} a={32.62} lineas={[['NADA', 31.72], ['QUE VER', 31.94]]} top={318} size={130} rojas={[1]} />
			<Detras de={33.4} a={34.86} lineas={[['PRESTIGIO', 33.48]]} top={380} size={150} />
			<Detras de={38.86} a={41.95} lineas={[['NO ES', 38.86], ['LA APP', 40.64]]} top={318} size={140} rojas={[1]} />

			{conPersona ? <Persona /> : null}

			{/* ---------- Delante ---------- */}
			<Ante de={32.64} a={38.8} texto="EL PRESTIGIO SE CONSTRUYE CON" top={262} />
			<Punto n={1} de={34.86} a={38.8} texto="Cómo presentas la propiedad" top={322} />
			<Punto n={2} de={36.08} a={38.8} texto="La información que ofreces" top={420} />
			<Punto n={3} de={37.52} a={38.8} texto="Tu experiencia" top={518} />
		</AbsoluteFill>
	);
};

export const PolemicoComposition: React.FC = () => (
	<Composition id="OpinionImpopularTikTok" component={PolemicoComponent} durationInFrames={marcas.frames} fps={FPS} width={1080} height={1920} />
);
