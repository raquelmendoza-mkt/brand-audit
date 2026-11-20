import {Audio, Video} from '@remotion/media';
import * as L from 'lucide-react';
import {AbsoluteFill, Composition, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {helvetica, poppins} from './fonts';
import marcas from './killswitch-marcas.json';

// Reel "¿Cómo prevenir que te bloqueen Claude en Venezuela?" (polémico, para viralizar).
// Base recortada al máximo, sin pausas, voz natural y ángulos 1.0x/1.15x en HD: scripts/killswitch_base.py.
// Estilo: el del reel TOFU · MOFU · BOFU (palabras DETRÁS de la persona, tarjetas, íconos 3D) +
// escenas animadas a pantalla completa sobre fondo oscuro (referencia "Puro Ladrillo") en los momentos
// más visuales: cookies, cambio de país, KILL SWITCH, proxy, el familiar y el respaldo. Morado de la
// marca, Poppins 800. Sin música: solo efectos de sonido. Todo entre y 260 y 1560; la cara nunca se tapa.

const FPS = 30;
const W = 'work/killswitch';
const DURACION = marcas.total;
const MORADO = '#8B5CF6';
const MORADO2 = '#B57BFF';
const MORADO3 = '#6D28D9';
const NOCHE = '#0D0A1A';
const ESCENA = '#120B24';
const ROJO = '#EF4444';
const VERDE = '#22C55E';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const rebote = Easing.out(Easing.back(1.8));

type Tramo = (typeof marcas.tramos)[number];
const TRAMOS: Tramo[] = marcas.tramos;
const ini = (id: string) => TRAMOS.find((p) => p.id === id)!.t;
const fin = (id: string) => {
	const ps = TRAMOS.filter((p) => p.id === id);
	const u = ps[ps.length - 1];
	return u.t + u.d;
};
// Segundo del original (dicho dentro de la pieza `id`) -> segundo del reel
const at = (id: string, s: number) => {
	const ps = TRAMOS.filter((p) => p.id === id);
	for (const p of ps) {
		if (s < p.a) return p.t;
		if (s <= p.a + p.d) return p.t + (s - p.a);
	}
	const u = ps[ps.length - 1];
	return u.t + u.d;
};
const F = (t: number) => Math.round(t * FPS);
const piezaEn = (t: number) => [...TRAMOS].reverse().find((p) => t >= p.t) ?? TRAMOS[0];

// Aparición con rebote a partir del segundo t del reel
const entra = (frame: number, t: number, dur = 11) => interpolate(frame, [F(t), F(t) + dur], [0, 1], {...clamp, easing: rebote});
const fundido = (frame: number, a: number, b: number) => Math.min(interpolate(frame, [F(a), F(a) + 6], [0, 1], clamp), interpolate(frame, [F(b) - 6, F(b)], [1, 0], clamp));

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
	<div style={{width: tam, height: tam, borderRadius: tam / 2, background: fondo ?? `linear-gradient(135deg, ${MORADO2}, ${MORADO})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 24px rgba(139,92,246,0.6)'}}>
		{children}
	</div>
);
const Fila: React.FC<{readonly top: number; readonly children: React.ReactNode; readonly gap?: number}> = ({top, children, gap = 18}) => (
	<div style={{position: 'absolute', top, left: 40, right: 40, display: 'flex', justifyContent: 'center', alignItems: 'center', gap, flexWrap: 'wrap'}}>{children}</div>
);
const Txt: React.FC<{readonly children: React.ReactNode; readonly size?: number; readonly color?: string}> = ({children, size = 44, color = '#FFFFFF'}) => (
	<span style={{fontFamily: poppins, fontWeight: 800, fontSize: size, color, lineHeight: 1.05, whiteSpace: 'nowrap'}}>{children}</span>
);
const Icono3D: React.FC<{readonly src: string; readonly t: number; readonly ancho: number; readonly giro?: number; readonly style?: React.CSSProperties}> = ({src, t, ancho, giro = 0, style}) => {
	const frame = useCurrentFrame();
	if (frame < F(t)) return null;
	const q = entra(frame, t, 13);
	const flota = Math.sin((frame - F(t)) / 11) * 7;
	return <Img src={staticFile(`${W}/${src}`)} style={{position: 'absolute', width: ancho, scale: String(q), rotate: `${(1 - q) * -35 + giro}deg`, translate: `0px ${flota}px`, filter: 'drop-shadow(0 18px 26px rgba(0,0,0,0.45))', ...style}} />;
};

// Palabras DETRÁS de la persona (líneas que suben con máscara)
const Detras: React.FC<{readonly de: number; readonly a: number; readonly lineas: [string, number, string?][]; readonly top: number; readonly size: number}> = ({de, a, lineas, top, size}) => {
	const frame = useCurrentFrame();
	if (frame < F(de) || frame >= F(a)) return null;
	const out = interpolate(frame, [F(a) - 5, F(a)], [1, 0], clamp);
	return (
		<div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', opacity: out}}>
			{lineas.map(([texto, t, color]) => {
				const q = interpolate(frame, [F(t), F(t) + 10], [0, 1], {...clamp, easing: ease});
				return (
					<div key={texto} style={{overflow: 'hidden', height: size * 0.98, opacity: frame >= F(t) ? 1 : 0}}>
						<div style={{fontFamily: poppins, fontWeight: 800, fontSize: size, lineHeight: 0.98, letterSpacing: '-0.02em', color: color ?? '#FFFFFF', translate: `0px ${(1 - q) * 100}%`, textShadow: '0 10px 40px rgba(0,0,0,0.4)'}}>{texto}</div>
					</div>
				);
			})}
		</div>
	);
};

// Persona recortada (recorte_persona.py sobre la base) en los tramos con texto detrás
// ("prevenir" va delante: en esa toma el pelo tapaba "PREVENIRLO")
const RECORTES = ['gancho', 'baneo', 'bloquearon', 'cta'];
const Persona: React.FC = () => {
	const frame = useCurrentFrame();
	const id = RECORTES.find((r) => frame >= F(ini(r)) && frame < F(fin(r)));
	if (!id) return null;
	const n = F(fin(id)) - F(ini(id));
	const k = Math.min(frame - F(ini(id)), n - 2);
	return <Img src={staticFile(`${W}/persona-${id}/${String(k).padStart(4, '0')}.webp`)} style={{position: 'absolute', width: '100%', height: '100%'}} />;
};

// ------------------------------------------------------------------ escenas animadas (pantalla completa)
// Entra con una cortina diagonal morada desde la derecha y sale hacia la izquierda.
const Escena: React.FC<{readonly de: number; readonly a: number; readonly etiqueta: string; readonly titulo: React.ReactNode; readonly children: React.ReactNode}> = ({de, a, etiqueta, titulo, children}) => {
	const frame = useCurrentFrame();
	const fa = F(de);
	const fb = F(a);
	if (frame < fa || frame >= fb) return null;
	const pin = interpolate(frame, [fa, fa + 9], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const pout = interpolate(frame, [fb - 8, fb], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const x1 = 100 * pout - 12 * (1 - pout); // borde izquierdo (sale hacia la izquierda)
	const x2 = 112 * pin; // borde derecho (entra desde la derecha)
	const tit = interpolate(frame, [fa + 4, fa + 16], [0, 1], {...clamp, easing: ease});
	return (
		<AbsoluteFill style={{clipPath: `polygon(${x1 + 12}% 0%, ${x2}% 0%, ${x2 - 12}% 100%, ${x1}% 100%)`}}>
			<AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 30%, #2A1752 0%, ${ESCENA} 60%, ${NOCHE} 100%)`}} />
			<AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(181,123,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(181,123,255,0.07) 1px, transparent 1px)', backgroundSize: '60px 60px'}} />
			<div style={{position: 'absolute', top: 290, left: 0, right: 0, textAlign: 'center', opacity: tit, translate: `0px ${(1 - tit) * 30}px`}}>
				<div style={{display: 'inline-block', padding: '8px 24px', borderRadius: 999, border: `2px solid ${MORADO2}`, color: MORADO2, fontFamily: helvetica, fontWeight: 700, fontSize: 28, letterSpacing: '0.3em'}}>{etiqueta}</div>
				<div style={{marginTop: 18, fontFamily: poppins, fontWeight: 800, fontSize: 92, lineHeight: 1, letterSpacing: '-0.02em', color: '#FFFFFF'}}>{titulo}</div>
			</div>
			{children}
		</AbsoluteFill>
	);
};

// a) Cookies que vuelan a la papelera
const EscenaCookies: React.FC = () => {
	const frame = useCurrentFrame();
	const borrar = at('cookies', 21.2);
	const vuelo = interpolate(frame, [F(borrar), F(borrar) + 22], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
	const listo = entra(frame, borrar + 0.9);
	const posiciones = [
		[300, 820],
		[520, 760],
		[740, 840],
		[380, 1000],
		[640, 1010],
	];
	return (
		<Escena de={ini('cookies')} a={fin('cookies')} etiqueta="OPCIÓN 1" titulo={<>BORRA LAS <span style={{color: MORADO2}}>COOKIES</span></>}>
			{/* Ventana del navegador */}
			<div style={{position: 'absolute', left: 150, top: 660, width: 780, height: 520, borderRadius: 30, background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(181,123,255,0.4)', overflow: 'hidden'}}>
				<div style={{height: 56, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10, padding: '0 22px'}}>
					{['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
						<div key={c} style={{width: 18, height: 18, borderRadius: 9, background: c}} />
					))}
					<div style={{marginLeft: 16, flex: 1, height: 30, borderRadius: 15, background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontFamily: helvetica, fontSize: 20, display: 'flex', alignItems: 'center', paddingLeft: 16}}>claude.ai</div>
				</div>
			</div>
			{posiciones.map(([x, y], i) => {
				const a0 = F(ini('cookies')) + 6 + i * 4;
				const q = interpolate(frame, [a0, a0 + 10], [0, 1], {...clamp, easing: rebote});
				const v = Math.max(0, Math.min(1, vuelo * 1.4 - i * 0.08));
				const px = x + (540 - x) * v;
				const py = y + (1360 - y) * v;
				return frame >= a0 ? <L.Cookie key={i} size={110} color="#D9A066" fill="#8B5A2B" strokeWidth={1.6} style={{position: 'absolute', left: px - 55, top: py - 55, scale: String(q * (1 - v * 0.6)), opacity: 1 - v * 0.9, rotate: `${v * 220}deg`}} /> : null;
			})}
			{/* Papelera */}
			<div style={{position: 'absolute', left: 540 - 80, top: 1290, width: 160, height: 160, borderRadius: 80, background: `linear-gradient(135deg, ${MORADO2}, ${MORADO3})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(139,92,246,0.7)', scale: String(1 + 0.12 * Math.sin(vuelo * Math.PI))}}>
				<L.Trash2 size={80} color="#FFFFFF" strokeWidth={2} />
			</div>
			{frame >= F(borrar + 0.9) ? (
				<div style={{position: 'absolute', top: 1480, left: 0, right: 0, display: 'flex', justifyContent: 'center', scale: String(listo)}}>
					<Vidrio style={{padding: '10px 26px', borderRadius: 999, border: `2px solid ${VERDE}`}}>
						<L.CheckCircle2 size={36} color={VERDE} strokeWidth={2.4} />
						<Txt size={36}>Cookies borradas</Txt>
					</Vidrio>
				</div>
			) : null}
		</Escena>
	);
};

// b) El VPN que "salta" de país: Tokio -> EE. UU. -> Singapur
const EscenaPaises: React.FC = () => {
	const frame = useCurrentFrame();
	const pins: {t: number; x: number; y: number; nombre: string; dia: string}[] = [
		{t: at('tokio', 31.08), x: 820, y: 860, nombre: 'Tokio', dia: 'AYER'},
		{t: at('eeuu', 32.56), x: 250, y: 780, nombre: 'EE. UU.', dia: 'HOY'},
		{t: at('eeuu', 33.7), x: 720, y: 1130, nombre: 'Singapur', dia: 'MAÑANA'},
	];
	return (
		<Escena de={ini('tokio')} a={fin('eeuu')} etiqueta="ERROR COMÚN" titulo={<>NO CAMBIES<br /><span style={{color: MORADO2}}>DE PAÍS</span></>}>
			{/* Puntos del "mapa" */}
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				{Array.from({length: 180}).map((_, i) => {
					const x = 90 + (i % 18) * 52;
					const y = 650 + Math.floor(i / 18) * 62;
					const o = 0.12 + 0.18 * ((i * 37) % 7 === 0 ? 1 : 0);
					return <circle key={i} cx={x} cy={y} r={4} fill={MORADO2} opacity={o} />;
				})}
				{pins.slice(1).map((p, i) => {
					const o = pins[i];
					const q = interpolate(frame, [F(p.t) - 6, F(p.t) + 6], [0, 1], clamp);
					const len = Math.hypot(p.x - o.x, p.y - o.y) + 200;
					return (
						<path key={p.nombre} d={`M${o.x},${o.y} Q${(o.x + p.x) / 2},${Math.min(o.y, p.y) - 180} ${p.x},${p.y}`} fill="none" stroke={ROJO} strokeWidth={5} strokeDasharray={`14 12`} strokeDashoffset={-frame * 2} opacity={q} style={{clipPath: 'none'}} strokeLinecap="round" pathLength={len} />
					);
				})}
			</svg>
			{pins.map((p) => {
				if (frame < F(p.t)) return null;
				const q = entra(frame, p.t);
				return (
					<div key={p.nombre} style={{position: 'absolute', left: p.x - 120, top: p.y - 150, width: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', scale: String(q)}}>
						<span style={{fontFamily: helvetica, fontWeight: 700, fontSize: 22, letterSpacing: '0.25em', color: MORADO2}}>{p.dia}</span>
						<Txt size={40}>{p.nombre}</Txt>
						<L.MapPin size={70} color="#FFFFFF" fill={MORADO} strokeWidth={1.6} />
					</div>
				);
			})}
			{frame >= F(pins[2].t + 0.3) ? (
				<div style={{position: 'absolute', top: 1400, left: 0, right: 0, display: 'flex', justifyContent: 'center', scale: String(entra(frame, pins[2].t + 0.3))}}>
					<Vidrio style={{padding: '12px 28px', borderRadius: 999, border: `2px solid ${ROJO}`}}>
						<L.TriangleAlert size={38} color={ROJO} strokeWidth={2.4} />
						<Txt size={38}>3 países = 3 IP distintas</Txt>
					</Vidrio>
				</div>
			) : null}
		</Escena>
	);
};

// c) KILL SWITCH: interruptor que se enciende y bloquea la IP
const EscenaKill: React.FC = () => {
	const frame = useCurrentFrame();
	const on = at('kill', 49.5);
	const protege = at('kill', 50.56);
	const k = interpolate(frame, [F(on), F(on) + 8], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const qp = entra(frame, protege);
	const pulso = 1 + 0.06 * Math.sin((frame - F(on)) / 4) * k;
	return (
		<Escena de={ini('kill')} a={fin('kill')} etiqueta="OPCIÓN 2" titulo={<span style={{fontSize: 120, color: '#FFFFFF'}}>KILL <span style={{color: MORADO2}}>SWITCH</span></span>}>
			{/* Interruptor */}
			<div style={{position: 'absolute', left: 540 - 220, top: 640, width: 440, height: 210, borderRadius: 105, background: k > 0.5 ? `linear-gradient(135deg, #4ADE80, ${VERDE})` : 'rgba(255,255,255,0.12)', border: '3px solid rgba(255,255,255,0.25)', boxShadow: k > 0.5 ? '0 0 60px rgba(34,197,94,0.65)' : 'none', scale: String(pulso)}}>
				<div style={{position: 'absolute', top: 15, left: 15 + 230 * k, width: 180, height: 180, borderRadius: 90, background: '#FFFFFF', boxShadow: '0 10px 30px rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
					<L.Power size={80} color={k > 0.5 ? VERDE : '#9CA3AF'} strokeWidth={2.6} />
				</div>
			</div>
			<div style={{position: 'absolute', top: 880, left: 0, right: 0, textAlign: 'center', fontFamily: helvetica, fontWeight: 700, fontSize: 30, letterSpacing: '0.3em', color: k > 0.5 ? VERDE : 'rgba(255,255,255,0.5)'}}>{k > 0.5 ? 'ACTIVADO' : 'APAGADO'}</div>
			{/* Cadena: tú -> VPN -> IP fija */}
			<div style={{position: 'absolute', top: 990, left: 70, right: 70, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
				{[
					{Ic: L.Laptop, txt: 'Tú', t: ini('kill') + 0.3},
					{Ic: L.Shield, txt: 'VPN', t: ini('kill') + 0.6},
					{Ic: L.Globe, txt: 'Misma IP', t: protege},
				].map(({Ic, txt, t}, i) => {
					const q = entra(frame, t);
					return (
						<div key={txt} style={{display: 'flex', alignItems: 'center', gap: 10}}>
							<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, scale: String(q), opacity: frame >= F(t) ? 1 : 0}}>
								<Circulo tam={140} fondo={i === 2 ? `linear-gradient(135deg, #4ADE80, ${VERDE})` : undefined}>
									<Ic size={70} color="#FFFFFF" strokeWidth={1.8} />
								</Circulo>
								<Txt size={32}>{txt}</Txt>
							</div>
							{i < 2 ? <div style={{width: 120, height: 6, borderRadius: 3, marginLeft: 14, background: `linear-gradient(90deg, ${MORADO2}, ${MORADO})`, opacity: q}} /> : null}
						</div>
					);
				})}
			</div>
			{frame >= F(protege) ? (
				<div style={{position: 'absolute', top: 1310, left: 0, right: 0, display: 'flex', justifyContent: 'center', scale: String(qp)}}>
					<Vidrio style={{padding: '12px 28px', borderRadius: 999, border: `2px solid ${VERDE}`}}>
						<L.Lock size={36} color={VERDE} strokeWidth={2.4} />
						<Txt size={36}>Protege tu misma IP</Txt>
					</Vidrio>
				</div>
			) : null}
		</Escena>
	);
};

// d) El proxy como extensión del navegador
const EscenaExtension: React.FC = () => {
	const frame = useCurrentFrame();
	const clic = ini('extension') + 1.2;
	const q = entra(frame, clic);
	const on = interpolate(frame, [F(clic) + 8, F(clic) + 16], [0, 1], clamp);
	const cursor = interpolate(frame, [F(ini('extension')) + 4, F(clic)], [0, 1], {...clamp, easing: ease});
	return (
		<Escena de={ini('extension')} a={fin('extension')} etiqueta="OPCIÓN 3" titulo={<>USA UN <span style={{color: MORADO2}}>PROXY</span></>}>
			<div style={{position: 'absolute', left: 120, top: 640, width: 840, height: 660, borderRadius: 30, background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(181,123,255,0.4)', overflow: 'hidden'}}>
				<div style={{height: 60, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10, padding: '0 22px'}}>
					{['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
						<div key={c} style={{width: 18, height: 18, borderRadius: 9, background: c}} />
					))}
					<div style={{marginLeft: 16, flex: 1, height: 32, borderRadius: 16, background: 'rgba(255,255,255,0.12)'}} />
					<div style={{width: 48, height: 48, borderRadius: 12, background: q > 0 ? MORADO : 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
						<L.Puzzle size={30} color="#FFFFFF" strokeWidth={2} />
					</div>
				</div>
				{/* Ventanita de la extensión */}
				<div style={{position: 'absolute', right: 26, top: 80, width: 420, borderRadius: 24, background: '#FFFFFF', padding: 26, scale: String(q), transformOrigin: '90% 0%', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'}}>
					<div style={{display: 'flex', alignItems: 'center', gap: 12}}>
						<L.Globe size={40} color={MORADO3} strokeWidth={2} />
						<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 34, color: NOCHE}}>Proxy</span>
					</div>
					<div style={{marginTop: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
						<span style={{fontFamily: helvetica, fontWeight: 700, fontSize: 26, color: '#4B4560'}}>{on > 0.5 ? 'Activado' : 'Desactivado'}</span>
						<div style={{width: 96, height: 52, borderRadius: 26, background: on > 0.5 ? VERDE : '#D4D4D8', position: 'relative'}}>
							<div style={{position: 'absolute', top: 6, left: 6 + 44 * on, width: 40, height: 40, borderRadius: 20, background: '#FFFFFF'}} />
						</div>
					</div>
					<div style={{marginTop: 18, fontFamily: helvetica, fontSize: 22, color: '#6B6680'}}>Misma ubicación siempre</div>
				</div>
			</div>
			<L.MousePointer2 size={70} color="#FFFFFF" fill="#FFFFFF" style={{position: 'absolute', left: 300 + 520 * cursor, top: 1150 - 420 * cursor, filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.5))'}} />
			<div style={{position: 'absolute', top: 1360, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: on}}>
				<Vidrio style={{padding: '12px 28px', borderRadius: 999}}>
					<L.Puzzle size={34} color={MORADO2} strokeWidth={2.2} />
					<Txt size={36}>Extensión del navegador</Txt>
				</Vidrio>
			</div>
		</Escena>
	);
};

// e) ¿Ya te bloquearon? El familiar con documento extranjero
const EscenaFamiliar: React.FC = () => {
	const frame = useCurrentFrame();
	const pasos: {t: number; Ic: L.LucideIcon; titulo: string; sub: string}[] = [
		{t: at('familiar', 77.08), Ic: L.Contact, titulo: 'Un familiar', sub: 'con documento extranjero'},
		{t: at('cuenta', 80.38), Ic: L.UserPlus, titulo: 'Abre una cuenta', sub: 'nueva, a su nombre'},
		{t: at('cuenta', 82.46), Ic: L.KeyRound, titulo: 'Te da el acceso', sub: 'y tú la usas'},
	];
	return (
		<Escena de={ini('familiar')} a={fin('cuenta')} etiqueta="SI YA TE BLOQUEARON" titulo={<>PLAN <span style={{color: MORADO2}}>B</span></>}>
			<div style={{position: 'absolute', top: 640, left: 90, right: 90, display: 'flex', flexDirection: 'column', gap: 34}}>
				{pasos.map((p, i) => {
					if (frame < F(p.t)) return null;
					const q = interpolate(frame, [F(p.t), F(p.t) + 12], [0, 1], {...clamp, easing: ease});
					return (
						<div key={p.titulo} style={{display: 'flex', alignItems: 'center', gap: 26, opacity: q, translate: `${(1 - q) * 80}px 0px`}}>
							<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 64, color: MORADO2, width: 60}}>{i + 1}</div>
							<Circulo tam={140}>
								<p.Ic size={70} color="#FFFFFF" strokeWidth={1.8} />
							</Circulo>
							<div style={{display: 'flex', flexDirection: 'column'}}>
								<Txt size={50}>{p.titulo}</Txt>
								<span style={{fontFamily: helvetica, fontWeight: 700, fontSize: 30, color: 'rgba(233,226,255,0.8)'}}>{p.sub}</span>
							</div>
						</div>
					);
				})}
			</div>
		</Escena>
	);
};

// f) Respaldo de la cuenta
const EscenaRespaldo: React.FC = () => {
	const frame = useCurrentFrame();
	const r = at('respaldo', 108.6);
	const baja = interpolate(frame, [F(r), F(r) + 20], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const ok = entra(frame, r + 0.8);
	const aviso = at('pierdas', 112.92);
	const qa = entra(frame, aviso);
	return (
		<Escena de={ini('respaldo')} a={fin('pierdas')} etiqueta="SIEMPRE" titulo={<>HAZ UN <span style={{color: MORADO2}}>RESPALDO</span></>}>
			<div style={{position: 'absolute', left: 540 - 170, top: 640, width: 340, height: 200, borderRadius: 30, background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(181,123,255,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18}}>
				<Img src={staticFile(`${W}/claude.png`)} style={{width: 110}} />
				<Txt size={42}>Claude</Txt>
			</div>
			{[0, 1, 2].map((i) => {
				const y = 880 + ((baja * 200 + i * 70) % 210);
				return <L.FileText key={i} size={54} color={MORADO2} strokeWidth={2} style={{position: 'absolute', left: 540 - 27, top: y, opacity: baja > 0 && baja < 1 ? 0.9 : 0}} />;
			})}
			<div style={{position: 'absolute', left: 540 - 110, top: 1100, width: 220, height: 220, borderRadius: 110, background: `linear-gradient(135deg, ${MORADO2}, ${MORADO3})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 50px rgba(139,92,246,0.7)'}}>
				<L.HardDriveDownload size={110} color="#FFFFFF" strokeWidth={1.8} />
				{frame >= F(r + 0.8) ? (
					<div style={{position: 'absolute', right: -6, top: -6, scale: String(ok)}}>
						<Circulo tam={84} fondo={`linear-gradient(135deg, #4ADE80, ${VERDE})`}>
							<L.Check size={50} color="#FFFFFF" strokeWidth={3} />
						</Circulo>
					</div>
				) : null}
			</div>
			{frame >= F(aviso) ? (
				<div style={{position: 'absolute', top: 1400, left: 0, right: 0, display: 'flex', justifyContent: 'center', scale: String(qa)}}>
					<Vidrio style={{padding: '12px 28px', borderRadius: 999, border: `2px solid ${ROJO}`}}>
						<L.TriangleAlert size={36} color={ROJO} strokeWidth={2.4} />
						<Txt size={36}>Que no pierdas todo</Txt>
					</Vidrio>
				</div>
			) : null}
		</Escena>
	);
};

// ------------------------------------------------------------------ sobre la cámara
// Gancho: CLAUDE detrás, logo y bandera 3D, candado que se rompe
const Gancho: React.FC = () => {
	const frame = useCurrentFrame();
	if (frame >= F(fin('gancho'))) return null;
	const rompe = at('gancho', 0.95);
	const k = interpolate(frame, [F(rompe), F(rompe) + 14], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const q = entra(frame, 0.1);
	return (
		<>
			<div style={{position: 'absolute', left: 540 - 95, top: 1240, width: 190, height: 220, scale: String(q)}}>
				{/* Arco del candado: salta al romperse */}
				<svg width={190} height={220} viewBox="0 0 190 220" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
					<path d="M50 100 V66 A45 45 0 0 1 140 66 V100" fill="none" stroke="#FFFFFF" strokeWidth={20} strokeLinecap="round" transform={`translate(${k * 30} ${-k * 60}) rotate(${k * 28} 140 100)`} />
				</svg>
				<div style={{position: 'absolute', left: 20, top: 96, width: 150, height: 120, borderRadius: 26, background: `linear-gradient(135deg, ${MORADO2}, ${MORADO3})`, boxShadow: '0 0 40px rgba(139,92,246,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
					<div style={{width: 22, height: 44, borderRadius: 11, background: NOCHE}} />
					{/* Grieta */}
					<svg width={150} height={120} viewBox="0 0 150 120" style={{position: 'absolute', inset: 0}}>
						<path d="M75 0 L64 34 L84 52 L66 80 L80 120" fill="none" stroke="#FFFFFF" strokeWidth={5} strokeDasharray={160} strokeDashoffset={160 * (1 - k)} strokeLinejoin="round" />
					</svg>
				</div>
			</div>
			<Icono3D src="claude.png" t={at('gancho', 1.7) - 0.2} ancho={200} style={{left: 120, top: 1160}} />
			<Icono3D src="venezuela.png" t={at('gancho', 2.96) - 0.15} ancho={210} giro={8} style={{left: 760, top: 1220}} />
		</>
	);
};

const Alerta: React.FC = () => {
	const frame = useCurrentFrame();
	const a = ini('usuarios');
	const b = fin('usuarios');
	if (frame < F(a) || frame >= F(b)) return null;
	const q = entra(frame, a);
	const o = fundido(frame, a, b);
	const n = Math.round(interpolate(frame, [F(a) + 6, F(b) - 10], [0, 999], {...clamp, easing: Easing.out(Easing.cubic)}));
	return (
		<Fila top={1340}>
			<div style={{scale: String(q), opacity: o, width: 860}}>
				<div style={{background: 'rgba(250,248,255,0.97)', borderRadius: 32, padding: '20px 26px', boxShadow: '0 18px 44px rgba(0,0,0,0.45), 0 0 34px rgba(239,68,68,0.35)', display: 'flex', gap: 18, alignItems: 'center'}}>
					<Circulo tam={80} fondo={`linear-gradient(135deg, #FF6B6B, ${ROJO})`}>
						<L.Ban size={44} color="#FFFFFF" strokeWidth={2.4} />
					</Circulo>
					<div style={{flex: 1}}>
						<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 36, color: NOCHE}}>Cuenta suspendida</div>
						<div style={{fontFamily: helvetica, fontSize: 28, color: '#4B4560'}}>Muchos usuarios en Venezuela</div>
					</div>
					<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 44, color: ROJO}}>+{n}</div>
				</div>
			</div>
		</Fila>
	);
};

// Chips simples (una o varias píldoras) en la franja del pecho
const Chips: React.FC<{readonly de: number; readonly a: number; readonly items: {t: number; ic: React.ReactNode; texto: React.ReactNode; tacha?: number}[]; readonly top?: number}> = ({de, a, items, top = 1400}) => {
	const frame = useCurrentFrame();
	if (frame < F(de) || frame >= F(a)) return null;
	const o = fundido(frame, de, a);
	return (
		<Fila top={top}>
			{items.map((it, i) => {
				if (frame < F(it.t)) return null;
				const q = entra(frame, it.t);
				const tacha = it.tacha === undefined ? 0 : interpolate(frame, [F(it.tacha), F(it.tacha) + 8], [0, 1], clamp);
				return (
					<div key={i} style={{scale: String(q), opacity: o, position: 'relative'}}>
						<Vidrio style={{padding: '10px 26px 10px 10px', gap: 12, borderRadius: 999, opacity: 1 - tacha * 0.45}}>
							<Circulo tam={58}>{it.ic}</Circulo>
							<Txt size={38}>{it.texto}</Txt>
						</Vidrio>
						{it.tacha !== undefined ? <div style={{position: 'absolute', left: 10, right: 10, top: '50%', height: 7, borderRadius: 4, background: ROJO, transformOrigin: '0% 50%', scale: `${tacha} 1`, rotate: '-6deg'}} /> : null}
					</div>
				);
			})}
		</Fila>
	);
};

// Sello rojo "BANEADO"
const Sello: React.FC<{readonly t: number; readonly a: number; readonly texto: string}> = ({t, a, texto}) => {
	const frame = useCurrentFrame();
	if (frame < F(t) || frame >= F(a)) return null;
	const q = interpolate(frame, [F(t), F(t) + 7], [2.2, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	return (
		<div style={{position: 'absolute', top: 1340, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
			<div style={{scale: String(q), rotate: '-8deg', border: `8px solid ${ROJO}`, borderRadius: 22, padding: '6px 34px', fontFamily: poppins, fontWeight: 800, fontSize: 104, color: ROJO, letterSpacing: '0.04em', background: 'rgba(255,255,255,0.08)', textShadow: '0 4px 20px rgba(0,0,0,0.35)'}}>{texto}</div>
		</div>
	);
};

// CTA: barra de comentario escribiendo IA
const Cta: React.FC = () => {
	const frame = useCurrentFrame();
	const a = ini('cta');
	if (frame < F(a)) return null;
	const ia = at('cta', 100.94);
	const q = entra(frame, at('cta', 100.0));
	const letras = frame >= F(ia) ? Math.min(2, Math.floor((frame - F(ia)) / 4) + 1) : 0;
	const enviado = frame >= F(ia) + 14;
	const herr = entra(frame, at('cta', 102.68));
	return (
		<>
			<div style={{position: 'absolute', top: 1380, left: 90, right: 90, scale: String(q)}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 18, background: '#FFFFFF', borderRadius: 999, padding: '12px 14px', boxShadow: '0 14px 36px rgba(0,0,0,0.35), 0 0 30px rgba(139,92,246,0.5)'}}>
					<div style={{width: 58, height: 58, borderRadius: 29, background: `linear-gradient(135deg, ${MORADO2}, ${MORADO3})`}} />
					<div style={{flex: 1, fontFamily: helvetica, fontSize: 40, fontWeight: 700, color: NOCHE}}>
						{'IA'.slice(0, letras)}
						{!enviado && frame % 14 < 7 ? <span style={{color: MORADO}}>|</span> : null}
					</div>
					<div style={{width: 64, height: 64, borderRadius: 32, background: MORADO, display: 'flex', alignItems: 'center', justifyContent: 'center', scale: String(enviado ? interpolate(frame, [F(ia) + 14, F(ia) + 20], [1.25, 1], clamp) : 1)}}>
						<L.ArrowUp size={36} color="#FFFFFF" strokeWidth={3} />
					</div>
				</div>
			</div>
			{frame >= F(at('cta', 102.68)) ? (
				<Fila top={1500}>
					<div style={{scale: String(herr)}}>
						<Vidrio style={{padding: '8px 22px', borderRadius: 999}}>
							<L.Send size={30} color={MORADO2} strokeWidth={2.2} />
							<Txt size={32}>Te envío las herramientas</Txt>
						</Vidrio>
					</div>
				</Fila>
			) : null}
		</>
	);
};

// "IA" grande en morado, junto a COMENTA (delante, sin que la tape la cabeza)
const PalabraIA: React.FC = () => {
	const frame = useCurrentFrame();
	const t = at('cta', 100.94);
	if (frame < F(t)) return null;
	const q = interpolate(frame, [F(t), F(t) + 8], [2, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	return (
		<div style={{position: 'absolute', top: 470, left: 0, right: 0, textAlign: 'center'}}>
			<span style={{display: 'inline-block', scale: String(q), padding: '0 34px', borderRadius: 30, background: `linear-gradient(135deg, ${MORADO2}, ${MORADO3})`, boxShadow: '0 0 50px rgba(139,92,246,0.85)', fontFamily: poppins, fontWeight: 800, fontSize: 120, lineHeight: 1.15, color: '#FFFFFF'}}>"IA"</span>
		</div>
	);
};

// Destello morado en cada cambio de ángulo
const Destellos: React.FC = () => {
	const frame = useCurrentFrame();
	const cambios = TRAMOS.filter((p, i) => i > 0 && p.zoom !== TRAMOS[i - 1].zoom).map((p) => F(p.t));
	const o = Math.max(0, ...cambios.map((c) => interpolate(frame, [c - 1, c + 1, c + 7], [0, 0.3, 0], clamp)));
	return o > 0 ? <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, rgba(181,123,255,0.9), rgba(139,92,246,0) 70%)', opacity: o, mixBlendMode: 'screen'}} /> : null;
};

// Golpe de zoom suave al empezar cada tramo a cámara (se siente otro ángulo, sin cortar la cara)
const useGolpe = () => {
	const frame = useCurrentFrame();
	const p = piezaEn(frame / FPS);
	const k = frame - F(p.t);
	return interpolate(k, [0, 8], [1.035, 1], {...clamp, easing: ease});
};

const Sfx: React.FC<{readonly t: number; readonly src: string; readonly volume?: number}> = ({t, src, volume = 0.3}) => (
	<Sequence from={Math.max(0, F(t))} durationInFrames={3 * FPS}>
		<Audio src={staticFile(`sfx/${src}.wav`)} volume={volume} />
	</Sequence>
);

export const KillSwitchComponent: React.FC = () => {
	const frame = useCurrentFrame();
	const golpe = useGolpe();
	const finOp = interpolate(frame, [F(DURACION) - 8, F(DURACION)], [1, 0], clamp);
	const conPersona = RECORTES.some((r) => frame >= F(ini(r)) && frame < F(fin(r)));
	return (
		<AbsoluteFill style={{background: NOCHE}}>
			<AbsoluteFill style={{opacity: finOp}}>
				<AbsoluteFill style={{scale: String(golpe), transformOrigin: '540px 760px'}}>
					<Video src={staticFile(`${W}/base.mp4`)} style={{position: 'absolute', width: '100%', height: '100%'}} />
				</AbsoluteFill>
				<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(13,10,26,0.45) 0%, rgba(13,10,26,0) 26%, rgba(13,10,26,0) 58%, rgba(13,10,26,0.42) 78%, rgba(13,10,26,0.2) 100%)'}} />
				<Destellos />

				{/* ---------- Palabras DETRÁS de la persona ---------- */}
				<Detras de={0} a={fin('gancho')} lineas={[['CLAUDE', 0]]} top={400} size={230} />
				<Detras de={ini('prevenir')} a={fin('prevenir')} lineas={[['¿CÓMO', ini('prevenir')], ['PREVENIRLO?', ini('prevenir') + 0.3, MORADO2]]} top={290} size={118} />
				<Detras de={ini('baneo')} a={fin('baneo')} lineas={[['ACTIVIDAD', at('baneo', 36.76)], ['INUSUAL', at('baneo', 37.12), ROJO]]} top={290} size={136} />
				<Detras de={ini('bloquearon')} a={fin('bloquearon')} lineas={[['¿YA TE', at('bloquearon', 72.18)], ['BLOQUEARON?', at('bloquearon', 72.42), ROJO]]} top={300} size={124} />
				<Detras de={ini('cta')} a={DURACION} lineas={[['COMENTA', ini('cta')]]} top={330} size={150} />
				<PalabraIA />
				{conPersona ? (
					<AbsoluteFill style={{scale: String(golpe), transformOrigin: '540px 760px'}}>
						<Persona />
					</AbsoluteFill>
				) : null}

				{/* ---------- Delante, sobre la cámara ---------- */}
				<Gancho />
				<Alerta />
				<Chips de={ini('prevenir') + 0.9} a={fin('prevenir')} items={[{t: ini('prevenir') + 0.9, ic: <L.Eye size={30} color="#FFFFFF" strokeWidth={2.2} />, texto: 'Te muestro'}]} />
				<Chips
					de={ini('unvpn')}
					a={fin('unvpn')}
					items={[
						{t: at('unvpn', 25.86), ic: <L.Shield size={30} color="#FFFFFF" strokeWidth={2.2} />, texto: '1 solo VPN'},
						{t: at('unvpn', 26.9), ic: <L.Wifi size={30} color="#FFFFFF" strokeWidth={2.2} />, texto: '1 sola IP'},
					]}
				/>
				{frame >= F(ini('unvpn')) && frame < F(fin('unvpn')) ? <Icono3D src="vpn.png" t={at('unvpn', 25.86) - 0.15} ancho={240} style={{left: 780, top: 1100}} /> : null}
				<Sello t={at('baneo', 37.98)} a={fin('baneo')} texto="BANEADO" />
				<Chips
					de={ini('proton')}
					a={fin('paga')}
					items={[
						{t: at('proton', 45.08), ic: <L.ShieldCheck size={30} color="#FFFFFF" strokeWidth={2.2} />, texto: 'Proton VPN'},
						{t: at('paga', 47.7), ic: <L.CreditCard size={30} color="#FFFFFF" strokeWidth={2.2} />, texto: 'Versión paga'},
					]}
				/>
				<Chips
					de={ini('proxy')}
					a={fin('proxy')}
					items={[
						{t: at('proxy', 55.06), ic: <L.Shield size={30} color="#FFFFFF" strokeWidth={2.2} />, texto: 'VPN', tacha: at('proxy', 55.9)},
						{t: at('proxy', 56.18), ic: <L.Globe size={30} color="#FFFFFF" strokeWidth={2.2} />, texto: <>Proxy <span style={{color: VERDE}}>✓</span></>},
					]}
				/>
				<Chips
					de={ini('mascara1')}
					a={fin('mascara2')}
					items={[
						{t: at('mascara2', 67.14), ic: <L.VenetianMask size={32} color="#FFFFFF" strokeWidth={2.2} />, texto: 'Como una máscara'},
						{t: at('mascara2', 68.88), ic: <L.MapPin size={30} color="#FFFFFF" strokeWidth={2.2} />, texto: 'Siempre el mismo sitio'},
					]}
				/>
				<Chips de={ini('solucion')} a={fin('solucion')} items={[{t: at('solucion', 89.94), ic: <L.CheckCircle2 size={32} color="#FFFFFF" strokeWidth={2.2} />, texto: 'Para todo hay solución'}]} />
				<Chips
					de={ini('sinfamiliar1')}
					a={fin('sinfamiliar2')}
					items={[{t: at('sinfamiliar2', 86.26), ic: <L.UserX size={30} color="#FFFFFF" strokeWidth={2.2} />, texto: 'Sin familiar afuera'}]}
				/>
				<Chips
					de={ini('herramientas')}
					a={fin('herramientas')}
					items={[{t: at('herramientas', 91.96), ic: <L.Sparkles size={30} color="#FFFFFF" strokeWidth={2.2} />, texto: <>IA similares a <span style={{color: MORADO2}}>Claude</span></>}]}
				/>
				<Chips
					de={ini('flujos')}
					a={fin('flujos')}
					top={1330}
					items={[
						{t: at('flujos', 96.16), ic: <L.Workflow size={30} color="#FFFFFF" strokeWidth={2.2} />, texto: 'Flujos con IA'},
						{t: at('flujos', 97.76), ic: <L.Globe size={30} color="#FFFFFF" strokeWidth={2.2} />, texto: 'Páginas web'},
						{t: at('flujos', 98.48), ic: <L.Code2 size={30} color="#FFFFFF" strokeWidth={2.2} />, texto: 'Desarrollos'},
						{t: at('flujos', 99.18), ic: <L.Plus size={30} color="#FFFFFF" strokeWidth={2.6} />, texto: 'Y más'},
					]}
				/>
				<Cta />

				{/* ---------- Escenas animadas a pantalla completa ---------- */}
				<EscenaCookies />
				<EscenaPaises />
				<EscenaKill />
				<EscenaExtension />
				<EscenaFamiliar />
				<EscenaRespaldo />
			</AbsoluteFill>

			{/* ---------- Efectos de sonido (sin música) ---------- */}
			<Sfx t={0.05} src="impacto" volume={0.3} />
			<Sfx t={at('gancho', 0.95)} src="glitch" volume={0.26} />
			<Sfx t={at('gancho', 0.98)} src="impacto-2" volume={0.24} />
			<Sfx t={at('gancho', 1.5)} src="pop" volume={0.26} />
			<Sfx t={at('gancho', 2.8)} src="pop" volume={0.26} />
			<Sfx t={ini('usuarios')} src="notificacion" volume={0.26} />
			<Sfx t={ini('prevenir') - 0.06} src="whoosh-corto" volume={0.32} />
			<Sfx t={ini('cookies') - 0.08} src="whoosh" volume={0.36} />
			<Sfx t={at('cookies', 21.2)} src="swipe" volume={0.3} />
			<Sfx t={at('cookies', 21.2) + 0.7} src="caja" volume={0.22} />
			<Sfx t={ini('unvpn') - 0.06} src="whoosh-2" volume={0.32} />
			<Sfx t={at('unvpn', 25.86)} src="pop" volume={0.26} />
			<Sfx t={at('unvpn', 26.9)} src="pop" volume={0.26} />
			<Sfx t={ini('tokio') - 0.08} src="whoosh" volume={0.36} />
			<Sfx t={at('tokio', 31.08)} src="ping" volume={0.26} />
			<Sfx t={at('eeuu', 32.56)} src="ping" volume={0.26} />
			<Sfx t={at('eeuu', 33.7)} src="ping" volume={0.26} />
			<Sfx t={ini('baneo') - 0.06} src="whoosh-3" volume={0.3} />
			<Sfx t={at('baneo', 37.98)} src="impacto" volume={0.36} />
			<Sfx t={at('baneo', 37.98) + 0.05} src="error" volume={0.24} />
			<Sfx t={at('proton', 45.08)} src="pop" volume={0.26} />
			<Sfx t={at('paga', 47.7)} src="caja" volume={0.24} />
			<Sfx t={ini('kill') - 0.08} src="whoosh" volume={0.36} />
			<Sfx t={at('kill', 49.5)} src="remotion/switch" volume={0.4} />
			<Sfx t={at('kill', 50.56)} src="ding" volume={0.26} />
			<Sfx t={at('proxy', 55.9)} src="error" volume={0.2} />
			<Sfx t={at('proxy', 56.18)} src="pop" volume={0.26} />
			<Sfx t={ini('extension') - 0.08} src="whoosh-2" volume={0.34} />
			<Sfx t={ini('extension') + 1.2} src="click" volume={0.34} />
			<Sfx t={at('mascara2', 67.14)} src="pop" volume={0.26} />
			<Sfx t={at('mascara2', 68.88)} src="pop" volume={0.26} />
			<Sfx t={ini('bloquearon') - 0.06} src="whoosh-corto" volume={0.3} />
			<Sfx t={ini('familiar') - 0.08} src="whoosh" volume={0.36} />
			<Sfx t={at('familiar', 77.08)} src="pop" volume={0.26} />
			<Sfx t={at('cuenta', 80.38)} src="pop" volume={0.26} />
			<Sfx t={at('cuenta', 82.46)} src="ding" volume={0.24} />
			<Sfx t={at('solucion', 89.94)} src="brillo" volume={0.26} />
			<Sfx t={at('flujos', 96.16)} src="pop" volume={0.24} />
			<Sfx t={at('flujos', 97.76)} src="pop" volume={0.24} />
			<Sfx t={at('flujos', 98.48)} src="pop" volume={0.24} />
			<Sfx t={at('flujos', 99.18)} src="pop" volume={0.24} />
			<Sfx t={ini('respaldo') - 0.08} src="whoosh" volume={0.36} />
			<Sfx t={at('respaldo', 108.6) + 0.8} src="ding" volume={0.26} />
			<Sfx t={at('pierdas', 112.92)} src="error" volume={0.22} />
			<Sfx t={ini('cta') - 0.06} src="whoosh-3" volume={0.32} />
			<Sfx t={at('cta', 100.94)} src="impacto" volume={0.3} />
			<Sfx t={at('cta', 100.94) + 0.15} src="teclado-iphone" volume={0.26} />
			<Sfx t={at('cta', 100.94) + 0.5} src="remotion/snapchat-notification" volume={0.28} />
		</AbsoluteFill>
	);
};

export const KillSwitchComposition: React.FC = () => (
	<Composition id="ClaudeKillSwitch" component={KillSwitchComponent} durationInFrames={marcas.frames} fps={FPS} width={1080} height={1920} />
);
