import { ChangeEvent, useEffect, useState } from "react";
import { URLInfo } from "../storage";

function Options() {
  const [homeList, setHomeList] = useState<string[]>([]);
  const [currentHome, setCurrentHome] = useState("");
  const [data, setData] = useState<URLInfo[]>([]);

  const [selectAll, setSelectAll] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);

  const isSelected = selectedUrls.length > 0;

  useEffect(() => {
    chrome.storage.local.get("state", (result) => {
      const state = result.state || {};
      chrome.storage.local.get(state.currentUrl, (result) => {
        setCurrentHome(state.currentUrl);
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
    });
  };

  return (
    <>
      <select onChange={selectHome} value={currentHome}>
        {homeList.map((url, idx) => (
          <option key={idx} value={url}>
            {url}
          </option>
        ))}
      </select>
      {isSelected && (
        <>
          <button onClick={deleteSelected}>Delete Selected</button>{" "}
          <button onClick={download}>Download Epub</button>
        </>
      )}

      <table>
        <thead>
          <tr>
            <td>
              <div className="form-control">
                <label className="label cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    className="checkbox checkbox-primary"
                    onChange={() => toggleAll(selectAll)}
                  />
                  <span className="label-text">Select All</span>
                </label>
              </div>
            </td>
            <td>Title</td>
            <td>URL</td>
          </tr>
        </thead>
        <tbody>
          {data.map((val, idx) => (
            <tr key={idx}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedUrls.includes(val.url)}
                  onChange={() => toggleCheck(idx)}
                />
              </td>
              <td>{val.title}</td>
              <td>{val.url}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export default Options;
