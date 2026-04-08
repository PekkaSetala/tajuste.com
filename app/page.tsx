import bwImages from '@/data/images.json'
import colorImages from '@/data/images-color.json'
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
      <EditorialScroll
        bwImages={bwImages as ImageEntry[]}
        colorImages={colorImages as ImageEntry[]}
      />

      {/* End of gallery */}
      <footer style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '64px var(--page-padding) 80px',
      }}>
        <div style={{
          width: 40,
          height: 1,
          background: 'var(--divider)',
        }} />
        <span style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 12,
          letterSpacing: '0.2em',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          marginTop: 16,
        }}>
          Tajuste
        </span>
      </footer>

    </main>
  )
}
