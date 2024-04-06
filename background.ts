console.log("background script is running...");

/* @ts-expect-error expected since content.ts is imported as a script file */
import contentScript from "./content.ts?script";

chrome.runtime.onMessage.addListener((message) => {
  if (message.message === "activate") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0 || tabs[0].id === undefined) {
        return;
      }
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: [contentScript],
      });
    });
  }
});
