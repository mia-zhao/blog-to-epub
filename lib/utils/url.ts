export function normalizeUrl(url: string): string {
  const urlObj = new URL(url)
  return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`
}
