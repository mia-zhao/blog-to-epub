import { ChangeEvent, useEffect, useState } from "react";

function Options() {
  const [homeList, setHomeList] = useState<string[]>([]);
  const [currentHome, setCurrentHome] = useState("");
  const [data, setData] = useState<string[]>([]);

  const [selectAll, setSelectAll] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);

  useEffect(() => {
    chrome.storage.local.get("state", (result) => {
      const state = result.state || {};
      chrome.storage.local.get(state.currentUrl, (result) => {
        setCurrentHome(state.currentUrl);
        setData(result[state.currentUrl]);
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
    if (data.every((url) => selectedUrls.includes(url))) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedUrls]);

  const toggleCheck = (idx: number) => {
    if (selectedUrls.includes(data[idx])) {
      // remove the url from selectedUrls
      setSelectedUrls((prev) => prev.filter((url) => url !== data[idx]));
    } else {
      // add the url to selectedUrls
      setSelectedUrls((prev) => [...prev, data[idx]]);
    }
  };

  const toggleAll = (state: boolean) => {
    setSelectAll(!state);
    if (state) {
      setSelectedUrls([]);
    } else {
      setSelectedUrls(data);
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

  return (
    <>
      <select onChange={selectHome} value={currentHome}>
        {homeList.map((url, idx) => (
          <option key={idx} value={url}>
            {url}
          </option>
        ))}
      </select>
      <button onClick={download}>Download Epub</button>
      <table>
        <thead>
          <tr>
            <td>
              <input
                type="checkbox"
                checked={selectAll}
                onChange={() => toggleAll(selectAll)}
              />
              Select All
            </td>
            <td></td>
          </tr>
        </thead>
        <tbody>
          {data.map((url, idx) => (
            <tr key={idx}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedUrls.includes(url)}
                  onChange={() => toggleCheck(idx)}
                />
              </td>
              <td>{url}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export default Options;
