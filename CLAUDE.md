# CLAUDE.md

## Overview

Tajuste.com — B&W photography portfolio. Auto-curating editorial scroll gallery, static export.

## Tech

- Next.js 15 (App Router), React 19, TypeScript
- Framer Motion 11 (lightbox transitions)
- Custom CSS with design tokens (no framework)
- Static export (`output: 'export'`, unoptimized images)

## Structure

```
app/          — page.tsx, layout.tsx
components/   — EditorialScroll, LayoutBlock, Lightbox
lib/          — layout algorithm, types, seeded PRNG
hooks/        — useSessionSeed (session-based shuffle)
styles/       — globals.css (design tokens, mat styles)
data/         — images.json (generated manifest)
scripts/      — generate-manifest.js (dimensions + blurhash)
pics_web/     — ~154 optimized source JPGs
public/images — served images (symlinked from pics_web)
out/          — static export output
```

## Key Concepts

- **Auto-curation**: aspect-ratio classification → layout blocks (hero, pair, centeredSingle, asymmetricPair, chapterBreak)
- **Session shuffle**: seeded PRNG gives each session a unique arrangement
- **Portrait pairing**: portraits pre-paired by similar aspect ratio, never solo

## Commands

```bash
npm run dev         # Dev server
npm run build       # Production build → out/
npm run manifest    # Regenerate data/images.json after adding/removing photos
```

## Design Tokens

- Background: #edecea — Text: #3a3632, #a09890, #6e6860 (WCAG AA)
- Mat: white, heavier bottom padding, subtle shadow
- Font: Georgia (brand), system sans-serif (UI)

## Workflow

- **Content changes** (new photos, manifest regen): commit and push directly to main
- **Code changes** (layout, components, config): feature branch → push → verify Vercel preview → merge to main
- Pre-push hook runs `npm run build` — blocks push if build fails
- CLAUDE.md freshness is checked at session start — update if structural files changed
