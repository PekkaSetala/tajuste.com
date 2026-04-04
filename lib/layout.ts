import type { ImageEntry, LayoutBlock, BlockType } from './types'

// Aspect ratio thresholds
const LANDSCAPE_THRESHOLD = 1.4
const PORTRAIT_THRESHOLD = 0.85

type ImageClass = 'landscape' | 'portrait' | 'square'

function classify(img: ImageEntry): ImageClass {
  if (img.aspectRatio > LANDSCAPE_THRESHOLD) return 'landscape'
  if (img.aspectRatio < PORTRAIT_THRESHOLD) return 'portrait'
  return 'square'
}

const CHAPTER_MIN = 8
const CHAPTER_MAX = 12

// Pre-pair portraits so none appear solo.
// Returns an interleaved sequence of singles and portrait pairs.
function prepareSequence(images: ImageEntry[]): Array<{ type: 'single'; img: ImageEntry } | { type: 'portraitPair'; imgs: [ImageEntry, ImageEntry] }> {
  const portraits: ImageEntry[] = []
  const others: ImageEntry[] = []

  for (const img of images) {
    if (classify(img) === 'portrait') portraits.push(img)
    else others.push(img)
  }

  // Pair portraits together. If odd count, last one pairs with the nearest-ratio partner.
  const pairs: [ImageEntry, ImageEntry][] = []
  // Sort by aspect ratio so similar ratios get paired
  portraits.sort((a, b) => a.aspectRatio - b.aspectRatio)
  for (let i = 0; i < portraits.length - 1; i += 2) {
    pairs.push([portraits[i], portraits[i + 1]])
  }
  // Odd portrait left over — pair it with the last landscape/square as asymmetric
  const oddPortrait = portraits.length % 2 === 1 ? portraits[portraits.length - 1] : null

  // Build interleaved sequence: distribute pairs among singles
  const result: Array<{ type: 'single'; img: ImageEntry } | { type: 'portraitPair'; imgs: [ImageEntry, ImageEntry] }> = []

  let oi = 0 // others index
  let pi = 0 // pairs index

  // Interleave: after every 2-3 singles, insert a pair
  let sinceLastPair = 0

  while (oi < others.length || pi < pairs.length) {
    // Insert a pair every 2-3 singles
    if (pi < pairs.length && (sinceLastPair >= 2 || oi >= others.length)) {
      result.push({ type: 'portraitPair', imgs: pairs[pi] })
      pi++
      sinceLastPair = 0
    } else if (oi < others.length) {
      result.push({ type: 'single', img: others[oi] })
      oi++
      sinceLastPair++
    } else {
      break
    }
  }

  // Handle odd portrait — insert as asymmetric with the last single before it
  if (oddPortrait) {
    // Find a landscape to pair with, or just add as a pair with itself
    // Best: insert near the end paired with a nearby landscape
    result.push({ type: 'portraitPair', imgs: [oddPortrait, oddPortrait] })
  }

  return result
}

export function buildLayout(images: ImageEntry[]): LayoutBlock[] {
  const sequence = prepareSequence(images)
  const blocks: LayoutBlock[] = []
  let lastType: string | null = null
  let imagesSinceBreak = 0

  for (const item of sequence) {
    // Insert chapter break at interval
    if (imagesSinceBreak >= CHAPTER_MIN && lastType !== 'chapterBreak') {
      blocks.push({ type: 'chapterBreak', images: [] })
      lastType = 'chapterBreak'
      imagesSinceBreak = 0
    }

    if (item.type === 'portraitPair') {
      // Skip duplicate odd-portrait placeholder
      if (item.imgs[0].id === item.imgs[1].id) {
        // Odd portrait — show as centered single instead of a weird duplicate pair
        const blockType: BlockType = lastType !== 'centeredSingle' ? 'centeredSingle' : 'hero'
        blocks.push({ type: blockType, images: [item.imgs[0]] })
        imagesSinceBreak += 1
        lastType = blockType
      } else {
        const blockType: BlockType = lastType !== 'pair' ? 'pair' : 'centeredSingle'
        if (blockType === 'pair') {
          blocks.push({ type: 'pair', images: [item.imgs[0], item.imgs[1]] })
          imagesSinceBreak += 2
        } else {
          // Rhythm conflict — split into two centered singles
          blocks.push({ type: 'centeredSingle', images: [item.imgs[0]] })
          imagesSinceBreak += 1
          lastType = 'centeredSingle'
          // Check for chapter break
          if (imagesSinceBreak >= CHAPTER_MIN && lastType !== 'chapterBreak') {
            blocks.push({ type: 'chapterBreak', images: [] })
            lastType = 'chapterBreak'
            imagesSinceBreak = 0
          }
          blocks.push({ type: 'pair', images: [item.imgs[1], item.imgs[0]] })
          imagesSinceBreak += 1
        }
        lastType = 'pair'
      }
    } else {
      // Single image (landscape or square)
      const img = item.img
      const imgClass = classify(img)
      let chosen: BlockType

      if (imgClass === 'landscape' && lastType !== 'hero') {
        chosen = 'hero'
      } else if (imgClass === 'square' && lastType !== 'centeredSingle') {
        chosen = 'centeredSingle'
      } else if (lastType !== 'hero') {
        chosen = 'hero'
      } else {
        chosen = 'centeredSingle'
      }

      blocks.push({ type: chosen, images: [img] })
      imagesSinceBreak += 1
      lastType = chosen
    }
  }

  return blocks
}
