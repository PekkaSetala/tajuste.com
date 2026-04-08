'use client'
import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useSessionSeed } from '@/hooks/useSessionSeed'
import { seededShuffle } from '@/lib/prng'
import { buildLayout } from '@/lib/layout'
import LayoutBlockComponent from '@/components/LayoutBlock'
import Lightbox from '@/components/Lightbox'
import type { ImageEntry, LayoutBlock } from '@/lib/types'

interface Props {
  images: ImageEntry[]
}

// Render blocks only when near the viewport
function LazyBlock({ block, onImageClick, eager }: {
  block: LayoutBlock
  onImageClick: (img: ImageEntry) => void
  eager: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(eager)

  useEffect(() => {
    if (eager || visible) return
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { rootMargin: '600px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [eager, visible])

  if (visible) {
    return <LayoutBlockComponent block={block} onImageClick={onImageClick} />
  }

  // Placeholder with estimated height to prevent layout shift
  const estimatedHeight = block.type === 'chapterBreak' ? 80
    : block.type === 'hero' ? 600
    : block.type === 'pair' || block.type === 'asymmetricPair' ? 500
    : 400
  return <div ref={ref} style={{ minHeight: estimatedHeight }} />
}

export default function EditorialScroll({ images }: Props) {
  const seed = useSessionSeed()
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const scrollRef = useRef(0)

  // Render with original order immediately, shuffle once seed resolves
  const shuffled = useMemo(() => {
    if (seed === null) return images
    return seededShuffle(images, seed)
  }, [seed, images])

  const blocks = useMemo(() => buildLayout(shuffled), [shuffled])

  const flatImages = useMemo(() => {
    return blocks.flatMap(b => b.images)
  }, [blocks])

  const openLightbox = useCallback((img: ImageEntry) => {
    scrollRef.current = window.scrollY
    const idx = flatImages.findIndex(i => i.id === img.id)
    setLightboxIndex(idx)
    document.body.style.overflow = 'hidden'
  }, [flatImages])

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null)
    document.body.style.overflow = ''
    requestAnimationFrame(() => window.scrollTo(0, scrollRef.current))
  }, [])

  return (
    <>
      {blocks.map((block, i) => (
        <LazyBlock
          key={i}
          block={block}
          onImageClick={openLightbox}
          eager={i < 4}
        />
      ))}

      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            images={flatImages}
            currentIndex={lightboxIndex}
            onNavigate={setLightboxIndex}
            onClose={closeLightbox}
          />
        )}
      </AnimatePresence>
    </>
  )
}
