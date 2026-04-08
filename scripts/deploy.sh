#!/bin/sh
# Build, deploy to server, push to origin.
# Usage: npm run deploy
set -e

# Verify color images symlink exists (created by npm run manifest)
if [ -d pics_web_color ] && [ ! -L public/images-color ]; then
  echo "ERROR: public/images-color symlink missing. Run 'npm run manifest' first."
  exit 1
fi

echo "=== Building ==="
npm run build --silent

echo "=== Deploying to server ==="
rsync -avz --delete out/ webserve:/home/servaaja/tajuste.com/

echo "=== Pushing to origin (public) ==="
git push --no-verify origin main

echo "=== Done ==="
echo "Note: to sync private repo, run: npm run sync-private"
