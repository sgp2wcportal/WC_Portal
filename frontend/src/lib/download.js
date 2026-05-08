/**
 * Trigger a browser download from an axios blob response.
 * Falls back to a sensible filename if the server didn't provide one.
 */
export const triggerDownload = (response, fallbackName = 'download.bin') => {
  const blob = response.data
  let filename = fallbackName

  const cd = response.headers?.['content-disposition'] || response.headers?.get?.('content-disposition')
  if (cd) {
    const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(cd)
    if (match?.[1]) {
      try {
        filename = decodeURIComponent(match[1].replace(/"/g, ''))
      } catch {
        filename = match[1]
      }
    }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
