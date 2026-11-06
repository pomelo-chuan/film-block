import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import {
  parseCaptureDate,
  captureDateFromMetadata,
  formatStampDate,
  dateFormats,
  readCaptureDate,
} from "./photo-date";
import { stampLayout } from "./date-stamp";

describe("real photograph dates", () => {
  it("prefers original capture date over the digitization date", () =>
    expect(
      captureDateFromMetadata({
        DateTimeOriginal: "1999:12:31 23:59:59",
        CreateDate: "2026:11:04 12:00:00",
      }),
    ).toEqual({ year: 1999, month: 12, day: 31, source: "DateTimeOriginal" }));
  it("uses the recorded calendar date without timezone conversion", () => {
    expect(parseCaptureDate("2024-01-01T00:15:00+14:00")?.day).toBe(1);
    expect(parseCaptureDate("2024-12-31T23:45:00-12:00")?.year).toBe(2024);
  });
  it("skips missing, malformed and impossible dates", () => {
    for (const value of [
      null,
      undefined,
      new Date(),
      42,
      "",
      "0000:00:00 00:00:00",
      "2023:02:29 12:00:00",
      "1900:02:29 12:00:00",
      "2024:04:31 12:00:00",
      "2024:01:01 24:00:00",
      "2024-01-01T12:00:00+99:99",
      "2024:01-01 12:00:00",
    ])
      expect(parseCaptureDate(value)).toBeNull();
    expect(parseCaptureDate("2000:02:29 12:00:00")).not.toBeNull();
  });
  it("does not use ModifyDate, filesystem times, filenames, or the current date", () => {
    for (const value of [
      { ModifyDate: "2026:11:04 00:00:00" },
      { lastModified: Date.now() },
      { name: "2024-12-25.jpg" },
      null,
    ])
      expect(captureDateFromMetadata(value)).toBeNull();
  });
  it("can fall back to a valid EXIF digital creation date", () =>
    expect(
      captureDateFromMetadata({
        DateTimeOriginal: "0000:00:00 00:00:00",
        CreateDate: "2024:02:29 09:10:11",
      }),
    ).toEqual({ year: 2024, month: 2, day: 29, source: "CreateDate" }));
  it("formats a compact-camera date with leading zeroes", () =>
    expect(formatStampDate(parseCaptureDate("2004:01:02 03:04:05")!)).toBe(
      "'04 01 02",
    ));
  for (const [width, height] of [
    [600, 400],
    [400, 600],
    [600, 600],
    [1200, 200],
  ])
    it(`places the entire stamp inside ${width}×${height} photograph`, () => {
      const x = 25,
        y = 15,
        layout = stampLayout(
          x,
          y,
          width,
          height,
          parseCaptureDate("2024:02:29 12:00:00")!,
        );
      expect(layout.x).toBeGreaterThan(x);
      expect(layout.y).toBeGreaterThan(y);
      expect(layout.x + layout.width).toBeLessThan(x + width);
      expect(layout.y + layout.height).toBeLessThan(y + height);
    });
});

describe("actual JPEG metadata extraction", () => {
  it("reads DateTimeOriginal from its EXIF IFD and preserves the recorded day", async () => {
    const file = await readFile(
      new URL("./test-fixtures/capture-date.jpg", import.meta.url),
    );
    expect(await readCaptureDate(file)).toEqual({
      year: 2024,
      month: 2,
      day: 29,
      source: "DateTimeOriginal",
    });
  });
  it("reads the digital creation date only when the original is unavailable", async () => {
    const file = await readFile(
      new URL("./test-fixtures/digital-date.jpg", import.meta.url),
    );
    expect(await readCaptureDate(file)).toEqual({
      year: 1995,
      month: 7,
      day: 8,
      source: "CreateDate",
    });
  });
  for (const filename of ["modified-only.jpg", "invalid-date.jpg"])
    it(`leaves ${filename} without a date stamp`, async () =>
      expect(
        await readCaptureDate(
          await readFile(
            new URL("./test-fixtures/" + filename, import.meta.url),
          ),
        ),
      ).toBeNull());
  it("does not reject uploads when metadata is corrupt or missing", async () =>
    expect(await readCaptureDate(new Uint8Array([255, 216, 0, 0]))).toBeNull());
});

describe("selectable camera date formats", () => {
  const date = parseCaptureDate("2004:01:02 03:04:05")!;
  it("retains leading zeroes and distinguishes day-first from month-first", () => {
    expect(dateFormats.map((format) => formatStampDate(date, format))).toEqual([
      "'04 01 02",
      "2004-01-02",
      "04.01.02",
      "02/01/2004",
      "01/02/2004",
    ]);
  });
  it("keeps every date format inside landscape, portrait and square photographs", () => {
    for (const format of dateFormats)
      for (const [w, h] of [
        [600, 400],
        [400, 600],
        [600, 600],
        [1200, 200],
      ]) {
        const layout = stampLayout(25, 15, w, h, date, format);
        expect(layout.x).toBeGreaterThan(25);
        expect(layout.x + layout.width).toBeLessThan(25 + w);
        expect(layout.y).toBeGreaterThan(15);
        expect(layout.y + layout.height).toBeLessThan(15 + h);
      }
  });
});
