import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [isContentScriptReady, setIsContentScriptReady] = useState(false);
  const [inSelectMode, setInSelectMode] = useState(false);
  const [isGenerateReady, setIsGenerateReady] = useState(false);

  useEffect(() => {
    if (!isContentScriptReady) return;
    chrome.storage.local.get("state", function (result) {
      const state = result.state || {};
      setInSelectMode(state.InSelectMode || false);
    });
    chrome.runtime.sendMessage({ message: "get_meta_data" });
  }, [isContentScriptReady]);

  useEffect(() => {
    chrome.storage.local.get("state", function (result) {
      const state = result.state || {};
      if (state.currentUrl) {
        chrome.storage.local.get(state.currentUrl, function (result) {
          const data = result[state.currentUrl].info || [];
          setIsGenerateReady(data.length > 0);
        });
      }
    });
  }, [inSelectMode]);

  useEffect(() => {
    chrome.runtime.sendMessage(
      { message: "activate" },
      function ({ response }) {
        if (response === "activated") {
          setIsContentScriptReady(true);
        }
      }
    );
  }, []);

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
    enterDeselectMode();

    chrome.runtime.sendMessage({ message: "options" });
  };

  if (!isContentScriptReady) {
    return (
      <div className="flex justify-center">
        <span className="loading loading-spinner loading-sm"></span>
      </div>
    );
  }

  return (
    <>
      <div className="button-container">
        {!inSelectMode ? (
          <button className="btn btn-block cta" onClick={enterSelectMode}>
            <span className="cta-text">Select Articles</span>
          </button>
        ) : (
          <button className="btn btn-block cta" onClick={enterDeselectMode}>
            <span className="cta-text">Exit Select Mode</span>
          </button>
        )}
        <button
          className="btn btn-block cta mt-4 disabled:bg-base-300"
          onClick={openOptions}
          disabled={!isGenerateReady}
        >
          <span className="cta-text">Generate EPUB</span>
          <span className="material-symbols-outlined">open_in_new</span>
        </button>
        <a
          className="link link-success text-lg text-center mt-4"
          href="https://forms.gle/RjyEXHSpriYWRRz3A"
          target="_blank"
        >
          Share Feedback
        </a>
      </div>
    </>
  );
}

export default App;
