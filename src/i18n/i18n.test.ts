import { afterEach, describe, it, expect, vi } from "vitest";
import { i18n, t, changeLanguage } from "./index";
import {
  detectLanguage,
  normalizeLanguage,
  initialLanguage,
  LANGUAGE_KEY,
} from "./language";
import zh from "./zh-CN.json";
import hant from "./zh-Hant.json";
import en from "./en.json";
afterEach(async () => {
  vi.unstubAllGlobals();
  await i18n.changeLanguage("zh-CN");
});
describe("language preferences", () => {
  it("recognizes Chinese regions and scripts, prioritizing explicit scripts", () => {
    for (const locale of ["zh-TW", "zh-HK", "zh_MO", "zh-Hant", "zh-Hant-CN"])
      expect(normalizeLanguage(locale)).toBe("zh-Hant");
    for (const locale of ["zh", "zh-CN", "zh-SG", "zh-Hans", "zh-Hans-HK"])
      expect(normalizeLanguage(locale)).toBe("zh-CN");
    expect(normalizeLanguage("en-GB")).toBe("en");
    expect(normalizeLanguage("fr")).toBeNull();
  });
  it("prefers a saved choice, then supported browser languages, then English", () => {
    expect(detectLanguage("zh-Hant", ["en-US"])).toBe("zh-Hant");
    expect(detectLanguage(null, ["fr", "zh-SG"])).toBe("zh-CN");
    expect(detectLanguage("broken", ["zh-HK"])).toBe("zh-Hant");
    expect(detectLanguage(null, ["fr", "de"])).toBe("en");
  });
  it("works when storage is blocked", async () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("navigator", { languages: ["zh-TW"] });
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw Error("blocked");
      },
      setItem: () => {
        throw Error("blocked");
      },
    });
    expect(initialLanguage()).toBe("zh-Hant");
    await expect(changeLanguage("en")).resolves.toBeUndefined();
    expect(i18n.language).toBe("en");
  });
  it("persists the selection and updates document language and description", async () => {
    const setItem = vi.fn(),
      setAttribute = vi.fn();
    const document = {
      documentElement: { lang: "" },
      querySelector: () => ({ setAttribute }),
    };
    vi.stubGlobal("document", document);
    vi.stubGlobal("localStorage", { setItem });
    await changeLanguage("en");
    expect(setItem).toHaveBeenCalledWith(LANGUAGE_KEY, "en");
    expect(document.documentElement.lang).toBe("en");
    expect(setAttribute).toHaveBeenCalledWith(
      "content",
      expect.stringContaining("film borders"),
    );
  });
});
describe("translation catalogs", () => {
  it("has complete, non-empty matching catalogs with matching interpolation variables", () => {
    expect(Object.keys(hant).sort()).toEqual(Object.keys(zh).sort());
    expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort());
    for (const [key, value] of Object.entries(zh))
      for (const dictionary of [hant, en]) {
        const translated = dictionary[key as keyof typeof dictionary];
        expect(translated.trim()).not.toBe("");
        expect(
          [...translated.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort(),
        ).toEqual(
          [...value.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort(),
        );
      }
  });
  it("translates labels, traditional terminology and English plural counts", async () => {
    await i18n.changeLanguage("en");
    expect(t("设置")).toBe("Settings");
    expect(t("准备保存 {{value0}} 张照片", { value0: 1, count: 1 })).toBe(
      "Prepare 1 photo",
    );
    expect(t("准备保存 {{value0}} 张照片", { value0: 2, count: 2 })).toBe(
      "Prepare 2 photos",
    );
    await i18n.changeLanguage("zh-Hant");
    expect(t("设置")).toBe("設定");
    expect(t("导出质量")).toBe("匯出品質");
    expect(t("界面语言")).toBe("介面語言");
  });
  it("preserves user-supplied text inside interpolation without nesting it as a translation", async () => {
    await i18n.changeLanguage("en");
    const filename = "照片 {{value1}} $t(设置).png";
    expect(t("预览 {{value0}}", { value0: filename })).toBe(
      "Preview " + filename,
    );
  });
});
