import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Fuentes extra para clientes, alojadas en public/fonts.
// Helvetica es de pago: si el equipo la tiene instalada (Mac) se usa la real;
// si no, TeX Gyre Heros, su clon libre con el mismo diseño.
export const poppins = 'Poppins';
export const helvetica = "Helvetica, 'TeX Gyre Heros', Arial, sans-serif";

for (const weight of ['400', '600', '700', '800']) {
	loadFont({family: poppins, url: staticFile(`fonts/poppins-latin-${weight}-normal.woff2`), weight});
}
loadFont({family: 'TeX Gyre Heros', url: staticFile('fonts/texgyreheros-regular.otf'), weight: '400'});
loadFont({family: 'TeX Gyre Heros', url: staticFile('fonts/texgyreheros-bold.otf'), weight: '700'});
