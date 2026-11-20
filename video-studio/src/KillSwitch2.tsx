import {Audio, Video} from '@remotion/media';
import * as L from 'lucide-react';
import {AbsoluteFill, Composition, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {helvetica, poppins} from './fonts';
import marcas from './killswitch-marcas.json';

// Reel "¿Cómo prevenir que te bloqueen Claude en Venezuela?" — versión 2, con el estilo del reel
// TOFU · MOFU · BOFU que Raquel aprobó: ella es la protagonista; cuando hay que explicar, una PIZARRA
// crema baja desde arriba (cuadrícula de libreta, trazos de tinta, un solo acento morado) y ella
// queda abajo; cuando no, palabras clave grandes DETRÁS o encima de su cabeza. Nada de escenas que la
// saquen del cuadro, ni rojos/verdes, ni botones. Gancho: la pregunta palabra por palabra con el
// logo de Claude 3D grande (sin sonido). Base: scripts/killswitch_base.py (mismos cortes, nivel
// parejo entre frases y 0.8 s de cola al final).

const FPS = 30;
const W = 'work/killswitch';
const DURACION = marcas.total;
const CREMA = '#F4EFE7';
const TINTA = '#141416';
const GRIS = '#8C867D';
const MORADO = '#7C3AED'; // acento sobre crema
const MORADO2 = '#B57BFF'; // acento sobre video
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const rebote = Easing.out(Easing.back(1.7));

type Tramo = (typeof marcas.tramos)[number];
const TRAMOS: Tramo[] = marcas.tramos;
const ini = (id: string) => TRAMOS.find((p) => p.id === id)!.t;
const fin = (id: string) => {
	const ps = TRAMOS.filter((p) => p.id === id);
	const u = ps[ps.length - 1];
	return u.t + u.d;
};
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
const entra = (frame: number, t: number, dur = 9) => interpolate(frame, [F(t), F(t) + dur], [0, 1], {...clamp, easing: rebote});

// ------------------------------------------------------------------ pizarra (pantalla dividida)
const PANEL = 860;
const BAJAR = 330;
// Tramos con pizarra: [primera pieza, última pieza]
const PIZARRAS: [string, string][] = [
	['usuarios', 'usuarios'],
	['cookies', 'unvpn'],
	['proton', 'proton'],
	['proxy', 'extension'],
	['familiar', 'cuenta'],
	['herramientas', 'flujos'],
];
const pizarraEn = (t: number) => PIZARRAS.find(([a, b]) => t >= ini(a) && t < fin(b));

const Trazo: React.FC<{readonly d: string; readonly p: number; readonly color?: string; readonly ancho?: number; readonly dash?: number}> = ({d, p, color = TINTA, ancho = 6, dash = 900}) => (
	<path d={d} fill="none" stroke={color} strokeWidth={ancho} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} strokeDashoffset={dash * (1 - p)} />
);
const dibuja = (frame: number, t: number, dur = 16) => interpolate(frame, [F(t), F(t) + dur], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});

const Etiqueta: React.FC<{readonly Ic: L.LucideIcon; readonly texto: string}> = ({Ic, texto}) => (
	<div style={{display: 'flex', alignItems: 'center', gap: 12}}>
		<Ic size={34} color={MORADO} strokeWidth={2.2} />
		<span style={{fontFamily: helvetica, fontWeight: 700, fontSize: 28, letterSpacing: '0.3em', color: MORADO}}>{texto}</span>
	</div>
);
const Titulo: React.FC<{readonly children: React.ReactNode; readonly size?: number}> = ({children, size = 96}) => (
	<div style={{fontFamily: poppins, fontWeight: 800, fontSize: size, lineHeight: 0.95, color: TINTA, letterSpacing: '-0.02em'}}>{children}</div>
);
// Renglón que entra cuando lo dice
const Renglon: React.FC<{readonly t: number; readonly Ic?: L.LucideIcon; readonly children: React.ReactNode; readonly n?: number; readonly tachado?: number}> = ({t, Ic, children, n, tachado}) => {
	const frame = useCurrentFrame();
	if (frame < F(t)) return null;
	const q = interpolate(frame, [F(t), F(t) + 10], [0, 1], {...clamp, easing: ease});
	const tc = tachado === undefined ? 0 : interpolate(frame, [F(tachado), F(tachado) + 8], [0, 1], clamp);
	return (
		<div style={{display: 'flex', alignItems: 'center', gap: 16, opacity: q, translate: `${(1 - q) * 30}px 0px`, position: 'relative'}}>
			{n !== undefined ? (
				<div style={{width: 54, height: 54, borderRadius: 27, background: MORADO, color: '#FFFFFF', fontFamily: poppins, fontWeight: 800, fontSize: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>{n}</div>
			) : Ic ? (
				<div style={{width: 58, height: 58, borderRadius: 29, background: TINTA, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
					<Ic size={30} color="#FFFFFF" strokeWidth={1.9} />
				</div>
			) : null}
			<div style={{fontFamily: helvetica, fontSize: 36, fontWeight: 600, color: TINTA, lineHeight: 1.15, opacity: 1 - tc * 0.45}}>{children}</div>
			{tachado !== undefined ? <div style={{position: 'absolute', left: 70, right: 0, top: '50%', height: 6, borderRadius: 3, background: MORADO, transformOrigin: '0% 50%', scale: `${tc} 1`}} /> : null}
		</div>
	);
};

const Pizarra: React.FC<{readonly de: number; readonly a: number; readonly izquierda: React.ReactNode; readonly children: React.ReactNode}> = ({de, a, izquierda, children}) => {
	const frame = useCurrentFrame();
	const fa = F(de);
	const fb = F(a);
	if (frame < fa || frame >= fb) return null;
	const e = interpolate(frame, [fa, fa + 10], [0, 1], {...clamp, easing: ease});
	const s = interpolate(frame, [fb - 8, fb], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
	return (
		<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: PANEL, background: CREMA, borderBottomLeftRadius: 56, borderBottomRightRadius: 56, boxShadow: '0 24px 60px rgba(0,0,0,0.35)', translate: `0px ${(-1 + e - s) * (PANEL + 60)}px`, overflow: 'hidden'}}>
			<div style={{position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(20,20,22,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(20,20,22,0.05) 1px, transparent 1px)', backgroundSize: '54px 54px'}} />
			<div style={{position: 'absolute', top: 270, left: 50, width: 470, height: 520}}>{izquierda}</div>
			<div style={{position: 'absolute', top: 280, left: 560, right: 50, display: 'flex', flexDirection: 'column', gap: 18}}>{children}</div>
		</div>
	);
};

// 1) Cuentas bloqueadas: tres usuarios dibujados que se tachan
const PizUsuarios: React.FC = () => {
	const frame = useCurrentFrame();
	const t0 = ini('usuarios');
	const bloq = at('usuarios', 9.6);
	return (
		<Pizarra
			de={t0}
			a={fin('usuarios')}
			izquierda={
				<svg width={470} height={520} viewBox="0 0 470 520">
					{[0, 1, 2].map((i) => {
						const x = 80 + i * 155;
						const y = i === 1 ? 170 : 240;
						const p = dibuja(frame, t0 + 0.1 + i * 0.15);
						const xp = dibuja(frame, bloq + i * 0.12, 8);
						return (
							<g key={i}>
								<Trazo d={`M${x + 40},${y} m-34,0 a34,34 0 1,0 68,0 a34,34 0 1,0 -68,0`} p={p} dash={240} />
								<Trazo d={`M${x - 15},${y + 130} Q${x + 40},${y + 40} ${x + 95},${y + 130}`} p={p} dash={200} />
								<Trazo d={`M${x - 5},${y - 45} L${x + 85},${y + 125} M${x + 85},${y - 45} L${x - 5},${y + 125}`} p={xp} color={MORADO} ancho={9} dash={420} />
							</g>
						);
					})}
				</svg>
			}
		>
			<Etiqueta Ic={L.TriangleAlert} texto="LO QUE PASA" />
			<Titulo size={84}>
				Cuentas
				<br />
				<span style={{color: MORADO}}>bloqueadas</span>
			</Titulo>
			<Renglon t={at('usuarios', 8.56)} Ic={L.Users}>
				Muchos usuarios
				<br />
				en Venezuela
			</Renglon>
		</Pizarra>
	);
};

// 2) Cookies -> 1 VPN = 1 IP
const PizCookies: React.FC = () => {
	const frame = useCurrentFrame();
	const t0 = ini('cookies');
	const borrar = at('cookies', 21.2);
	const vpn = ini('unvpn');
	const pb = dibuja(frame, t0 + 0.05, 14);
	const enVpn = frame >= F(vpn);
	return (
		<Pizarra
			de={t0}
			a={fin('unvpn')}
			izquierda={
				enVpn ? (
					<div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
						<Img src={staticFile(`${W}/vpn.png`)} style={{width: 360, scale: String(entra(frame, vpn, 12)), filter: 'drop-shadow(0 16px 24px rgba(0,0,0,0.25))'}} />
					</div>
				) : (
					<svg width={470} height={520} viewBox="0 0 470 520">
						<Trazo d="M30 60 H440 Q455 60 455 75 V400 Q455 415 440 415 H30 Q15 415 15 400 V75 Q15 60 30 60 Z" p={pb} dash={1500} />
						<Trazo d="M15 120 H455" p={pb} dash={500} />
						{[
							[110, 220],
							[235, 300],
							[350, 210],
						].map(([cx, cy], i) => {
							const pc = dibuja(frame, t0 + 0.4 + i * 0.2, 10);
							const x = dibuja(frame, borrar + i * 0.1, 8);
							return (
								<g key={i}>
									<Trazo d={`M${cx},${cy} m-46,0 a46,46 0 1,0 92,0 a46,46 0 1,0 -92,0`} p={pc} dash={320} />
									{[
										[-14, -10],
										[16, 6],
										[-6, 20],
									].map(([dx, dy], j) => (
										<circle key={j} cx={cx + dx} cy={cy + dy} r={6} fill={TINTA} opacity={pc} />
									))}
									<Trazo d={`M${cx - 60},${cy - 60} L${cx + 60},${cy + 60} M${cx + 60},${cy - 60} L${cx - 60},${cy + 60}`} p={x} color={MORADO} ancho={9} dash={360} />
								</g>
							);
						})}
					</svg>
				)
			}
		>
			<Etiqueta Ic={L.ListChecks} texto="OPCIÓN 1" />
			{enVpn ? (
				<>
					<Titulo size={84}>
						1 VPN
						<br />
						<span style={{color: MORADO}}>= 1 IP</span>
					</Titulo>
					<Renglon t={at('unvpn', 25.86)} Ic={L.Shield}>
						Un solo VPN
					</Renglon>
					<Renglon t={at('unvpn', 26.9)} Ic={L.Wifi}>
						Una sola dirección IP
					</Renglon>
				</>
			) : (
				<>
					<Titulo size={84}>
						Borra las
						<br />
						<span style={{color: MORADO}}>cookies</span>
					</Titulo>
					<Renglon t={at('cookies', 22.3)} Ic={L.Globe}>
						De tu navegador
					</Renglon>
				</>
			)}
		</Pizarra>
	);
};

// 3) Proton VPN: IP fija
const PizProton: React.FC = () => {
	const frame = useCurrentFrame();
	const t0 = ini('proton');
	const ps = dibuja(frame, t0 + 0.05, 16);
	return (
		<Pizarra
			de={t0}
			a={fin('proton')}
			izquierda={
				<svg width={470} height={520} viewBox="0 0 470 520">
					<Trazo d="M235 40 L400 100 V230 Q400 360 235 450 Q70 360 70 230 V100 Z" p={ps} dash={1200} />
					<text x={235} y={290} textAnchor="middle" fontFamily={poppins} fontWeight={800} fontSize={110} fill={TINTA} opacity={ps}>
						IP
					</text>
				</svg>
			}
		>
			<Etiqueta Ic={L.ShieldCheck} texto="OPCIÓN 2" />
			<Titulo size={84}>
				IP fija con
				<br />
				<span style={{color: MORADO}}>Proton VPN</span>
			</Titulo>
		</Pizarra>
	);
};

// KILL SWITCH: la única escena sin su cara. Un teléfono con los ajustes de una app de VPN (modo
// oscuro, como una app real) donde el Kill Switch se activa cuando lo dice.
const KILL_DE = () => at('kill', 49.3);
const EscenaKill: React.FC = () => {
	const frame = useCurrentFrame();
	const a = F(KILL_DE());
	const b = F(fin('kill'));
	if (frame < a || frame >= b) return null;
	const e = interpolate(frame, [a, a + 8], [0, 1], {...clamp, easing: ease});
	const s = interpolate(frame, [b - 6, b], [0, 1], clamp);
	const on = interpolate(frame, [F(at('kill', 49.75)), F(at('kill', 49.75)) + 7], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const ip = interpolate(frame, [F(at('kill', 50.6)), F(at('kill', 50.6)) + 8], [0, 1], clamp);
	const filas: [L.LucideIcon, string, string][] = [
		[L.Globe, 'Ubicación', 'Un solo país'],
		[L.Network, 'Protocolo', 'Automático'],
		[L.Wifi, 'IP', 'Siempre la misma'],
	];
	return (
		<AbsoluteFill style={{opacity: 1 - s}}>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, #241248 0%, #0D0A1A 70%)'}} />
			<div style={{position: 'absolute', top: 250, left: 0, right: 0, textAlign: 'center', opacity: e}}>
				<span style={{fontFamily: poppins, fontWeight: 800, fontSize: 104, color: '#FFFFFF', letterSpacing: '-0.02em'}}>
					KILL <span style={{color: MORADO2}}>SWITCH</span>
				</span>
			</div>
			{/* Teléfono */}
			<div style={{position: 'absolute', left: 540 - 280, top: 420, width: 560, height: 1110, borderRadius: 76, padding: 18, background: 'linear-gradient(145deg,#2b2b2f,#0d0d10)', boxShadow: '0 40px 90px rgba(0,0,0,0.6), inset 0 0 0 3px #3a3a40', scale: String(0.9 + 0.1 * e), translate: `0px ${(1 - e) * 80}px`}}>
				<div style={{position: 'relative', width: '100%', height: '100%', borderRadius: 60, overflow: 'hidden', background: '#111113', padding: '70px 30px 30px'}}>
					<div style={{position: 'absolute', top: 18, left: '50%', translate: '-50% 0px', width: 150, height: 38, borderRadius: 19, background: '#000'}} />
					<div style={{fontFamily: helvetica, fontWeight: 700, fontSize: 58, color: '#FFFFFF', marginBottom: 6}}>Ajustes de VPN</div>
					<div style={{fontFamily: helvetica, fontSize: 32, color: '#8E8E93', marginBottom: 36}}>Conexión segura</div>
					{/* Fila Kill Switch */}
					<div style={{background: '#1C1C1E', borderRadius: 22, padding: '34px 24px', display: 'flex', alignItems: 'center', gap: 18, boxShadow: on > 0.5 ? `0 0 0 3px ${MORADO2}` : 'none'}}>
						<L.Power size={52} color={on > 0.5 ? MORADO2 : '#8E8E93'} strokeWidth={2.2} />
						<div style={{flex: 1}}>
							<div style={{fontFamily: helvetica, fontWeight: 700, fontSize: 44, color: '#FFFFFF'}}>Kill Switch</div>
							<div style={{fontFamily: helvetica, fontSize: 26, color: '#8E8E93', lineHeight: 1.2}}>Corta internet si el VPN se cae</div>
						</div>
						<div style={{width: 110, height: 64, borderRadius: 32, flexShrink: 0, background: on > 0.5 ? MORADO : '#3A3A3C', position: 'relative'}}>
							<div style={{position: 'absolute', top: 4, left: 4 + 46 * on, width: 56, height: 56, borderRadius: 28, background: '#FFFFFF'}} />
						</div>
					</div>
					<div style={{marginTop: 26, background: '#1C1C1E', borderRadius: 22, overflow: 'hidden'}}>
						{filas.map(([Ic, k, v], i) => (
							<div key={k} style={{display: 'flex', alignItems: 'center', gap: 16, padding: '30px 24px', borderTop: i ? '1px solid #2C2C2E' : 'none'}}>
								<Ic size={38} color="#8E8E93" strokeWidth={2} />
								<span style={{flex: 1, fontFamily: helvetica, fontSize: 32, color: '#FFFFFF'}}>{k}</span>
								<span style={{fontFamily: helvetica, fontSize: 28, color: i === 2 && ip > 0.5 ? MORADO2 : '#8E8E93', fontWeight: i === 2 && ip > 0.5 ? 700 : 400}}>{v}</span>
							</div>
						))}
					</div>
					<div style={{marginTop: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, opacity: ip, scale: String(0.8 + 0.2 * ip)}}>
						<L.Lock size={40} color={MORADO2} strokeWidth={2.2} />
						<span style={{fontFamily: helvetica, fontWeight: 700, fontSize: 38, color: MORADO2}}>IP protegida</span>
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};

// 4) Proxy como extensión del navegador
const PizProxy: React.FC = () => {
	const frame = useCurrentFrame();
	const t0 = ini('proxy');
	const ext = ini('extension');
	const pb = dibuja(frame, t0 + 0.05, 14);
	const pp = dibuja(frame, ext + 0.1, 14);
	return (
		<Pizarra
			de={t0}
			a={fin('extension')}
			izquierda={
				<svg width={470} height={520} viewBox="0 0 470 520">
					<Trazo d="M30 60 H440 Q455 60 455 75 V400 Q455 415 440 415 H30 Q15 415 15 400 V75 Q15 60 30 60 Z" p={pb} dash={1500} />
					<Trazo d="M15 120 H455" p={pb} dash={500} />
					{/* Pieza de rompecabezas = extensión */}
					<g transform="translate(235 270)">
						<Trazo d="M-70 -70 H-15 Q-15 -100 10 -100 Q35 -100 35 -70 H70 V-15 Q100 -15 100 10 Q100 35 70 35 V70 H-70 Z" p={pp} color={MORADO} ancho={8} dash={900} />
					</g>
				</svg>
			}
		>
			<Etiqueta Ic={L.Puzzle} texto="OPCIÓN 3" />
			<Titulo size={100}>
				Usa un
				<br />
				<span style={{color: MORADO}}>proxy</span>
			</Titulo>
			<Renglon t={at('proxy', 55.06)} Ic={L.Shield} tachado={at('proxy', 56.18)}>
				VPN
			</Renglon>
			<Renglon t={ext + 0.6} Ic={L.Puzzle}>
				Extensión del
				<br />
				navegador
			</Renglon>
		</Pizarra>
	);
};

// 5) Plan B: el familiar
const PizFamiliar: React.FC = () => (
	<Pizarra
		de={ini('familiar')}
		a={fin('cuenta')}
		izquierda={
			<div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6}}>
				<Titulo size={120}>
					Plan
					<br />
					<span style={{color: MORADO}}>B</span>
				</Titulo>
				<span style={{fontFamily: helvetica, fontSize: 32, color: GRIS, marginTop: 12}}>Si ya te bloquearon</span>
			</div>
		}
	>
		<Etiqueta Ic={L.KeyRound} texto="ALTERNATIVA" />
		<div style={{height: 10}} />
		<Renglon t={at('familiar', 77.08)} n={1}>
			Un familiar con
			<br />
			documento extranjero
		</Renglon>
		<Renglon t={at('cuenta', 80.38)} n={2}>
			Abre una
			<br />
			cuenta nueva
		</Renglon>
		<Renglon t={at('cuenta', 82.46)} n={3}>
			Te da el acceso
		</Renglon>
	</Pizarra>
);

// Logos de herramientas de IA difuminados: se intuyen apps reales, pero no se distinguen (las
// comparte Raquel por privado)
const LOGOS: [string, string, string][] = [
	['#10A37F', '#0B7A5E', 'circle'],
	['#4285F4', '#9B72CB', 'star'],
	['#FF6B35', '#F7931E', 'square'],
	['#1E1E1E', '#4B4B4B', 'tri'],
	['#00C2FF', '#0066FF', 'ring'],
	['#E83E8C', '#7B2FF7', 'circle'],
];
const LogosDifuminados: React.FC = () => {
	const frame = useCurrentFrame();
	const t0 = ini('herramientas') + 0.15;
	return (
		<div style={{position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 130px)', gap: 26, alignContent: 'center', justifyContent: 'center'}}>
			{LOGOS.map(([c1, c2, forma], i) => {
				const q = entra(frame, t0 + i * 0.12, 10);
				return (
					<div key={i} style={{width: 130, height: 130, borderRadius: 32, background: `linear-gradient(135deg, ${c1}, ${c2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', filter: 'blur(12px)', scale: String(q), boxShadow: '0 12px 26px rgba(0,0,0,0.25)'}}>
						<div style={{width: 56, height: 56, background: '#FFFFFF', borderRadius: forma === 'circle' ? 28 : forma === 'ring' ? 28 : forma === 'square' ? 10 : 4, border: forma === 'ring' ? '10px solid #FFFFFF' : 'none', ...(forma === 'ring' ? {background: 'transparent'} : {}), clipPath: forma === 'tri' ? 'polygon(50% 0, 100% 100%, 0 100%)' : forma === 'star' ? 'polygon(50% 0,61% 38%,100% 50%,61% 62%,50% 100%,39% 62%,0 50%,39% 38%)' : 'none'}} />
					</div>
				);
			})}
		</div>
	);
};

// 6) Alternativas a Claude
const PizHerramientas: React.FC = () => {
	return (
		<Pizarra
			de={ini('herramientas')}
			a={fin('flujos')}
			izquierda={
				<LogosDifuminados />
			}
		>
			<Etiqueta Ic={L.Sparkles} texto="ALTERNATIVAS" />
			<Titulo size={80}>
				IA similares
				<br />a <span style={{color: MORADO}}>Claude</span>
			</Titulo>
			<Renglon t={at('flujos', 96.16)} Ic={L.Workflow}>
				Flujos automatizados
			</Renglon>
			<Renglon t={at('flujos', 97.76)} Ic={L.Globe}>
				Páginas web
			</Renglon>
			<Renglon t={at('flujos', 98.48)} Ic={L.Code2}>
				Desarrollos y más
			</Renglon>
		</Pizarra>
	);
};

// ------------------------------------------------------------------ palabras sobre la cámara
// Líneas grandes que suben (delante o detrás según si hay recorte)
const Grande: React.FC<{readonly de: number; readonly a: number; readonly lineas: [string, number, boolean?][]; readonly top: number; readonly size: number}> = ({de, a, lineas, top, size}) => {
	const frame = useCurrentFrame();
	if (frame < F(de) || frame >= F(a)) return null;
	const out = interpolate(frame, [F(a) - 4, F(a)], [1, 0], clamp);
	return (
		<div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', opacity: out}}>
			{lineas.map(([texto, t, acento]) => {
				const q = interpolate(frame, [F(t), F(t) + 8], [0, 1], {...clamp, easing: ease});
				return (
					<div key={texto + t} style={{overflow: 'hidden', height: size * 0.98, opacity: frame >= F(t) ? 1 : 0}}>
						<div style={{fontFamily: poppins, fontWeight: 800, fontSize: size, lineHeight: 0.98, letterSpacing: '-0.02em', color: acento ? MORADO2 : '#FFFFFF', translate: `0px ${(1 - q) * 100}%`, textShadow: '0 10px 40px rgba(0,0,0,0.4)'}}>{texto}</div>
					</div>
				);
			})}
		</div>
	);
};

// Gancho: la pregunta palabra por palabra, grande, detrás de ella, con Claude 3D y la bandera
const BLOQUES: {de: number; a: number; palabras: [string, number, boolean?][]}[] = [
	{de: 0, a: 1.24, palabras: [['¿CÓMO', 0.0], ['PREVENIR', 0.38], ['QUE TE', 0.64], ['BLOQUEEN', 0.88, true]]},
	{de: 1.24, a: 2.1, palabras: [['TU CUENTA', 1.16], ['DE', 1.56], ['CLAUDE', 1.7, true]]},
	{de: 2.1, a: 99, palabras: [['SI TE', 1.86], ['ENCUENTRAS', 2.16], ['EN', 2.68], ['VENEZUELA?', 2.96, true]]},
];
const Gancho: React.FC = () => {
	const frame = useCurrentFrame();
	const fg = fin('gancho');
	if (frame >= F(fg)) return null;
	const b = BLOQUES.find((x) => frame >= F(at('gancho', x.de)) && frame < F(Math.min(fg, at('gancho', x.a))));
	if (!b) return null;
	return (
		<div style={{position: 'absolute', top: 260, left: 90, right: 90, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', columnGap: 22, rowGap: 10}}>
			{b.palabras.map(([p, s, acento]) => {
				const t = at('gancho', s);
				if (frame < F(t)) return null;
				const q = interpolate(frame, [F(t), F(t) + 6], [0, 1], {...clamp, easing: Easing.out(Easing.back(2.2))});
				const golpe = interpolate(frame, [F(t), F(t) + 4, F(t) + 9], [1.35, 0.94, 1], clamp);
				return acento ? (
					<span key={p} style={{display: 'inline-block', scale: String(golpe), opacity: q, rotate: '-2deg', padding: '4px 24px 8px', borderRadius: 18, background: MORADO, boxShadow: '0 12px 34px rgba(0,0,0,0.45)', fontFamily: poppins, fontWeight: 800, fontSize: 108, lineHeight: 1.02, letterSpacing: '-0.02em', color: '#FFFFFF'}}>
						{p}
					</span>
				) : (
					<span key={p} style={{display: 'inline-block', scale: String(0.6 + 0.4 * q), opacity: q, fontFamily: poppins, fontWeight: 800, fontSize: 92, lineHeight: 1.05, letterSpacing: '-0.02em', color: '#FFFFFF', textShadow: '0 10px 40px rgba(0,0,0,0.4)'}}>
						{p}
					</span>
				);
			})}
		</div>
	);
};
const LogosGancho: React.FC = () => {
	const frame = useCurrentFrame();
	const fg = fin('gancho');
	if (frame >= F(fg)) return null;
	const tc = at('gancho', 1.6);
	const tv = at('gancho', 2.9);
	const flota = (s: number) => Math.sin((frame - F(s)) / 10) * 8;
	const qc = entra(frame, tc, 12);
	return (
		<>
			{frame >= F(tc) ? (
				<>
					<div style={{position: 'absolute', left: -40, top: 1180, width: 520, height: 520, borderRadius: 300, background: 'radial-gradient(circle, rgba(181,123,255,0.55), rgba(181,123,255,0) 65%)', scale: String(qc)}} />
					<Img src={staticFile(`${W}/claude.png`)} style={{position: 'absolute', left: 40, top: 1260, width: 360, scale: String(qc), rotate: `${(1 - qc) * -60 + Math.sin((frame - F(tc)) / 14) * 4}deg`, translate: `0px ${flota(tc)}px`, filter: 'drop-shadow(0 24px 34px rgba(0,0,0,0.5))'}} />
				</>
			) : null}
			{frame >= F(tv) ? <Img src={staticFile(`${W}/venezuela.png`)} style={{position: 'absolute', left: 750, top: 1040, width: 230, rotate: '8deg', scale: String(entra(frame, tv, 10)), translate: `0px ${flota(tv)}px`, filter: 'drop-shadow(0 18px 26px rgba(0,0,0,0.45))'}} /> : null}
		</>
	);
};

// Antifaz (el proxy es "como una máscara"): caja morada con el icono en blanco, arriba a la derecha
const Mascara: React.FC = () => {
	const frame = useCurrentFrame();
	const t = at('mascara2', 67.14);
	if (frame < F(t) || frame >= F(fin('mascara2'))) return null;
	const q = interpolate(frame, [F(t), F(t) + 8], [0, 1], {...clamp, easing: Easing.out(Easing.back(2.2))});
	const out = interpolate(frame, [F(fin('mascara2')) - 4, F(fin('mascara2'))], [1, 0], clamp);
	return (
		<div style={{position: 'absolute', right: 80, top: 390, width: 140, height: 140, borderRadius: 32, background: MORADO, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 14px 36px rgba(0,0,0,0.45)', scale: String(q), opacity: out, rotate: `${8 + Math.sin((frame - F(t)) / 9) * 4}deg`}}>
			<L.VenetianMask size={92} color="#FFFFFF" strokeWidth={2} />
		</div>
	);
};

// Banderas dibujadas (estilo 3D con brillo)
const Bandera: React.FC<{readonly pais: string; readonly ancho?: number}> = ({pais, ancho = 200}) => {
	const alto = ancho * 0.66;
	let cont: React.ReactNode = null;
	if (pais === 'TOKIO') {
		cont = (
			<>
				<rect width={300} height={200} fill="#FFFFFF" />
				<circle cx={150} cy={100} r={60} fill="#BC002D" />
			</>
		);
	} else if (pais === 'EE. UU.') {
		cont = (
			<>
				{Array.from({length: 13}).map((_, i) => (
					<rect key={i} y={(i * 200) / 13} width={300} height={200 / 13} fill={i % 2 ? '#FFFFFF' : '#B22234'} />
				))}
				<rect width={130} height={108} fill="#3C3B6E" />
				{Array.from({length: 20}).map((_, i) => (
					<circle key={i} cx={14 + (i % 5) * 25} cy={14 + Math.floor(i / 5) * 25} r={5} fill="#FFFFFF" />
				))}
			</>
		);
	} else {
		cont = (
			<>
				<rect width={300} height={100} fill="#EF3340" />
				<rect y={100} width={300} height={100} fill="#FFFFFF" />
				<circle cx={70} cy={50} r={32} fill="#FFFFFF" />
				<circle cx={84} cy={50} r={30} fill="#EF3340" />
				{[0, 1, 2, 3, 4].map((i) => (
					<circle key={i} cx={112 + 18 * Math.cos((i / 5) * Math.PI * 2 - Math.PI / 2)} cy={50 + 18 * Math.sin((i / 5) * Math.PI * 2 - Math.PI / 2)} r={5} fill="#FFFFFF" />
				))}
			</>
		);
	}
	return (
		<svg width={ancho} height={alto} viewBox="0 0 300 200" style={{borderRadius: ancho * 0.08, overflow: 'hidden', boxShadow: '0 16px 30px rgba(0,0,0,0.45)'}}>
			<defs>
				<linearGradient id="brillo" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#FFFFFF" stopOpacity={0.45} />
					<stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0} />
					<stop offset="1" stopColor="#000000" stopOpacity={0.22} />
				</linearGradient>
			</defs>
			{cont}
			<rect width={300} height={200} fill="url(#brillo)" />
		</svg>
	);
};

// Tokio -> EE. UU. -> Singapur, rápido y justo cuando lo dice (encima de la cabeza), con banderas
const Paises: React.FC = () => {
	const frame = useCurrentFrame();
	if (frame < F(ini('tokio')) || frame >= F(fin('eeuu'))) return null;
	const items: [string, string, number][] = [
		['AYER', 'TOKIO', at('tokio', 31.08)],
		['HOY', 'EE. UU.', at('eeuu', 32.56)],
		['MAÑANA', 'SINGAPUR', at('eeuu', 33.7)],
	];
	const actual = [...items].reverse().find(([, , t]) => frame >= F(t) - 3);
	const previo = frame < F(items[0][2]) - 3;
	return (
		<div style={{position: 'absolute', top: 260, left: 60, right: 60, textAlign: 'center'}}>
			{previo ? (
				<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 100, lineHeight: 1.02, color: '#FFFFFF', textShadow: '0 10px 40px rgba(0,0,0,0.45)', opacity: interpolate(frame, [F(ini('tokio')), F(ini('tokio')) + 6], [0, 1], clamp)}}>
					NO CAMBIES
					<br />
					<span style={{display: 'inline-block', marginTop: 8, padding: '0 22px 6px', borderRadius: 16, background: MORADO}}>DE PAÍS</span>
				</div>
			) : actual ? (
				<div key={actual[1]} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 26, scale: String(interpolate(frame, [F(actual[2]) - 3, F(actual[2]) + 4], [1.4, 1], {...clamp, easing: Easing.out(Easing.cubic)}))}}>
					<Bandera pais={actual[1]} ancho={190} />
					<div style={{textAlign: 'left'}}>
						<div style={{fontFamily: helvetica, fontWeight: 700, fontSize: 32, letterSpacing: '0.35em', color: '#FFFFFF', textShadow: '0 2px 14px rgba(0,0,0,0.6)'}}>{actual[0]}</div>
						<div style={{fontFamily: poppins, fontWeight: 800, fontSize: 108, lineHeight: 1, color: '#FFFFFF', textShadow: '0 10px 40px rgba(0,0,0,0.45)'}}>{actual[1]}</div>
					</div>
				</div>
			) : null}
		</div>
	);
};

// Comentario que se escribe solo (CTA)
const Cta: React.FC = () => {
	const frame = useCurrentFrame();
	const a = ini('cta');
	if (frame < F(a)) return null;
	const ia = at('cta', 100.94);
	const q = entra(frame, at('cta', 100.0));
	const letras = frame >= F(ia) ? Math.min(2, Math.floor((frame - F(ia)) / 4) + 1) : 0;
	const enviado = frame >= F(ia) + 14;
	return (
		<>
			<div style={{position: 'absolute', top: 1400, left: 90, right: 90, scale: String(q)}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 18, background: '#FFFFFF', borderRadius: 999, padding: '12px 14px', boxShadow: '0 14px 36px rgba(0,0,0,0.35)'}}>
					<div style={{width: 58, height: 58, borderRadius: 29, background: `linear-gradient(135deg, ${MORADO2}, ${MORADO})`}} />
					<div style={{flex: 1, fontFamily: helvetica, fontSize: 40, fontWeight: 700, color: TINTA}}>
						{'IA'.slice(0, letras)}
						{!enviado && frame % 14 < 7 ? <span style={{color: MORADO}}>|</span> : null}
					</div>
					<div style={{width: 64, height: 64, borderRadius: 32, background: MORADO, display: 'flex', alignItems: 'center', justifyContent: 'center', scale: String(enviado ? interpolate(frame, [F(ia) + 14, F(ia) + 20], [1.25, 1], clamp) : 1)}}>
						<L.ArrowUp size={36} color="#FFFFFF" strokeWidth={3} />
					</div>
				</div>
			</div>
		</>
	);
};

// Persona recortada (texto DETRÁS): gancho, baneo, ya te bloquearon, comenta
const RECORTES = ['gancho', 'baneo', 'bloquearon', 'cta'];
const Persona: React.FC = () => {
	const frame = useCurrentFrame();
	const id = RECORTES.find((r) => frame >= F(ini(r)) && frame < F(fin(r)));
	if (!id) return null;
	const n = F(fin(id)) - F(ini(id));
	const k = Math.min(frame - F(ini(id)), n - 2);
	return <Img src={staticFile(`${W}/persona-${id}/${String(k).padStart(4, '0')}.webp`)} style={{position: 'absolute', width: '100%', height: '100%'}} />;
};

// Encuadre: mini golpe de zoom al cambiar de toma; en pantalla dividida baja bajo la pizarra
const useToma = () => {
	const frame = useCurrentFrame();
	const t = frame / FPS;
	const p = piezaEn(t);
	const k = frame - F(p.t);
	const golpe = interpolate(k, [0, 8], [1.035, 1], {...clamp, easing: ease});
	const piz = pizarraEn(t);
	let bajar = 0;
	if (piz) {
		const a = F(ini(piz[0]));
		const b = F(fin(piz[1]));
		bajar = BAJAR * Math.min(interpolate(frame, [a, a + 10], [0, 1], {...clamp, easing: ease}), interpolate(frame, [b - 8, b], [1, 0], {...clamp, easing: Easing.in(Easing.cubic)}));
	}
	return {transformOrigin: '540px 760px', scale: String(piz ? 1 : golpe), translate: `0px ${bajar}px`} as React.CSSProperties;
};

const Destellos: React.FC = () => {
	const frame = useCurrentFrame();
	const cambios = TRAMOS.filter((p, i) => i > 0 && p.zoom !== TRAMOS[i - 1].zoom).map((p) => F(p.t));
	const o = Math.max(0, ...cambios.map((c) => interpolate(frame, [c - 1, c + 1, c + 7], [0, 0.26, 0], clamp)));
	return o > 0 ? <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, rgba(181,123,255,0.9), rgba(139,92,246,0) 70%)', opacity: o, mixBlendMode: 'screen'}} /> : null;
};

const Sfx: React.FC<{readonly t: number; readonly src: string; readonly volume?: number}> = ({t, src, volume = 0.3}) => (
	<Sequence from={Math.max(0, F(t))} durationInFrames={3 * FPS}>
		<Audio src={staticFile(`sfx/${src}.wav`)} volume={volume} />
	</Sequence>
);

export const KillSwitch2Component: React.FC = () => {
	const frame = useCurrentFrame();
	const toma = useToma();
	const finOp = interpolate(frame, [F(DURACION) - 10, F(DURACION)], [1, 0], clamp);
	const conPersona = RECORTES.some((r) => frame >= F(ini(r)) && frame < F(fin(r)));
	const sinPizarra = !pizarraEn(frame / FPS);
	return (
		<AbsoluteFill style={{background: '#0D0A1A'}}>
			<AbsoluteFill style={{opacity: finOp}}>
				<AbsoluteFill style={toma}>
					<Video src={staticFile(`${W}/base.mp4`)} style={{position: 'absolute', width: '100%', height: '100%'}} />
				</AbsoluteFill>
				<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0) 32%)', opacity: sinPizarra ? 1 : 0}} />
				<Destellos />

				{/* ---------- Detrás de ella ---------- */}
				<Gancho />
				<Grande de={ini('baneo')} a={at('baneo', 37.98)} lineas={[['ACTIVIDAD', at('baneo', 36.76)], ['INUSUAL', at('baneo', 37.12), true]]} top={290} size={136} />
				<Grande de={at('baneo', 37.98)} a={fin('baneo')} lineas={[['BANEO', at('baneo', 37.98), true]]} top={300} size={210} />
				<Grande de={ini('bloquearon')} a={fin('bloquearon')} lineas={[['¿YA TE', at('bloquearon', 72.18)], ['BLOQUEARON?', at('bloquearon', 72.42), true]]} top={300} size={124} />
				<Grande de={ini('cta')} a={DURACION} lineas={[['COMENTA', ini('cta')], ['"IA"', at('cta', 100.94)]]} top={250} size={150} />
				{conPersona ? (
					<AbsoluteFill style={toma}>
						<Persona />
					</AbsoluteFill>
				) : null}

				{/* ---------- Delante (encima de la cabeza) ---------- */}
				<LogosGancho />
				<Grande de={ini('prevenir')} a={fin('prevenir')} lineas={[['¿CÓMO', ini('prevenir')], ['PREVENIRLO?', ini('prevenir') + 0.3, true]]} top={260} size={112} />
				<Paises />
				<Grande de={ini('mascara1')} a={fin('mascara2')} lineas={[['COMO UNA', at('mascara2', 66.66)], ['MÁSCARA', at('mascara2', 67.14), true]]} top={280} size={120} />
				<Grande de={ini('sinfamiliar1')} a={at('solucion', 89.66)} lineas={[['¿SIN', at('sinfamiliar2', 86.14)], ['FAMILIAR?', at('sinfamiliar2', 86.8), true]]} top={280} size={124} />
				<Grande de={at('solucion', 89.66)} a={fin('solucion')} lineas={[['TODO TIENE', at('solucion', 89.66)], ['SOLUCIÓN', at('solucion', 90.2), true]]} top={280} size={118} />
				<Grande de={ini('respaldo')} a={at('pierdas', 110.9)} lineas={[['HAZ UN', at('respaldo', 107.88)], ['RESPALDO', at('respaldo', 108.6), true]]} top={280} size={124} />
				<Grande de={at('pierdas', 110.9)} a={fin('pierdas')} lineas={[['NO LO', at('pierdas', 110.9)], ['PIERDAS TODO', at('pierdas', 112.92), true]]} top={280} size={112} />
				<Cta />

				{/* ---------- Pizarras ---------- */}
				<PizUsuarios />
				<PizCookies />
				<PizProton />
				<Mascara />
				<PizProxy />
				<PizFamiliar />
				<PizHerramientas />
				<EscenaKill />
			</AbsoluteFill>

			{/* ---------- Efectos de sonido (sin música; el gancho va sin efectos) ---------- */}
			{PIZARRAS.map(([a]) => (
				<Sfx key={`e-${a}`} t={ini(a) - 0.08} src="whoosh" volume={0.3} />
			))}
			{PIZARRAS.map(([, b]) => (
				<Sfx key={`s-${b}`} t={fin(b) - 0.25} src="whoosh-corto" volume={0.22} />
			))}
			<Sfx t={at('usuarios', 9.6)} src="tic" volume={0.3} />
			<Sfx t={at('cookies', 21.2)} src="tic" volume={0.3} />
			<Sfx t={ini('unvpn')} src="pop" volume={0.26} />
			<Sfx t={at('unvpn', 25.86)} src="pop" volume={0.22} />
			<Sfx t={at('unvpn', 26.9)} src="pop" volume={0.22} />
			<Sfx t={at('tokio', 31.08)} src="whoosh-2" volume={0.28} />
			<Sfx t={at('eeuu', 32.56)} src="whoosh-3" volume={0.28} />
			<Sfx t={at('eeuu', 33.7)} src="whoosh-2" volume={0.28} />
			<Sfx t={at('baneo', 37.98)} src="impacto" volume={0.32} />
			<Sfx t={KILL_DE() - 0.08} src="whoosh" volume={0.3} />
			<Sfx t={at('kill', 49.75)} src="remotion/switch" volume={0.4} />
			<Sfx t={at('kill', 50.6)} src="tic" volume={0.28} />
			<Sfx t={at('proxy', 56.18)} src="tic" volume={0.28} />
			<Sfx t={ini('extension') + 0.6} src="pop" volume={0.22} />
			<Sfx t={at('mascara2', 67.14)} src="pop" volume={0.24} />
			<Sfx t={at('familiar', 77.08)} src="pop" volume={0.22} />
			<Sfx t={at('cuenta', 80.38)} src="pop" volume={0.22} />
			<Sfx t={at('cuenta', 82.46)} src="pop" volume={0.22} />
			<Sfx t={at('solucion', 90.2)} src="brillo" volume={0.24} />
			<Sfx t={at('flujos', 96.16)} src="pop" volume={0.22} />
			<Sfx t={at('flujos', 97.76)} src="pop" volume={0.22} />
			<Sfx t={at('flujos', 98.48)} src="pop" volume={0.22} />
			<Sfx t={at('respaldo', 108.6)} src="tic" volume={0.26} />
			<Sfx t={at('cta', 100.94)} src="impacto" volume={0.28} />
			<Sfx t={at('cta', 100.94) + 0.15} src="teclado-iphone" volume={0.24} />
			<Sfx t={at('cta', 100.94) + 0.5} src="remotion/snapchat-notification" volume={0.26} />
		</AbsoluteFill>
	);
};

export const KillSwitch2Composition: React.FC = () => (
	<Composition id="ClaudeKillSwitchV2" component={KillSwitch2Component} durationInFrames={marcas.frames} fps={FPS} width={1080} height={1920} />
);
