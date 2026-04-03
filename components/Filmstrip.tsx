'use client'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import type { ImageEntry } from '@/lib/types'

interface Props {
  images: ImageEntry[]
  currentIndex: number
  onSelect: (index: number) => void
  visible: boolean
}

export default function Filmstrip({ images, currentIndex, onSelect, visible }: Props) {
  const stripRef = useRef<HTMLDivElement>(null)

  // Scroll active thumbnail into view when visible
  useEffect(() => {
    if (!visible || !stripRef.current) return
    const thumb = stripRef.current.querySelector(`[data-idx="${currentIndex}"]`) as HTMLElement
    if (thumb) thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [visible, currentIndex])

  return (
    <div
      role="toolbar"
      aria-label="Image filmstrip"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 200ms ease-out',
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        ref={stripRef}
        className="filmstrip-scroll"
        style={{
          display: 'flex',
          gap: 4,
          overflowX: 'auto',
          height: '100%',
          padding: '8px 8px',
          scrollbarWidth: 'none',
          // WebKit scrollbar hidden via globals.css .filmstrip-scroll::-webkit-scrollbar
        }}
      >
        {images.map((img, i) => (
          <button
            key={img.id}
            data-idx={i}
            aria-label={`Go to image ${i + 1}`}
            onClick={() => onSelect(i)}
            style={{
              flexShrink: 0,
              width: 64,
              height: 64,
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              background: 'transparent',
              position: 'relative',
              outline: i === currentIndex ? '1px solid rgba(255,255,255,0.4)' : 'none',
              outlineOffset: 0,
            }}
          >
            <Image
              src={`/images/${encodeURIComponent(img.filename)}`}
              alt=""
              fill
              style={{ objectFit: 'cover' }}
              sizes="64px"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
