// import JSZip from "jszip";
// import saveAs from "file-saver";
import { getHtmlFromUrl, parseHtml, htmlToEpub } from "./src/epub";

console.log("content script is running...");

let selectedElement: HTMLElement | null = null;

handleOverlay();

document.addEventListener(
  "click",
  (event) => {
    event.stopImmediatePropagation();
    event.preventDefault();

    if (selectedElement === null) return;

    const listElements: Element[] = [];
    if (selectedElement.parentElement !== null) {
      const parent = selectedElement.parentElement;
      for (const child of parent.children) {
        listElements.push(child);
      }
    }
    handleList(listElements);
  },
  true, // useCapture is set to true to prevent the event from bubbling up
);

function getBoundingElement(event: MouseEvent): HTMLElement | null {
  for (const target of event.composedPath()) {
    if (!(target instanceof HTMLElement)) continue;
    const rect = target.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    return target;
  }
  return null;
}

function handleOverlay() {
  const overlayContainer = document.createElement("div");
  overlayContainer.id = "recorder-overlay-container";
  document.body.appendChild(overlayContainer);

  const shadow = overlayContainer.attachShadow({ mode: "open" });
  const overlay = document.createElement("div");
  overlay.id = "overlay";
  shadow.appendChild(overlay);

  let overlayStyle: Partial<CSSStyleDeclaration> = {
    boxSizing: "border-box",
    pointerEvents: "none",
    position: "fixed",
    zIndex: "2147483647",
    border: "1px dashed grey",
  };

  const mouseOverListener = (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const target = getBoundingElement(event);
    selectedElement = target;
    if (target != null) {
      const { top, left, width, height } = target.getBoundingClientRect();
      overlayStyle = {
        ...overlayStyle,
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
        height: `${height}px`,
      };
      Object.assign(overlay.style, overlayStyle);
    }
  };

  const mouseOutLitener = () => {
    Object.keys(overlayStyle).forEach((key) =>
      overlay.style.removeProperty(key),
    );
  };

  document.addEventListener("mouseover", mouseOverListener);
  document.addEventListener("mouseout", mouseOutLitener);

  return () => {
    document.body.removeChild(overlayContainer);
    document.removeEventListener("mouseover", mouseOverListener);
    document.removeEventListener("mouseout", mouseOutLitener);
  };
}

function handleList(listElements: Element[]) {
  const urls: string[] = [];
  listElements.map((element) => {
    const href = element.getAttribute("href");
    if (href != null) {
      const url = new URL(href, document.URL);
      urls.push(href.startsWith("http") ? href : `${url}`);
    }
  });
  convertToEpub(urls);
}

async function convertToEpub(urls: string[]) {
  getHtmlFromUrl(urls[0]).then((html) => {
    const parsed = parseHtml(html);
    if (parsed) {
      htmlToEpub(parsed);
    }
  });
}
