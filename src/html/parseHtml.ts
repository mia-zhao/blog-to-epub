export function parseHtml(html: string): HTMLElement | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  return parseBody(doc.body);
}

// function parseHead(head: HTMLHeadElement): Head {
//   const title = head.querySelector("title")?.textContent;
//   const metaList: Meta[] = [];
//   head.querySelectorAll("meta").forEach((meta) => {
//     const name = meta.getAttribute("name");
//     if (name) {
//       metaList.push({ name, content: meta.getAttribute("content") || "" });
//     }
//   });

//   return {
//     title: title || "",
//     metaList,
//   };
// }

// get the article
function parseBody(body: HTMLElement): HTMLElement | null {
  const parseNode = (node: HTMLElement): HTMLElement => {
    node.removeAttribute("class");
    Array.from(node.children).map((element) => {
      parseNode(element as HTMLElement);
    });
    return node;
  };

  const article = body.querySelector("article");
  if (article) {
    return parseNode(article);
  }
  return body;
}

// type Meta = { name: string; content: string };
// type Head = { title: string; metaList: Meta[] };
