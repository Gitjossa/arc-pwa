import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(root, "..", "public");
const iconsDir = path.join(publicDir, "icons");
const appDir = path.join(root, "..", "app");

mkdirSync(iconsDir, { recursive: true });

const BG = "#09090a";
const ACCENT_A = "#ff5a1f";
const ACCENT_B = "#ffb238";

// A simple barbell mark: horizontal bar with two plates near each end.
function barbellSvg({ size, padding, background }) {
  const s = size;
  const barY = s / 2;
  const barHeight = s * 0.09;
  const plateWidth = s * 0.1;
  const plateHeight = s * 0.46;
  const innerLeft = padding;
  const innerRight = s - padding;

  const bg = background ? `<rect width="${s}" height="${s}" fill="${BG}"/>` : "";

  return `
<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${ACCENT_A}"/>
      <stop offset="100%" stop-color="${ACCENT_B}"/>
    </linearGradient>
  </defs>
  ${bg}
  <rect x="${innerLeft}" y="${barY - barHeight / 2}" width="${innerRight - innerLeft}" height="${barHeight}" rx="${barHeight / 2}" fill="url(#grad)"/>
  <rect x="${innerLeft - plateWidth * 0.15}" y="${barY - plateHeight / 2}" width="${plateWidth}" height="${plateHeight}" rx="${plateWidth / 2}" fill="url(#grad)"/>
  <rect x="${innerRight - plateWidth * 0.85}" y="${barY - plateHeight / 2}" width="${plateWidth}" height="${plateHeight}" rx="${plateWidth / 2}" fill="url(#grad)"/>
</svg>`;
}

async function renderPng(svg, size, outPath) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(outPath);
}

const favicon = barbellSvg({ size: 512, padding: 512 * 0.18, background: true });

await renderPng(favicon, 192, path.join(iconsDir, "icon-192.png"));
await renderPng(favicon, 512, path.join(iconsDir, "icon-512.png"));
await renderPng(
  barbellSvg({ size: 512, padding: 512 * 0.3, background: true }),
  512,
  path.join(iconsDir, "icon-maskable-512.png"),
);
await renderPng(favicon, 180, path.join(appDir, "apple-icon.png"));

// app/icon.svg for the browser tab favicon (Next.js file convention)
import { writeFileSync } from "node:fs";
writeFileSync(path.join(appDir, "icon.svg"), barbellSvg({ size: 64, padding: 64 * 0.18, background: true }).trim());

console.log("Icons generated.");
