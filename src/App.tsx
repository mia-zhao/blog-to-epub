import { useState } from "react";
import "./App.css";

function App() {
  const [inSelectMode, setInSelectMode] = useState(false);
  const [isContentScriptReady, setIsContentScriptReady] = useState(false);

  chrome.storage.local.get("InSelectMode", function (result) {
    setInSelectMode(result.InSelectMode || false);
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
        chrome.storage.local.set({ InSelectMode: true });
        setInSelectMode(true);
      }
    });
  };

  const enterDeselectMode = () => {
    // tell the background script to exit select mode
    chrome.runtime.sendMessage({ message: "deselect" }, function () {
      chrome.storage.local.set({ InSelectMode: false });
      setInSelectMode(false);
    });
  };

  const generate = () => {
    chrome.runtime.sendMessage({ message: "urls" });
  };

  return (
    <>
      {!inSelectMode ? (
        <button
          className="cta"
          onClick={enterSelectMode}
          disabled={!isContentScriptReady}
        >
          <span className="cta-text">Select Articles</span>
        </button>
      ) : (
        <button className="cta" onClick={enterDeselectMode}>
          <span className="cta-text">Exit Select Mode</span>
        </button>
      )}
      <button className="cta" onClick={generate}>
        <span className="cta-text">Generate Epub</span>
        <span className="material-symbols-outlined">open_in_new</span>
      </button>
    </>
  );
}

export default App;
