import { useStorage } from "@plasmohq/storage/hook"

import { EPUB_SETTINGS_KEY } from "~lib/types"

import "~/style.css"

export function SettingsModal({ isOpen, onClose }) {
  const [settings, setSettings] = useStorage(EPUB_SETTINGS_KEY, {
    includeHyperlinks: false,
    includeOfflineImages: false
  })

  if (!isOpen) return null

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">EPUB Export Settings</h3>

        <div className="form-control flex flex-row justify-between">
          <label className="label">
            <span className="label-text">Enable Hyperlink Visibility</span>
          </label>
          <label className="switch flex items-center">
            <input
              type="checkbox"
              className="toggle"
              checked={settings.includeHyperlinks}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  includeHyperlinks: e.target.checked
                })
              }
            />
          </label>
        </div>

        <div className="form-control mt-4 flex flex-row justify-between">
          <label className="label">
            <span className="label-text">
              Preprocess Images for Offline Use
            </span>
          </label>
          <label className="switch flex items-center">
            <input
              type="checkbox"
              className="toggle"
              checked={settings.includeOfflineImages}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  includeOfflineImages: e.target.checked
                })
              }
            />
          </label>
        </div>

        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
