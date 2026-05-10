'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { Plus, Mic, ArrowUp, Square, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Composer({
  isStreaming,
  onSubmit,
  onStop,
}: {
  locale?: string
  isStreaming: boolean
  onSubmit: (text: string) => void
  onStop: () => void
}) {
  const t = useTranslations('assistant.composer')
  const [value, setValue] = useState('')
  const taRef = useRef<HTMLTextAreaElement>(null)

  // Auto-grow textarea
  useEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`
  }, [value])

  const handleSubmit = () => {
    const text = value.trim()
    if (!text || isStreaming) return
    onSubmit(text)
    setValue('')
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div
      className={cn(
        'flex items-end gap-2 rounded-3xl border border-border bg-surface px-3 py-2 shadow-sm transition-shadow',
        'focus-within:border-primary/50 focus-within:shadow-md'
      )}
    >
      <button
        type="button"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
        aria-label={t('attach')}
        title={t('attach')}
      >
        <Plus className="h-5 w-5" />
      </button>

      <textarea
        ref={taRef}
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={t('placeholder')}
        className="min-h-[36px] flex-1 resize-none bg-transparent px-1 py-2 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground"
      />

      <div className="hidden items-center gap-1 sm:flex">
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          {t('thinking_label')}
        </span>
      </div>

      <button
        type="button"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
        aria-label={t('voice')}
        title={t('voice')}
      >
        <Mic className="h-4 w-4" />
      </button>

      {isStreaming ? (
        <button
          type="button"
          onClick={onStop}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-90"
          aria-label={t('stop')}
          title={t('stop')}
        >
          <Square className="h-3.5 w-3.5 fill-current" />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!value.trim()}
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all',
            value.trim()
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted text-muted-foreground'
          )}
          aria-label={t('send')}
          title={t('send')}
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
