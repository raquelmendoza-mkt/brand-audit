import {Folder} from 'remotion';
import {PropertyPromoComposition} from './PropertyPromo';
import {ReelComposition} from './Reel';
import {ThumbnailStill} from './Thumbnail';

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Folder name="Reels">
				<ReelComposition />
				<PropertyPromoComposition />
			</Folder>
			<Folder name="Portadas">
				<ThumbnailStill />
			</Folder>
		</>
	);
};
