# offline-download

纯 Node.js 命令行工具，将远程文件下载到本地目录，无需前端框架。

## 环境要求

- Node.js 18+（使用内置 `fetch`）

## 安装

```bash
cd offline-download
npm link
```

也可不 link，直接用 `node bin/offline-download.js`。

## 使用

```bash
# 下载到默认目录 ./downloads
offline-download https://example.com/file.zip

# 指定保存路径
offline-download https://example.com/image.png ./images/image.png

# 从文件批量下载（每行一个 URL，# 开头为注释）
offline-download -f urls.example.txt -o ./downloads
```

## 项目结构

```
offline-download/
├── bin/offline-download.js   # CLI 入口
├── lib/download.js           # 下载逻辑
├── downloads/                # 默认输出目录（已 gitignore）
└── urls.example.txt          # URL 列表示例
```

## 远程仓库

```bash
git remote -v
# origin  https://github.com/leiyuedavid123/offline-download.git
```

首次推送：

```bash
git add .
git commit -m "init: Node.js 离线下载 CLI"
git push -u origin main
```
