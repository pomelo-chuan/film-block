import { test, expect } from "@playwright/test";

test("EXIF orientation and manual rotation agree in preview and original export", async ({
  page,
}) => {
  await page.goto("./");
  const data = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = 1000;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, 800, 1000);
    ctx.fillStyle = "blue";
    ctx.fillRect(800, 0, 800, 1000);
    return canvas.toDataURL("image/jpeg", 1).split(",")[1];
  });
  const jpeg = Buffer.from(data, "base64");
  // Little-endian TIFF, Orientation=6 (90 degrees clockwise).
  const exif = Buffer.from([
    0xff, 0xe1, 0, 34, 69, 120, 105, 102, 0, 0, 73, 73, 42, 0, 8, 0, 0, 0, 1, 0,
    0x12, 1, 3, 0, 1, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0,
  ]);
  await page.locator("input[type=file]").setInputFiles({
    name: "rotated.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.concat([jpeg.subarray(0, 2), exif, jpeg.subarray(2)]),
  });
  await page.getByRole("button", { name: "管理照片", exact: true }).click();
  await page
    .getByRole("switch", { name: "为 rotated.jpg 添加胶卷边框", exact: true })
    .click();
  const preview = page.getByRole("dialog").locator("canvas");
  await expect
    .poll(() =>
      preview.evaluate(
        (c) => (c as HTMLCanvasElement).width / (c as HTMLCanvasElement).height,
      ),
    )
    .toBeCloseTo(1000 / 1600, 2);
  await page
    .getByRole("button", { name: "向右旋转 rotated.jpg", exact: true })
    .click();
  await expect
    .poll(() =>
      preview.evaluate(
        (c) => (c as HTMLCanvasElement).width / (c as HTMLCanvasElement).height,
      ),
    )
    .toBeCloseTo(1600 / 1000, 2);
  await page.getByRole("button", { name: "关闭照片管理", exact: true }).click();
  await page.getByRole("button", { name: "导出设置", exact: true }).click();
  await page.getByRole("combobox", { name: "导出质量", exact: true }).click();
  await page.getByRole("option", { name: /无损保存/ }).click();
  await page
    .getByRole("button", { name: "准备保存 1 张照片", exact: true })
    .click();
  const link = page.locator('[aria-label="待保存照片"] a').first();
  await expect(link).toBeVisible();
  const result = await link.evaluate(async (a) => {
    const bitmap = await createImageBitmap(
      await (await fetch((a as HTMLAnchorElement).href)).blob(),
    );
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0);
    const result = {
      width: bitmap.width,
      height: bitmap.height,
      left: Array.from(ctx.getImageData(100, 100, 1, 1).data),
      right: Array.from(ctx.getImageData(1500, 100, 1, 1).data),
    };
    bitmap.close();
    return result;
  });
  expect(result.width).toBe(1600);
  expect(result.height).toBe(1000);
  expect(result.left[2]).toBeGreaterThan(240);
  expect(result.right[0]).toBeGreaterThan(240);
});
