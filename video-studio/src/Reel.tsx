import type {Caption} from '@remotion/captions';
import {Video} from '@remotion/media';
import {
	AbsoluteFill,
	Composition,
	Easing,
	interpolate,
	Sequence,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
	type CalculateMetadataFunction,
} from 'remotion';
import {brand, bodyFont, headingFont} from './brand';
import {Captions} from './components/Captions';

// Reel vertical 9:16: tu video a pantalla completa + gancho + subtítulos
// animados palabra por palabra + barra de progreso + cierre con llamada a la acción.
// Lo normal es renderizarlo con `npm run reel -- input/mi-video.mp4`, que transcribe
// y rellena estas props automáticamente.

export type ReelProps = {
	// Archivos dentro de public/
	readonly video: string;
	readonly captionsFile: string | null;
	readonly durationInSeconds: number;
	// Texto grande de los primeros segundos. Vacío = sin gancho
	readonly hook: string;
	// Distancia del gancho al borde superior, en px. Súbelo o bájalo para no tapar la cara
	readonly hookTop: number;
	// Pantalla final. Vacío = sin cierre
	readonly cta: string;
	readonly ctaSub: string;
	readonly handle: string;
	readonly showProgress: boolean;
	// Las rellena calculateMetadata a partir de captionsFile
	readonly captions?: Caption[];
};

const CTA_SECONDS = 3;

const calculateMetadata: CalculateMetadataFunction<ReelProps> = async ({props}) => {
	const fps = 30;
	const captions = props.captionsFile
		? ((await (await fetch(staticFile(props.captionsFile))).json()) as Caption[])
		: [];
	const extra = props.cta ? CTA_SECONDS : 0;
	return {
		fps,
		durationInFrames: Math.max(1, Math.round((props.durationInSeconds + extra) * fps)),
		props: {...props, captions},
	};
};

const Hook: React.FC<{readonly text: string; readonly top: number}> = ({text, top}) => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();
	return (
		<AbsoluteFill style={{alignItems: 'center', paddingTop: top}}>
			<div
				style={{
					maxWidth: 900,
					padding: '28px 44px',
					borderRadius: 28,
					background: brand.purple,
					color: brand.white,
					fontFamily: headingFont,
					fontWeight: 800,
					fontSize: 72,
					lineHeight: 1.08,
					textAlign: 'center',
					boxShadow: '0 20px 60px rgba(61,52,146,0.45)',
					rotate: '-2deg',
					scale: interpolate(frame, [0, 0.4 * fps], [0.6, 1], {
						extrapolateLeft: 'clamp',
						extrapolateRight: 'clamp',
						easing: Easing.spring({damping: 11}),
						output: 'perceptual-scale',
					}),
					opacity: interpolate(frame, [durationInFrames - 0.3 * fps, durationInFrames], [1, 0], {
						extrapolateLeft: 'clamp',
						extrapolateRight: 'clamp',
					}),
				}}
			>
				{text}
			</div>
		</AbsoluteFill>
	);
};

const ProgressBar: React.FC<{readonly end: number}> = ({end}) => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{justifyContent: 'flex-end'}}>
			<div
				style={{
					height: 10,
					background: brand.gold,
					width: `${interpolate(frame, [0, end], [0, 100], {extrapolateRight: 'clamp'})}%`,
				}}
			/>
		</AbsoluteFill>
	);
};

const EndCard: React.FC<{readonly cta: string; readonly sub: string; readonly handle: string}> = ({cta, sub, handle}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const enter = (delay: number) => ({
		opacity: interpolate(frame, [delay, delay + 0.4 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
		translate: interpolate(frame, [delay, delay + 0.5 * fps], ['0px 60px', '0px 0px'], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
			easing: Easing.bezier(0.16, 1, 0.3, 1),
		}),
	});
	return (
		<AbsoluteFill
			style={{
				background: `linear-gradient(160deg, ${brand.purpleDark} 0%, ${brand.black} 100%)`,
				justifyContent: 'center',
				alignItems: 'center',
				padding: 100,
				gap: 40,
				opacity: interpolate(frame, [0, 0.3 * fps], [0, 1], {extrapolateRight: 'clamp'}),
			}}
		>
			<div style={{...enter(0.1 * fps), fontFamily: headingFont, fontWeight: 800, fontSize: 100, lineHeight: 1.05, color: brand.white, textAlign: 'center'}}>
				{cta}
			</div>
			{sub ? (
				<div style={{...enter(0.35 * fps), fontFamily: bodyFont, fontSize: 48, color: brand.purpleLight, textAlign: 'center'}}>{sub}</div>
			) : null}
			<div
				style={{
					...enter(0.6 * fps),
					marginTop: 30,
					padding: '22px 52px',
					borderRadius: 999,
					background: brand.gold,
					color: brand.black,
					fontFamily: headingFont,
					fontWeight: 700,
					fontSize: 52,
				}}
			>
				{handle}
			</div>
		</AbsoluteFill>
	);
};

export const ReelComponent: React.FC<ReelProps> = ({video, captions = [], durationInSeconds, hook, hookTop, cta, ctaSub, handle, showProgress}) => {
	const {fps} = useVideoConfig();
	const videoFrames = Math.round(durationInSeconds * fps);

	return (
		<AbsoluteFill style={{background: brand.black}}>
			<Video
				name="Video"
				src={staticFile(video)}
				durationInFrames={videoFrames}
				premountFor={fps}
				objectFit="cover"
				style={{position: 'absolute', width: '100%', height: '100%'}}
			/>
			<Sequence name="Subtítulos" durationInFrames={videoFrames} premountFor={fps}>
				<Captions captions={captions} />
			</Sequence>
			{hook ? (
				<Sequence name="Gancho" durationInFrames={Math.min(3 * fps, videoFrames)} premountFor={fps}>
					<Hook text={hook} top={hookTop} />
				</Sequence>
			) : null}
			{showProgress ? (
				<Sequence name="Progreso" durationInFrames={videoFrames}>
					<ProgressBar end={videoFrames} />
				</Sequence>
			) : null}
			{cta ? (
				<Sequence name="Cierre" from={videoFrames} premountFor={fps}>
					<EndCard cta={cta} sub={ctaSub} handle={handle} />
				</Sequence>
			) : null}
		</AbsoluteFill>
	);
};

export const ReelComposition: React.FC = () => {
	return (
		<Composition
			id="Reel"
			component={ReelComponent}
			durationInFrames={300}
			fps={30}
			width={1080}
			height={1920}
			calculateMetadata={calculateMetadata}
			defaultProps={{
				video: 'demo/prueba.mp4',
				captionsFile: 'demo/prueba.json',
				durationInSeconds: 11.2,
				hook: 'Vende tu propiedad en 30 días',
				hookTop: 780,
				cta: '¿Quieres el método completo?',
				ctaSub: 'Escríbeme "MÉTODO" por DM',
				handle: '@raquelmendoza.ia',
				showProgress: true,
			}}
		/>
	);
};
