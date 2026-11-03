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

当前可选：缝合像素 12px、缝合像素 10px、俐方体 Cubic 11、Doto、Silkscreen、Press Start 2P。默认缝合像素 12px；英文字体缺少的中文字形由同源中文像素字体补全。Pixelify Sans 已移除，旧缓存自动迁移。

完整版本、覆盖范围、来源和授权记录见 [fonts.md](fonts.md)。预览与导出等待相同字体栈加载，字号在固定文字带中随图片分辨率等比缩放。

## darktable 调研记录（内框线及自定义齿孔现已移除）

2026-11-03 再次读取官方文档与实现：

- [framing 文档](https://github.com/darktable-org/dtdocs/blob/master/content/module-reference/processing-modules/framing.md) 和 [borders.c](https://github.com/darktable-org/darktable/blob/master/src/iop/borders.c)：模块生成纯色边框，并支持第二种颜色的内框线。内框线宽度相对最窄边框定义；偏移 0% 接触照片，100% 接触外边缘。
- [watermark 文档](https://github.com/darktable-org/dtdocs/blob/master/content/module-reference/processing-modules/watermark.md)：SVG / PNG 图案是独立叠加层，支持缩放、透明度、位置与文字替换。它与 framing 的处理顺序会影响定位。
- negadoctor 负责负片的颜色/密度和反相，并不会生成片基纹理或齿孔。以上模块没有内建 135 / 120 齿孔生成器，不能把本站的装饰样式称为 darktable 的胶卷模板。

据此调整本站：

1. 默认保持纯色片基，细颗粒纹理单独选择，仅作用于边框，固定随机种子以保证导出一致性。此纹理是本站实现，没有复制或宣称复现 darktable 算法。
2. 增加独立颜色、宽度与偏移的内框线，借鉴 framing 的参数关系；线条完整位于照片外，不覆盖原图。
3. 本站自己的 135 齿孔采用双侧圆角矩形、等距排列和独立文字区。默认每侧 8 孔，数量可调；高密度时等比缩小孔，保证孔不重叠。此处不是按物理毫米校准的胶片扫描模板。
4. 120 默认无孔，允许用户主动选择有孔装饰，并在界面标明区别。
5. 颜色仍是 sRGB 装饰近似，未将 negadoctor 的线性 Dmin 参数直接当作网页色值，也不改变用户照片的色彩。

## 当前版本：固定胶片规格

后续按用户简化需求改为固定规格：齿孔尺寸、圆角、间距和孔数均不再自定义，120 不提供有孔选项，移除了内框线设置。上面的 darktable 实现记录属于历史设计；当前几何与 SpektraLab 的参考边界详见 [film-geometry.md](film-geometry.md)。

## Doto 点阵字体与文字记忆

新增 [Doto](https://github.com/oliverlalan/Doto)，通过 @fontsource/doto 提供 Latin 400 字重，授权为 SIL OFL 1.1，随站点发布的授权文本位于 public/licenses/Doto-OFL.txt。字体不依赖外部请求，中文由缝合像素 12px 补全。文字内容、显示开关及文字样式在本机浏览器存储，关闭文字不会删除已输入内容；关闭时格号也不绘制。
