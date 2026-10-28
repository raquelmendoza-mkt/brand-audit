// Catálogo de transiciones para <TransitionSeries> (@remotion/transitions).
// Uso:
//   <TransitionSeries.Transition presentation={transicion('glitch')} timing={linearTiming({durationInFrames: 12})} />
// Las de @remotion/transitions marcadas "shader" usan WebGL (HTML-in-canvas); se probaron en el
// render headless (ver kit.md). Las "propias" son CSS puro: funcionan siempre.
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {blurSlide} from '@remotion/transitions/blur-slide';
import {clockWipe} from '@remotion/transitions/clock-wipe';
import {crossZoom} from '@remotion/transitions/cross-zoom';
import {dreamyZoom} from '@remotion/transitions/dreamy-zoom';
import {fade} from '@remotion/transitions/fade';
import {filmBurn} from '@remotion/transitions/film-burn';
import {flip} from '@remotion/transitions/flip';
import {iris} from '@remotion/transitions/iris';
import {linearBlur} from '@remotion/transitions/linear-blur';
import {pushCut} from '@remotion/transitions/push-cut';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {zoomBlur} from '@remotion/transitions/zoom-blur';
import {AbsoluteFill, interpolate, random} from 'remotion';

type Any = TransitionPresentation<Record<string, unknown>>;
type CP = TransitionPresentationComponentProps<Record<string, unknown>>;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// ---------------- Propias (CSS) ----------------

/** Barrido rápido con desenfoque de movimiento (whip pan): la toma sale y entra disparada. */
const Barrido: React.FC<CP> = ({presentationProgress: p, presentationDirection: dir, children}) => {
	const sale = dir === 'exiting';
	const x = sale ? interpolate(p, [0, 1], [0, -1080]) : interpolate(p, [0, 1], [1080, 0]);
	const blur = Math.sin(p * Math.PI) * 40;
	return <AbsoluteFill style={{translate: `${x}px 0px`, filter: `blur(${blur}px)`, scale: String(1 + Math.sin(p * Math.PI) * 0.08)}}>{children}</AbsoluteFill>;
};

/** Zoom "a través": la toma saliente se acerca hasta quemarse y la entrante aterriza con golpe. */
const ZoomGolpe: React.FC<CP> = ({presentationProgress: p, presentationDirection: dir, children}) => {
	if (dir === 'exiting') {
		return <AbsoluteFill style={{scale: String(interpolate(p, [0, 1], [1, 2.2])), filter: `blur(${p * 22}px) brightness(${1 + p * 0.8})`, opacity: interpolate(p, [0.6, 1], [1, 0], clamp)}}>{children}</AbsoluteFill>;
	}
	return <AbsoluteFill style={{scale: String(interpolate(p, [0, 1], [0.6, 1])), filter: `blur(${(1 - p) * 18}px)`, opacity: interpolate(p, [0, 0.4], [0, 1], clamp)}}>{children}</AbsoluteFill>;
};

/** Glitch: separación RGB, franjas desplazadas y parpadeo (tech, IA, impacto). */
const Glitch: React.FC<CP> = ({presentationProgress: p, presentationDirection: dir, children}) => {
	const fuerza = Math.sin(p * Math.PI);
	const visible = dir === 'exiting' ? p < 0.5 : p >= 0.5;
	if (!visible) return null;
	const seed = Math.floor(p * 20);
	const off = fuerza * 28;
	const franjas = new Array(6).fill(0).map((_, i) => ({top: random(`t${seed}${i}`) * 100, h: 2 + random(`h${seed}${i}`) * 9, dx: (random(`x${seed}${i}`) - 0.5) * 160 * fuerza}));
	return (
		<AbsoluteFill>
			<AbsoluteFill style={{translate: `${off}px 0px`, mixBlendMode: 'screen', filter: 'url(#rojo)', opacity: 0.9}}>{children}</AbsoluteFill>
			<AbsoluteFill style={{translate: `${-off}px 0px`, mixBlendMode: 'screen', opacity: 0.9}}>{children}</AbsoluteFill>
			{franjas.map((f, i) => (
				<AbsoluteFill key={i} style={{clipPath: `inset(${f.top}% 0 ${Math.max(0, 100 - f.top - f.h)}% 0)`, translate: `${f.dx}px 0px`}}>
					{children}
				</AbsoluteFill>
			))}
			<svg width="0" height="0">
				<filter id="rojo">
					<feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
				</filter>
			</svg>
		</AbsoluteFill>
	);
};

/** Revelado con forma: la toma nueva aparece dentro de un rectángulo redondeado que crece (elegante). */
const Ventana: React.FC<CP> = ({presentationProgress: p, presentationDirection: dir, children}) => {
	if (dir === 'exiting') return <AbsoluteFill style={{scale: String(interpolate(p, [0, 1], [1, 0.92])), filter: `brightness(${1 - p * 0.5})`}}>{children}</AbsoluteFill>;
	const e = 1 - Math.pow(1 - p, 3);
	const ins = interpolate(e, [0, 1], [42, 0]);
	return <AbsoluteFill style={{clipPath: `inset(${ins}% ${ins * 0.8}% round ${interpolate(e, [0, 1], [60, 0])}px)`}}>{children}</AbsoluteFill>;
};

/** Cortina diagonal con borde de luz (lujo). */
const Cortina: React.FC<CP> = ({presentationProgress: p, presentationDirection: dir, children}) => {
	if (dir === 'exiting') return <AbsoluteFill>{children}</AbsoluteFill>;
	const x = interpolate(p, [0, 1], [-30, 130]);
	return (
		<AbsoluteFill style={{clipPath: `polygon(0 0, ${x}% 0, ${x - 30}% 100%, 0 100%)`}}>
			{children}
			<AbsoluteFill style={{background: `linear-gradient(105deg, transparent ${x - 34}%, rgba(255,230,180,0.9) ${x - 31}%, transparent ${x - 28}%)`, mixBlendMode: 'screen'}} />
		</AbsoluteFill>
	);
};

/** Destello blanco: la saliente se quema a blanco y la entrante aparece desde blanco. */
const Destello: React.FC<CP> = ({presentationProgress: p, presentationDirection: dir, children}) => {
	const b = dir === 'exiting' ? 1 + p * 3 : 1 + (1 - p) * 3;
	const visible = dir === 'exiting' ? p < 0.5 : p >= 0.5;
	return visible ? <AbsoluteFill style={{filter: `brightness(${b})`}}>{children}</AbsoluteFill> : null;
};

const propia = (component: React.FC<CP>): Any => ({component, props: {}});

// ---------------- Catálogo ----------------
export const TRANSICIONES = {
	// Básicas (CSS, siempre funcionan)
	fundido: () => fade() as Any,
	deslizar: () => slide({direction: 'from-right'}) as Any,
	deslizarArriba: () => slide({direction: 'from-bottom'}) as Any,
	cortinilla: () => wipe({direction: 'from-left'}) as Any,
	voltear: () => flip({direction: 'from-right'}) as Any,
	reloj: () => clockWipe({width: 1080, height: 1920}) as unknown as Any,
	iris: () => iris({width: 1080, height: 1920}) as unknown as Any,
	// Propias (CSS)
	barrido: () => propia(Barrido),
	zoomGolpe: () => propia(ZoomGolpe),
	glitch: () => propia(Glitch),
	ventana: () => propia(Ventana),
	cortina: () => propia(Cortina),
	destello: () => propia(Destello),
	// Shaders de Remotion (WebGL)
	quemadura: () => filmBurn({}) as Any,
	zoomCruzado: () => crossZoom({}) as Any,
	zoomSueno: () => dreamyZoom({}) as Any,
	desenfoqueLineal: () => linearBlur({}) as Any,
	zoomDesenfoque: () => zoomBlur({}) as Any,
	empujon: () => pushCut({}) as Any,
	deslizarDesenfoque: () => blurSlide({}) as Any,
} as const;
export type NombreTransicion = keyof typeof TRANSICIONES;
export const transicion = (n: NombreTransicion): Any => TRANSICIONES[n]();
