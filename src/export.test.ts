import { describe, it, expect } from "vitest";
import { exportOptions, getExportOption, encodeExport } from "./export";
import { safeFilename } from "./film";

describe("photo export settings", () => {
  it("defaults to balanced JPEG for old, invalid or missing saved values", () => {
    for (const id of [null, undefined, "invalid"])
      expect(getExportOption(id)).toMatchObject({
        id: "balanced",
        mime: "image/jpeg",
        quality: 0.88,
        maxSize: 3200,
      });
  });
  it("passes the selected MIME and quality to the actual encoder", async () => {
    for (const option of exportOptions) {
      let received: unknown[] = [];
      const canvas = {
        toBlob: (callback: BlobCallback, mime?: string, quality?: number) => {
          received = [mime, quality];
          callback(new Blob(["image"], { type: mime }));
        },
      } as HTMLCanvasElement;
      const blob = await encodeExport(canvas, option);
      expect(blob.type).toBe(option.mime);
      expect(received).toEqual([option.mime, option.quality]);
      expect(safeFilename("旅途/photo.webp", option.extension)).toBe(
        `旅途_photo-film.${option.extension}`,
      );
    }
  });
  it("rejects missing blobs or silent PNG fallback instead of using a wrong extension", async () => {
    const jpeg = getExportOption("balanced");
    for (const blob of [null, new Blob(["png"], { type: "image/png" })]) {
      const canvas = {
        toBlob: (callback: BlobCallback) => callback(blob),
      } as HTMLCanvasElement;
      await expect(encodeExport(canvas, jpeg)).rejects.toThrow();
    }
  });
});
