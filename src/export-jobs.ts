import {
  renderFilm,
  loadFilmFont,
  loadDateFont,
  safeFilename,
  type Settings,
} from "./film";
import { contactPages, renderContact, type ContactSettings } from "./contact";
import { collagePages, renderCollage, type CollageSettings } from "./collage";
import { encodeExport, type ExportOption } from "./export";
import { boundedSize, canvasBlob, withPhotoImage } from "./images";
import type { Photo } from "./types/photo";
export type ExportScene =
  | { kind: "single" }
  | { kind: "collage"; settings: CollageSettings }
  | { kind: "contact"; settings: ContactSettings; base: Settings };
export type ExportArtifact = { file: File; thumbnail: Blob };
type Job = {
  name: string;
  draw: (canvas: HTMLCanvasElement, cancelled: () => boolean) => Promise<void>;
};
export function createExportJobs(
  photos: Photo[],
  targets: Photo[],
  scene: ExportScene,
  option: ExportOption,
): Job[] {
  if (scene.kind === "contact")
    return contactPages(targets, scene.settings).map((page, i) => ({
      name: `film-block-roll-${String(i + 1).padStart(2, "0")}.${option.extension}`,
      draw: (canvas, cancelled) =>
        renderContact(
          canvas,
          page,
          scene.settings,
          scene.base,
          option.maxSize,
          i,
          cancelled,
          true,
        ),
    }));
  if (scene.kind === "collage")
    return collagePages(targets, scene.settings.slides).map((page, i) => ({
      name: `film-block-collage-${String(i + 1).padStart(2, "0")}.${option.extension}`,
      draw: (canvas, cancelled) =>
        renderCollage(
          canvas,
          page,
          photos,
          scene.settings,
          option.maxSize,
          cancelled,
          true,
        ),
    }));
  return targets.map((photo, i) => ({
    name: `${String(i + 1).padStart(2, "0")}-${safeFilename(photo.name, option.extension)}`,
    draw: async (canvas, cancelled) => {
      if (photo.settings.frameEnabled && photo.settings.textEnabled)
        await loadFilmFont(photo.settings.font, photo.settings.text);
      if (photo.captureDate) await loadDateFont(photo.settings);
      if (cancelled()) return;
      await withPhotoImage(photo, true, (image) => {
        if (!cancelled())
          renderFilm(
            canvas,
            image,
            photo.width,
            photo.height,
            photo.settings,
            photos.indexOf(photo),
            option.maxSize,
            photo.captureDate,
          );
      });
    },
  }));
}
export async function runExportJobs(
  jobs: Job[],
  option: ExportOption,
  cancelled: () => boolean,
): Promise<ExportArtifact[]> {
  const results: ExportArtifact[] = [];
  for (const job of jobs) {
    if (cancelled()) return [];
    const canvas = document.createElement("canvas"),
      thumb = document.createElement("canvas");
    try {
      await job.draw(canvas, cancelled);
      if (cancelled()) return [];
      const blob = await encodeExport(canvas, option);
      if (cancelled()) return [];
      const size = boundedSize(canvas.width, canvas.height, 240);
      thumb.width = size.width;
      thumb.height = size.height;
      thumb.getContext("2d")!.drawImage(canvas, 0, 0, size.width, size.height);
      const thumbnail = await canvasBlob(thumb, "image/webp", 0.8);
      if (cancelled()) return [];
      results.push({
        file: new File([blob], job.name, { type: blob.type }),
        thumbnail,
      });
    } finally {
      canvas.width = canvas.height = thumb.width = thumb.height = 0;
    }
    // Yield between files, allowing dismissal and cancellation even when fonts are already cached.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
  return results;
}
