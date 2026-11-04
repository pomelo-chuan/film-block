# shadcn/ui 与移动端布局

2026-11-04 查询 npm：shadcn CLI 最新版 **4.23.0**、Tailwind CSS **4.3.4**、radix-ui **1.8.1**。实际安装版本由 package-lock.json 固定，构建使用 npm ci。

## 官方组件来源

UI 组件同步自 [shadcn-ui/ui](https://github.com/shadcn-ui/ui/tree/4aaea19d9cff3e0908e12a8c1d504b8c5ec34610/apps/v4/registry/new-york-v4/ui)，读取时最新 commit 为 `4aaea19d9cff3e0908e12a8c1d504b8c5ec34610`，Radix / new-york-v4 样式。

集成 Button、Input、Select、Switch、Slider、Tabs、Toggle / ToggleGroup、Checkbox、Sheet、Dialog、Label、Badge、Separator 和 Alert。遵循 shadcn 的源码管理方式，组件位于 `src/components/ui/`，而非仅添加同名包装。配置位于 components.json，Tailwind v4 由 @tailwindcss/vite 接入，cn 使用 clsx 与 tailwind-merge。

本地适配：

- 将上游 `cn` 和 registry 目录引用改为当前项目路径别名。
- Slider 将调用方 aria-label 同步到实际 slider thumb，保证键盘及辅助技术能识别字号。
- 通过组件的 className、受控状态与事件 API 接入胶片设置，使用统一的品牌 theme tokens。
- 应用自定义 Dialog / Sheet 关闭按钮以提供 44px 触摸目标，并明确返回对应的触发按钮。

shadcn/ui 采用 MIT 授权，完整授权文本随站点保存在 `public/licenses/shadcn-ui-MIT.txt`。原项目及其他字体授权保持原样。

## 手机操作

- 小屏优先定义布局；1024px 起使用预览 / 设置双栏。
- 手机预览根据视口高度收缩，横屏进一步缩小；放大图通过受控 Dialog 显示。
- 照片条横向滚动，避免多图撑宽页面；点击照片切换预览，角标显示选中状态。
- 「管理」开启底部 Sheet，包含多选、全选、删除与添加；当前照片与调整范围保持原有行为。
- 设置使用胶卷 / 片基 / 文字 / 日期 Tabs，一次只展开一组，减少页面长度。
- 手机底部固定质量选择与导出；主内容留出安全区与滚动空间。桌面导出栏在侧栏中正常排版。
- iOS 文本输入采用 16px，避免聚焦时自动放大；菜单、按钮、管理操作行提供至少 44px 触摸区域。
- 支持 reduced-motion，保持深浅主题、中文字体、文字及导出质量缓存。
- JSZip 使用动态 import，仅多图打包时请求，单张 JPEG / PNG 导出不加载 ZIP chunk。

## 验证

现有胶片规格、文字缓存和图片编码单元测试保留。生产构建通过 Chromium 的 320 / 390 / 768 / 1440px 操作验证，包括多图横滑、管理多选和删除、单独调整、Tabs、Select、Switch、键盘 Slider、焦点返回、主题与缓存，以及实际 PNG / JPEG / ZIP 下载。字体与照片的渲染不受界面主题影响。

## 注册表网络限制

CLI 的 `--version` 验证为 4.23.0。当前云环境访问 `https://ui.shadcn.com/r/index.json` 返回代理 403，所以 `shadcn info` 不能完成在线注册表检查。现有组件已从上述官方 GitHub 固定 commit 接入并通过编译与实际交互验证，应用运行和 GitHub Pages 构建不请求组件注册表。以后通过 CLI 在线添加或升级组件，需要环境网络设置允许 `ui.shadcn.com`。
