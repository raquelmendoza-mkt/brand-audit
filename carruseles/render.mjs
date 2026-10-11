#!/usr/bin/env node
/* ==================================================================
   render.mjs — exporta un carrusel a PNG listos para Instagram.

   Uso:
     node carruseles/render.mjs carruseles/proyectos/<nombre>/carrusel.html
     node carruseles/render.mjs <archivo.html> --jpg      (JPG calidad 95)
     node carruseles/render.mjs <archivo.html> --scale 2  (2160×2700, retina)

   Genera en <carpeta del carrusel>/export/:
     01.png, 02.png, …   un archivo por slide, 1080×1350
     vista-previa.png    hoja de contacto con todos los slides
   y muestra los avisos de control de calidad (texto desbordado, etc.).
   ================================================================== */
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function loadPlaywright() {
  const require = createRequire(import.meta.url);
  try { return require('playwright'); } catch {}
  const globalRoot = execSync('npm root -g').toString().trim();
  return require(path.join(globalRoot, 'playwright'));
}

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--') && !/^\d+$/.test(a));
if (!file) {
  console.error('Uso: node carruseles/render.mjs <carrusel.html> [--jpg] [--scale 2]');
  process.exit(1);
}
const jpg = args.includes('--jpg');
const scaleIdx = args.indexOf('--scale');
const scale = scaleIdx >= 0 ? Number(args[scaleIdx + 1]) : 1;

const htmlPath = path.resolve(file);
const outDir = path.join(path.dirname(htmlPath), 'export');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const { chromium } = loadPlaywright();
const launchOpts = {};
if (fs.existsSync('/opt/pw-browsers/chromium')) {
  // Entorno en la nube: Chromium preinstalado
  const dir = fs.readdirSync('/opt/pw-browsers').find((d) => /^chromium-\d+$/.test(d));
  const bin = dir && path.join('/opt/pw-browsers', dir, 'chrome-linux', 'chrome');
  if (bin && fs.existsSync(bin)) launchOpts.executablePath = bin;
}
const browser = await chromium.launch(launchOpts);
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: scale });
page.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') console.log(m.text()); });
page.on('pageerror', (e) => console.log('Error en la página:', e.message));

await page.goto(pathToFileURL(htmlPath).href + '?render', { waitUntil: 'load' });
await page.waitForFunction(() => window.__carruselReady === true, null, { timeout: 20000 });
await page.waitForTimeout(150);

const total = await page.evaluate(() => window.__carrusel.total);
await page.setViewportSize({ width: 1080 * total, height: 1350 });
await page.waitForTimeout(100);

const files = [];
for (let i = 0; i < total; i++) {
  const name = String(i + 1).padStart(2, '0') + (jpg ? '.jpg' : '.png');
  const out = path.join(outDir, name);
  await page.screenshot({
    path: out,
    clip: { x: i * 1080, y: 0, width: 1080, height: 1350 },
    ...(jpg ? { type: 'jpeg', quality: 95 } : {}),
  });
  files.push(out);
}

// Hoja de contacto
const mime = jpg ? 'image/jpeg' : 'image/png';
const thumbs = files.map((f) => `<img src="data:${mime};base64,${fs.readFileSync(f).toString('base64')}">`).join('');
const sheet = await browser.newPage({ viewport: { width: 1600, height: 800 } });
await sheet.setContent(`<!doctype html><style>
  body{margin:0;padding:40px;background:#1b1b1f;display:grid;grid-template-columns:repeat(${Math.min(total, 5)},1fr);gap:24px;width:${Math.min(total, 5) * 320 + 40 * 2}px}
  img{width:100%;border-radius:10px;display:block;box-shadow:0 10px 30px rgba(0,0,0,.4)}
</style>${thumbs}`);
await sheet.waitForFunction(() => [...document.images].every((i) => i.complete));
await sheet.screenshot({ path: path.join(outDir, 'vista-previa.png'), fullPage: true });

const issues = await page.evaluate(() => window.__carrusel.qa());
await browser.close();

console.log(`\n✔ ${total} slides exportados en ${path.relative(process.cwd(), outDir)}/`);
if (issues.length) {
  console.log(`\n⚠ Control de calidad (${issues.length}):`);
  issues.forEach((i) => console.log('  - ' + i));
  process.exitCode = 2;
} else {
  console.log('✔ Control de calidad: sin desbordes.');
}
