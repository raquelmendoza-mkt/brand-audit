/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

// En los entornos en la nube de Claude Code no se puede descargar el Chrome de
// Remotion, así que se usa el Chromium headless preinstalado si existe.
// En tu computadora no existe esa ruta y Remotion usa su propio navegador.
import {existsSync, readdirSync} from 'node:fs';
const pwDir = '/opt/pw-browsers';
const headless = existsSync(pwDir)
	? readdirSync(pwDir)
			.filter((d) => d.startsWith('chromium_headless_shell-'))
			.map((d) => `${pwDir}/${d}/chrome-linux/headless_shell`)
			.find((p) => existsSync(p))
	: undefined;
if (headless) {
	Config.setBrowserExecutable(headless);
}
