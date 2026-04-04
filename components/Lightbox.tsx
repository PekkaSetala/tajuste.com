'use client'
import Image from 'next/image'
import { useEffect, useCallback, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ImageEntry } from '@/lib/types'

interface Props {
  images: ImageEntry[]
  currentIndex: number
  onNavigate: (index: number) => void
  onClose: () => void
}

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]

const controlBase: React.CSSProperties = {
  position: 'absolute',
  zIndex: 110,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  lineHeight: 1,
  transition: 'opacity 200ms ease-out',
}

export default function Lightbox({ images, currentIndex, onNavigate, onClose }: Props) {
  const img = images[currentIndex]
  const touchRef = useRef({ startX: 0, startY: 0, startT: 0 })
  const [controlsVisible, setControlsVisible] = useState(true)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isVisible = useRef(true)
  const preloaded = useRef(new Set<string>())
  const dialogRef = useRef<HTMLDivElement>(null)

  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < images.length - 1

  const advance = useCallback(() => {
    if (currentIndex < images.length - 1) onNavigate(currentIndex + 1)
  }, [currentIndex, images.length, onNavigate])

  const back = useCallback(() => {
    if (currentIndex > 0) onNavigate(currentIndex - 1)
  }, [currentIndex, onNavigate])

  // Auto-hide controls after inactivity
  const resetHideTimer = useCallback(() => {
    if (!isVisible.current) { isVisible.current = true; setControlsVisible(true) }
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => { isVisible.current = false; setControlsVisible(false) }, 3000)
  }, [])

  useEffect(() => {
    resetHideTimer()
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current) }
  }, [currentIndex, resetHideTimer])

  useEffect(() => {
    window.addEventListener('mousemove', resetHideTimer)
    return () => window.removeEventListener('mousemove', resetHideTimer)
  }, [resetHideTimer])

  // Keyboard navigation + focus trap (single listener)
  useEffect(() => {
    const dialog = dialogRef.current
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); advance() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); back() }
      else if (e.key === 'Escape') onClose()
      else if (e.key === 'Tab' && dialog) {
        const focusable = dialog.querySelectorAll<HTMLElement>('button:not([disabled])')
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [advance, back, onClose])

  // Focus close button on mount, restore on unmount
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const previouslyFocused = document.activeElement as HTMLElement
    const closeBtn = dialog.querySelector<HTMLButtonElement>('button[aria-label="Close lightbox"]')
    closeBtn?.focus()
    return () => { previouslyFocused?.focus?.() }
  }, [])

  // Touch swipe
  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      touchRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        startT: Date.now(),
      }
    }
    const onEnd = (e: TouchEvent) => {
      const { startX, startY, startT } = touchRef.current
      const dx = e.changedTouches[0].clientX - startX
      const dy = e.changedTouches[0].clientY - startY
      const dt = Date.now() - startT
      if (Math.abs(dy) > Math.abs(dx) * 0.8 && dy > 60) {
        onClose()
        return
      }
      const velocity = Math.abs(dx) / dt
      if (Math.abs(dx) >= 40 || velocity > 0.11) {
        if (dx < 0) advance()
        else back()
      }
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchend', onEnd)
    }
  }, [advance, back, onClose])

  // Preload adjacent images (deduplicated)
  useEffect(() => {
    const connection = (navigator as any).connection
    if (connection?.saveData || connection?.effectiveType === 'slow-2g') return

    const toPreload = [currentIndex - 1, currentIndex + 1]
      .filter(i => i >= 0 && i < images.length)

    toPreload.forEach(i => {
      const src = `/images/${encodeURIComponent(images[i].filename)}`
      if (preloaded.current.has(src)) return
      preloaded.current.add(src)
      const preImg = new window.Image()
      preImg.src = src
    })
  }, [currentIndex, images])

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    const x = e.clientX / window.innerWidth
    if (x < 0.3) back()
    else if (x > 0.7) advance()
    else onClose()
  }

  if (!img) return null

  const controlOpacity = controlsVisible ? 1 : 0

  return (
    <motion.div
      ref={dialogRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: EASE_OUT }}
      onClick={handleClick}
      role="dialog"
      aria-label={`Image ${currentIndex + 1} of ${images.length}`}
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose() }}
        aria-label="Close lightbox"
        style={{ ...controlBase, top: 16, right: 16, color: 'rgba(255,255,255,0.7)', fontSize: 28, padding: '8px 12px', opacity: controlOpacity }}
      >
        ✕
      </button>

      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); back() }}
          aria-label="Previous image"
          style={{ ...controlBase, left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', fontSize: 32, padding: '16px 12px', opacity: controlOpacity }}
        >
          ‹
        </button>
      )}

      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); advance() }}
          aria-label="Next image"
          style={{ ...controlBase, right: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', fontSize: 32, padding: '16px 12px', opacity: controlOpacity }}
        >
          ›
        </button>
      )}

      <div
        style={{
          ...controlBase,
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.5)',
          fontSize: 12,
          letterSpacing: '0.1em',
          fontFamily: 'var(--font-sans)',
          opacity: controlOpacity,
        }}
      >
        {currentIndex + 1} / {images.length}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={img.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
          }}
        >
          <Image
            src={`/images/${encodeURIComponent(img.filename)}`}
            alt=""
            fill
            style={{ objectFit: 'contain', padding: 24 }}
            placeholder={img.blurDataUrl ? 'blur' : 'empty'}
            blurDataURL={img.blurDataUrl ?? undefined}
            priority
            sizes="100vw"
          />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
