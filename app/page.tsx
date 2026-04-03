import images from '@/data/images.json'
import GalleryWall from '@/components/GalleryWall'
import type { ImageEntry } from '@/lib/types'

export default function HomePage() {
  return (
    <main style={{ background: '#000', minHeight: '100dvh' }}>
      <GalleryWall images={images as ImageEntry[]} />
    </main>
  )
}
