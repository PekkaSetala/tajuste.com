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

export type BlockType = 'hero' | 'pair' | 'centeredSingle' | 'asymmetricPair' | 'chapterBreak'

export interface LayoutBlock {
  type: BlockType
  images: ImageEntry[]
}
