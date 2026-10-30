import {Audio, Video} from '@remotion/media';
import * as L from 'lucide-react';
import {AbsoluteFill, Composition, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {helvetica, poppins} from './fonts';
import marcas from './funnel-marcas.json';
import {Celular} from './kit/Efectos';
import {Grano, Vineta} from './kit/Kit';

// Reel "TOFU · MOFU · BOFU para asesores inmobiliarios". La base (frases elegidas, voz limpia y el
// gancho de referencia) la arma scripts/funnel_base.py y deja cada pieza en funnel-marcas.json.
// Sin subtítulos (Raquel los pone en otra app): la franja y 1150-1500 queda libre en las tomas
// a cámara. Todo lo importante va entre y 250 y 1150 para que la cuadrícula 3:4 de Instagram
// (y 240-1680) y la interfaz de Reels no lo tapen.

const FPS = 30;
const W = 'work/funnel';
const DURACION = marcas.total;
const CREMA = '#F4EFE7';
const TINTA = '#141416';
const ROJO = '#C8102E';
const GRIS = '#8C867D';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.22, 1, 0.36, 1);

type Pieza = (typeof marcas.piezas)[number];
const PIEZAS: Pieza[] = marcas.piezas;
const pieza = (id: string) => {
	const p = PIEZAS.find((q) => q.id === id);
	if (!p) throw new Error(`Pieza desconocida: ${id}`);
	return p;
};
const ini = (id: string) => pieza(id).t;
const fin = (id: string) => pieza(id).t + pieza(id).d;
// Segundo del video original -> segundo del reel (dentro de la pieza)
const at = (id: string, s: number) => pieza(id).t + (s - pieza(id).a);

// Encuadre de cada pieza: un ángulo distinto cada 1,5-3 s (una sola cámara -> reencuadres)
type Encuadre = 'ancho' | 'medio' | 'cerca' | 'split' | 'gancho';
const ENCUADRE: Record<string, Encuadre> = {
	hook: 'ancho', tofu: 'split', atraccion: 'split', pregunta: 'cerca', gancho: 'gancho', tendencias: 'medio', alcance: 'cerca',
	mofu: 'split', confianza: 'split', zonas: 'ancho', documentos: 'cerca', bofu: 'split', conversion: 'split', casos: 'medio',
	dias: 'ancho', testimonios: 'cerca', resultados: 'medio', clientes: 'cerca', importante: 'split', vender: 'split',
};
const ESCALA: Record<Encuadre, number> = {ancho: 1, medio: 1.14, cerca: 1.3, split: 1, gancho: 1};
const ORIGEN = '540px 880px'; // la cara
const PANEL = 860; // alto del panel en pantalla dividida
const BAJAR = 330; // en pantalla dividida la persona baja para quedar bajo el panel

const piezaEn = (t: number) => [...PIEZAS].reverse().find((p) => t >= p.t) ?? PIEZAS[0];

// Transformación de la toma en el instante t (la misma para el video y la persona recortada)
const useToma = () => {
	const frame = useCurrentFrame();
	const t = frame / FPS;
	const p = piezaEn(t);
	const e = ENCUADRE[p.id];
	const k = frame - Math.round(p.t * FPS);
	// Cada cambio de ángulo entra con un mini zoom que se asienta (se siente como otra cámara)
	const golpe = e === 'split' ? 1 : interpolate(k, [0, 9], [1.045, 1], {...clamp, easing: ease});
	// Empuje lento dentro de la toma para que nunca esté quieta
	const empuje = interpolate(k, [0, p.d * FPS], [1, 1.03], clamp);
	const s = ESCALA[e] * golpe * empuje;
	return {e, style: {transformOrigin: ORIGEN, scale: String(s), translate: e === 'split' ? `0px ${BAJAR}px` : '0px 0px'} as React.CSSProperties};
};

// ------------------------------------------------------------------ texto detrás de la persona
const Detras: React.FC<{readonly from: number; readonly to: number; readonly lineas: string[]; readonly top: number; readonly size: number; readonly colores?: string[]; readonly paso?: number}> = ({
	from,
	to,
	lineas,
	top,
	size,
	colores = [],
	paso = 0,
}) => {
	const frame = useCurrentFrame();
	const a = Math.round(from * FPS);
	const b = Math.round(to * FPS);
	if (frame < a || frame >= b) return null;
	const out = interpolate(frame, [b - 5, b], [1, 0], clamp);
	return (
		<div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', opacity: out}}>
			{lineas.map((l, i) => {
				const a0 = a + Math.round(i * paso * FPS);
				const q = interpolate(frame, [a0, a0 + 10], [0, 1], {...clamp, easing: ease});
				return (
					<div key={l} style={{overflow: 'hidden', height: size * 0.98, opacity: frame >= a0 ? 1 : 0}}>
						<div
							style={{
								fontFamily: poppins,
								fontWeight: 800,
								fontSize: size,
								lineHeight: 0.98,
								letterSpacing: '-0.02em',
								color: colores[i] ?? '#FFFFFF',
								translate: `0px ${(1 - q) * 100}%`,
								textShadow: '0 10px 40px rgba(0,0,0,0.35)',
							}}
						>
							{l}
						</div>
					</div>
				);
			})}
		</div>
	);
};

// Gancho: cada palabra aparece cuando la dice (TOFU y MOFU arriba, BOFU en rojo debajo, con la
// cabeza tapando apenas su base)
const FilaDetras: React.FC<{readonly palabras: [string, number][]; readonly hasta: number; readonly top: number; readonly size: number}> = ({palabras, hasta, top, size}) => {
	const frame = useCurrentFrame();
	const b = Math.round(hasta * FPS);
	if (frame < Math.round(palabras[0][1] * FPS) || frame >= b) return null;
	const out = interpolate(frame, [b - 5, b], [1, 0], clamp);
	const xs = [-215, 215, 0];
	const ys = [0, 0, size * 0.8];
	return (
		<div style={{position: 'absolute', top, left: 0, right: 0, opacity: out}}>
			{palabras.map(([p, s], i) => {
				const a = Math.round(s * FPS);
				const q = interpolate(frame, [a, a + 9], [0, 1], {...clamp, easing: ease});
				if (frame < a) return null;
				return (
					<div key={p} style={{position: 'absolute', top: ys[i], left: 0, right: 0, textAlign: 'center', translate: `${xs[i]}px 0px`}}>
						<div style={{display: 'inline-block', overflow: 'hidden', height: size * 0.98}}>
							<div style={{fontFamily: poppins, fontWeight: 800, fontSize: size, lineHeight: 0.98, letterSpacing: '-0.02em', color: i === 2 ? ROJO : '#FFFFFF', translate: `0px ${(1 - q) * 100}%`, textShadow: '0 10px 40px rgba(0,0,0,0.35)'}}>
								{p}
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
};

// Antetítulo pequeño en mayúsculas espaciadas (delante)
const Ante: React.FC<{readonly from: number; readonly to: number; readonly texto: string; readonly top: number; readonly color?: string; readonly icono?: React.ReactNode}> = ({
	from,
	to,
	texto,
	top,
	color = '#FFFFFF',
	icono,
}) => {
	const frame = useCurrentFrame();
	const a = Math.round(from * FPS);
	const b = Math.round(to * FPS);
	if (frame < a || frame >= b) return null;
	const q = interpolate(frame, [a, a + 12], [0, 1], {...clamp, easing: ease});
	const o = Math.min(q, interpolate(frame, [b - 5, b], [1, 0], clamp));
	return (
		<div style={{position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, opacity: o, translate: `0px ${(1 - q) * 14}px`}}>
			{icono}
			<div style={{fontFamily: helvetica, fontWeight: 700, fontSize: 32, letterSpacing: `${0.34 + (1 - q) * 0.2}em`, color, textShadow: '0 2px 14px rgba(0,0,0,0.45)'}}>{texto}</div>
		</div>
	);
};

// Ícono de línea que se dibuja, en una placa de vidrio (elegante sobre video)
const Placa: React.FC<{readonly from: number; readonly to: number; readonly x: number; readonly y: number; readonly Ic: L.LucideIcon; readonly tam?: number; readonly texto?: string}> = ({
	from,
	to,
	x,
	y,
	Ic,
	tam = 150,
	texto,
}) => {
	const frame = useCurrentFrame();
	const a = Math.round(from * FPS);
	const b = Math.round(to * FPS);
	if (frame < a || frame >= b) return null;
	const pop = interpolate(frame, [a, a + 12], [0.6, 1], {...clamp, easing: Easing.out(Easing.back(1.8))});
	const o = Math.min(interpolate(frame, [a, a + 6], [0, 1], clamp), interpolate(frame, [b - 5, b], [1, 0], clamp));
	const dib = interpolate(frame, [a + 3, a + 24], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const id = `pl-${Math.round(from * 100)}`;
	return (
		<div className={id} style={{position: 'absolute', left: x - tam / 2, top: y - tam / 2, width: tam, opacity: o, scale: String(pop), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12}}>
			<style>{`.${id} svg * { stroke-dasharray: 90; stroke-dashoffset: ${90 * (1 - dib)}; }`}</style>
			<div
				style={{
					width: tam,
					height: tam,
					borderRadius: tam / 2,
					background: 'rgba(255,255,255,0.16)',
					border: '1.5px solid rgba(255,255,255,0.6)',
					boxShadow: '0 14px 36px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)',
					backdropFilter: 'blur(14px)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<Ic size={tam * 0.5} color="#FFFFFF" strokeWidth={1.6} />
			</div>
			{texto ? (
				<div style={{fontFamily: helvetica, fontWeight: 700, fontSize: 26, letterSpacing: '0.2em', color: '#FFFFFF', whiteSpace: 'nowrap', textShadow: '0 2px 12px rgba(0,0,0,0.5)'}}>{texto}</div>
			) : null}
		</div>
	);
};

// ------------------------------------------------------------------ embudo (pantalla dividida)
type Nivel = 'tofu' | 'mofu' | 'bofu';
const NIVELES: {id: Nivel; nombre: string; ingles: string; etapa: string; Ic: L.LucideIcon}[] = [
	{id: 'tofu', nombre: 'TOFU', ingles: 'Top of the funnel', etapa: 'ATRACCIÓN', Ic: L.Megaphone},
	{id: 'mofu', nombre: 'MOFU', ingles: 'Middle of the funnel', etapa: 'EDUCACIÓN', Ic: L.GraduationCap},
	{id: 'bofu', nombre: 'BOFU', ingles: 'Bottom of the funnel', etapa: 'CONVERSIÓN', Ic: L.KeyRound},
];

// Embudo dibujado: 3 franjas trapezoidales; la activa se llena de rojo
const Embudo: React.FC<{readonly encendido: (n: Nivel) => number; readonly dibujo: number}> = ({encendido, dibujo}) => {
	const w = 470;
	const filas = [
		{y: 0, a: w, b: w * 0.76},
		{y: 150, a: w * 0.72, b: w * 0.48},
		{y: 300, a: w * 0.44, b: w * 0.2},
	];
	return (
		<svg width={w} height={450} viewBox={`0 0 ${w} 450`} style={{overflow: 'visible'}}>
			{filas.map((f, i) => {
				const n = NIVELES[i];
				const on = encendido(n.id);
				const x0 = (w - f.a) / 2;
				const x1 = (w - f.b) / 2;
				const d = `M${x0},${f.y} L${x0 + f.a},${f.y} L${x1 + f.b},${f.y + 138} L${x1},${f.y + 138} Z`;
				const q = interpolate(dibujo, [i * 0.18, i * 0.18 + 0.5], [0, 1], clamp);
				return (
					<g key={n.id} opacity={q} transform={`translate(0 ${(1 - q) * -20})`}>
						<path d={d} fill={on > 0 ? ROJO : 'transparent'} fillOpacity={on} stroke={on > 0.5 ? ROJO : TINTA} strokeWidth={2.5} strokeLinejoin="round" />
						<text x={w / 2} y={f.y + 84} textAnchor="middle" fontFamily={poppins} fontWeight={800} fontSize={i === 2 ? 40 : 50} fill={on > 0.5 ? '#FFFFFF' : TINTA} letterSpacing="1">
							{n.nombre}
						</text>
					</g>
				);
			})}
		</svg>
	);
};

const Item: React.FC<{readonly from: number; readonly Ic: L.LucideIcon; readonly texto: string}> = ({from, Ic, texto}) => {
	const frame = useCurrentFrame();
	const a = Math.round(from * FPS);
	if (frame < a) return null;
	const q = interpolate(frame, [a, a + 12], [0, 1], {...clamp, easing: ease});
	return (
		<div style={{display: 'flex', alignItems: 'center', gap: 16, opacity: q, translate: `${(1 - q) * 30}px 0px`}}>
			<div style={{width: 58, height: 58, borderRadius: 29, background: TINTA, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
				<Ic size={30} color="#FFFFFF" strokeWidth={1.8} />
			</div>
			<div style={{fontFamily: helvetica, fontSize: 34, fontWeight: 600, color: TINTA, lineHeight: 1.15}}>{texto}</div>
		</div>
	);
};

const Panel: React.FC<{
	readonly from: number;
	readonly to: number;
	readonly nivel: Nivel | 'todos';
	readonly items?: {at: number; Ic: L.LucideIcon; texto: string}[];
	readonly encender?: Partial<Record<Nivel, number>>; // para 'todos': segundo en que se enciende cada nivel
	readonly pie?: React.ReactNode;
}> = ({from, to, nivel, items = [], encender = {}, pie}) => {
	const frame = useCurrentFrame();
	const a = Math.round(from * FPS);
	const b = Math.round(to * FPS);
	if (frame < a || frame >= b) return null;
	const entra = interpolate(frame, [a, a + 12], [0, 1], {...clamp, easing: ease});
	const sale = interpolate(frame, [b - 8, b], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
	const dibujo = interpolate(frame, [a + 4, a + 30], [0, 1], clamp);
	const encendido = (n: Nivel) => {
		if (nivel === 'todos') {
			const s = encender[n];
			return s === undefined ? 0 : interpolate(frame, [Math.round(s * FPS), Math.round(s * FPS) + 6], [0, 1], clamp);
		}
		return n === nivel ? interpolate(frame, [a + 14, a + 22], [0, 1], clamp) : 0;
	};
	const info = nivel === 'todos' ? null : NIVELES.find((n) => n.id === nivel)!;
	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				right: 0,
				top: 0,
				height: PANEL,
				background: CREMA,
				borderBottomLeftRadius: 56,
				borderBottomRightRadius: 56,
				boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
				translate: `0px ${(-1 + entra - sale) * (PANEL + 60)}px`,
				overflow: 'hidden',
			}}
		>
			{/* Cuadrícula muy suave tipo libreta (guiño a las referencias, versión limpia) */}
			<div style={{position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(20,20,22,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(20,20,22,0.05) 1px, transparent 1px)', backgroundSize: '54px 54px'}} />
			<div style={{position: 'absolute', top: 268, left: 70}}>
				<Embudo encendido={encendido} dibujo={dibujo} />
			</div>
			<div style={{position: 'absolute', top: 280, left: 590, right: 60, display: 'flex', flexDirection: 'column', gap: 18}}>
				{info ? (
					<>
						<div style={{display: 'flex', alignItems: 'center', gap: 12}}>
							<info.Ic size={34} color={ROJO} strokeWidth={2} />
							<div style={{fontFamily: helvetica, fontWeight: 700, fontSize: 28, letterSpacing: '0.3em', color: ROJO}}>{info.etapa}</div>
						</div>
						<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 104, lineHeight: 0.95, color: TINTA, letterSpacing: '-0.02em'}}>{info.nombre}</div>
						<div style={{fontFamily: helvetica, fontSize: 30, color: GRIS, marginBottom: 14}}>{info.ingles}</div>
						{items.map((it) => (
							<Item key={it.texto} from={it.at} Ic={it.Ic} texto={it.texto} />
						))}
					</>
				) : (
					pie
				)}
			</div>
		</div>
	);
};

// ------------------------------------------------------------------ ganchos de referencia
const Clip: React.FC<{readonly src: string; readonly desde?: number}> = ({src, desde = 0}) => (
	<Video src={staticFile(src)} muted trimBefore={Math.round(desde * FPS)} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover'}} />
);

const formato = (n: number) => (n >= 10000 ? `${(n / 1000).toLocaleString('es', {maximumFractionDigits: 1})} mil` : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'));

const Stat: React.FC<{readonly from: number; readonly Ic: L.LucideIcon; readonly valor: number; readonly lleno?: boolean}> = ({from, Ic, valor, lleno}) => {
	const frame = useCurrentFrame();
	const a = Math.round(from * FPS);
	if (frame < a) return null;
	const q = interpolate(frame, [a, a + 10], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.6))});
	const v = interpolate(frame, [a, a + 26], [0, valor], {...clamp, easing: Easing.out(Easing.cubic)});
	return (
		<div style={{display: 'flex', alignItems: 'center', gap: 10, scale: String(q), background: 'rgba(255,255,255,0.95)', borderRadius: 999, padding: '12px 22px', boxShadow: '0 10px 26px rgba(0,0,0,0.3)'}}>
			<Ic size={30} color={ROJO} fill={lleno ? ROJO : 'none'} strokeWidth={2.2} />
			<div style={{fontFamily: poppins, fontWeight: 700, fontSize: 30, color: TINTA}}>{formato(Math.round(v))}</div>
		</div>
	);
};

const Ganchos: React.FC = () => {
	const frame = useCurrentFrame();
	const a = ini('gancho');
	const b = fin('gancho');
	const fa = Math.round(a * FPS);
	const fb = Math.round(b * FPS);
	if (frame < fa - 2 || frame >= fb) return null;
	const q = (d: number) => interpolate(frame, [fa + d, fa + d + 14], [0, 1], {...clamp, easing: ease});
	const out = interpolate(frame, [fb - 6, fb], [1, 0], clamp);
	return (
		<AbsoluteFill style={{opacity: out}}>
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(20,20,22,0.55), rgba(20,20,22,0.8))'}} />
			<Ante from={a} to={b} texto="GANCHOS QUE SE HICIERON VIRALES" top={262} />
			{/* Celulares de los lados: otros dos creadores con el mismo gancho */}
			<div style={{opacity: q(4), translate: `${(1 - q(4)) * -120}px 0px`}}>
				<Celular x={215} y={900} ancho={300} rotar={-8}>
					<Sequence from={fa} premountFor={FPS}>
						<Clip src={`${W}/gancho-3927.mp4`} />
					</Sequence>
				</Celular>
			</div>
			<div style={{opacity: q(4), translate: `${(1 - q(4)) * 120}px 0px`}}>
				<Celular x={865} y={900} ancho={300} rotar={8}>
					<Sequence from={fa} premountFor={FPS}>
						<Clip src={`${W}/gancho-3928.mp4`} />
					</Sequence>
				</Celular>
			</div>
			{/* Celular central: Christian Villar, con su audio */}
			<div style={{scale: String(0.85 + 0.15 * q(0)), opacity: q(0)}}>
				<Celular x={540} y={905} ancho={420}>
					<Sequence from={fa} premountFor={FPS}>
						<Clip src={`${W}/gancho-3929.mp4`} />
					</Sequence>
				</Celular>
			</div>
			{/* Estadísticas reales de ese video (captura de Raquel) */}
			<div style={{position: 'absolute', top: 1360, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 14}}>
				<Stat from={a + 0.5} Ic={L.Heart} valor={167200} lleno />
				<Stat from={a + 0.8} Ic={L.MessageCircle} valor={1118} />
				<Stat from={a + 1.1} Ic={L.Bookmark} valor={19300} />
				<Stat from={a + 1.4} Ic={L.Send} valor={14300} />
			</div>
		</AbsoluteFill>
	);
};

// ------------------------------------------------------------------ tarjetas BOFU
const Tarjeta: React.FC<{readonly from: number; readonly to: number; readonly children: React.ReactNode; readonly top?: number}> = ({from, to, children, top = 262}) => {
	const frame = useCurrentFrame();
	const a = Math.round(from * FPS);
	const b = Math.round(to * FPS);
	if (frame < a || frame >= b) return null;
	const q = interpolate(frame, [a, a + 12], [0, 1], {...clamp, easing: ease});
	const o = Math.min(q, interpolate(frame, [b - 5, b], [1, 0], clamp));
	return (
		<div style={{position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: o, translate: `0px ${(1 - q) * -40}px`}}>
			<div style={{background: 'rgba(244,239,231,0.97)', borderRadius: 30, padding: '24px 32px', boxShadow: '0 20px 50px rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', gap: 22, minWidth: 640}}>
				{children}
			</div>
		</div>
	);
};

const Linea: React.FC<{readonly ancho: number}> = ({ancho}) => <div style={{width: ancho, height: 14, borderRadius: 7, background: 'rgba(20,20,22,0.14)'}} />;

const Estrellas: React.FC<{readonly from: number}> = ({from}) => {
	const frame = useCurrentFrame();
	return (
		<div style={{display: 'flex', gap: 6}}>
			{[0, 1, 2, 3, 4].map((i) => {
				const a = Math.round((from + 0.12 * i) * FPS);
				const q = interpolate(frame, [a, a + 8], [0, 1], {...clamp, easing: Easing.out(Easing.back(2))});
				return <L.Star key={i} size={34} color={ROJO} fill={ROJO} style={{scale: String(q)}} />;
			})}
		</div>
	);
};

const Circulo: React.FC<{readonly Ic: L.LucideIcon}> = ({Ic}) => (
	<div style={{width: 86, height: 86, borderRadius: 43, background: ROJO, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
		<Ic size={44} color="#FFFFFF" strokeWidth={1.8} />
	</div>
);

const TituloT: React.FC<{readonly titulo: string; readonly sub: string}> = ({titulo, sub}) => (
	<div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
		<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 44, color: TINTA, lineHeight: 1.05}}>{titulo}</div>
		<div style={{fontFamily: helvetica, fontSize: 28, color: GRIS}}>{sub}</div>
	</div>
);

// ------------------------------------------------------------------ sonido
const Sfx: React.FC<{readonly at: number; readonly src: string; readonly volume?: number}> = ({at: t0, src, volume = 0.35}) => (
	<Sequence from={Math.max(0, Math.round(t0 * FPS))} durationInFrames={3 * FPS} name={src}>
		<Audio src={staticFile(`sfx/${src}.wav`)} volume={volume} />
	</Sequence>
);

const Persona: React.FC = () => {
	const frame = useCurrentFrame();
	if (frame >= marcas.frames) return null;
	return <Img src={staticFile(`${W}/persona/${String(frame).padStart(4, '0')}.webp`)} style={{position: 'absolute', width: '100%', height: '100%'}} />;
};

// ------------------------------------------------------------------ composición
export const FunnelComponent: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const toma = useToma();
	const finOp = interpolate(t, [DURACION - 0.35, DURACION], [1, 0], clamp);
	// La persona recortada solo hace falta donde hay texto DETRÁS
	const detras = ['hook', 'pregunta', 'tendencias', 'alcance', 'zonas', 'documentos', 'resultados', 'clientes'].includes(piezaEn(t).id);

	const H = (s: number) => at('hook', s);
	const IMP = (s: number) => at('importante', s);

	return (
		<AbsoluteFill style={{background: TINTA}}>
			<AbsoluteFill style={{opacity: finOp}}>
				{/* Tomas (en el tramo del gancho: el clip de referencia, desenfocado de fondo) */}
				<AbsoluteFill style={{...toma.style, filter: toma.e === 'gancho' ? 'blur(28px) brightness(0.8)' : 'contrast(1.04) saturate(1.04)'}}>
					<Video src={staticFile(`${W}/base.mp4`)} style={{position: 'absolute', width: '100%', height: '100%'}} />
				</AbsoluteFill>
				<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0) 34%)', opacity: toma.e === 'split' || toma.e === 'gancho' ? 0 : 1}} />

				{/* ---------- Palabras clave DETRÁS de la persona ---------- */}
				<FilaDetras palabras={[['TOFU', H(0.3)], ['MOFU', H(1.14)], ['BOFU', H(1.74)]]} hasta={fin('hook')} top={300} size={140} />
				<Detras from={ini('pregunta')} to={fin('pregunta')} lineas={['¿COMPRAR', 'O ALQUILAR?']} top={290} size={108} colores={['#FFFFFF', ROJO]} paso={0.62} />
				<Detras from={ini('tendencias')} to={fin('tendencias')} lineas={['TENDENCIAS']} top={360} size={132} />
				<Detras from={ini('alcance')} to={fin('alcance')} lineas={['MÁS', 'ALCANCE']} top={300} size={140} colores={['#FFFFFF', ROJO]} paso={0.3} />
				<Detras from={ini('zonas')} to={fin('zonas')} lineas={['ZONAS']} top={330} size={190} />
				<Detras from={ini('documentos')} to={fin('documentos')} lineas={['DOCUMENTOS']} top={340} size={120} />
				<Detras from={ini('resultados')} to={fin('resultados')} lineas={['RESULTADOS', 'REALES']} top={300} size={124} colores={['#FFFFFF', ROJO]} paso={0.45} />
				<Detras from={ini('clientes')} to={fin('clientes')} lineas={['CLIENTES']} top={350} size={160} colores={[ROJO]} />

				{detras ? (
					<AbsoluteFill style={toma.style}>
						<Persona />
					</AbsoluteFill>
				) : null}

				{/* ---------- Delante ---------- */}
				<Ante from={H(1.9)} to={fin('hook')} texto="PARA ASESORES INMOBILIARIOS" top={250} icono={<L.House size={34} color="#FFFFFF" strokeWidth={1.8} />} />
				<Ante from={ini('pregunta')} to={fin('pregunta')} texto="EJEMPLO DE GANCHO" top={248} />
				<Placa from={ini('alcance') + 0.1} to={fin('alcance')} x={890} y={760} Ic={L.TrendingUp} />
				<Placa from={ini('zonas') + 0.35} to={fin('zonas')} x={880} y={760} Ic={L.MapPin} texto="PARA COMPRAR" />
				<Placa from={ini('documentos') + 0.3} to={fin('documentos')} x={880} y={780} Ic={L.FileText} texto="COMPRA · VENTA" />
				<Placa from={ini('clientes') + 0.15} to={fin('clientes')} x={880} y={800} Ic={L.KeyRound} />

				{/* BOFU: qué publicar (tarjetas de ejemplo, sin datos inventados) */}
				<Tarjeta from={ini('casos') + 0.1} to={fin('casos')}>
					<Circulo Ic={L.Trophy} />
					<TituloT titulo="Casos de éxito" sub="Propiedades que vendiste" />
				</Tarjeta>
				<Tarjeta from={ini('dias') + 0.1} to={fin('dias')}>
					<Circulo Ic={L.CalendarCheck} />
					<TituloT titulo="Vendida en X días" sub="Cuánto tardaste en cerrar" />
				</Tarjeta>
				<Tarjeta from={ini('testimonios') + 0.1} to={fin('testimonios')}>
					<Circulo Ic={L.MessageSquareQuote} />
					<div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
						<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 44, color: TINTA, lineHeight: 1.05}}>Testimonios</div>
						<Estrellas from={ini('testimonios') + 0.35} />
						<Linea ancho={360} />
						<Linea ancho={260} />
					</div>
				</Tarjeta>

				{/* ---------- Pantalla dividida: el embudo ---------- */}
				<Panel
					from={ini('tofu')}
					to={fin('atraccion')}
					nivel="tofu"
					items={[
						{at: at('atraccion', 6.5), Ic: L.Eye, texto: 'Que te descubran'},
						{at: at('atraccion', 7.0), Ic: L.House, texto: 'Ganchos que atraen'},
					]}
				/>
				<Panel
					from={ini('mofu')}
					to={fin('confianza')}
					nivel="mofu"
					items={[
						{at: at('confianza', 27.0), Ic: L.BookOpen, texto: 'Educas'},
						{at: at('confianza', 27.9), Ic: L.ShieldCheck, texto: 'Generas confianza'},
					]}
				/>
				<Panel
					from={ini('bofu')}
					to={fin('conversion')}
					nivel="bofu"
					items={[
						{at: at('conversion', 44.3), Ic: L.Handshake, texto: 'Cierras ventas'},
						{at: at('conversion', 44.9), Ic: L.Star, texto: 'Muestras resultados'},
					]}
				/>
				<Panel
					from={ini('importante')}
					to={DURACION}
					nivel="todos"
					encender={{tofu: IMP(114.23), mofu: IMP(114.83), bofu: IMP(115.19)}}
					pie={
						<div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
							<div style={{fontFamily: helvetica, fontWeight: 700, fontSize: 28, letterSpacing: '0.3em', color: ROJO}}>TU ESTRATEGIA</div>
							<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 62, lineHeight: 1, color: TINTA}}>Usa los 3 niveles</div>
							<Item from={at('vender', 116.5)} Ic={L.Handshake} texto="Para vender" />
							<Item from={at('vender', 117.8)} Ic={L.Users} texto="Para captar más" />
							<Item from={at('vender', 118.4)} Ic={L.Bookmark} texto="Guarda este video" />
						</div>
					}
				/>

				<Ganchos />
			</AbsoluteFill>

			<Vineta fuerza={0.22} />
			<Grano intensidad={0.035} />

			{/* ---------- Efectos de sonido (sin música) ---------- */}
			<Sfx at={H(0.3)} src="impacto" volume={0.3} />
			<Sfx at={H(1.14)} src="tic" volume={0.4} />
			<Sfx at={H(1.74)} src="impacto-2" volume={0.28} />
			<Sfx at={H(1.9)} src="texto" volume={0.3} />
			<Sfx at={ini('tofu') - 0.1} src="whoosh" volume={0.38} />
			<Sfx at={at('atraccion', 6.5)} src="pop" volume={0.26} />
			<Sfx at={at('atraccion', 7.0)} src="pop" volume={0.26} />
			<Sfx at={ini('pregunta') - 0.08} src="whoosh-corto" volume={0.36} />
			<Sfx at={ini('pregunta') + 0.62} src="tic" volume={0.35} />
			<Sfx at={ini('gancho') - 1.1} src="riser" volume={0.22} />
			<Sfx at={ini('gancho') - 0.06} src="swipe" volume={0.4} />
			<Sfx at={ini('gancho') + 0.5} src="ding" volume={0.24} />
			<Sfx at={ini('gancho') + 0.8} src="pop" volume={0.22} />
			<Sfx at={ini('gancho') + 1.1} src="pop" volume={0.22} />
			<Sfx at={ini('gancho') + 1.4} src="pop" volume={0.22} />
			<Sfx at={ini('tendencias') - 0.08} src="whoosh-2" volume={0.36} />
			<Sfx at={ini('alcance')} src="sube" volume={0.3} />
			<Sfx at={ini('mofu') - 0.1} src="whoosh" volume={0.38} />
			<Sfx at={at('confianza', 27.0)} src="pop" volume={0.26} />
			<Sfx at={at('confianza', 27.9)} src="pop" volume={0.26} />
			<Sfx at={ini('zonas') - 0.08} src="whoosh-3" volume={0.34} />
			<Sfx at={ini('zonas') + 0.35} src="ping" volume={0.24} />
			<Sfx at={ini('documentos') - 0.06} src="swipe" volume={0.32} />
			<Sfx at={ini('documentos') + 0.3} src="click" volume={0.3} />
			<Sfx at={ini('bofu') - 0.1} src="whoosh" volume={0.38} />
			<Sfx at={at('conversion', 44.3)} src="pop" volume={0.26} />
			<Sfx at={at('conversion', 44.9)} src="pop" volume={0.26} />
			<Sfx at={ini('casos') - 0.08} src="whoosh-corto" volume={0.34} />
			<Sfx at={ini('casos') + 0.15} src="reveal" volume={0.26} />
			<Sfx at={ini('dias') + 0.12} src="tic" volume={0.34} />
			<Sfx at={ini('testimonios') + 0.35} src="brillo" volume={0.26} />
			<Sfx at={ini('resultados') - 0.08} src="whoosh-2" volume={0.34} />
			<Sfx at={ini('clientes')} src="caja" volume={0.26} />
			<Sfx at={ini('importante') - 0.1} src="whoosh" volume={0.38} />
			<Sfx at={IMP(114.23)} src="tic" volume={0.36} />
			<Sfx at={IMP(114.83)} src="tic" volume={0.36} />
			<Sfx at={IMP(115.19)} src="impacto-2" volume={0.26} />
			<Sfx at={at('vender', 116.5)} src="pop" volume={0.24} />
			<Sfx at={at('vender', 117.8)} src="pop" volume={0.24} />
			<Sfx at={at('vender', 118.4)} src="brillo" volume={0.26} />
		</AbsoluteFill>
	);
};

export const FunnelComposition: React.FC = () => (
	<Composition id="FunnelInmobiliario" component={FunnelComponent} durationInFrames={marcas.frames} fps={FPS} width={1080} height={1920} />
);
