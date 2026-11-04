# FILM BLOCK

浏览器里的胶片边框工作室。React 19 + TypeScript + Vite，界面使用 shadcn/ui + Radix UI + Tailwind CSS 4，使用 Canvas 渲染及 JSZip 打包，无后端，照片仅在本地处理。

支持多图上传、固定规格 135 / 120 边框、6 种片基预设和自定义颜色、文字、字色、可调字号及 6 种开源像素 / 点阵字体，可选纯色 / 细颗粒片基。135 齿孔尺寸、间距、圆角与排列自动生成，120 固定无齿孔；没有自定义孔形、孔数、边框宽度或内框线设置。默认统一调整全部照片，也可切换「仅选中」应用到勾选的照片。单张导出 JPEG / PNG，多张打包 ZIP。保持原图比例，不裁切；最终图片（含边框）的长边按导出质量限制。

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


## 导出质量

默认「均衡画质」使用 JPEG 88%，含边框长边最多 3200px，避免照片以大体积 PNG 导出。另有「轻量分享」（JPEG 78%，1920px）、「高画质」（JPEG 95%，6000px）和「无损保存」（PNG，6000px）。小图不会放大。JPEG 档位均为有损压缩，最终文件大小取决于照片内容；提示会显示实际下载体积。批量 ZIP 内的照片遵循同一档位，导出质量选择保存在当前浏览器。


## UI 与移动端

使用 shadcn CLI 4.23.0（2026-11-04 查询的最新版）、官方 Radix 组件、Tailwind CSS 4.3.4。组件源码在 `src/components/ui/`，配置为 `components.json`，路径别名为 `@/`。品牌的浅色 / 深色主题使用统一的 shadcn CSS tokens，并保留已有主题缓存。

移动端优先：紧凑预览、可横滑的照片条、胶卷 / 片基 / 文字 / 日期 Tabs、底部固定的质量选择与导出栏。批量选择与删除通过底部 Sheet 管理；Dialog / Sheet 支持焦点约束、Esc 关闭和返回原按钮。触摸按钮与操作行按至少 44px 设计，使用安全区留白。桌面端切换为双栏布局，导出栏回到设置侧栏。ZIP 库仅在批量导出时加载。

组件来源、授权与维护说明见 [docs/ui.md](docs/ui.md)。

## 相机日期印记

新增「日期」设置：上传时在本机读取 EXIF，优先使用 DateTimeOriginal（原始拍摄时间），缺失或无效时尝试 CreateDate（数字化时间）。默认将有效年月日以傻瓜相机日期后背风格印在照片右下角：橙色七段数码字、轻微辉光、`'YY MM DD`。没有有效日期则完全跳过；不会使用修改时间、上传时间、文件名或今天的日期来补。

日期印记与片基文字相互独立，可按全部 / 选中照片开关，开关会记住。照片内记录的年月日保持不变，不按浏览器时区换算。预览、缩略图、放大和各档 JPEG / PNG / ZIP 导出使用同一日期数据。原始照片不修改，日期作为像素印入新导出的图片，详情见 [docs/date-stamp.md](docs/date-stamp.md)。
