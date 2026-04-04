import images from '@/data/images.json'
import EditorialScroll from '@/components/EditorialScroll'
import type { ImageEntry } from '@/lib/types'

export default function HomePage() {
  return (
    <main style={{ minHeight: '100dvh' }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '48px var(--page-padding) 40px',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 14,
          fontWeight: 400,
          letterSpacing: '0.25em',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
        }}>
          Tajuste
        </h1>
      </header>

      {/* Gallery */}
      <EditorialScroll images={images as ImageEntry[]} />

      {/* Fixed contact info */}
      <div style={{
        position: 'fixed',
        bottom: 20,
        left: 'var(--page-padding)',
        zIndex: 50,
        display: 'flex',
        gap: 16,
        fontSize: 11,
        letterSpacing: '0.05em',
        color: 'var(--text-link)',
      }}>
        <a href="mailto:tajuste@gmail.com">tajuste@gmail.com</a>
        <a href="https://instagram.com/tajustephoto" target="_blank" rel="noopener noreferrer">Instagram</a>
      </div>
    </main>
  )
}
