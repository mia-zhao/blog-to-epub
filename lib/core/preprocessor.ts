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
      // Check if the link contains only images or other non-text content
      const hasImages = a.querySelector("img")
      const textContent = a.textContent?.trim()

      if (hasImages && !textContent) {
        // If link only contains images, just remove the link wrapper but keep the content
        const parent = a.parentNode
        if (parent) {
          while (a.firstChild) {
            parent.insertBefore(a.firstChild, a)
          }
          parent.removeChild(a)
        }
      } else if (textContent) {
        // If link has text content, replace with text only
        const text = document.createTextNode(textContent)
        a.replaceWith(text)
      } else {
        // If link is empty, remove it entirely
        a.remove()
      }
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

      // Preserve original dimensions for aspect ratio
      const originalWidth = img.width || img.naturalWidth
      const originalHeight = img.height || img.naturalHeight

      img.removeAttribute("style")

      // Set max-width while preserving aspect ratio
      if (originalWidth && originalHeight) {
        img.style.maxWidth = "100%"
        img.style.height = "auto"
        img.style.aspectRatio = `${originalWidth}/${originalHeight}`
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
      // Preserve original dimensions for aspect ratio when not processing offline
      const originalWidth = img.width || img.naturalWidth
      const originalHeight = img.height || img.naturalHeight

      img.removeAttribute("style")

      // Set responsive styling while preserving aspect ratio
      if (originalWidth && originalHeight) {
        img.style.maxWidth = "100%"
        img.style.height = "auto"
        img.style.aspectRatio = `${originalWidth}/${originalHeight}`
      }

      img.alt = `[Image ${index + 1}]${img.alt ? " " + img.alt : ""}`
      img.classList.add("responsive-img")
    })
  }

  return document
}
