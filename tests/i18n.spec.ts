import { test, expect } from "@playwright/test";
import path from "node:path";
test.use({ locale: "en-US" });
const fixture = path.resolve("src/test-fixtures/capture-date.jpg");
test("English follows the browser and a manual Traditional Chinese choice survives reload", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("radio", { name: "Single", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Interface language", exact: true })
    .selectOption("zh-Hant");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-Hant");
  await expect(
    page.getByRole("radio", { name: "單張", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("film-block:language")),
  ).toBe("zh-Hant");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-Hant");
  await page.getByRole("button", { name: "開啟設定", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "編輯設定", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "選擇 135 膠捲", exact: true }),
  ).toBeVisible();
});
test("switching languages preserves custom lettering and the rendered photo", async ({
  page,
}) => {
  await page.goto("./");
  await page.locator("input[type=file]").setInputFiles(fixture);
  await expect(page.locator(".filmstrip article")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Open settings", exact: true })
    .click();
  await page.getByRole("tab", { name: "Text", exact: true }).click();
  const input = page.getByRole("textbox", { name: "Film text", exact: true });
  await input.fill("中文相机 USER TEXT");
  await page
    .getByRole("button", { name: "Close settings", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.waitForTimeout(200);
  const canvas = page.locator(
    ".preview-carousel-slide[data-active=true] canvas",
  );
  const before = await canvas.evaluate((c) =>
    (c as HTMLCanvasElement).toDataURL(),
  );
  await page
    .getByRole("combobox", { name: "Interface language", exact: true })
    .selectOption("zh-Hant");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-Hant");
  expect(
    await canvas.evaluate((c) => (c as HTMLCanvasElement).toDataURL()),
  ).toBe(before);
  await page.getByRole("button", { name: "開啟設定", exact: true }).click();
  await page.getByRole("tab", { name: "文字", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "片基文字", exact: true }),
  ).toHaveValue("中文相机 USER TEXT");
  await page.getByRole("button", { name: "關閉設定", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "開啟設定", exact: true }).click();
  await page.getByRole("tab", { name: "文字", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "片基文字", exact: true }),
  ).toHaveValue("中文相机 USER TEXT");
});
test("all three locales cover lazy panels, presets, export quality and narrow mobile layouts", async ({
  page,
}) => {
  await page.goto("./");
  await page.locator("input[type=file]").setInputFiles(fixture);
  await expect(page.locator(".filmstrip article")).toHaveCount(1);
  const labels = {
    en: {
      language: "Interface language",
      open: "Open settings",
      close: "Close settings",
      base: "Film base",
      preset: "Negative orange",
      mode: "Collage",
      layout: "Layout",
      export: "Export settings",
      quality: "Export quality",
      balanced: "Balanced (recommended)",
    },
    "zh-Hant": {
      language: "介面語言",
      open: "開啟設定",
      close: "關閉設定",
      base: "片基",
      preset: "負片橙",
      mode: "多張拼圖",
      layout: "佈局",
      export: "匯出設定",
      quality: "匯出品質",
      balanced: "均衡（推薦）",
    },
    "zh-CN": {
      language: "界面语言",
      open: "打开设置",
      close: "关闭设置",
      base: "片基",
      preset: "负片橙",
      mode: "多张拼图",
      layout: "布局",
      export: "导出设置",
      quality: "导出质量",
      balanced: "均衡（推荐）",
    },
  };
  for (const locale of ["en", "zh-Hant", "zh-CN"] as const) {
    await page.locator("select[title]").selectOption(locale);
    const text = labels[locale];
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await page.getByRole("button", { name: text.open, exact: true }).click();
    await page.getByRole("tab", { name: text.base, exact: true }).click();
    await expect(
      page.getByRole("button", { name: text.preset, exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: text.close, exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.getByRole("radio", { name: text.mode, exact: true }).click();
    await page.getByRole("button", { name: text.open, exact: true }).click();
    await expect(
      page.getByRole("tab", { name: text.layout, exact: true }),
    ).toBeVisible();
    for (const width of [320, 390, 844]) {
      await page.setViewportSize({ width, height: 844 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await page.getByRole("button", { name: text.close, exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.getByRole("button", { name: text.export, exact: true }).click();
    await expect(
      page.getByRole("combobox", { name: text.quality, exact: true }),
    ).toContainText(text.balanced);
    await page.getByRole("button", { name: text.close, exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
});
test("browser Chinese scripts and unsupported locales select the expected language", async ({
  browser,
}) => {
  for (const [locale, expected] of [
    ["zh-TW", "zh-Hant"],
    ["zh-HK", "zh-Hant"],
    ["zh-CN", "zh-CN"],
    ["en-GB", "en"],
    ["fr-FR", "en"],
  ]) {
    const context = await browser.newContext({
      locale,
      viewport: { width: 390, height: 844 },
      baseURL: "http://127.0.0.1:4175/film-block/",
    });
    try {
      const page = await context.newPage();
      await page.goto("./");
      await expect(page.locator("html")).toHaveAttribute("lang", expected);
    } finally {
      await context.close();
    }
  }
});
test("language switching remains usable when storage is unavailable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw Error("blocked");
    };
    Storage.prototype.setItem = () => {
      throw Error("blocked");
    };
  });
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page
    .getByRole("combobox", { name: "Interface language", exact: true })
    .selectOption("zh-CN");
  await expect(
    page.getByRole("button", { name: "打开设置", exact: true }),
  ).toBeVisible();
});
