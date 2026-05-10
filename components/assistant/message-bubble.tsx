'use client'

import type { UIMessage } from 'ai'
import { Sparkles, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ToolStatus, type ToolPhase, MessageSkeleton } from './tool-status'
import { Markdown } from './markdown'
import { FlightResults } from './generative/flight-results'
import { HotelResults } from './generative/hotel-results'
import { ComparisonTable } from './generative/comparison-table'
import { WebCitations } from './generative/web-citations'

export function MessageBubble({
  message,
  locale,
}: {
  message: UIMessage
  locale: string
}) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-muted text-foreground' : 'bg-primary/10 text-primary'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>

      <div className={cn('min-w-0 flex-1 space-y-4', isUser && 'flex flex-col items-end')}>
        {message.parts.map((part, i) => {
          // Text parts
          if (part.type === 'text') {
            if (isUser) {
              return (
                <div
                  key={i}
                  className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl bg-primary px-4 py-2.5 text-[15px] leading-6 text-primary-foreground"
                >
                  {part.text}
                </div>
              )
            }
            return (
              <div key={i} className="px-1 pt-1">
                <Markdown text={part.text} />
              </div>
            )
          }

          // Reasoning (model's chain-of-thought, when exposed)
          if (part.type === 'reasoning') {
            return (
              <details
                key={i}
                className="text-xs text-muted-foreground"
              >
                <summary className="cursor-pointer select-none font-bold">
                  {locale === 'ar' ? 'التفكير' : locale === 'tr' ? 'Düşünme' : 'Reasoning'}
                </summary>
                <div className="mt-1 whitespace-pre-wrap rounded-md bg-muted/40 p-2">
                  {(part as { text: string }).text}
                </div>
              </details>
            )
          }

          // Tool parts: type === `tool-<toolName>`
          if (part.type.startsWith('tool-')) {
            const toolName = part.type.slice('tool-'.length)
            const tp = part as unknown as {
              state: ToolPhase
              input?: Record<string, unknown>
              output?: unknown
              errorText?: string
            }

            return (
              <div key={i} className="space-y-2">
                <ToolStatus
                  toolName={toolName}
                  phase={tp.state}
                  query={tp.input}
                />

                {tp.state === 'output-available' && (
                  <ToolOutput
                    toolName={toolName}
                    output={tp.output}
                    locale={locale}
                  />
                )}

                {tp.state === 'output-error' && tp.errorText && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                    {tp.errorText}
                  </div>
                )}

                {tp.state === 'input-streaming' && <MessageSkeleton />}
              </div>
            )
          }

          return null
        })}
      </div>
    </div>
  )
}

function ToolOutput({
  toolName,
  output,
  locale,
}: {
  toolName: string
  output: unknown
  locale: string
}) {
  if (!output || typeof output !== 'object') return null

  if (toolName === 'searchFlights') {
    return <FlightResults data={output as Parameters<typeof FlightResults>[0]['data']} locale={locale} />
  }
  if (toolName === 'searchHotels') {
    return <HotelResults data={output as Parameters<typeof HotelResults>[0]['data']} locale={locale} />
  }
  if (toolName === 'compareHotels') {
    return <ComparisonTable data={output as Parameters<typeof ComparisonTable>[0]['data']} locale={locale} />
  }
  if (toolName === 'webSearch') {
    return <WebCitations data={output as Parameters<typeof WebCitations>[0]['data']} locale={locale} />
  }
  return null
}
