import {Audio, Video} from '@remotion/media';
import * as L from 'lucide-react';
import {AbsoluteFill, Composition, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {helvetica, poppins} from './fonts';
import marcas from './taller-marcas.json';

// Anuncio (Meta Ads) "Taller IA que vende · 5 de diciembre · Valencia · Última edición".
// Base sin pausas, voz natural y cambios de ángulo 1.0x/1.15x en HD: scripts/taller_base.py.
// Morado de la marca (como el anuncio de la masterclass), Poppins 800 + Helvetica espaciada.
// Fijo arriba todo el video: TALLER / IA QUE VENDE / 5 DE DICIEMBRE · VALENCIA + sello ÚLTIMA
// EDICIÓN 2026 debajo. Sin música (Raquel la pone). Logos 3D (Claude, Venezuela) al nombrarlos; los temas del taller uno por uno sobre el
// pecho (la cara libre); cierre con botón RESERVA TU LUGAR y CUPOS LIMITADOS.

const FPS = 30;
const W = 'work/taller';
const DURACION = marcas.total;
const MORADO = '#8B5CF6';
const MORADO2 = '#B57BFF';
const MORADO3 = '#6D28D9';
const NOCHE = '#0D0A1A';
const ROJO = '#EF4444';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.22, 1, 0.36, 1);

// Segundo del video original -> segundo del anuncio (sin pausas ni la frase descartada)
const at = (s: number): number => {
	for (const p of marcas.tramos) {
		if (s < p.a) return p.t;
		if (s <= p.a + p.d) return p.t + (s - p.a);
	}
	return marcas.total;
};
const F = (s: number) => Math.round(at(s) * FPS);

const useVentana = (de: number, a: number, entrada = 12) => {
	const frame = useCurrentFrame();
	const fa = F(de);
	const fb = F(a);
	const visible = frame >= fa && frame < fb;
	const q = interpolate(frame, [fa, fa + entrada], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.6))});
	const o = Math.min(interpolate(frame, [fa, fa + 6], [0, 1], clamp), interpolate(frame, [fb - 6, fb], [1, 0], clamp));
	return {frame, fa, fb, visible, q, o};
};
const pop = (frame: number, s: number) => interpolate(frame, [F(s), F(s) + 11], [0, 1], {...clamp, easing: Easing.out(Easing.back(2))});

// ------------------------------------------------------------------ piezas comunes
const Vidrio: React.FC<{readonly children: React.ReactNode; readonly style?: React.CSSProperties}> = ({children, style}) => (
	<div
		style={{
			display: 'flex',
			alignItems: 'center',
			gap: 16,
			background: 'rgba(13,10,26,0.74)',
			border: '2px solid rgba(181,123,255,0.65)',
			borderRadius: 28,
			padding: '16px 28px',
			boxShadow: '0 18px 44px rgba(0,0,0,0.45), 0 0 34px rgba(139,92,246,0.45)',
			backdropFilter: 'blur(10px)',
			...style,
		}}
	>
		{children}
	</div>
);
const Circulo: React.FC<{readonly children: React.ReactNode; readonly tam?: number; readonly fondo?: string}> = ({children, tam = 72, fondo}) => (
	<div style={{width: tam, height: tam, borderRadius: tam / 2, background: fondo ?? `linear-gradient(135deg, ${MORADO2}, ${MORADO})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 24px rgba(139,92,246,0.7)'}}>
		{children}
	</div>
);
const Fila: React.FC<{readonly top: number; readonly children: React.ReactNode}> = ({top, children}) => (
	<div style={{position: 'absolute', top, left: 50, right: 50, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22}}>{children}</div>
);

// Logo 3D que entra con rebote y flota
const Logo3D: React.FC<{readonly src: string; readonly s: number; readonly tam: number; readonly frame: number; readonly giro?: number}> = ({src, s, tam, frame, giro = 0}) => {
	const q = pop(frame, s);
	const flota = Math.sin((frame - F(s)) / 10) * 6;
	return frame >= F(s) ? (
		<Img src={staticFile(`${W}/${src}`)} style={{width: tam, scale: String(q), rotate: `${(1 - q) * -40 + giro}deg`, translate: `0px ${flota}px`, filter: 'drop-shadow(0 18px 26px rgba(0,0,0,0.45))'}} />
	) : (
		<div style={{width: tam}} />
	);
};

// ------------------------------------------------------------------ gancho: Claude + Venezuela bloqueado
const Gancho: React.FC = () => {
	const v = useVentana(0.9, 2.86);
	if (!v.visible) return null;
	const candado = pop(v.frame, 1.6);
	const pregunta = pop(v.frame, 2.03);
	return (
		<AbsoluteFill style={{opacity: v.o}}>
			<Fila top={1250}>
				<Logo3D src="claude.png" s={0.97} tam={210} frame={v.frame} />
				<div style={{scale: String(candado), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
					<Circulo tam={110} fondo={`linear-gradient(135deg, #FF6B6B, ${ROJO})`}>
						<L.Lock size={58} color="#FFFFFF" strokeWidth={2.4} />
					</Circulo>
					<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 30, color: '#FFFFFF', letterSpacing: '0.08em', textShadow: '0 2px 12px rgba(0,0,0,0.6)'}}>BLOQUEADO</span>
				</div>
				<Logo3D src="venezuela.png" s={1.23} tam={230} frame={v.frame} giro={6} />
			</Fila>
			{v.frame >= F(2.03) ? (
				<Fila top={1500}>
					<div style={{scale: String(pregunta)}}>
						<Vidrio style={{padding: '10px 26px', borderRadius: 999}}>
							<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 40, color: '#FFFFFF'}}>
								¿Y ahora <span style={{color: MORADO2}}>qué haces?</span>
							</span>
						</Vidrio>
					</div>
				</Fila>
			) : null}
		</AbsoluteFill>
	);
};

// Método + Claude
const Metodo: React.FC = () => {
	const v = useVentana(2.89, 6.62);
	if (!v.visible) return null;
	return (
		<Fila top={1360}>
			<div style={{scale: String(v.q), opacity: v.o}}>
				<Vidrio>
					<Circulo tam={76} fondo="linear-gradient(135deg, #34D399, #10B981)">
						<L.Check size={44} color="#FFFFFF" strokeWidth={3} />
					</Circulo>
					<div style={{display: 'flex', flexDirection: 'column'}}>
						<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 46, color: '#FFFFFF', lineHeight: 1.05}}>
							Sí existe un <span style={{color: MORADO2}}>método</span>
						</span>
						<span style={{fontFamily: helvetica, fontSize: 30, color: '#E9E2FF', fontWeight: 700, opacity: interpolate(v.frame, [F(5.31), F(5.31) + 8], [0, 1], clamp)}}>para seguir usando Claude</span>
					</div>
					<div style={{marginLeft: 6}}>
						<Logo3D src="claude.png" s={5.95} tam={96} frame={v.frame} />
					</div>
				</Vidrio>
			</div>
		</Fila>
	);
};

// Taller presencial -> Valencia -> 5 DIC
const Evento: React.FC = () => {
	const v = useVentana(7.95, 11.05);
	if (!v.visible) return null;
	const q1 = pop(v.frame, 8.03);
	const q2 = pop(v.frame, 9.11);
	const q3 = pop(v.frame, 10.05);
	return (
		<AbsoluteFill style={{opacity: v.o}}>
			<Fila top={1300}>
				<div style={{scale: String(q1)}}>
					<Vidrio style={{padding: '12px 24px 12px 12px', borderRadius: 999}}>
						<Circulo tam={58}>
							<L.Users size={32} color="#FFFFFF" strokeWidth={2.2} />
						</Circulo>
						<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 38, color: '#FFFFFF'}}>Taller presencial</span>
					</Vidrio>
				</div>
				{v.frame >= F(9.11) ? (
					<div style={{scale: String(q2)}}>
						<Vidrio style={{padding: '12px 24px 12px 12px', borderRadius: 999}}>
							<Circulo tam={58}>
								<L.MapPin size={32} color="#FFFFFF" strokeWidth={2.2} />
							</Circulo>
							<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 38, color: '#FFFFFF'}}>Valencia</span>
						</Vidrio>
					</div>
				) : null}
			</Fila>
			{v.frame >= F(10.05) ? (
				<Fila top={1420}>
					<div style={{scale: String(q3), display: 'flex', alignItems: 'center', gap: 18}}>
						<div style={{width: 128, borderRadius: 24, overflow: 'hidden', background: '#FFFFFF', boxShadow: '0 18px 44px rgba(0,0,0,0.45), 0 0 34px rgba(139,92,246,0.5)', textAlign: 'center'}}>
							<div style={{background: `linear-gradient(135deg, ${MORADO2}, ${MORADO})`, color: '#FFFFFF', fontFamily: helvetica, fontWeight: 700, fontSize: 24, letterSpacing: '0.2em', padding: '5px 0'}}>DIC</div>
							<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 80, color: NOCHE, lineHeight: 1.12}}>5</div>
						</div>
						<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 54, color: '#FFFFFF', textShadow: '0 6px 24px rgba(0,0,0,0.6)'}}>5 de diciembre</span>
					</div>
				</Fila>
			) : null}
		</AbsoluteFill>
	);
};

// ------------------------------------------------------------------ lo que se aprende, uno por uno
// Cada tema aparece en su tarjeta cuando lo dice y deja paso al siguiente (sobre el pecho, la cara
// libre). Al final, "Y ADEMÁS" con los temas extra del taller.
const TEMAS: {de: number; a: number; n: number; icono: React.ReactNode; texto: React.ReactNode}[] = [
	{
		de: 11.95,
		a: 14.19,
		n: 1,
		icono: (
			<div style={{position: 'relative', width: 84, height: 70}}>
				<Img src={staticFile(`${W}/claude.png`)} style={{position: 'absolute', width: 62, left: 0, top: 0}} />
				<Img src={staticFile(`${W}/venezuela.png`)} style={{position: 'absolute', width: 50, right: 0, bottom: 0}} />
			</div>
		),
		texto: (
			<>
				Claude desde <span style={{color: MORADO2}}>Venezuela</span>
			</>
		),
	},
	{de: 14.19, a: 16.63, n: 2, icono: <L.ShieldCheck size={50} color="#FFFFFF" strokeWidth={2} />, texto: <>Evita <span style={{color: MORADO2}}>bloqueos</span> de cuenta</>},
	{de: 16.63, a: 18.2, n: 3, icono: <L.ListChecks size={50} color="#FFFFFF" strokeWidth={2} />, texto: <>Alternativas y <span style={{color: MORADO2}}>guías</span></>},
];
const EXTRAS: {s: number; icono: React.ReactNode; texto: string}[] = [
	{s: 18.2, icono: <L.Megaphone size={30} color="#FFFFFF" strokeWidth={2.2} />, texto: 'Estrategia digital para marcas'},
	{s: 18.75, icono: <L.Clapperboard size={30} color="#FFFFFF" strokeWidth={2.2} />, texto: 'Video marketing con IA'},
	{s: 19.3, icono: <L.Sparkles size={30} color="#FFFFFF" strokeWidth={2.2} />, texto: 'Más herramientas de IA'},
];

const Tema: React.FC<{readonly t: (typeof TEMAS)[number]}> = ({t}) => {
	const v = useVentana(t.de, t.a);
	if (!v.visible) return null;
	return (
		<Fila top={1390}>
			<div style={{scale: String(v.q), opacity: v.o}}>
				<Vidrio style={{padding: '14px 30px 14px 16px'}}>
					<div style={{width: 50, height: 50, borderRadius: 25, background: '#FFFFFF', color: MORADO3, fontFamily: poppins, fontWeight: 800, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>{t.n}</div>
					{t.n === 1 ? t.icono : <Circulo tam={76}>{t.icono}</Circulo>}
					<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 46, color: '#FFFFFF', lineHeight: 1.05, whiteSpace: 'nowrap'}}>{t.texto}</span>
				</Vidrio>
			</div>
		</Fila>
	);
};

const Extras: React.FC = () => {
	const v = useVentana(18.2, 19.95, 10);
	if (!v.visible) return null;
	return (
		<div style={{position: 'absolute', top: 1330, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, opacity: v.o}}>
			<span style={{fontFamily: helvetica, fontWeight: 700, fontSize: 28, letterSpacing: '0.3em', color: '#FFFFFF', textShadow: '0 2px 12px rgba(0,0,0,0.7)', scale: String(v.q)}}>Y ADEMÁS</span>
			{EXTRAS.map((e) => {
				const q = pop(v.frame, e.s);
				return v.frame >= F(e.s) ? (
					<div key={e.texto} style={{scale: String(q)}}>
						<Vidrio style={{padding: '10px 24px 10px 10px', gap: 12, borderRadius: 999}}>
							<Circulo tam={54}>{e.icono}</Circulo>
							<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 36, color: '#FFFFFF', whiteSpace: 'nowrap'}}>{e.texto}</span>
						</Vidrio>
					</div>
				) : null;
			})}
		</div>
	);
};

// ------------------------------------------------------------------ cierre
const Boton: React.FC<{readonly de: number; readonly a: number; readonly top: number}> = ({de, a, top}) => {
	const v = useVentana(de, a);
	if (!v.visible) return null;
	const k = v.frame - v.fa;
	const latido = 1 + 0.04 * Math.sin(k / 4.5);
	const brillo = ((k * 14) % 1400) - 300;
	const cupos = pop(v.frame, 24.67);
	return (
		<div style={{position: 'absolute', top, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, opacity: v.o}}>
			<div
				style={{
					position: 'relative',
					overflow: 'hidden',
					scale: String(v.q * latido),
					padding: '28px 60px',
					borderRadius: 999,
					background: `linear-gradient(135deg, ${MORADO2}, ${MORADO} 60%, ${MORADO3})`,
					boxShadow: '0 18px 44px rgba(0,0,0,0.45), 0 0 50px rgba(139,92,246,0.8)',
					display: 'flex',
					alignItems: 'center',
					gap: 16,
				}}
			>
				<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 56, color: '#FFFFFF', whiteSpace: 'nowrap'}}>RESERVA TU LUGAR</span>
				<L.MousePointerClick size={54} color="#FFFFFF" strokeWidth={2.2} />
				<div style={{position: 'absolute', top: 0, bottom: 0, left: brillo, width: 120, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)', rotate: '18deg'}} />
			</div>
			{v.frame >= F(24.67) ? (
				<div style={{scale: String(cupos * (1 + 0.05 * Math.sin(k / 3.5))), display: 'flex', alignItems: 'center', gap: 10, background: `linear-gradient(135deg, #FF6B6B, ${ROJO})`, borderRadius: 999, padding: '8px 22px', boxShadow: '0 0 26px rgba(239,68,68,0.6)'}}>
					<L.Flame size={30} color="#FFFFFF" fill="#FFFFFF" />
					<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 32, color: '#FFFFFF', letterSpacing: '0.05em'}}>CUPOS LIMITADOS</span>
				</div>
			) : (
				<div style={{height: 50}} />
			)}
			<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
				{[0, 1, 2].map((i) => (
					<L.ChevronDown key={i} size={60} color="#FFFFFF" strokeWidth={3} style={{marginTop: -28, opacity: 0.35 + 0.65 * Math.max(0, Math.sin((k - i * 5) / 6)), filter: 'drop-shadow(0 0 10px rgba(139,92,246,0.9))'}} />
				))}
			</div>
		</div>
	);
};

// ------------------------------------------------------------------ fijo arriba
const Encabezado: React.FC = () => {
	const frame = useCurrentFrame();
	const q = interpolate(frame, [0, 10], [0, 1], {...clamp, easing: ease});
	const sello = interpolate(frame, [8, 18], [0, 1], {...clamp, easing: Easing.out(Easing.back(2.2))});
	return (
		<div style={{position: 'absolute', top: 232, left: 0, right: 0, textAlign: 'center', opacity: q, translate: `0px ${(1 - q) * -20}px`}}>
			<div style={{fontFamily: helvetica, fontWeight: 700, fontSize: 32, letterSpacing: '0.42em', color: '#FFFFFF', textShadow: '0 2px 14px rgba(0,0,0,0.7)'}}>TALLER</div>
			<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 104, lineHeight: 1, letterSpacing: '-0.02em', color: '#FFFFFF', textShadow: '0 6px 0 rgba(0,0,0,0.15), 0 10px 34px rgba(0,0,0,0.5), 0 0 40px rgba(139,92,246,0.55)'}}>
				IA QUE <span style={{color: MORADO2}}>VENDE</span>
			</div>
			<div style={{marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 12, padding: '10px 26px', borderRadius: 999, background: 'rgba(13,10,26,0.78)', border: '2px solid rgba(181,123,255,0.6)', boxShadow: '0 0 24px rgba(139,92,246,0.45)', fontFamily: helvetica, fontWeight: 700, fontSize: 30, letterSpacing: '0.16em', color: '#FFFFFF'}}>
				<L.CalendarDays size={30} color={MORADO2} strokeWidth={2.2} />5 DE DICIEMBRE · <span style={{color: MORADO2}}>VALENCIA</span>
			</div>
			{/* ÚLTIMA EDICIÓN, debajo de la fecha */}
			<div style={{marginTop: 12, display: 'flex', justifyContent: 'center'}}>
				<div style={{scale: String(sello * (1 + 0.035 * Math.sin(frame / 5))), display: 'flex', alignItems: 'center', gap: 10, background: `linear-gradient(135deg, #FF6B6B, ${ROJO})`, borderRadius: 999, padding: '8px 24px', boxShadow: '0 0 24px rgba(239,68,68,0.55)', border: '2px solid rgba(255,255,255,0.8)'}}>
					<L.Flame size={28} color="#FFFFFF" fill="#FFFFFF" />
					<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 30, color: '#FFFFFF', letterSpacing: '0.08em'}}>ÚLTIMA EDICIÓN 2026</span>
				</div>
			</div>
		</div>
	);
};

// Destello morado en cada cambio de ángulo
const Destellos: React.FC = () => {
	const frame = useCurrentFrame();
	const cambios = marcas.tramos.filter((p, i) => i > 0 && p.zoom !== marcas.tramos[i - 1].zoom).map((p) => Math.round(p.t * FPS));
	const o = Math.max(0, ...cambios.map((c) => interpolate(frame, [c - 1, c + 1, c + 7], [0, 0.32, 0], clamp)));
	return o > 0 ? <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, rgba(181,123,255,0.9), rgba(139,92,246,0.0) 70%)', opacity: o, mixBlendMode: 'screen'}} /> : null;
};

const Sfx: React.FC<{readonly s: number; readonly src: string; readonly volume?: number}> = ({s, src, volume = 0.3}) => (
	<Sequence from={Math.max(0, F(s))} durationInFrames={3 * FPS}>
		<Audio src={staticFile(`sfx/${src}.wav`)} volume={volume} />
	</Sequence>
);

export const TallerComponent: React.FC = () => {
	const frame = useCurrentFrame();
	const fin = interpolate(frame, [Math.round(DURACION * FPS) - 8, Math.round(DURACION * FPS)], [1, 0], clamp);
	return (
		<AbsoluteFill style={{background: NOCHE}}>
			<AbsoluteFill style={{opacity: fin}}>
				<Video src={staticFile(`${W}/base.mp4`)} style={{position: 'absolute', width: '100%', height: '100%'}} />
				<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(13,10,26,0.6) 0%, rgba(13,10,26,0) 30%, rgba(13,10,26,0) 55%, rgba(13,10,26,0.45) 75%, rgba(13,10,26,0.25) 100%)'}} />
				<Destellos />

				<Gancho />
				<Metodo />
				<Evento />
				{TEMAS.map((t) => (
					<Tema key={t.n} t={t} />
				))}
				<Extras />
				<Boton de={22.19} a={60} top={1310} />

				<Encabezado />
			</AbsoluteFill>

			{/* ---------- Efectos de sonido ---------- */}
			<Sfx s={0.97} src="pop" volume={0.3} />
			<Sfx s={1.23} src="pop" volume={0.3} />
			<Sfx s={1.6} src="error" volume={0.26} />
			<Sfx s={2.03} src="whoosh-corto" volume={0.3} />
			<Sfx s={2.89} src="swipe" volume={0.3} />
			<Sfx s={4.87} src="ding" volume={0.24} />
			<Sfx s={5.95} src="pop" volume={0.26} />
			<Sfx s={8.03} src="pop" volume={0.26} />
			<Sfx s={9.11} src="ping" volume={0.24} />
			<Sfx s={10.05} src="impacto" volume={0.28} />
			<Sfx s={11.0} src="whoosh" volume={0.36} />
			<Sfx s={11.95} src="pop" volume={0.26} />
			<Sfx s={14.19} src="pop" volume={0.26} />
			<Sfx s={16.63} src="pop" volume={0.26} />
			<Sfx s={18.2} src="whoosh-corto" volume={0.28} />
			<Sfx s={18.75} src="pop" volume={0.24} />
			<Sfx s={19.3} src="pop" volume={0.24} />
			<Sfx s={19.9} src="whoosh-2" volume={0.32} />
			<Sfx s={22.19} src="click" volume={0.34} />
			<Sfx s={24.67} src="notificacion" volume={0.26} />
		</AbsoluteFill>
	);
};

export const TallerComposition: React.FC = () => (
	<Composition id="TallerIAQueVende" component={TallerComponent} durationInFrames={marcas.frames} fps={FPS} width={1080} height={1920} />
);
