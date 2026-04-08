'use client'
import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useSessionSeed } from '@/hooks/useSessionSeed'
import { seededShuffle } from '@/lib/prng'
import { buildLayout } from '@/lib/layout'
import LayoutBlockComponent from '@/components/LayoutBlock'
import Lightbox from '@/components/Lightbox'
import ModeToggle from '@/components/ModeToggle'
import type { ImageEntry, LayoutBlock } from '@/lib/types'

interface Props {
  bwImages: ImageEntry[]
  colorImages: ImageEntry[]
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

// Render blocks only when near the viewport
function LazyBlock({ block, onImageClick, eager, imagePrefix }: {
  block: LayoutBlock
  onImageClick: (img: ImageEntry) => void
  eager: boolean
  imagePrefix: string
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
    return <LayoutBlockComponent block={block} onImageClick={onImageClick} imagePrefix={imagePrefix} />
  }

  // Placeholder with estimated height to prevent layout shift
  const estimatedHeight = block.type === 'chapterBreak' ? 80
    : block.type === 'hero' ? 600
    : block.type === 'pair' || block.type === 'asymmetricPair' ? 500
    : 400
  return <div ref={ref} style={{ minHeight: estimatedHeight }} />
}

function updateUrl(mode: 'bw' | 'color') {
  const hash = window.location.hash
  const search = mode === 'color' ? '?mode=color' : ''
  window.history.replaceState(null, '', window.location.pathname + search + hash)
}

export default function EditorialScroll({ bwImages, colorImages }: Props) {
  const seed = useSessionSeed()
  const [mode, setMode] = useState<'bw' | 'color'>('bw')
  const [isAnimating, setIsAnimating] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const scrollRef = useRef(0)
  const streamRef = useRef<HTMLDivElement>(null)

  // Read initial mode from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('mode') === 'color') setMode('color')
  }, [])

  // Sync data-mode attribute on <html>
  useEffect(() => {
    document.documentElement.dataset.mode = mode
  }, [mode])

  const images = mode === 'color' ? colorImages : bwImages
  const imagePrefix = mode === 'color' ? '/images-color' : '/images'

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

  const handleToggle = useCallback(async () => {
    if (isAnimating) return
    const next = mode === 'bw' ? 'color' : 'bw'
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced) {
      setMode(next)
      document.documentElement.dataset.mode = next
      window.scrollTo(0, 0)
      updateUrl(next)
      return
    }

    const container = streamRef.current
    if (!container) return

    setIsAnimating(true)

    // Phase 1: fade out (200ms)
    container.style.transition = 'opacity 200ms cubic-bezier(0.23,1,0.32,1), filter 200ms cubic-bezier(0.23,1,0.32,1)'
    container.style.opacity = '0'
    container.style.filter = 'blur(4px)'

    await sleep(200)

    // Swap at invisible point
    setMode(next)
    document.documentElement.dataset.mode = next
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    updateUrl(next)
    container.style.transform = 'scale(0.99)'

    // Phase 2: fade in (300ms, next frame after React render)
    requestAnimationFrame(() => {
      container.style.transition = 'opacity 300ms cubic-bezier(0.23,1,0.32,1), filter 300ms cubic-bezier(0.23,1,0.32,1), transform 300ms cubic-bezier(0.23,1,0.32,1)'
      container.style.opacity = '1'
      container.style.filter = 'blur(0px)'
      container.style.transform = 'scale(1)'

      setTimeout(() => {
        setIsAnimating(false)
        // Clear inline styles so CSS takes over
        container.style.transition = ''
        container.style.opacity = ''
        container.style.filter = ''
        container.style.transform = ''
      }, 300)
    })
  }, [mode, isAnimating])

  return (
    <>
      <div ref={streamRef}>
        {blocks.map((block, i) => (
          <LazyBlock
            key={`${mode}-${i}`}
            block={block}
            onImageClick={openLightbox}
            eager={i < 4}
            imagePrefix={imagePrefix}
          />
        ))}
      </div>

      <div className="bottom-bar">
        <a href="mailto:tajuste@gmail.com">e-mail</a>
        <div className="bar-divider" />
        <a href="https://instagram.com/tajustephoto" target="_blank" rel="noopener noreferrer">instagram</a>
        <div className="bar-divider" />
        <ModeToggle mode={mode} onToggle={handleToggle} disabled={isAnimating} />
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            images={flatImages}
            currentIndex={lightboxIndex}
            onNavigate={setLightboxIndex}
            onClose={closeLightbox}
            imagePrefix={imagePrefix}
          />
        )}
      </AnimatePresence>
    </>
  )
}
