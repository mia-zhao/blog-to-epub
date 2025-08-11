import { useEffect, useRef, useState } from "react"

import iconSvg from "~/assets/icon.svg"

interface DraggableOverlayProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  initialPosition?: { x: number; y: number }
}

export const DraggableOverlay = ({
  title,
  onClose,
  children,
  initialPosition = { x: 20, y: 20 }
}: DraggableOverlayProps) => {
  const [position, setPosition] = useState(initialPosition)
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const panelRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!panelRef.current) return
    if ((e.target as HTMLElement).closest("button")) return

    const rect = panelRef.current.getBoundingClientRect()
    setOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    setIsDragging(true)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return

    setPosition({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = "grabbing"
      document.body.style.userSelect = "none"
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, offset])

  const panelStyle: React.CSSProperties = {
    position: "fixed",
    left: `${position.x}px`,
    top: `${position.y}px`,
    zIndex: 2147483647,
    width: "340px",
    background: "white",
    borderRadius: "12px",
    boxShadow: isHovered
      ? "0 8px 30px rgba(0, 0, 0, 0.2)"
      : "0 4px 20px rgba(0, 0, 0, 0.15)",
    overflow: "hidden",
    transition: "box-shadow 0.2s ease, transform 0.1s ease",
    transform: isDragging ? "scale(1.01)" : "scale(1)",
    cursor: isDragging ? "grabbing" : "grab"
  }

  const headerStyle: React.CSSProperties = {
    padding: "12px 16px",
    background: "#000",
    color: "white",
    fontWeight: 600,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  }

  const closeButtonStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    color: "white",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.2s"
  }

  return (
    <div
      ref={panelRef}
      style={panelStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleMouseDown}>
      <div style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <img
            src={iconSvg}
            alt="blog to epub icon"
            style={{ width: "24px", height: "24px" }}
          />
          <span>{title}</span>
        </div>
        <button
          onClick={onClose}
          style={closeButtonStyle}
          onMouseEnter={(e) => {
            const target = e.target as HTMLElement
            target.style.backgroundColor = "rgba(255, 255, 255, 0.2)"
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLElement
            target.style.backgroundColor = "transparent"
          }}>
          ✕
        </button>
      </div>
      <div style={{ padding: "16px" }}>{children}</div>
    </div>
  )
}
