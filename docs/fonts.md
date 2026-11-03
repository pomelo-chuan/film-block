# FILM BLOCK 开源字体

所有字体随站点本地发布，无外部字体请求。字体文件未修改，采用 SIL OFL 1.1 授权。

| 界面选项 | 来源 / 版本 | 用途 |
| --- | --- | --- |
| 缝合像素 12px | [Fusion Pixel Font](https://github.com/TakWolf/fusion-pixel-font/releases/tag/2026.10.25)，12px proportional zh_hans | 默认；简繁中文、英文与标点，约 38,130 个字符 |
| 缝合像素 10px | 同一版本，10px proportional zh_hans | 较小网格，约 25,910 个字符 |
| 俐方体 Cubic 11 | [Cubic 11](https://github.com/ACh-K/Cubic-11)，commit `4c566f7d6cc5c05ee360fe9cff56b5da1fcafd4d` / v1.500 | 中文与英文，约 10,268 个字符；包含常用繁体与简体一级字 |
| Doto | @fontsource/doto | 英文点阵，中文回退到缝合像素 12px |
| Silkscreen | @fontsource/silkscreen | 英文像素，中文回退到缝合像素 12px |
| Press Start 2P | @fontsource/press-start-2p | 英文游戏像素，中文回退到缝合像素 12px |

使用 FontTools 读取打包 WOFF2 的 Unicode cmap，验证 `中文简体繁體胶片边框旅行記憶光影照片`、大小写英文字母和数字在三款新增字体中都有实际字形。以上覆盖数量来自实际打包文件，并非保证覆盖所有 Unicode 汉字。各字体缺字时先用缝合像素 12px，再用浏览器后备字体。

预览和导出会等待当前字体及中文补全字体加载，使用相同字体栈。字号保持按照片分辨率等比缩放，中文与英文可以混排。旧 Pixelify Sans 缓存迁移到缝合像素 12px，文字和显示开关保持不变。

原始下载地址与 SHA-256 位于 `public/fonts/sources.json`。完整授权位于 `public/licenses/`：Fusion Pixel 各版本的主 OFL 与上游 Ark Pixel、Cubic 11、Galmuri 授权均随包保留。Cubic 11 与三款英文字体的授权分别随站点发布。没有引入授权存在商业使用限制的字体。
