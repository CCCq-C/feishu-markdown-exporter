# Feishu Markdown Exporter

一个在 Chrome 浏览器本地运行的扩展。它将当前账号已经可以正常阅读的飞书或 Lark Wiki / Docx 页面导出为 Markdown (`.md`) 或 Word (`.docx`) 文件，便于离线查看、归档与二次整理。

> 这不是权限绕过工具：扩展只读取当前已打开、当前账号可阅读的页面，不能导出无权访问的内容。

代码镜像：[GitHub](https://github.com/CCCq-C/feishu-markdown-exporter) · [Gitee](https://gitee.com/Chance-Ccc/feishu-markdown-exporter)

## 功能

- Markdown：导出标题、段落、列表、待办、引用、代码、表格、链接、附件和图片；图片会下载到同名 `-assets` 文件夹。
- Word：导出为标准 `.docx`，保留常见标题、文字样式、列表、表格、链接和 PNG/JPEG/GIF/BMP 图片。
- 本地处理：没有后端、账户、额度、埋点或远程代码；文档内容不会上传，也不会读取或保存 Cookie。

## 使用方式

### 环境自检与自动补依赖（推荐 AI 先执行）

在构建、测试或打包前，先运行：

```bash
npm run doctor -- --json
```

AI 应按返回的 `status` 执行：

1. `ready`：直接运行 `npm test`、`npm run build` 或 `npm run package`。
2. `repairable`：只缺本项目的 npm 依赖，运行 `npm run setup` 自动补齐，然后再次运行 `npm run doctor -- --json`。
3. `manual`：存在 Node.js、npm 或系统 `zip` 等系统级前置条件问题。AI 应展示每项检查中的 `nextCommand`，取得用户同意后再执行；不能擅自修改系统、全局 npm 配置或安装浏览器软件。

`npm run setup` 默认使用中国 npm 镜像 `https://registry.npmmirror.com`，仅对当前项目执行 `npm install`，不会写入全局 npm 配置：

```bash
npm run setup

# 临时换用其他镜像，不修改全局设置
npm run setup -- --registry=https://registry.npmjs.org
# 或
NPM_REGISTRY=https://registry.npmmirror.com npm run setup
```

若自检提示 Node.js 低于 20，已安装 nvm 的 macOS/Linux 用户可使用 Node 中国镜像安装：

```bash
export NVM_NODEJS_ORG_MIRROR=https://npmmirror.com/mirrors/node
nvm install 20
nvm use 20
```

若缺少打包用的 `zip` 命令，请由用户确认后执行相应系统命令：macOS 使用 `xcode-select --install`；Debian/Ubuntu 使用 `sudo apt-get install -y zip`。Windows 用户可在 WSL 中安装 `zip`，或在具备 `zip` 命令的 CI/macOS/Linux 环境打包。

### 下载压缩包后，导入 Chrome

压缩包下载完不能直接拖进 Chrome，也不能直接选择 ZIP 文件。按下面做一次，就能导入扩展：

1. 解压下载的压缩包，得到 `feishu-markdown-exporter` 文件夹。
2. 安装 Node.js 20 或更高版本。
3. 打开“终端”，进入刚才解压出来的文件夹。例如：

   ```bash
   cd ~/Downloads/feishu-markdown-exporter
   ```

4. 运行这一条命令：

   ```bash
   npm run setup
   ```

   它会自动安装本项目需要的东西，并自动生成 Chrome 扩展文件。第一次解压安装时运行一次即可，不需要再单独运行 `npm run build`。

5. 在 Chrome 地址栏打开 `chrome://extensions`，开启右上角的“开发者模式”。
6. 点击“加载已解压的扩展程序”，选择第 1 步解压出来的 `feishu-markdown-exporter` 文件夹。不要选择 ZIP 压缩包。
7. 打开当前账号可阅读的 `*.feishu.cn/wiki|docx` 或 `*.larkoffice.com/wiki|docx` 页面，点击扩展图标，选择导出格式，再点击“导出当前文档”。

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
npm run doctor -- --json
npm run setup
npm test
npm run build
npm run package
unzip -t dist/feishu-markdown-exporter.zip
```

自动测试会校验 Markdown 与 Word 文档结构、扩展清单和发布包内容。发布前还应在 Chrome 中手动加载扩展，并分别用一个公开页面和一个你已获授权的私有页面验证 `.md` / `.docx` 下载结果。

## 发布说明

上传 Chrome Web Store 前，请在后台如实填写单一用途、三项权限的必要性和用户数据声明，并遵守飞书文档权限及适用法律。
