import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';
import lista from './fuentes-lista.json';

// Fuentes alojadas en public/fonts (el render headless no puede pedirlas a Google Fonts).
// Helvetica es de pago: si el equipo la tiene instalada (Mac) se usa la real;
// si no, TeX Gyre Heros, su clon libre con el mismo diseño.
// La biblioteca de Google Fonts (licencia OFL, uso comercial libre) la baja scripts/fuentes.py.
export const poppins = 'Poppins';
export const helvetica = "Helvetica, 'TeX Gyre Heros', Arial, sans-serif";

for (const weight of ['400', '600', '700', '800']) {
	loadFont({family: poppins, url: staticFile(`fonts/poppins-latin-${weight}-normal.woff2`), weight});
}
loadFont({family: 'TeX Gyre Heros', url: staticFile('fonts/texgyreheros-regular.otf'), weight: '400'});
loadFont({family: 'TeX Gyre Heros', url: staticFile('fonts/texgyreheros-bold.otf'), weight: '700'});

for (const f of lista) {
	loadFont({family: f.family, url: staticFile(f.file), weight: f.weight, style: f.style});
}

// Familias con su respaldo (úsalas en fontFamily)
const fam = (name: string, fallback: string) => `'${name}', ${fallback}`;
export const FUENTES = {
	// Serif de lujo / editorial
	cormorant: fam('Cormorant Garamond', 'Georgia, serif'),
	playfair: fam('Playfair Display', 'Georgia, serif'),
	bodoni: fam('Bodoni Moda', 'Georgia, serif'),
	dmSerif: fam('DM Serif Display', 'Georgia, serif'),
	cinzel: fam('Cinzel', 'Georgia, serif'),
	italiana: fam('Italiana', 'Georgia, serif'),
	// Sans limpias
	montserrat: fam('Montserrat', 'Arial, sans-serif'),
	inter: fam('Inter', 'Arial, sans-serif'),
	josefin: fam('Josefin Sans', 'Arial, sans-serif'),
	jost: fam('Jost', 'Arial, sans-serif'),
	poppins: fam('Poppins', 'Arial, sans-serif'),
	helvetica,
	// Impacto
	bebas: fam('Bebas Neue', 'Impact, sans-serif'),
	anton: fam('Anton', 'Impact, sans-serif'),
	archivoBlack: fam('Archivo Black', 'Arial Black, sans-serif'),
	oswald: fam('Oswald', 'Arial Narrow, sans-serif'),
	spaceGrotesk: fam('Space Grotesk', 'Arial, sans-serif'),
	// Firma
	greatVibes: fam('Great Vibes', 'cursive'),
	allura: fam('Allura', 'cursive'),
	pinyon: fam('Pinyon Script', 'cursive'),
} as const;

// Combinaciones probadas por estilo de video. titulo = titulares grandes, apoyo = textos
// pequeños / subtítulos / rótulos, firma = nombre del agente o detalle manuscrito (opcional).
// La ficha completa (colores, tamaños, ritmo, sonido) está en la skill editor-video, estilos.md.
export const PARES = {
	// Inmobiliaria de lujo, minimalista (Felipe, penthouses)
	lujo: {titulo: FUENTES.cormorant, apoyo: FUENTES.montserrat, firma: FUENTES.greatVibes},
	// Editorial / revista (alto contraste)
	editorial: {titulo: FUENTES.playfair, apoyo: FUENTES.inter, firma: FUENTES.allura},
	// Moda, belleza, boutique
	moda: {titulo: FUENTES.bodoni, apoyo: FUENTES.jost, firma: FUENTES.pinyon},
	// Arquitectura, desarrollos, constructoras
	arquitectura: {titulo: FUENTES.cinzel, apoyo: FUENTES.josefin, firma: FUENTES.italiana},
	// Reel dinámico de marca de Raquel (Poppins + Helvetica, su pedido habitual)
	dinamico: {titulo: FUENTES.poppins, apoyo: FUENTES.helvetica, firma: FUENTES.allura},
	// Viral / impacto (cifras, ofertas, "3 errores...")
	impacto: {titulo: FUENTES.anton, apoyo: FUENTES.inter, firma: FUENTES.greatVibes},
	// Tech / IA / moderno
	moderno: {titulo: FUENTES.spaceGrotesk, apoyo: FUENTES.inter, firma: FUENTES.allura},
} as const;
export type Estilo = keyof typeof PARES;
