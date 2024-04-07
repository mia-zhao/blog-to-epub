console.log("content script is running...");

const selectedElements: HTMLElement[] = [];

let removeOverlay = () => {};

chrome.runtime.onMessage.addListener((message) => {
  console.log(message);
  if (message.message === "select") {
    removeOverlay = handleOverlay();

    // use mouse click to select and deselect elements
    // useCapture is set to true to prevent the event from bubbling up
    document.addEventListener("click", clickListener, true);
  } else if (message.message === "deselect") {
    removeOverlay();

    document.removeEventListener("click", clickListener, true);
  }
});

function clickListener(event) {
  event.stopImmediatePropagation();
  event.preventDefault();

  const selectedElement = getBoundingElement(event);

  if (!selectedElement) return;

  const highlightStyle = { backgroundColor: "rgb(255, 233, 165, 0.8)" };

  // deselect element
  if (selectedElements.includes(selectedElement)) {
    selectedElements.splice(selectedElements.indexOf(selectedElement), 1);
    setElementStyle(selectedElement, { backgroundColor: "inherit" });
    return;
  }

  const listElements = getParallelList(selectedElement);

  // add selected elements to the list
  selectedElements.push(...listElements);
  selectedElements.splice(
    0,
    selectedElements.length,
    ...Array.from(new Set(selectedElements))
  );

  listElements.forEach((element) => {
    setElementStyle(element, highlightStyle);
  });
}

function setElementStyle(
  element: HTMLElement,
  style: Partial<CSSStyleDeclaration>
) {
  Object.assign(element.style, style);
}

function removeElementStyle(
  element: HTMLElement,
  style: Partial<CSSStyleDeclaration>
) {
  Object.keys(style).forEach((key) => element.style.removeProperty(key));
}

// get the list of elements that are in the same level as the argument element
function getParallelList(element: HTMLElement): HTMLElement[] {
  // get CSS selector of a single element
  const getCssSelector = (target: Element): string => {
    return `${target.tagName.toLowerCase()}`;
  };

  // get CSS selector path from html
  const getCssSelectorPath = (target: Element): string => {
    let path = "";
    let current: Element | null = target;
    while (current !== null && current.tagName.toLowerCase() !== "html") {
      const selector = getCssSelector(current);
      path = `${selector} > ${path}`;
      current = current.parentElement;
    }
    return path.substring(0, path.length - 3);
  };

  const path = getCssSelectorPath(element);
  return Array.from(document.querySelectorAll(path));
}

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
  overlayContainer.id = "overlay-container";
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
    if (target != null) {
      const { top, left, width, height } = target.getBoundingClientRect();
      overlayStyle = {
        ...overlayStyle,
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
        height: `${height}px`,
      };
      setElementStyle(overlay, overlayStyle);
    }
  };

  const mouseOutListener = () => {
    removeElementStyle(overlay, overlayStyle);
  };

  document.addEventListener("mouseover", mouseOverListener);
  document.addEventListener("mouseout", mouseOutListener);

  return () => {
    document.body.removeChild(overlayContainer);
    document.removeEventListener("mouseover", mouseOverListener);
    document.removeEventListener("mouseout", mouseOutListener);
  };
}

function getHref(element: HTMLElement): string {
  const href = element.getAttribute("href");
  if (href) {
    return href;
  }
  if (element.parentElement) {
    return getHref(element.parentElement);
  }
  return "";
}

function handleList(listElements: HTMLElement[]) {
  const urls: string[] = [];
  listElements.map((element) => {
    const href = getHref(element);
    if (href != null) {
      const url = new URL(href, document.URL);
      urls.push(href.startsWith("http") ? href : `${url}`);
    }
  });
  console.log(urls);

  // const urls = Array.from(document.querySelectorAll("a"))
  // .map((element) => {
  //   const rect = element.getBoundingClientRect();
  //   if (rect.width !== 0 && rect.height !== 0) {
  //     if (element.getAttribute("href") != null) {
  //       const href = element.getAttribute("href");
  //       if (href) {
  //         return new URL(href, document.URL);
  //       }
  //     }
  //   }
  // })
  // .filter((url) => url !== undefined);

  chrome.runtime.sendMessage({ message: "urls", urls });
}
