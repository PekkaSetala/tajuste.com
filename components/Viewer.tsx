'use client'
import Image from 'next/image'
import { useEffect, useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSessionSeed } from '@/hooks/useSessionSeed'
import { useSeenCounter } from '@/hooks/useSeenCounter'
import { seededShuffle } from '@/lib/prng'
import Filmstrip from '@/components/Filmstrip'
import RecentStrip from '@/components/RecentStrip'
import Counter from '@/components/Counter'
import type { ImageEntry } from '@/lib/types'

interface Props {
  sequenceId: string
  images: ImageEntry[]
  restSet: string[]
}

const DISSOLVE_DURATION = 0.28
const DISSOLVE_EASE = [0.23, 1, 0.32, 1] as const
const REST_EXTRA_MS = 400

function prefersReducedMotion() {
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function Viewer({ sequenceId, images, restSet }: Props) {
  const seed = useSessionSeed()
  const { count, increment } = useSeenCounter()

  const [shuffled, setShuffled] = useState<ImageEntry[]>(images)
  useEffect(() => {
    if (seed === null) return
    setShuffled(seededShuffle(images, seed))
  }, [seed, images])

  const [index, setIndex] = useState(0)
  const [sequenceEnded, setSequenceEnded] = useState(false)
  const [transitioning, setTransitioning] = useState(false)

  const [filmstripVisible, setFilmstripVisible] = useState(false)
  const [recentVisible, setRecentVisible] = useState(false)
  const [recentImages, setRecentImages] = useState<ImageEntry[]>([])

  // Custom cursor
  const [cursor, setCursor] = useState({ x: -100, y: -100, visible: false, clicking: false })
  const cursorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const mainDimmed = filmstripVisible || recentVisible
  const restSetRef = useRef(new Set(restSet))

  // Preload
  const preload = useCallback((idx: number, imgs: ImageEntry[]) => {
    const slow = (navigator as Navigator & { connection?: { effectiveType?: string } })
      .connection?.effectiveType
    if (slow === 'slow-2g' || slow === '2g') return
    const isMobile = window.innerWidth < 768
    const ahead = isMobile ? 1 : 2
    for (let i = 1; i <= ahead; i++) {
      if (idx + i < imgs.length) {
        const img = new window.Image()
        img.src = `/images/${encodeURIComponent(imgs[idx + i].filename)}`
      }
    }
    if (idx - 1 >= 0) {
      const img = new window.Image()
      img.src = `/images/${encodeURIComponent(imgs[idx - 1].filename)}`
    }
  }, [])

  const goTo = useCallback(async (next: number) => {
    if (transitioning) return
    setTransitioning(true)

    const current = shuffled[index]
    const isRestBefore = restSetRef.current.has(current?.id ?? '')
    const nextImg = shuffled[next]
    const isRestAfter = nextImg && restSetRef.current.has(nextImg.id)

    if (isRestBefore || isRestAfter) {
      await new Promise(r => setTimeout(r, REST_EXTRA_MS))
    }

    if (next >= shuffled.length) {
      setSequenceEnded(true)
      setTransitioning(false)
      return
    }

    setIndex(next)
    increment()
    preload(next, shuffled)

    setRecentImages(prev => {
      const entry = current
      if (!entry) return prev
      const filtered = prev.filter(r => r.id !== entry.id)
      return [entry, ...filtered].slice(0, 20)
    })

    setTransitioning(false)
  }, [transitioning, shuffled, index, increment, preload])

  const advance = useCallback(() => goTo(index + 1), [goTo, index])
  const back = useCallback(() => { if (index > 0) goTo(index - 1) }, [goTo, index])

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); advance() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); back() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [advance, back])

  // Touch swipe
  useEffect(() => {
    let startX = 0, startY = 0, startT = 0, dragging = false
    const onStart = (e: TouchEvent) => {
      if (e.touches.length > 1) return
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      startT = Date.now()
      dragging = true
    }
    const onEnd = (e: TouchEvent) => {
      if (!dragging) return
      dragging = false
      const dx = e.changedTouches[0].clientX - startX
      const dy = e.changedTouches[0].clientY - startY
      const dt = Date.now() - startT
      if (Math.abs(dy) > Math.abs(dx) * 0.8) return
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
  }, [advance, back])

  // Desktop filmstrip + recent strip hover zones
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const fromBottom = window.innerHeight - e.clientY
      const fromRight = window.innerWidth - e.clientX
      if (fromBottom <= 40) setFilmstripVisible(true)
      else if (fromBottom > 88) setFilmstripVisible(false)
      if (fromRight <= 40) setRecentVisible(true)
      else if (fromRight > 88) setRecentVisible(false)

      // Custom cursor
      setCursor(prev => ({ ...prev, x: e.clientX, y: e.clientY, visible: true }))
    }
    const onLeave = () => setCursor(prev => ({ ...prev, visible: false }))
    window.addEventListener('mousemove', onMove)
    document.documentElement.addEventListener('mouseleave', onLeave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      document.documentElement.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  // Mobile filmstrip drag-up
  useEffect(() => {
    let startY = 0, startX = 0, active = false
    const onStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (window.innerHeight - touch.clientY > 60) return
      startY = touch.clientY
      startX = touch.clientX
      active = true
    }
    const onMove = (e: TouchEvent) => {
      if (!active) return
      const dy = startY - e.touches[0].clientY
      const dx = Math.abs(e.touches[0].clientX - startX)
      if (dy > 20 && dy > dx) {
        e.preventDefault()
        setFilmstripVisible(true)
      }
    }
    const onEnd = () => { active = false }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
  }, [])

  // Click flash on custom cursor
  const handleClick = useCallback(() => {
    setCursor(prev => ({ ...prev, clicking: true }))
    if (cursorTimerRef.current) clearTimeout(cursorTimerRef.current)
    cursorTimerRef.current = setTimeout(() => {
      setCursor(prev => ({ ...prev, clicking: false }))
    }, 150)
  }, [])

  useEffect(() => {
    if (shuffled.length > 0) increment()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (shuffled.length > 0) preload(0, shuffled)
  }, [shuffled, preload])

  const current = shuffled[index]
  if (!current) return null

  const reduced = prefersReducedMotion()

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        overflow: 'hidden',
        cursor: 'none',
      }}
      aria-label="Image viewer"
      onClick={handleClick}
    >
      {/* Main image */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: mainDimmed ? 0.4 : 1,
          transition: 'opacity 200ms ease',
        }}
      >
        <AnimatePresence mode="wait">
          {!sequenceEnded && (
            <motion.div
              key={current.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: reduced ? DISSOLVE_DURATION * 0.5 : DISSOLVE_DURATION,
                ease: DISSOLVE_EASE,
                // 80ms darkness before image arrives
                delay: reduced ? 0 : 0.08,
              }}
              style={{ position: 'absolute', inset: 0 }}
            >
              <Image
                src={`/images/${encodeURIComponent(current.filename)}`}
                alt={`Image ${index + 1}`}
                fill
                style={{ objectFit: 'contain' }}
                placeholder={current.blurDataUrl ? 'blur' : 'empty'}
                blurDataURL={current.blurDataUrl ?? undefined}
                priority={index === 0}
                sizes="100vw"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Vignette overlay — darkens the room around the image */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.3) 78%, rgba(0,0,0,0.65) 100%)',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      />

      {/* Sequence end */}
      <AnimatePresence>
        {sequenceEnded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.14 : 0.28, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
            onClick={() => window.history.back()}
          >
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                delay: reduced ? 0 : 1.2,
                duration: reduced ? 0.14 : 0.28,
              }}
              style={{
                fontSize: '14px',
                fontWeight: 300,
                letterSpacing: '0.2em',
                color: '#555',
              }}
            >
              TAJUSTE
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Counter */}
      <Counter count={count} />

      {/* Filmstrip */}
      <Filmstrip
        images={shuffled}
        currentIndex={index}
        onSelect={(i) => { setFilmstripVisible(false); goTo(i) }}
        visible={filmstripVisible}
      />

      {/* Recent strip */}
      <RecentStrip
        images={recentImages}
        onSelect={(img) => {
          setRecentVisible(false)
          const idx = shuffled.findIndex(s => s.id === img.id)
          if (idx >= 0) goTo(idx)
        }}
        visible={recentVisible}
      />

      {/* Custom cursor — small circle, 80ms lag, flashes on click */}
      {cursor.visible && (
        <div
          aria-hidden
          style={{
            position: 'fixed',
            left: cursor.x - 3,
            top: cursor.y - 3,
            width: 6,
            height: 6,
            borderRadius: '50%',
            border: `1px solid ${cursor.clicking ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)'}`,
            background: cursor.clicking ? 'rgba(255,255,255,0.8)' : 'transparent',
            transition: 'left 80ms ease-out, top 80ms ease-out, border-color 150ms, background 150ms',
            pointerEvents: 'none',
            zIndex: 50,
          }}
        />
      )}
    </div>
  )
}
