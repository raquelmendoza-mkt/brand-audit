import {Folder} from 'remotion';
import {Dia2Composition} from './Dia2';
import {DetallitosDyanComposition, PromoTextosComposition} from './PromoTextos';
import {PropertyPromoComposition} from './PropertyPromo';
import {ReelComposition} from './Reel';
import {RoomTourBosqueComposition} from './RoomTour';
import {ThumbnailStill} from './Thumbnail';

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Folder name="Reels">
				<ReelComposition />
				<PropertyPromoComposition />
				<PromoTextosComposition />
				<DetallitosDyanComposition />
				<Dia2Composition />
				<RoomTourBosqueComposition />
			</Folder>
			<Folder name="Portadas">
				<ThumbnailStill />
			</Folder>
		</>
	);
};
