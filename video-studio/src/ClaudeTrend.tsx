import {Audio, Video} from '@remotion/media';
import * as L from 'lucide-react';
import {AbsoluteFill, Composition, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {helvetica, poppins} from './fonts';

// Trial reel "¿Claude se va de Venezuela?". El video va completo, sin cortes. Del 12.7 al 17.4 un
// panel de pizarra sube desde abajo y tapa las manos; del 17.4 al 24.8 (manos muy de cerca) entra
// una PIZARRA a pantalla completa, con el branding
// del reel TOFU · MOFU · BOFU: cuadrícula de libreta, trazos que se dibujan, Poppins tinta y rojo.
// Mientras habla se dibuja el logo de Claude y aparecen las ideas que dice. Todo entre y 250 y
// 1450 (zona segura de Reels y cuadrícula 3:4).

const FPS = 30;
const W = 'work/claude-trend';
const DURACION = 31.266667;
const TINTA = '#141416';
const ROJO = '#C8102E';
const GRIS = '#8C867D';
const CLAUDE = '#D97757'; // terracota de la marca Claude
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const F = (s: number) => Math.round(s * FPS);

const ENTRA = 17.4;
const SALE = 24.8;

// Trazo que se dibuja (dash = largo aproximado)
const Trazo: React.FC<{readonly d: string; readonly p: number; readonly color?: string; readonly ancho?: number; readonly dash?: number}> = ({d, p, color = TINTA, ancho = 7, dash = 1600}) => (
	<path d={d} fill="none" stroke={color} strokeWidth={ancho} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} strokeDashoffset={dash * (1 - p)} />
);

// Destello de Claude: rayos de distinto largo que salen del centro, dibujados uno por uno y
// rellenos al final (dibujo a mano, no el archivo del logo)
const RAYOS = [1, 0.78, 0.95, 0.7, 0.9, 0.82, 1, 0.74, 0.92, 0.8, 0.97, 0.72];
const LogoClaude: React.FC<{readonly from: number; readonly tam?: number}> = ({from, tam = 300}) => {
	const frame = useCurrentFrame();
	const a = F(from);
	const r = tam / 2;
	const relleno = interpolate(frame, [a + 30, a + 42], [0, 1], clamp);
	const latido = 1 + 0.025 * Math.sin((frame - a) / 8) * relleno;
	return (
		<svg width={tam} height={tam} viewBox={`${-r} ${-r} ${tam} ${tam}`} style={{overflow: 'visible', scale: String(latido)}}>
			{RAYOS.map((l, i) => {
				const ang = (i / RAYOS.length) * Math.PI * 2 - Math.PI / 2 + (i % 2 ? 0.06 : -0.04);
				const largo = r * l;
				const p = interpolate(frame, [a + i * 2, a + i * 2 + 10], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
				const x1 = Math.cos(ang) * r * 0.12;
				const y1 = Math.sin(ang) * r * 0.12;
				const x2 = Math.cos(ang) * largo;
				const y2 = Math.sin(ang) * largo;
				// Rayo afinado: un trazo grueso que al final se rellena
				return (
					<g key={i}>
						<line x1={x1} y1={y1} x2={x1 + (x2 - x1) * p} y2={y1 + (y2 - y1) * p} stroke={CLAUDE} strokeWidth={r * 0.13} strokeLinecap="round" opacity={0.35 + 0.65 * relleno} />
						<line x1={x1} y1={y1} x2={x1 + (x2 - x1) * p} y2={y1 + (y2 - y1) * p} stroke={TINTA} strokeWidth={4} strokeLinecap="round" opacity={1 - relleno} />
					</g>
				);
			})}
		</svg>
	);
};

// Palabra de pizarra con subrayado de marcador
const Marcador: React.FC<{readonly from: number; readonly texto: string; readonly size?: number; readonly color?: string; readonly subrayar?: boolean}> = ({
	from,
	texto,
	size = 80,
	color = TINTA,
	subrayar,
}) => {
	const frame = useCurrentFrame();
	const a = F(from);
	if (frame < a) return null;
	const q = interpolate(frame, [a, a + 10], [0, 1], {...clamp, easing: ease});
	const u = interpolate(frame, [a + 8, a + 20], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	return (
		<div style={{position: 'relative', display: 'inline-block', opacity: q, translate: `0px ${(1 - q) * 24}px`}}>
			<div style={{fontFamily: poppins, fontWeight: 800, fontSize: size, lineHeight: 1.05, color, letterSpacing: '-0.02em'}}>{texto}</div>
			{subrayar ? (
				<svg width="100%" height={26} viewBox="0 0 460 26" preserveAspectRatio="none" style={{position: 'absolute', left: 0, bottom: -16}}>
					<Trazo d="M6,16 Q120,4 240,12 T454,10" p={u} color={ROJO} ancho={8} dash={480} />
				</svg>
			) : null}
		</div>
	);
};

// País con pin dibujado
const Pais: React.FC<{readonly from: number; readonly nombre: string}> = ({from, nombre}) => {
	const frame = useCurrentFrame();
	const a = F(from);
	if (frame < a) return null;
	const q = interpolate(frame, [a, a + 12], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.8))});
	return (
		<div style={{display: 'flex', alignItems: 'center', gap: 14, scale: String(q), background: '#FFFFFF', border: `3px solid ${TINTA}`, borderRadius: 999, padding: '14px 30px 14px 20px', boxShadow: '6px 6px 0 rgba(20,20,22,0.12)'}}>
			<L.MapPin size={44} color={ROJO} strokeWidth={2.2} />
			<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 60, color: TINTA}}>{nombre}</span>
		</div>
	);
};

const Pizarra: React.FC = () => {
	const frame = useCurrentFrame();
	const a = F(ENTRA);
	const b = F(SALE);
	if (frame < a || frame >= b) return null;
	const entra = interpolate(frame, [a, a + 10], [0, 1], {...clamp, easing: ease});
	const sale = interpolate(frame, [b - 9, b], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
	// Tres momentos: países -> VPN -> igual que ChatGPT (cada bloque se desvanece al llegar el siguiente)
	const vis = (s0: number, s1: number) => Math.min(interpolate(frame, [F(s0), F(s0) + 8], [0, 1], clamp), interpolate(frame, [F(s1) - 6, F(s1)], [1, 0], clamp));
	return (
		<AbsoluteFill style={{translate: `0px ${(1 - entra + sale) * 1920}px`}}>
			<AbsoluteFill style={{background: '#FBF9F4'}} />
			<AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(20,20,22,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(20,20,22,0.06) 1px, transparent 1px)', backgroundSize: '54px 54px'}} />

			{/* Logo de Claude dibujándose arriba */}
			<div style={{position: 'absolute', top: 330, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22}}>
				<LogoClaude from={ENTRA + 0.15} tam={330} />
				<Marcador from={ENTRA + 0.9} texto="Claude" size={110} />
			</div>

			<div style={{position: 'absolute', top: 930, left: 80, right: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26}}>
				{/* 1. Estos países: Venezuela y Cuba */}
				<div style={{opacity: vis(17.64, 20.35), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26, position: 'absolute', top: 0, left: 0, right: 0}}>
					<div style={{fontFamily: helvetica, fontWeight: 700, fontSize: 34, letterSpacing: '0.3em', color: ROJO}}>NO PERMITIDO EN</div>
					<div style={{display: 'flex', gap: 26}}>
						<Pais from={18.62} nombre="Venezuela" />
						<Pais from={19.3} nombre="Cuba" />
					</div>
				</div>
				{/* 2. Pero lo sigues usando con tu VPN */}
				<div style={{opacity: vis(20.3, 22.9), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, position: 'absolute', top: 0, left: 0, right: 0}}>
					<div style={{fontFamily: helvetica, fontWeight: 700, fontSize: 34, letterSpacing: '0.3em', color: ROJO}}>¿NO LO PUEDES USAR?</div>
					<Marcador from={20.92} texto="Sí puedes," size={86} color={GRIS} />
					<div style={{display: 'flex', alignItems: 'center', gap: 20}}>
						<Check from={21.9} />
						<Marcador from={21.72} texto="con tu VPN" size={108} color={ROJO} subrayar />
					</div>
				</div>
				{/* 3. Igual que ChatGPT, desde hace años */}
				<div style={{opacity: vis(22.96, SALE + 1), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, position: 'absolute', top: 0, left: 0, right: 0}}>
					<div style={{fontFamily: helvetica, fontWeight: 700, fontSize: 34, letterSpacing: '0.3em', color: ROJO}}>NADA NUEVO</div>
					<Marcador from={23.1} texto="Igual que ChatGPT" size={92} />
					<Marcador from={24.2} texto="desde hace años" size={72} color={GRIS} />
				</div>
			</div>
		</AbsoluteFill>
	);
};

// Check dibujado dentro de un círculo
const Check: React.FC<{readonly from: number}> = ({from}) => {
	const frame = useCurrentFrame();
	const a = F(from);
	if (frame < a) return null;
	const p = interpolate(frame, [a, a + 14], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	return (
		<svg width={96} height={96} viewBox="0 0 96 96">
			<Trazo d="M48,6 A42,42 0 1 1 47.9,6" p={p} color={ROJO} ancho={6} dash={270} />
			<Trazo d="M28,50 L42,64 L70,34" p={interpolate(frame, [a + 8, a + 20], [0, 1], clamp)} color={ROJO} ancho={8} dash={70} />
		</svg>
	);
};

// Panel inferior (12.7 s -> pizarra completa): tapa las manos frente al pecho en "Anthropic lanzó
// sus nuevas políticas... no estaba permitido para estos países"; la cara sigue a la vista.
const PANEL_DE = 12.7;
const PANEL_TOP = 1150;
const PanelInferior: React.FC = () => {
	const frame = useCurrentFrame();
	const a = F(PANEL_DE);
	const b = F(ENTRA) + 12; // se va cuando la pizarra completa ya cubrió todo
	if (frame < a || frame >= b) return null;
	const entra = interpolate(frame, [a, a + 10], [0, 1], {...clamp, easing: ease});
	const cita = 'No permitido para estos países';
	const c0 = F(14.78);
	const letras = Math.round(interpolate(frame, [c0, F(16.4)], [0, cita.length], clamp));
	const cursor = frame >= c0 && Math.floor(frame / 8) % 2 === 0;
	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				right: 0,
				top: PANEL_TOP,
				height: 1920 - PANEL_TOP,
				background: '#FBF9F4',
				borderTopLeftRadius: 56,
				borderTopRightRadius: 56,
				boxShadow: '0 -20px 60px rgba(0,0,0,0.35)',
				translate: `0px ${(1 - entra) * (1920 - PANEL_TOP + 60)}px`,
				overflow: 'hidden',
			}}
		>
			<div style={{position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(20,20,22,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(20,20,22,0.06) 1px, transparent 1px)', backgroundSize: '54px 54px'}} />
			<div style={{position: 'absolute', top: 70, left: 70, right: 60, display: 'flex', alignItems: 'center', gap: 34}}>
				<LogoClaude from={PANEL_DE + 0.1} tam={190} />
				<div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
					<div style={{fontFamily: helvetica, fontWeight: 700, fontSize: 30, letterSpacing: '0.28em', color: ROJO, opacity: entra}}>ANTHROPIC · 12 NOV</div>
					<Marcador from={PANEL_DE + 0.2} texto="Nuevas políticas" size={64} />
					<Marcador from={PANEL_DE + 0.45} texto="territoriales" size={64} subrayar />
				</div>
			</div>
			{frame >= c0 ? (
				<div style={{position: 'absolute', top: 310, left: 70, right: 70, fontFamily: poppins, fontWeight: 700, fontSize: 50, color: TINTA}}>
					<span style={{color: ROJO}}>“</span>
					{cita.slice(0, letras)}
					{letras >= cita.length ? <span style={{color: ROJO}}>”</span> : <span style={{opacity: cursor ? 1 : 0, color: ROJO}}>|</span>}
				</div>
			) : null}
		</div>
	);
};

const Sfx: React.FC<{readonly at: number; readonly src: string; readonly volume?: number}> = ({at, src, volume = 0.3}) => (
	<Sequence from={F(at)} durationInFrames={3 * FPS}>
		<Audio src={staticFile(`sfx/${src}.wav`)} volume={volume} />
	</Sequence>
);

export const ClaudeTrendComponent: React.FC = () => (
	<AbsoluteFill style={{background: '#000'}}>
		<Video src={staticFile(`${W}/base.mp4`)} style={{position: 'absolute', width: '100%', height: '100%'}} />
		<PanelInferior />
		<Pizarra />
		{/* Efectos suaves (por debajo de la voz) */}
		<Sfx at={PANEL_DE - 0.08} src="whoosh-corto" volume={0.16} />
		<Sfx at={14.78} src="teclado-iphone" volume={0.12} />
		<Sfx at={ENTRA - 0.08} src="whoosh" volume={0.18} />
		<Sfx at={ENTRA + 0.15} src="texto" volume={0.14} />
		<Sfx at={18.62} src="pop" volume={0.14} />
		<Sfx at={19.25} src="pop" volume={0.14} />
		<Sfx at={21.9} src="tic" volume={0.16} />
		<Sfx at={23.1} src="texto" volume={0.12} />
		<Sfx at={SALE - 0.3} src="whoosh-corto" volume={0.16} />
	</AbsoluteFill>
);

export const ClaudeTrendComposition: React.FC = () => (
	<Composition id="ClaudeVenezuela" component={ClaudeTrendComponent} durationInFrames={Math.round(DURACION * FPS)} fps={FPS} width={1080} height={1920} />
);
