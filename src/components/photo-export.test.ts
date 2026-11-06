import { afterEach, describe, expect, it, vi } from "vitest";
import { canSharePhotos } from "./photo-export";
afterEach(() => vi.unstubAllGlobals());
describe("photo file sharing capability", () => {
  const files = [new File(["photo"], "photo.jpg", { type: "image/jpeg" })];
  it("requires actual file sharing, not merely URL sharing", () => {
    vi.stubGlobal("navigator", { share: vi.fn() });
    expect(canSharePhotos(files)).toBe(false);
    vi.stubGlobal("navigator", { share: vi.fn(), canShare: () => false });
    expect(canSharePhotos(files)).toBe(false);
  });
  it("checks the whole batch and permits individual fallback when a batch is rejected", () => {
    vi.stubGlobal("navigator", {
      share: vi.fn(),
      canShare: ({ files }: { files: File[] }) => files.length === 1,
    });
    expect(canSharePhotos([...files, ...files])).toBe(false);
    expect(canSharePhotos(files)).toBe(true);
    expect(canSharePhotos([])).toBe(false);
  });
  it("keeps manual saving available when a browser rejects the capability check", () => {
    vi.stubGlobal("navigator", {
      share: vi.fn(),
      canShare: () => {
        throw new TypeError("unsupported");
      },
    });
    expect(canSharePhotos(files)).toBe(false);
  });
});
