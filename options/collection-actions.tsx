import { Settings } from "lucide-react"

import type { ExportProgress } from "~/lib/core/types"
import type { CollectionWithKey } from "~/lib/types"

interface CollectionActionsProps {
  selectedItemsCount: number
  onDeleteSelected: () => void
  onExportSelected: () => void
  onOpenSettings: () => void
  collections: CollectionWithKey[]
  selectedCollectionId: string
  onSelectCollection: (id: string) => void
  isLoading?: boolean
  isExporting?: boolean
  exportProgress?: ExportProgress | null
}

export function CollectionActions({
  selectedItemsCount,
  onDeleteSelected,
  onExportSelected,
  onOpenSettings,
  collections,
  selectedCollectionId,
  onSelectCollection,
  isLoading = false,
  isExporting = false,
  exportProgress = null
}: CollectionActionsProps) {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manage Articles</h1>
        <button
          className="btn btn-sm"
          onClick={onOpenSettings}
          disabled={isLoading}>
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="w-full max-w-[600px]">
          <select
            className={`select select-bordered w-full ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            value={selectedCollectionId}
            onChange={(e) => onSelectCollection(e.target.value)}
            disabled={isLoading}>
            {collections.length === 0 ? (
              <option>No collections found</option>
            ) : (
              collections.map((collection) => {
                const isSavedArticles = collection.title === "Saved Articles"
                const id = isSavedArticles
                  ? "saved_articles"
                  : collection.key || collection.title || ""
                const displayName =
                  collection.title || collection.key || "Untitled"
                return (
                  <option key={id} value={id}>
                    {displayName} ({collection.info?.length || 0})
                  </option>
                )
              })
            )}
          </select>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            className={`btn btn-sm ${selectedItemsCount === 0 ? "btn-disabled" : ""} flex-1 sm:flex-none text-red-500 border-red-500 bg-white hover:bg-red-100 hover:border-red-500`}
            disabled={selectedItemsCount === 0 || isLoading || isExporting}
            onClick={onDeleteSelected}>
            Delete Selected ({selectedItemsCount})
          </button>
          <button
            className={`btn btn-sm ${selectedItemsCount === 0 || isExporting ? "btn-disabled" : ""} flex-1 sm:flex-none bg-black text-white hover:bg-black/80`}
            disabled={selectedItemsCount === 0 || isLoading || isExporting}
            onClick={onExportSelected}>
            {isExporting ? (
              <span className="flex items-center gap-2">
                <span className="loading loading-spinner loading-xs"></span>
                {exportProgress
                  ? `${exportProgress.status === "complete" ? "Finishing..." : `${exportProgress.current}/${exportProgress.total}`}`
                  : "Exporting..."}
              </span>
            ) : (
              `Download EPUB (${selectedItemsCount})`
            )}
          </button>
        </div>
      </div>

      {exportProgress && (
        <div className="bg-base-200 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Export Progress</span>
            <span className="text-sm text-base-content/70">
              {exportProgress.current} / {exportProgress.total}
            </span>
          </div>
          <div className="w-full bg-base-300 rounded-full h-2 mb-2">
            <div
              className="bg-black h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(exportProgress.current / exportProgress.total) * 100}%`
              }}></div>
          </div>
          <div className="text-xs text-base-content/60">
            {exportProgress.message ||
              `Processing: ${exportProgress.currentUrl}`}
          </div>
        </div>
      )}
    </div>
  )
}
