import { test, expect, type Page } from "@playwright/test";
import path from "node:path";
const fixture = (name: string) => path.resolve("src/test-fixtures", name);
async function upload(page: Page) {
  await page
    .locator("input[type=file]")
    .setInputFiles(
      ["capture-date.jpg", "digital-date.jpg", "modified-only.jpg"].map(
        fixture,
      ),
    );
  await expect(page.locator(".filmstrip article")).toHaveCount(3);
}
async function closeSettings(page: Page) {
  await page.getByRole("button", { name: "关闭设置", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}
test("photos swipe, reorder, retain dates and fit mobile layouts", async ({
  page,
}) => {
  await page.goto("./");
  await upload(page);
  await expect(
    page.getByRole("button", { name: "关闭提示", exact: true }),
  ).toHaveCount(0);
  const buttons = page.locator(".filmstrip article button");
  await page.getByRole("button", { name: "后移当前照片", exact: true }).click();
  await expect(buttons.nth(1)).toHaveAttribute(
    "aria-label",
    "预览 capture-date.jpg",
  );
  const active = buttons.nth(1);
  await active.focus();
  await page.keyboard.press("Space");
  await page.waitForTimeout(100);
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(100);
  await page.keyboard.press("Space");
  await expect(buttons.nth(2)).toHaveAttribute(
    "aria-label",
    "预览 capture-date.jpg",
  );
  const cdp = await page.context().newCDPSession(page);
  await page
    .getByRole("button", { name: "预览 digital-date.jpg", exact: true })
    .click();
  await expect
    .poll(() =>
      page
        .locator(".preview-carousel-track")
        .evaluate((el) =>
          Math.abs(new DOMMatrixReadOnly(getComputedStyle(el).transform).m41),
        ),
    )
    .toBeLessThan(1);
  const box = (await page.locator(".preview-carousel").boundingBox())!;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: box.x + box.width * 0.8, y: box.y + box.height / 2 }],
  });
  for (let i = 1; i <= 8; i++) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          x: box.x + box.width * (0.8 - (0.6 * i) / 8),
          y: box.y + box.height / 2,
        },
      ],
    });
    await page.waitForTimeout(20);
  }
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(page.locator(".editor-preview-navigation")).toContainText(
    "2 / 3",
  );
  await page.getByRole("button", { name: "打开设置", exact: true }).click();
  await page.getByRole("tab", { name: "日期", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText("未读取到照片日期");
  await closeSettings(page);
  for (const width of [320, 390, 844, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
test("bounded thumbnails and contact selection do not redraw the roll", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = CanvasRenderingContext2D.prototype.drawImage;
    (window as any).offscreenDraws = 0;
    CanvasRenderingContext2D.prototype.drawImage = function (...args: any[]) {
      if (!this.canvas.isConnected) (window as any).offscreenDraws++;
      return (original as any).apply(this, args);
    };
  });
  await page.goto("./");
  const data = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 1600;
    c.height = 1200;
    c.getContext("2d")!.fillRect(0, 0, 1600, 1200);
    return c.toDataURL().split(",")[1];
  });
  await page.locator("input[type=file]").setInputFiles(
    Array.from({ length: 12 }, (_, i) => ({
      name: `photo-${i}.png`,
      mimeType: "image/png",
      buffer: Buffer.from(data, "base64"),
    })),
  );
  await expect(page.locator(".filmstrip article")).toHaveCount(12);
  await expect
    .poll(() =>
      page
        .locator(".filmstrip canvas")
        .evaluateAll((nodes) =>
          nodes.every(
            (c) =>
              (c as HTMLCanvasElement).width > 10 &&
              (c as HTMLCanvasElement).width <= 180,
          ),
        ),
    )
    .toBe(true);
  const memory = await page
    .locator(".filmstrip canvas")
    .evaluateAll((nodes) =>
      nodes.reduce(
        (n, c) =>
          n +
          (c as HTMLCanvasElement).width * (c as HTMLCanvasElement).height * 4,
        0,
      ),
    );
  expect(memory).toBeLessThan(2 * 1024 * 1024);
  await page.getByRole("button", { name: "管理照片", exact: true }).click();
  await expect
    .poll(() =>
      page
        .getByRole("dialog")
        .locator("canvas")
        .evaluateAll((nodes) =>
          nodes.every((c) => (c as HTMLCanvasElement).width <= 360),
        ),
    )
    .toBe(true);
  await page.getByRole("button", { name: "关闭照片管理", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("radio", { name: "整卷展示", exact: true }).click();
  await expect
    .poll(() =>
      page
        .locator('canvas[aria-label="整卷展示预览"]')
        .evaluate((c) => (c as HTMLCanvasElement).width),
    )
    .toBe(1600);
  await page.waitForTimeout(200);
  await page.evaluate(() => ((window as any).offscreenDraws = 0));
  await page
    .getByRole("button", { name: "预览 photo-1.png", exact: true })
    .click();
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => (window as any).offscreenDraws)).toBe(0);
  const fonts = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .filter((r) => r.name.endsWith(".woff2"))
      .map((r) => r.name),
  );
  expect(fonts.some((name) => name.includes("fusion-pixel-12-common"))).toBe(
    true,
  );
  expect(fonts.some((name) => name.includes("fusion-pixel-12-extended"))).toBe(
    false,
  );
});
test("original resolution export uses small gallery images and supports fresh-gesture sharing", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as any).decodedWidths = [];
    const decode = HTMLImageElement.prototype.decode;
    HTMLImageElement.prototype.decode = async function () {
      await decode.call(this);
      (window as any).decodedWidths.push(this.naturalWidth);
    };
    (window as any).shared = [];
    (window as any).shareMode = "ok";
    Object.defineProperty(navigator, "canShare", { value: () => true });
    Object.defineProperty(navigator, "share", {
      value: async ({ files }: { files: File[] }) => {
        if (!navigator.userActivation.isActive)
          throw Error("No user activation");
        if ((window as any).shareMode === "cancel")
          throw new DOMException("cancel", "AbortError");
        (window as any).shared = await Promise.all(
          files.map(async (f) => ({
            name: f.name,
            type: f.type,
            bytes: Array.from(new Uint8Array(await f.arrayBuffer())),
          })),
        );
      },
    });
  });
  await page.goto("./");
  const png = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 2400;
    c.height = 1800;
    const x = c.getContext("2d")!;
    x.fillStyle = "#ff0000";
    x.fillRect(0, 0, 2400, 1800);
    return c.toDataURL().split(",")[1];
  });
  await page.locator("input[type=file]").setInputFiles({
    name: "original.png",
    mimeType: "image/png",
    buffer: Buffer.from(png, "base64"),
  });
  await expect(page.locator(".filmstrip article")).toHaveCount(1);
  await page.getByRole("button", { name: "导出设置", exact: true }).click();
  await page.getByRole("combobox", { name: "导出质量", exact: true }).click();
  await page.getByRole("option", { name: /无损保存/ }).click();
  await page.evaluate(() => ((window as any).decodedWidths = []));
  await page
    .getByRole("button", { name: "准备保存 1 张照片", exact: true })
    .click();
  const share = page.getByRole("button", {
    name: "保存到相册 / 分享",
    exact: true,
  });
  await expect(share).toBeVisible();
  expect(await page.evaluate(() => (window as any).decodedWidths)).toContain(
    2400,
  );
  const thumb = page.locator('[aria-label="待保存照片"] img');
  await expect
    .poll(() => thumb.evaluate((i) => (i as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
  expect(
    await thumb.evaluate((i) =>
      Math.max(
        (i as HTMLImageElement).naturalWidth,
        (i as HTMLImageElement).naturalHeight,
      ),
    ),
  ).toBeLessThanOrEqual(240);
  await page.evaluate(() => ((window as any).shareMode = "cancel"));
  await share.click();
  await expect(share).toBeEnabled();
  await page.evaluate(() => ((window as any).shareMode = "ok"));
  await share.click();
  await expect
    .poll(() => page.evaluate(() => (window as any).shared.length))
    .toBe(1);
  const result = await page.evaluate(async () => {
    const f = (window as any).shared[0],
      image = await createImageBitmap(
        new Blob([new Uint8Array(f.bytes)], { type: f.type }),
      );
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const x = canvas.getContext("2d")!;
    x.drawImage(image, 0, 0);
    return {
      width: image.width,
      height: image.height,
      pixel: Array.from(
        x.getImageData(image.width / 2, image.height / 2, 1, 1).data,
      ),
    };
  });
  expect(result.width).toBeGreaterThan(2400);
  expect(result.height).toBeGreaterThan(1800);
  expect(result.pixel).toEqual([255, 0, 0, 255]);
});
test("collage scale and contact orientation remain functional", async ({
  page,
}) => {
  await page.goto("./");
  await upload(page);
  await page.getByRole("radio", { name: "多张拼图", exact: true }).click();
  await page.getByRole("button", { name: "打开设置", exact: true }).click();
  const size = page.getByRole("slider", { name: "当前照片大小", exact: true });
  await size.focus();
  await page.keyboard.press("Home");
  await expect(size).toHaveAttribute("aria-valuenow", "50");
  await page.getByRole("radio", { name: "2 页", exact: true }).click();
  await closeSettings(page);
  await page.getByRole("button", { name: "下一页拼图", exact: true }).click();
  await expect(page.locator(".editor-preview-navigation")).toContainText(
    "2 / 2",
  );
  await page.getByRole("radio", { name: "整卷展示", exact: true }).click();
  await page.getByRole("button", { name: "打开设置", exact: true }).click();
  await page
    .getByRole("button", { name: "按拍摄日期排序", exact: true })
    .click();
  await expect(
    page.locator(".filmstrip article button").first(),
  ).toHaveAttribute("aria-label", "预览 digital-date.jpg");
  await page
    .getByRole("textbox", { name: "卷名", exact: true })
    .fill("旅行记忆");
  await closeSettings(page);
  await expect
    .poll(() =>
      page
        .locator('canvas[aria-label="整卷展示预览"]')
        .evaluate((c) => (c as HTMLCanvasElement).width),
    )
    .toBe(1600);
  const loaded = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .some((r) => r.name.includes("fusion-pixel-12-extended")),
  );
  expect(loaded).toBe(true);
});

test("font failures fall back to a readable preview", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/fonts/**", (route) => route.abort());
  await page.goto("./");
  await expect
    .poll(() =>
      page
        .locator(".photo-mat canvas")
        .evaluate((c) => (c as HTMLCanvasElement).width),
    )
    .toBeGreaterThan(500);
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("auto orientation uses original dimensions even when a preview rounds to square", async ({
  page,
}) => {
  await page.goto("./");
  const data = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 2000;
    c.height = 2001;
    const x = c.getContext("2d")!;
    for (const [color, px, py] of [
      ["#ff0000", 0, 0],
      ["#00ff00", 1000, 0],
      ["#0000ff", 0, 1000.5],
      ["#ffff00", 1000, 1000.5],
    ] as [string, number, number][]) {
      x.fillStyle = color;
      x.fillRect(px, py, 1000, 1000.5);
    }
    return c.toDataURL().split(",")[1];
  });
  await page.locator("input[type=file]").setInputFiles({
    name: "almost-square.png",
    mimeType: "image/png",
    buffer: Buffer.from(data, "base64"),
  });
  await expect(page.locator(".filmstrip article")).toHaveCount(1);
  await page.getByRole("radio", { name: "整卷展示", exact: true }).click();
  const canvas = page.locator('canvas[aria-label="整卷展示预览"]');
  await expect
    .poll(() => canvas.evaluate((c) => (c as HTMLCanvasElement).width))
    .toBe(1600);
  const pixel = await canvas.evaluate((c) => {
    const canvas = c as HTMLCanvasElement,
      unit = canvas.width / 240;
    return Array.from(
      canvas
        .getContext("2d")!
        .getImageData(
          Math.floor((7 + 36 * 0.1) * unit),
          Math.floor((11.5 + 24 * 0.1) * unit),
          1,
          1,
        ).data,
    ).slice(0, 3);
  });
  expect(pixel[2]).toBeGreaterThan(230);
  expect(pixel[0]).toBeLessThan(20);
});

test("unsupported sharing still opens the full-size image, not its small thumbnail", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { value: undefined });
    Object.defineProperty(navigator, "canShare", { value: undefined });
  });
  await page.goto("./");
  const image = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    canvas.getContext("2d")!.fillRect(0, 0, 640, 480);
    return canvas.toDataURL().split(",")[1];
  });
  await page.locator("input[type=file]").setInputFiles({
    name: "fallback.png",
    mimeType: "image/png",
    buffer: Buffer.from(image, "base64"),
  });
  await expect(page.locator(".filmstrip article")).toHaveCount(1);
  await page.getByRole("button", { name: "导出设置", exact: true }).click();
  await page
    .getByRole("button", { name: "准备保存 1 张照片", exact: true })
    .click();
  const link = page.getByRole("link", { name: /打开大图/ });
  await expect(link).toBeVisible();
  await expect(
    page.getByRole("button", { name: "保存到相册 / 分享", exact: true }),
  ).toHaveCount(0);
  const fullUrl = await link.getAttribute("href"),
    thumbnail = await link.locator("img").getAttribute("src");
  expect(fullUrl).not.toBe(thumbnail);
  const opened = page.waitForEvent("popup");
  await link.click();
  const popup = await opened;
  await expect
    .poll(() =>
      popup
        .locator("img")
        .evaluate((i) => (i as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(240);
  await popup.close();
});

test("a failed optional panel does not unmount the editor or lose imported photos", async ({
  page,
}) => {
  await page.route("**/photo-manager-*.js", (route) => route.abort());
  await page.goto("./");
  await upload(page);
  await page.getByRole("button", { name: "管理照片", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("暂时无法加载");
  await expect(page.locator(".filmstrip article")).toHaveCount(3);
  await expect(
    page.getByRole("heading", { name: "FILM BLOCK", exact: true }),
  ).toBeVisible();
});
