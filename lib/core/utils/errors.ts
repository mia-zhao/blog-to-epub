/**
 * Error handling utilities for the blog-to-epub system
 */

export class ExtractionError extends Error {
  constructor(
    message: string,
    public url: string,
    public cause?: Error
  ) {
    super(message)
    this.name = 'ExtractionError'
  }
}

export class ProcessingError extends Error {
  constructor(
    message: string,
    public url: string,
    public cause?: Error
  ) {
    super(message)
    this.name = 'ProcessingError'
  }
}

export class EpubGenerationError extends Error {
  constructor(
    message: string,
    public cause?: Error
  ) {
    super(message)
    this.name = 'EpubGenerationError'
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('network') || 
           error.message.includes('timeout') ||
           error.message.includes('fetch')
  }
  return false
}

export function isPermissionError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('permission') ||
           error.message.includes('access') ||
           error.message.includes('blocked')
  }
  return false
}

export function getUserFriendlyErrorMessage(error: unknown, url?: string): string {
  const baseMessage = getErrorMessage(error)
  
  if (isNetworkError(error)) {
    return `Network error while accessing ${url || 'the page'}. Please check your internet connection and try again.`
  }
  
  if (isPermissionError(error)) {
    return `Permission denied accessing ${url || 'the page'}. The website might be blocking automated access.`
  }
  
  if (baseMessage.includes('No content')) {
    return `No readable content found on ${url || 'the page'}. The page might not contain article content or might require JavaScript.`
  }
  
  if (baseMessage.includes('timeout')) {
    return `Timeout while loading ${url || 'the page'}. The page took too long to load.`
  }
  
  return `Failed to process ${url || 'the page'}: ${baseMessage}`
}
