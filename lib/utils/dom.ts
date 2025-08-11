export function getBoundingElement(event: MouseEvent): HTMLElement | null {
  for (const target of event.composedPath()) {
    if (!(target instanceof HTMLElement)) continue
    const rect = target.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) continue
    return target
  }
  return null
}

export function setElementStyle(
  element: HTMLElement,
  style: Partial<CSSStyleDeclaration>
) {
  Object.assign(element.style, style)
}

export function removeElementStyle(
  element: HTMLElement,
  style: Partial<CSSStyleDeclaration>
) {
  Object.keys(style).forEach((key) => element.style.removeProperty(key))
}

function getCssSelector(target: Element): string {
  return `${target.tagName.toLowerCase()}`
}

export function getCssSelectorPath(target: Element): string {
  let path = ""
  let current: Element | null = target
  while (current !== null && current.tagName.toLowerCase() !== "html") {
    const selector = getCssSelector(current)
    path = `${selector} > ${path}`
    current = current.parentElement
  }
  return path.substring(0, path.length - 3)
}

export function getParallelList(element: HTMLElement): HTMLElement[] {
  const path = getCssSelectorPath(element)
  return Array.from(document.querySelectorAll(path))
}

export function getHref(element: HTMLAnchorElement): string {
  return element.getAttribute("href") || ""
}

export function getTitle(element: HTMLElement): string {
  const text = element.innerText
  if (text) return text
  if (element.parentElement) return getTitle(element.parentElement)
  return ""
}

export function getDocumentTitle(doc: Document): string {
  return (
    doc.querySelector("title")?.textContent ||
    doc.querySelector('meta[property="og:title"]')?.getAttribute("content") ||
    doc
      .querySelector('meta[property="twitter:title"]')
      ?.getAttribute("content") ||
    doc.querySelector('meta[name="title"]')?.getAttribute("content") ||
    doc.querySelector("h1")?.textContent ||
    ""
  )
}

export function getDocumentAuthor(doc: Document): string {
  return (
    doc.querySelector('meta[property="author"]')?.getAttribute("content") ||
    doc
      .querySelector('meta[property="article:author"]')
      ?.getAttribute("content") ||
    ""
  )
}

export function isPlasmoUI(element: Element): boolean {
  // Check if element is a shadow root host or inside one
  const rootNode = element.getRootNode()
  if (rootNode instanceof ShadowRoot) {
    const host = rootNode.host
    if (
      host.tagName?.toLowerCase() === "plasmo-csui" ||
      host.id === "plasmo-shadow-container" ||
      host.classList?.contains("plasmo-csui-container")
    ) {
      return true
    }
  }

  // Check if element is inside a Plasmo container
  if (element.closest) {
    return !!element.closest(
      "plasmo-csui, #plasmo-shadow-container, .plasmo-csui-container"
    )
  }

  return false
}

export function showTooltip(message: string, x: number, y: number) {
  const tooltip = document.createElement("div")
  tooltip.textContent = message
  tooltip.style.position = "fixed"
  tooltip.style.left = `${x}px`
  tooltip.style.top = `${y - 30}px`
  tooltip.style.backgroundColor = "#ff4444"
  tooltip.style.color = "white"
  tooltip.style.padding = "5px 10px"
  tooltip.style.borderRadius = "4px"
  tooltip.style.zIndex = "2147483647"
  tooltip.style.fontSize = "14px"
  tooltip.style.pointerEvents = "none"
  document.body.appendChild(tooltip)

  setTimeout(() => {
    tooltip.style.transition = "opacity 0.5s"
    tooltip.style.opacity = "0"
    setTimeout(() => tooltip.remove(), 500)
  }, 1000)
}

export function getClosestAnchor(
  element: Element | null
): HTMLAnchorElement | null {
  let current = element
  while (current && current !== document.body) {
    if (current.tagName === "A") {
      return current as HTMLAnchorElement
    }
    current = current.parentElement
  }
  return null
}
