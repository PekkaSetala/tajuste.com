'use client'
import { useSeenCounter } from '@/hooks/useSeenCounter'

// Exported so Viewer can call increment directly via ref pattern —
// instead we pass increment as prop from Viewer's own useSeenCounter instance.
export default function Counter({ count }: { count: number }) {
  return (
    <div
      aria-label={`${count} images seen`}
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        fontSize: '12px',
        color: '#555',
        fontVariantNumeric: 'tabular-nums',
        pointerEvents: 'none',
        zIndex: 10,
        userSelect: 'none',
      }}
    >
      {count || ''}
    </div>
  )
}
