'use client'
import Image from 'next/image'
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSeenCounter } from '@/hooks/useSeenCounter'
import { useSessionSeed } from '@/hooks/useSessionSeed'
import { seededShuffle } from '@/lib/prng'
import Counter from '@/components/Counter'
import Filmstrip from '@/components/Filmstrip'
import type { ImageEntry } from '@/lib/types'

interface Props {
  images: ImageEntry[]
}

const DISSOLVE = { duration: 0.28, ease: [0.23, 1, 0.32, 1] as const }

export default function GalleryWall({ images }: Props) {
  const { count, increment } = useSeenCounter()
  const seed = useSessionSeed()

  // Session-shuffled image order
  const [ordered, setOrdered] = useState<ImageEntry[]>(images)
  useEffect(() => {
    if (seed === null) return
    setOrdered(seededShuffle(images, seed))
  }, [seed, images])

  // Lightbox state
  const [selected, setSelected] = useState<ImageEntry | null>(null)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [filmstripVisible, setFilmstripVisible] = useState(false)

  // Scroll position to restore when closing lightbox
  const scrollRef = useRef(0)

  const open = useCallback((img: ImageEntry) => {
    scrollRef.current = window.scrollY
    const idx = ordered.findIndex(i => i.id === img.id)
    setViewerIndex(idx)
    setSelected(img)
    increment()
    document.body.style.overflow = 'hidden'
  }, [ordered, increment])

  const close = useCallback(() => {
    setSelected(null)
    setFilmstripVisible(false)
    document.body.style.overflow = ''
    // Restore scroll after paint
    requestAnimationFrame(() => window.scrollTo(0, scrollRef.current))
  }, [])

  const goTo = useCallback((idx: number) => {
    if (idx < 0 || idx >= ordered.length) return
    setViewerIndex(idx)
    setSelected(ordered[idx])
    increment()
  }, [ordered, increment])

  const advance = useCallback(() => goTo(viewerIndex + 1), [goTo, viewerIndex])
  const back = useCallback(() => goTo(viewerIndex - 1), [goTo, viewerIndex])

  // Keyboard nav in lightbox
  useEffect(() => {
    if (!selected) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); advance() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); back() }
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selected, advance, back, close])

  // Touch swipe in lightbox
  useEffect(() => {
    if (!selected) return
    let startX = 0, startY = 0, startT = 0
    const onStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      startT = Date.now()
    }
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX
      const dy = e.changedTouches[0].clientY - startY
      const dt = Date.now() - startT
      if (Math.abs(dy) > Math.abs(dx) * 0.8) {
        // Swipe down = close
        if (dy > 60) { close(); return }
        return
      }
      const velocity = Math.abs(dx) / dt
      if (Math.abs(dx) >= 40 || velocity > 0.11) {
        if (dx < 0) advance(); else back()
      }
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchend', onEnd)
    }
  }, [selected, advance, back, close])

  // Filmstrip hover zone in lightbox
  useEffect(() => {
    if (!selected) return
    const onMove = (e: MouseEvent) => {
      const fromBottom = window.innerHeight - e.clientY
      if (fromBottom <= 40) setFilmstripVisible(true)
      else if (fromBottom > 88) setFilmstripVisible(false)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [selected])

  const currentImg = ordered[viewerIndex]

  return (
    <>
      {/* ── WALL ─────────────────────────────────────────── */}
      <div
        style={{
          columns: 'var(--wall-cols)',
          gap: '3px',
          padding: '3px',
          background: '#000',
          // CSS custom property set in globals.css via @media
        }}
      >
        {ordered.map((img) => (
          <motion.div
            key={img.id}
            layoutId={`img-${img.id}`}
            onClick={() => open(img)}
            style={{
              display: 'block',
              marginBottom: '3px',
              breakInside: 'avoid',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
            }}
            whileHover={{ opacity: 0.85 }}
            transition={{ duration: 0.2 }}
          >
            <Image
              src={`/images/${encodeURIComponent(img.filename)}`}
              alt=""
              width={img.width}
              height={img.height}
              style={{ width: '100%', height: 'auto', display: 'block' }}
              placeholder={img.blurDataUrl ? 'blur' : 'empty'}
              blurDataURL={img.blurDataUrl ?? undefined}
              sizes="(max-width: 600px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          </motion.div>
        ))}
      </div>

      {/* ── LIGHTBOX ──────────────────────────────────────── */}
      <AnimatePresence>
        {selected && currentImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: '#000',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'none',
            }}
            onClick={close}
          >
            {/* Vignette */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 78%, rgba(0,0,0,0.7) 100%)',
                pointerEvents: 'none',
                zIndex: 5,
              }}
            />

            {/* Image — expands from wall position */}
            <motion.div
              layoutId={`img-${currentImg.id}`}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              transition={DISSOLVE}
            >
              <Image
                src={`/images/${encodeURIComponent(currentImg.filename)}`}
                alt={`Image ${viewerIndex + 1}`}
                fill
                style={{ objectFit: 'contain' }}
                placeholder={currentImg.blurDataUrl ? 'blur' : 'empty'}
                blurDataURL={currentImg.blurDataUrl ?? undefined}
                priority
                sizes="100vw"
              />
            </motion.div>

            {/* Counter */}
            <div style={{ position: 'absolute', zIndex: 20, bottom: 16, right: 16, pointerEvents: 'none' }}>
              <Counter count={count} />
            </div>

            {/* Filmstrip */}
            <Filmstrip
              images={ordered}
              currentIndex={viewerIndex}
              onSelect={(i) => { setFilmstripVisible(false); goTo(i) }}
              visible={filmstripVisible}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
