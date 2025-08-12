import { EpubBuilder } from "./builders/epub"
import {
  ContentExtractor,
  type ContentExtractionConfig
} from "./content-extractor"
import type {
  Chapter,
  ExportProgress,
  ExportResult,
  ExportSettings
} from "./types"
import { getUserFriendlyErrorMessage } from "./utils/errors"

export class ExportController {
  private abortController: AbortController
  private contentExtractor: ContentExtractor
  private builder: EpubBuilder | null = null
  private settings: ExportSettings
  private onProgress?: (progress: ExportProgress) => void

  constructor(
    settings: ExportSettings,
    onProgress?: (progress: ExportProgress) => void
  ) {
    this.abortController = new AbortController()
    this.settings = settings
    this.onProgress = onProgress

    const extractorConfig: ContentExtractionConfig = {
      includeOfflineImages: settings.includeOfflineImages,
      includeHyperlinks: settings.includeHyperlinks,
      timeout: settings.timeout || 30000,
      maxConcurrency: settings.maxConcurrency || 3
    }

    this.contentExtractor = new ContentExtractor(extractorConfig)
  }

  abort() {
    this.abortController.abort()
    this.cleanup()
  }

  async export(sources: string[]): Promise<ExportResult> {
    if (!sources.length) {
      return {
        success: false,
        error: "No sources provided for export",
        processedUrls: 0,
        totalUrls: 0
      }
    }

    if (this.abortController.signal.aborted) {
      return {
        success: false,
        error: "Export was aborted",
        processedUrls: 0,
        totalUrls: sources.length
      }
    }

    try {
      this.reportProgress(
        0,
        sources.length,
        "",
        "extracting",
        "Starting export..."
      )

      switch (this.settings.format) {
        case "epub":
          return await this.exportEpub(sources)
        case "pdf":
          return {
            success: false,
            error: "PDF export is not yet implemented",
            processedUrls: 0,
            totalUrls: sources.length
          }
        default:
          return {
            success: false,
            error: `Unsupported export format: ${this.settings.format}`,
            processedUrls: 0,
            totalUrls: sources.length
          }
      }
    } catch (error) {
      console.error("Export failed:", error)
      return {
        success: false,
        error: getUserFriendlyErrorMessage(error),
        processedUrls: 0,
        totalUrls: sources.length
      }
    } finally {
      await this.cleanup()
    }
  }

  private reportProgress(
    current: number,
    total: number,
    currentUrl: string,
    status: ExportProgress["status"],
    message?: string
  ): void {
    if (this.onProgress) {
      this.onProgress({
        current,
        total,
        currentUrl,
        status,
        message
      })
    }
  }

  private async exportEpub(urls: string[]): Promise<ExportResult> {
    if (urls.length === 0) {
      return {
        success: false,
        error: "No valid sources provided for export",
        processedUrls: 0,
        totalUrls: urls.length
      }
    }

    if (!this.settings.title?.trim()) {
      return {
        success: false,
        error: "Title is required for EPUB export",
        processedUrls: 0,
        totalUrls: urls.length
      }
    }

    try {
      this.builder = new EpubBuilder(this.settings.title.trim())
      const chapters: Chapter[] = []
      let processedCount = 0

      // Extract and process content from all URLs
      for (let i = 0; i < urls.length; i++) {
        if (this.abortController.signal.aborted) {
          return {
            success: false,
            error: "Export was aborted by user",
            processedUrls: processedCount,
            totalUrls: urls.length
          }
        }

        const url = urls[i]
        this.reportProgress(
          i,
          urls.length,
          url,
          "extracting",
          `Processing ${url}`
        )

        try {
          // Step 1: Extract raw content from the page
          const extractedContent =
            await this.contentExtractor.extractFromUrl(url)

          if (!extractedContent) {
            console.warn(`Failed to extract content from: ${url}`)
            continue
          }

          this.reportProgress(
            i,
            urls.length,
            url,
            "processing",
            `Processing content from ${url}`
          )

          // Step 2: Process the extracted content with Readability and configurations
          const processedContent =
            await this.contentExtractor.processExtractedContent(
              extractedContent
            )

          if (processedContent.content) {
            chapters.push({
              id: i + 1,
              title: processedContent.title || `Chapter ${i + 1}`,
              author: processedContent.author || "",
              content: processedContent.content,
              url
            })
            processedCount++
          }
        } catch (error) {
          console.error(`Failed to process URL ${url}:`, error)
          // Continue with other URLs instead of failing completely
        }
      }

      if (chapters.length === 0) {
        return {
          success: false,
          error: "No content could be extracted from any of the provided URLs",
          processedUrls: processedCount,
          totalUrls: urls.length
        }
      }

      this.reportProgress(
        urls.length,
        urls.length,
        "",
        "building",
        "Building EPUB file..."
      )

      // Add all chapters to the EPUB
      for (const chapter of chapters) {
        this.builder.addChapter(chapter)
      }

      // Generate the EPUB
      const blob = await this.builder.generateEpub()
      if (!blob || blob.size === 0) {
        return {
          success: false,
          error: "Failed to generate EPUB: empty or invalid content",
          processedUrls: processedCount,
          totalUrls: urls.length
        }
      }

      this.reportProgress(
        urls.length,
        urls.length,
        "",
        "complete",
        "EPUB generated successfully!"
      )

      return {
        success: true,
        blob,
        processedUrls: processedCount,
        totalUrls: urls.length
      }
    } catch (error) {
      console.error("EPUB export failed:", error)
      return {
        success: false,
        error: getUserFriendlyErrorMessage(error),
        processedUrls: 0,
        totalUrls: urls.length
      }
    }
  }

  private async cleanup(): Promise<void> {
    try {
      if (this.contentExtractor) {
        await this.contentExtractor.cleanup()
      }
      this.builder = null
    } catch (error) {
      console.error("Error during cleanup:", error)
    }
  }
}
