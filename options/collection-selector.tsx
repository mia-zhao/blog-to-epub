import { SAVED_ARTICLES_KEY, type CollectionWithKey } from "~/lib/types"

interface CollectionSelectorProps {
  collections: CollectionWithKey[]
  selectedCollection: string
  onSelect: (id: string) => void
  disabled?: boolean
}

export function CollectionSelector({
  collections,
  selectedCollection,
  onSelect,
  disabled = false
}: CollectionSelectorProps) {
  return (
    <select
      className={`select select-bordered w-full max-w-xl ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      value={selectedCollection}
      name="select-article-collection"
      onChange={(e) => onSelect(e.target.value)}
      disabled={disabled}>
      {collections.length === 0 ? (
        <option>No collections found</option>
      ) : (
        collections.map((collection) => {
          const id = getCollectionId(collection)
          const displayName = collection.title || collection.key || "Untitled"
          return (
            <option key={id} value={id}>
              {displayName} ({collection.info?.length || 0})
            </option>
          )
        })
      )}
    </select>
  )
}

export function getCollectionId(collection: CollectionWithKey): string {
  if (collection.title === "Saved Articles") {
    return SAVED_ARTICLES_KEY
  }
  return collection.key || collection.title || ""
}
