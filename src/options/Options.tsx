import { useState } from "react";

function Options() {
  const [data, setData] = useState([]);

  chrome.storage.local.get("state", (result) => {
    const state = result.state || {};
    chrome.storage.local.get(state.currentUrl, (data) => {
      setData(data[state.currentUrl]);
    });
  });

  return (
    <>
      <table>
        {data.map((url, idx) => (
          <tr key={idx}>
            <td>
              <input type="checkbox" />
            </td>
            <td>{url}</td>
          </tr>
        ))}
      </table>
    </>
  );
}

export default Options;
