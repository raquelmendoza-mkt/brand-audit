// Prueba de transiciones: dos fotos con la transición elegida a mitad (frame 40).
// npx remotion still PruebaTransicion out/t.png --frame=40 --props='{"tipo":"glitch"}'
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {AbsoluteFill, Composition, Img, staticFile} from 'remotion';
import {transicion, type NombreTransicion} from './Transiciones';

const Foto: React.FC<{readonly src: string}> = ({src}) => (
	<AbsoluteFill>
		<Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
	</AbsoluteFill>
);

const Prueba: React.FC<{readonly tipo: NombreTransicion}> = ({tipo}) => (
	<AbsoluteFill style={{background: '#000'}}>
		<TransitionSeries>
			<TransitionSeries.Sequence durationInFrames={40}>
				<Foto src="work/felipe/fotos/f21.jpg" />
			</TransitionSeries.Sequence>
			<TransitionSeries.Transition presentation={transicion(tipo)} timing={linearTiming({durationInFrames: 20})} />
			<TransitionSeries.Sequence durationInFrames={40}>
				<Foto src="work/felipe/fotos/f05.jpg" />
			</TransitionSeries.Sequence>
		</TransitionSeries>
	</AbsoluteFill>
);

export const PruebaTransicionComposition: React.FC = () => (
	<Composition id="PruebaTransicion" component={Prueba} durationInFrames={60} fps={30} width={1080} height={1920} defaultProps={{tipo: 'fundido' as NombreTransicion}} />
);
