import { t } from "@/i18n";
import {
  FILM_SPECS,
  fontStack,
  loadDateFont,
  loadFilmFont,
  type Settings,
} from "./film";
import { drawDateStamp } from "./date-stamp";
import { formatCaptureDate } from "./photo-date";
import type { Photo } from "./types/photo";
import { withPhotoImage } from "./images";
export type ContactSettings = {
  format: "135" | "120";
  columns: number;
  background: string;
  title: string;
  infoEnabled: boolean;
  emptyFrames: boolean;
};
export const contactDefaults: ContactSettings = {
  format: "135",
  columns: 6,
  background: "#090909",
  title: "ROLL",
  infoEnabled: true,
  emptyFrames: true,
};
export function contactCapacity(s: ContactSettings) {
  return s.format === "135" ? 36 : 12;
}
export function contactPages<T>(items: T[], s: ContactSettings) {
  const size = contactCapacity(s);
  return Array.from({ length: Math.ceil(items.length / size) }, (_, i) =>
    items.slice(i * size, (i + 1) * size),
  );
}
export function orderByCaptureDate<T extends Pick<Photo, "captureDate">>(
  items: T[],
): T[] {
  const key = (p: T) =>
    p.captureDate
      ? p.captureDate.year * 10000 +
        p.captureDate.month * 100 +
        p.captureDate.day
      : Infinity;
  return [...items].sort((a, b) => {
    const x = key(a),
      y = key(b);
    return x === y ? 0 : x - y;
  });
}
export function contactDateRange(photos: Pick<Photo, "captureDate">[]) {
  const dates = orderByCaptureDate(photos).flatMap((p) =>
    p.captureDate ? [formatCaptureDate(p.captureDate)] : [],
  );
  return dates.length
    ? dates[0] === dates.at(-1)
      ? dates[0]
      : `${dates[0]} – ${dates.at(-1)}`
    : "";
}
export function contactLayout(count: number, s: ContactSettings) {
  const columns = Math.min(9, Math.max(2, Math.floor(s.columns))),
    rows = Math.ceil(count / columns),
    is135 = s.format === "135";
  const frameWidth = is135 ? 36 : 56,
    frameHeight = is135 ? 24 : 56,
    filmHeight = is135 ? 35 : 61,
    gutter = is135 ? 2 : 4,
    margin = 6,
    rowGap = 4;
  const stripWidth = columns * (frameWidth + gutter),
    footerHeight = s.infoEnabled ? 11 : 0;
  const slots = Array.from({ length: rows * columns }, (_, i) => ({
    x: margin + (i % columns) * (frameWidth + gutter) + gutter / 2,
    y:
      margin +
      Math.floor(i / columns) * (filmHeight + rowGap) +
      (filmHeight - frameHeight) / 2,
    width: frameWidth,
    height: frameHeight,
    filled: i < count,
  }));
  return {
    width: stripWidth + margin * 2,
    height:
      margin * 2 +
      Math.max(0, rows * (filmHeight + rowGap) - rowGap) +
      footerHeight,
    margin,
    columns,
    rows,
    filmHeight,
    gutter,
    frameWidth,
    frameHeight,
    rowGap,
    stripWidth,
    footerHeight,
    slots,
  };
}
// Compare retained image area in both orientations; ties keep the decoded photo upright.
export function contactImageFit(
  imageWidth: number,
  imageHeight: number,
  width: number,
  height: number,
) {
  const target = width / height,
    aspect = imageWidth / imageHeight;
  const retention = (ratio: number) => Math.min(ratio / target, target / ratio);
  const rotated = retention(1 / aspect) > retention(aspect) + 1e-9;
  const orientedWidth = rotated ? imageHeight : imageWidth,
    orientedHeight = rotated ? imageWidth : imageHeight;
  const scale = Math.max(width / orientedWidth, height / orientedHeight);
  return {
    rotated,
    drawWidth: imageWidth * scale,
    drawHeight: imageHeight * scale,
    width: orientedWidth * scale,
    height: orientedHeight * scale,
  };
}
export async function renderContact(
  canvas: HTMLCanvasElement,
  photos: Photo[],
  s: ContactSettings,
  base: Settings,
  maxSize: number,
  rollIndex = 0,
  cancelled = () => false,
  originals = false,
) {
  const g = contactLayout(photos.length, s),
    unit = maxSize / Math.max(g.width, g.height);
  canvas.width = Math.max(1, Math.round(g.width * unit));
  canvas.height = Math.max(1, Math.round(g.height * unit));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw Error(t("浏览器不支持 Canvas"));
  ctx.fillStyle = s.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!photos.length) return;
  await loadFilmFont(
    base.font,
    `${s.title} ${base.text} ${contactDateRange(photos)}`,
  );
  if (cancelled()) return;
  for (let row = 0; row < g.rows; row++) {
    const y = (g.margin + row * (g.filmHeight + g.rowGap)) * unit;
    const count = s.emptyFrames
        ? g.columns
        : Math.min(g.columns, photos.length - row * g.columns),
      width = count * (g.frameWidth + g.gutter) * unit;
    ctx.fillStyle = base.color;
    ctx.fillRect(g.margin * unit, y, width, g.filmHeight * unit);
    if (base.texture === "grain") {
      let seed = 137 + row;
      const random = () => {
        seed = (seed * 16807) % 2147483647;
        return seed / 2147483647;
      };
      for (let dot = 0; dot < 1800; dot++) {
        ctx.fillStyle = dot % 2 ? "rgba(255,244,216,.1)" : "rgba(0,0,0,.12)";
        ctx.fillRect(
          g.margin * unit + random() * width,
          y + random() * g.filmHeight * unit,
          0.06 * unit,
          0.06 * unit,
        );
      }
    }
    if (s.format === "135") {
      const spec = FILM_SPECS["135"],
        pitch = spec.holePitch * unit,
        holes = Math.floor(width / pitch),
        first = (width - (holes - 1) * pitch) / 2;
      ctx.fillStyle = s.background;
      for (let i = 0; i < holes; i++)
        for (const rail of [
          spec.holeEdge,
          g.filmHeight - spec.holeEdge - spec.holeAcross,
        ]) {
          ctx.beginPath();
          ctx.roundRect(
            g.margin * unit + first + i * pitch - (spec.holeAlong * unit) / 2,
            y + rail * unit,
            spec.holeAlong * unit,
            spec.holeAcross * unit,
            spec.holeRadius * unit,
          );
          ctx.fill();
        }
    }
  }
  for (let i = 0; i < g.slots.length; i++) {
    if (cancelled()) return;
    const slot = g.slots[i],
      p = photos[i];
    if (!p && !s.emptyFrames) continue;
    const x = slot.x * unit,
      y = slot.y * unit,
      w = slot.width * unit,
      h = slot.height * unit;
    ctx.fillStyle = "#100e0c";
    ctx.fillRect(x, y, w, h);
    if (p) {
      await withPhotoImage(p, originals, (image) => {
        if (cancelled()) return;
        const fit = contactImageFit(p.width, p.height, w, h);
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        ctx.translate(x + w / 2, y + h / 2);
        if (fit.rotated) ctx.rotate(Math.PI / 2);
        ctx.drawImage(
          image,
          -fit.drawWidth / 2,
          -fit.drawHeight / 2,
          fit.drawWidth,
          fit.drawHeight,
        );
        ctx.restore();
      });
      if (cancelled()) return;
      if (p.settings.dateStampEnabled && p.captureDate) {
        await loadDateFont(p.settings);
        if (cancelled()) return;
        drawDateStamp(
          ctx,
          x,
          y,
          w,
          h,
          p.captureDate,
          p.settings.dateFont,
          p.settings.dateFormat,
        );
      }
    }
    const style = p?.settings ?? base;
    if (style.textEnabled) {
      await loadFilmFont(style.font, style.text);
      if (cancelled()) return;
      const rowY =
        (g.margin + Math.floor(i / g.columns) * (g.filmHeight + g.rowGap)) *
        unit;
      ctx.fillStyle = style.ink;
      ctx.font = `400 ${(unit * (s.format === "135" ? 1.05 : 1.3) * style.fontSize) / 32}px ${fontStack(style.font)}`;
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
      ctx.fillText(
        `${String(i + 1).padStart(2, "0")}  ${style.text.trim()}`,
        x,
        rowY + 1.5 * unit,
        w,
      );
      ctx.fillText(
        `${i + 1}  ▸  ${i + 1} A`,
        x,
        rowY + (g.filmHeight - 0.45) * unit,
        w,
      );
    }
  }
  if (s.infoEnabled) {
    const y = canvas.height - (g.margin + 7) * unit,
      x = g.margin * unit,
      w = g.stripWidth * unit;
    ctx.fillStyle = "#ece7d5";
    ctx.fillRect(x, y, w, 7 * unit);
    ctx.fillStyle = "#171815";
    ctx.font = `400 ${1.7 * unit}px ${fontStack(base.font)}`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(
      `${s.title.trim() || "ROLL"} ${String(rollIndex + 1).padStart(2, "0")}`,
      x + 2 * unit,
      y + 3.5 * unit,
      w * 0.26,
    );
    ctx.textAlign = "center";
    if (base.textEnabled)
      ctx.fillText(base.text.trim(), x + w / 2, y + 3.5 * unit, w * 0.32);
    ctx.textAlign = "right";
    const date = contactDateRange(photos);
    if (date) ctx.fillText(date, x + w - 2 * unit, y + 3.5 * unit, w * 0.34);
  }
}
