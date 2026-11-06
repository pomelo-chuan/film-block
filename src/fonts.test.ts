import { afterEach, describe, it, expect, vi } from "vitest";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});
describe("font loading and graceful fallback", () => {
  it("deduplicates concurrent requests without forcing unrelated Chinese subsets", async () => {
    const load = vi.fn(async (..._args: unknown[]) => []);
    vi.stubGlobal("document", { fonts: { load } });
    const { loadFilmFont } = await import("./film");
    await Promise.all(
      Array.from({ length: 12 }, () =>
        loadFilmFont("Fusion Pixel 12", "KODAK"),
      ),
    );
    expect(load).toHaveBeenCalledTimes(1);
    expect(load.mock.calls[0][1]).toBe("KODAK");
  });
  it("continues rendering with local fallback when a font fails, and allows retry", async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(Error("offline"))
      .mockResolvedValue([]);
    vi.stubGlobal("document", { fonts: { load } });
    const { loadFilmFont } = await import("./film");
    await expect(
      loadFilmFont("Fusion Pixel 12", "旅行"),
    ).resolves.toBeUndefined();
    await loadFilmFont("Fusion Pixel 12", "旅行");
    expect(load).toHaveBeenCalledTimes(2);
  });
});
