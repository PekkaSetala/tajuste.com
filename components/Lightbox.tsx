'use client'
import Image from 'next/image'
import { useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ImageEntry } from '@/lib/types'

interface Props {
  images: ImageEntry[]
  currentIndex: number
  onNavigate: (index: number) => void
  onClose: () => void
}

export default function Lightbox({ images, currentIndex, onNavigate, onClose }: Props) {
  const img = images[currentIndex]
  const touchRef = useRef({ startX: 0, startY: 0, startT: 0 })

  const advance = useCallback(() => {
    if (currentIndex < images.length - 1) onNavigate(currentIndex + 1)
  }, [currentIndex, images.length, onNavigate])

  const back = useCallback(() => {
    if (currentIndex > 0) onNavigate(currentIndex - 1)
  }, [currentIndex, onNavigate])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); advance() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); back() }
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [advance, back, onClose])

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
      // Swipe down to close
      if (Math.abs(dy) > Math.abs(dx) * 0.8 && dy > 60) {
        onClose()
        return
      }
      // Horizontal swipe
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

  // Preload adjacent images
  useEffect(() => {
    const connection = (navigator as any).connection
    if (connection?.saveData || connection?.effectiveType === 'slow-2g') return

    const toPreload = [currentIndex - 1, currentIndex + 1]
      .filter(i => i >= 0 && i < images.length)

    toPreload.forEach(i => {
      const preImg = new window.Image()
      preImg.src = `/images/${encodeURIComponent(images[i].filename)}`
    })
  }, [currentIndex, images])

  // Click left/right halves to navigate
  const handleClick = (e: React.MouseEvent) => {
    const x = e.clientX / window.innerWidth
    if (x < 0.3) back()
    else if (x > 0.7) advance()
    else onClose()
  }

  if (!img) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={handleClick}
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
      <AnimatePresence mode="wait">
        <motion.div
          key={img.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
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
