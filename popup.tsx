import { ExternalLink } from "lucide-react"
import { useEffect, useState } from "react"

import "./style.css"

function App() {
  const [isContentScriptReady, setIsContentScriptReady] = useState(false)
  const [inSelectMode, setInSelectMode] = useState(false)
  const [isGenerateReady, setIsGenerateReady] = useState(false)

  useEffect(() => {
    if (!isContentScriptReady) return
    chrome.storage.local.get("state", function (result) {
      const state = result.state || {}
      setInSelectMode(state.InSelectMode || false)
    })
    chrome.runtime.sendMessage({ message: "get_meta_data" })
    chrome.runtime.sendMessage({ message: "get_state" })
  }, [isContentScriptReady])

  useEffect(() => {
    chrome.storage.local.get("state", function (result) {
      const state = result.state || {}
      if (state.currentUrl) {
        chrome.storage.local.get(state.currentUrl, function (result) {
          const currentResult = result[state.currentUrl] || {}
          const data = currentResult.info || []
          setIsGenerateReady(data.length > 0)
        })
      }
    })
  }, [inSelectMode])

  useEffect(() => {
    chrome.storage.local.get("state", function (result) {
      const state = result.state || {}
      if (state.currentUrl) {
        chrome.storage.local.get(state.currentUrl, function (result) {
          const currentResult = result[state.currentUrl] || {}
          const data = currentResult.info || []
          setIsGenerateReady(data.length > 0)
        })
      }
    })
  }, [])

  useEffect(() => {
    chrome.runtime.sendMessage(
      { message: "activate" },
      function ({ response }) {
        if (response === "activated") {
          setIsContentScriptReady(true)
        }
      }
    )
  }, [])

  const enterSelectMode = () => {
    // tell the background script to inject the content script and enter select mode
    chrome.runtime.sendMessage({ message: "select" }, function ({ response }) {
      if (response === "selected") {
        chrome.storage.local.get("state", (result) => {
          const state = result.state || {}
          state.InSelectMode = true
          chrome.storage.local.set({ state })
        })
        setInSelectMode(true)
      }
    })
  }

  const enterDeselectMode = () => {
    // tell the background script to exit select mode
    chrome.runtime.sendMessage({ message: "deselect" }, function () {
      chrome.storage.local.get("state", (result) => {
        const state = result.state || {}
        state.InSelectMode = false
        chrome.storage.local.set({ state })
      })
      setInSelectMode(false)
    })
  }

  const openOptions = () => {
    enterDeselectMode()

    chrome.runtime.sendMessage({ message: "options" })
  }

  if (!isContentScriptReady) {
    return (
      <div className="flex justify-center">
        <span className="loading loading-spinner loading-sm"></span>
      </div>
    )
  }

  return (
    <>
      <div className="w-[240px] flex flex-col m-4">
        {!inSelectMode ? (
          <button
            className="btn btn-block flex rounded-lg"
            onClick={enterSelectMode}>
            <span className="text-lg">Select Articles</span>
          </button>
        ) : (
          <button
            className="btn btn-block rounded-lg"
            onClick={enterDeselectMode}>
            <span className="text-lg">Exit Select Mode</span>
          </button>
        )}
        <button
          className="btn btn-block rounded-lg mt-4 disabled:bg-base-300"
          onClick={openOptions}
          disabled={!isGenerateReady}>
          <span className="text-lg">Generate EPUB</span>
          <ExternalLink className="ml-2" />
        </button>
        <a
          className="link link-success text-lg text-center mt-4"
          href="https://forms.gle/RjyEXHSpriYWRRz3A"
          target="_blank">
          Share Feedback
        </a>
      </div>
    </>
  )
}

export default App
