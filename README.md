# Feishu Markdown Exporter

一个在 Chrome 浏览器本地运行的扩展。它将当前账号已经可以正常阅读的飞书或 Lark Wiki / Docx 页面导出为 Markdown (`.md`) 或 Word (`.docx`) 文件，便于离线查看、归档与二次整理。

> 这不是权限绕过工具：扩展只读取当前已打开、当前账号可阅读的页面，不能导出无权访问的内容。

## 功能

- Markdown：导出标题、段落、列表、待办、引用、代码、表格、链接、附件和图片；图片会下载到同名 `-assets` 文件夹。
- Word：导出为标准 `.docx`，保留常见标题、文字样式、列表、表格、链接和 PNG/JPEG/GIF/BMP 图片。
- 本地处理：没有后端、账户、额度、埋点或远程代码；文档内容不会上传，也不会读取或保存 Cookie。

## 使用方式

### 从源码加载

1. 安装 Node.js 20 或更高版本。
2. 在项目根目录运行：

   ```bash
   npm install
   npm run build
   ```

3. 在 Chrome 打开 `chrome://extensions`，开启“开发者模式”。
4. 点击“加载已解压的扩展程序”，选择本项目根目录。
5. 打开当前账号可阅读的 `*.feishu.cn/wiki|docx` 或 `*.larkoffice.com/wiki|docx` 页面，点击扩展图标，选择导出格式，再点击“导出当前文档”。

### 使用发布包

```bash
npm run package
```

命令会生成 `dist/feishu-markdown-exporter.zip`，可用于 Chrome Web Store 上传。Chrome 本地“加载已解压的扩展程序”应选择已构建的项目根目录，而不是 ZIP 文件。

## 支持范围与限制

| 范围 | 当前支持 | 说明 |
| --- | --- | --- |
| 页面 | Wiki、Docx | 不支持旧版 `/doc/` 页面。 |
| 访问 | 已可阅读内容 | 必须先在当前标签页正常打开并读取到页面内容。 |
| Markdown 图片 | 支持 | 可读取到的图片作为本地 assets 下载。 |
| Word 图片 | 常见格式支持 | PNG、JPEG、GIF、BMP 嵌入；其他格式会以提示文字保留。 |
| 复杂内容 | 尽力转换 | 白板、互动块、复杂嵌入和未识别块可能无法保持原样。 |

## 隐私与权限

- `activeTab`：仅在用户主动点击扩展后，临时访问当前标签页。
- `scripting`：在当前页面注入固定的本地提取器，读取已渲染的文档块。
- `downloads`：把用户选择的 Markdown、Word 与 Markdown 图片保存到本地。

扩展不声明广泛网站权限，不读取浏览器 Cookie，不发送文档到网络服务，也不加载远程脚本。

## 开发与验收

```bash
npm test
npm run build
npm run package
unzip -t dist/feishu-markdown-exporter.zip
```

自动测试会校验 Markdown 与 Word 文档结构、扩展清单和发布包内容。发布前还应在 Chrome 中手动加载扩展，并分别用一个公开页面和一个你已获授权的私有页面验证 `.md` / `.docx` 下载结果。

## 发布说明

上传 Chrome Web Store 前，请在后台如实填写单一用途、三项权限的必要性和用户数据声明，并遵守飞书文档权限及适用法律。
