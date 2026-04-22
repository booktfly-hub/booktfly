'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Check, Camera, Loader2, ImageIcon } from 'lucide-react'

type Props = {
  onChange?: (dataUrl: string | null) => void
  disabled?: boolean
  height?: number
  className?: string
}

const MAX_UPLOAD_WIDTH = 1400
const UPLOAD_JPEG_QUALITY = 0.82

async function compressImageToDataUrl(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('read failed'))
    reader.readAsDataURL(file)
  })
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error('image load failed'))
    el.src = dataUrl
  })
  const scale = Math.min(1, MAX_UPLOAD_WIDTH / img.naturalWidth)
  const w = Math.round(img.naturalWidth * scale)
  const h = Math.round(img.naturalHeight * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no 2d ctx')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', UPLOAD_JPEG_QUALITY)
}

export function SignaturePad({ onChange, disabled, height = 220, className }: Props) {
  const t = useTranslations()
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File | null | undefined) => {
    if (!file) return
    setProcessing(true)
    try {
      const jpeg = await compressImageToDataUrl(file)
      setUploadedPreview(jpeg)
      onChange?.(jpeg)
    } catch {
      onChange?.(null)
    } finally {
      setProcessing(false)
    }
  }

  const replacePhoto = () => {
    setUploadedPreview(null)
    onChange?.(null)
    fileInputRef.current?.click()
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border-2 border-dashed transition-all',
          uploadedPreview ? 'border-primary bg-slate-50' : 'border-slate-300 bg-white',
          disabled && 'opacity-60'
        )}
        style={{ minHeight: height }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          disabled={disabled || processing}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {uploadedPreview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={uploadedPreview}
              alt="Signature"
              className="block w-full h-auto max-h-80 object-contain bg-white"
            />
            <div className="pointer-events-none absolute top-2 end-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <Check className="h-3 w-3" />
              {t('signature.captured')}
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || processing}
            className="flex w-full flex-col items-center justify-center gap-3 px-6 py-8 text-center disabled:cursor-not-allowed"
            style={{ minHeight: height }}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {processing ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImageIcon className="h-6 w-6" />}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900">
                {processing ? t('signature.processing') : t('signature.upload_cta')}
              </p>
              <p className="text-xs text-slate-500 max-w-xs">
                {t('signature.upload_hint')}
              </p>
            </div>
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{t('signature.upload_hint')}</p>
        {uploadedPreview && (
          <button
            type="button"
            onClick={replacePhoto}
            disabled={disabled || processing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Camera className="h-3.5 w-3.5" />
            {t('signature.replace_photo')}
          </button>
        )}
      </div>
    </div>
  )
}
