import type { DateFormat } from "./photo-date";
import { drawDateStamp, type DateFont } from "./date-stamp";
import type { CaptureDate } from "./photo-date";
export const fonts = [
  "Fusion Pixel 12",
  "Fusion Pixel 10",
  "Cubic 11",
  "Doto",
  "Silkscreen",
  "Press Start 2P",
] as const;
export const fontLabels: Record<(typeof fonts)[number], string> = {
  "Fusion Pixel 12": "缝合像素 12px",
  "Fusion Pixel 10": "缝合像素 10px",
  "Cubic 11": "俐方体 Cubic 11",
  Doto: "Doto · 点阵",
  Silkscreen: "Silkscreen",
  "Press Start 2P": "Press Start 2P",
};
export type Settings = {
  format: "135" | "120";
  color: string;
  ink: string;
  text: string;
  textEnabled: boolean;
  font: (typeof fonts)[number];
  fontSize: number;
  texture: "smooth" | "grain";
  dateStampEnabled: boolean;
  dateFont: DateFont;
  dateFormat: DateFormat;
};
export const defaults: Settings = {
  format: "135",
  color: "#171815",
  ink: "#dda84d",
  text: "KODAK PORTRA 400",
  textEnabled: true,
  font: "Fusion Pixel 12",
  fontSize: 32,
  texture: "smooth",
  dateStampEnabled: true,
  dateFont: "seven-segment",
  dateFormat: "'YY MM DD",
};
const fontLoads = new Map<string, Promise<void>>();
export function loadFilmFont(
  font: Settings["font"],
  text = "FILM BLOCK",
): Promise<void> {
  const key = font + "\0" + text;
  const saved = fontLoads.get(key);
  if (saved) return saved;
  const promise = (async () => {
    try {
      await document.fonts.load(`400 24px "${font}"`, text || "0123456789");
      if (font !== "Fusion Pixel 12")
        await document.fonts.load(
          '400 24px "Fusion Pixel 12"',
          text || "0123456789",
        );
    } catch {
      fontLoads.delete(
        key,
      ); /* Canvas can still render using its local monospace fallback. */
    }
  })();
  if (fontLoads.size >= 32) fontLoads.delete(fontLoads.keys().next().value!);
  fontLoads.set(key, promise);
  return promise;
}
export function fontStack(font: Settings["font"]) {
  return `"${font}", "Fusion Pixel 12", monospace`;
}
export const presets = [
  { name: "反相黑", color: "#171815", ink: "#dda84d" },
  { name: "负片橙", color: "#b56532", ink: "#ffe0a3" },
  { name: "琥珀棕", color: "#8a482b", ink: "#f8cf80" },
  { name: "深棕色", color: "#493025", ink: "#efbb72" },
  { name: "黑白灰", color: "#a6a6a0", ink: "#292b28" },
  { name: "透明基", color: "#e6e2d7", ink: "#55534b" },
];
// Physical dimensions (mm), independently implemented from documented film geometry.
// See docs/film-geometry.md for the SpektraLab reference and aspect-ratio policy.
export const FILM_SPECS = {
  "135": {
    filmWidth: 35,
    imageAcross: 24,
    endMargin: 1,
    holeAlong: 1.98,
    holeAcross: 2.8,
    holePitch: 4.75,
    holeEdge: 2,
    holeRadius: 0.5,
  },
  "120": { filmWidth: 61, imageAcross: 56, endMargin: 1.7 },
} as const;
export const SCAN_PAPER = "#f7f5ef";
export function geometry(w: number, h: number, s: Settings) {
  const spec = FILM_SPECS[s.format],
    pxPerMm = Math.min(w, h) / spec.imageAcross;
  const rail = ((spec.filmWidth - spec.imageAcross) * pxPerMm) / 2,
    end = spec.endMargin * pxPerMm;
  const vertical = h > w;
  return {
    rail,
    end,
    vertical,
    pxPerMm,
    along: Math.max(w, h) + 2 * end,
    width: Math.ceil(w + 2 * (vertical ? rail : end)),
    height: Math.ceil(h + 2 * (vertical ? end : rail)),
    x: vertical ? rail : end,
    y: vertical ? end : rail,
  };
}
export function perforations(g: ReturnType<typeof geometry>, s: Settings) {
  if (s.format === "120") return [];
  const spec = FILM_SPECS["135"],
    p = g.pxPerMm;
  const length = g.vertical ? g.height : g.width,
    pitch = spec.holePitch * p;
  const count = Math.max(1, Math.floor((g.along + 1e-8) / pitch));
  // Centre one shared grid on both rails without stretching its standard pitch.
  const first = (length - (count - 1) * pitch) / 2;
  const across = spec.holeAcross * p,
    along = spec.holeAlong * p;
  return Array.from({ length: count * 2 }, (_, i) => {
    const center = first + Math.floor(i / 2) * pitch,
      side = i % 2;
    const cross = side
      ? (g.vertical ? g.width : g.height) -
        (spec.holeEdge + spec.holeAcross / 2) * p
      : (spec.holeEdge + spec.holeAcross / 2) * p;
    return {
      x: g.vertical ? cross - across / 2 : center - along / 2,
      y: g.vertical ? center - along / 2 : cross - across / 2,
      width: g.vertical ? across : along,
      height: g.vertical ? along : across,
      radius: spec.holeRadius * p,
    };
  });
}
function drawBaseTexture(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  g: ReturnType<typeof geometry>,
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, g.width, g.height);
  ctx.rect(g.x, g.y, w, h);
  ctx.clip("evenodd");
  // Fixed seed and normalized coordinates keep grain stable between preview/export.
  let seed = 137;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const dot = Math.min(w, h) / 650;
  for (let i = 0; i < 18000; i++) {
    const x = random() * g.width,
      y = random() * g.height;
    if (x > g.x && x < g.x + w && y > g.y && y < g.y + h) continue;
    ctx.fillStyle = i % 2 ? "rgba(255,244,216,.12)" : "rgba(0,0,0,.10)";
    ctx.fillRect(x, y, dot * (0.5 + random()), dot * (0.5 + random()));
  }
  ctx.restore();
}
export function renderFilm(
  canvas: HTMLCanvasElement,
  image: CanvasImageSource,
  w: number,
  h: number,
  s: Settings,
  index: number,
  maxSize = 6000,
  captureDate: CaptureDate | null = null,
) {
  const full = geometry(w, h, s);
  const factor = Math.min(1, maxSize / Math.max(full.width, full.height));
  w = Math.max(1, Math.floor(w * factor));
  h = Math.max(1, Math.floor(h * factor));
  const g = geometry(w, h, s);
  canvas.width = g.width;
  canvas.height = g.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("浏览器不支持 Canvas");
  ctx.fillStyle = s.color;
  ctx.fillRect(0, 0, g.width, g.height);
  ctx.drawImage(image, g.x, g.y, w, h);
  const { vertical, pxPerMm } = g;
  if (s.texture === "grain") drawBaseTexture(ctx, w, h, g);
  ctx.fillStyle = SCAN_PAPER;
  for (const hole of perforations(g, s)) {
    ctx.beginPath();
    ctx.roundRect(hole.x, hole.y, hole.width, hole.height, hole.radius);
    ctx.fill();
  }
  if (s.dateStampEnabled && captureDate)
    drawDateStamp(ctx, g.x, g.y, w, h, captureDate, s.dateFont, s.dateFormat);
  if (!s.textEnabled) return;
  const font = (pxPerMm * 1.7 * s.fontSize) / 40,
    textInset = pxPerMm * (s.format === "135" ? 1 : 1.25);
  ctx.fillStyle = s.ink;
  ctx.font = `400 ${font}px ${fontStack(s.font)}`;
  ctx.textBaseline = "alphabetic";
  const label = s.text.trim();
  const frame = String(index + 1).padStart(2, "0");
  ctx.save();
  if (vertical) {
    ctx.translate(g.width - textInset, g.height - g.y);
    ctx.rotate(-Math.PI / 2);
  } else ctx.translate(g.x, g.height - textInset);
  const available = (vertical ? h : w) * 0.78;
  const labelMetrics = ctx.measureText(label);
  ctx.fillText(
    label,
    0,
    (labelMetrics.actualBoundingBoxAscent -
      labelMetrics.actualBoundingBoxDescent) /
      2,
    available,
  );
  ctx.restore();
  ctx.save();
  if (vertical) {
    ctx.translate(textInset, g.y);
    ctx.rotate(Math.PI / 2);
  } else ctx.translate(g.x, textInset);
  const frameLabel = `${s.format}  ▸  ${frame} A`,
    frameMetrics = ctx.measureText(frameLabel);
  ctx.fillText(
    frameLabel,
    0,
    (frameMetrics.actualBoundingBoxAscent -
      frameMetrics.actualBoundingBoxDescent) /
      2,
    (vertical ? h : w) * 0.8,
  );
  ctx.restore();
}
export function safeFilename(name: string, extension: "png" | "jpg" = "png") {
  return (
    name.replace(/\.[^.]+$/, "").replace(/[<>:"/\\|?*\x00-\x1f]/g, "_") +
    `-film.${extension}`
  );
}

export async function loadDateFont(settings: Settings) {
  if (settings.dateStampEnabled && settings.dateFont !== "seven-segment")
    await loadFilmFont(settings.dateFont, "0123456789 /.-");
}
