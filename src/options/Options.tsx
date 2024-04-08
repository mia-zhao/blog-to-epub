import { ChangeEvent, useEffect, useState } from "react";
import { URLInfo } from "../storage";

enum DownloadStatus {
  NONE,
  DOWNLOADING,
  ERROR,
  DOWNLOADED,
}

function Options() {
  const [homeList, setHomeList] = useState<string[]>([]);
  const [currentHome, setCurrentHome] = useState("");
  const [data, setData] = useState<URLInfo[]>([]);

  const [selectAll, setSelectAll] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);

  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>(
    DownloadStatus.NONE
  );

  const isSelected = selectedUrls.length > 0;

  useEffect(() => {
    chrome.storage.local.get("state", (result) => {
      const state = result.state || {};
      setCurrentHome(state.currentUrl);
      chrome.storage.local.get(state.currentUrl, (result) => {
        setData(result[state.currentUrl] || []);
        setSelectedUrls([]);
      });
    });
  }, []);

  useEffect(() => {
    chrome.storage.local.get("home_list", (result) => {
      setHomeList(result.home_list || []);
    });
  }, []);

  useEffect(() => {
    chrome.storage.local.get(currentHome, (result) => {
      if (!result[currentHome]) return;
      setData(result[currentHome]);
      setSelectedUrls([]);
      setSelectAll(false);
    });
  }, [currentHome]);

  useEffect(() => {
    if (data.every((val) => selectedUrls.includes(val.url))) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedUrls, data]);

  const toggleCheck = (idx: number) => {
    if (selectedUrls.includes(data[idx].url)) {
      // remove the url from selectedUrls
      setSelectedUrls((prev) => prev.filter((url) => url !== data[idx].url));
    } else {
      // add the url to selectedUrls
      setSelectedUrls((prev) => [...prev, data[idx].url]);
    }
  };

  const toggleAll = (state: boolean) => {
    setSelectAll(!state);
    if (state) {
      setSelectedUrls([]);
    } else {
      setSelectedUrls(data.map((val) => val.url));
    }
  };

  const selectHome = (event: ChangeEvent) => {
    setCurrentHome((event.target as HTMLSelectElement).value);
  };

  const download = async () => {
    const downloadBlob = (blob: Blob, filename: string) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    };

    setDownloadStatus(DownloadStatus.DOWNLOADING);

    try {
      // post fetch request to backend
      const response = await fetch("http://localhost:3000/epub", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          urls: selectedUrls,
        }),
      });
      const blob = await response.blob();
      downloadBlob(blob, "epub.epub");
      setDownloadStatus(DownloadStatus.DOWNLOADED);
    } catch (e) {
      console.error(e);
      setDownloadStatus(DownloadStatus.ERROR);
    } finally {
      setTimeout(() => {
        setDownloadStatus(DownloadStatus.NONE);
      }, 3000);
    }
  };

  const deleteSelected = () => {
    chrome.storage.local.get(currentHome, (result) => {
      const currentData = result[currentHome];
      const newData = currentData.filter(
        (val: URLInfo) => !selectedUrls.includes(val.url)
      );
      chrome.storage.local.set({ [currentHome]: newData }, () => {
        setData(newData);
        setSelectedUrls([]);
      });
      if (newData.length === 0) {
        chrome.storage.local.remove(currentHome);
        chrome.storage.local.get("home_list", (result) => {
          const list = result.home_list || [];
          const newList = list.filter((url: string) => url !== currentHome);
          chrome.storage.local.set({ home_list: newList }, () => {
            setHomeList(newList);
          });
        });
      }
    });
  };

  return (
    <>
      <div className="border-b p-8 flex items-center">
        <label className="flex items-center">
          <div>
            <span className="label-text mr-4">Homepage URL</span>
          </div>
          <select
            className="select select-bordered"
            onChange={selectHome}
            value={currentHome}
          >
            {homeList.map((url, idx) => (
              <option key={idx} value={url}>
                {url}
              </option>
            ))}
          </select>
        </label>
        {isSelected && (
          <>
            <button
              className="btn btn-outline btn-error ml-8"
              onClick={deleteSelected}
            >
              Delete Selected
            </button>
            <button className="btn btn-neutral ml-8" onClick={download}>
              Download Epub
            </button>
          </>
        )}
      </div>
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
          <tbody>
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
        <div className="toast toast-start">
          <div className="alert alert-info">
            <span>Epub downloading ...</span>
          </div>
        </div>
      )}
      {downloadStatus === DownloadStatus.DOWNLOADED && (
        <div className="toast toast-start">
          <div className="alert alert-success">
            <span>Epub successfully downloaded.</span>
          </div>
        </div>
      )}
      {downloadStatus === DownloadStatus.ERROR && (
        <div className="toast toast-start">
          <div className="alert alert-error">
            <span>Oops, there has been an error. Please try again later.</span>
          </div>
        </div>
      )}
    </>
  );
}

export default Options;
