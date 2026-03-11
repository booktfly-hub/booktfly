'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Toast = {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'success' | 'destructive'
}

let toastListeners: ((toast: Toast) => void)[] = []

export function toast(options: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).slice(2)
  toastListeners.forEach((listener) => listener({ ...options, id }))
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts((prev) => [...prev, toast])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, 5000)
    }

    toastListeners.push(listener)
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener)
    }
  }, [])

  return (
    <div className="fixed bottom-4 end-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'rounded-lg border p-4 shadow-lg bg-card text-card-foreground animate-in slide-in-from-bottom-5',
            t.variant === 'destructive' && 'border-destructive bg-destructive/10',
            t.variant === 'success' && 'border-success bg-success/10'
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-sm">{t.title}</p>
              {t.description && (
                <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
