'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, BedDouble, X, Maximize2 } from 'lucide-react'

type RoomImageGalleryProps = {
  images: string[]
  name: string
  className?: string
}

export function RoomImageGallery({ images, name, className }: RoomImageGalleryProps) {
  const [current, setCurrent] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    if (!fullscreen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setFullscreen(false)
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullscreen])

  if (!images || images.length === 0) {
    return (
      <div className={cn('w-full aspect-[16/10] rounded-2xl bg-slate-100 flex items-center justify-center', className)}>
        <BedDouble className="h-16 w-16 text-slate-300" />
      </div>
    )
  }

  const prev = () => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1))
  const next = () => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1))

  return (
    <>
      <div className={cn('relative w-full aspect-[16/10] rounded-2xl overflow-hidden group', className)}>
        <button
          type="button"
          onClick={() => setFullscreen(true)}
          className="absolute inset-0 z-10 cursor-zoom-in"
          aria-label="Open fullscreen"
        />
        <img
          src={images[current]}
          alt={`${name} - ${current + 1}`}
          className="w-full h-full object-cover transition-transform duration-500 pointer-events-none"
        />

        <div className="absolute top-3 end-3 z-20 rounded-full bg-black/50 backdrop-blur-sm px-2.5 py-1 text-[11px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 pointer-events-none">
          <Maximize2 className="h-3 w-3" />
          {current + 1} / {images.length}
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prev() }}
              className="absolute start-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-lg"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); next() }}
              className="absolute end-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-lg"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="absolute bottom-3 start-1/2 -translate-x-1/2 z-20 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setCurrent(i) }}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === current ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {fullscreen && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center" onClick={() => setFullscreen(false)}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setFullscreen(false) }}
            className="absolute top-4 end-4 h-11 w-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="absolute top-4 start-1/2 -translate-x-1/2 rounded-full bg-white/15 backdrop-blur-sm px-4 py-1.5 text-sm font-semibold text-white">
            {current + 1} / {images.length}
          </div>

          <img
            src={images[current]}
            alt={`${name} - ${current + 1}`}
            className="max-w-[95vw] max-h-[85vh] object-contain select-none"
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev() }}
                className="absolute start-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
                aria-label="Previous"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next() }}
                className="absolute end-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
                aria-label="Next"
              >
                <ChevronRight className="h-7 w-7" />
              </button>

              <div className="absolute bottom-6 start-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto px-4" onClick={(e) => e.stopPropagation()}>
                {images.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrent(i)}
                    className={cn(
                      'relative h-16 w-24 shrink-0 rounded-lg overflow-hidden transition-all',
                      i === current ? 'ring-2 ring-white scale-105' : 'opacity-60 hover:opacity-100'
                    )}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
