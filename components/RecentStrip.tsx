'use client'
import Image from 'next/image'
import type { ImageEntry } from '@/lib/types'

interface Props {
  images: ImageEntry[]
  onSelect: (img: ImageEntry) => void
  visible: boolean
}

export default function RecentStrip({ images, onSelect, visible }: Props) {
  if (images.length === 0) return null

  return (
    <div
      role="toolbar"
      aria-label="Recently seen images"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 80,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 200ms ease-out',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflowY: 'auto',
        padding: '8px 8px',
        gap: 4,
        scrollbarWidth: 'none',
      }}
    >
      {images.map((img, i) => (
        <button
          key={`${img.id}-${i}`}
          aria-label={`Return to recently seen image`}
          onClick={() => onSelect(img)}
          style={{
            flexShrink: 0,
            width: 64,
            height: 64,
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            background: 'transparent',
            position: 'relative',
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
  )
}
