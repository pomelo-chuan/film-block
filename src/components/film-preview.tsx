import { t } from "@/i18n";
import { useTranslation } from "react-i18next";
import { memo, useCallback } from "react";
import { loadFilmFont, loadDateFont, renderFilm, type Settings } from "@/film";
import { useCanvasRenderer } from "@/hooks/use-canvas-renderer";
import type { Photo } from "@/types/photo";
export type { Photo } from "@/types/photo";
let demo: Promise<HTMLImageElement> | undefined;
function demoImage() {
  if (!demo)
    demo = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => {
        demo = undefined;
        reject(Error(t("示例图片加载失败")));
      };
      image.src = import.meta.env.BASE_URL + "demo.webp";
    });
  return demo;
}
export const Preview = memo(function Preview({
  photo,
  settings,
  index,
  maxSize = 1200,
}: {
  photo?: Photo;
  settings: Settings;
  index: number;
  maxSize?: number;
}) {
  useTranslation();
  const image = photo?.image,
    captureDate = photo?.captureDate,
    width = photo?.width,
    height = photo?.height;
  const draw = useCallback(
    async (canvas: HTMLCanvasElement, cancelled: () => boolean) => {
      const source = image ?? (await demoImage());
      if (settings.frameEnabled && settings.textEnabled)
        await loadFilmFont(settings.font, settings.text);
      if (captureDate) await loadDateFont(settings);
      if (!cancelled())
        renderFilm(
          canvas,
          source,
          width ?? source.naturalWidth,
          height ?? source.naturalHeight,
          settings,
          index,
          maxSize,
          captureDate ?? null,
        );
    },
    [image, captureDate, width, height, settings, index, maxSize],
  );
  const { ref, failed } = useCanvasRenderer(draw, maxSize <= 240 ? 120 : 0);
  return (
    <>
      <canvas
        className="film-canvas"
        ref={ref}
        hidden={failed}
        style={failed ? { display: "none" } : undefined}
        aria-label={
          photo
            ? t("{{value0}} 的胶片边框预览", {
                value0: photo.name,
              })
            : t("胶片边框示例预览")
        }
      />
      {failed && (
        <p role="alert" className="text-xs">
          {t("预览失败，请重试")}
        </p>
      )}
    </>
  );
});
