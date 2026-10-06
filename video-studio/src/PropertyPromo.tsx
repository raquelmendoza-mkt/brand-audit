import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
import {
	AbsoluteFill,
	Composition,
	Easing,
	Img,
	interpolate,
	Sequence,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
	type CalculateMetadataFunction,
} from 'remotion';
import {brand, bodyFont, headingFont} from './brand';

// Video de propiedad hecho solo con fotos: efecto Ken Burns en cada foto,
// transiciones, ficha con precio y características, y cierre con contacto.
// Formato vertical 9:16 para Reels, TikTok y Stories.

export type PropertyPromoProps = {
	readonly photos: string[]; // rutas dentro de public/
	readonly secondsPerPhoto: number;
	readonly title: string;
	readonly location: string;
	readonly price: string;
	readonly features: string[]; // p. ej. "3 hab", "2 baños", "120 m²"
	readonly agent: string;
	readonly phone: string;
};

const FPS = 30;
const TRANSITION = 15;
const OUTRO_SECONDS = 3;

const calculateMetadata: CalculateMetadataFunction<PropertyPromoProps> = ({props}) => {
	const n = props.photos.length;
	const photosFrames = n * Math.round(props.secondsPerPhoto * FPS) - Math.max(0, n - 1) * TRANSITION;
	return {durationInFrames: photosFrames + OUTRO_SECONDS * FPS - TRANSITION, fps: FPS};
};

const KenBurns: React.FC<{readonly src: string; readonly index: number}> = ({src, index}) => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	const zoomIn = index % 2 === 0;
	return (
		<AbsoluteFill style={{overflow: 'hidden', background: brand.black}}>
			<Img
				src={staticFile(src)}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					scale: interpolate(frame, [0, durationInFrames], zoomIn ? [1, 1.15] : [1.15, 1], {output: 'perceptual-scale'}),
					translate: interpolate(frame, [0, durationInFrames], index % 3 === 0 ? ['-20px 0px', '20px 0px'] : ['0px 10px', '0px -10px']),
				}}
			/>
		</AbsoluteFill>
	);
};

const InfoCard: React.FC<Omit<PropertyPromoProps, 'photos' | 'secondsPerPhoto' | 'agent' | 'phone'>> = ({title, location, price, features}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const enter = (delay: number) => ({
		opacity: interpolate(frame, [delay, delay + 0.4 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
		translate: interpolate(frame, [delay, delay + 0.6 * fps], ['0px 50px', '0px 0px'], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
			easing: Easing.bezier(0.16, 1, 0.3, 1),
		}),
	});
	return (
		<AbsoluteFill style={{justifyContent: 'flex-end'}}>
			<div style={{background: 'linear-gradient(180deg, rgba(14,14,14,0) 0%, rgba(14,14,14,0.85) 45%)', padding: '260px 90px 200px'}}>
				<div style={{...enter(0.2 * fps), fontFamily: bodyFont, fontSize: 40, color: brand.gold, letterSpacing: 4, textTransform: 'uppercase'}}>{location}</div>
				<div style={{...enter(0.35 * fps), fontFamily: headingFont, fontWeight: 800, fontSize: 78, lineHeight: 1.06, color: brand.white, marginTop: 16}}>{title}</div>
				<div style={{...enter(0.5 * fps), display: 'flex', flexWrap: 'wrap', gap: 18, marginTop: 36}}>
					{features.map((f) => (
						<div key={f} style={{padding: '12px 28px', borderRadius: 999, border: `2px solid ${brand.purpleLight}`, color: brand.white, fontFamily: bodyFont, fontWeight: 500, fontSize: 40}}>
							{f}
						</div>
					))}
				</div>
				<div style={{...enter(0.7 * fps), display: 'inline-block', marginTop: 40, padding: '16px 36px', borderRadius: 18, background: brand.purple, color: brand.white, fontFamily: headingFont, fontWeight: 800, fontSize: 72}}>
					{price}
				</div>
			</div>
		</AbsoluteFill>
	);
};

const Outro: React.FC<{readonly agent: string; readonly phone: string; readonly price: string}> = ({agent, phone, price}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return (
		<AbsoluteFill style={{background: `linear-gradient(160deg, ${brand.purpleDark}, ${brand.black})`, justifyContent: 'center', alignItems: 'center', gap: 36, padding: 100}}>
			<div style={{fontFamily: headingFont, fontWeight: 800, fontSize: 96, color: brand.white, textAlign: 'center', lineHeight: 1.05}}>Agenda tu visita</div>
			<div style={{fontFamily: headingFont, fontWeight: 700, fontSize: 64, color: brand.gold}}>{price}</div>
			<div
				style={{
					marginTop: 30,
					padding: '24px 56px',
					borderRadius: 999,
					background: brand.gold,
					color: brand.black,
					fontFamily: headingFont,
					fontWeight: 700,
					fontSize: 56,
					scale: interpolate(frame, [0.3 * fps, 0.8 * fps], [0.7, 1], {
						extrapolateLeft: 'clamp',
						extrapolateRight: 'clamp',
						easing: Easing.spring({damping: 10}),
						output: 'perceptual-scale',
					}),
				}}
			>
				{phone}
			</div>
			<div style={{fontFamily: bodyFont, fontSize: 44, color: brand.purpleLight}}>{agent}</div>
		</AbsoluteFill>
	);
};

export const PropertyPromoComponent: React.FC<PropertyPromoProps> = (props) => {
	const {fps} = useVideoConfig();
	const photoFrames = Math.round(props.secondsPerPhoto * fps);

	return (
		<AbsoluteFill style={{background: brand.black}}>
			<TransitionSeries name="Fotos">
				{props.photos.flatMap((src, i) => [
					i > 0 ? (
						<TransitionSeries.Transition
							key={`t${i}`}
							presentation={i % 2 === 0 ? fade() : slide({direction: 'from-right'})}
							timing={linearTiming({durationInFrames: TRANSITION})}
						/>
					) : null,
					<TransitionSeries.Sequence key={src} name={`Foto ${i + 1}`} durationInFrames={photoFrames} premountFor={fps}>
						<KenBurns src={src} index={i} />
						{i === 0 ? (
							<Sequence name="Ficha" premountFor={fps}>
								<InfoCard title={props.title} location={props.location} price={props.price} features={props.features} />
							</Sequence>
						) : null}
					</TransitionSeries.Sequence>,
				])}
				<TransitionSeries.Transition presentation={fade()} timing={linearTiming({durationInFrames: TRANSITION})} />
				<TransitionSeries.Sequence name="Cierre" durationInFrames={OUTRO_SECONDS * fps} premountFor={fps}>
					<Outro agent={props.agent} phone={props.phone} price={props.price} />
				</TransitionSeries.Sequence>
			</TransitionSeries>
		</AbsoluteFill>
	);
};

export const PropertyPromoComposition: React.FC = () => {
	return (
		<Composition
			id="PropertyPromo"
			component={PropertyPromoComponent}
			durationInFrames={300}
			fps={30}
			width={1080}
			height={1920}
			calculateMetadata={calculateMetadata}
			defaultProps={{
				photos: ['demo/foto-1.jpg', 'demo/foto-2.jpg', 'demo/foto-3.jpg'],
				secondsPerPhoto: 3.5,
				title: 'Apartamento con vista al mar',
				location: 'Lechería, Anzoátegui',
				price: '$185.000',
				features: ['3 hab', '2 baños', '120 m²', 'Piscina'],
				agent: 'Raquel Mendoza · RM Marketing IA',
				phone: '+58 414 000 0000',
			}}
		/>
	);
};
