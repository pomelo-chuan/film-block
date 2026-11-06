import { useEffect, useRef, useState } from "react";
import { Download, LoaderCircle, Share2 } from "lucide-react";
import { Label } from "./ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";
import { exportOptions, getExportOption } from "@/export";
import { Button } from "@/components/ui/button";
import { contactPages, type ContactSettings } from "@/contact";
import type { Settings } from "@/film";
import { collagePages, type CollageSettings } from "@/collage";
import type { Photo } from "@/types/photo";
import {
  createExportJobs,
  runExportJobs,
  type ExportScene,
} from "@/export-jobs";
import { formatFileSize, type ExportOption } from "@/export";

type Prepared = { file: File; url: string; thumbnailUrl: string };
export function canSharePhotos(files: File[]) {
  try {
    return (
      files.length > 0 &&
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files })
    );
  } catch {
    return false;
  }
}
function download(file: Blob, name: string) {
  const url = URL.createObjectURL(file),
    link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  // Safari may consume the URL after the click handler has returned.
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
export function PhotoExport({
  photos,
  targets,
  option,
  busy,
  setBusy,
  notify,
  onAdd,
  collage,
  contact,
  base,
  onOptionChange,
}: {
  contact?: ContactSettings;
  base?: Settings;
  collage?: CollageSettings;
  photos: Photo[];
  targets: Photo[];
  option: ExportOption;
  onOptionChange: (option: ExportOption) => void;
  busy: boolean;
  setBusy: (value: boolean) => void;
  notify: (message: string) => void;
  onAdd: () => void;
}) {
  const [prepared, setPrepared] = useState<Prepared[]>([]);
  const version = useRef(0);
  const targetIds = targets.map((photo) => photo.id).join(",");
  useEffect(() => {
    version.current++;
    setPrepared([]);
    return () => {
      version.current++;
    };
  }, [photos, option, targetIds, collage, contact, base]);
  useEffect(
    () => () => {
      prepared.forEach((photo) => {
        URL.revokeObjectURL(photo.url);
        URL.revokeObjectURL(photo.thumbnailUrl);
      });
    },
    [prepared],
  );
  async function prepare() {
    if (!targets.length) {
      onAdd();
      return;
    }
    setBusy(true);
    const revision = version.current;
    try {
      const scene: ExportScene =
        contact && base
          ? { kind: "contact", settings: contact, base }
          : collage
            ? { kind: "collage", settings: collage }
            : { kind: "single" };
      const results = await runExportJobs(
        createExportJobs(photos, targets, scene, option),
        option,
        () => revision !== version.current,
      );
      if (revision !== version.current) return;
      setPrepared(
        results.map(({ file, thumbnail }) => ({
          file,
          url: URL.createObjectURL(file),
          thumbnailUrl: URL.createObjectURL(thumbnail),
        })),
      );
    } catch {
      notify("照片处理失败，请减少照片数量或降低导出质量后重试");
    } finally {
      setBusy(false);
    }
  }
  // Called directly by a second tap: async image rendering must not consume iOS's user activation.
  async function share(files: File[]) {
    setBusy(true);
    try {
      await navigator.share({ files });
      notify("分享操作已完成，请在相册中确认照片");
    } catch (error) {
      if (!(
        error &&
        typeof error === "object" &&
        "name" in error &&
        error.name === "AbortError"
      ))
        notify("无法打开系统分享，请尝试逐张分享，或打开下方大图长按存储");
    } finally {
      setBusy(false);
    }
  }
  async function zip() {
    setBusy(true);
    try {
      const Zip = (await import("jszip")).default,
        archive = new Zip();
      prepared.forEach(({ file }) => archive.file(file.name, file));
      download(await archive.generateAsync({ type: "blob" }), "film-block.zip");
      notify("压缩包已开始下载");
    } catch {
      notify("压缩包下载失败，请尝试逐张保存");
    } finally {
      setBusy(false);
    }
  }
  const files = prepared.map((photo) => photo.file),
    shareable = canSharePhotos(files);
  return (
    <div className="space-y-3">
      <div className="min-w-0 space-y-1.5">
        <Label
          htmlFor="export-quality"
          className="text-xs text-muted-foreground"
        >
          导出质量
        </Label>
        <Select
          disabled={busy}
          value={option.id}
          onValueChange={(value) => onOptionChange(getExportOption(value))}
        >
          <SelectTrigger
            id="export-quality"
            aria-label="导出质量"
            className="h-11! w-full bg-background text-xs"
          >
            <SelectValue>
              {option.id === "balanced" ? "均衡（推荐）" : option.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {exportOptions.map((item) => (
              <SelectItem key={item.id} value={item.id} className="min-h-12">
                <div className="flex flex-col gap-1">
                  <span>{item.label}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {item.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {!prepared.length ? (
        <Button
          className="h-11 w-full"
          disabled={busy || (photos.length > 0 && !targets.length)}
          onClick={() => void prepare()}
        >
          {busy ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Share2 className="size-4" />
          )}
          {busy
            ? "正在准备照片…"
            : photos.length
              ? contact
                ? `准备保存 ${contactPages(targets, contact).length} 卷胶片`
                : collage
                  ? `准备保存 ${collagePages(targets, collage.slides).length} 页拼图`
                  : `准备保存 ${targets.length} 张照片`
              : "添加照片"}
        </Button>
      ) : (
        <>
          <div role="status" className="text-sm">
            已准备 {prepared.length} 张 ·{" "}
            {formatFileSize(
              files.reduce((total, file) => total + file.size, 0),
            )}
          </div>
          {shareable && (
            <Button
              className="h-11 w-full"
              disabled={busy}
              onClick={() => void share(files)}
            >
              <Share2 className="size-4" />
              保存到相册 / 分享
              {prepared.length > 1 ? ` ${prepared.length} 张` : ""}
            </Button>
          )}
          <p className="text-xs leading-relaxed text-muted-foreground">
            {shareable
              ? "iPhone：在系统分享菜单选择「存储图像」，可一次保存多张。"
              : "点击「打开大图」后，在 iPhone 上长按选择「存储到照片」。"}
            取消分享后可再次尝试。
          </p>
          <div className="grid grid-cols-2 gap-3" aria-label="待保存照片">
            {prepared.map(({ file, url, thumbnailUrl }) => (
              <article
                key={file.name}
                className="min-w-0 space-y-2 rounded-lg border p-2"
              >
                <a
                  className="relative block"
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`打开大图 ${file.name}`}
                >
                  <img
                    src={thumbnailUrl}
                    onContextMenu={(event) => event.preventDefault()}
                    alt={file.name}
                    className="h-32 w-full select-none rounded object-contain [-webkit-touch-callout:none]"
                    loading="lazy"
                  />
                  <span className="pointer-events-none absolute right-1 bottom-1 rounded bg-background/90 px-2 py-1 text-[10px]">
                    打开大图
                  </span>
                </a>
                <p
                  className="truncate text-[10px] text-muted-foreground"
                  title={file.name}
                >
                  {file.name}
                </p>
                {canSharePhotos([file]) && (
                  <Button
                    variant="outline"
                    className="h-11 w-full text-xs"
                    disabled={busy}
                    onClick={() => void share([file])}
                  >
                    <Share2 className="size-3.5" />
                    保存这张
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="h-11 w-full text-xs"
                  disabled={busy}
                  onClick={() => download(file, file.name)}
                >
                  <Download className="size-3.5" />
                  下载这张
                </Button>
              </article>
            ))}
          </div>
          {prepared.length > 1 && (
            <Button
              variant="outline"
              className="h-11 w-full"
              disabled={busy}
              onClick={() => void zip()}
            >
              <Download className="size-4" />
              下载压缩包（备用）
            </Button>
          )}
        </>
      )}
    </div>
  );
}
