import { useEffect, useState } from "react";

function Options() {
  const [data, setData] = useState([]);

  useEffect(() => {
    chrome.storage.local.get("state", (result) => {
      const state = result.state || {};
      chrome.storage.local.get(state.currentUrl, (result) => {
        setData(result[state.currentUrl]);
      });
    });
  }, []);

  return (
    <>
      <table>
        <thead>
          <tr>
            <td>
              <input type="checkbox" />
              Select All
            </td>
            <td></td>
          </tr>
        </thead>
        <tbody>
          {data.map((url, idx) => (
            <tr key={idx}>
              <td>
                <input type="checkbox" />
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
