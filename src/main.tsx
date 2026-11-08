import { LanguageSwitcher } from "@/components/language-switcher";
import { t, i18n } from "@/i18n";
import { useTranslation } from "react-i18next";
import { FeatureBoundary } from "@/components/feature-boundary";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  lazy,
  Suspense,
} from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Film,
  Layers,
  LoaderCircle,
  Moon,
  Sun,
  Trash2,
  X,
  Settings2,
  Palette,
  Type,
  CalendarDays,
  Images,
  LayoutGrid,
  Image as ImageIcon,
} from "lucide-react";
import { defaults, type Settings } from "./film";
import "@fontsource/silkscreen/latin-400.css";
import "@fontsource/press-start-2p/latin-400.css";
import "@fontsource/doto/latin-400.css";
import { readLettering, saveLettering } from "./lettering";
import {
  getInitialTheme,
  applyTheme,
  rememberTheme,
  type Theme,
} from "./theme";
import { readExportOption, rememberExportOption } from "./export";
import {
  contactDefaults,
  contactPages,
  orderByCaptureDate,
  type ContactSettings,
} from "./contact";
import { ContactPreview } from "@/components/contact-preview";
import { collageDefaults, collagePages, type CollageSettings } from "./collage";
import { PreviewCarousel } from "@/components/preview-carousel";
import { CollagePreview } from "@/components/collage-preview";
import { Preview } from "@/components/film-preview";
import type { Photo } from "@/types/photo";
import { loadPhoto, releasePhoto } from "./images";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import "./style.css";
const ContactControls = lazy(() =>
  import("@/components/contact-settings").then((module) => ({
    default: module.ContactControls,
  })),
);
const CollageControls = lazy(() =>
  import("@/components/collage-settings").then((module) => ({
    default: module.CollageControls,
  })),
);
const PhotoExport = lazy(() =>
  import("@/components/photo-export").then((module) => ({
    default: module.PhotoExport,
  })),
);
const FilmSettings = lazy(() =>
  import("@/components/film-settings").then((module) => ({
    default: module.FilmSettings,
  })),
);
const PhotoLibrary = lazy(() =>
  import("@/components/photo-library").then((module) => ({
    default: module.PhotoLibrary,
  })),
);
const PhotoManager = lazy(() =>
  import("@/components/photo-manager").then((module) => ({
    default: module.PhotoManager,
  })),
);
type EditorPanel =
  "contact" | "layout" | "film" | "base" | "text" | "date" | "export";
function App() {
  useTranslation();
  const [mode, setMode] = useState<"single" | "collage" | "contact">("single");
  const [contact, setContact] = useState<ContactSettings>(contactDefaults);
  function changeContact(patch: Partial<ContactSettings>) {
    const next = { ...contact, ...patch };
    setContact(next);
    const at = contactPages(target, next).findIndex((sheet) =>
      sheet.some((photo) => photo.id === active),
    );
    setPage(Math.max(0, at));
  }
  const [collage, setCollage] = useState<CollageSettings>(collageDefaults),
    [page, setPage] = useState(0);
  function changeCollage(patch: Partial<CollageSettings>) {
    setCollage((value) => ({ ...value, ...patch }));
    if (patch.slides !== undefined) setPage(0);
  }
  function movePhoto(direction: number) {
    const order =
        mode !== "single" && scope === "selected"
          ? photos.filter((photo) => selected.includes(photo.id))
          : photos,
      from = order.findIndex((photo) => photo.id === active),
      to = from + direction;
    if (from < 0 || to < 0 || to >= order.length) return;
    const a = photos.indexOf(order[from]),
      b = photos.indexOf(order[to]),
      next = [...photos];
    [next[a], next[b]] = [next[b], next[a]];
    applyPhotoOrder(next);
  }
  const [panel, setPanel] = useState<EditorPanel>("film"),
    [panelOpen, setPanelOpen] = useState(false);
  const [lastTool, setLastTool] =
    useState<Exclude<EditorPanel, "export">>("film");
  const panelTrigger = useRef<HTMLElement | null>(null);
  function openPanel(value: EditorPanel, trigger: HTMLElement) {
    panelTrigger.current = trigger;
    setPanel(value);
    if (value !== "export") setLastTool(value);
    setPanelOpen(true);
  }
  const [manageOpen, setManageOpen] = useState(false);
  const [exportOption, setExportOption] = useState(readExportOption);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    rememberTheme(next);
  }
  const [photos, setPhotos] = useState<Photo[]>([]),
    [selected, setSelected] = useState<string[]>([]),
    [active, setActive] = useState<string>(""),
    [settings, setSettings] = useState<Settings>(() => ({
      ...defaults,
      ...readLettering(),
    })),
    [scope, setScope] = useState<"all" | "selected">("all"),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [drag, setDrag] = useState(false);
  const managerTrigger = useRef<HTMLButtonElement>(null),
    addTrigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null),
    resources = useRef(new Map<string, Photo>());
  const current = photos.find((p) => p.id === active);
  const shown = current?.settings ?? settings;
  const index = Math.max(
    0,
    photos.findIndex((p) => p.id === active),
  );
  useEffect(() => {
    saveLettering(settings);
  }, [settings]);
  useEffect(
    () => () => {
      resources.current.forEach(releasePhoto);
    },
    [],
  );
  useEffect(() => {
    const clear = () => setMessage("");
    i18n.on("languageChanged", clear);
    return () => {
      i18n.off("languageChanged", clear);
    };
  }, []);
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 6500);
    return () => clearTimeout(t);
  }, [message]);
  function change(patch: Partial<Settings>) {
    if (scope === "selected" && photos.length && !selected.length) {
      setMessage(t("请先勾选要调整的照片"));
      return;
    }
    setSettings((s) => ({ ...s, ...patch }));
    setPhotos((ps) =>
      ps.map((p) =>
        scope === "all" || selected.includes(p.id)
          ? { ...p, settings: { ...p.settings, ...patch } }
          : p,
      ),
    );
  }
  async function upload(files: FileList | File[]) {
    if (busy) return;
    setBusy(true);
    let failed = 0;
    const added: Photo[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        failed++;
        continue;
      }
      try {
        const photo = await loadPhoto(file, settings);
        resources.current.set(photo.id, photo);
        added.push(photo);
      } catch {
        failed++;
      }
    }
    setPhotos((ps) => [...ps, ...added]);
    if (added.length) {
      setActive(added[0].id);
      setSelected(added.map((p) => p.id));
      setManageOpen(false);
      setPanelOpen(false);
    }
    setBusy(false);
    setMessage(
      failed
        ? t(
            "已导入 {{value0}} 张，{{value1}} 个文件无法读取（支持常见图片格式，单张不超过 1 亿像素）",
            {
              value0: added.length,
              value1: failed,
              count: added.length,
            },
          )
        : "",
    );
  }
  function remove(id: string) {
    const p = photos.find((p) => p.id === id);
    if (p) {
      releasePhoto(p);
      resources.current.delete(p.id);
    }
    const rest = photos.filter((p) => p.id !== id);
    setPhotos(rest);
    setSelected((s) => s.filter((v) => v !== id));
    if (active === id) setActive(rest[0]?.id ?? "");
  }
  const target = useMemo(
    () =>
      scope === "all" ? photos : photos.filter((p) => selected.includes(p.id)),
    [photos, scope, selected],
  );
  const pages = useMemo(
    () =>
      mode === "contact"
        ? contactPages(target, contact)
        : collagePages(target, collage.slides),
    [target, collage.slides, contact, mode],
  );
  const pageIndex = Math.min(page, Math.max(0, pages.length - 1));
  const collageIndex = target.findIndex((photo) => photo.id === active);
  function choosePage(next: number) {
    setPage(next);
    const items = pages[next];
    if (items?.length && !items.some((photo) => photo.id === active))
      setActive(items[0].id);
  }
  const choosePhoto = (id: string) => {
    setActive(id);
    if (mode !== "single") {
      const at = pages.findIndex((items) =>
        items.some((photo) => photo.id === id),
      );
      if (at >= 0) setPage(at);
    }
    if (scope === "selected")
      setSelected((ids) => (ids.includes(id) ? ids : [...ids, id]));
  };
  const togglePhoto = (id: string) => {
    const next = selected.includes(id)
      ? selected.filter((v) => v !== id)
      : [...selected, id];
    setSelected(next);
    if (!selected.includes(id)) setActive(id);
    else if (active === id && next.length) setActive(next[0]);
  };
  const selectAll = () =>
    setSelected(
      selected.length === photos.length ? [] : photos.map((p) => p.id),
    );
  function applyPhotoOrder(items: Photo[]) {
    setPhotos(items);
    if (mode !== "single") {
      const visible =
          scope === "all"
            ? items
            : items.filter((photo) => selected.includes(photo.id)),
        sheets =
          mode === "contact"
            ? contactPages(visible, contact)
            : collagePages(visible, collage.slides),
        at = sheets.findIndex((sheet) =>
          sheet.some((photo) => photo.id === active),
        );
      if (at >= 0) setPage(at);
    }
  }
  function finishSort(fromId: string, toId: string) {
    if (busy || fromId === toId) return;
    const from = photos.findIndex((photo) => photo.id === fromId),
      to = photos.findIndex((photo) => photo.id === toId);
    if (from < 0 || to < 0) return;
    const next = [...photos],
      item = next.splice(from, 1)[0];
    next.splice(to, 0, item);
    applyPhotoOrder(next);
  }
  const reorderIndex = mode !== "single" ? collageIndex : index,
    reorderCount = mode !== "single" ? target.length : photos.length;
  return (
    <div className="editor-shell">
      <header className="editor-header">
        <a
          className="flex min-h-11 items-center"
          href="https://github.com/pomelo-chuan/film-block"
          aria-label={t("GitHub 仓库")}
          title={t("GitHub 仓库")}
          target="_blank"
          rel="noreferrer"
        >
          <h1 className="brand text-xs font-semibold tracking-[.18em] text-muted-foreground sm:text-sm">
            FILM BLOCK
          </h1>
        </a>
        <div className="flex items-center justify-end gap-2">
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="icon"
            className="editor-round size-12"
            aria-label={t("打开设置")}
            title={t("设置")}
            aria-haspopup="dialog"
            aria-expanded={panelOpen && panel !== "export"}
            onClick={(event) =>
              openPanel(
                mode === "contact"
                  ? "contact"
                  : mode === "collage"
                    ? "layout"
                    : lastTool === "layout" || lastTool === "contact"
                      ? "film"
                      : lastTool,
                event.currentTarget,
              )
            }
          >
            <Settings2 className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="editor-round size-12"
            aria-label={t("导出设置")}
            title={t("导出照片")}
            disabled={busy}
            onClick={(event) => openPanel("export", event.currentTarget)}
          >
            {busy ? (
              <LoaderCircle className="size-5 animate-spin" />
            ) : (
              <Download className="size-6" />
            )}
          </Button>
        </div>
      </header>
      <div className="editor-shortcuts" aria-label={t("快捷设置")}>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "editor-round h-11 w-12",
            shown.textEnabled && "text-primary",
          )}
          aria-label={shown.textEnabled ? t("隐藏片基文字") : t("显示片基文字")}
          title={t("片基文字开关")}
          aria-pressed={shown.textEnabled}
          onClick={() => change({ textEnabled: !shown.textEnabled })}
        >
          <Type className="size-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "editor-round h-11 w-12",
            shown.dateStampEnabled && "text-primary",
          )}
          aria-label={
            shown.dateStampEnabled ? t("关闭日期印记") : t("开启日期印记")
          }
          title={t("日期印记开关")}
          aria-pressed={shown.dateStampEnabled}
          onClick={() => change({ dateStampEnabled: !shown.dateStampEnabled })}
        >
          <CalendarDays className="size-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="editor-round h-11 w-12"
          aria-label={theme === "dark" ? t("切换浅色模式") : t("切换深色模式")}
          onClick={toggleTheme}
        >
          {theme === "dark" ? (
            <Sun className="size-5" />
          ) : (
            <Moon className="size-5" />
          )}
        </Button>
        <span
          className="ml-auto min-w-0 truncate pr-1 text-[11px] text-muted-foreground"
          title={current?.name}
        >
          {current?.name ?? t("示例预览")}
        </span>
      </div>
      <main className="studio editor-viewer" aria-label={t("照片预览")}>
        <div className="editor-preview-tools">
          <span className="min-w-0 flex-1 truncate text-[10px] text-muted-foreground">
            {mode !== "single"
              ? t("{{value0}} 张照片 \u00B7 {{value1}}", {
                  value0: target.length,
                  value1: current?.name ?? t("添加照片开始创作"),
                  count: target.length,
                })
              : current
                ? `${current.width} × ${current.height}`
                : t("添加照片开始创作")}
          </span>
          {current && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 rounded-full"
                aria-label={t("前移当前照片")}
                disabled={busy || reorderIndex <= 0}
                onClick={() => movePhoto(-1)}
              >
                <ArrowLeft className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 rounded-full"
                aria-label={t("后移当前照片")}
                disabled={
                  busy || reorderIndex < 0 || reorderIndex >= reorderCount - 1
                }
                onClick={() => movePhoto(1)}
              >
                <ArrowRight className="size-4" />
              </Button>
            </>
          )}
          {current && (
            <Button
              variant="ghost"
              size="icon"
              className="size-11 rounded-full text-muted-foreground hover:text-destructive"
              aria-label={t("删除当前照片")}
              title={t("删除 {{value0}}", {
                value0: current.name,
              })}
              disabled={busy}
              onClick={() => remove(current.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
        <div
          className={cn(
            "preview-stage",
            drag && "outline-2 -outline-offset-4 outline-primary",
          )}
          onDragOver={(event) => {
            event.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDrag(false);
            void upload(event.dataTransfer.files);
          }}
        >
          {mode === "contact" ? (
            pages.length ? (
              <PreviewCarousel
                key="contact"
                ids={pages.map((_, i) => `roll-${i}`)}
                index={pageIndex}
                onSelect={choosePage}
                render={(i) => (
                  <ContactPreview
                    photos={pages[i]}
                    settings={contact}
                    base={settings}
                    index={i}
                    active={active}
                    onSelect={choosePhoto}
                    label={
                      i === pageIndex
                        ? t("整卷展示预览")
                        : t("第 {{value0}} 卷预览", {
                            value0: i + 1,
                          })
                    }
                  />
                )}
              />
            ) : (
              <div className="photo-mat">
                <ContactPreview
                  photos={target}
                  settings={contact}
                  base={settings}
                  index={0}
                  active={active}
                  onSelect={choosePhoto}
                />
              </div>
            )
          ) : mode === "collage" ? (
            pages.length ? (
              <PreviewCarousel
                key="collage"
                ids={pages.map((_, i) => `page-${i}`)}
                index={pageIndex}
                onSelect={choosePage}
                render={(i) => (
                  <CollagePreview
                    photos={pages[i]}
                    allPhotos={photos}
                    settings={collage}
                    label={
                      i === pageIndex
                        ? t("多张拼图预览")
                        : t("第 {{value0}} 页拼图预览", {
                            value0: i + 1,
                          })
                    }
                  />
                )}
              />
            ) : (
              <div className="photo-mat">
                <CollagePreview
                  photos={target}
                  allPhotos={photos}
                  settings={collage}
                />
              </div>
            )
          ) : photos.length ? (
            <PreviewCarousel
              key="single"
              ids={photos.map((photo) => photo.id)}
              index={index}
              onSelect={(i) => {
                if (photos[i]) setActive(photos[i].id);
              }}
              render={(i) => (
                <Preview
                  photo={photos[i]}
                  settings={photos[i].settings}
                  index={i}
                />
              )}
            />
          ) : (
            <div className="photo-mat">
              <Preview settings={shown} index={index} />
            </div>
          )}
          {drag && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/90 text-sm text-primary">
              {t("松开以导入照片")}
            </div>
          )}
        </div>
        <div className="editor-preview-navigation">
          {mode !== "single" ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 rounded-full"
                aria-label={mode === "contact" ? t("上一卷") : t("上一页拼图")}
                disabled={pageIndex === 0}
                onClick={() => choosePage(pageIndex - 1)}
              >
                <ArrowLeft className="size-4" />
              </Button>
              <Button
                variant="ghost"
                className="h-11 gap-2 rounded-full text-xs text-muted-foreground"
                onClick={(event) =>
                  openPanel(
                    mode === "contact" ? "contact" : "layout",
                    event.currentTarget,
                  )
                }
              >
                <LayoutGrid className="size-4" />
                {mode === "contact" ? t("整卷设置") : t("拼图布局")} ·{" "}
                {pages.length ? `${pageIndex + 1} / ${pages.length}` : "0 / 0"}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 rounded-full"
                aria-label={mode === "contact" ? t("下一卷") : t("下一页拼图")}
                disabled={pageIndex >= pages.length - 1}
                onClick={() => choosePage(pageIndex + 1)}
              >
                <ArrowRight className="size-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 rounded-full"
                aria-label={t("上一张")}
                disabled={index === 0 || !photos.length}
                onClick={() => setActive(photos[index - 1].id)}
              >
                <ArrowLeft className="size-4" />
              </Button>
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {photos.length ? `${index + 1} / ${photos.length}` : t("示例")}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 rounded-full"
                aria-label={t("下一张")}
                disabled={index >= photos.length - 1}
                onClick={() => setActive(photos[index + 1].id)}
              >
                <ArrowRight className="size-4" />
              </Button>
            </>
          )}
        </div>
      </main>
      <Input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        className="hidden"
        aria-label={t("上传照片")}
        onChange={(event) => {
          if (event.target.files) void upload(event.target.files);
          event.target.value = "";
        }}
      />
      <FeatureBoundary>
        <Suspense
          fallback={
            <div className="h-[68px]" aria-label={t("正在加载照片列表")} />
          }
        >
          <PhotoLibrary
            photos={photos}
            selected={selected}
            active={active}
            busy={busy}
            managerTrigger={managerTrigger}
            addTrigger={addTrigger}
            onManage={() => setManageOpen(true)}
            onAdd={() => input.current?.click()}
            onChoose={choosePhoto}
            onActivate={(id) => {
              setActive(id);
              if (mode !== "single") {
                const at = pages.findIndex((sheet) =>
                  sheet.some((photo) => photo.id === id),
                );
                if (at >= 0) setPage(at);
              }
            }}
            onReorder={finishSort}
          />
        </Suspense>
      </FeatureBoundary>
      <nav className="editor-modes" aria-label={t("创作模式")}>
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(value) => {
            if (
              value === "single" ||
              value === "collage" ||
              value === "contact"
            ) {
              setMode(value);
              setPage(0);
            }
          }}
          className="w-full rounded-full border bg-muted/40 p-1"
          aria-label={t("选择创作模式")}
        >
          <ToggleGroupItem
            value="single"
            disabled={busy}
            className="h-11 flex-1 rounded-full! px-1 text-xs sm:text-sm"
          >
            <ImageIcon className="size-4" />
            {t("单张")}
          </ToggleGroupItem>
          <ToggleGroupItem
            value="collage"
            disabled={busy}
            className="h-11 flex-1 rounded-full! px-1 text-xs sm:text-sm"
          >
            <Images className="size-4" />
            {t("多张拼图")}
          </ToggleGroupItem>
          <ToggleGroupItem
            value="contact"
            disabled={busy}
            className="h-11 flex-1 rounded-full! px-1 text-xs sm:text-sm"
          >
            <Film className="size-4" />
            {t("整卷展示")}
          </ToggleGroupItem>
        </ToggleGroup>
      </nav>
      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            panelTrigger.current?.focus();
          }}
          side="bottom"
          showCloseButton={false}
          className="mx-auto max-h-[85dvh] max-w-xl gap-0 rounded-t-3xl pb-[env(safe-area-inset-bottom)]"
        >
          <SheetHeader className="pr-16">
            <SheetTitle>
              {panel === "export" ? t("导出照片") : t("编辑设置")}
            </SheetTitle>
            <SheetDescription>
              {panel === "export"
                ? mode === "contact"
                  ? t("导出 {{value0}} 卷 \u00B7 {{value1}} 张照片", {
                      value0: pages.length,
                      value1: target.length,
                      count: pages.length,
                    })
                  : mode === "collage"
                    ? t("导出 {{value0}} 页拼图 \u00B7 {{value1}} 张照片", {
                        value0: pages.length,
                        value1: target.length,
                        count: pages.length,
                      })
                    : t("导出{{value0}} {{value1}} 张照片", {
                        value0: scope === "all" ? t("全部") : t("选中"),
                        value1: target.length,
                      })
                : t("调整后实时应用到预览")}
            </SheetDescription>
          </SheetHeader>
          <SheetClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 size-11 rounded-full"
              aria-label={t("关闭设置")}
            >
              <X />
            </Button>
          </SheetClose>
          <div className="min-h-0 overflow-y-auto overscroll-contain">
            <div className="px-3 py-2">
              <ToggleGroup
                type="single"
                value={scope}
                onValueChange={(value) => {
                  if (value !== "all" && value !== "selected") return;
                  setScope(value);
                  if (
                    value === "selected" &&
                    selected.length &&
                    !selected.includes(active)
                  )
                    setActive(selected[0]);
                }}
                variant="outline"
                className="w-full"
                aria-label={t("调整范围")}
              >
                <ToggleGroupItem
                  value="all"
                  className="h-11 flex-1 text-xs"
                  aria-label={t("统一调整")}
                >
                  <Layers />
                  {t("全部照片")}
                  {photos.length ? ` ${photos.length}` : ""}
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="selected"
                  className="h-11 flex-1 text-xs"
                  aria-label={t("仅选中")}
                >
                  {t("仅选中")} {selected.length}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            {panel === "export" ? (
              <>
                <section
                  className="export-dock space-y-3 px-4 pb-4"
                  aria-label={t("导出照片")}
                >
                  <div className="mx-auto grid max-w-7xl grid-cols-1 items-end gap-3">
                    <FeatureBoundary>
                      <Suspense
                        fallback={
                          <p className="py-3 text-xs text-muted-foreground">
                            {t("正在加载导出…")}
                          </p>
                        }
                      >
                        <PhotoExport
                          contact={mode === "contact" ? contact : undefined}
                          base={settings}
                          collage={mode === "collage" ? collage : undefined}
                          photos={photos}
                          targets={target}
                          option={exportOption}
                          onOptionChange={(option) => {
                            setExportOption(option);
                            rememberExportOption(option.id);
                          }}
                          busy={busy}
                          setBusy={setBusy}
                          notify={setMessage}
                          onAdd={() => input.current?.click()}
                        />
                      </Suspense>
                    </FeatureBoundary>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t(exportOption.description)}
                  </p>
                </section>
              </>
            ) : (
              <>
                <Tabs
                  value={panel}
                  onValueChange={(value) => {
                    setPanel(value as EditorPanel);
                    setLastTool(value as Exclude<EditorPanel, "export">);
                  }}
                  className="gap-0"
                >
                  <TabsList
                    className="mx-3 h-12! w-[calc(100%-1.5rem)] rounded-lg"
                    aria-label={t("胶片设置分类")}
                  >
                    {mode === "contact" && (
                      <TabsTrigger
                        value="contact"
                        className="min-h-11 gap-1 px-1 text-xs sm:text-sm"
                      >
                        <Film className="hidden size-3.5 sm:block" />
                        {t("整卷")}
                      </TabsTrigger>
                    )}
                    {mode === "collage" && (
                      <TabsTrigger
                        value="layout"
                        className="min-h-11 gap-1 px-1 text-xs sm:text-sm"
                      >
                        <LayoutGrid className="hidden size-3.5 sm:block" />
                        {t("布局")}
                      </TabsTrigger>
                    )}
                    {mode !== "contact" && (
                      <TabsTrigger
                        value="film"
                        className="min-h-11 gap-1 px-1 text-xs sm:text-sm"
                      >
                        <Film className="hidden size-3.5 sm:block" />
                        {t("胶卷")}
                      </TabsTrigger>
                    )}
                    <TabsTrigger
                      value="base"
                      className="min-h-11 gap-1 px-1 text-xs sm:text-sm"
                    >
                      <Palette className="hidden size-3.5 sm:block" />
                      {t("片基")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="text"
                      className="min-h-11 gap-1 px-1 text-xs sm:text-sm"
                    >
                      <Type className="hidden size-3.5 sm:block" />
                      {t("文字")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="date"
                      className="min-h-11 gap-1 px-1 text-xs sm:text-sm"
                    >
                      <CalendarDays className="hidden size-3.5 sm:block" />
                      {t("日期")}
                    </TabsTrigger>
                  </TabsList>
                  {mode === "contact" && (
                    <TabsContent value="contact">
                      <FeatureBoundary>
                        <Suspense
                          fallback={
                            <p className="p-3 text-xs">{t("正在加载设置…")}</p>
                          }
                        >
                          <ContactControls
                            settings={contact}
                            change={changeContact}
                            onSort={() => {
                              const ordered = orderByCaptureDate(photos);
                              setPhotos(ordered);
                              const first = ordered.find(
                                (photo) =>
                                  scope === "all" ||
                                  selected.includes(photo.id),
                              );
                              if (first) setActive(first.id);
                              setPage(0);
                            }}
                          />
                        </Suspense>
                      </FeatureBoundary>
                    </TabsContent>
                  )}
                  {mode === "collage" && (
                    <TabsContent value="layout">
                      <FeatureBoundary>
                        <Suspense
                          fallback={
                            <p className="p-3 text-xs">{t("正在加载设置…")}</p>
                          }
                        >
                          <CollageControls
                            photo={target.find((photo) => photo.id === active)}
                            settings={collage}
                            change={changeCollage}
                            count={target.length}
                          />
                        </Suspense>
                      </FeatureBoundary>
                      <div className="px-3 pb-3 text-xs leading-relaxed text-muted-foreground">
                        {t(
                          "长按照片条拖动排序，或点选照片后用预览上方的箭头调整顺序。片基、文字、日期继续使用各张照片的设置。",
                        )}
                      </div>
                    </TabsContent>
                  )}
                  <FeatureBoundary>
                    <Suspense
                      fallback={
                        <p className="p-3 text-xs">{t("正在加载设置…")}</p>
                      }
                    >
                      <FilmSettings
                        shown={shown}
                        current={current}
                        change={change}
                      />
                    </Suspense>
                  </FeatureBoundary>
                </Tabs>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
      {manageOpen && (
        <FeatureBoundary>
          <Suspense fallback={null}>
            <PhotoManager
              open={manageOpen}
              onOpenChange={setManageOpen}
              photos={photos}
              selected={selected}
              active={active}
              busy={busy}
              onAdd={() => input.current?.click()}
              onSelectAll={selectAll}
              onChoose={choosePhoto}
              onToggle={togglePhoto}
              onRemove={remove}
              returnFocus={() => {
                (!managerTrigger.current?.disabled
                  ? managerTrigger.current
                  : addTrigger.current
                )?.focus();
              }}
            />
          </Suspense>
        </FeatureBoundary>
      )}
      {message && (
        <Alert
          role="status"
          aria-live="polite"
          className="fixed right-3 bottom-[calc(9rem+env(safe-area-inset-bottom))] left-3 z-[60] mx-auto w-auto max-w-md pr-14 shadow-lg lg:right-6 lg:bottom-6 lg:left-auto"
        >
          <AlertDescription className="text-xs leading-relaxed text-foreground">
            {message}
          </AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-0.5 right-1 size-11"
            aria-label={t("关闭提示")}
            onClick={() => setMessage("")}
          >
            <X />
          </Button>
        </Alert>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
