/**
 * EPUB Builder - Creates EPUB files from processed content
 */

import JSZip from "jszip"
import { v4 as uuid } from "uuid"

import type { Chapter } from "../types"
import { EpubGenerationError } from "../utils/errors"

export interface EpubMetadata {
  title: string
  authors: string[]
  identifier?: string
}

export class EpubBuilder {
  private readonly metadata: EpubMetadata
  private readonly chapters: Chapter[] = []
  private zip?: JSZip

  constructor(title: string) {
    if (!title?.trim()) {
      throw new EpubGenerationError("EPUB title is required")
    }

    this.metadata = {
      title: title.trim(),
      authors: [],
      identifier: `urn:uuid:${uuid()}`
    }
  }

  addChapter(chapter: Chapter): void {
    if (!chapter.title?.trim()) {
      throw new EpubGenerationError(`Chapter ${chapter.id} must have a title`)
    }

    if (!chapter.content?.trim()) {
      throw new EpubGenerationError(`Chapter ${chapter.id} must have content`)
    }

    const xhtmlContent = this.createChapterXhtml(chapter.title, chapter.content)

    this.chapters.push({
      ...chapter,
      title: chapter.title.trim(),
      content: xhtmlContent
    })

    this.chapters.sort((a, b) => a.id - b.id)

    if (chapter.author?.trim()) {
      const author = chapter.author.trim()
      if (!this.metadata.authors.includes(author)) {
        this.metadata.authors.push(author)
      }
    }
  }

  private createChapterXhtml(title: string, content: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="stylesheet" type="text/css" href="styles.css"/>
    <title>${this.escapeXml(title)}</title>
  </head>
  <body>
    <h1>${this.escapeXml(title)}</h1>
    <section epub:type="chapter">
      ${content}
    </section>
  </body>
</html>`
  }

  async generateEpub(): Promise<Blob> {
    if (this.chapters.length === 0) {
      throw new EpubGenerationError("No chapters available for EPUB generation")
    }

    try {
      this.zip = new JSZip()

      // Add required EPUB structure
      this.addMimeType()
      this.addMetaInfFiles()
      this.addOebpsFiles()

      // Generate the final EPUB blob
      const blob = await this.zip.generateAsync({
        type: "blob",
        mimeType: "application/epub+zip",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      })

      if (!blob || blob.size === 0) {
        throw new EpubGenerationError("Generated EPUB file is empty")
      }

      return blob
    } catch (error) {
      if (error instanceof EpubGenerationError) {
        throw error
      }
      throw new EpubGenerationError(
        `Failed to generate EPUB: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : undefined
      )
    }
  }

  private addMimeType(): void {
    this.zip!.file("mimetype", "application/epub+zip")
  }

  private addMetaInfFiles(): void {
    const metaFolder = this.zip!.folder("META-INF")!
    metaFolder.file(
      "container.xml",
      this.generateContainerXML("OEBPS/content.opf")
    )
  }

  private addOebpsFiles(): void {
    const oebpsFolder = this.zip!.folder("OEBPS")!

    for (const chapter of this.chapters) {
      oebpsFolder.file(this.getChapterFileName(chapter.id), chapter.content)
    }

    oebpsFolder.file(
      "content.opf",
      this.generateOpf({
        id: this.metadata.identifier!,
        title: this.metadata.title,
        creator: this.metadata.authors.join(", ")
      })
    )
    oebpsFolder.file("toc.ncx", this.generateToc())
    oebpsFolder.file("styles.css", this.getCss())
  }

  private generateToc() {
    return `<?xml version='1.0' encoding='UTF-8'?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" >
  <head>
    <title>Table of Contents</title>
    <meta charset="UTF-8" />
  </head>
  <body>
    <h1>Table of Contents</h1>
    <nav id="toc" epub:type="toc">
      <ol>
        <li><a href="toc.ncx">Table of Contents</a></li>
        ${this.chapters
          .map(
            (chapter) =>
              `<li id="chapter_${
                chapter.id
              }"><a epub:type="bodymatter" href="${this.getChapterFileName(
                chapter.id
              )}">${this.escapeXml(chapter.title)}</a></li>`
          )
          .join("\n")}
      </ol>
    </nav>
  </body>
</html>
  `
  }

  private generateContainerXML(opfPath: string) {
    return `<container version="1.0">
  <rootfiles>
    <rootfile full-path="${opfPath}" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  }

  private generateOpf({
    id,
    title,
    creator
  }: {
    id: string
    title: string
    creator: string
  }): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" xmlns:opf="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookID">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">${id}</dc:identifier>
    <dc:title>${this.escapeXml(title)}</dc:title>
    ${creator
      .split(",")
      .map((author) => `<dc:creator>${this.escapeXml(author)}</dc:creator>`)}
  </metadata>
  <manifest>
    <item id="toc" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
  ${this.chapters
    .map(
      ({ id: cId }) =>
        `<item id="chapter-${cId}" href="${this.getChapterFileName(
          cId
        )}" media-type="application/xhtml+xml"/>`
    )
    .join("\n")}
    <item id="styles" href="styles.css" media-type="text/css"/>
  </manifest>
  <spine>
    <itemref idref="toc"/>
   ${this.chapters
     .map(({ id: cId }) => `<itemref idref="chapter-${cId}"/>`)
     .join("\n")}
  </spine>
</package>`
  }

  private getChapterFileName(id: number): string {
    return `chapter_${id}.xhtml`
  }

  private getCss(): string {
    return `body {
        font-family: sans-serif;
      }
      
      h1 {
        text-align: center;
      }
      
      img .responsive-img {
        height: auto;
      }
      `
  }

  private escapeXml(str: string): string {
    return str.replace(/[<>&'"]/g, function (c) {
      switch (c) {
        case "<":
          return "&lt;"
        case ">":
          return "&gt;"
        case "&":
          return "&amp;"
        case "'":
          return "&apos;"
        case '"':
          return "&quot;"
        default:
          return c
      }
    })
  }
}
