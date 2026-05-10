'use client'

import { useTranslations } from 'next-intl'
import { Globe, ExternalLink } from 'lucide-react'

export function WebCitations({
  data,
}: {
  data: {
    query: string
    answer: string
    sources: Array<{ url?: string; title?: string }>
    error?: string
  }
  locale?: string
}) {
  const t = useTranslations('assistant.web')

  if (data.error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
        {data.error}
      </div>
    )
  }

  return (
    <div className="space-y-2 rounded-xl border border-border bg-surface p-3">
      {data.answer && (
        <p className="text-sm leading-6 text-foreground">{data.answer}</p>
      )}
      {data.sources?.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase text-muted-foreground">
            {t('sources')}
          </div>
          <ul className="space-y-1">
            {data.sources.map((s, i) => (
              <li key={i}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <Globe className="h-3 w-3" />
                  <span className="line-clamp-1">
                    {s.title || s.url}
                  </span>
                  <ExternalLink className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
