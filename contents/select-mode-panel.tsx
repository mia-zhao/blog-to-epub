import cssText from "data-text:~/style.css"
import { useEffect, useState } from "react"

import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

import { DraggableOverlay } from "~/components/draggable-overlay"
import {
  ContentSharedMessage,
  ContentToBackgroundMessage,
  type Collection
} from "~/lib/types"
import { normalizeUrl, storageService } from "~/lib/utils"

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText.replaceAll(":root", ":host(plasmo-csui)")
  return style
}

export default function Content() {
  const [inSelectMode, setInSelectMode] = useState(false)
  const [selectedHrefs, setSelectedHrefs] = useState<string[]>([])

  const currentUrl = normalizeUrl(document.URL)

  const [collection] = useStorage<Collection>({
    key: currentUrl,
    instance: new Storage({
      area: "local"
    })
  })

  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      if (event.source !== window) return
      if (event.data?.type === ContentSharedMessage.SHARE_SELECT_MODE) {
        setInSelectMode(event.data.data.selectMode)
      }
    }

    window.addEventListener("message", messageHandler)

    // Clean up
    return () => {
      window.removeEventListener("message", messageHandler)
    }
  }, [])

  useEffect(() => {
    if (!collection || !collection.info) {
      setSelectedHrefs([])
      return
    }
    setSelectedHrefs(collection.info.map((item) => item.url))
  }, [collection])

  const saveForLater = () => {
    void (async () => {
      await storageService.saveForLater(collection)
    })()

    // notify content script to exit select mode
    window.postMessage(
      {
        type: ContentSharedMessage.SHARE_SELECT_MODE,
        data: { selectMode: false }
      },
      window.location.origin
    )
  }

  const renderPanel = (selectedHrefs: string[]) => {
    if (selectedHrefs.length === 0) {
      return (
        <p>
          Click a link to select an article. Double-click to select multiple
          articles at once.
        </p>
      )
    }

    return (
      <>
        <div>
          <div className="text-lg">
            ✅ {selectedHrefs.length} article
            {selectedHrefs.length === 1 ? "" : "s"} selected
          </div>
          <p className="mt-2">
            Selected articles are highlighted in yellow. Click highlighted links
            to deselect, or double-click to deselect multiple articles.
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-lg">
          <button
            className="btn bg-black text-white hover:bg-black/80"
            onClick={async () => {
              try {
                await chrome.runtime.sendMessage({
                  type: ContentToBackgroundMessage.OPEN_OPTIONS,
                  url: currentUrl
                })
              } catch (error) {
                console.error("Failed to open options page:", error)
              }
            }}>
            Generate EPUB
          </button>
          <button className="btn" onClick={() => saveForLater()}>
            Save for later
          </button>
        </div>
      </>
    )
  }

  if (inSelectMode) {
    return (
      <DraggableOverlay
        title="Blog to EPUB"
        onClose={() => setInSelectMode(false)}
        initialPosition={{ x: window.innerWidth - 360, y: 20 }}>
        {renderPanel(selectedHrefs)}
      </DraggableOverlay>
    )
  }

  return null
}
