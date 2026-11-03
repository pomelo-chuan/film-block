# 片基颜色与像素字体

## 调研与预设范围

片基（未曝光区域）、成像乳剂和扫描/反相后的边缘颜色不能混为一谈。实际观感受胶卷、冲洗、光源、曝光、扫描白平衡和反相方法影响，不能用一个 HEX 色号代表某款胶卷。

参考 darktable 官方维护的 [negadoctor 文档](https://github.com/darktable-org/dtdocs/blob/master/content/module-reference/processing-modules/negadoctor.md)：片基颜色应从未曝光区域采样；黑白负片可使用中性的默认值，彩色负片则需要分别估算 RGB 通道；光源与白平衡会影响观感。

[negadoctor 实现](https://github.com/darktable-org/darktable/blob/master/src/iop/negadoctor.c) 的彩色底色初始化值 Dmin 为 (1.00, 0.45, 0.25)。这些是线性处理参数，不能直接当作网页 sRGB 色号使用，但支持以暖橙棕色作为彩色负片风格方向。

本工具提供的是不透明装饰边框，以下色号均是设计近似，并非品牌官方色、实测片基或可校色的扫描配置：

| 预设 | 色号 | 设计依据 |
| --- | --- | --- |
| 反相黑 | #171815 | 负片反相后常见的深色边缘 |
| 负片橙 | #B56532 | 彩色负片橙色遮罩的暖色观感 |
| 琥珀棕 | #8A482B | 彩色片基较深的橙棕色变化 |
| 深棕色 | #493025 | 更低亮度的负片棕色风格 |
| 黑白灰 | #A6A6A0 | 黑白片基接近中性的灰色风格 |
| 透明基 | #E6E2D7 | 透明片基在浅色背景上的装饰性模拟；不代表导出透明度 |

未将橄榄绿、酒红等任意装饰颜色继续标作常见片基；仍可通过自定义颜色选择。

资料查阅于 2026-11-03。Kodak 与 Ilford 官网技术资料请求被当前环境网络策略拒绝，因此没有引用未经读取的资料，也没有标注特定胶卷型号的精确色值。

## 本地开源字体

- [Pixelify Sans](https://github.com/eifetx/Pixelify-Sans)：默认字体。
- [Silkscreen](https://github.com/googlefonts/silkscreen)：复古屏幕字体。
- [Press Start 2P](https://github.com/codeman38/PressStart2P)：8-bit 游戏风格。

通过 @fontsource 包提供 Latin 400 字重，构建时打包为同源 WOFF2，不依赖远程字体服务。三者均使用 SIL Open Font License 1.1，完整授权文本保存在 public/licenses/ 并随站点发布。像素字形主要覆盖拉丁字符，中文回退到系统字体。

字号以边框宽度百分比定义（18–40%，默认 32%），随图片分辨率等比缩放。Canvas 预览和导出均等待所选字体加载，避免首屏和导出字形不一致。
