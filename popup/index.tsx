import { useEffect, useState } from "react"

import { PopupToContentMessage } from "~/lib/types"
import { getCurrentTab } from "~/lib/utils"

import "~style.css"

export default function Popup() {
  const [inSelectMode, setInSelectMode] = useState(false)
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    const prepare = async () => {
      const tab = await getCurrentTab()
      if (!tab?.id) return

      if (!tab.url?.startsWith("http")) {
        setSupported(false)
        return
      }

      try {
        const response = await chrome.tabs.sendMessage(tab.id, {
          type: PopupToContentMessage.GET_SELECT_MODE
        })
        setInSelectMode(response?.selectMode || false)
      } catch {
        setInSelectMode(false)
      }
    }

    prepare()
  }, [])

  const enterSelectMode = async () => {
    const tab = await getCurrentTab()
    if (!tab?.id) return

    try {
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: PopupToContentMessage.ENTER_SELECT_MODE
      })
      const selectMode = response?.selectMode || false
      setInSelectMode(selectMode)
      if (selectMode) {
        window.close()
      }
    } catch {
      setInSelectMode(false)
    }
  }

  const enterDeselectMode = async () => {
    const tab = await getCurrentTab()
    if (!tab?.id) return

    try {
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: PopupToContentMessage.EXIT_SELECT_MODE
      })
      setInSelectMode(response?.selectMode || false)
    } catch {
      setInSelectMode(false)
    }
  }

  const openOptions = () => {
    enterDeselectMode()
    chrome.tabs.create({ url: chrome.runtime.getURL("options.html") })
  }

  if (!supported) {
    return (
      <div className="w-[240px] flex flex-col m-4 gap-4">
        <p className="text-lg text-center">
          Pages with URLs like{" "}
          <code className="bg-gray-200 p-1 rounded">chrome-extension://</code>{" "}
          are not supported. <br /> Please try another page.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="w-[240px] flex flex-col m-4 gap-4">
        {!inSelectMode ? (
          <button className="btn rounded-xl" onClick={enterSelectMode}>
            <span className="mr-1 text-xl h-7 w-7">📖</span>
            <span className="text-lg">Select Articles</span>
          </button>
        ) : (
          <button className="btn rounded-xl" onClick={enterDeselectMode}>
            <span className="text-lg">Exit Select Mode</span>
          </button>
        )}
        <button className="btn btn-block rounded-lg" onClick={openOptions}>
          <span className="mr-1 text-xl h-7 w-7">📚</span>
          <span className="text-lg">Manage Collection</span>
        </button>
        <a
          className="link link-success text-lg text-center"
          href="https://forms.gle/RjyEXHSpriYWRRz3A"
          target="_blank">
          Share Feedback
        </a>
      </div>
    </>
  )
}
