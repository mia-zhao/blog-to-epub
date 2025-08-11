import cssText from "data-text:~/style.css"
import { useEffect, useState } from "react"

import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

import { DraggableOverlay } from "~/components/draggable-overlay"
import type { Collection } from "~/lib/types"
import {
  ContentSharedMessage,
  ContentToBackgroundMessage,
  SAVED_ARTICLES_KEY
} from "~/lib/types"
import { normalizeUrl } from "~/lib/utils"

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
    if (!collection || !collection.info) return
    setSelectedHrefs(collection.info.map((item) => item.url))
  }, [collection])

  const saveForLater = () => {
    const storage = new Storage({
      area: "local"
    })
    storage.get(SAVED_ARTICLES_KEY).then((result) => {
      const savedArticles = (result as unknown as Collection["info"]) || []
      const newUrls = collection?.info?.map((item) => item.url) || []
      const urlsToSave = new Set<string>([
        ...savedArticles.map((i) => i.url),
        ...newUrls
      ])
      const savedArticlesToSave = [...urlsToSave].map((url) => ({
        url,
        title: savedArticles.find((i) => i.url === url)?.title
      }))
      storage.set(SAVED_ARTICLES_KEY, savedArticlesToSave)
    })

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
          Click on the hyperlink to select the article. Double-click on the
          hyperlink to select a list of articles.
        </p>
      )
    }

    return (
      <>
        <div>
          <div className="text-lg text-black">
            ✅ {selectedHrefs.length} articles selected
          </div>
          <p className="mt-2">
            Click on the hyperlink to deselect the article. Double-click on the
            hyperlink to deselect a list of articles.
          </p>
        </div>
        <div className="mt-4 flex gap-4 text-lg">
          <button
            className="btn bg-black text-white hover:bg-black/80"
            onClick={async () => {
              try {
                await chrome.runtime.sendMessage({
                  type: ContentToBackgroundMessage.OPEN_OPTIONS
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
