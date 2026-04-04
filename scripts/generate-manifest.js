#!/usr/bin/env node
// Generates data/images.json from /public/images/
// Safe to re-run — skips files already present in manifest
// Usage: node scripts/generate-manifest.js [--dry-run]

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const { encode: blurhashEncode, decode: blurhashDecode } = require('blurhash')

const IMAGES_DIR = path.join(__dirname, '../pics_web')
const MANIFEST_PATH = path.join(__dirname, '../data/images.json')
const DRY_RUN = process.argv.includes('--dry-run')

function slugify(filename) {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

async function getPixelsForBlurhash(sharpInstance, width, height) {
  const componentX = 4
  const componentY = 3
  const thumbW = 32
  const thumbH = Math.max(1, Math.round((height / width) * thumbW))

  const { data } = await sharpInstance
    .clone()
    .resize(thumbW, thumbH)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  return { pixels: new Uint8ClampedArray(data.buffer), width: thumbW, height: thumbH, componentX, componentY }
}

// Decode blurhash → tiny PNG data URL using sharp (no canvas needed)
async function blurhashToDataUrl(hash, width, height) {
  try {
    const W = 32, H = Math.max(1, Math.round((height / width) * 32))
    const pixels = blurhashDecode(hash, W, H) // returns Uint8ClampedArray RGBA
    const png = await sharp(Buffer.from(pixels.buffer), {
      raw: { width: W, height: H, channels: 4 }
    }).png().toBuffer()
    return `data:image/png;base64,${png.toString('base64')}`
  } catch {
    return null
  }
}

async function main() {
  const existing = fs.existsSync(MANIFEST_PATH)
    ? JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'))
    : []

  const existingByFilename = Object.fromEntries(existing.map(e => [e.filename, e]))

  const files = fs.readdirSync(IMAGES_DIR)
    .filter(f => /\.(jpe?g|png|webp|avif)$/i.test(f))
    .sort()

  const newEntries = []
  let skipped = 0

  for (const filename of files) {
    if (existingByFilename[filename]) {
      skipped++
      continue
    }

    const filepath = path.join(IMAGES_DIR, filename)
    const img = sharp(filepath)
    const meta = await img.metadata()
    const { width, height } = meta

    if (!width || !height) {
      console.warn(`  WARN: could not read dimensions for ${filename}`)
      continue
    }

    let blurhash = ''
    let blurDataUrl = null
    try {
      const { pixels, width: w, height: h, componentX, componentY } = await getPixelsForBlurhash(img, width, height)
      blurhash = blurhashEncode(pixels, w, h, componentX, componentY)
      blurDataUrl = await blurhashToDataUrl(blurhash, width, height)
    } catch (e) {
      console.warn(`  WARN: blurhash failed for ${filename}: ${e.message}`)
    }

    const id = slugify(filename)
    const entry = {
      id,
      filename,
      width,
      height,
      aspectRatio: parseFloat((width / height).toFixed(4)),
      blurhash,
      blurDataUrl,
      addedAt: new Date().toISOString(),
      sequenceId: null,
    }

    newEntries.push(entry)
    console.log(`  + ${filename} (${width}×${height})`)
  }

  console.log(`\nSkipped ${skipped} already-indexed. Found ${newEntries.length} new.`)

  if (DRY_RUN) {
    console.log('Dry run — no changes written.')
    return
  }

  if (newEntries.length > 0) {
    // Check for duplicate IDs
    const all = [...existing, ...newEntries]
    const ids = all.map(e => e.id)
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
    if (dupes.length > 0) {
      console.warn(`  WARN: duplicate IDs detected: ${dupes.join(', ')}`)
    }

    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(all, null, 2))
    console.log(`Written ${all.length} entries to data/images.json`)
  } else {
    console.log('Nothing to write.')
  }
}

main().catch(e => { console.error(e); process.exit(1) })
