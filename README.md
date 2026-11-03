# FILM / ROOM

浏览器里的胶片边框工作室。React 19 + TypeScript + Vite，使用 Canvas 渲染及 JSZip 打包，无后端，照片仅在本地处理。

支持多图上传、135 / 120 边框、6 种片基预设和自定义颜色、文字、字色、可调字号及 3 种开源像素字体、圆角 / 方形 / 无齿孔、边框宽度、齿孔数量和底色。默认统一调整全部照片，也可切换「仅选中」应用到勾选的照片。导出范围与调整范围一致；单张导出 PNG，多张打包 ZIP。保持原图比例，不裁切；导出时原图最长边限制为 6000 像素以控制内存。

## 开发

Node.js 22 或更新版本。

```sh
npm ci
npm run dev
npm test
npm run build
```

## GitHub Pages

Vite base 已配置为 `/film-block/`。在仓库 Settings → Pages → Build and deployment 选择 **GitHub Actions**，推送到 main 后 `.github/workflows/pages.yml` 会测试、构建并发布。

预期地址：https://pomelo-chuan.github.io/film-block/ （成功部署后才可访问）。如果更换仓库名，更新 vite.config.ts 的 base。

界面提供程序生成的示例风景，不依赖远程图片。支持浏览器可解码的 JPG、PNG、WebP 等图片；HEIC 等格式是否可用取决于浏览器。单张图片限制为 1 亿像素，批量导出依次渲染以降低峰值内存。刷新页面会清空上传内容。

片基颜色的调研依据、色值限制与开源字体授权说明见 [docs/film-bases.md](docs/film-bases.md)。字体随网站本地打包，预览与导出均等待字体加载。
