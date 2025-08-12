import { ContentSharedMessage, PopupToContentMessage } from "~/lib/types"
import {
  getClosestAnchor,
  getDocumentTitle,
  getHref,
  getParallelList,
  getTitle,
  isPlasmoUI,
  normalizeUrl,
  removeElementStyle,
  setElementStyle,
  showTooltip,
  storageService
} from "~lib/utils"

// content script as single source of truth for select mode
let selectMode = false

let selectedElements: HTMLAnchorElement[] = []

let cleanupHandlers: (() => void)[] = []
let clickTimeout: ReturnType<typeof setTimeout> | null = null

chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  if (message.type === PopupToContentMessage.GET_SELECT_MODE) {
    sendResponse({ selectMode })
    return true
  } else if (message.type === PopupToContentMessage.ENTER_SELECT_MODE) {
    cleanup()

    selectMode = true
    notifySelectModeChange(selectMode)

    // Load previously selected elements
    storageService
      .getCollection(normalizeUrl(document.URL))
      .then((collection) => {
        if (collection?.info) {
          // Find and highlight elements that match stored URLs
          const urlSet = new Set(collection.info.map((item) => item.url))
          document.querySelectorAll("a").forEach((link) => {
            const href = link.getAttribute("href")
            if (href && urlSet.has(new URL(href, document.URL).href)) {
              selectedElements.push(link)
              setElementStyle(link, {
                backgroundColor: "rgb(255, 233, 165, 0.8)"
              })
            }
          })
        }
      })

    const cleanupOverlay = handleOverlay()

    // use mouse clicks to select and deselect elements
    // useCapture is set to true to prevent the event from bubbling up
    document.addEventListener("click", clickListener, true)
    document.addEventListener("dblclick", dblclickListener)

    cleanupHandlers.push(
      cleanupOverlay,
      () => document.removeEventListener("click", clickListener, true),
      () => document.removeEventListener("dblclick", dblclickListener)
    )

    sendResponse({ selectMode })
    return true
  } else if (message.type === PopupToContentMessage.EXIT_SELECT_MODE) {
    cleanup()

    if (clickTimeout) {
      clearTimeout(clickTimeout)
      clickTimeout = null
    }

    selectMode = false
    notifySelectModeChange(selectMode)

    sendResponse({ selectMode })
    return true
  }
})

window.addEventListener("message", (event) => {
  if (event.source !== window) return
  if (event.data?.type === ContentSharedMessage.SHARE_SELECT_MODE) {
    const newMode = event.data.data.selectMode
    if (selectMode !== newMode) {
      selectMode = newMode
      if (!selectMode) {
        cleanup()
      }
    }
  }
})

function notifySelectModeChange(newMode: boolean) {
  window.postMessage(
    {
      type: ContentSharedMessage.SHARE_SELECT_MODE,
      data: { selectMode: newMode }
    },
    window.location.origin
  )
}

function cleanup() {
  cleanupHandlers.forEach((handler) => handler())
  cleanupHandlers = []

  selectedElements.forEach((el) => {
    setElementStyle(el, { backgroundColor: "inherit" })
  })
  selectedElements = []
}

// single click to select and deselect one element
function clickListener(event: MouseEvent) {
  const target = event.target as Element
  if (isPlasmoUI(target)) {
    return
  }

  event.stopImmediatePropagation()
  event.preventDefault()

  const clickHandler = () => {
    void (async () => {
      const anchor = getClosestAnchor(target)

      if (!anchor) {
        showTooltip("Please select a hyperlink", event.clientX, event.clientY)
        return
      }

      const highlightStyle = { backgroundColor: "rgb(255, 233, 165, 0.8)" }

      // Toggle selection
      if (selectedElements.includes(anchor)) {
        selectedElements = selectedElements.filter((el) => el !== anchor)
        setElementStyle(anchor, { backgroundColor: "inherit" })
      } else {
        selectedElements.push(anchor)
        setElementStyle(anchor, highlightStyle)
      }

      await updateList(selectedElements)
    })()
  }

  if (event.detail == 1) {
    clickTimeout = setTimeout(() => {
      clickHandler()
    }, 250)
  }
}

// double click to select and deselect multiple elements
function dblclickListener(event: MouseEvent) {
  void (async () => {
    if (isPlasmoUI(event.target as Element)) {
      return
    }

    event.stopImmediatePropagation()
    event.preventDefault()

    // cancel single click event listener
    if (clickTimeout !== null) {
      clearTimeout(clickTimeout)
      clickTimeout = null
    }

    const anchor = getClosestAnchor(event.target as Element)
    if (!anchor) {
      showTooltip(
        "Please double-click on a hyperlink",
        event.clientX,
        event.clientY
      )
      return
    }

    const highlightStyle = { backgroundColor: "rgb(255, 233, 165, 0.8)" }
    const listToToggle = getParallelList(anchor) as HTMLAnchorElement[]

    if (selectedElements.includes(anchor)) {
      // Deselect
      selectedElements.forEach((el) => {
        if (listToToggle.includes(el)) {
          setElementStyle(el, { backgroundColor: "inherit" })
        }
      })

      selectedElements = selectedElements.filter(
        (selected) => !listToToggle.includes(selected)
      )
    } else {
      // Select
      selectedElements = selectedElements.concat(listToToggle)
      listToToggle.forEach((el) => {
        setElementStyle(el, highlightStyle)
      })
    }

    await updateList(selectedElements)
  })()
}

function handleOverlay(): () => void {
  const overlayContainer = document.createElement("div")
  overlayContainer.id = "overlay-container"
  document.body.appendChild(overlayContainer)

  const shadow = overlayContainer.attachShadow({ mode: "open" })
  const overlay = document.createElement("div")
  overlay.id = "overlay"
  shadow.appendChild(overlay)

  let overlayStyle: Partial<CSSStyleDeclaration> = {
    boxSizing: "border-box",
    pointerEvents: "none",
    position: "fixed",
    zIndex: "2147483647",
    border: "1px dashed grey"
  }

  const mouseOverListener = (event) => {
    if (!event.target || isPlasmoUI(event.target as Element)) {
      return
    }

    event.preventDefault()
    event.stopImmediatePropagation()

    const anchor = getClosestAnchor(event.target as Element)
    if (!anchor) {
      overlay.style.display = "none"
      return
    }

    const { top, left, width, height } = anchor.getBoundingClientRect()
    overlayStyle = {
      ...overlayStyle,
      display: "block",
      top: `${top}px`,
      left: `${left}px`,
      width: `${width}px`,
      height: `${height}px`
    }
    setElementStyle(overlay, overlayStyle)
  }

  const mouseOutListener = () => {
    removeElementStyle(overlay, overlayStyle)
  }

  document.addEventListener("mouseover", mouseOverListener)
  document.addEventListener("mouseout", mouseOutListener)

  return () => {
    document.body.removeChild(overlayContainer)
    document.removeEventListener("mouseover", mouseOverListener)
    document.removeEventListener("mouseout", mouseOutListener)
  }
}

async function updateList(listElements: HTMLAnchorElement[]) {
  const info: { url: string; title: string }[] = []

  listElements.forEach((element) => {
    const href = getHref(element)
    const text = getTitle(element)
    if (href != null) {
      const url = new URL(href, document.URL)
      if (info.some((item) => item.url === url.href)) return
      info.push({ url: url.href, title: text })
    }
  })

  await storageService.addToHomeList(normalizeUrl(document.URL))

  await storageService.saveCollection(normalizeUrl(document.URL), {
    title: getDocumentTitle(document),
    info
  })
}

window.addEventListener("unload", () => {
  cleanup()
  if (clickTimeout) clearTimeout(clickTimeout)
})
