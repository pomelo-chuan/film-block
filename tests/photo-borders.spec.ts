import { test, expect, type Page } from "@playwright/test";

async function closeSettings(page: Page) {
  await page.getByRole("button", { name: "关闭设置", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

async function exportedImages(page: Page) {
  await expect(page.locator('[aria-label="待保存照片"] a')).not.toHaveCount(0);
  return page
    .locator('[aria-label="待保存照片"] a')
    .evaluateAll(async (links) =>
      Promise.all(
        links.map(async (link) => {
          const blob = await (
            await fetch((link as HTMLAnchorElement).href)
          ).blob();
          const image = await createImageBitmap(blob);
          const canvas = document.createElement("canvas");
          canvas.width = image.width;
          canvas.height = image.height;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(image, 0, 0);
          const pixel = Array.from(ctx.getImageData(0, 0, 1, 1).data);
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          let red = 0,
            green = 0,
            border = 0;
          for (let i = 0; i < data.length; i += 4) {
            if (data[i] === 255 && data[i + 1] === 0 && data[i + 2] === 0)
              red++;
            if (data[i] === 0 && data[i + 1] === 255 && data[i + 2] === 0)
              green++;
            if (data[i] === 23 && data[i + 1] === 24 && data[i + 2] === 21)
              border++;
          }
          image.close();
          return {
            width: canvas.width,
            height: canvas.height,
            pixel,
            red,
            green,
            border,
          };
        }),
      ),
    );
}

test("individual borders survive reordering and mixed collage export", async ({
  page,
}, testInfo) => {
  await page.goto("./");
  const images = await page.evaluate(() =>
    ["#ff0000", "#00ff00"].map((color) => {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 640, 480);
      return canvas.toDataURL().split(",")[1];
    }),
  );
  await page.locator("input[type=file]").setInputFiles(
    images.map((data, i) => ({
      name: ["red.png", "green.png"][i],
      mimeType: "image/png",
      buffer: Buffer.from(data, "base64"),
    })),
  );
  await expect(page.locator(".filmstrip article")).toHaveCount(2);
  await page.getByRole("button", { name: "管理照片", exact: true }).click();
  const redSwitch = page.getByRole("switch", {
    name: "为 red.png 添加胶卷边框",
    exact: true,
  });
  const greenSwitch = page.getByRole("switch", {
    name: "为 green.png 添加胶卷边框",
    exact: true,
  });
  await expect(redSwitch).toBeChecked();
  await redSwitch.click();
  await expect(redSwitch).not.toBeChecked();
  await expect(greenSwitch).toBeChecked();
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`photo-borders-${width}.png`),
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "关闭照片管理", exact: true }).click();
  await page.getByRole("button", { name: "后移当前照片", exact: true }).click();
  await expect(
    page.locator(".filmstrip article button").last(),
  ).toHaveAttribute("aria-label", "预览 red.png");
  await expect
    .poll(() =>
      page
        .locator(".filmstrip article canvas")
        .last()
        .evaluate((c) => {
          const canvas = c as HTMLCanvasElement;
          return canvas.width / canvas.height;
        }),
    )
    .toBeCloseTo(4 / 3, 1);

  await page.getByRole("button", { name: "导出设置", exact: true }).click();
  await page.getByRole("combobox", { name: "导出质量", exact: true }).click();
  await page.getByRole("option", { name: /无损保存/ }).click();
  await page
    .getByRole("button", { name: "准备保存 2 张照片", exact: true })
    .click();
  const single = await exportedImages(page);
  expect(single[0].width).toBeGreaterThan(640);
  expect(single[0].height).toBeGreaterThan(480);
  expect(single[0].border).toBeGreaterThan(1000);
  expect(single[1]).toMatchObject({
    width: 640,
    height: 480,
    pixel: [255, 0, 0, 255],
    border: 0,
  });
  expect(single[1].red).toBe(640 * 480);
  await closeSettings(page);

  await page.getByRole("radio", { name: "多张拼图", exact: true }).click();
  const collage = page.locator('canvas[aria-label="多张拼图预览"]');
  await expect
    .poll(() => collage.evaluate((c) => (c as HTMLCanvasElement).height))
    .toBe(1200);
  await page.screenshot({
    path: testInfo.outputPath("mixed-collage-mobile.png"),
  });
  await page.getByRole("button", { name: "导出设置", exact: true }).click();
  await page
    .getByRole("button", { name: "准备保存 1 页拼图", exact: true })
    .click();
  const mixed = (await exportedImages(page))[0];
  expect([mixed.width, mixed.height]).toEqual([4800, 6000]);
  expect(mixed.red).toBeGreaterThan(100_000);
  expect(mixed.green).toBeGreaterThan(100_000);
  expect(mixed.border).toBeGreaterThan(100_000);
  await closeSettings(page);
  await page.getByRole("button", { name: "管理照片", exact: true }).click();
  await expect(redSwitch).not.toBeChecked();
  await expect(greenSwitch).toBeChecked();
  await redSwitch.click();
  await expect(redSwitch).toBeChecked();
});

test("border controls respect the selected adjustment scope", async ({
  page,
}) => {
  await page.goto("./");
  await page
    .locator("input[type=file]")
    .setInputFiles([
      "src/test-fixtures/capture-date.jpg",
      "src/test-fixtures/digital-date.jpg",
    ]);
  await expect(page.locator(".filmstrip article")).toHaveCount(2);
  await page.getByRole("button", { name: "管理照片", exact: true }).click();
  await page
    .getByRole("checkbox", { name: "选择 digital-date.jpg", exact: true })
    .click();
  await page.getByRole("button", { name: "关闭照片管理", exact: true }).click();
  await page.getByRole("button", { name: "打开设置", exact: true }).click();
  await page.getByRole("radio", { name: "仅选中", exact: true }).click();
  await page.getByRole("switch", { name: "添加胶卷边框", exact: true }).click();
  await closeSettings(page);
  await page.getByRole("button", { name: "管理照片", exact: true }).click();
  await expect(
    page.getByRole("switch", {
      name: "为 capture-date.jpg 添加胶卷边框",
      exact: true,
    }),
  ).not.toBeChecked();
  await expect(
    page.getByRole("switch", {
      name: "为 digital-date.jpg 添加胶卷边框",
      exact: true,
    }),
  ).toBeChecked();
  await page.getByRole("button", { name: "关闭照片管理", exact: true }).click();
  await page.getByRole("button", { name: "打开设置", exact: true }).click();
  await page.getByRole("radio", { name: "统一调整", exact: true }).click();
  await page.getByRole("switch", { name: "添加胶卷边框", exact: true }).click();
  await closeSettings(page);
  await page.getByRole("button", { name: "管理照片", exact: true }).click();
  await expect(
    page.getByRole("switch", {
      name: "为 capture-date.jpg 添加胶卷边框",
      exact: true,
    }),
  ).toBeChecked();
  await expect(
    page.getByRole("switch", {
      name: "为 digital-date.jpg 添加胶卷边框",
      exact: true,
    }),
  ).toBeChecked();
});
