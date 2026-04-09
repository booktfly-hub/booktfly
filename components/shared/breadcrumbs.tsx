'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { ChevronRight, ChevronLeft, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const Chevron = isAr ? ChevronLeft : ChevronRight

  return (
    <nav aria-label="Breadcrumb" className={cn('mb-4', className)}>
      <ol className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
        <li>
          <Link
            href={`/${locale}`}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Home className="h-3 w-3" />
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1.5">
            <Chevron className="h-3 w-3" />
            {item.href ? (
              <Link href={item.href} className="hover:text-foreground transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
