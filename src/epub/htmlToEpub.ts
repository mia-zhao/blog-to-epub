import JSZip from "jszip";
import { saveAs } from "file-saver";

// references:
//   https://www.w3.org/AudioVideo/ebook/
//   https://www.editepub.com/understanding-the-epub-format/
//   https://www.editepub.com/epub-3-0-specifications/

export function htmlToEpub(html: HTMLElement) {
  const zip = new JSZip();

  const title = "TITLE";
  const id = "123";

  // create MimeType file
  zip.file("MimeType", "application/epub+zip");

  // create META-INF
  zip
    .folder("META-INF")
    ?.file("container.xml", createMetaInf("OEBPS/content.opf"));

  // create OEBPS/content.opf
  zip.folder("OEBPS")?.file(
    "content.opf",
    createOpf({
      id,
      title,
      publisher: "PUBLISHER",
      creator: "CREATOR",
    }),
  );

  // create OEBPS/content.xhtml
  zip
    .folder("OEBPS")
    ?.file(
      "content.xhtml",
      `<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en"><head><title>TITLE</title><link rel="stylesheet" type="text/css" href="styles.css"/></head><body>${html.outerHTML}</body></html>`,
    );

  // create OEBPS/styles.css
  zip.folder("OEBPS")?.file("styles.css", parseCss());

  zip.generateAsync({ type: "blob" }).then((blob) => {
    saveAs(blob, `${title}_${id}.epub`);
  });
}

function createMetaInf(opfPath: string) {
  return `<container version="1.0">
  <rootfiles>
  <rootfile full-path="${opfPath}" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
}

function createOpf({
  id,
  title,
  publisher,
  creator,
}: {
  id: string;
  title: string;
  publisher: string;
  creator: string;
}) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" xmlns:opf="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookID">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
   <dc:identifier id="BookId">${id}</dc:identifier>
   <dc:title>${title}</dc:title>
   <dc:publisher>${publisher}</dc:publisher>
   <dc:creator>${creator}</dc:creator>
   <dc:language>
      en-US
   </dc:language>
  </metadata>
  <manifest>
    <item id="content" href="content.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
   <itemref idref="content"/>
  </spine>
</package>`;
}

function parseCss() {
  return `body {
  font-family: sans-serif;
}

a {
  color: inherit;
  text-decoration: inherit;
  font-size: inherit;
}`;
}
