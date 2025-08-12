import { Readability } from "@mozilla/readability"

import { getDocumentAuthor, getDocumentTitle } from "~/lib/utils"

import type { Article } from "./types"

export interface ProcessContentOptions {
  includeOfflineImages?: boolean
  includeHyperlinks?: boolean
}

export class Preprocessor {
  private config: ProcessContentOptions

  constructor(config: ProcessContentOptions) {
    this.config = config
  }

  private getTitle(document: Document) {
    return getDocumentTitle(document)
  }

  private getAuthor(document: Document) {
    return getDocumentAuthor(document)
  }

  public async getArticle(document: Document): Promise<Article> {
    let reader
    try {
      reader = new Readability(document)
      if (!reader) {
        throw new Error("Failed to initialize Readability parser")
      }
      const readerObj = reader.parse()
      if (!readerObj) {
        throw new Error("No content could be extracted")
      }

      const parser = new DOMParser()
      const articleDoc = parser.parseFromString(readerObj.content, "text/html")
      if (!articleDoc) {
        throw new Error("Failed to parse article content")
      }

      const processedArticle = await processArticle(articleDoc, this.config)
      if (!processedArticle) {
        throw new Error("Article processing returned no content")
      }

      const serializer = new XMLSerializer()
      const content = serializer.serializeToString(processedArticle)

      // Validate final content
      if (!content || content.trim().length === 0) {
        throw new Error("No valid content could be extracted")
      }

      return {
        content,
        author: readerObj.byline || this.getAuthor(document),
        title: readerObj.title || this.getTitle(document)
      }
    } catch (error) {
      console.error("Error processing article:", error)
      throw error
    }
  }
}

async function processArticle(
  document: Document,
  options: ProcessContentOptions
): Promise<Document> {
  if (!options.includeHyperlinks) {
    document.querySelectorAll("a").forEach((a) => {
      const text = document.createTextNode(a.textContent || "")
      a.replaceWith(text)
    })
  }
  if (options.includeOfflineImages) {
    const processImage = async (
      img: HTMLImageElement,
      index: number
    ): Promise<void> => {
      if (img.src.startsWith("data:")) {
        // if the image is already base64, don't need to fetch it
        img.alt = `[Image ${index + 1}]${img.alt ? " " + img.alt : ""}`
        img.classList.add("responsive-img")
        return
      }

      img.removeAttribute("style")
      if (img.hasAttribute("width") && img.hasAttribute("height")) {
        img.removeAttribute("height")
      }

      try {
        const response = await fetch(img.src)
        const blob = await response.blob()
        const reader = new FileReader()

        reader.onload = () => {
          if (typeof reader.result === "string") {
            img.src = reader.result
            img.alt = `[Image ${index + 1}]${img.alt ? " " + img.alt : ""}`
            img.classList.add("responsive-img")
          }
        }

        reader.readAsDataURL(blob)
      } catch (error) {
        console.error("Error processing image:", error)
        img.alt = `[Image ${index + 1} - Failed to load]`
      }
    }

    const images = Array.from(document.querySelectorAll("img"))
    await Promise.all(images.map((img, index) => processImage(img, index)))
  } else {
    document.querySelectorAll("img").forEach((img, index) => {
      img.alt = `[Image ${index + 1}]${img.alt ? " " + img.alt : ""}`
      img.classList.add("responsive-img")
    })
  }

  return document
}
