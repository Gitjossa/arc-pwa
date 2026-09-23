import type { LoggedExercise, Unit } from "./types";

export interface ShareCardData {
  dayName: string;
  date: string; // yyyy-mm-dd
  exercises: LoggedExercise[];
  unit: Unit;
  newPrNames: string[];
}

let fontsPromise: Promise<void> | null = null;

function ensureShareFonts(): Promise<void> {
  if (fontsPromise) return fontsPromise;
  fontsPromise = (async () => {
    try {
      let link = document.getElementById("share-card-fonts") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.id = "share-card-fonts";
        link.rel = "stylesheet";
        link.href =
          "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@500;600;700&display=swap";
        const loaded = new Promise<void>((resolve) => {
          link!.onload = () => resolve();
          link!.onerror = () => resolve();
        });
        document.head.appendChild(link);
        await loaded;
      }
      await Promise.all([
        document.fonts.load('700 100px "Space Grotesk"'),
        document.fonts.load('600 40px "Space Grotesk"'),
        document.fonts.load('500 26px "Inter"'),
        document.fonts.load('600 26px "Inter"'),
        document.fonts.load('700 26px "Inter"'),
      ]);
    } catch {
      // fall back to system fonts if Google Fonts can't be reached
    }
  })();
  return fontsPromise;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function truncateToWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 1 && ctx.measureText(`${truncated}…`).width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated}…`;
}

const MONTHS_NL = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
];

function formatLongDateNL(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS_NL[m - 1]} ${y}`;
}

function sessionVolume(exercises: LoggedExercise[]): number {
  return exercises.reduce(
    (sum, ex) =>
      sum +
      ex.sets.reduce((setSum, set) => {
        const kg = parseFloat(set.kg);
        const reps = parseFloat(set.reps);
        return setSum + (Number.isNaN(kg) || Number.isNaN(reps) ? 0 : kg * reps);
      }, 0),
    0,
  );
}

const W = 1080;
const PAD = 72;
const EX_ROW_H = 118;
const EX_GAP = 16;

function computeHeight(exerciseCount: number): number {
  const exercisesBlock = exerciseCount * EX_ROW_H + Math.max(0, exerciseCount - 1) * EX_GAP;
  return (
    PAD + // top padding
    64 +
    36 + // logo row
    34 +
    56 + // day/date line
    30 +
    12 + // hero label
    176 +
    8 + // hero number
    38 +
    56 + // hero unit
    160 +
    48 + // stats row
    30 +
    24 + // section title
    exercisesBlock +
    64 + // section -> footer gap
    40 + // footer text
    PAD // bottom padding
  );
}

export async function drawShareCard(canvas: HTMLCanvasElement, data: ShareCardData): Promise<void> {
  await ensureShareFonts();
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const contentW = W - PAD * 2;
  const height = computeHeight(data.exercises.length);
  canvas.width = W;
  canvas.height = height;

  // background
  ctx.fillStyle = "#07080a";
  ctx.fillRect(0, 0, W, height);

  let glow = ctx.createRadialGradient(W * 0.08, height * -0.02, 0, W * 0.08, height * -0.02, W * 0.55);
  glow.addColorStop(0, "rgba(200,255,61,0.14)");
  glow.addColorStop(1, "rgba(200,255,61,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, height);

  glow = ctx.createRadialGradient(W, height * 0.06, 0, W, height * 0.06, W * 0.45);
  glow.addColorStop(0, "rgba(255,46,136,0.09)");
  glow.addColorStop(1, "rgba(255,46,136,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, height);

  let y = PAD;

  // logo mark: a small lime "arch" matching the app icon's motif
  const markSize = 64;
  ctx.save();
  ctx.strokeStyle = "#c8ff3d";
  ctx.lineWidth = 12;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(PAD + 8, y + markSize);
  ctx.lineTo(PAD + 8, y + markSize * 0.42);
  ctx.arc(PAD + markSize / 2, y + markSize * 0.42, markSize / 2 - 8, Math.PI, 0);
  ctx.lineTo(PAD + markSize - 8, y + markSize);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#f2f5ee";
  ctx.font = '700 44px "Space Grotesk"';
  ctx.textBaseline = "middle";
  ctx.fillText("ARC", PAD + markSize + 24, y + markSize / 2 + 2);
  ctx.textBaseline = "alphabetic";
  y += markSize + 36;

  // day + date
  ctx.fillStyle = "#9aa39a";
  ctx.font = '700 26px "Inter"';
  ctx.fillText(`${data.dayName.toUpperCase()} · ${formatLongDateNL(data.date).toUpperCase()}`, PAD, y + 26);
  y += 34 + 56;

  // hero label
  ctx.fillStyle = "#5c6660";
  ctx.font = '700 24px "Inter"';
  ctx.fillText("TOTAAL VOLUME", PAD, y + 24);
  y += 30 + 12;

  // hero number
  const totalVolume = sessionVolume(data.exercises);
  const volumeLabel = Math.round(totalVolume).toLocaleString("nl-NL");
  ctx.font = '700 176px "Space Grotesk"';
  const heroGrad = ctx.createLinearGradient(PAD, 0, PAD + Math.max(300, ctx.measureText(volumeLabel).width), 0);
  heroGrad.addColorStop(0, "#c8ff3d");
  heroGrad.addColorStop(1, "#e9ff8a");
  ctx.fillStyle = heroGrad;
  ctx.fillText(volumeLabel, PAD, y + 150);
  y += 176 + 8;

  ctx.fillStyle = "#9aa39a";
  ctx.font = '700 30px "Inter"';
  ctx.fillText(`${data.unit.toUpperCase()} GETILD`, PAD, y + 28);
  y += 38 + 56;

  // stats tiles
  const totalSets = data.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const tileGap = 24;
  const tileW = (contentW - tileGap * 2) / 3;
  const tileH = 160;
  const tiles = [
    { value: String(data.exercises.length), label: "OEFENINGEN", accent: "#c8ff3d" },
    { value: String(totalSets), label: "SETS", accent: "#c8ff3d" },
    { value: String(data.newPrNames.length), label: "PR'S", accent: data.newPrNames.length > 0 ? "#ff2e88" : "#c8ff3d" },
  ];
  tiles.forEach((tile, i) => {
    const x = PAD + i * (tileW + tileGap);
    roundRect(ctx, x, y, tileW, tileH, 24);
    ctx.fillStyle = "#161a1e";
    ctx.fill();
    ctx.fillStyle = tile.accent;
    ctx.font = '700 64px "Space Grotesk"';
    ctx.fillText(tile.value, x + 28, y + 92);
    ctx.fillStyle = "#5c6660";
    ctx.font = '700 20px "Inter"';
    ctx.fillText(tile.label, x + 28, y + 130);
  });
  y += tileH + 48;

  // section title
  ctx.fillStyle = "#5c6660";
  ctx.font = '700 24px "Inter"';
  ctx.fillText("OEFENINGEN", PAD, y + 24);
  y += 30 + 24;

  // exercise rows
  data.exercises.forEach((ex) => {
    roundRect(ctx, PAD, y, contentW, EX_ROW_H, 20);
    ctx.fillStyle = "#161a1e";
    ctx.fill();

    ctx.fillStyle = "#f2f5ee";
    ctx.font = '600 34px "Space Grotesk"';
    const nameMaxWidth = contentW - 56 - (data.newPrNames.includes(ex.name) ? 90 : 0);
    const name = truncateToWidth(ctx, ex.name, nameMaxWidth);
    ctx.fillText(name, PAD + 28, y + 46);

    if (data.newPrNames.includes(ex.name)) {
      const nameWidth = ctx.measureText(name).width;
      const badgeX = PAD + 28 + nameWidth + 16;
      roundRect(ctx, badgeX, y + 16, 64, 34, 8);
      ctx.fillStyle = "#ff2e88";
      ctx.fill();
      ctx.fillStyle = "#1a0510";
      ctx.font = '700 18px "Inter"';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("PR", badgeX + 32, y + 16 + 17);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    }

    ctx.fillStyle = "#9aa39a";
    ctx.font = '500 26px "Inter"';
    const setsLabel = ex.sets.map((s) => `${s.reps}×${s.kg}${data.unit}`).join(", ");
    ctx.fillText(truncateToWidth(ctx, setsLabel, contentW - 56), PAD + 28, y + 86);

    y += EX_ROW_H + EX_GAP;
  });
  y += 64 - EX_GAP;

  // footer
  ctx.fillStyle = "#5c6660";
  ctx.font = '600 24px "Inter"';
  ctx.textAlign = "center";
  ctx.fillText("Gemaakt met Arc", W / 2, y + 24);
  ctx.textAlign = "left";
}
