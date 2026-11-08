import fs from "node:fs";
import { Converter } from "opencc-js";
const convert = Converter({ from: "cn", to: "tw" });
const traditional = (text) =>
  convert(text)
    .replaceAll("設置", "設定")
    .replaceAll("導出", "匯出")
    .replaceAll("加載", "載入")
    .replaceAll("文件", "檔案")
    .replaceAll("質量", "品質")
    .replaceAll("默認", "預設")
    .replaceAll("界面", "介面")
    .replaceAll("打開", "開啟")
    .replaceAll("本地", "本機")
    .replaceAll("相冊", "相簿")
    .replaceAll("字體", "字型")
    .replaceAll("存儲圖像", "儲存影像")
    .replaceAll("存儲到照片", "儲存至照片")
    .replaceAll("保存", "儲存");
const input = new URL("../src/i18n/zh-CN.json", import.meta.url),
  output = new URL("../src/i18n/zh-Hant.json", import.meta.url);
const source = JSON.parse(fs.readFileSync(input, "utf8"));
fs.writeFileSync(
  output,
  JSON.stringify(
    Object.fromEntries(
      Object.entries(source).map(([key, value]) => [key, traditional(value)]),
    ),
    null,
    2,
  ) + "\n",
);
