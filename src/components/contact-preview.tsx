import { t } from "@/i18n";
import { useTranslation } from "react-i18next";
import { useCallback, useMemo } from "react";
import { contactLayout, renderContact, type ContactSettings } from "@/contact";
import { useCanvasRenderer } from "@/hooks/use-canvas-renderer";
import { useCanvasBounds } from "@/hooks/use-canvas-bounds";
import type { Settings } from "@/film";
import type { Photo } from "@/types/photo";
export function ContactPreview({
  photos,
  settings,
  base,
  index,
  active,
  onSelect,
  label = t("整卷展示预览"),
}: {
  photos: Photo[];
  settings: ContactSettings;
  base: Settings;
  index: number;
  active: string;
  onSelect: (id: string) => void;
  label?: string;
}) {
  useTranslation();
  const draw = useCallback(
    (canvas: HTMLCanvasElement, cancelled: () => boolean) =>
      renderContact(canvas, photos, settings, base, 1600, index, cancelled),
    [photos, settings, base, index],
  );
  const { ref, failed } = useCanvasRenderer(draw),
    bounds = useCanvasBounds(ref, photos.length > 0);
  const geometry = useMemo(
    () => contactLayout(photos.length, settings),
    [photos.length, settings],
  );
  const at = photos.findIndex((photo) => photo.id === active),
    slot = geometry.slots[at];
  if (!photos.length)
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center text-sm text-muted-foreground">
        <span>{t("添加照片，查看整卷胶片")}</span>
        <span className="text-xs">
          {t("连续胶片条 \u00B7 格号 \u00B7 整卷信息")}
        </span>
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
        onClick={(event) => {
          const canvas = ref.current;
          if (!canvas) return;
          const rect = canvas.getBoundingClientRect(),
            x = ((event.clientX - rect.left) / rect.width) * geometry.width,
            y = ((event.clientY - rect.top) / rect.height) * geometry.height;
          const hit = geometry.slots.findIndex(
            (r) =>
              r.filled &&
              x >= r.x &&
              x <= r.x + r.width &&
              y >= r.y &&
              y <= r.y + r.height,
          );
          if (hit >= 0) onSelect(photos[hit].id);
        }}
      />
      {slot && bounds.width > 0 && !failed && (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={bounds}
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
        >
          <rect
            x={slot.x}
            y={slot.y}
            width={slot.width}
            height={slot.height}
            fill="none"
            stroke="#ffbd65"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
      {failed && (
        <p role="alert" className="text-sm">
          {t("整卷预览失败，请减少照片后重试")}
        </p>
      )}
    </>
  );
}
