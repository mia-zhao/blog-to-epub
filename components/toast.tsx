import { useEffect, useState } from "react"
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react"

export type ToastType = "success" | "error" | "warning" | "info"

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastProps {
  toast: Toast
  onRemove: (id: string) => void
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

const ToastIcon = ({ type }: { type: ToastType }) => {
  const iconClass = "w-5 h-5"
  
  switch (type) {
    case "success":
      return <CheckCircle className={`${iconClass} text-green-500`} />
    case "error":
      return <XCircle className={`${iconClass} text-red-500`} />
    case "warning":
      return <AlertCircle className={`${iconClass} text-yellow-500`} />
    case "info":
      return <Info className={`${iconClass} text-blue-500`} />
  }
}

function ToastItem({ toast, onRemove }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id)
    }, toast.duration || 5000)

    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onRemove])

  const bgColor = {
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200", 
    warning: "bg-yellow-50 border-yellow-200",
    info: "bg-blue-50 border-blue-200"
  }[toast.type]

  return (
    <div className={`${bgColor} border rounded-lg p-4 shadow-lg max-w-sm w-full transition-all duration-300 ease-in-out`}>
      <div className="flex items-start gap-3">
        <ToastIcon type={toast.type} />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900">{toast.title}</h4>
          {toast.message && (
            <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{toast.message}</p>
          )}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

// Hook for managing toasts
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { ...toast, id }])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const showSuccess = (title: string, message?: string, duration?: number) => {
    addToast({ type: "success", title, message, duration })
  }

  const showError = (title: string, message?: string, duration?: number) => {
    addToast({ type: "error", title, message, duration: duration || 8000 })
  }

  const showWarning = (title: string, message?: string, duration?: number) => {
    addToast({ type: "warning", title, message, duration })
  }

  const showInfo = (title: string, message?: string, duration?: number) => {
    addToast({ type: "info", title, message, duration })
  }

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
}
