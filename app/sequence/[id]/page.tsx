import { notFound } from 'next/navigation'
import sequences from '@/data/sequences.json'
import images from '@/data/images.json'
import Viewer from '@/components/Viewer'
import type { ImageEntry, SequenceEntry } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export function generateStaticParams() {
  return (sequences as SequenceEntry[]).map(seq => ({ id: seq.id }))
}

export default async function SequencePage({ params }: Props) {
  const { id } = await params
  const seqs = sequences as SequenceEntry[]
  const imgs = images as ImageEntry[]

  const seq = seqs.find(s => s.id === id)
  if (!seq) notFound()

  const imageMap = Object.fromEntries(imgs.map(img => [img.id, img]))
  const seqImages = seq.imageIds
    .map(imgId => imageMap[imgId])
    .filter(Boolean) as ImageEntry[]

  const restSet = new Set(seq.restImageIds ?? [])

  return (
    <Viewer
      sequenceId={seq.id}
      images={seqImages}
      restSet={Array.from(restSet)}
    />
  )
}
