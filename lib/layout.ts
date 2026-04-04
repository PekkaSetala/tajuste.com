import type { ImageEntry, LayoutBlock, BlockType } from './types'

// Aspect ratio thresholds
const LANDSCAPE_THRESHOLD = 1.4 // wider than 1.4:1 -> hero candidate
const PORTRAIT_THRESHOLD = 0.85 // taller than 1:0.85 -> portrait (pair candidate)
// Between 0.85 and 1.4 -> square-ish (centered single candidate)

type ImageClass = 'landscape' | 'portrait' | 'square'

function classify(img: ImageEntry): ImageClass {
  if (img.aspectRatio > LANDSCAPE_THRESHOLD) return 'landscape'
  if (img.aspectRatio < PORTRAIT_THRESHOLD) return 'portrait'
  return 'square'
}

const CHAPTER_MIN = 8
const CHAPTER_MAX = 12

export function buildLayout(images: ImageEntry[]): LayoutBlock[] {
  const blocks: LayoutBlock[] = []
  let lastType: BlockType | null = null
  let imagesSinceBreak = 0
  let i = 0

  while (i < images.length) {
    // Insert chapter break at interval
    if (
      imagesSinceBreak >= CHAPTER_MIN &&
      imagesSinceBreak <= CHAPTER_MAX &&
      lastType !== 'chapterBreak'
    ) {
      blocks.push({ type: 'chapterBreak', images: [] })
      lastType = 'chapterBreak'
      imagesSinceBreak = 0
      continue
    }

    // Force break if we hit max without one
    if (imagesSinceBreak > CHAPTER_MAX && lastType !== 'chapterBreak') {
      blocks.push({ type: 'chapterBreak', images: [] })
      lastType = 'chapterBreak'
      imagesSinceBreak = 0
      continue
    }

    const current = images[i]
    const next = i + 1 < images.length ? images[i + 1] : null
    const currentClass = classify(current)
    const nextClass = next ? classify(next) : null

    let chosen: BlockType | null = null

    // Try pair: two consecutive portraits
    if (currentClass === 'portrait' && nextClass === 'portrait' && lastType !== 'pair') {
      chosen = 'pair'
    }
    // Try asymmetric: landscape + portrait or portrait + landscape
    else if (
      next &&
      ((currentClass === 'landscape' && nextClass === 'portrait') ||
        (currentClass === 'portrait' && nextClass === 'landscape')) &&
      lastType !== 'asymmetricPair'
    ) {
      chosen = 'asymmetricPair'
    }
    // Try hero: landscape
    else if (currentClass === 'landscape' && lastType !== 'hero') {
      chosen = 'hero'
    }
    // Try centered single: square-ish
    else if (currentClass === 'square' && lastType !== 'centeredSingle') {
      chosen = 'centeredSingle'
    }

    // Fallback: if rhythm rule blocked preferred type, pick any allowed type
    if (!chosen) {
      if (lastType !== 'hero' && currentClass === 'landscape') {
        chosen = 'hero'
      } else if (lastType !== 'centeredSingle') {
        chosen = 'centeredSingle'
      } else if (lastType !== 'hero') {
        chosen = 'hero'
      } else {
        // Last resort -- just use centeredSingle even if repeated
        chosen = 'centeredSingle'
      }
    }

    // Build the block
    if (chosen === 'pair' || chosen === 'asymmetricPair') {
      blocks.push({ type: chosen, images: [current, next!] })
      imagesSinceBreak += 2
      i += 2
    } else {
      blocks.push({ type: chosen, images: [current] })
      imagesSinceBreak += 1
      i += 1
    }

    lastType = chosen
  }

  return blocks
}
