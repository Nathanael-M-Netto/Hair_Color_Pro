/**
 * Gera splash screens iOS para vários tamanhos de iPhone/iPad.
 *
 * iOS exige um `<link rel="apple-touch-startup-image">` separado pra cada
 * resolução + orientação. Sem isso, o app instalado mostra splash branca
 * por 1-2s — feio. Com os splash certos, o iOS exibe o nosso fundo cobre
 * com o logo centralizado, indistinguível de app nativo.
 *
 * Rodar: `node scripts/generate-splash.mjs`
 */

import sharp from 'sharp';
import { writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// Tamanhos comuns de iPhone/iPad em portrait (pixels físicos = CSS × DPR)
const SPLASH_SIZES = [
  // iPhone 15 Pro Max, 14 Pro Max
  { w: 1290, h: 2796, ratio: 3, label: 'iphone-15-pro-max' },
  // iPhone 15/14 Pro, 13/12 Pro
  { w: 1179, h: 2556, ratio: 3, label: 'iphone-15-pro' },
  // iPhone 15/14 Plus, 13/12 Pro Max
  { w: 1284, h: 2778, ratio: 3, label: 'iphone-14-plus' },
  // iPhone 15/14, 13/12
  { w: 1170, h: 2532, ratio: 3, label: 'iphone-15' },
  // iPhone 13/12 mini, X/Xs, 11 Pro
  { w: 1125, h: 2436, ratio: 3, label: 'iphone-x' },
  // iPhone SE 3rd gen, 8/7/6s
  { w: 750, h: 1334, ratio: 2, label: 'iphone-se' },
  // iPad Pro 12.9"
  { w: 2048, h: 2732, ratio: 2, label: 'ipad-pro-12' },
  // iPad Pro 11", iPad Air, iPad
  { w: 1668, h: 2388, ratio: 2, label: 'ipad-pro-11' },
];

const iconSvg = readFileSync(join(publicDir, 'icon.svg'));

for (const { w, h, label } of SPLASH_SIZES) {
  // Logo de tamanho proporcional — 30% da menor dimensão pra ficar centralizado
  const iconSize = Math.round(Math.min(w, h) * 0.3);

  // Gera logo redimensionado
  const iconBuffer = await sharp(iconSvg)
    .resize(iconSize, iconSize)
    .png()
    .toBuffer();

  // Compõe o splash: fundo sólido #0E0C0B + logo centralizado
  await sharp({
    create: {
      width: w,
      height: h,
      channels: 4,
      background: { r: 14, g: 12, b: 11, alpha: 1 }, // #0E0C0B
    },
  })
    .composite([
      {
        input: iconBuffer,
        top: Math.round((h - iconSize) / 2),
        left: Math.round((w - iconSize) / 2),
      },
    ])
    .png({ compressionLevel: 9 })
    .toFile(join(publicDir, `splash-${label}-portrait.png`));

  console.log(`✓ splash-${label}-portrait.png (${w}×${h})`);
}

// Gera o `<link>` tags pra colar no layout
const SPLASH_LINKS = [
  // Cada link com a media query exata do iOS
  {
    media:
      '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
    href: '/splash-iphone-15-pro-max-portrait.png',
  },
  {
    media:
      '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
    href: '/splash-iphone-15-pro-portrait.png',
  },
  {
    media:
      '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
    href: '/splash-iphone-14-plus-portrait.png',
  },
  {
    media:
      '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
    href: '/splash-iphone-15-portrait.png',
  },
  {
    media:
      '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
    href: '/splash-iphone-x-portrait.png',
  },
  {
    media:
      '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
    href: '/splash-iphone-se-portrait.png',
  },
  {
    media:
      '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
    href: '/splash-ipad-pro-12-portrait.png',
  },
  {
    media:
      '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
    href: '/splash-ipad-pro-11-portrait.png',
  },
];

writeFileSync(
  join(publicDir, 'apple-splash-links.json'),
  JSON.stringify(SPLASH_LINKS, null, 2),
);

console.log('\nSplash links salvos em public/apple-splash-links.json');
console.log('São referenciados pelo src/components/AppleSplashLinks.tsx no layout.');
