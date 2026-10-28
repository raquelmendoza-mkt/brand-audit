// Muestras del kit: lámina de tipografías (still) y demo de 8 s con las piezas del kit.
// Sirven para elegir estilo con Raquel y para comprobar que fuentes y efectos renderizan.
import {Video} from '@remotion/media';
import {AbsoluteFill, Composition, Img, Sequence, Still, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {FUENTES, PARES, type Estilo} from '../fonts';
import {BotonCTA, camara, Contador, Degradados, Destello, entradaToma, Grano, Polvo, Rotulo, Texto, Vineta, ZonaSegura} from './Kit';

const NOMBRES: Record<Estilo, string> = {
	lujo: 'Lujo minimalista',
	editorial: 'Editorial',
	moda: 'Moda / boutique',
	arquitectura: 'Arquitectura',
	dinamico: 'Dinámico (Raquel)',
	impacto: 'Impacto viral',
	moderno: 'Moderno / IA',
};

const Lamina: React.FC = () => (
	<AbsoluteFill style={{background: '#0F1114', padding: '90px 70px', gap: 34, display: 'flex', flexDirection: 'column'}}>
		<div style={{fontFamily: FUENTES.montserrat, fontWeight: 500, fontSize: 28, letterSpacing: '0.4em', color: '#D9B36A'}}>TIPOGRAFÍAS DEL EDITOR</div>
		{(Object.keys(PARES) as Estilo[]).map((k) => {
			const p = PARES[k];
			return (
				<div key={k} style={{borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 22}}>
					<div style={{fontFamily: FUENTES.montserrat, fontSize: 24, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.55)'}}>{NOMBRES[k].toUpperCase()}</div>
					<div style={{fontFamily: p.titulo, fontWeight: k === 'impacto' || k === 'dinamico' ? 800 : 500, fontSize: 86, color: '#FFFFFF', lineHeight: 1.1}}>Tu próximo hogar</div>
					<div style={{display: 'flex', alignItems: 'baseline', gap: 26}}>
						<div style={{fontFamily: p.apoyo, fontSize: 36, color: 'rgba(255,255,255,0.85)'}}>3 habitaciones · 100 m² · $695.000.000</div>
						<div style={{fontFamily: p.firma, fontSize: 50, color: '#D9B36A'}}>Felipe</div>
					</div>
				</div>
			);
		})}
	</AbsoluteFill>
);

const Toma: React.FC<{readonly src: string; readonly video?: boolean; readonly dur: number}> = ({src, video, dur}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const style: React.CSSProperties = {position: 'absolute', width: '100%', height: '100%', objectFit: 'cover'};
	return (
		<AbsoluteFill style={{...entradaToma('zoomDesenfoque', frame), ...(video ? {} : camara('acercar', frame / (dur * fps)))}}>
			{video ? <Video src={staticFile(src)} muted style={style} /> : <Img src={staticFile(src)} style={style} />}
		</AbsoluteFill>
	);
};

const Demo: React.FC<{readonly zonas: boolean}> = ({zonas}) => {
	const {fps} = useVideoConfig();
	const p = PARES.lujo;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Sequence durationInFrames={3 * fps}>
				<Toma src="work/felipe/omni/3-sala.mp4" video dur={3} />
			</Sequence>
			<Sequence from={3 * fps} durationInFrames={2.5 * fps}>
				<Toma src="work/felipe/fotos/f21.jpg" dur={2.5} />
			</Sequence>
			<Sequence from={5.5 * fps} durationInFrames={2.5 * fps}>
				<Toma src="work/felipe/fotos/f09.jpg" dur={2.5} />
				<AbsoluteFill style={{background: 'rgba(10,12,16,0.55)'}} />
				<Polvo />
			</Sequence>
			<Degradados />
			<Vineta />
			<Grano />
			<Destello at={3} />
			<Destello at={5.5} />

			<Texto from={0.2} to={2.9} entrada="espaciado" style={{position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center', fontFamily: p.apoyo, fontSize: 30, letterSpacing: '0.45em', color: '#D9B36A'}}>
				MEDELLÍN · LA AMÉRICA
			</Texto>
			<Texto from={0.35} to={2.9} entrada="mascara" style={{position: 'absolute', top: 350, left: 0, right: 0, textAlign: 'center', fontFamily: p.titulo, fontWeight: 500, fontSize: 120, color: '#FFFFFF'}}>
				Tu próximo hogar
			</Texto>
			<Rotulo from={0.9} to={2.9} numero="01" antetitulo="Sala" titulo="Amplia y luminosa" />

			<Texto from={3.2} to={5.4} entrada="espaciado" style={{position: 'absolute', top: 700, left: 0, right: 0, textAlign: 'center', fontFamily: p.apoyo, fontSize: 30, letterSpacing: '0.45em', color: '#D9B36A'}}>
				PRECIO DE VENTA
			</Texto>
			<Contador from={3.3} to={5.4} valor={695000000} prefijo="$" style={{position: 'absolute', top: 760, left: 0, right: 0, textAlign: 'center', fontFamily: p.titulo, fontWeight: 600, fontSize: 140, color: '#FFFFFF'}} />

			<Texto from={5.7} to={8} entrada="desenfoque" style={{position: 'absolute', top: 520, left: 0, right: 0, textAlign: 'center', fontFamily: p.firma, fontSize: 130, color: '#FFFFFF'}}>
				Felipe Peláez
			</Texto>
			<BotonCTA from={6.1} texto="AGENDAR VISITA" />
			{zonas ? <ZonaSegura /> : null}
		</AbsoluteFill>
	);
};

export const MuestrasKit: React.FC = () => (
	<>
		<Still id="Tipografias" component={Lamina} width={1080} height={1920} />
		<Composition id="KitDemo" component={Demo} durationInFrames={240} fps={30} width={1080} height={1920} defaultProps={{zonas: false}} />
	</>
);
