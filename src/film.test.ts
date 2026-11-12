import { afterEach, describe, it, expect, vi } from "vitest";
import * as dateStamp from "./date-stamp";
import {
  defaults,
  geometry,
  safeFilename,
  perforations,
  FILM_SPECS,
  renderFilm,
} from "./film";
afterEach(() => vi.restoreAllMocks());
describe("optional film borders", () => {
  for (const format of ["135", "120"] as const)
    for (const [width, height] of [
      [3600, 2400],
      [2400, 3600],
      [2400, 2400],
    ])
      it(`retains the entire ${width} × ${height} image without ${format} borders`, () => {
        const settings = { ...defaults, format, frameEnabled: false };
        const g = geometry(width, height, settings);
        expect(g).toMatchObject({ width, height, x: 0, y: 0, rail: 0, end: 0 });
        expect(perforations(g, settings)).toEqual([]);
      });

  it("omits all border artwork, respects the size limit and keeps the date stamp", () => {
    const stamp = vi
      .spyOn(dateStamp, "drawDateStamp")
      .mockImplementation(() => {});
    const context = {
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
    };
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => context,
    } as unknown as HTMLCanvasElement;
    const image = {} as CanvasImageSource;
    const date = {
      year: 2024,
      month: 6,
      day: 15,
      source: "DateTimeOriginal" as const,
    };
    renderFilm(
      canvas,
      image,
      3600,
      2400,
      { ...defaults, frameEnabled: false, texture: "grain" },
      0,
      1800,
      date,
    );
    expect([canvas.width, canvas.height]).toEqual([1800, 1200]);
    expect(context.drawImage).toHaveBeenCalledWith(image, 0, 0, 1800, 1200);
    expect(context.fillRect).not.toHaveBeenCalled();
    expect(context.fillText).not.toHaveBeenCalled();
    expect(stamp).toHaveBeenCalledWith(
      context,
      0,
      0,
      1800,
      1200,
      date,
      defaults.dateFont,
      defaults.dateFormat,
    );
  });
});
describe("fixed film dimensions", () => {
  it("maps a full 135 frame to 38 × 35 mm, retaining the whole 36 × 24 image", () => {
    const g = geometry(3600, 2400, defaults);
    expect(g.width).toBe(3800);
    expect(g.height).toBe(3500);
    expect(g.x).toBe(100);
    expect(g.y).toBe(550);
    expect(g.pxPerMm).toBe(100);
    expect(g.width - 2 * g.x).toBe(3600);
    expect(g.height - 2 * g.y).toBe(2400);
  });
  it("rotates the same layout for portrait frames", () => {
    const g = geometry(2400, 3600, defaults);
    expect(g.vertical).toBe(true);
    expect(g.width).toBe(3500);
    expect(g.height).toBe(3800);
  });
  it("uses a 61 mm strip around a 56 mm image for 120", () => {
    const g = geometry(5600, 5600, { ...defaults, format: "120" });
    expect(g.height).toBe(6100);
    expect(g.width).toBe(5940);
    expect(g.width - 2 * g.x).toBe(5600);
    expect(g.height - 2 * g.y).toBe(5600);
    expect(perforations(g, { ...defaults, format: "120" })).toEqual([]);
  });
  it("sanitizes export names", () =>
    expect(safeFilename("trip/photo.jpeg")).toBe("trip_photo-film.png"));
});
describe("135 standard perforations", () => {
  for (const [w, h] of [
    [3600, 2400],
    [2400, 3600],
    [600, 400],
    [400, 600],
    [2400, 2400],
    [6000, 2400],
  ]) {
    it(`keeps millimetre dimensions and paired pitch for ${w} × ${h}`, () => {
      const g = geometry(w, h, defaults),
        holes = perforations(g, defaults),
        spec = FILM_SPECS["135"];
      for (let i = 0; i < holes.length; i++) {
        const p = holes[i];
        expect((g.vertical ? p.width : p.height) / g.pxPerMm).toBeCloseTo(
          spec.holeAcross,
        );
        expect((g.vertical ? p.height : p.width) / g.pxPerMm).toBeCloseTo(
          spec.holeAlong,
        );
        expect(p.radius / g.pxPerMm).toBeCloseTo(0.5);
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.x + p.width).toBeLessThanOrEqual(g.width);
        expect(p.y + p.height).toBeLessThanOrEqual(g.height);
        expect(
          p.x + p.width <= g.x ||
            p.x >= g.x + w ||
            p.y + p.height <= g.y ||
            p.y >= g.y + h,
        ).toBe(true);
        if (i >= 2) {
          const q = holes[i - 2];
          expect((g.vertical ? p.y - q.y : p.x - q.x) / g.pxPerMm).toBeCloseTo(
            spec.holePitch,
          );
        }
        if (i % 2 === 1) {
          const q = holes[i - 1];
          expect(g.vertical ? p.y : p.x).toBeCloseTo(g.vertical ? q.y : q.x);
        }
      }
      const first = holes[0];
      expect((g.vertical ? first.x : first.y) / g.pxPerMm).toBeCloseTo(
        spec.holeEdge,
      );
    });
  }
  it("has exactly eight holes per rail in full 3:2 frames at different resolutions", () => {
    for (const [w, h] of [
      [3600, 2400],
      [600, 400],
      [400, 600],
      [300, 200],
    ])
      expect(perforations(geometry(w, h, defaults), defaults)).toHaveLength(16);
  });
});
