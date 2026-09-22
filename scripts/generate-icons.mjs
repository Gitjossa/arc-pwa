import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(root, "..", "public");
const iconsDir = path.join(publicDir, "icons");
const appDir = path.join(root, "..", "app");

mkdirSync(iconsDir, { recursive: true });

const logoPath = path.join(root, "logo-source.svg");
const logoSvg = readFileSync(logoPath, "utf8");

async function renderPng(size, outPath) {
  await sharp(Buffer.from(logoSvg)).resize(size, size).png().toFile(outPath);
}

await renderPng(192, path.join(iconsDir, "icon-192.png"));
await renderPng(512, path.join(iconsDir, "icon-512.png"));
// The logo already sits well inside its canvas, so it's safe to reuse as-is for maskable.
await renderPng(512, path.join(iconsDir, "icon-maskable-512.png"));
await renderPng(180, path.join(appDir, "apple-icon.png"));

// app/icon.svg for the browser tab favicon (Next.js file convention)
copyFileSync(logoPath, path.join(appDir, "icon.svg"));

console.log("Icons generated from logo-source.svg.");
