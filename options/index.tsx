import type { DragEndEvent } from "@dnd-kit/core"
import { useEffect, useMemo, useState } from "react"

import { SettingsModal } from "~/components/settings-modal"
import { ToastContainer, useToasts } from "~/components/toast"
import { ExportController } from "~/lib/core/export-controller"
import type { ExportProgress } from "~/lib/core/types"
import { SAVED_ARTICLES_KEY, type CollectionWithKey } from "~/lib/types"
import { storageService } from "~/lib/utils"

import "~/style.css"

import { CollectionActions } from "./collection-actions"
import { getCollectionId } from "./collection-selector"
import { CollectionTable } from "./collection-table"
import { ErrorState } from "./error-state"
import { LoadingState } from "./loading-state"

export default function Options() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(
    () => {
      if (typeof window === "undefined") return SAVED_ARTICLES_KEY

      const urlParams = new URLSearchParams(window.location.search)
      return urlParams.get("url") || SAVED_ARTICLES_KEY
    }
  )
  const [collections, setCollections] = useState<CollectionWithKey[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [showSettings, setShowSettings] = useState(false)
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(
    null
  )
  const [isExporting, setIsExporting] = useState(false)
  const { toasts, removeToast, showSuccess, showError, showWarning } =
    useToasts()

  const [shouldRefresh, setShouldRefresh] = useState(true)

  const selectedCollection = useMemo(() => {
    return collections.find(
      (collection) => getCollectionId(collection) === selectedCollectionId
    )
  }, [collections, selectedCollectionId])

  useEffect(() => {
    if (!shouldRefresh) return

    const loadCollections = async () => {
      try {
        setIsLoading(true)
        const collections = await storageService.getAllCollections()
        setCollections(
          Object.entries(collections).map(([key, collection]) => ({
            key,
            ...collection
          }))
        )
      } catch (err) {
        console.error("Failed to load collections:", err)
        setError(
          "Failed to load article collections. Please try refreshing the page."
        )
      } finally {
        setIsLoading(false)
        setShouldRefresh(false)
      }
    }

    loadCollections()
  }, [shouldRefresh])

  useEffect(() => {
    if (collections.length === 0) return

    // Check if current selection is valid
    const isValidSelection = collections.some(
      (collection) => getCollectionId(collection) === selectedCollectionId
    )

    // If no valid selection, use the first collection
    if (!isValidSelection && collections.length > 0) {
      const firstCollectionId = getCollectionId(collections[0])
      handleCollectionSelect(firstCollectionId)
    }
  }, [collections, selectedCollectionId])

  const handleCollectionSelect = (id: string) => {
    // Update URL without page reload
    const url = new URL(window.location.href)
    url.searchParams.set("url", id)
    window.history.pushState({}, "", url)

    setSelectedCollectionId(id)
    setSelectedItems(new Set())
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const collectionIndex = collections.findIndex(
      (c) => getCollectionId(c) === selectedCollectionId
    )

    if (collectionIndex === -1) return

    const collection = { ...collections[collectionIndex] }
    const oldIndex = collection.info.findIndex((item) => item.url === active.id)
    const newIndex = collection.info.findIndex((item) => item.url === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const movedItem = collection.info.splice(oldIndex, 1)[0]
    collection.info.splice(newIndex, 0, movedItem)

    await storageService.saveCollection(getCollectionId(collection), collection)

    setCollections((prevCollections) =>
      prevCollections.map((c, i) => (i === collectionIndex ? collection : c))
    )
  }

  const handleToggleSelect = (id: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleToggleSelectAll = () => {
    if (selectedItems.size === selectedCollection?.info?.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(
        new Set(selectedCollection?.info?.map((item) => item.url) || [])
      )
    }
  }

  const handleDeleteSelected = async () => {
    if (!selectedCollection || selectedItems.size === 0) return

    const updatedCollection = {
      ...selectedCollection,
      info: selectedCollection.info.filter(
        (item) => !selectedItems.has(item.url)
      )
    }

    // Update in storage
    await storageService.saveCollection(
      getCollectionId(selectedCollection),
      updatedCollection
    )

    setShouldRefresh(true)

    // Update states
    setCollections((prev) =>
      prev.map((coll) =>
        getCollectionId(coll) === getCollectionId(selectedCollection)
          ? updatedCollection
          : coll
      )
    )

    setSelectedItems(new Set())
  }

  const handleExportSelected = async () => {
    if (!selectedCollection || selectedItems.size === 0) {
      showWarning("No Selection", "Please select at least one item to export")
      return
    }

    // Convert selected articles to export sources
    const urls = selectedCollection.info
      .filter((item) => selectedItems.has(item.url))
      .map((item) => item.url)

    setIsExporting(true)
    setExportProgress(null)

    try {
      const exportController = new ExportController(
        {
          format: "epub",
          title: selectedCollection.title,
          includeOfflineImages: true,
          includeHyperlinks: true,
          maxConcurrency: 3,
          timeout: 30000
        },
        (progress) => {
          setExportProgress(progress)
        }
      )

      const result = await exportController.export(urls)

      if (!result.success) {
        throw new Error(result.error || "Export failed")
      }

      if (!result.blob) {
        throw new Error("No EPUB file was generated")
      }

      // Create a download link for the Blob and trigger download
      const url = URL.createObjectURL(result.blob)
      const a = document.createElement("a")
      a.href = url

      // Create a safe filename from the collection title
      const safeTitle = (selectedCollection.title || "exported-collection")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")

      a.download = `${safeTitle}.epub`
      document.body.appendChild(a)
      a.click()
      a.remove()

      // Revoke URL after download to free memory
      setTimeout(() => URL.revokeObjectURL(url), 100)

      // Show success message
      showSuccess(
        "Export Complete!",
        `Successfully exported ${result.processedUrls} of ${result.totalUrls} articles to EPUB.\nFile downloaded: ${safeTitle}.epub`
      )
    } catch (error) {
      console.error("Export failed:", error)

      // Show user-friendly error message
      if (
        error.message.includes("permission") ||
        error.message.includes("access")
      ) {
        showError(
          "Permission Denied",
          `${error.message}\n\nTo export content from this website:\n1. Open the website in your browser\n2. Use the extension to save the content first\n3. Try exporting again`
        )
      } else if (error.message.includes("No valid sources")) {
        showError(
          "No Valid Content",
          "No valid content to export. Please make sure you have selected items with valid URLs."
        )
      } else if (error.message.includes("aborted")) {
        showWarning("Export Cancelled", "Export was cancelled by user")
      } else {
        showError("Export Failed", `Failed to export EPUB: ${error.message}`)
      }
    } finally {
      setIsExporting(false)
      setExportProgress(null)
    }
  }

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState error={error} onRetry={() => window.location.reload()} />
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <CollectionActions
        selectedItemsCount={selectedItems.size}
        onDeleteSelected={handleDeleteSelected}
        onExportSelected={handleExportSelected}
        onOpenSettings={() => setShowSettings(true)}
        collections={collections}
        selectedCollectionId={selectedCollectionId}
        onSelectCollection={handleCollectionSelect}
        isLoading={isLoading}
        isExporting={isExporting}
        exportProgress={exportProgress}
      />

      {selectedCollection && (
        <CollectionTable
          collection={selectedCollection}
          selectedItems={selectedItems}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onDragEnd={handleDragEnd}
        />
      )}

      {showSettings && (
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
