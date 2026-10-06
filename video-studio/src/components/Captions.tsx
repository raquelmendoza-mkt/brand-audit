import {createTikTokStyleCaptions, type Caption} from '@remotion/captions';
import {useMemo} from 'react';
import {
	AbsoluteFill,
	Easing,
	interpolate,
	Sequence,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {brand, headingFont} from '../brand';

type PageProps = {
	readonly page: ReturnType<typeof createTikTokStyleCaptions>['pages'][number];
	readonly fontSize: number;
	readonly bottom: number;
};

// Una "página" de subtítulos: 2-4 palabras, la que se está diciendo resaltada
const CaptionPage: React.FC<PageProps> = ({page, fontSize, bottom}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const timeMs = page.startMs + (frame / fps) * 1000;

	return (
		<AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: bottom}}>
			<div
				style={{
					width: 900,
					textAlign: 'center',
					fontFamily: headingFont,
					fontWeight: 800,
					fontSize,
					lineHeight: 1.15,
					textTransform: 'uppercase',
					color: brand.white,
					WebkitTextStroke: `${fontSize / 9}px ${brand.black}`,
					paintOrder: 'stroke fill',
					textShadow: `0 ${fontSize / 12}px ${fontSize / 5}px rgba(0,0,0,0.45)`,
					scale: interpolate(frame, [0, 0.15 * fps], [0.85, 1], {
						extrapolateLeft: 'clamp',
						extrapolateRight: 'clamp',
						easing: Easing.spring({damping: 12}),
					}),
				}}
			>
				{page.tokens.map((t) => {
					const active = t.fromMs <= timeMs && t.toMs > timeMs;
					return (
						<span
							key={t.fromMs}
							style={{
								whiteSpace: 'pre-wrap',
								color: active ? brand.gold : brand.white,
							}}
						>
							{t.text}
						</span>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};

type Props = {
	readonly captions: Caption[];
	// Milisegundos que se agrupan en una misma página. Más alto = más palabras a la vez
	readonly combineMs?: number;
	readonly fontSize?: number;
	readonly bottom?: number;
};

export const Captions: React.FC<Props> = ({captions, combineMs = 800, fontSize = 78, bottom = 480}) => {
	const {fps} = useVideoConfig();
	const {pages} = useMemo(
		() => createTikTokStyleCaptions({captions, combineTokensWithinMilliseconds: combineMs}),
		[captions, combineMs],
	);

	return (
		<AbsoluteFill>
			{pages.map((page, i) => {
				const next = pages[i + 1];
				const from = Math.round((page.startMs / 1000) * fps);
				const endMs = next ? next.startMs : page.startMs + page.durationMs;
				const duration = Math.max(1, Math.round(((endMs - page.startMs) / 1000) * fps));
				return (
					<Sequence key={page.startMs} name={`Subtítulo ${i + 1}`} from={from} durationInFrames={duration} layout="none">
						<CaptionPage page={page} fontSize={fontSize} bottom={bottom} />
					</Sequence>
				);
			})}
		</AbsoluteFill>
	);
};
