export const languages = ["zh-CN", "zh-Hant", "en"] as const;
export type Language = (typeof languages)[number];
export const LANGUAGE_KEY = "film-block:language";
export function normalizeLanguage(value: string): Language | null {
  const tag = value.toLowerCase().replaceAll("_", "-");
  if (tag === "en" || tag.startsWith("en-")) return "en";
  if (tag === "zh" || tag.startsWith("zh-")) {
    if (/(?:^|-)(hant|cht)(?:-|$)/.test(tag)) return "zh-Hant";
    if (/(?:^|-)(hans|chs)(?:-|$)/.test(tag)) return "zh-CN";
    return /(?:^|-)(tw|hk|mo)(?:-|$)/.test(tag) ? "zh-Hant" : "zh-CN";
  }
  return null;
}
export function detectLanguage(
  stored: string | null,
  browserLanguages: readonly string[],
): Language {
  if (stored && languages.includes(stored as Language))
    return stored as Language;
  for (const value of browserLanguages) {
    const locale = normalizeLanguage(value);
    if (locale) return locale;
  }
  return "en";
}
export function initialLanguage(): Language {
  if (typeof window === "undefined") return "zh-CN";
  let saved: null | string = null;
  try {
    saved = localStorage.getItem(LANGUAGE_KEY);
  } catch {
    /* Storage is optional. */
  }
  return detectLanguage(
    saved,
    navigator.languages?.length ? navigator.languages : [navigator.language],
  );
}
