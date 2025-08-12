import { ContentToBackgroundMessage } from "~/lib/types"

chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  if (message.type === ContentToBackgroundMessage.OPEN_OPTIONS) {
    const url = message.url
    chrome.tabs.create({
      url: chrome.runtime.getURL(
        `options.html${url ? `?url=${encodeURIComponent(url)}` : ""}`
      )
    })
    sendResponse({ success: true })
    return true
  }
})

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.runtime.setUninstallURL("https://forms.gle/RjyEXHSpriYWRRz3A")
  }
})
