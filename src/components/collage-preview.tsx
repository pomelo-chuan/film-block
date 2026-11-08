import { t } from "@/i18n";
import { useTranslation } from "react-i18next";
import { useCallback } from "react";
import { renderCollage, type CollageSettings } from "@/collage";
import { useCanvasRenderer } from "@/hooks/use-canvas-renderer";
import type { Photo } from "@/types/photo";
export function CollagePreview({
  photos,
  allPhotos,
  settings,
  label = t("多张拼图预览"),
}: {
  label?: string;
  photos: Photo[];
  allPhotos: Photo[];
  settings: CollageSettings;
}) {
  useTranslation();
  const draw = useCallback(
    (canvas: HTMLCanvasElement, cancelled: () => boolean) =>
      renderCollage(canvas, photos, allPhotos, settings, 1200, cancelled),
    [photos, allPhotos, settings],
  );
  const { ref, failed } = useCanvasRenderer(draw);
  if (!photos.length)
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center text-sm text-muted-foreground">
        <span>{t("添加照片，开始多张拼图")}</span>
        <span className="text-xs">{t("保留每张照片的胶片边框与日期")}</span>
      </div>
    );
  return (
    <>
      <canvas
        ref={ref}
        hidden={failed}
        style={failed ? { display: "none" } : undefined}
        className="film-canvas"
        aria-label={label}
      />
      {failed && (
        <p role="alert" className="text-sm">
          {t("拼图预览失败，请减少照片或重试")}
        </p>
      )}
    </>
  );
}
