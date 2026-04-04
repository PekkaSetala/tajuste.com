# Tajuste.com

Photography portfolio by Tajuste. Auto-curating editorial scroll gallery for black & white photography.

## Features

- **Auto-curation** — images automatically arranged by aspect ratio into editorial layout blocks (hero, pair, centered single, asymmetric pair)
- **Session shuffle** — each visit shows a different arrangement via seeded PRNG
- **Portrait pairing** — portraits paired by similar aspect ratio, never shown solo
- **Lightbox** — full-screen viewer with keyboard, touch, and click navigation
- **Gallery print aesthetic** — white mat borders with heavier bottom weight
- **WCAG AA accessible** — contrast-compliant links, ARIA roles, focus trapping, keyboard nav

## Tech Stack

- Next.js 15 (static export)
- React 19
- TypeScript
- Framer Motion 11

## Development

```bash
npm install
npm run dev
```

## Image Management

Images live in `pics_web/` (not tracked in this repo). To set up locally:

1. Place your images in `pics_web/`
2. Copy to public: `cp pics_web/*.jpg public/images/`
3. Generate manifest: `node scripts/generate-manifest.js`

## Build & Deploy

```bash
npm run build    # outputs static site to out/
```

The `out/` directory can be served by any static file server (nginx, etc).

## License

All photographs are copyrighted by Tajuste. Code is MIT.
