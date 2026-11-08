import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import zh from "./zh-CN.json";
import hant from "./zh-Hant.json";
import en from "./en.json";
import { initialLanguage, LANGUAGE_KEY, type Language } from "./language";
export const i18n = i18next.createInstance();
void i18n.use(initReactI18next).init({
  resources: {
    "zh-CN": { translation: zh },
    "zh-Hant": { translation: hant },
    en: { translation: en },
  },
  lng: initialLanguage(),
  fallbackLng: "en",
  supportedLngs: ["zh-CN", "zh-Hant", "en"],
  load: "currentOnly",
  initAsync: false,
  keySeparator: false,
  nsSeparator: false,
  returnEmptyString: false,
  interpolation: { escapeValue: false },
});
export function t(key: string, values?: Record<string, unknown>): string {
  return String(i18n.t(key, { ...values, defaultValue: key }));
}
const description =
  "给照片加一圈胶片的温度。免费、本地处理的胶片边框工具，支持 135、120 和批量导出。";
function updateDocument(language: string) {
  if (typeof document === "undefined" || !document.documentElement) return;
  document.documentElement.lang = language;
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute("content", t(description));
}
i18n.on("languageChanged", updateDocument);
updateDocument(i18n.language);
export async function changeLanguage(language: Language) {
  await i18n.changeLanguage(language);
  try {
    localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    /* Keep switching usable without storage. */
  }
}
