import { t } from "@/i18n";
import { useTranslation } from "react-i18next";
import { Plus, X, Trash2 } from "lucide-react";
import type { Photo } from "@/types/photo";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "./ui/sheet";
import { Preview } from "./film-preview";
import { cn } from "@/lib/utils";
type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos: Photo[];
  selected: string[];
  active: string;
  busy: boolean;
  onAdd: () => void;
  onSelectAll: () => void;
  onChoose: (id: string) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onFrameChange?: (id: string, enabled: boolean) => void;
  returnFocus: () => void;
};
export function PhotoManager({
  open,
  onOpenChange,
  photos,
  selected,
  active,
  busy,
  onAdd,
  onSelectAll,
  onChoose,
  onToggle,
  onRemove,
  onFrameChange,
  returnFocus,
}: Props) {
  useTranslation();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocus();
        }}
        side="bottom"
        showCloseButton={false}
        className="mx-auto max-h-[85dvh] max-w-3xl gap-0 rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
      >
        <SheetHeader className="pr-16">
          <SheetTitle>{t("管理照片")}</SheetTitle>
          <SheetDescription>
            {t("已选择 {{selected}} / {{total}} 张 · 选择照片后可单独调整", {
              selected: selected.length,
              total: photos.length,
            })}
          </SheetDescription>
        </SheetHeader>
        <SheetClose asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 size-11"
            aria-label={t("关闭照片管理")}
          >
            <X />
          </Button>
        </SheetClose>
        <Separator />
        <div className="flex items-center justify-between gap-3 px-4 py-2">
          <Button variant="ghost" className="h-11 px-2" onClick={onSelectAll}>
            {selected.length === photos.length ? t("取消全选") : t("全选")}
          </Button>
          <Button
            variant="outline"
            className="h-11"
            disabled={busy}
            onClick={onAdd}
          >
            <Plus />
            {t("添加照片")}
          </Button>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain px-4 pb-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((p, i) => (
              <article
                key={p.id}
                className={cn(
                  "overflow-hidden rounded-xl border bg-muted/30",
                  active === p.id && "border-primary",
                )}
              >
                <Button
                  variant="ghost"
                  className="h-32 w-full rounded-none p-3"
                  aria-label={t("预览 {{value0}}", {
                    value0: p.name,
                  })}
                  onClick={() => {
                    onChoose(p.id);
                    onOpenChange(false);
                  }}
                >
                  <Preview
                    photo={p}
                    settings={p.settings}
                    index={i}
                    maxSize={360}
                  />
                </Button>
                <div className="flex min-h-12 items-center border-t">
                  <Label
                    className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-2 pl-3"
                    htmlFor={`manage-${p.id}`}
                  >
                    <Checkbox
                      id={`manage-${p.id}`}
                      className="size-5 shrink-0"
                      aria-label={t("选择 {{value0}}", {
                        value0: p.name,
                      })}
                      checked={selected.includes(p.id)}
                      onCheckedChange={() => onToggle(p.id)}
                    />
                    <span className="min-w-0 truncate text-xs">{p.name}</span>
                  </Label>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-11 shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label={t("删除 {{value0}}", {
                      value0: p.name,
                    })}
                    disabled={busy}
                    onClick={() => onRemove(p.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                {onFrameChange && (
                  <div className="flex min-h-11 items-center justify-between gap-2 border-t px-3">
                    <Label
                      htmlFor={`frame-${p.id}`}
                      className="min-w-0 flex-1 cursor-pointer py-3 text-xs"
                    >
                      {t("胶卷边框")}
                    </Label>
                    <Switch
                      id={`frame-${p.id}`}
                      aria-label={t("为 {{value0}} 添加胶卷边框", {
                        value0: p.name,
                      })}
                      checked={p.settings.frameEnabled}
                      disabled={busy}
                      onCheckedChange={(checked) =>
                        onFrameChange(p.id, checked)
                      }
                    />
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
