import { createContext, useContext, useState, useCallback } from 'react'
import { getExplorerLink } from '../lib/utils'

const ToastContext = createContext(null)

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((toast) => {
    const id = ++toastId
    setToasts(prev => [...prev, { ...toast, id }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, toast.duration || 6000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg border shadow-lg fade-in-up ${
              toast.type === 'success' ? 'bg-green/10 border-green text-green' :
              toast.type === 'error' ? 'bg-red/10 border-red text-red' :
              toast.type === 'warning' ? 'bg-yellow/10 border-yellow text-yellow' :
              'bg-surface border-border text-text'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm">{toast.message}</p>
              <button onClick={() => removeToast(toast.id)} className="text-muted hover:text-text">✕</button>
            </div>
            {toast.txHash && (
              <a
                href={getExplorerLink(toast.txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline opacity-80 hover:opacity-100 mt-1 block"
              >
                View on Explorer →
              </a>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}
