const fs = require('fs')
const path = require('path')
const { pipeline } = require('stream/promises')
const { Readable } = require('stream')

/**
 * @param {string} url
 * @param {string} destPath 完整输出路径
 * @param {{ onProgress?: (loaded: number, total: number | null) => void }} [options]
 */
async function downloadFile(url, destPath, options = {}) {
  const { onProgress } = options
  const dir = path.dirname(destPath)

  await fs.promises.mkdir(dir, { recursive: true })

  const response = await fetch(url, { redirect: 'follow' })

  if (!response.ok) {
    throw new Error(`请求失败: ${response.status} ${response.statusText} (${url})`)
  }

  const total = response.headers.get('content-length')
    ? Number(response.headers.get('content-length'))
    : null

  if (!response.body) {
    const buffer = Buffer.from(await response.arrayBuffer())
    await fs.promises.writeFile(destPath, buffer)
    if (onProgress) onProgress(buffer.length, buffer.length)
    return { bytes: buffer.length, destPath }
  }

  let loaded = 0
  const reader = Readable.fromWeb(response.body)

  reader.on('data', (chunk) => {
    loaded += chunk.length
    if (onProgress) onProgress(loaded, total)
  })

  const fileStream = fs.createWriteStream(destPath)
  await pipeline(reader, fileStream)

  return { bytes: loaded, destPath }
}

function resolveOutputPath(url, outputArg, outputDir) {
  if (outputArg) {
    return path.isAbsolute(outputArg)
      ? outputArg
      : path.resolve(process.cwd(), outputArg)
  }

  let filename
  try {
    const parsed = new URL(url)
    filename = path.basename(parsed.pathname) || 'download.bin'
    filename = decodeURIComponent(filename)
  } catch {
    filename = 'download.bin'
  }

  return path.join(outputDir, filename)
}

function formatBytes(n) {
  if (n == null || Number.isNaN(n)) return '?'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

function formatProgress(loaded, total) {
  if (total == null || total <= 0) {
    return formatBytes(loaded)
  }
  const pct = Math.min(100, Math.round((loaded / total) * 100))
  return `${pct}% (${formatBytes(loaded)} / ${formatBytes(total)})`
}

module.exports = {
  downloadFile,
  resolveOutputPath,
  formatBytes,
  formatProgress
}
