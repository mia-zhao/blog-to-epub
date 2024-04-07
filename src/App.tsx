import { useState } from "react";
import "./App.css";

function App() {
  const [isContentScriptReady, setIsContentScriptReady] = useState(false);
  const [inSelectMode, setInSelectMode] = useState(false);
  const [isGenerateReady, setIsGenerateReady] = useState(false);

  chrome.storage.local.get("state", function (result) {
    console.log(result);
    const state = result.state || {};
    if (state.currentUrl) {
      setIsGenerateReady(true);
    }
  });

  console.log(inSelectMode);

  chrome.storage.local.get("state", function (result) {
    const state = result.state || {};
    setInSelectMode(state.InSelectMode || false);
  });

  (function activate() {
    chrome.runtime.sendMessage(
      { message: "activate" },
      function ({ response }) {
        if (response === "activated") {
          setIsContentScriptReady(true);
        }
      }
    );
  })();

  const enterSelectMode = () => {
    // tell the background script to inject the content script and enter select mode
    chrome.runtime.sendMessage({ message: "select" }, function ({ response }) {
      if (response === "selected") {
        chrome.storage.local.get("state", (result) => {
          const state = result.state || {};
          state.InSelectMode = true;
          chrome.storage.local.set({ state });
        });
        setInSelectMode(true);
      }
    });
  };

  const enterDeselectMode = () => {
    // tell the background script to exit select mode
    chrome.runtime.sendMessage({ message: "deselect" }, function () {
      chrome.storage.local.get("state", (result) => {
        const state = result.state || {};
        state.InSelectMode = false;
        chrome.storage.local.set({ state });
      });
      setInSelectMode(false);
    });
  };

  const openOptions = () => {
    chrome.runtime.sendMessage({ message: "options" });
  };

  if (!isContentScriptReady) {
    return <div>Loading content script ...</div>;
  }

  return (
    <>
      {!inSelectMode ? (
        <button className="cta" onClick={enterSelectMode}>
          <span className="cta-text">Select Articles</span>
        </button>
      ) : (
        <button className="cta" onClick={enterDeselectMode}>
          <span className="cta-text">Exit Select Mode</span>
        </button>
      )}
      <button className="cta" onClick={openOptions} disabled={!isGenerateReady}>
        <span className="cta-text">Generate Epub</span>
        <span className="material-symbols-outlined">open_in_new</span>
      </button>
    </>
  );
}

export default App;
