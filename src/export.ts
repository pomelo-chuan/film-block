export const exportOptions = [
  {
    id: "compact",
    label: "轻量分享",
    mime: "image/jpeg",
    extension: "jpg",
    quality: 0.78,
    maxSize: 1920,
    description: "JPEG · 78% 质量 · 长边最多 1920px",
  },
  {
    id: "balanced",
    label: "均衡画质（推荐）",
    mime: "image/jpeg",
    extension: "jpg",
    quality: 0.88,
    maxSize: 3200,
    description: "JPEG · 88% 质量 · 长边最多 3200px",
  },
  {
    id: "high",
    label: "高画质",
    mime: "image/jpeg",
    extension: "jpg",
    quality: 0.95,
    maxSize: 6000,
    description: "JPEG · 95% 质量 · 长边最多 6000px",
  },
  {
    id: "lossless",
    label: "无损保存",
    mime: "image/png",
    extension: "png",
    quality: undefined,
    maxSize: 6000,
    description: "PNG · 无损压缩 · 长边最多 6000px，文件较大",
  },
] as const;
export type ExportOption = (typeof exportOptions)[number];
export const EXPORT_KEY = "film-block:export-quality";
export function getExportOption(id: unknown): ExportOption {
  return exportOptions.find((option) => option.id === id) ?? exportOptions[1];
}
export function readExportOption(): ExportOption {
  try {
    return getExportOption(window.localStorage.getItem(EXPORT_KEY));
  } catch {
    return getExportOption(null);
  }
}
export function rememberExportOption(id: string) {
  try {
    window.localStorage.setItem(EXPORT_KEY, id);
  } catch {
    /* Export is still available without storage. */
  }
}
export function encodeExport(
  canvas: HTMLCanvasElement,
  option: ExportOption,
): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => {
        if (!blob || blob.type !== option.mime) {
          reject(new Error("无法使用所选格式导出"));
          return;
        }
        resolve(blob);
      },
      option.mime,
      option.quality,
    ),
  );
}
export function formatFileSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
