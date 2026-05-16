#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const {
  downloadFile,
  resolveOutputPath,
  formatProgress
} = require('../lib/download')

const DEFAULT_OUTPUT_DIR = path.join(process.cwd(), 'downloads')

function printHelp() {
  console.log(`
offline-download — 将远程文件下载到本地

用法:
  offline-download <url> [输出路径]
  offline-download <url1> <url2> ... [-o 目录]
  offline-download -f <urls.txt> [-o 目录]
  offline-download -h

选项:
  -f, --file <path>    从文本文件读取 URL（每行一个）
  -o, --output <dir>   批量下载时的输出目录（默认: ./downloads）
  -h, --help           显示帮助

示例:
  offline-download https://example.com/file.zip
  offline-download https://example.com/a.png ./images/a.png
  offline-download -f urls.txt -o ./downloads
`)
}

function parseArgs(argv) {
  const args = {
    urls: [],
    outputPath: null,
    file: null,
    outputDir: DEFAULT_OUTPUT_DIR,
    help: false
  }

  const positionals = []

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]

    if (arg === '-h' || arg === '--help') {
      args.help = true
      continue
    }

    if (arg === '-f' || arg === '--file') {
      args.file = argv[i + 1]
      i += 1
      continue
    }

    if (arg === '-o' || arg === '--output') {
      args.outputDir = path.resolve(process.cwd(), argv[i + 1])
      i += 1
      continue
    }

    if (arg.startsWith('-')) {
      throw new Error(`未知参数: ${arg}`)
    }

    positionals.push(arg)
  }

  if (positionals.length === 1) {
    args.urls = [positionals[0]]
  } else if (positionals.length === 2 && isLikelyUrl(positionals[0])) {
    args.urls = [positionals[0]]
    args.outputPath = positionals[1]
  } else {
    args.urls = positionals
  }

  return args
}

function isLikelyUrl(value) {
  return /^https?:\/\//i.test(value)
}

async function loadUrlsFromFile(filePath) {
  const content = await fs.promises.readFile(filePath, 'utf8')
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
}

async function runOne(url, outputPath, outputDir) {
  const destPath = resolveOutputPath(url, outputPath, outputDir)
  process.stdout.write(`下载: ${url}\n  -> ${destPath}\n`)

  const { bytes } = await downloadFile(url, destPath, {
    onProgress(loaded, total) {
      process.stdout.write(`\r  进度: ${formatProgress(loaded, total)}   `)
    }
  })

  process.stdout.write(`\r  完成: ${bytes} 字节 -> ${destPath}\n\n`)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    printHelp()
    process.exit(0)
  }

  let urls = [...args.urls]

  if (args.file) {
    const fromFile = await loadUrlsFromFile(args.file)
    urls = urls.concat(fromFile)
  }

  if (urls.length === 0) {
    printHelp()
    process.exit(1)
  }

  await fs.promises.mkdir(args.outputDir, { recursive: true })

  if (urls.length === 1) {
    await runOne(urls[0], args.outputPath, args.outputDir)
    return
  }

  if (args.outputPath) {
    console.error('错误: 批量下载时不能为每个 URL 单独指定输出路径，请使用 -o 指定目录')
    process.exit(1)
  }

  for (const url of urls) {
    await runOne(url, null, args.outputDir)
  }
}

main().catch((err) => {
  console.error(`\n错误: ${err.message}`)
  process.exit(1)
})
