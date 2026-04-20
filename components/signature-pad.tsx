'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Eraser, Check } from 'lucide-react'

type Props = {
  onChange?: (dataUrl: string | null) => void
  disabled?: boolean
  height?: number
  className?: string
}

export function SignaturePad({ onChange, disabled, height = 180, className }: Props) {
  const t = useTranslations()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const [hasInk, setHasInk] = useState(false)

  // Size canvas for device pixel ratio
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(dpr, dpr)
        ctx.lineWidth = 2.2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.strokeStyle = '#0f172a'
      }
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return
    e.preventDefault()
    ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
    drawingRef.current = true
    lastPointRef.current = getPoint(e)
  }

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || disabled) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const last = lastPointRef.current
    if (!canvas || !ctx || !last) return
    const p = getPoint(e)
    ctx.beginPath()
    ctx.moveTo(last.x, last.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    lastPointRef.current = p
    if (!hasInk) setHasInk(true)
  }

  const endDraw = () => {
    drawingRef.current = false
    lastPointRef.current = null
    const canvas = canvasRef.current
    if (canvas && hasInk) {
      onChange?.(canvas.toDataURL('image/png'))
    }
  }

  const clear = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasInk(false)
    onChange?.(null)
  }, [onChange])

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn(
          'relative rounded-xl border-2 border-dashed bg-white transition-all',
          hasInk ? 'border-primary' : 'border-slate-300',
          disabled && 'opacity-60'
        )}
        style={{ height }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={startDraw}
          onPointerMove={draw}
          onPointerUp={endDraw}
          onPointerLeave={endDraw}
          onPointerCancel={endDraw}
          className="w-full h-full touch-none cursor-crosshair rounded-xl"
          aria-label={t('signature.canvas_aria') || 'Signature pad'}
        />
        {!hasInk && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-medium text-slate-400">
            {t('signature.placeholder')}
          </div>
        )}
        {hasInk && (
          <div className="pointer-events-none absolute top-2 end-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <Check className="h-3 w-3" />
            {t('signature.captured')}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{t('signature.hint')}</p>
        <button
          type="button"
          onClick={clear}
          disabled={disabled || !hasInk}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Eraser className="h-3.5 w-3.5" />
          {t('signature.clear')}
        </button>
      </div>
    </div>
  )
}
