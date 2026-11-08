import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { changeLanguage, t } from "@/i18n";
import { languages, type Language } from "@/i18n/language";
const names: Record<Language, string> = {
  "zh-CN": "简体中文",
  "zh-Hant": "繁體中文",
  en: "English",
};
export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  return (
    <div className="editor-round relative grid size-12 shrink-0 place-items-center focus-within:ring-2 focus-within:ring-ring">
      <Languages className="size-5" aria-hidden="true" />
      <select
        aria-label={t("界面语言")}
        title={t("语言")}
        className="absolute inset-0 size-full cursor-pointer rounded-full opacity-0"
        value={i18n.language}
        onChange={(event) => {
          const language = event.target.value;
          if (languages.includes(language as Language))
            void changeLanguage(language as Language);
        }}
      >
        {languages.map((language) => (
          <option key={language} value={language} lang={language}>
            {names[language]}
          </option>
        ))}
      </select>
    </div>
  );
}
