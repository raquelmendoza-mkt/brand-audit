import {Folder} from 'remotion';
import {Dia2Composition} from './Dia2';
import {PromoTextosComposition} from './PromoTextos';
import {PropertyPromoComposition} from './PropertyPromo';
import {ReelComposition} from './Reel';
import {ThumbnailStill} from './Thumbnail';

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Folder name="Reels">
				<ReelComposition />
				<PropertyPromoComposition />
				<PromoTextosComposition />
				<Dia2Composition />
			</Folder>
			<Folder name="Portadas">
				<ThumbnailStill />
			</Folder>
		</>
	);
};
