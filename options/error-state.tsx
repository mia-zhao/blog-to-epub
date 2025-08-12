interface ErrorStateProps {
  error: string
  onRetry: () => void
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="alert alert-error max-w-4xl mx-auto mt-8">
      <div className="flex items-center justify-between w-full">
        <span>{error}</span>
        <button className="btn btn-sm btn-ghost" onClick={onRetry}>
          Retry
        </button>
      </div>
    </div>
  )
}
