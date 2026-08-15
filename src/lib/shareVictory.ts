import { ReleaseSummaryData } from "./types";

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350;

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load victory-card art."));
    image.src = src;
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;
  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height,
  );
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    line = word;
    if (lines.length === maxLines - 1) break;
  }
  if (line && lines.length < maxLines) lines.push(line);

  lines.forEach((value, index) => ctx.fillText(value, x, y + index * lineHeight));
  return lines.length;
}

export async function createVictoryCard(data: ReleaseSummaryData) {
  if (typeof document === "undefined") {
    throw new Error("Victory cards can only be created in the browser.");
  }

  await document.fonts?.ready.catch(() => undefined);
  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable.");

  const gradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  gradient.addColorStop(0, "#FFE4F3");
  gradient.addColorStop(0.48, "#FFF8D8");
  gradient.addColorStop(1, "#DFF6FF");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  ctx.fillStyle = "#1A0A2E";
  ctx.font = "900 34px system-ui, sans-serif";
  ctx.letterSpacing = "3px";
  ctx.fillText("UNHAPPY BUSTER  /  PRIVATE STRESS ARCADE", 70, 85);
  ctx.letterSpacing = "0px";

  roundedRect(ctx, 60, 130, 960, 760, 64);
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#1A0A2E";
  ctx.stroke();

  roundedRect(ctx, 115, 195, 850, 470, 44);
  ctx.save();
  ctx.clip();
  try {
    const monster = await loadImage(data.monsterImage || "/stress-goblin.webp");
    drawCover(ctx, monster, 115, 195, 850, 470);
  } catch {
    ctx.fillStyle = "#F3E8FF";
    ctx.fillRect(115, 195, 850, 470);
    ctx.font = "180px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(data.monsterEmoji, CARD_WIDTH / 2, 500);
    ctx.textAlign = "left";
  }
  ctx.restore();

  ctx.fillStyle = data.outcome === "defeated" ? "#7C3AED" : "#1A0A2E";
  ctx.font = "900 62px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(data.headline, CARD_WIDTH / 2, 742);

  ctx.fillStyle = "#111827";
  ctx.font = "900 42px system-ui, sans-serif";
  ctx.fillText(data.monsterName.toUpperCase(), CARD_WIDTH / 2, 808);

  ctx.fillStyle = "#6B7280";
  ctx.font = "700 28px system-ui, sans-serif";
  ctx.fillText(`${data.arenaProgress}% ARCADE METER CLEARED`, CARD_WIDTH / 2, 855);
  ctx.textAlign = "left";

  roundedRect(ctx, 60, 930, 960, 275, 52);
  ctx.fillStyle = "#2D1B69";
  ctx.fill();

  ctx.fillStyle = "#FFD600";
  ctx.font = "900 26px system-ui, sans-serif";
  ctx.fillText("FINAL ROAST", 110, 990);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "800 42px system-ui, sans-serif";
  wrapText(ctx, `“${data.finalRoast}”`, 110, 1055, 850, 54, 3);

  ctx.fillStyle = "#4B5563";
  ctx.font = "700 25px system-ui, sans-serif";
  ctx.fillText("Fictional boss. No vent text. No real-person names. Just the win.", 70, 1285);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not export the victory card."));
    }, "image/png");
  });
}

export function downloadVictoryCard(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "unhappy-buster-victory.png";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
