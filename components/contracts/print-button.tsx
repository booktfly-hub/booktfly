'use client'

import { Printer } from 'lucide-react'

export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:brightness-95"
    >
      <Printer className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}
