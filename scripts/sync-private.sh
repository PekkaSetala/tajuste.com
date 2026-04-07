#!/bin/sh
# Sync current state to private repo (includes CLAUDE.md and pics).
# Uses a temporary branch to avoid polluting main history.
set -e

BRANCH="private-sync"

# Create a temp branch from current main
git checkout -b "$BRANCH" -q

# Add gitignored files that belong in private
git add -f CLAUDE.md
git add -f pics_web/

# Commit if there's anything new
if ! git diff --cached --quiet 2>/dev/null; then
  git commit --no-verify -m "sync: include CLAUDE.md and pics" -q
fi

# Force push to private main
git push --no-verify private "$BRANCH":main --force -q

# Clean up: back to main, delete temp branch
git checkout main -q
git branch -D "$BRANCH" -q

echo "Private repo synced."
