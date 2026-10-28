import {Folder} from 'remotion';
import {Dia2Composition} from './Dia2';
import {VinedoComposition} from './Vinedo';
import {FelipeComposition} from './Felipe';
import {DetallitosDyanComposition, PromoTextosComposition} from './PromoTextos';
import {PropertyPromoComposition} from './PropertyPromo';
import {CatalogoComposition} from './Catalogo';
import {ReelComposition} from './Reel';
import {RoomTourBosqueComposition, RoomTourBosqueOmniComposition} from './RoomTour';
import {ThumbnailStill} from './Thumbnail';
import {MuestrasKit} from './kit/Muestras';

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Folder name="Reels">
				<ReelComposition />
				<CatalogoComposition />
				<PropertyPromoComposition />
				<PromoTextosComposition />
				<DetallitosDyanComposition />
				<Dia2Composition />
				<VinedoComposition />
				<FelipeComposition />
				<RoomTourBosqueComposition />
				<RoomTourBosqueOmniComposition />
			</Folder>
			<Folder name="Portadas">
				<ThumbnailStill />
			</Folder>
			<Folder name="Kit">
				<MuestrasKit />
			</Folder>
		</>
	);
};
