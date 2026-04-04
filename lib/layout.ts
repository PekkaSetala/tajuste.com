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

type SeqItem =
  | { type: 'single'; img: ImageEntry }
  | { type: 'portraitPair'; imgs: [ImageEntry, ImageEntry]; asymmetric: boolean }

// Pre-pair portraits so none appear solo.
// Marks pairs as asymmetric when aspect ratios differ significantly.
function prepareSequence(images: ImageEntry[]): SeqItem[] {
  const portraits: ImageEntry[] = []
  const others: ImageEntry[] = []

  for (const img of images) {
    if (classify(img) === 'portrait') portraits.push(img)
    else others.push(img)
  }

  // Sort by aspect ratio so similar ratios get paired
  portraits.sort((a, b) => a.aspectRatio - b.aspectRatio)
  const pairs: { imgs: [ImageEntry, ImageEntry]; asymmetric: boolean }[] = []
  for (let i = 0; i < portraits.length - 1; i += 2) {
    const ratioDiff = Math.abs(portraits[i].aspectRatio - portraits[i + 1].aspectRatio)
    pairs.push({
      imgs: [portraits[i], portraits[i + 1]],
      asymmetric: ratioDiff > 0.15,
    })
  }
  const oddPortrait = portraits.length % 2 === 1 ? portraits[portraits.length - 1] : null

  const result: SeqItem[] = []
  let oi = 0
  let pi = 0
  let sinceLastPair = 0
  // Vary spacing: alternate between inserting pair after 2 and 3 singles
  let pairInterval = 2

  while (oi < others.length || pi < pairs.length) {
    if (pi < pairs.length && (sinceLastPair >= pairInterval || oi >= others.length)) {
      result.push({ type: 'portraitPair', ...pairs[pi] })
      pi++
      sinceLastPair = 0
      pairInterval = pairInterval === 2 ? 3 : 2
    } else if (oi < others.length) {
      result.push({ type: 'single', img: others[oi] })
      oi++
      sinceLastPair++
    } else {
      break
    }
  }

  if (oddPortrait) {
    result.push({ type: 'portraitPair', imgs: [oddPortrait, oddPortrait], asymmetric: false })
  }

  return result
}

export function buildLayout(images: ImageEntry[]): LayoutBlock[] {
  const sequence = prepareSequence(images)
  const blocks: LayoutBlock[] = []
  let lastType: string | null = null
  let imagesSinceBreak = 0
  let singleCount = 0

  for (const item of sequence) {
    // Insert chapter break at interval
    if (imagesSinceBreak >= CHAPTER_MIN && lastType !== 'chapterBreak') {
      blocks.push({ type: 'chapterBreak', images: [] })
      lastType = 'chapterBreak'
      imagesSinceBreak = 0
    }

    if (item.type === 'portraitPair') {
      if (item.imgs[0].id === item.imgs[1].id) {
        // Odd portrait — centered single
        const blockType: BlockType = lastType !== 'centeredSingle' ? 'centeredSingle' : 'hero'
        blocks.push({ type: blockType, images: [item.imgs[0]] })
        imagesSinceBreak += 1
        lastType = blockType
      } else if (item.asymmetric && lastType !== 'asymmetricPair') {
        // Different aspect ratios — use asymmetric layout
        blocks.push({ type: 'asymmetricPair', images: [item.imgs[0], item.imgs[1]] })
        imagesSinceBreak += 2
        lastType = 'asymmetricPair'
      } else if (lastType !== 'pair' && lastType !== 'asymmetricPair') {
        blocks.push({ type: 'pair', images: [item.imgs[0], item.imgs[1]] })
        imagesSinceBreak += 2
        lastType = 'pair'
      } else if (lastType === 'pair') {
        // After a pair, use asymmetric for variety
        blocks.push({ type: 'asymmetricPair', images: [item.imgs[0], item.imgs[1]] })
        imagesSinceBreak += 2
        lastType = 'asymmetricPair'
      } else {
        // After asymmetricPair — split into two centered singles
        blocks.push({ type: 'centeredSingle', images: [item.imgs[0]] })
        imagesSinceBreak += 1
        lastType = 'centeredSingle'
        if (imagesSinceBreak >= CHAPTER_MIN) {
          blocks.push({ type: 'chapterBreak', images: [] })
          lastType = 'chapterBreak'
          imagesSinceBreak = 0
        }
        blocks.push({ type: 'hero', images: [item.imgs[1]] })
        imagesSinceBreak += 1
        lastType = 'hero'
      }
    } else {
      const img = item.img
      const imgClass = classify(img)
      let chosen: BlockType
      singleCount++

      // Vary rhythm: every 3rd single, prefer the less-used type
      if (imgClass === 'landscape' && lastType !== 'hero') {
        chosen = 'hero'
      } else if (imgClass === 'square' && lastType !== 'centeredSingle') {
        chosen = 'centeredSingle'
      } else if (singleCount % 3 === 0 && lastType !== 'centeredSingle') {
        // Break up hero runs — force centered single occasionally
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
