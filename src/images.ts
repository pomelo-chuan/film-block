import type { Photo } from "./types/photo";
import type { Settings } from "./film";
import { readCaptureDate } from "./photo-date";

export const PREVIEW_LIMIT = 1280;
export const MAX_IMAGE_PIXELS = 100_000_000;
export function boundedSize(width: number, height: number, limit: number) {
  const factor = Math.min(1, limit / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * factor)),
    height: Math.max(1, Math.round(height * factor)),
  };
}
// Inspect common headers before allocating the full decoded bitmap. Other formats use decode fallback.
export function headerDimensions(
  buffer: ArrayBuffer,
): { width: number; height: number } | null {
  const view = new DataView(buffer),
    bytes = new Uint8Array(buffer);
  if (
    bytes.length >= 24 &&
    view.getUint32(0) === 0x89504e47 &&
    view.getUint32(4) === 0x0d0a1a0a
  )
    return { width: view.getUint32(16), height: view.getUint32(20) };
  if (bytes.length >= 10 && String.fromCharCode(...bytes.slice(0, 3)) === "GIF")
    return { width: view.getUint16(6, true), height: view.getUint16(8, true) };
  if (bytes.length < 4 || view.getUint16(0) !== 0xffd8) return null;
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if (marker === 0xda || marker === 0xd9) return null;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > bytes.length) return null;
    const length = view.getUint16(offset);
    if (length < 2 || offset + length > bytes.length) return null;
    if (
      [
        0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce,
        0xcf,
      ].includes(marker) &&
      length >= 7
    )
      return {
        width: view.getUint16(offset + 5),
        height: view.getUint16(offset + 3),
      };
    offset += length;
  }
  return null;
}
export function canvasBlob(
  canvas: HTMLCanvasElement,
  type = "image/webp",
  quality = 0.9,
): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(Error("无法生成图片"))),
      type,
      quality,
    ),
  );
}
async function decode(file: Blob) {
  const url = URL.createObjectURL(file),
    image = new Image();
  image.src = url;
  try {
    await image.decode();
    return { image, url };
  } catch (error) {
    image.src = "";
    URL.revokeObjectURL(url);
    throw error;
  }
}
function validateSize(width: number, height: number) {
  if (width < 1 || height < 1 || width * height > MAX_IMAGE_PIXELS)
    throw Error("图片尺寸过大");
}
export async function loadPhoto(
  file: File,
  settings: Settings,
): Promise<Photo> {
  const header = headerDimensions(
    await file.slice(0, 256 * 1024).arrayBuffer(),
  );
  if (header) validateSize(header.width, header.height);
  const source = await decode(file);
  let preview = source;
  try {
    const width = source.image.naturalWidth,
      height = source.image.naturalHeight;
    validateSize(width, height);
    const captureDate = await readCaptureDate(file),
      size = boundedSize(width, height, PREVIEW_LIMIT);
    if (size.width !== width || size.height !== height) {
      const canvas = document.createElement("canvas");
      try {
        canvas.width = size.width;
        canvas.height = size.height;
        canvas
          .getContext("2d")!
          .drawImage(source.image, 0, 0, size.width, size.height);
        preview = await decode(await canvasBlob(canvas));
      } finally {
        canvas.width = canvas.height = 0;
      }
    }
    if (preview !== source) {
      source.image.src = "";
      URL.revokeObjectURL(source.url);
    }
    return {
      id: crypto.randomUUID(),
      name: file.name,
      file,
      image: preview.image,
      url: preview.url,
      width,
      height,
      captureDate,
      settings: { ...settings },
    };
  } catch (error) {
    source.image.src = "";
    URL.revokeObjectURL(source.url);
    if (preview !== source) {
      preview.image.src = "";
      URL.revokeObjectURL(preview.url);
    }
    throw error;
  }
}
export function releasePhoto(photo: Photo) {
  photo.image.src = "";
  URL.revokeObjectURL(photo.url);
}
export async function withPhotoImage<T>(
  photo: Photo,
  original: boolean,
  draw: (image: HTMLImageElement) => T | Promise<T>,
): Promise<T> {
  if (!original || Math.max(photo.width, photo.height) <= PREVIEW_LIMIT)
    return draw(photo.image);
  const source = await decode(photo.file);
  try {
    return await draw(source.image);
  } finally {
    source.image.src = "";
    URL.revokeObjectURL(source.url);
  }
}
