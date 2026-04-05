#!/bin/sh
# Build, deploy to server, push to origin.
# Usage: npm run deploy
set -e

echo "=== Building ==="
npm run build --silent

echo "=== Deploying to server ==="
rsync -avz --delete out/ webserve:/home/servaaja/tajuste.com/

echo "=== Pushing to origin (public) ==="
git push --no-verify origin main

echo "=== Done ==="
echo "Note: to sync private repo, run: npm run sync-private"
