import {Audio, Video} from '@remotion/media';
import * as L from 'lucide-react';
import {AbsoluteFill, Composition, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {helvetica, poppins} from './fonts';
import marcas from './crece-marcas.json';

// Reel "CRECE EN INSTAGRAM ASÍ". Base sin pausas y con la voz limpia: scripts/crece_base.py.
// Formato de la referencia "No se dice / Se dice": tabla de 6 filas sobre el pecho. Columna
// izquierda: íconos neón estilo Instagram que aparecen cuando nombra cada formato. Columna derecha:
// barras amarillas fijas que se retiran y revelan el "para qué" cuando lo dice. Cierre: COMENTA YO
// con la barra de comentario escribiéndose. Branding del manual: Poppins 800, rojo #C8102E, crema.
// Título fijo arriba en grande (gancho visual); tabla entre y 1150 y 1570 (bajo la barbilla, por encima del texto de Reels).

const FPS = 30;
const W = 'work/crece';
const DURACION = marcas.total;
const ROJO = '#C8102E';
const TINTA = '#141416';
const CREMA = '#F4EFE7';
const AMARILLO = '#F7D21E';
const VERDE = '#1FB36B';
const ZOOM = 1.35;
const TX = 540 - 530 * ZOOM;
const TY = 720 - 860 * ZOOM;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.22, 1, 0.36, 1);

type Pieza = (typeof marcas.piezas)[number];
const PIEZAS: Pieza[] = marcas.piezas;
// Segundo del original (dentro de la frase k) -> segundo del reel
const at = (k: number, s: number) => PIEZAS[k].t + (s - PIEZAS[k].a);
const F = (s: number) => Math.round(s * FPS);

// ------------------------------------------------------------------ íconos neón (degradado de Instagram)
const Neon: React.FC<{readonly id: string; readonly tam?: number; readonly children: React.ReactNode}> = ({id, tam = 64, children}) => (
	<svg width={tam} height={tam} viewBox="0 0 48 48" style={{overflow: 'visible', filter: 'drop-shadow(0 0 6px rgba(221,42,123,0.85)) drop-shadow(0 0 14px rgba(245,133,41,0.5))'}}>
		<defs>
			<linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
				<stop offset="0" stopColor="#FEDA75" />
				<stop offset="0.3" stopColor="#F58529" />
				<stop offset="0.6" stopColor="#DD2A7B" />
				<stop offset="1" stopColor="#8134AF" />
			</linearGradient>
		</defs>
		<g fill="none" stroke={`url(#${id})`} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
			{children}
		</g>
	</svg>
);

const ICONOS: Record<string, (id: string) => React.ReactNode> = {
	reel: (id) => (
		<Neon id={id}>
			<rect x="5" y="5" width="38" height="38" rx="10" />
			<path d="M5 16 H43 M15 5 L21 16 M27 5 L33 16" />
			<path d="M20 23 L31 29.5 L20 36 Z" />
		</Neon>
	),
	trial: (id) => (
		<Neon id={id}>
			<rect x="5" y="5" width="38" height="38" rx="10" strokeDasharray="5 4" />
			<path d="M20 17 L32 24 L20 31 Z" />
			<path d="M38 2 L38 9 M34.5 5.5 L41.5 5.5" />
		</Neon>
	),
	carrusel: (id) => (
		<Neon id={id}>
			<rect x="14" y="7" width="20" height="34" rx="5" />
			<path d="M9 11 H6 Q4 11 4 13 V35 Q4 37 6 37 H9 M39 11 H42 Q44 11 44 13 V35 Q44 37 42 37 H39" />
		</Neon>
	),
	historia: (id) => (
		<Neon id={id}>
			<path d="M24 5 A19 19 0 1 0 42.5 28" />
			<circle cx="38" cy="36" r="6" />
			<path d="M38 33 V39 M35 36 H41" />
		</Neon>
	),
	calendario: (id) => (
		<Neon id={id}>
			<rect x="6" y="9" width="36" height="33" rx="7" />
			<path d="M6 19 H42 M16 5 V13 M32 5 V13" />
			<path d="M15 27 H17 M23 27 H25 M31 27 H33 M15 34 H17 M23 34 H25" />
		</Neon>
	),
	idea: (id) => (
		<Neon id={id}>
			<path d="M17 32 Q17 27 13.5 23.5 A12 12 0 1 1 34.5 23.5 Q31 27 31 32 Z" />
			<path d="M18 37 H30 M20 42 H28" />
		</Neon>
	),
};

// Filas: [ícono, nombre, revelado, frase, segundo (original) del nombre, segundo del "para qué", tipo]
type Fila = {icono: string; nombre: string; texto: string; k: number; sNombre: number; sTexto: number; tipo?: 'falso' | 'cierto'};
const FILAS: Fila[] = [
	{icono: 'reel', nombre: 'Reels', texto: 'Llegar a más personas', k: 0, sNombre: 0.43, sTexto: 0.69},
	{icono: 'trial', nombre: 'Trial Reels', texto: 'Audiencia que no te conoce', k: 1, sNombre: 2.25, sTexto: 3.07},
	{icono: 'carrusel', nombre: 'Carruseles', texto: 'Emitir confianza', k: 2, sNombre: 5.25, sTexto: 5.77},
	{icono: 'historia', nombre: 'Historias', texto: 'Crear comunidad', k: 3, sNombre: 7.83, sTexto: 8.35},
	{icono: 'calendario', nombre: 'Publicar diario', texto: 'FALSO', k: 4, sNombre: 9.97, sTexto: 12.61, tipo: 'falso'},
	{icono: 'idea', nombre: 'Idea ganadora', texto: 'CIERTO', k: 5, sNombre: 13.57, sTexto: 16.51, tipo: 'cierto'},
];
const TOP = 1150;
const ALTO = 70;
const FIN_TABLA = at(6, 17.45); // cuando empieza "Comenta la palabra yo"

const FilaTabla: React.FC<{readonly f: Fila; readonly i: number}> = ({f, i}) => {
	const frame = useCurrentFrame();
	const a = F(at(f.k, f.sNombre));
	const r = F(at(f.k, f.sTexto));
	const q = interpolate(frame, [a, a + 10], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.7))});
	// La barra amarilla se retira hacia la derecha y deja ver el texto
	const barra = interpolate(frame, [r - 2, r + 9], [1, 0], {...clamp, easing: Easing.in(Easing.cubic)});
	const txt = interpolate(frame, [r + 2, r + 12], [0, 1], {...clamp, easing: ease});
	const color = f.tipo === 'falso' ? ROJO : f.tipo === 'cierto' ? VERDE : '#FFFFFF';
	return (
		<div style={{position: 'absolute', top: TOP + i * ALTO, left: 70, right: 70, height: ALTO - 10, display: 'flex', gap: 14}}>
			{/* Izquierda: placa oscura que recibe el ícono */}
			<div style={{width: 430, height: '100%', borderRadius: 14, background: 'rgba(14,14,16,0.42)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', gap: 16, padding: '0 16px', overflow: 'hidden'}}>
				{frame >= a ? (
					<>
						<div style={{scale: String(q), display: 'flex'}}>{ICONOS[f.icono](`g-${f.icono}`)}</div>
						<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 34, color: '#FFFFFF', opacity: q, translate: `${(1 - q) * -20}px 0px`, whiteSpace: 'nowrap'}}>{f.nombre}</div>
					</>
				) : null}
			</div>
			{/* Derecha: barra amarilla fija -> texto revelado */}
			<div style={{flex: 1, height: '100%', position: 'relative', borderRadius: 14, overflow: 'hidden'}}>
				<div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '0 18px', opacity: txt, background: 'rgba(14,14,16,0.42)', backdropFilter: 'blur(6px)'}}>
					{f.tipo === 'falso' ? <L.X size={40} color={ROJO} strokeWidth={4} /> : null}
					{f.tipo === 'cierto' ? <L.Check size={40} color={VERDE} strokeWidth={4} /> : null}
					<span style={{fontFamily: poppins, fontWeight: f.tipo ? 800 : 700, fontSize: f.tipo ? 40 : 30, color, letterSpacing: f.tipo ? '0.06em' : 0, whiteSpace: 'nowrap', textShadow: '0 2px 10px rgba(0,0,0,0.4)'}}>{f.texto}</span>
				</div>
				<div style={{position: 'absolute', inset: 0, background: AMARILLO, borderRadius: 14, transformOrigin: '100% 50%', scale: `${barra} 1`, boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.12)'}} />
			</div>
		</div>
	);
};

const Tabla: React.FC = () => {
	const frame = useCurrentFrame();
	const fin = F(FIN_TABLA);
	if (frame >= fin + 8) return null;
	const entra = interpolate(frame, [0, 8], [0, 1], {...clamp, easing: ease});
	const sale = interpolate(frame, [fin - 4, fin + 8], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
	return (
		<AbsoluteFill style={{opacity: entra * (1 - sale), translate: `0px ${sale * 60}px`}}>
			{FILAS.map((f, i) => (
				<FilaTabla key={f.icono} f={f} i={i} />
			))}
		</AbsoluteFill>
	);
};

// ------------------------------------------------------------------ título fijo
const Titulo: React.FC = () => {
	const frame = useCurrentFrame();
	const q = interpolate(frame, [0, 10], [0, 1], {...clamp, easing: ease});
	return (
		<div
			style={{
				position: 'absolute',
				top: 244,
				left: 0,
				right: 0,
				textAlign: 'center',
				opacity: q,
				translate: `0px ${(1 - q) * -20}px`,
				fontFamily: poppins,
				fontWeight: 800,
				fontSize: 104,
				lineHeight: 0.98,
				letterSpacing: '-0.02em',
				color: '#FFFFFF',
				textShadow: '0 6px 0 rgba(0,0,0,0.18), 0 10px 36px rgba(0,0,0,0.55)',
			}}
		>
			<div>CRECE EN</div>
			<div>
				INSTAGRAM <span style={{color: ROJO}}>ASÍ</span>
			</div>
		</div>
	);
};

// ------------------------------------------------------------------ cierre: COMENTA YO
const Cta: React.FC = () => {
	const frame = useCurrentFrame();
	const a = F(FIN_TABLA);
	if (frame < a) return null;
	const yo = F(at(6, 18.23));
	const plan = F(at(6, 19.29));
	const q1 = interpolate(frame, [a, a + 10], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.6))});
	const q2 = interpolate(frame, [yo, yo + 9], [0, 1], {...clamp, easing: Easing.out(Easing.back(2.2))});
	const barra = interpolate(frame, [yo + 4, yo + 14], [0, 1], {...clamp, easing: ease});
	const letras = frame >= yo + 12 ? Math.min(2, Math.floor((frame - yo - 12) / 4) + 1) : 0;
	const enviado = frame >= yo + 26;
	const pulso = enviado ? interpolate(frame, [yo + 26, yo + 32], [1.25, 1], clamp) : 1;
	const sale = interpolate(frame, [plan - 4, plan + 6], [0, 1], clamp);
	const q3 = interpolate(frame, [plan, plan + 12], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.5))});
	return (
		<AbsoluteFill>
			<div style={{position: 'absolute', top: 1160, left: 0, right: 0, textAlign: 'center', fontFamily: poppins, fontWeight: 800, fontSize: 100, color: '#FFFFFF', letterSpacing: '-0.02em', textShadow: '0 10px 36px rgba(0,0,0,0.5)', scale: String(q1)}}>
				COMENTA
			</div>
			{frame >= yo ? (
				<div style={{position: 'absolute', top: 1268, left: 0, right: 0, textAlign: 'center', fontFamily: poppins, fontWeight: 800, fontSize: 180, lineHeight: 1, color: ROJO, textShadow: '0 12px 40px rgba(0,0,0,0.45)', scale: String(q2)}}>
					YO
				</div>
			) : null}
			{/* Barra de comentario de Instagram que se escribe sola */}
			{frame >= yo + 4 ? (
				<div style={{position: 'absolute', top: 1474, left: 90, right: 90, opacity: barra * (1 - sale), translate: `0px ${(1 - barra) * 30 + sale * 30}px`}}>
					<div style={{display: 'flex', alignItems: 'center', gap: 18, background: '#FFFFFF', borderRadius: 999, padding: '12px 14px 12px 14px', boxShadow: '0 14px 36px rgba(0,0,0,0.35)'}}>
						<div style={{width: 58, height: 58, borderRadius: 29, background: 'linear-gradient(135deg,#FEDA75,#F58529,#DD2A7B,#8134AF)'}} />
						<div style={{flex: 1, fontFamily: helvetica, fontSize: 40, fontWeight: 700, color: TINTA}}>
							{'YO'.slice(0, letras)}
							{!enviado && frame % 14 < 7 ? <span style={{color: '#3897F0'}}>|</span> : null}
						</div>
						<div style={{width: 64, height: 64, borderRadius: 32, background: '#3897F0', display: 'flex', alignItems: 'center', justifyContent: 'center', scale: String(pulso)}}>
							<L.ArrowUp size={36} color="#FFFFFF" strokeWidth={3} />
						</div>
					</div>
				</div>
			) : null}
			{/* Lo que recibe */}
			{frame >= plan ? (
				<div style={{position: 'absolute', top: 1474, left: 0, right: 0, display: 'flex', justifyContent: 'center', scale: String(q3), opacity: q3}}>
					<div style={{display: 'flex', alignItems: 'center', gap: 16, background: CREMA, borderRadius: 999, padding: '14px 32px 14px 16px', boxShadow: '0 14px 36px rgba(0,0,0,0.35)'}}>
						<div style={{width: 60, height: 60, borderRadius: 30, background: ROJO, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
							<L.Gift size={34} color="#FFFFFF" strokeWidth={2} />
						</div>
						<span style={{fontFamily: poppins, fontWeight: 700, fontSize: 36, color: TINTA}}>Plan personalizado para tu negocio</span>
					</div>
				</div>
			) : null}
		</AbsoluteFill>
	);
};

const Sfx: React.FC<{readonly at: number; readonly src: string; readonly volume?: number}> = ({at: t0, src, volume = 0.3}) => (
	<Sequence from={Math.max(0, F(t0))} durationInFrames={3 * FPS}>
		<Audio src={staticFile(`sfx/${src}.wav`)} volume={volume} />
	</Sequence>
);

export const CreceComponent: React.FC = () => {
	const frame = useCurrentFrame();
	const fin = interpolate(frame, [F(DURACION) - 8, F(DURACION)], [1, 0], clamp);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<AbsoluteFill style={{opacity: fin}}>
				{/* Reencuadre: 1.35x y subido para que la cara quede más grande y alta (cara del original en
				    ~(530, 860) -> ~(540, 720)); la tabla y el título no se mueven */}
				<AbsoluteFill style={{transformOrigin: '0px 0px', scale: String(ZOOM), translate: `${TX}px ${TY}px`}}>
					<Video src={staticFile(`${W}/base.mp4`)} style={{position: 'absolute', width: '100%', height: '100%'}} />
				</AbsoluteFill>
				<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0) 26%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.38) 72%, rgba(0,0,0,0.2) 100%)'}} />
				<Tabla />
				<Cta />
				<Titulo />
			</AbsoluteFill>

			{/* ---------- Efectos de sonido ---------- */}
			{FILAS.map((f) => (
				<Sfx key={`i-${f.icono}`} at={at(f.k, f.sNombre) - 0.02} src="pop" volume={0.28} />
			))}
			{FILAS.map((f) => (
				<Sfx key={`b-${f.icono}`} at={at(f.k, f.sTexto) - 0.06} src={f.tipo === 'falso' ? 'error' : f.tipo === 'cierto' ? 'ding' : 'swipe'} volume={f.tipo ? 0.3 : 0.32} />
			))}
			<Sfx at={FIN_TABLA - 0.1} src="whoosh" volume={0.38} />
			<Sfx at={at(6, 18.23)} src="impacto" volume={0.36} />
			<Sfx at={at(6, 18.23) + 0.4} src="teclado-iphone" volume={0.3} />
			<Sfx at={at(6, 18.23) + 0.86} src="remotion/snapchat-notification" volume={0.3} />
			<Sfx at={at(6, 19.29)} src="brillo" volume={0.3} />
		</AbsoluteFill>
	);
};

export const CreceComposition: React.FC = () => (
	<Composition id="CreceEnInstagram" component={CreceComponent} durationInFrames={marcas.frames} fps={FPS} width={1080} height={1920} />
);
