/**
 * Content Extractor - Handles DOM extraction from tabs and background processing
 * Replaces the complex PageLoader + Preprocessor injection pattern
 */

import { Semaphore } from "./utils/semaphore"

export interface ContentExtractionConfig {
  includeOfflineImages?: boolean
  includeHyperlinks?: boolean
  timeout?: number
  maxConcurrency?: number
}

export class ContentExtractor {
  private tabIds: Set<number> = new Set()
  private readonly config: ContentExtractionConfig
  private readonly TIMEOUT_MS: number
  private readonly MAX_CONCURRENCY: number

  constructor(config: ContentExtractionConfig = {}) {
    this.config = {
      includeOfflineImages: false,
      includeHyperlinks: false,
      timeout: 30000,
      maxConcurrency: 3,
      ...config
    }
    this.TIMEOUT_MS = this.config.timeout!
    this.MAX_CONCURRENCY = this.config.maxConcurrency!
  }

  /**
   * Extract content from multiple URLs with concurrency control
   */
  async extractFromUrls(urls: string[]): Promise<Map<string, string | null>> {
    const results = new Map<string, string | null>()
    const semaphore = new Semaphore(this.MAX_CONCURRENCY)

    const extractionPromises = urls.map(async (url) => {
      await semaphore.acquire()
      try {
        const content = await this.extractFromUrl(url)
        results.set(url, content)
      } catch (error) {
        console.error(`Failed to extract from ${url}:`, error)
        results.set(url, null)
      } finally {
        semaphore.release()
      }
    })

    await Promise.all(extractionPromises)
    return results
  }

  /**
   * Extract content from a URL by opening it in a background tab
   */
  async extractFromUrl(url: string): Promise<string | null> {
    return new Promise<string | null>((resolve, reject) => {
      chrome.tabs.create(
        {
          url,
          active: false,
          pinned: true
        },
        (tab) => {
          if (!tab?.id) {
            resolve(null)
            return
          }

          const tabId = tab.id
          this.tabIds.add(tabId)

          const cleanup = () => {
            chrome.tabs.onUpdated.removeListener(handleTabUpdate)
            chrome.tabs.onRemoved.removeListener(handleTabRemoved)
            clearTimeout(timeoutId)

            // Remove tab after a short delay to ensure content is extracted
            setTimeout(() => {
              chrome.tabs.remove(tabId).catch(() => {})
              this.tabIds.delete(tabId)
            }, 1000)
          }

          const handleTabUpdate = async (
            updatedTabId: number,
            info: chrome.tabs.TabChangeInfo
          ) => {
            if (updatedTabId !== tabId || info.status !== "complete") {
              return
            }

            try {
              const [result] = await chrome.scripting.executeScript({
                target: { tabId },
                func: () => document.documentElement.outerHTML
              })

              if (!result?.result) {
                console.error("No result from script execution:", result)
                throw new Error(
                  "Failed to extract DOM content - no result returned"
                )
              }

              resolve(result.result)
            } catch (error) {
              console.error("Error extracting content:", error)
              console.error("Error details:", {
                message: error.message,
                stack: error.stack,
                tabId
              })
              resolve(null)
            } finally {
              cleanup()
            }
          }

          const handleTabRemoved = (removedTabId: number) => {
            if (removedTabId === tabId) {
              cleanup()
              resolve(null)
            }
          }

          const timeoutId = setTimeout(() => {
            console.error(`Timeout extracting content from: ${url}`)
            cleanup()
            resolve(null)
          }, this.TIMEOUT_MS)

          chrome.tabs.onUpdated.addListener(handleTabUpdate)
          chrome.tabs.onRemoved.addListener(handleTabRemoved)
        }
      )
    })
  }

  async processExtractedContent(extracted: string): Promise<{
    content: string
    title: string
    author: string
  }> {
    const { Preprocessor } = await import("./preprocessor")

    const parser = new DOMParser()
    const doc = parser.parseFromString(extracted, "text/html")

    const preprocessor = new Preprocessor({
      includeOfflineImages: this.config.includeOfflineImages,
      includeHyperlinks: this.config.includeHyperlinks
    })

    try {
      const article = await preprocessor.getArticle(doc)

      return {
        content: article.content,
        title: article.title,
        author: article.author
      }
    } catch (error) {
      console.error(
        "Preprocessor failed, falling back to basic processing:",
        error
      )
      return {
        content: "",
        title: "",
        author: ""
      }
    }
  }

  async cleanup(): Promise<void> {
    const cleanupPromises = Array.from(this.tabIds).map((tabId) =>
      chrome.tabs.remove(tabId).catch(() => {})
    )
    await Promise.all(cleanupPromises)
    this.tabIds.clear()
  }
}
