# CLAUDE.md

## Overview

Tajuste.com — a photography portfolio site for black & white photography by Tajuste. Built as an auto-curating editorial scroll gallery.

## Tech Stack

- Next.js 15 (App Router), React 19, TypeScript
- Framer Motion 11 (lightbox transitions)
- No CSS framework — custom CSS with design tokens in globals.css

## Structure

- `app/` — Next.js app router (page.tsx, layout.tsx)
- `components/` — EditorialScroll, LayoutBlock, Lightbox
- `lib/` — layout algorithm (layout.ts), types, seeded PRNG
- `hooks/` — useSessionSeed (session-based shuffle)
- `styles/` — globals.css (design tokens, mat styles, pair layout)
- `data/images.json` — generated manifest (run `node scripts/generate-manifest.js`)
- `pics_web/` — optimized source images (~144 JPGs)
- `public/images/` — images served by Next.js (symlinked or copied from pics_web)
- `scripts/generate-manifest.js` — generates image manifest with dimensions and blurhash

## Key Concepts

- **Auto-curation**: Images are classified by aspect ratio and automatically arranged into layout blocks (hero, pair, centeredSingle, asymmetricPair, chapterBreak)
- **Session shuffle**: Each browser session sees a different arrangement via seeded PRNG
- **Portrait pairing**: Portraits are pre-paired by similar aspect ratio so they never appear solo

## Build & Dev

```bash
npm run dev        # Start dev server
npm run build      # Production build
node scripts/generate-manifest.js  # Regenerate image manifest after adding/removing photos
```

## Design Tokens

- Background: #edecea (warm grey)
- Text: #3a3632 (primary), #a09890 (secondary), #6e6860 (links — WCAG AA)
- Mat: white with heavier bottom padding, subtle shadow
- Font: Georgia serif (brand), system sans-serif (UI)
