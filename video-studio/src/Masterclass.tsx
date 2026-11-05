import {Audio, Video} from '@remotion/media';
import * as P from '@phosphor-icons/react/dist/ssr';
import * as L from 'lucide-react';
import {AbsoluteFill, Composition, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {helvetica, poppins} from './fonts';
import marcas from './masterclass-marcas.json';

// Anuncio (Meta Ads) "Masterclass gratis · 27 de noviembre · Automatiza tu negocio con IA".
// Base sin pausas, voz natural y cambios de ángulo 1.0x/1.15x en HD: scripts/masterclass_base.py.
// Paleta del flyer (morado sobre negro, la marca de Raquel) con Poppins 800 + Helvetica espaciada.
// Fijo arriba: MASTERCLASS GRATIS + PARA REALTORS Y MARCAS PERSONALES (se oculta cuando sale el
// flyer, que ya lo trae). Lo que dice aparece en la franja del pecho (y 1330-1560, bajo la barbilla). Cierre: el flyer
// a pantalla completa + botón "APARTA TU LUGAR" con flechas al botón de registro del anuncio.

const FPS = 30;
const W = 'work/masterclass';
const DURACION = marcas.total;
const MORADO = '#8B5CF6';
const MORADO2 = '#B57BFF';
const NOCHE = '#0D0A1A';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.22, 1, 0.36, 1);

// Segundo del video original -> segundo del anuncio (sin pausas)
const at = (s: number): number => {
	for (const p of marcas.tramos) {
		if (s < p.a) return p.t;
		if (s <= p.a + p.d) return p.t + (s - p.a);
	}
	return marcas.total;
};
const F = (s: number) => Math.round(at(s) * FPS);

// Ventana [de, a) en segundos del original, con entrada y salida
const useVentana = (de: number, a: number, entrada = 12) => {
	const frame = useCurrentFrame();
	const fa = F(de);
	const fb = F(a);
	const visible = frame >= fa && frame < fb;
	const q = interpolate(frame, [fa, fa + entrada], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.5))});
	const o = Math.min(interpolate(frame, [fa, fa + 6], [0, 1], clamp), interpolate(frame, [fb - 6, fb], [1, 0], clamp));
	return {frame, fa, fb, visible, q, o};
};

// ------------------------------------------------------------------ piezas
const Vidrio: React.FC<{readonly children: React.ReactNode; readonly style?: React.CSSProperties}> = ({children, style}) => (
	<div
		style={{
			display: 'flex',
			alignItems: 'center',
			gap: 18,
			background: 'rgba(13,10,26,0.72)',
			border: `2px solid rgba(181,123,255,0.65)`,
			borderRadius: 28,
			padding: '16px 28px',
			boxShadow: `0 18px 44px rgba(0,0,0,0.45), 0 0 34px rgba(139,92,246,0.45)`,
			backdropFilter: 'blur(10px)',
			...style,
		}}
	>
		{children}
	</div>
);

const Circulo: React.FC<{readonly children: React.ReactNode; readonly tam?: number}> = ({children, tam = 74}) => (
	<div style={{width: tam, height: tam, borderRadius: tam / 2, background: `linear-gradient(135deg, ${MORADO2}, ${MORADO})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 24px rgba(139,92,246,0.7)'}}>
		{children}
	</div>
);

const Fila: React.FC<{readonly top: number; readonly children: React.ReactNode}> = ({top, children}) => (
	<div style={{position: 'absolute', top, left: 50, right: 50, display: 'flex', justifyContent: 'center', gap: 18, flexWrap: 'wrap'}}>{children}</div>
);

// Tarjeta simple: ícono + título (+ subtítulo)
const Tarjeta: React.FC<{readonly de: number; readonly a: number; readonly top?: number; readonly Ic: L.LucideIcon; readonly titulo: string; readonly sub?: string}> = ({de, a, top = 1400, Ic, titulo, sub}) => {
	const v = useVentana(de, a);
	if (!v.visible) return null;
	return (
		<Fila top={top}>
			<div style={{scale: String(v.q), opacity: v.o}}>
				<Vidrio>
					<Circulo>
						<Ic size={40} color="#FFFFFF" strokeWidth={2} />
					</Circulo>
					<div style={{display: 'flex', flexDirection: 'column'}}>
						<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 46, color: '#FFFFFF', lineHeight: 1.05}}>{titulo}</span>
						{sub ? <span style={{fontFamily: helvetica, fontSize: 28, color: MORADO2, fontWeight: 700}}>{sub}</span> : null}
					</div>
				</Vidrio>
			</div>
		</Fila>
	);
};

// Chips que aparecen uno por uno (Mensajes, CRM, Pipeline, IA)
const Chips: React.FC<{readonly de: number; readonly a: number; readonly top?: number; readonly items: {s: number; texto: string; Ic: React.ReactNode}[]}> = ({de, a, top = 1390, items}) => {
	const v = useVentana(de, a);
	if (!v.visible) return null;
	return (
		<Fila top={top}>
			{items.map((it) => {
				const fa = F(it.s);
				if (v.frame < fa) return null;
				const q = interpolate(v.frame, [fa, fa + 10], [0, 1], {...clamp, easing: Easing.out(Easing.back(2))});
				return (
					<div key={it.texto} style={{scale: String(q), opacity: v.o}}>
						<Vidrio style={{padding: '12px 22px 12px 12px', gap: 12, borderRadius: 999}}>
							<Circulo tam={56}>{it.Ic}</Circulo>
							<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 38, color: '#FFFFFF'}}>{it.texto}</span>
						</Vidrio>
					</div>
				);
			})}
		</Fila>
	);
};

// Fecha grande (27 NOV) con calendario
const Fecha: React.FC<{readonly de: number; readonly a: number}> = ({de, a}) => {
	const v = useVentana(de, a);
	if (!v.visible) return null;
	return (
		<Fila top={1370}>
			<div style={{scale: String(v.q), opacity: v.o, display: 'flex', alignItems: 'center', gap: 22}}>
				<div style={{width: 150, borderRadius: 26, overflow: 'hidden', background: '#FFFFFF', boxShadow: '0 18px 44px rgba(0,0,0,0.45), 0 0 34px rgba(139,92,246,0.5)', textAlign: 'center'}}>
					<div style={{background: `linear-gradient(135deg, ${MORADO2}, ${MORADO})`, color: '#FFFFFF', fontFamily: helvetica, fontWeight: 700, fontSize: 28, letterSpacing: '0.2em', padding: '6px 0'}}>NOV</div>
					<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 92, color: NOCHE, lineHeight: 1.15}}>27</div>
				</div>
				<Vidrio>
					<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 48, color: '#FFFFFF', lineHeight: 1.05}}>
						Clase <span style={{color: MORADO2}}>100 % gratis</span>
					</span>
				</Vidrio>
			</div>
		</Fila>
	);
};

// Invitado: foto del flyer en círculo + nombre
const Invitado: React.FC<{readonly de: number; readonly a: number}> = ({de, a}) => {
	const v = useVentana(de, a);
	if (!v.visible) return null;
	const sub = interpolate(v.frame, [F(5.02), F(5.02) + 10], [0, 1], clamp);
	return (
		<Fila top={1370}>
			<div style={{scale: String(v.q), opacity: v.o}}>
				<Vidrio style={{padding: '14px 32px 14px 14px'}}>
					<div style={{width: 130, height: 130, borderRadius: 65, overflow: 'hidden', border: `4px solid ${MORADO2}`, boxShadow: '0 0 26px rgba(139,92,246,0.7)', flexShrink: 0}}>
						<Img src={staticFile(`${W}/francesco.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
					</div>
					<div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
						<span style={{fontFamily: helvetica, fontWeight: 700, fontSize: 26, letterSpacing: '0.25em', color: MORADO2}}>INVITADO</span>
						<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 50, color: '#FFFFFF', lineHeight: 1.05}}>Francesco Palumbi</span>
						<span style={{fontFamily: helvetica, fontWeight: 700, fontSize: 30, color: '#E9E2FF', opacity: sub}}>Experto en IA y automatización</span>
					</div>
				</Vidrio>
			</div>
		</Fila>
	);
};

// Notificación del agente de IA respondiendo de noche
const Agente: React.FC<{readonly de: number; readonly a: number}> = ({de, a}) => {
	const v = useVentana(de, a);
	if (!v.visible) return null;
	const luna = interpolate(v.frame, [F(16.28), F(16.28) + 10], [0, 1], {...clamp, easing: Easing.out(Easing.back(2))});
	const texto = '¡Hola! ¿En qué zona buscas tu casa?';
	const n = Math.min(texto.length, Math.max(0, Math.floor((v.frame - v.fa - 10) / 1.3)));
	return (
		<Fila top={1330}>
			<div style={{scale: String(v.q), opacity: v.o, width: 880}}>
				<div style={{background: 'rgba(250,248,255,0.97)', borderRadius: 34, padding: '20px 26px', boxShadow: '0 18px 44px rgba(0,0,0,0.45), 0 0 34px rgba(139,92,246,0.5)', display: 'flex', gap: 18, alignItems: 'center'}}>
					<Circulo tam={84}>
						<L.Bot size={46} color="#FFFFFF" strokeWidth={2} />
					</Circulo>
					<div style={{flex: 1}}>
						<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
							<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 34, color: NOCHE}}>Tu agente de IA</span>
							<span style={{fontFamily: helvetica, fontSize: 26, color: '#8A84A3', display: 'flex', alignItems: 'center', gap: 6}}>
								<L.Moon size={26} color={MORADO} fill={MORADO} style={{scale: String(luna)}} /> 3:12 a. m.
							</span>
						</div>
						<div style={{fontFamily: helvetica, fontSize: 32, color: '#2A2540', marginTop: 4}}>{texto.slice(0, n)}</div>
					</div>
				</div>
				<div style={{marginTop: 14, display: 'flex', justifyContent: 'center', opacity: luna}}>
					<Vidrio style={{padding: '10px 24px', borderRadius: 999}}>
						<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 36, color: '#FFFFFF'}}>
							Responde <span style={{color: MORADO2}}>mientras duermes</span>
						</span>
					</Vidrio>
				</div>
			</div>
		</Fila>
	);
};

// Titular grande en el pecho (SISTEMATIZA TU NEGOCIO CON IA / CTA)
const Titular: React.FC<{readonly de: number; readonly a: number; readonly linea1: string; readonly linea2: string; readonly top?: number}> = ({de, a, linea1, linea2, top = 1360}) => {
	const v = useVentana(de, a, 10);
	if (!v.visible) return null;
	const q2 = interpolate(v.frame, [v.fa + 5, v.fa + 15], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.6))});
	return (
		<div style={{position: 'absolute', top, left: 40, right: 40, textAlign: 'center', opacity: v.o}}>
			<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 86, lineHeight: 1, color: '#FFFFFF', scale: String(v.q), textShadow: '0 8px 30px rgba(0,0,0,0.55)'}}>{linea1}</div>
			<div
				style={{
					fontFamily: poppins,
					fontWeight: 800,
					fontSize: 96,
					lineHeight: 1.05,
					scale: String(q2),
					background: `linear-gradient(90deg, ${MORADO2}, #E2C6FF, ${MORADO2})`,
					WebkitBackgroundClip: 'text',
					backgroundClip: 'text',
					color: 'transparent',
					filter: 'drop-shadow(0 6px 24px rgba(139,92,246,0.7))',
				}}
			>
				{linea2}
			</div>
		</div>
	);
};

// Botón de registro con mano y flechas hacia el botón del anuncio
const Boton: React.FC<{readonly de: number; readonly a: number; readonly texto: string; readonly top?: number}> = ({de, a, texto, top = 1370}) => {
	const v = useVentana(de, a);
	if (!v.visible) return null;
	const k = v.frame - v.fa;
	const latido = 1 + 0.04 * Math.sin(k / 4.5);
	const brillo = ((k * 14) % 1400) - 300;
	return (
		<div style={{position: 'absolute', top, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, opacity: v.o}}>
			<div
				style={{
					position: 'relative',
					overflow: 'hidden',
					scale: String(v.q * latido),
					padding: '30px 64px',
					borderRadius: 999,
					background: `linear-gradient(135deg, ${MORADO2}, ${MORADO} 60%, #6D28D9)`,
					boxShadow: '0 18px 44px rgba(0,0,0,0.45), 0 0 50px rgba(139,92,246,0.8)',
					display: 'flex',
					alignItems: 'center',
					gap: 18,
				}}
			>
				<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 58, color: '#FFFFFF', letterSpacing: '0.01em', whiteSpace: 'nowrap'}}>{texto}</span>
				<L.MousePointerClick size={56} color="#FFFFFF" strokeWidth={2.2} />
				<div style={{position: 'absolute', top: 0, bottom: 0, left: brillo, width: 120, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)', rotate: '18deg'}} />
			</div>
			<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: -4}}>
				{[0, 1, 2].map((i) => (
					<L.ChevronDown key={i} size={64} color="#FFFFFF" strokeWidth={3} style={{marginTop: -30, opacity: 0.35 + 0.65 * Math.max(0, Math.sin((k - i * 5) / 6)), filter: 'drop-shadow(0 0 10px rgba(139,92,246,0.9))'}} />
				))}
			</div>
		</div>
	);
};

// Flyer como tarjeta flotante (gratis) o a pantalla completa (cierre)
const Flyer: React.FC<{readonly de: number; readonly a: number; readonly completo?: boolean}> = ({de, a, completo}) => {
	const v = useVentana(de, a, 14);
	if (!v.visible) return null;
	const k = v.frame - v.fa;
	if (completo) {
		const z = interpolate(k, [0, (v.fb - v.fa)], [1.12, 1.02], {...clamp, easing: Easing.out(Easing.cubic)});
		return (
			<AbsoluteFill style={{opacity: interpolate(k, [0, 8], [0, 1], clamp), background: NOCHE}}>
				<Img src={staticFile(`${W}/flyer.jpg`)} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', scale: String(z)}} />
			</AbsoluteFill>
		);
	}
	const giro = interpolate(k, [0, 16], [-14, -3], {...clamp, easing: ease});
	return (
		<AbsoluteFill style={{opacity: v.o}}>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(13,10,26,0.55), rgba(13,10,26,0.88))'}} />
			<div style={{position: 'absolute', left: 540 - 300, top: 440, width: 600, height: 1066, scale: String(0.6 + 0.4 * v.q), rotate: `${giro}deg`, borderRadius: 30, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(139,92,246,0.7)', border: `3px solid ${MORADO2}`}}>
				<Img src={staticFile(`${W}/flyer.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
			</div>
		</AbsoluteFill>
	);
};

// Fijo arriba
const Encabezado: React.FC<{readonly oculto: number}> = ({oculto}) => {
	const frame = useCurrentFrame();
	const q = interpolate(frame, [0, 10], [0, 1], {...clamp, easing: ease});
	return (
		<div style={{position: 'absolute', top: 236, left: 0, right: 0, textAlign: 'center', opacity: q * (1 - oculto), translate: `0px ${(1 - q) * -20}px`}}>
			<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 92, lineHeight: 1, color: '#FFFFFF', letterSpacing: '-0.01em', textShadow: '0 6px 0 rgba(0,0,0,0.15), 0 10px 34px rgba(0,0,0,0.5), 0 0 40px rgba(139,92,246,0.55)'}}>
				MASTERCLASS <span style={{color: MORADO2}}>GRATIS</span>
			</div>
			<div style={{marginTop: 16, display: 'inline-block', padding: '10px 26px', borderRadius: 999, background: 'rgba(13,10,26,0.78)', border: '2px solid rgba(181,123,255,0.6)', boxShadow: '0 0 24px rgba(139,92,246,0.45)', fontFamily: helvetica, fontWeight: 700, fontSize: 30, letterSpacing: '0.2em', color: '#FFFFFF'}}>
				PARA <span style={{color: MORADO2}}>REALTORS</span> Y MARCAS PERSONALES
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

export const MasterclassComponent: React.FC = () => {
	const frame = useCurrentFrame();
	// El encabezado se oculta mientras se ve el flyer (ya dice MASTERCLASS GRATIS)
	const oculto = Math.max(
		interpolate(frame, [F(22.36), F(22.36) + 6, F(24.45) - 6, F(24.45)], [0, 1, 1, 0], clamp),
		interpolate(frame, [F(36.98) - 2, F(36.98) + 6], [0, 1], clamp),
	);
	const fin = interpolate(frame, [Math.round(DURACION * FPS) - 8, Math.round(DURACION * FPS)], [1, 0], clamp);
	const WA = <P.WhatsappLogo size={36} color="#FFFFFF" weight="fill" />;
	return (
		<AbsoluteFill style={{background: NOCHE}}>
			<AbsoluteFill style={{opacity: fin}}>
				<Video src={staticFile(`${W}/base.mp4`)} style={{position: 'absolute', width: '100%', height: '100%'}} />
				<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(13,10,26,0.55) 0%, rgba(13,10,26,0) 24%, rgba(13,10,26,0) 55%, rgba(13,10,26,0.45) 75%, rgba(13,10,26,0.25) 100%)'}} />
				<Destellos />

				{/* ---------- Lo que va diciendo ---------- */}
				<Fecha de={0.84} a={3.9} />
				<Invitado de={3.92} a={7.0} />
				<Tarjeta de={7.62} a={9.86} Ic={L.Workflow} titulo="Tu sistema con IA" sub="Paso a paso" />
				<Chips
					de={9.9}
					a={13.9}
					items={[
						{s: 9.9, texto: 'Mensajes automáticos', Ic: <L.MessageCircle size={30} color="#FFFFFF" strokeWidth={2.2} />},
						{s: 11.28, texto: 'CRM', Ic: <L.Users size={30} color="#FFFFFF" strokeWidth={2.2} />},
						{s: 12.14, texto: 'Pipeline', Ic: <L.KanbanSquare size={30} color="#FFFFFF" strokeWidth={2.2} />},
						{s: 13.08, texto: 'Todo con IA', Ic: <L.Sparkles size={30} color="#FFFFFF" strokeWidth={2.2} />},
					]}
				/>
				<Agente de={14.76} a={17.3} />
				<Tarjeta de={17.42} a={20.0} Ic={L.CalendarCheck} titulo="Visita agendada ✓" sub="Tu setter con IA agenda por ti" />
				<Titular de={20.34} a={22.36} linea1="SISTEMATIZA" linea2="TU NEGOCIO CON IA" />
				<Flyer de={22.36} a={24.45} />
				<Boton de={24.45} a={27.4} texto="REGÍSTRATE GRATIS" />
				<Chips de={27.42} a={30.5} items={[{s: 27.9, texto: 'Grupo de WhatsApp', Ic: WA}, {s: 29.5, texto: 'Toda la info', Ic: <L.Info size={30} color="#FFFFFF" strokeWidth={2.2} />}]} />
				<Chips
					de={30.52}
					a={34.75}
					items={[
						{s: 30.94, texto: 'Realtors', Ic: <L.House size={30} color="#FFFFFF" strokeWidth={2.2} />},
						{s: 31.98, texto: 'Marcas personales', Ic: <L.Star size={30} color="#FFFFFF" strokeWidth={2.2} />},
					]}
				/>
				<Boton de={34.8} a={36.98} texto="APARTA TU LUGAR" />

				{/* ---------- Cierre: flyer + botón ---------- */}
				<Flyer de={36.98} a={60} completo />
				<Boton de={37.05} a={60} texto="APARTA TU LUGAR" top={1230} />

				<Encabezado oculto={oculto} />
			</AbsoluteFill>

			{/* ---------- Efectos de sonido ---------- */}
			<Sfx s={0.84} src="pop" volume={0.3} />
			<Sfx s={3.04} src="ding" volume={0.24} />
			<Sfx s={3.9} src="whoosh-corto" volume={0.34} />
			<Sfx s={7.6} src="swipe" volume={0.3} />
			<Sfx s={9.9} src="pop" volume={0.26} />
			<Sfx s={11.28} src="pop" volume={0.26} />
			<Sfx s={12.14} src="pop" volume={0.26} />
			<Sfx s={13.08} src="brillo" volume={0.26} />
			<Sfx s={14.7} src="remotion/snapchat-notification" volume={0.3} />
			<Sfx s={15.1} src="teclado-iphone" volume={0.22} />
			<Sfx s={17.4} src="ding" volume={0.26} />
			<Sfx s={20.3} src="whoosh" volume={0.36} />
			<Sfx s={20.5} src="impacto" volume={0.3} />
			<Sfx s={22.3} src="riser" volume={0.2} />
			<Sfx s={22.4} src="whoosh-2" volume={0.36} />
			<Sfx s={24.45} src="click" volume={0.34} />
			<Sfx s={27.9} src="notificacion" volume={0.26} />
			<Sfx s={30.94} src="pop" volume={0.26} />
			<Sfx s={31.98} src="pop" volume={0.26} />
			<Sfx s={34.8} src="click" volume={0.34} />
			<Sfx s={36.95} src="whoosh" volume={0.36} />
			<Sfx s={37.05} src="reveal" volume={0.3} />
		</AbsoluteFill>
	);
};

export const MasterclassComposition: React.FC = () => (
	<Composition id="MasterclassAds" component={MasterclassComponent} durationInFrames={marcas.frames} fps={FPS} width={1080} height={1920} />
);
