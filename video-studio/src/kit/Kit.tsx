// Kit del editor: piezas de motion graphics reutilizables con acabado profesional.
// Todo se anima con useCurrentFrame/interpolate (nunca transiciones CSS) y los tiempos van
// en SEGUNDOS del reel. Ver la ficha de uso en .claude/skills/editor-video/kit.md.
import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {FUENTES} from '../fonts';

export const ease = Easing.bezier(0.16, 1, 0.3, 1); // salida suave "de lujo"
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const useWindow = (from: number, to: number) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const a = Math.round(from * fps);
	const b = Math.round(to * fps);
	return {frame, fps, a, b, visible: frame >= a && frame < b, k: frame - a, out: interpolate(frame, [b - 6, b], [1, 0], clamp)};
};

// ---------------------------------------------------------------------------
// Revelado de texto
// ---------------------------------------------------------------------------
export type Entrada = 'subir' | 'mascara' | 'desenfoque' | 'espaciado' | 'golpe' | 'letras';

/**
 * Texto con entrada profesional:
 * - subir: sube con desenfoque (apoyo, subtítulos)
 * - mascara: aparece desde una máscara (titulares elegantes, lujo)
 * - desenfoque: de borroso a nítido, sin moverse (minimalista)
 * - espaciado: las letras se juntan desde muy separadas (marcas, lujo)
 * - golpe: entra grande y "cae" (impacto, cifras)
 * - letras: letra por letra con escalonado (ganchos)
 */
export const Texto: React.FC<{
	readonly from: number;
	readonly to: number;
	readonly children: string;
	readonly entrada?: Entrada;
	readonly style?: React.CSSProperties;
	readonly duracion?: number; // fotogramas de la entrada
}> = ({from, to, children, entrada = 'subir', style, duracion = 14}) => {
	const {visible, k, out} = useWindow(from, to);
	if (!visible) return null;
	const p = interpolate(k, [0, duracion], [0, 1], {...clamp, easing: ease});
	const base: React.CSSProperties = {whiteSpace: 'pre', ...style, opacity: out * (style?.opacity === undefined ? 1 : Number(style.opacity))};
	if (entrada === 'letras') {
		return (
			<div style={base}>
				{[...children].map((ch, i) => {
					const q = interpolate(k, [i * 1.5, i * 1.5 + 10], [0, 1], {...clamp, easing: ease});
					return (
						<span key={i} style={{display: 'inline-block', opacity: q, translate: `0px ${(1 - q) * 40}px`, filter: `blur(${(1 - q) * 6}px)`}}>
							{ch}
						</span>
					);
				})}
			</div>
		);
	}
	if (entrada === 'mascara') {
		return (
			<div style={{...base, overflow: 'hidden', paddingBottom: '0.12em'}}>
				<div style={{translate: `0px ${(1 - p) * 110}%`}}>{children}</div>
			</div>
		);
	}
	const fx: Record<Exclude<Entrada, 'letras' | 'mascara'>, React.CSSProperties> = {
		subir: {opacity: p, translate: `0px ${(1 - p) * 36}px`, filter: `blur(${(1 - p) * 8}px)`},
		desenfoque: {opacity: p, filter: `blur(${(1 - p) * 16}px)`},
		espaciado: {opacity: p, letterSpacing: `${interpolate(p, [0, 1], [0.6, Number(String(style?.letterSpacing ?? '0.08em').replace('em', ''))])}em`},
		golpe: {opacity: interpolate(k, [0, 4], [0, 1], clamp), scale: String(interpolate(k, [0, 9], [1.35, 1], {...clamp, easing: ease})), filter: `blur(${interpolate(k, [0, 7], [14, 0], clamp)}px)`},
	};
	const f = fx[entrada];
	return <div style={{...base, ...f, opacity: Number(f.opacity ?? 1) * out}}>{children}</div>;
};

// ---------------------------------------------------------------------------
// Línea fina que se dibuja (separador elegante bajo titulares)
// ---------------------------------------------------------------------------
export const Linea: React.FC<{
	readonly from: number;
	readonly to: number;
	readonly x: number;
	readonly y: number;
	readonly ancho: number;
	readonly color?: string;
	readonly grosor?: number;
	readonly centrada?: boolean;
}> = ({from, to, x, y, ancho, color = '#D9B36A', grosor = 3, centrada = true}) => {
	const {visible, k, out} = useWindow(from, to);
	if (!visible) return null;
	const w = interpolate(k, [0, 18], [0, ancho], {...clamp, easing: ease});
	return <div style={{position: 'absolute', top: y, left: centrada ? x - w / 2 : x, width: w, height: grosor, background: color, opacity: out}} />;
};

// ---------------------------------------------------------------------------
// Rótulo inferior (lower third): antetítulo + título + línea
// ---------------------------------------------------------------------------
export const Rotulo: React.FC<{
	readonly from: number;
	readonly to: number;
	readonly antetitulo: string;
	readonly titulo: string;
	readonly y?: number;
	readonly fuenteTitulo?: string;
	readonly fuenteApoyo?: string;
	readonly acento?: string;
	readonly numero?: string; // "01" para numerar ambientes
}> = ({from, to, antetitulo, titulo, y = 1180, fuenteTitulo = FUENTES.cormorant, fuenteApoyo = FUENTES.montserrat, acento = '#D9B36A', numero}) => {
	const sombra = '0 2px 18px rgba(0,0,0,0.45)';
	return (
		<>
			<Texto from={from} to={to} entrada="espaciado" style={{position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', fontFamily: fuenteApoyo, fontWeight: 500, fontSize: 30, letterSpacing: '0.42em', color: acento, textShadow: sombra}}>
				{numero ? `${numero}  ·  ${antetitulo.toUpperCase()}` : antetitulo.toUpperCase()}
			</Texto>
			<Texto from={from + 0.12} to={to} entrada="mascara" style={{position: 'absolute', left: 0, right: 0, top: y + 48, textAlign: 'center', fontFamily: fuenteTitulo, fontWeight: 500, fontSize: 92, lineHeight: 1, color: '#FFFFFF', textShadow: sombra}}>
				{titulo}
			</Texto>
			<Linea from={from + 0.3} to={to} x={540} y={y + 160} ancho={140} color={acento} grosor={2} />
		</>
	);
};

// ---------------------------------------------------------------------------
// Contador (precios, m², cifras) con formato colombiano/venezolano: 695.000.000
// ---------------------------------------------------------------------------
export const Contador: React.FC<{
	readonly from: number;
	readonly to: number;
	readonly valor: number;
	readonly prefijo?: string;
	readonly sufijo?: string;
	readonly segundos?: number;
	readonly style?: React.CSSProperties;
}> = ({from, to, valor, prefijo = '', sufijo = '', segundos = 1.1, style}) => {
	const {visible, k, fps, out} = useWindow(from, to);
	if (!visible) return null;
	const v = Math.round(interpolate(k, [0, segundos * fps], [0, valor], {...clamp, easing: Easing.out(Easing.cubic)}));
	return (
		<div style={{fontVariantNumeric: 'lining-nums tabular-nums', ...style, opacity: out}}>
			{prefijo}
			{v.toLocaleString('es-CO')}
			{sufijo}
		</div>
	);
};

// ---------------------------------------------------------------------------
// Botón de llamada a la acción con toque (presión + onda) y brillo que respira
// ---------------------------------------------------------------------------
export const BotonCTA: React.FC<{
	readonly from: number;
	readonly texto: string;
	readonly y?: number;
	readonly toque?: number; // segundos después de aparecer
	readonly fondo?: string;
	readonly color?: string;
	readonly fuente?: string;
}> = ({from, texto, y = 1330, toque = 0.75, fondo = 'linear-gradient(135deg, #F6DFA8, #D9B36A 60%, #B98E43)', color = '#111418', fuente = FUENTES.montserrat}) => {
	const {frame, fps, a} = useWindow(from, 9999);
	if (frame < a) return null;
	const k = frame - a;
	const t = Math.round(toque * fps);
	const pop = interpolate(k, [0, 12], [0.5, 1], {...clamp, easing: Easing.out(Easing.back(2))});
	const press = k >= t && k < t + 6 ? 0.93 : 1;
	const onda = interpolate(k, [t, t + 22], [0, 1], clamp);
	const brillo = 0.5 + 0.5 * Math.sin(k / 7);
	// Reflejo que cruza el botón
	const reflejo = interpolate((k % 75) / 75, [0, 0.4, 1], [-40, 140, 140]);
	return (
		<div style={{position: 'absolute', top: y, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
			<div style={{position: 'relative', scale: String(pop * press)}}>
				<div style={{position: 'absolute', inset: -18 - onda * 60, borderRadius: 999, border: `3px solid rgba(255,255,255,${(1 - onda) * 0.8})`}} />
				<div
					style={{
						position: 'relative',
						overflow: 'hidden',
						padding: '32px 70px',
						borderRadius: 999,
						background: fondo,
						boxShadow: `0 18px 44px rgba(0,0,0,0.4), 0 0 ${24 + brillo * 30}px rgba(217,179,106,0.5)`,
						fontFamily: fuente,
						fontWeight: 700,
						fontSize: 50,
						letterSpacing: '0.12em',
						color,
						whiteSpace: 'nowrap',
					}}
				>
					{texto}
					<div style={{position: 'absolute', top: 0, bottom: 0, left: `${reflejo}%`, width: '22%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)', rotate: '18deg'}} />
				</div>
			</div>
		</div>
	);
};

// ---------------------------------------------------------------------------
// Acabado de imagen: grano, viñeta, barras de cine, destello de luz
// ---------------------------------------------------------------------------
/** Grano de película animado (muy sutil: 0.04-0.08). Da textura "cine" a clips de IA o celular. */
export const Grano: React.FC<{readonly intensidad?: number}> = ({intensidad = 0.06}) => {
	const frame = useCurrentFrame();
	const seed = Math.floor(frame / 2) % 50;
	return (
		<AbsoluteFill style={{opacity: intensidad, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
			<svg width="100%" height="100%">
				<filter id={`grano-${seed}`}>
					<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} stitchTiles="stitch" />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width="100%" height="100%" filter={`url(#grano-${seed})`} />
			</svg>
		</AbsoluteFill>
	);
};

/** Viñeta: oscurece bordes para llevar la mirada al centro. */
export const Vineta: React.FC<{readonly fuerza?: number}> = ({fuerza = 0.45}) => (
	<AbsoluteFill style={{background: `radial-gradient(ellipse 75% 65% at 50% 48%, transparent 55%, rgba(0,0,0,${fuerza}) 100%)`, pointerEvents: 'none'}} />
);

/** Degradados arriba/abajo para que los textos se lean sobre cualquier toma. */
export const Degradados: React.FC<{readonly arriba?: number; readonly abajo?: number}> = ({arriba = 0.4, abajo = 0.5}) => (
	<AbsoluteFill style={{background: `linear-gradient(180deg, rgba(0,0,0,${arriba}) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 60%, rgba(0,0,0,${abajo}) 100%)`, pointerEvents: 'none'}} />
);

/** Destello de luz cálido (light leak) que cruza la pantalla: transición suave de lujo. */
export const Destello: React.FC<{readonly at: number; readonly segundos?: number; readonly color?: string}> = ({at, segundos = 0.9, color = '255,190,120'}) => {
	const {visible, k, fps} = useWindow(at - segundos / 2, at + segundos / 2);
	if (!visible) return null;
	const p = k / (segundos * fps);
	const o = interpolate(p, [0, 0.5, 1], [0, 0.75, 0]);
	const x = interpolate(p, [0, 1], [-30, 130]);
	return (
		<AbsoluteFill style={{mixBlendMode: 'screen', opacity: o, pointerEvents: 'none', background: `radial-gradient(ellipse 60% 90% at ${x}% 40%, rgba(${color},0.95), rgba(${color},0.25) 45%, transparent 70%)`}} />
	);
};

/** Flash blanco breve (corte con energía). */
export const Flash: React.FC<{readonly at: number; readonly color?: string}> = ({at, color = '#FFFFFF'}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const a = Math.round(at * fps);
	const o = interpolate(frame, [a - 2, a, a + 7], [0, 0.85, 0], clamp);
	return o > 0 ? <AbsoluteFill style={{background: color, opacity: o, pointerEvents: 'none'}} /> : null;
};

// ---------------------------------------------------------------------------
// Movimiento de cámara sobre fotos y transiciones de toma
// ---------------------------------------------------------------------------
export type Camara = 'acercar' | 'alejar' | 'derecha' | 'izquierda' | 'subir' | 'bajar' | 'quieto';

/** Estilo de movimiento para una foto/clip dentro de su Sequence (p = progreso 0-1). */
export const camara = (tipo: Camara, p: number, fuerza = 1): React.CSSProperties => {
	const z = 0.12 * fuerza;
	const d = 60 * fuerza;
	switch (tipo) {
		case 'acercar':
			return {scale: String(interpolate(p, [0, 1], [1.03, 1.03 + z]))};
		case 'alejar':
			return {scale: String(interpolate(p, [0, 1], [1.03 + z, 1.03]))};
		case 'derecha':
			return {scale: String(1.1 + z / 2), translate: `${interpolate(p, [0, 1], [-d, d])}px 0px`};
		case 'izquierda':
			return {scale: String(1.1 + z / 2), translate: `${interpolate(p, [0, 1], [d, -d])}px 0px`};
		case 'subir':
			return {scale: String(1.1 + z / 2), translate: `0px ${interpolate(p, [0, 1], [d, -d])}px`};
		case 'bajar':
			return {scale: String(1.1 + z / 2), translate: `0px ${interpolate(p, [0, 1], [-d, d])}px`};
		default:
			return {};
	}
};

/**
 * Entrada de toma (dentro de la Sequence de la toma, k = fotograma local):
 * - golpe: zoom 1.08 -> 1 (reels dinámicos)
 * - zoomDesenfoque: llega con zoom y desenfoque de movimiento (transición "smooth zoom")
 * - barrido: entra deslizando con desenfoque (whip pan)
 * - fundido: aparece desde negro (lujo, ritmo lento)
 */
export const entradaToma = (tipo: 'golpe' | 'zoomDesenfoque' | 'barrido' | 'fundido', k: number): React.CSSProperties => {
	if (tipo === 'golpe') return {scale: String(interpolate(k, [0, 9], [1.08, 1], {...clamp, easing: ease}))};
	if (tipo === 'zoomDesenfoque')
		return {scale: String(interpolate(k, [0, 10], [1.25, 1], {...clamp, easing: ease})), filter: `blur(${interpolate(k, [0, 8], [18, 0], clamp)}px)`};
	if (tipo === 'barrido') return {translate: `${interpolate(k, [0, 8], [420, 0], {...clamp, easing: ease})}px 0px`, filter: `blur(${interpolate(k, [0, 7], [24, 0], clamp)}px)`};
	return {opacity: interpolate(k, [0, 12], [0, 1], clamp)};
};

// ---------------------------------------------------------------------------
// Partículas doradas suaves (cierres de lujo)
// ---------------------------------------------------------------------------
export const Polvo: React.FC<{readonly cantidad?: number; readonly color?: string}> = ({cantidad = 40, color = '255,220,160'}) => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{new Array(cantidad).fill(0).map((_, i) => {
				const x = random(`x${i}`) * 1080;
				const vel = 0.4 + random(`v${i}`) * 1.1;
				const y = (random(`y${i}`) * 1920 - frame * vel * 2 + 1920 * 4) % 1920;
				const s = 3 + random(`s${i}`) * 6;
				const o = 0.25 + 0.5 * Math.abs(Math.sin(frame / (20 + i) + i));
				return <div key={i} style={{position: 'absolute', left: x + Math.sin(frame / 30 + i) * 12, top: y, width: s, height: s, borderRadius: 999, background: `rgba(${color},${o})`, filter: 'blur(1px)'}} />;
			})}
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------------------
// Guía de zonas seguras de Instagram/TikTok (solo para revisar; NO dejar en el render final)
// ---------------------------------------------------------------------------
/** Superpone las zonas que tapa la interfaz: 250 px arriba, 420 px abajo, columna derecha de 140 px. */
export const ZonaSegura: React.FC = () => (
	<AbsoluteFill style={{pointerEvents: 'none'}}>
		<div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 250, background: 'rgba(255,0,0,0.25)'}} />
		<div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: 420, background: 'rgba(255,0,0,0.25)'}} />
		<div style={{position: 'absolute', top: 900, bottom: 420, right: 0, width: 140, background: 'rgba(255,120,0,0.3)'}} />
		<div style={{position: 'absolute', top: 250, bottom: 420, left: 80, right: 80, border: '3px dashed rgba(0,255,120,0.8)'}} />
	</AbsoluteFill>
);
