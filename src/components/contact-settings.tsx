import { t } from "@/i18n";
import { useTranslation } from "react-i18next";
import type { ContactSettings } from "@/contact";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
export function ContactControls({
  settings,
  change,
  onSort,
}: {
  settings: ContactSettings;
  change: (patch: Partial<ContactSettings>) => void;
  onSort: () => void;
}) {
  useTranslation();
  return (
    <div className="space-y-4 p-3">
      <div className="space-y-2">
        <Label>{t("胶卷规格")}</Label>
        <ToggleGroup
          type="single"
          variant="outline"
          className="w-full"
          value={settings.format}
          onValueChange={(value) => {
            if (value === "135" || value === "120")
              change({ format: value, columns: value === "135" ? 6 : 3 });
          }}
          aria-label={t("整卷规格")}
        >
          <ToggleGroupItem value="135" className="h-11 flex-1">
            {t("135 \u00B7 36 张 / 卷")}
          </ToggleGroupItem>
          <ToggleGroupItem value="120" className="h-11 flex-1">
            {t("120 \u00B7 12 张 / 卷")}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="space-y-2">
        <Label>{t("每行照片")}</Label>
        <ToggleGroup
          type="single"
          variant="outline"
          className="w-full"
          value={String(settings.columns)}
          onValueChange={(value) => {
            if (value) change({ columns: Number(value) });
          }}
          aria-label={t("整卷每行照片")}
        >
          {(settings.format === "135" ? [3, 4, 6] : [2, 3, 4]).map((n) => (
            <ToggleGroupItem key={n} value={String(n)} className="h-11 flex-1">
              {t("{{count}} 张", { count: n })}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <Button variant="outline" className="h-11 w-full" onClick={onSort}>
        {t("按拍摄日期排序")}
      </Button>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {t(
          "无日期照片放在最后；也可长按照片条拖动，或使用预览上方箭头调整顺序。",
        )}
      </p>
      <div className="space-y-2">
        <Label htmlFor="contact-title">{t("卷名")}</Label>
        <Input
          id="contact-title"
          className="h-11 text-base"
          maxLength={24}
          value={settings.title}
          placeholder="ROLL"
          onChange={(e) => change({ title: e.target.value })}
        />
      </div>
      <div className="flex min-h-11 items-center justify-between">
        <Label htmlFor="contact-info">{t("显示整卷信息栏")}</Label>
        <Switch
          id="contact-info"
          checked={settings.infoEnabled}
          onCheckedChange={(infoEnabled) => change({ infoEnabled })}
        />
      </div>
      <div className="flex min-h-11 items-center justify-between">
        <Label htmlFor="contact-empty">{t("显示末行空白格")}</Label>
        <Switch
          id="contact-empty"
          checked={settings.emptyFrames}
          onCheckedChange={(emptyFrames) => change({ emptyFrames })}
        />
      </div>
      <Label className="flex min-h-11 items-center justify-between gap-2">
        {t("背景颜色")}
        <input
          type="color"
          aria-label={t("整卷背景颜色")}
          className="size-11 rounded border bg-transparent p-1"
          value={settings.background}
          onChange={(e) => change({ background: e.target.value })}
        />
      </Label>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {t(
          "照片自动匹配方向并居中裁切，填满画格且不拉伸。135 使用连续标准齿孔，120 无齿孔。使用统一片基，文字和日期沿用各张设置；信息栏日期仅取自本卷照片。",
        )}
      </p>
    </div>
  );
}
