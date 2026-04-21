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
    <div className="fixed start-1/2 top-24 z-[70] flex w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 md:start-auto md:end-4 md:top-auto md:bottom-4 md:w-auto md:translate-x-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'rounded-xl border p-4 shadow-2xl animate-in slide-in-from-bottom-5 backdrop-blur-md',
            t.variant === 'destructive'
              ? 'border-destructive/70 bg-destructive text-destructive-foreground'
              : t.variant === 'success'
                ? 'border-success/70 bg-success text-success-foreground'
                : 'border-slate-700 bg-slate-950 text-white'
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-sm">{t.title}</p>
              {t.description && (
                <p className="mt-1 text-sm text-white/80">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
              className="text-white/80 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
