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
scripts/      — deploy.sh, sync-private.sh, generate-manifest.js, check-claude-freshness.sh
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
npm run dev           # Dev server
npm run build         # Production build → out/
npm run manifest      # Regenerate data/images.json after adding/removing photos
npm run deploy        # Build → deploy to server → push to origin
npm run sync-private  # Sync code + CLAUDE.md to private repo
```

## Design Tokens

- Background: #edecea — Text: #3a3632, #a09890, #6e6860 (WCAG AA)
- Mat: white, heavier bottom padding, subtle shadow
- Font: Georgia (brand), system sans-serif (UI)

## Deploy

Hosted on nginx (Ubuntu VPS at 37.27.14.199, user `servaaja`).
Site root: `/home/servaaja/tajuste.com`. SSL via Let's Encrypt.
SSH alias `webserve` is configured in `~/.ssh/config`.

```bash
npm run deploy        # Build → deploy to server → push to origin
npm run sync-private  # Sync code + CLAUDE.md to private repo
```

Two GitHub remotes:
- `origin` — public repo (PekkaSetala/tajuste.com) — no CLAUDE.md, no pics
- `private` — private repo (PekkaSetala/tajuste.com-private) — includes CLAUDE.md + pics

## Workflow

- **Content changes** (new photos, manifest regen): commit → `npm run deploy`
- **Code changes** (layout, components, config): feature branch → test locally → merge to main → `npm run deploy`
- Pre-push hook runs `npm run build` — blocks push if build fails
- CLAUDE.md freshness is checked at session start — update if structural files changed
- CLAUDE.md is gitignored from public repo, synced to private repo via deploy script
