'use client'
import { useState, useCallback, useMemo, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useSessionSeed } from '@/hooks/useSessionSeed'
import { seededShuffle } from '@/lib/prng'
import { buildLayout } from '@/lib/layout'
import LayoutBlockComponent from '@/components/LayoutBlock'
import Lightbox from '@/components/Lightbox'
import type { ImageEntry } from '@/lib/types'

interface Props {
  images: ImageEntry[]
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
        <LayoutBlockComponent
          key={i}
          block={block}
          onImageClick={openLightbox}
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
