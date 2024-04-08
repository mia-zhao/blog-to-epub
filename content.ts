console.log("content script is running...");

let selectedElements: HTMLElement[] = [];

let removeOverlay = () => {};
let clickTimeout: NodeJS.Timeout | null = null;

// reset state
chrome.storage.local.set({ state: {} });

chrome.runtime.onMessage.addListener((message) => {
  if (message.message === "select") {
    removeOverlay = handleOverlay();

    // use mouse clicks to select and deselect elements
    // useCapture is set to true to prevent the event from bubbling up
    document.addEventListener("click", clickListener, true);
    document.addEventListener("dblclick", dblclickListener);
  } else if (message.message === "deselect") {
    removeOverlay();

    document.removeEventListener("click", clickListener, true);
    document.removeEventListener("dblclick", dblclickListener);
  }
});

// single click to select and deselect one element
function clickListener(event: MouseEvent) {
  event.stopImmediatePropagation();
  event.preventDefault();

  const composedPath = event.composedPath();
  const eventCopy = {
    target: event.target,
    composedPath: () => composedPath,
  };

  const clickHandler = () => {
    const selectedElement = getBoundingElement(
      eventCopy as unknown as MouseEvent
    );
    if (selectedElement === null) return;

    const highlightStyle = { backgroundColor: "rgb(255, 233, 165, 0.8)" };

    // deselect element
    if (selectedElements.includes(selectedElement)) {
      selectedElements.splice(selectedElements.indexOf(selectedElement), 1);
      setElementStyle(selectedElement, { backgroundColor: "inherit" });
      updateList(selectedElements);
      return;
    }

    // add selected elements to the list and highlight the element
    selectedElements.push(selectedElement);
    setElementStyle(selectedElement, highlightStyle);

    updateList(selectedElements);
  };

  if (event.detail == 1) {
    clickTimeout = setTimeout(() => {
      clickHandler();
    }, 250);
  }
}

// double click to select and deselect multiple elements
function dblclickListener(event) {
  event.stopImmediatePropagation();
  event.preventDefault();

  // cancel single click event listener
  if (clickTimeout !== null) {
    clearTimeout(clickTimeout);
    clickTimeout = null;
  }

  const selectedElement = getBoundingElement(event);
  if (selectedElement === null) return;

  const highlightStyle = { backgroundColor: "rgb(255, 233, 165, 0.8)" };

  // deselect elements
  if (selectedElements.includes(selectedElement)) {
    const listDeselect = getParallelList(selectedElement);
    selectedElements = selectedElements.filter(
      (element) => !listDeselect.includes(element)
    );
    listDeselect.forEach((element) =>
      setElementStyle(element, { backgroundColor: "inherit" })
    );
    updateList(selectedElements);
    return;
  }

  const listSelect = getParallelList(selectedElement);

  // add selected elements to the list
  selectedElements.push(...listSelect);
  selectedElements.splice(
    0,
    selectedElements.length,
    ...Array.from(new Set(selectedElements))
  );

  listSelect.forEach((element) => {
    setElementStyle(element, highlightStyle);
  });

  updateList(selectedElements);
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

function updateList(listElements: HTMLElement[]) {
  const urls: string[] = [];

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

  listElements.forEach((element) => {
    const href = getHref(element);
    if (href != null) {
      const url = new URL(href, document.URL);
      urls.push(url.href);
    }
  });

  console.log(urls.length);

  chrome.storage.local.get("home_list", (result) => {
    const home_list = result.home_list || [];
    home_list.push(document.URL);
    chrome.storage.local.set({ home_list: [...new Set(home_list)] });
  });

  chrome.storage.local.set({ [document.URL]: urls });
  chrome.storage.local.get("state", (result) => {
    const state = result.state || {};
    state.currentUrl = document.URL;
    chrome.storage.local.set({ state });
  });
}
