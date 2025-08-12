/**
 * Core types for the blog-to-epub system
 */

export interface Article {
  content: string
  author: string
  title: string
}

export interface Chapter {
  id: number
  url: string
  title: string
  content: string
  author?: string
}

export type ExportFormat = "epub" | "pdf"

export interface ExportSettings {
  format: ExportFormat
  title: string
  includeOfflineImages: boolean
  includeHyperlinks: boolean
  timeout?: number
  maxConcurrency?: number
}

export interface ExportProgress {
  current: number
  total: number
  currentUrl: string
  status: "extracting" | "processing" | "building" | "complete" | "error"
  message?: string
}

export interface ExportResult {
  success: boolean
  blob?: Blob
  error?: string
  processedUrls: number
  totalUrls: number
}
