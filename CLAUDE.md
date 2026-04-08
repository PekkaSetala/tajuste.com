# CLAUDE.md

## Overview

Tajuste.com — B&W + color photography portfolio. Auto-curating editorial scroll gallery, static export. Yin/yang toggle switches between B&W (cream theme) and color (dark theme) modes.

## Tech

- Next.js 15 (App Router), React 19, TypeScript
- Framer Motion 11 (lightbox transitions)
- Custom CSS with design tokens (no framework)
- Static export (`output: 'export'`, unoptimized images, WebP format)

## Structure

```
app/          — page.tsx, layout.tsx
components/   — EditorialScroll, LayoutBlock, Lightbox, ModeToggle
lib/          — layout algorithm, types, seeded PRNG
hooks/        — useSessionSeed (session-based shuffle)
styles/       — globals.css (design tokens, mat styles)
data/         — images.json (B&W manifest), images-color.json (color manifest)
scripts/      — deploy.sh, sync-private.sh, generate-manifest.js, check-claude-freshness.sh
pics_web/     — ~189 optimized B&W WebP images (symlinked to public/images)
pics_web_color/ — ~62 optimized color WebP images (symlinked to public/images-color)
public/images — served B&W images (symlinked from pics_web)
public/images-color — served color images (symlinked from pics_web_color)
out/          — static export output
```

## Key Concepts

- **Auto-curation**: aspect-ratio classification → layout blocks (hero, pair, centeredSingle, asymmetricPair, chapterBreak)
- **Session shuffle**: seeded PRNG gives each session a unique arrangement
- **Portrait pairing**: portraits pre-paired by similar aspect ratio, never solo
- **Scroll virtualization**: LazyBlock renders blocks only within 600px of viewport (first 4 eager)
- **WebP conversion**: manifest script auto-converts JPEG/PNG → WebP, deletes originals
- **Color mode**: yin/yang toggle switches between B&W (cream `#edecea`) and color (dark `#0a0a0a`) themes. Mode state in EditorialScroll, CSS variables on `<html data-mode>`, two-phase blur+fade animation (500ms). URL param `?mode=color` for direct linking. FOUC prevention via blocking inline script.

## Commands

```bash
npm run dev           # Dev server
npm run build         # Production build → out/
npm run manifest      # Convert to WebP + regenerate data/images.json + data/images-color.json
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
npm run sync-private  # Sync code + CLAUDE.md + pics_web to private repo
```

Two GitHub remotes:
- `origin` — public repo (PekkaSetala/tajuste.com) — no CLAUDE.md, no pics
- `private` — private repo (PekkaSetala/tajuste.com-private) — includes CLAUDE.md + pics_web

sync-private uses a temp git index (no branch switching) to avoid deleting gitignored files.

## Workflow

- **Content changes** (new B&W photos): drop JPEGs in pics_web → `npm run manifest` → commit → `npm run deploy`
- **Content changes** (new color photos): drop JPEGs in pics_web_color → `npm run manifest` → commit → `npm run deploy`
- **Code changes** (layout, components, config): feature branch → test locally → merge to main → `npm run deploy`
- Pre-push hook runs `npm run build` — blocks push if build fails
- CLAUDE.md freshness is checked at session start — update if structural files changed
- CLAUDE.md is gitignored from public repo, synced to private repo via deploy script
