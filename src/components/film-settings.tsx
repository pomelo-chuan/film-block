import { t } from "@/i18n";
import { useTranslation } from "react-i18next";
import { Check, Plus, CalendarDays } from "lucide-react";
import { presets, fonts, fontLabels, type Settings } from "@/film";
import { dateFonts, dateFontLabels } from "@/date-stamp";
import { formatCaptureDate, formatStampDate, dateFormats } from "@/photo-date";
import type { Photo } from "@/types/photo";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { Slider } from "./ui/slider";
import { Badge } from "./ui/badge";
import { TabsContent } from "./ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";
import { cn } from "@/lib/utils";
export function FilmSettings({
  shown,
  current,
  change,
}: {
  shown: Settings;
  current?: Photo;
  change: (patch: Partial<Settings>) => void;
}) {
  useTranslation();
  const fieldClass = "h-11! w-full text-sm";
  return (
    <>
      <TabsContent value="film" className="space-y-2 p-3">
        <div className="flex min-h-11 items-center justify-between gap-3">
          <Label
            htmlFor="frame-enabled"
            className="flex min-h-11 flex-1 cursor-pointer items-center"
          >
            {t("添加胶卷边框")}
          </Label>
          <Switch
            id="frame-enabled"
            checked={shown.frameEnabled}
            onCheckedChange={(checked) => change({ frameEnabled: checked })}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(["135", "120"] as const).map((f) => (
            <Button
              key={f}
              variant="outline"
              className={cn(
                "h-14 flex-col items-start gap-0.5 rounded-lg px-3 text-left",
                shown.format === f && "border-primary bg-primary/8",
              )}
              aria-label={t("选择 {{value0}} 胶卷", {
                value0: f,
              })}
              aria-pressed={shown.format === f}
              onClick={() => change({ format: f })}
            >
              <span className="flex w-full items-center justify-between text-lg font-semibold">
                {f}
                {shown.format === f && (
                  <Check className="size-4 text-primary" />
                )}
              </span>
              <span className="text-[11px] font-normal text-muted-foreground">
                {f === "135"
                  ? t("35 mm \u00B7 标准齿孔")
                  : t("61 mm \u00B7 无齿孔")}
              </span>
            </Button>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="base" className="space-y-3 p-3">
        <div className="flex flex-wrap gap-2" aria-label={t("片基颜色预设")}>
          {presets.map((p) => (
            <Button
              key={p.color}
              variant="ghost"
              size="icon"
              className={cn(
                "size-11 rounded-full border-2 p-1",
                shown.color === p.color
                  ? "border-primary"
                  : "border-transparent",
              )}
              aria-label={t(p.name)}
              aria-pressed={shown.color === p.color}
              title={t(p.name)}
              onClick={() => change({ color: p.color, ink: p.ink })}
            >
              <span
                className="flex size-8 items-center justify-center rounded-full border border-black/10"
                style={{ backgroundColor: p.color }}
              >
                {shown.color === p.color && (
                  <Check className="size-4" style={{ color: p.ink }} />
                )}
              </span>
            </Button>
          ))}
          <Label
            className="relative flex size-11 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed text-muted-foreground"
            title={t("自定义片基颜色")}
          >
            <Plus className="size-4" />
            <input
              type="color"
              aria-label={t("自定义片基颜色")}
              className="absolute inset-0 size-full cursor-pointer opacity-0"
              value={shown.color}
              onChange={(e) => change({ color: e.target.value })}
            />
          </Label>
        </div>
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {t(
              presets.find((p) => p.color === shown.color)?.name ??
                "自定义颜色",
            )}
          </span>
          <code>{shown.color.toUpperCase()}</code>
        </div>
        <div className="space-y-2">
          <Label htmlFor="texture" className="text-xs">
            {t("片基图案")}
          </Label>
          <Select
            value={shown.texture}
            onValueChange={(value) =>
              change({ texture: value as Settings["texture"] })
            }
          >
            <SelectTrigger
              id="texture"
              className={fieldClass}
              aria-label={t("片基图案")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="smooth" className="min-h-11">
                {t("纯色片基")}
              </SelectItem>
              <SelectItem value="grain" className="min-h-11">
                {t("细颗粒纹理")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </TabsContent>
      <TabsContent value="text" className="space-y-3 p-3">
        <div className="flex min-h-11 items-center justify-between gap-3">
          <Label
            htmlFor="text-enabled"
            className="flex min-h-11 flex-1 cursor-pointer items-center"
          >
            {t("显示片基文字")}
          </Label>
          <Switch
            id="text-enabled"
            aria-label={t("显示片基文字")}
            checked={shown.textEnabled}
            onCheckedChange={(checked) => change({ textEnabled: checked })}
          />
        </div>
        <fieldset
          disabled={!shown.textEnabled}
          className="min-w-0 space-y-3 disabled:opacity-45"
        >
          <div className="space-y-2">
            <Label htmlFor="edge-text" className="text-xs">
              {t("片基文字")}
            </Label>
            <Input
              id="edge-text"
              className="h-11 text-base sm:text-sm"
              maxLength={80}
              value={shown.text}
              onChange={(e) => change({ text: e.target.value })}
              placeholder={t("写下相机、胶卷或一句心情")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="font" className="text-xs">
              {t("像素字体")}
            </Label>
            <Select
              disabled={!shown.textEnabled}
              value={shown.font}
              onValueChange={(value) =>
                change({ font: value as Settings["font"] })
              }
            >
              <SelectTrigger
                id="font"
                className={fieldClass}
                aria-label={t("像素字体")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fonts.map((font) => (
                  <SelectItem key={font} value={font} className="min-h-11">
                    {t(fontLabels[font])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs">
              <Label htmlFor="font-size" className="text-xs">
                {t("文字大小")}
              </Label>
              <span className="tabular-nums text-muted-foreground">
                {shown.fontSize}
              </span>
            </div>
            <Slider
              id="font-size"
              aria-label={t("文字大小")}
              className="h-11"
              disabled={!shown.textEnabled}
              min={18}
              max={40}
              step={1}
              value={[shown.fontSize]}
              onValueChange={([value]) => change({ fontSize: value })}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground">
              {t("开源字体 \u00B7 支持中英文")}
            </span>
            <Label className="flex min-h-11 cursor-pointer items-center gap-2 text-xs">
              {t("字色")}
              <input
                type="color"
                aria-label={t("文字颜色")}
                className="size-9 cursor-pointer rounded-md border bg-transparent p-1"
                value={shown.ink}
                onChange={(e) => change({ ink: e.target.value })}
              />
            </Label>
          </div>
        </fieldset>
      </TabsContent>
      <TabsContent value="date" className="space-y-3 p-3">
        <div className="flex min-h-11 items-center justify-between gap-3">
          <Label
            htmlFor="date-stamp-enabled"
            className="flex min-h-11 flex-1 cursor-pointer items-center"
          >
            {t("自动印上照片日期")}
          </Label>
          <Switch
            id="date-stamp-enabled"
            aria-label={t("自动印上照片日期")}
            checked={shown.dateStampEnabled}
            onCheckedChange={(checked) => change({ dateStampEnabled: checked })}
          />
        </div>
        <fieldset
          disabled={!shown.dateStampEnabled}
          className="grid grid-cols-2 gap-3 disabled:opacity-45"
        >
          <div className="min-w-0 space-y-2">
            <Label htmlFor="date-font" className="text-xs">
              {t("日期字体")}
            </Label>
            <Select
              disabled={!shown.dateStampEnabled}
              value={shown.dateFont}
              onValueChange={(value) =>
                change({ dateFont: value as Settings["dateFont"] })
              }
            >
              <SelectTrigger
                id="date-font"
                className={fieldClass}
                aria-label={t("日期字体")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateFonts.map((font) => (
                  <SelectItem key={font} value={font} className="min-h-11">
                    {t(dateFontLabels[font])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor="date-format" className="text-xs">
              {t("日期格式")}
            </Label>
            <Select
              disabled={!shown.dateStampEnabled}
              value={shown.dateFormat}
              onValueChange={(value) =>
                change({
                  dateFormat: value as Settings["dateFormat"],
                })
              }
            >
              <SelectTrigger
                id="date-format"
                className={fieldClass}
                aria-label={t("日期格式")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateFormats.map((format) => (
                  <SelectItem key={format} value={format} className="min-h-11">
                    {format}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </fieldset>
        {current?.captureDate ? (
          <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="size-4 text-primary" />
              <time dateTime={formatCaptureDate(current.captureDate)}>
                {formatCaptureDate(current.captureDate)}
              </time>
              <Badge variant="secondary" className="ml-auto text-[10px]">
                {current.captureDate.source === "DateTimeOriginal"
                  ? t("拍摄日期")
                  : t("数字化日期")}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {shown.dateStampEnabled
                ? t("印记：") +
                  formatStampDate(current.captureDate, shown.dateFormat) +
                  t(" \u00B7 右下角")
                : t("本张日期印记已关闭")}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
            {current
              ? t("未读取到照片日期，本张不会添加日期印记。")
              : t("上传含日期信息的照片后自动显示日期印记。")}
          </div>
        )}
      </TabsContent>
    </>
  );
}
