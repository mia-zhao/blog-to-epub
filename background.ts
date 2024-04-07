/* @ts-expect-error expected since content.ts is imported as a script file */
import contentScript from "./content.ts?script";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.message === "activate") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0 || tabs[0].id === undefined) {
        return;
      }
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          files: [contentScript],
        },
        function () {
          sendResponse({ response: "activated" });
        }
      );
    });
  } else if (message.message === "select") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0 || tabs[0].id === undefined) {
        return;
      }
      chrome.tabs.sendMessage(tabs[0].id, { message: "select" }, function () {
        sendResponse({ response: "selected" });
      });
    });
  } else if (message.message === "deselect") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0 || tabs[0].id === undefined) {
        return;
      }
      chrome.tabs.sendMessage(tabs[0].id, message, function () {
        sendResponse({ response: "deselected" });
      });
    });
  } else if (message.message === "urls") {
    chrome.storage.sync.set({ urls: message.urls }, () => {
      // Open the options page after the URLs have been stored
      chrome.runtime.openOptionsPage();
    });
  }
  return true;
});
