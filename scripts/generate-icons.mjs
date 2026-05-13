/**
 * Gera os PNGs de PWA a partir dos SVGs em public/.
 *
 * Rodar: `node scripts/generate-icons.mjs`
 * Saída: public/icon-{192,512}.png, public/icon-maskable-{192,512}.png, public/apple-touch-icon.png
 *
 * Por que PNG e não SVG no manifest?
 *   - iOS Safari NÃO aceita SVG no `apple-touch-icon` (silenciosamente ignora)
 *   - Chrome Android só passa os critérios de instalação PWA com PNG
 *     ≥192×192 e ≥512×512 (qualquer ou maskable)
 *   - Maskable é necessário pra Android exibir o ícone com a "safe zone"
 *     (80% central) — o sistema corta as bordas pra encaixar o shape do tema
 */

import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const iconSvg = readFileSync(join(publicDir, 'icon.svg'));
const maskableSvg = readFileSync(join(publicDir, 'icon-maskable.svg'));

const jobs = [
  // Ícones "any" — usados pelo Chrome em launcher / abas / favicons grandes
  { svg: iconSvg, size: 192, out: 'icon-192.png' },
  { svg: iconSvg, size: 512, out: 'icon-512.png' },

  // Ícones "maskable" — Android aplica máscara do tema (círculo, squircle…)
  { svg: maskableSvg, size: 192, out: 'icon-maskable-192.png' },
  { svg: maskableSvg, size: 512, out: 'icon-maskable-512.png' },

  // Apple touch icon — iOS usa exclusivamente isto pra Home Screen
  // 180x180 é o tamanho atual (iPhone Plus / Pro Max)
  { svg: iconSvg, size: 180, out: 'apple-touch-icon.png' },

  // Favicon — para abas de browser (não-PWA)
  { svg: iconSvg, size: 32, out: 'favicon-32.png' },
];

for (const { svg, size, out } of jobs) {
  await sharp(svg).resize(size, size).png({ compressionLevel: 9 }).toFile(join(publicDir, out));
  console.log(`✓ ${out} (${size}×${size})`);
}

console.log('\nÍcones gerados em public/. Manifest e <head> já apontam pra eles.');
