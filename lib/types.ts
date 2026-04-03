export interface ImageEntry {
  id: string
  filename: string
  width: number
  height: number
  aspectRatio: number
  blurhash: string
  blurDataUrl: string | null
  addedAt: string
  sequenceId: string | null
}

export interface SequenceEntry {
  id: string
  coverImageId: string
  imageIds: string[]
  restImageIds?: string[]
}
