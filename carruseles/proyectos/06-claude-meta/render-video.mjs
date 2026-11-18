#!/usr/bin/env node
/*
  Graba un video MP4 (1080×1350, 30 fps) de cada slide del carrusel, capturando
  las animaciones CSS como frames y luego encadenándolos con ffmpeg.
*/
import { createRequire } from 'node:module';
import { execSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));

const PROJECT = path.resolve('./');
const HTML = path.join(PROJECT, 'carrusel.html');
const OUT = path.join(PROJECT, 'video');
const FRAMES = path.join(OUT, 'frames');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(FRAMES, { recursive: true });

const FPS = 30;
const SECONDS = 4;  // 4s por slide
const TOTAL = FPS * SECONDS;

const bin = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium'].find(p => fs.existsSync(p));
const browser = await chromium.launch({ executablePath: bin });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(HTML).href + '?render', { waitUntil: 'load' });
await page.waitForFunction(() => window.__carruselReady === true, null, { timeout: 20000 });
await page.evaluate(() => { document.body.classList.remove('preview'); const d = document.querySelector('.deck'); d.style.zoom = 1; });

const total = await page.evaluate(() => window.__carrusel.total);
console.log(`\n→ ${total} slides, ${SECONDS}s cada uno a ${FPS} fps\n`);

for (let i = 0; i < total; i++) {
  const slideFrames = path.join(FRAMES, `s${String(i + 1).padStart(2, '0')}`);
  fs.mkdirSync(slideFrames, { recursive: true });
  // Posicionar la vista en el slide i
  await page.setViewportSize({ width: 1080 * total, height: 1350 });
  for (let f = 0; f < TOTAL; f++) {
    const ms = (f / FPS) * 1000;
    await page.evaluate((t) => {
      document.getAnimations().forEach(a => { a.currentTime = t; a.pause(); });
    }, ms);
    await page.screenshot({
      path: path.join(slideFrames, `${String(f).padStart(4, '0')}.png`),
      clip: { x: i * 1080, y: 0, width: 1080, height: 1350 },
    });
    if (f % 15 === 0) process.stdout.write(`\r  slide ${i + 1}: ${f}/${TOTAL}`);
  }
  process.stdout.write(`\r  slide ${i + 1}: OK (${TOTAL} frames)         \n`);

  // ffmpeg → MP4 con yuv420p (compatible Instagram)
  const mp4 = path.join(OUT, `${String(i + 1).padStart(2, '0')}.mp4`);
  const res = spawnSync('ffmpeg', [
    '-y', '-framerate', String(FPS),
    '-i', path.join(slideFrames, '%04d.png'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    '-vf', 'scale=1080:1350',
    mp4,
  ], { stdio: 'pipe' });
  if (res.status !== 0) { console.error(res.stderr.toString()); process.exit(1); }
}
await browser.close();
fs.rmSync(FRAMES, { recursive: true, force: true });
console.log(`\n✔ ${total} videos exportados en video/`);
