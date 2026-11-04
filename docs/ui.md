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

## 当前编辑器交互

按用户提供的移动端截图调整交互与布局，未扩展功能范围：

- 中央大预览，照片完整显示且不旋转；放大与删除仍在预览区。
- 左上返回原有照片管理面板，右上打开原有导出质量及下载操作。
- 顶部文字、日期按钮直接切换原有显示开关；主题按钮切换已有深浅模式。
- 底部横向照片条，添加入口位于最左；只显示当前支持的 135 / 120 两种胶卷。
- 底部胶卷 / 片基 / 文字 / 日期工具栏打开现有设置的底部 Sheet，面板内保留全部 / 选中应用范围。
- 导出成功自动关闭面板返回预览；退出面板回到触发按钮；底部保留最后编辑工具的选中状态。
- 黑色背景与暖金选中态参考截图，浅色模式和主题偏好仍保留；界面配色不影响导出照片。
- 不复制截图中的方格、半格、XPan、645、67、拼接、原图、光签等额外项目，也不修改既有胶片渲染和日期写入实现。
- 单屏自适应预览，短屏可纵向滚动；触摸入口最小 44px，面板和菜单可独立滚动，支持安全区与 reduced-motion。
- ZIP 库仍在批量导出时动态加载；原有字体、文字、日期开关、质量和主题缓存保持兼容。

## 验证

现有胶片规格、文字缓存和图片编码单元测试保留。生产构建通过 Chromium 的 320 / 390 / 768 / 1440px 操作验证，包括多图横滑、管理多选和删除、单独调整、Tabs、Select、Switch、键盘 Slider、焦点返回、主题与缓存，以及实际 PNG / JPEG / ZIP 下载。字体与照片的渲染不受界面主题影响。

## 注册表网络限制

CLI 的 `--version` 验证为 4.23.0。当前云环境访问 `https://ui.shadcn.com/r/index.json` 返回代理 403，所以 `shadcn info` 不能完成在线注册表检查。现有组件已从上述官方 GitHub 固定 commit 接入并通过编译与实际交互验证，应用运行和 GitHub Pages 构建不请求组件注册表。以后通过 CLI 在线添加或升级组件，需要环境网络设置允许 `ui.shadcn.com`。
