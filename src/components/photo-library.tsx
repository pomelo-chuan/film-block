import { t } from "@/i18n";
import { useTranslation } from "react-i18next";
import { lazy, Suspense, type RefObject } from "react";
import { Layers, Plus } from "lucide-react";
import type { Photo } from "@/types/photo";
import { Button } from "./ui/button";
const PhotoStrip = lazy(() =>
  import("./photo-strip").then((module) => ({
    default: module.PhotoStrip,
  })),
);
type Props = {
  photos: Photo[];
  selected: string[];
  active: string;
  busy: boolean;
  managerTrigger: RefObject<HTMLButtonElement | null>;
  addTrigger: RefObject<HTMLButtonElement | null>;
  onManage: () => void;
  onAdd: () => void;
  onChoose: (id: string) => void;
  onActivate: (id: string) => void;
  onReorder: (from: string, to: string) => void;
};
export function PhotoLibrary({
  photos,
  selected,
  active,
  busy,
  managerTrigger,
  addTrigger,
  onManage,
  onAdd,
  onChoose,
  onActivate,
  onReorder,
}: Props) {
  useTranslation();
  return (
    <section className="editor-library" aria-label={t("照片列表")}>
      <div className="filmstrip" aria-label={t("照片缩略图")}>
        {photos.length > 0 && (
          <Button
            ref={managerTrigger}
            variant="ghost"
            className="size-[60px] shrink-0 flex-col gap-1 rounded-lg border bg-muted/40 text-muted-foreground"
            aria-label={t("管理照片")}
            title={t("管理照片")}
            disabled={busy}
            onClick={onManage}
          >
            <Layers className="size-5" />
            <span className="text-[10px]">{t("选择")}</span>
          </Button>
        )}
        <Button
          ref={addTrigger}
          variant="ghost"
          className="editor-add size-[60px] shrink-0 rounded-lg border bg-muted/60 text-primary"
          aria-label={t("添加照片")}
          title={t("添加照片")}
          disabled={busy}
          onClick={onAdd}
        >
          <Plus className="size-7!" />
        </Button>
        {photos.length > 0 && (
          <Suspense fallback={null}>
            <PhotoStrip
              photos={photos}
              selected={selected}
              active={active}
              busy={busy}
              onChoose={onChoose}
              onActivate={onActivate}
              onReorder={onReorder}
            />
          </Suspense>
        )}
      </div>
    </section>
  );
}
