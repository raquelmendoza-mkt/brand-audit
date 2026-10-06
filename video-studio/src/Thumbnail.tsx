import {AbsoluteFill, Img, staticFile, Still} from 'remotion';
import {brand, headingFont} from './brand';

// Portada para Reels/YouTube Shorts (1080x1920). Renderizar con:
// npx remotion still Thumbnail out/portada.png --props='{"title":"...","photo":"..."}'

export type ThumbnailProps = {
	readonly photo: string; // ruta dentro de public/
	readonly title: string;
	readonly highlight: string; // palabra o cifra destacada en dorado
};

export const ThumbnailComponent: React.FC<ThumbnailProps> = ({photo, title, highlight}) => {
	return (
		<AbsoluteFill style={{background: brand.black}}>
			<Img src={staticFile(photo)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(14,14,14,0) 40%, rgba(14,14,14,0.9) 80%)'}} />
			<AbsoluteFill style={{justifyContent: 'flex-end', padding: '0 90px 260px'}}>
				<div style={{fontFamily: headingFont, fontWeight: 800, fontSize: 170, lineHeight: 1.05, color: brand.gold}}>{highlight}</div>
				<div style={{fontFamily: headingFont, fontWeight: 800, fontSize: 80, lineHeight: 1.06, color: brand.white, marginTop: 20, textTransform: 'uppercase'}}>
					{title}
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

export const ThumbnailStill: React.FC = () => {
	return (
		<Still
			id="Thumbnail"
			component={ThumbnailComponent}
			width={1080}
			height={1920}
			defaultProps={{photo: 'demo/foto-1.jpg', title: 'Vende tu propiedad con IA', highlight: '30 DÍAS'}}
		/>
	);
};
