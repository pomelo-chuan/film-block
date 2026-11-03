# FILM BLOCK

浏览器里的胶片边框工作室。React 19 + TypeScript + Vite，使用 Canvas 渲染及 JSZip 打包，无后端，照片仅在本地处理。

支持多图上传、固定规格 135 / 120 边框、6 种片基预设和自定义颜色、文字、字色、可调字号及 6 种开源像素 / 点阵字体，可选纯色 / 细颗粒片基。135 齿孔尺寸、间距、圆角与排列自动生成，120 固定无齿孔；没有自定义孔形、孔数、边框宽度或内框线设置。默认统一调整全部照片，也可切换「仅选中」应用到勾选的照片。单张导出 PNG，多张打包 ZIP。保持原图比例，不裁切；导出时原图最长边限制为 6000 像素以控制内存。

几何规格参考 SpektraLab，详见 [固定胶片规格说明](docs/film-geometry.md)。

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

片基文字可整体关闭（包括格号）；文字内容、开关、字体、字号和字色保存在当前浏览器 localStorage，刷新后自动恢复，新上传的照片沿用这份文字配方。各张照片的临时调整与照片本身不会缓存。浏览器禁止本地存储时仍可编辑和导出。字体采用 SIL OFL 1.1 授权并本地打包。


## 字体与主题

新增缝合像素 10px、缝合像素 12px 与俐方体 Cubic 11，均包含中文和英文字形；默认缝合像素 12px。保留 Doto、Silkscreen、Press Start 2P，缺少的中文字形通过缝合像素 12px 补全。Pixelify Sans 已移除，旧文字缓存自动迁移到新默认字体。字体授权、版本和覆盖范围见 [docs/fonts.md](docs/fonts.md)。

顶栏支持浅色 / 深色切换，首次打开跟随系统主题；手动选择保存在本机。界面主题不会改变片基、文字、齿孔或导出图片的颜色。
