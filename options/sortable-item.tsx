import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import type { Article } from "~/lib/types"

interface SortableItemProps {
  id: string
  article: Article
  isSelected: boolean
  onToggleSelect: (id: string) => void
}

export function SortableItem({
  id,
  article,
  isSelected,
  onToggleSelect
}: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: "relative",
    zIndex: 1,
    cursor: "default"
  } as React.CSSProperties

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`${isSelected ? "bg-base-200" : ""} hover:bg-base-100`}
      {...attributes}>
      <td>
        <input
          type="checkbox"
          className="checkbox checkbox-sm"
          checked={isSelected}
          onChange={() => onToggleSelect(id)}
          onClick={(e) => e.stopPropagation()}
        />
      </td>
      <td className="max-w-[300px] truncate">
        <div className="flex items-center gap-2">
          <span
            className="text-lg opacity-30 hover:opacity-100 transition-opacity cursor-grab"
            {...listeners}>
            ☰
          </span>
          <span className="font-medium">{article.title || "Untitled"}</span>
        </div>
      </td>
      <td className="max-w-[600px] truncate" title={article.url}>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline text-sm font-mono cursor-pointer"
          onClick={(e) => e.stopPropagation()}>
          {article.url.replace(/^https?:\/\//, "")}
        </a>
      </td>
    </tr>
  )
}
