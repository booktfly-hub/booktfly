'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import { MessageBubble } from './message-bubble'
import { Composer } from './composer'
import { EmptyState } from './empty-state'
import { cn } from '@/lib/utils'

export function AssistantChat({ locale }: { locale: string }) {
  const t = useTranslations('assistant')
  const isRTL = locale === 'ar'

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        body: { locale },
      }),
    [locale]
  )

  const { messages, sendMessage, status, error, stop, regenerate } = useChat({
    transport,
  })

  const scrollerRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  useEffect(() => {
    if (!autoScroll) return
    const el = scrollerRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, autoScroll, status])

  const onScroll = () => {
    const el = scrollerRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setAutoScroll(distanceFromBottom < 80)
  }

  const handleSubmit = (text: string) => {
    if (!text.trim()) return
    sendMessage({ text })
  }

  const isStreaming = status === 'streaming' || status === 'submitted'
  const empty = messages.length === 0

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className="relative mx-auto flex h-full max-w-3xl flex-col"
    >
      {/* Body */}
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className={cn(
          'flex-1 overflow-y-auto',
          empty ? 'flex items-stretch' : 'px-4 pt-6 pb-2'
        )}
      >
        {empty ? (
          <EmptyState
            onPick={(prompt) => handleSubmit(prompt)}
            locale={locale}
          />
        ) : (
          <div className="space-y-6">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} locale={locale} />
            ))}
            {error && (
              <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                <div className="font-bold">{t('error_title')}</div>
                <div className="mt-0.5 opacity-80">{error.message}</div>
                <button
                  type="button"
                  onClick={() => regenerate()}
                  className="mt-2 text-xs font-bold underline"
                >
                  {t('retry')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Composer in natural flex flow — transparent wrapper, no border, soft top fade */}
      <div className="relative shrink-0 px-3 pb-3 pt-2 md:px-4 md:pb-4">
        {!empty && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-background to-transparent"
          />
        )}
        <Composer
          isStreaming={isStreaming}
          onStop={stop}
          onSubmit={handleSubmit}
        />
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
          {t('disclaimer')}
        </p>
      </div>
    </div>
  )
}
