export async function getHtmlFromUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          const responseText = xhr.responseText;
          console.log(responseText);
          resolve(responseText);
        } else {
          reject(new Error(`Failed to fetch ${url}`));
        }
      }
    };
    xhr.send();
  });
}
