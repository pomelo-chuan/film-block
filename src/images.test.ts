import { afterEach, describe, it, expect, vi } from "vitest";
import {
  boundedSize,
  headerDimensions,
  loadPhoto,
  MAX_IMAGE_PIXELS,
} from "./images";
import { defaults } from "./film";
afterEach(() => vi.unstubAllGlobals());
function png(width: number, height: number) {
  const data = new ArrayBuffer(24),
    v = new DataView(data);
  v.setUint32(0, 0x89504e47);
  v.setUint32(4, 0x0d0a1a0a);
  v.setUint32(16, width);
  v.setUint32(20, height);
  return data;
}
describe("image preview memory bounds", () => {
  it("bounds previews without upscaling or changing the aspect ratio beyond pixel rounding", () => {
    expect(boundedSize(4000, 3000, 1280)).toEqual({ width: 1280, height: 960 });
    expect(boundedSize(3000, 4000, 1280)).toEqual({ width: 960, height: 1280 });
    expect(boundedSize(80, 120, 1280)).toEqual({ width: 80, height: 120 });
  });
  it("reads PNG, GIF and JPEG dimensions from headers and tolerates truncated data", () => {
    expect(headerDimensions(png(4000, 3000))).toEqual({
      width: 4000,
      height: 3000,
    });
    expect(
      headerDimensions(
        Uint8Array.from([71, 73, 70, 56, 57, 97, 0x80, 2, 0xe0, 1]).buffer,
      ),
    ).toEqual({ width: 640, height: 480 });
    expect(
      headerDimensions(
        Uint8Array.from([255, 216, 255, 192, 0, 7, 8, 1, 224, 2, 128]).buffer,
      ),
    ).toEqual({ width: 640, height: 480 });
    expect(headerDimensions(new ArrayBuffer(4))).toBeNull();
    expect(
      headerDimensions(Uint8Array.from([255, 216, 255, 192, 0, 99]).buffer),
    ).toBeNull();
  });
  it("rejects oversized common formats before an Image is allocated", async () => {
    const image = vi.fn();
    vi.stubGlobal("Image", image);
    expect(20_000 * 20_000).toBeGreaterThan(MAX_IMAGE_PIXELS);
    await expect(
      loadPhoto(
        new File([png(20_000, 20_000)], "huge.png", { type: "image/png" }),
        defaults,
      ),
    ).rejects.toThrow("图片尺寸过大");
    expect(image).not.toHaveBeenCalled();
  });
});
