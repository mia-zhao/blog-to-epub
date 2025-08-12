import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from "@dnd-kit/sortable"

import type { CollectionWithKey } from "~/lib/types"

import { SortableItem } from "./sortable-item"

interface CollectionTableProps {
  collection: CollectionWithKey
  selectedItems: Set<string>
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  onDragEnd: (event: DragEndEvent) => void
}

export function CollectionTable({
  collection,
  selectedItems,
  onToggleSelect,
  onToggleSelectAll,
  onDragEnd
}: CollectionTableProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  if (!collection?.info?.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No articles found in this collection
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}>
      <div className="w-full overflow-x-auto">
        <table className="table w-full">
          <colgroup>
            <col className="w-12" />
            <col className="min-w-[200px]" />
            <col className="min-w-[300px]" />
          </colgroup>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={selectedItems.size === collection.info.length}
                  onChange={onToggleSelectAll}
                />
              </th>
              <th className="whitespace-nowrap">Title</th>
              <th className="whitespace-nowrap">URL</th>
            </tr>
          </thead>
          <SortableContext
            items={collection.info.map((item) => item.url) || []}
            strategy={verticalListSortingStrategy}>
            <tbody>
              {collection.info.map((item) => (
                <SortableItem
                  key={item.url}
                  id={item.url}
                  article={item}
                  isSelected={selectedItems.has(item.url)}
                  onToggleSelect={onToggleSelect}
                />
              ))}
            </tbody>
          </SortableContext>
        </table>
      </div>
    </DndContext>
  )
}
