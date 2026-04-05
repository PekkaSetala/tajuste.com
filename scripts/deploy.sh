#!/bin/sh
# Build, deploy to server, push to both remotes.
# Usage: ./scripts/deploy.sh
set -e

echo "=== Building ==="
npm run build --silent

echo "=== Deploying to server ==="
rsync -avz --delete out/ webserve:/home/servaaja/tajuste.com/

echo "=== Pushing to origin (public, no CLAUDE.md) ==="
git push --no-verify origin main

echo "=== Syncing to private (with CLAUDE.md) ==="
# Temporarily stage CLAUDE.md, commit, push, then undo
git stash --include-untracked -q 2>/dev/null || true
git add -f CLAUDE.md
git commit --no-verify -m "sync: include CLAUDE.md for private repo" -q
git push private main --force -q
git reset --soft HEAD~1 -q
git reset HEAD CLAUDE.md -q
git stash pop -q 2>/dev/null || true

echo "=== Done ==="
