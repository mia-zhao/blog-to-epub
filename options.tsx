import { ChangeEvent, useEffect, useState } from "react"

import "./style.css"

enum DownloadStatus {
  NONE,
  DOWNLOADING,
  ERROR,
  DOWNLOADED
}

interface URLInfo {
  url: string
  title: string
}

function Options() {
  const [homeList, setHomeList] = useState<string[]>([])
  const [currentHome, setCurrentHome] = useState("")
  const [data, setData] = useState<URLInfo[]>([])
  const [meta, setMeta] = useState({ title: "", author: "" })

  const [selectAll, setSelectAll] = useState(false)
  const [selectedUrls, setSelectedUrls] = useState<string[]>([])

  const [isLinkVisible, setIsLinkVisible] = useState(false)
  const [getImageOffline, setGetImageOffline] = useState(false)

  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>(
    DownloadStatus.NONE
  )

  const isSelected = selectedUrls.length > 0

  useEffect(() => {
    chrome.storage.local.get("state", (result) => {
      const state = result.state || {}
      setCurrentHome(state.currentUrl)
      chrome.storage.local.get(state.currentUrl, (result) => {
        const currentResult = result[state.currentUrl] || {}
        setData(currentResult.info || [])
        setSelectedUrls([])
      })
    })
  }, [])

  useEffect(() => {
    chrome.storage.local.get("home_list", (result) => {
      setHomeList(result.home_list || [])
    })
  }, [])

  useEffect(() => {
    chrome.storage.local.get(currentHome, (result) => {
      if (!result[currentHome]) return
      const currentResult = result[currentHome] || {}
      setData(currentResult.info || [])
      setSelectedUrls([])
      setSelectAll(false)
      setMeta({
        title: result[currentHome].title,
        author: result[currentHome].author
      })
    })
  }, [currentHome])

  useEffect(() => {
    if (data.every((val) => selectedUrls.includes(val.url))) {
      setSelectAll(true)
    } else {
      setSelectAll(false)
    }
  }, [selectedUrls, data])

  const toggleCheck = (idx: number) => {
    if (selectedUrls.includes(data[idx].url)) {
      // remove the url from selectedUrls
      setSelectedUrls((prev) => prev.filter((url) => url !== data[idx].url))
    } else {
      // add the url to selectedUrls
      setSelectedUrls((prev) => [...prev, data[idx].url])
    }
  }

  const toggleAll = (state: boolean) => {
    setSelectAll(!state)
    if (state) {
      setSelectedUrls([])
    } else {
      setSelectedUrls(data.map((val) => val.url))
    }
  }

  const selectHome = (event: ChangeEvent) => {
    setCurrentHome((event.target as HTMLSelectElement).value)
  }

  const download = async () => {
    const downloadBlob = (blob: Blob, filename: string) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      window.URL.revokeObjectURL(url)
    }

    const getTimeStamp = () => {
      const currentDate = new Date()
      const year = currentDate.getFullYear()
      const month = String(currentDate.getMonth() + 1).padStart(2, "0")
      const day = String(currentDate.getDate()).padStart(2, "0")
      const hours = String(currentDate.getHours()).padStart(2, "0")
      const minutes = String(currentDate.getMinutes()).padStart(2, "0")

      return `${year}${month}${day}${hours}${minutes}`
    }

    setDownloadStatus(DownloadStatus.DOWNLOADING)

    try {
      // post fetch request to backend
      const response = await fetch("https://blog-to-epub.zeabur.app/epub", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          urls: selectedUrls,
          includeHyperlinks: isLinkVisible,
          includeOfflineImages: getImageOffline,
          title: meta.title,
          author: meta.author
        })
      })
      const blob = await response.blob()
      downloadBlob(blob, `${meta.title || "blog"}_${getTimeStamp()}.epub`)
      setDownloadStatus(DownloadStatus.DOWNLOADED)
    } catch (e) {
      console.error(e)
      setDownloadStatus(DownloadStatus.ERROR)
    }
  }

  const deleteSelected = () => {
    const remainingData = data.filter((val) => !selectedUrls.includes(val.url))
    setData(remainingData)
    setSelectedUrls([])
    chrome.storage.local.get(currentHome, (result) => {
      const currentResult = result[currentHome] || {}
      currentResult.info = remainingData
      chrome.storage.local.set({ [currentHome]: currentResult })
    })

    if (remainingData.length === 0) {
      const newHomeList = homeList.filter((home) => home !== currentHome)
      setHomeList(newHomeList)
      chrome.storage.local.set({ home_list: newHomeList })
      chrome.storage.local.remove(currentHome)
      if (newHomeList.length > 0) {
        setCurrentHome(newHomeList[0])
      } else {
        setCurrentHome("")
      }
    }
  }

  return (
    <>
      <div className="navbar bg-base-100 p-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Blog to EPUB</h1>
        </div>
        <div className="flex-none">
          <select
            className="select select-bordered w-full max-w-xs"
            onChange={selectHome}
            value={currentHome}>
            {homeList.map((url, idx) => (
              <option key={idx} value={url}>
                {url}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end p-4">
        {isSelected && (
          <>
            <button className="flex" onClick={deleteSelected}>
              <span className="material-symbols-outlined">delete</span>
            </button>
            <button className="flex ml-4" onClick={download}>
              <span className="material-symbols-outlined">download</span>
            </button>
            <button
              className="flex ml-4"
              onClick={() =>
                (
                  document.getElementById("settings_modal") as HTMLDialogElement
                )?.showModal()
              }>
              <span className="material-symbols-outlined">settings</span>
            </button>
            <dialog id="settings_modal" className="modal">
              <div className="modal-box">
                <h3 className="font-bold text-lg">Settings</h3>
                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text">
                      Enable Hyperlink Visibility
                    </span>
                    <input
                      type="checkbox"
                      checked={isLinkVisible}
                      className="checkbox"
                      onChange={() => setIsLinkVisible(!isLinkVisible)}
                    />
                  </label>
                  <label className="label cursor-pointer">
                    <span className="label-text">
                      Preprocess Images for Offline Use
                    </span>
                    <input
                      type="checkbox"
                      checked={getImageOffline}
                      className="checkbox"
                      onChange={() => setGetImageOffline(!getImageOffline)}
                    />
                  </label>
                </div>
                <div className="modal-action">
                  <form method="dialog">
                    {/* if there is a button in form, it will close the modal */}
                    <button className="btn">Close</button>
                  </form>
                </div>
              </div>
            </dialog>
          </>
        )}
      </div>
      <div className="main">
        <div className="overflow-x-auto p-4">
          <table className="table">
            <thead>
              <tr>
                <th className="flex">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={selectAll}
                      onChange={() => toggleAll(selectAll)}
                    />
                  </label>
                </th>
                <th>Title</th>
                <th>URL</th>
              </tr>
            </thead>
            <tbody className="overflow-y-auto">
              {data.map((val, idx) => (
                <tr key={idx}>
                  <th>
                    <label>
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={selectedUrls.includes(val.url)}
                        onChange={() => toggleCheck(idx)}
                      />
                    </label>
                  </th>
                  <td>{val.title}</td>
                  <td>{val.url}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {downloadStatus === DownloadStatus.DOWNLOADING && (
          <div className="toast toast-top toast-end">
            <div className="alert alert-info">
              <span>EPUB downloading ...</span>
            </div>
          </div>
        )}
        {downloadStatus === DownloadStatus.DOWNLOADED && (
          <div className="toast toast-top toast-end">
            <div className="alert alert-success">
              <span>EPUB successfully downloaded.</span>
            </div>
          </div>
        )}
        {downloadStatus === DownloadStatus.ERROR && (
          <div className="toast toast-top toast-end">
            <div className="alert alert-error">
              <span>
                Oops, there has been an error. Please try again later.
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Options
