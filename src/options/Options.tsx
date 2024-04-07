import { useState } from "react";

function Options() {
  const [data, setData] = useState([]);

  chrome.storage.sync.get("urls", (data) => {
    // data.urls now contains the URLs
    setData(data.urls);
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
