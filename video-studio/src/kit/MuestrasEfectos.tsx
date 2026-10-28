// Muestras de íconos y efectos: still "Iconos" (todas las placas y emojis 3D) y "EfectosDemo" (10 s).
import {Video} from '@remotion/media';
import {AbsoluteFill, Composition, Img, Sequence, Still, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {WhatsappLogo} from '@phosphor-icons/react/dist/ssr';
import {FUENTES} from '../fonts';
import {BarraProgreso, Celular, Comentario, LuzOrganica, Notificacion, Resaltador, sacudida, SubtitulosKaraoke, TextoCinetico, TrazoMano, type EstiloSubtitulo, type Palabra} from './Efectos';
import {Emoji3D, FilaIconos, Icono, IconoDibujado, type EstiloPlaca, type NombreEmoji, type NombreIcono} from './Iconos';
import {Degradados, Grano, Vineta} from './Kit';

const ESTILOS: EstiloPlaca[] = ['vidrio', 'dorado', 'solido', 'neon', 'emoji', 'simple'];
const MUESTRA: NombreIcono[] = ['cama', 'bano', 'area', 'parqueadero', 'piscina', 'seguridad'];
const EMOJIS: NombreEmoji[] = ['casa', 'llave', 'dinero', 'fuego', 'chispas', 'cohete', 'diamante', 'calendario', 'ubicacion', 'check', 'corazon', 'fiesta'];

const Lamina: React.FC = () => (
	<AbsoluteFill style={{background: 'linear-gradient(160deg,#5b6b82,#1b2230)'}}>
		<div style={{position: 'absolute', top: 70, left: 70, fontFamily: FUENTES.montserrat, fontSize: 28, letterSpacing: '0.4em', color: '#D9B36A'}}>ÍCONOS DEL EDITOR</div>
		{ESTILOS.map((e, r) => (
			<div key={e}>
				<div style={{position: 'absolute', top: 150 + r * 210, left: 70, fontFamily: FUENTES.montserrat, fontSize: 24, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.6)'}}>{e.toUpperCase()}</div>
				{MUESTRA.map((n, c) => (
					<Icono key={n} nombre={n} from={-20} to={99} x={140 + c * 160} y={270 + r * 210} tam={120} estilo={e} flota={false} entrada="desenfoque" />
				))}
			</div>
		))}
		<div style={{position: 'absolute', top: 1420, left: 70, fontFamily: FUENTES.montserrat, fontSize: 24, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.6)'}}>EMOJIS 3D (84)</div>
		{EMOJIS.map((n, i) => (
			<Emoji3D key={n} nombre={n} from={-20} to={99} x={140 + (i % 6) * 160} y={1560 + Math.floor(i / 6) * 170} tam={130} flota={false} entrada="desenfoque" />
		))}
	</AbsoluteFill>
);

// Palabras de ejemplo para los subtítulos karaoke (tiempos en segundos del reel)
const FRASE = 'Este apartamento tiene 100 metros y vista a la montaña'.split(' ');
const PALABRAS: Palabra[] = FRASE.map((t, i) => ({texto: t, ini: 6.2 + i * 0.33, fin: 6.2 + i * 0.33 + 0.3}));

const Demo: React.FC<{readonly subtitulos: EstiloSubtitulo}> = ({subtitulos}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const style: React.CSSProperties = {position: 'absolute', width: '100%', height: '100%', objectFit: 'cover'};
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<AbsoluteFill style={sacudida(frame, fps, 3, 22)}>
				<Sequence durationInFrames={3 * fps}>
					<Video src={staticFile('work/felipe/omni/3-sala.mp4')} muted style={style} />
				</Sequence>
				<Sequence from={3 * fps} durationInFrames={3 * fps}>
					<Img src={staticFile('work/felipe/fotos/f21.jpg')} style={style} />
				</Sequence>
				<Sequence from={6 * fps} durationInFrames={4 * fps}>
					<AbsoluteFill style={{background: 'linear-gradient(160deg,#1C6BEA,#0B2A5B)'}} />
				</Sequence>
			</AbsoluteFill>
			<Degradados />

			{/* 0-3 s: gancho cinético + emojis 3D */}
			<TextoCinetico from={0.15} to={2.9} texto="Este apartamento lo cambia todo" y={330} destacar={['todo']} />
			<Emoji3D nombre="casa" from={0.9} to={2.9} x={250} y={1150} tam={220} entrada="caida" />
			<Emoji3D nombre="llave" from={1.2} to={2.9} x={830} y={1080} tam={190} entrada="giro" />

			{/* 3-6 s: especificaciones con íconos + marcas a mano */}
			<FilaIconos from={3.2} to={5.9} y={1180} items={[{icono: 'cama', texto: '3 hab'}, {icono: 'bano', texto: '2 baños'}, {icono: 'area', texto: '100 m²'}]} estilo="vidrio" />
			<Resaltador from={3.5} to={5.9} x={130} y={420} ancho={820} alto={90} color="rgba(217,179,106,0.55)" />
			<div style={{position: 'absolute', top: 360, left: 0, right: 0, textAlign: 'center', fontFamily: FUENTES.cormorant, fontSize: 130, fontWeight: 600, color: '#fff', textShadow: '0 4px 20px rgba(0,0,0,.45)', opacity: frame >= 3.4 * fps && frame < 6 * fps ? 1 : 0}}>$695.000.000</div>
			<TrazoMano tipo="circulo" from={3.8} to={5.9} x={60} y={300} ancho={960} color="#F3D79A" grosor={7} />
			<IconoDibujado nombre="diamante" from={3.4} to={5.9} x={540} y={720} tam={130} />

			{/* 6-10 s: interfaz de redes */}
			<Sequence from={6 * fps} durationInFrames={4 * fps}>
				<Celular x={540} y={900} ancho={560} rotar={-4}>
					<Video src={staticFile('work/felipe/omni/7-bano.mp4')} muted style={style} />
				</Celular>
			</Sequence>
			<Notificacion from={6.3} to={9.6} app="WhatsApp" titulo="Nuevo cliente" texto="¡Quiero agendar una visita!" icono={<WhatsappLogo size={62} color="#fff" weight="fill" />} />
			<Comentario from={7.0} to={9.8} usuario="ana.gomez" texto="VIÑEDO 🙌" y={1560} />
			<SubtitulosKaraoke palabras={PALABRAS} estilo={subtitulos} y={1720} claves={['100']} />
			<Icono nombre="ubicacion" from={6.4} to={9.8} x={900} y={560} estilo="emoji" pulso />

			<LuzOrganica at={3} />
			<LuzOrganica at={6} semilla={7} tono={20} />
			<Vineta fuerza={0.3} />
			<Grano intensidad={0.05} />
			<BarraProgreso color="#FFD84D" />
		</AbsoluteFill>
	);
};

export const MuestrasEfectos: React.FC = () => (
	<>
		<Still id="Iconos" component={Lamina} width={1080} height={1920} />
		<Composition id="EfectosDemo" component={Demo} durationInFrames={300} fps={30} width={1080} height={1920} defaultProps={{subtitulos: 'hormozi' as EstiloSubtitulo}} />
	</>
);
