import Image from 'next/image'
import type { ImageEntry, LayoutBlock as LayoutBlockType } from '@/lib/types'

interface Props {
  block: LayoutBlockType
  onImageClick: (img: ImageEntry) => void
}

function ImageCard({ img, onClick, sizes, priority }: {
  img: ImageEntry
  onClick: () => void
  sizes: string
  priority?: boolean
}) {
  return (
    <div
      onClick={onClick}
      className="image-mat"
      style={{ cursor: 'pointer', lineHeight: 0 }}
    >
      <Image
        src={`/images/${encodeURIComponent(img.filename)}`}
        alt=""
        width={img.width}
        height={img.height}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        placeholder={img.blurDataUrl ? 'blur' : 'empty'}
        blurDataURL={img.blurDataUrl ?? undefined}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
      />
    </div>
  )
}

export default function LayoutBlock({ block, onImageClick }: Props) {
  const { type, images } = block

  if (type === 'chapterBreak') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--block-gap) 0',
      }}>
        <div style={{
          width: 40,
          height: 1,
          background: 'var(--divider)',
        }} />
      </div>
    )
  }

  if (type === 'hero') {
    const img = images[0]
    return (
      <div style={{ padding: '0 var(--page-padding)', marginBottom: 'var(--block-gap)', lineHeight: 0, maxWidth: 1400, marginLeft: 'auto', marginRight: 'auto' }}>
        <ImageCard
          img={img}
          onClick={() => onImageClick(img)}
          sizes="(min-width: 1400px) 1400px, 100vw"
        />
      </div>
    )
  }

  if (type === 'pair') {
    const [left, right] = images
    return (
      <div className="editorial-pair">
        <div className="editorial-pair-item">
          <ImageCard
            img={left}
            onClick={() => onImageClick(left)}
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
        <div className="editorial-pair-item">
          <ImageCard
            img={right}
            onClick={() => onImageClick(right)}
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </div>
    )
  }

  if (type === 'centeredSingle') {
    const img = images[0]
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '0 var(--page-padding)',
        marginBottom: 'var(--block-gap)',
      }}>
        <div style={{ width: '60%', minWidth: 280 }}>
          <ImageCard
            img={img}
            onClick={() => onImageClick(img)}
            sizes="(max-width: 768px) 100vw, 60vw"
          />
        </div>
      </div>
    )
  }

  if (type === 'asymmetricPair') {
    const [large, small] = images
    const [first, second] = large.aspectRatio > small.aspectRatio
      ? [large, small]
      : [small, large]
    return (
      <div className="editorial-pair">
        <div className="editorial-pair-item" style={{ flex: 2 }}>
          <ImageCard
            img={first}
            onClick={() => onImageClick(first)}
            sizes="(max-width: 768px) 100vw, 66vw"
          />
        </div>
        <div className="editorial-pair-item" style={{ flex: 1 }}>
          <ImageCard
            img={second}
            onClick={() => onImageClick(second)}
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
      </div>
    )
  }

  return null
}
