import { afterEach, describe, it, expect, vi } from "vitest";
import { createExportJobs, runExportJobs } from "./export-jobs";
import { defaults } from "./film";
import { contactDefaults } from "./contact";
import { collageDefaults } from "./collage";
import { getExportOption } from "./export";
import type { Photo } from "./types/photo";
afterEach(() => vi.unstubAllGlobals());
const option = getExportOption("balanced");
function photos(count: number) {
  return Array.from(
    { length: count },
    (_, i) =>
      ({ id: String(i), name: "photo.png", settings: defaults }) as Photo,
  );
}
describe("shared export jobs", () => {
  it("produces uniquely named single images, collage pages and rolls without losing photos", () => {
    const all = photos(37);
    expect(
      createExportJobs(all, all, { kind: "single" }, option).map(
        (job) => job.name,
      ),
    ).toEqual(
      all.map((_, i) => `${String(i + 1).padStart(2, "0")}-photo-film.jpg`),
    );
    expect(
      createExportJobs(
        all,
        all,
        { kind: "contact", settings: contactDefaults, base: defaults },
        option,
      ).map((job) => job.name),
    ).toEqual(["film-block-roll-01.jpg", "film-block-roll-02.jpg"]);
    expect(
      createExportJobs(
        all,
        all.slice(0, 5),
        { kind: "collage", settings: { ...collageDefaults, slides: 3 } },
        option,
      ),
    ).toHaveLength(3);
  });
  it("does no allocation when a job has already been cancelled", async () => {
    const createElement = vi.fn();
    vi.stubGlobal("document", { createElement });
    expect(
      await runExportJobs(
        createExportJobs(photos(1), photos(1), { kind: "single" }, option),
        option,
        () => true,
      ),
    ).toEqual([]);
    expect(createElement).not.toHaveBeenCalled();
  });
  it("releases both export and thumbnail canvases even when rendering fails", async () => {
    const canvases: { width: number; height: number }[] = [];
    vi.stubGlobal("document", {
      createElement: () => {
        const c = { width: 300, height: 150 };
        canvases.push(c);
        return c;
      },
    });
    await expect(
      runExportJobs(
        [
          {
            name: "failed.jpg",
            draw: async () => {
              throw Error("failed");
            },
          },
        ],
        option,
        () => false,
      ),
    ).rejects.toThrow("failed");
    expect(canvases).toHaveLength(2);
    expect(canvases.every((c) => c.width === 0 && c.height === 0)).toBe(true);
  });
});
