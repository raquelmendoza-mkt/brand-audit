// Íconos del editor: emojis 3D (Microsoft Fluent, MIT), íconos de Phosphor en placas con estilo
// (vidrio, dorado, sólido, neón, emoji) e íconos de Lucide que se DIBUJAN trazo a trazo.
// Tiempos en segundos del reel. Ficha de uso: .claude/skills/editor-video/kit.md (sección Íconos).
import * as P from '@phosphor-icons/react/dist/ssr';
import type {Icon as PhosphorIcon} from '@phosphor-icons/react';
import * as L from 'lucide-react';
import {Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import emojis from '../emoji3d-lista.json';
import {clamp, ease} from './Kit';

const useVentana = (from: number, to: number) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const a = Math.round(from * fps);
	const b = Math.round(to * fps);
	return {frame, fps, a, b, k: frame - a, visible: frame >= a && frame < b, out: interpolate(frame, [b - 6, b], [1, 0], clamp)};
};

export type EntradaIcono = 'rebote' | 'giro' | 'caida' | 'zoom' | 'desenfoque';

const entrada = (tipo: EntradaIcono, k: number): React.CSSProperties => {
	const back = Easing.out(Easing.back(2.4));
	switch (tipo) {
		case 'rebote':
			return {scale: String(interpolate(k, [0, 12], [0, 1], {...clamp, easing: back}))};
		case 'giro':
			return {scale: String(interpolate(k, [0, 12], [0, 1], {...clamp, easing: back})), rotate: `${interpolate(k, [0, 14], [-120, 0], {...clamp, easing: ease})}deg`};
		case 'caida':
			return {translate: `0px ${interpolate(k, [0, 12], [-260, 0], {...clamp, easing: Easing.out(Easing.bounce)})}px`, opacity: interpolate(k, [0, 4], [0, 1], clamp)};
		case 'zoom':
			return {scale: String(interpolate(k, [0, 10], [2.2, 1], {...clamp, easing: ease})), opacity: interpolate(k, [0, 5], [0, 1], clamp)};
		default:
			return {opacity: interpolate(k, [0, 10], [0, 1], clamp), filter: `blur(${interpolate(k, [0, 10], [14, 0], clamp)}px)`};
	}
};

// Flotación suave continua (le da "vida" al ícono mientras está en pantalla)
const flotar = (k: number, fuerza = 1) => ({
	translate: `0px ${Math.sin(k / 11) * 8 * fuerza}px`,
	rotate: `${Math.sin(k / 17) * 4 * fuerza}deg`,
});

// ---------------------------------------------------------------------------
// Emoji 3D
// ---------------------------------------------------------------------------
export type NombreEmoji = keyof typeof emojis;

/** Emoji 3D con entrada y flotación. Claves en src/emoji3d-lista.json (casa, llave, dinero, fuego...). */
export const Emoji3D: React.FC<{
	readonly nombre: NombreEmoji;
	readonly from: number;
	readonly to: number;
	readonly x: number; // centro
	readonly y: number;
	readonly tam?: number;
	readonly entrada?: EntradaIcono;
	readonly sombra?: boolean;
	readonly flota?: boolean;
}> = ({nombre, from, to, x, y, tam = 180, entrada: tipo = 'rebote', sombra = true, flota = true}) => {
	const {visible, k, out} = useVentana(from, to);
	if (!visible) return null;
	return (
		<div style={{position: 'absolute', left: x - tam / 2, top: y - tam / 2, width: tam, height: tam, opacity: out, ...entrada(tipo, k)}}>
			<div style={{width: '100%', height: '100%', ...(flota ? flotar(k) : {})}}>
				<Img
					src={staticFile(emojis[nombre])}
					style={{width: '100%', height: '100%', objectFit: 'contain', filter: sombra ? 'drop-shadow(0 18px 24px rgba(0,0,0,0.35))' : undefined}}
				/>
			</div>
		</div>
	);
};

// ---------------------------------------------------------------------------
// Íconos de línea / sólidos (Phosphor) en placas con estilo
// ---------------------------------------------------------------------------
/** Mapa en español -> ícono de Phosphor (el más usado en inmobiliaria y marketing). */
export const ICONOS = {
	cama: P.Bed, bano: P.Bathtub, ducha: P.Shower, inodoro: P.Toilet, area: P.Ruler, parqueadero: P.Car, garaje: P.Garage,
	ascensor: P.Elevator, escaleras: P.Stairs, piscina: P.SwimmingPool, gimnasio: P.Barbell, parque: P.Park, arbol: P.Tree,
	mascotas: P.Dog, llave: P.Key, cerradura: P.LockKey, huella: P.Fingerprint, seguridad: P.ShieldCheck, camara: P.VideoCamera,
	ubicacion: P.MapPin, brujula: P.Compass, edificio: P.Buildings, casa: P.House, local: P.Storefront, puerta: P.Door,
	sala: P.Couch, sillon: P.Armchair, cocina: P.CookingPot, cafe: P.Coffee, aire: P.Snowflake, ventilador: P.Fan,
	tv: P.Television, lavadora: P.WashingMachine, deposito: P.Package, sol: P.Sun, vista: P.Mountains, viento: P.Wind,
	energia: P.Lightning, solar: P.SolarPanel, agua: P.Drop, temperatura: P.Thermometer, clinica: P.Hospital, planta: P.Plant,
	bici: P.Bicycle, bus: P.Bus, avion: P.Airplane,
	calendario: P.CalendarCheck, dinero: P.CurrencyDollar, billetes: P.Money, monedas: P.Coins, ahorro: P.PiggyBank,
	porcentaje: P.Percent, grafica: P.ChartLineUp, etiqueta: P.Tag, regalo: P.Gift, trato: P.Handshake, objetivo: P.Target,
	cohete: P.Rocket, idea: P.Lightbulb, megafono: P.Megaphone, campana: P.Bell, ia: P.Robot, cerebro: P.Brain,
	telefono: P.Phone, whatsapp: P.WhatsappLogo, instagram: P.InstagramLogo, tiktok: P.TiktokLogo, facebook: P.FacebookLogo,
	youtube: P.YoutubeLogo, correo: P.Envelope, chat: P.ChatCircleDots, corazon: P.Heart, estrella: P.Star, check: P.CheckCircle,
	equis: P.X, alerta: P.Warning, chispa: P.Sparkle, fuego: P.Fire, corona: P.Crown, diamante: P.Diamond, trofeo: P.Trophy,
	medalla: P.Medal, verificado: P.SealCheck, play: P.Play, guardar: P.BookmarkSimple, compartir: P.ShareFat, like: P.ThumbsUp,
	usuario: P.UserCircle, usuarios: P.Users, cursor: P.CursorClick, mano: P.HandPointing, flecha: P.ArrowRight, escanear: P.Scan,
} satisfies Record<string, PhosphorIcon>;
export type NombreIcono = keyof typeof ICONOS;

export type EstiloPlaca = 'vidrio' | 'dorado' | 'solido' | 'neon' | 'emoji' | 'simple';

const PLACAS: Record<EstiloPlaca, {fondo: string; borde?: string; sombra: string; color: string; peso: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'}> = {
	// Vidrio esmerilado: sobre fotos/video (lujo, minimal)
	vidrio: {fondo: 'rgba(255,255,255,0.16)', borde: '1.5px solid rgba(255,255,255,0.55)', sombra: '0 14px 36px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.5)', color: '#FFFFFF', peso: 'light'},
	// Dorado champán (lujo)
	dorado: {fondo: 'linear-gradient(135deg, #F6DFA8, #D9B36A 55%, #B98E43)', sombra: '0 14px 34px rgba(0,0,0,0.32), inset 0 2px 6px rgba(255,255,255,0.45)', color: '#111418', peso: 'regular'},
	// Sólido de marca (dinámico)
	solido: {fondo: 'linear-gradient(160deg, #3A86FF, #1C6BEA)', sombra: '0 14px 34px rgba(28,107,234,0.45), inset 0 2px 6px rgba(255,255,255,0.35)', color: '#FFFFFF', peso: 'fill'},
	// Neón (moderno / IA / noche)
	neon: {fondo: 'rgba(10,12,20,0.75)', borde: '2px solid #2EE6D6', sombra: '0 0 24px rgba(46,230,214,0.75), 0 0 60px rgba(46,230,214,0.35), inset 0 0 18px rgba(46,230,214,0.25)', color: '#2EE6D6', peso: 'duotone'},
	// Tipo emoji de WhatsApp: círculo brillante con relieve
	emoji: {fondo: 'radial-gradient(circle at 32% 28%, #7CC4FF, #1C6BEA 72%)', borde: '5px solid rgba(255,255,255,0.95)', sombra: '0 16px 36px rgba(0,0,0,0.32), inset 0 -8px 18px rgba(0,0,0,0.18), inset 0 6px 14px rgba(255,255,255,0.45)', color: '#FFFFFF', peso: 'fill'},
	// Sin placa: solo el ícono con sombra
	simple: {fondo: 'transparent', sombra: 'none', color: '#FFFFFF', peso: 'light'},
};

/**
 * Ícono en placa redonda. `fondo`/`color` permiten cambiar el color de marca
 * (p. ej. estilo 'emoji' con fondo `radial-gradient(circle at 32% 28%, #F7A8D8, #B05BE0 72%)`).
 */
export const Icono: React.FC<{
	readonly nombre: NombreIcono;
	readonly from: number;
	readonly to: number;
	readonly x: number;
	readonly y: number;
	readonly tam?: number;
	readonly estilo?: EstiloPlaca;
	readonly entrada?: EntradaIcono;
	readonly fondo?: string;
	readonly color?: string;
	readonly flota?: boolean;
	readonly pulso?: boolean; // anillo que late (para llamar la atención: CTA, ubicación)
}> = ({nombre, from, to, x, y, tam = 150, estilo = 'vidrio', entrada: tipo = 'rebote', fondo, color, flota = true, pulso = false}) => {
	const {visible, k, out} = useVentana(from, to);
	if (!visible) return null;
	const pl = PLACAS[estilo];
	const Ic = ICONOS[nombre];
	const anillo = (k % 40) / 40;
	return (
		<div style={{position: 'absolute', left: x - tam / 2, top: y - tam / 2, width: tam, height: tam, opacity: out, ...entrada(tipo, k)}}>
			{pulso ? (
				<div style={{position: 'absolute', inset: -anillo * tam * 0.45, borderRadius: 999, border: `3px solid ${color ?? pl.color}`, opacity: (1 - anillo) * 0.7}} />
			) : null}
			<div
				style={{
					width: '100%',
					height: '100%',
					borderRadius: 999,
					background: fondo ?? pl.fondo,
					border: pl.borde,
					boxShadow: pl.sombra,
					backdropFilter: estilo === 'vidrio' ? 'blur(14px) saturate(1.3)' : undefined,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					...(flota ? flotar(k, 0.6) : {}),
				}}
			>
				<Ic size={tam * (estilo === 'simple' ? 0.9 : 0.52)} color={color ?? pl.color} weight={pl.peso} style={estilo === 'simple' ? {filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.45))'} : undefined} />
				{estilo === 'emoji' || estilo === 'dorado' ? (
					<div style={{position: 'absolute', left: tam * 0.18, top: tam * 0.1, width: tam * 0.34, height: tam * 0.17, borderRadius: 999, background: 'rgba(255,255,255,0.35)', rotate: '-25deg'}} />
				) : null}
			</div>
		</div>
	);
};

// ---------------------------------------------------------------------------
// Íconos que se dibujan (Lucide, trazo)
// ---------------------------------------------------------------------------
export const ICONOS_LINEA = {
	cama: L.BedDouble, bano: L.Bath, ducha: L.ShowerHead, area: L.Maximize2, regla: L.Ruler, carro: L.Car, llave: L.KeyRound,
	ubicacion: L.MapPin, casa: L.House, sofa: L.Sofa, aire: L.Snowflake, tv: L.Tv, camara: L.Camera, seguridad: L.ShieldCheck,
	cctv: L.Cctv, chispas: L.Sparkles, calendario: L.CalendarCheck, grafica: L.TrendingUp, telefono: L.Phone, chat: L.MessageCircle,
	corazon: L.Heart, estrella: L.Star, check: L.Check, flecha: L.ArrowRight, clic: L.MousePointerClick, corona: L.Crown,
	diamante: L.Gem, arboles: L.Trees, sol: L.Sun, rayo: L.Zap, candado: L.Lock, lavadora: L.WashingMachine, caja: L.Package,
	cocina: L.CookingPot, cafe: L.Coffee, sillon: L.Armchair, puerta: L.DoorOpen, gimnasio: L.Dumbbell, tienda: L.Store,
	porcentaje: L.Percent, monedas: L.HandCoins, ahorro: L.PiggyBank, objetivo: L.Target, cohete: L.Rocket, idea: L.Lightbulb,
	megafono: L.Megaphone, campana: L.Bell, regalo: L.Gift, capas: L.Layers,
} as const;
export type NombreIconoLinea = keyof typeof ICONOS_LINEA;

/** Ícono de línea que se dibuja trazo a trazo y luego se rellena de brillo (lujo, minimal, explicativo). */
export const IconoDibujado: React.FC<{
	readonly nombre: NombreIconoLinea;
	readonly from: number;
	readonly to: number;
	readonly x: number;
	readonly y: number;
	readonly tam?: number;
	readonly color?: string;
	readonly grosor?: number;
	readonly segundos?: number;
}> = ({nombre, from, to, x, y, tam = 140, color = '#D9B36A', grosor = 1.4, segundos = 0.9}) => {
	const {visible, k, fps, out} = useVentana(from, to);
	if (!visible) return null;
	const Ic = ICONOS_LINEA[nombre];
	const p = interpolate(k, [0, segundos * fps], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const brillo = interpolate(k, [segundos * fps, segundos * fps + 8, segundos * fps + 20], [0, 1, 0.35], clamp);
	const id = `dib-${nombre}-${Math.round(from * 100)}`;
	return (
		<div className={id} style={{position: 'absolute', left: x - tam / 2, top: y - tam / 2, width: tam, height: tam, opacity: out}}>
			<style>{`.${id} svg * { stroke-dasharray: 90; stroke-dashoffset: ${90 * (1 - p)}; }`}</style>
			<Ic size={tam} color={color} strokeWidth={grosor} style={{filter: `drop-shadow(0 0 ${brillo * 14}px ${color}) drop-shadow(0 4px 10px rgba(0,0,0,0.4))`}} />
		</div>
	);
};

// ---------------------------------------------------------------------------
// Fila de íconos con texto (especificaciones: 3 hab · 2 baños · 100 m²)
// ---------------------------------------------------------------------------
export const FilaIconos: React.FC<{
	readonly from: number;
	readonly to: number;
	readonly y: number;
	readonly items: {readonly icono: NombreIcono; readonly texto: string}[];
	readonly estilo?: EstiloPlaca;
	readonly fuente?: string;
	readonly colorTexto?: string;
	readonly escalonado?: number; // segundos entre cada ítem
}> = ({from, to, y, items, estilo = 'vidrio', fuente = 'Montserrat, Arial, sans-serif', colorTexto = '#FFFFFF', escalonado = 0.18}) => {
	const {fps} = useVideoConfig();
	const frame = useCurrentFrame();
	const ancho = 1080 / items.length;
	return (
		<>
			{items.map((it, i) => {
				const t0 = from + i * escalonado;
				const k = frame - Math.round(t0 * fps);
				const o = interpolate(k, [4, 14], [0, 1], clamp) * interpolate(frame, [Math.round(to * fps) - 6, Math.round(to * fps)], [1, 0], clamp);
				return (
					<div key={i}>
						<Icono nombre={it.icono} from={t0} to={to} x={ancho * (i + 0.5)} y={y} tam={130} estilo={estilo} />
						{frame >= Math.round(t0 * fps) && frame < Math.round(to * fps) ? (
							<div style={{position: 'absolute', top: y + 90, left: ancho * i, width: ancho, textAlign: 'center', fontFamily: fuente, fontWeight: 600, fontSize: 38, color: colorTexto, opacity: o, textShadow: '0 2px 12px rgba(0,0,0,0.55)'}}>
								{it.texto}
							</div>
						) : null}
					</div>
				);
			})}
		</>
	);
};
