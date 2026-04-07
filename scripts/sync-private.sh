#!/bin/sh
# Sync current state to private repo (includes CLAUDE.md and pics).
# Works entirely via a temp index to avoid branch switching,
# which would delete gitignored files like pics_web/.
set -e

# Build a tree that includes everything on main + gitignored private files
export GIT_INDEX_FILE="$(git rev-parse --git-dir)/index-private"
trap 'rm -f "$GIT_INDEX_FILE"' EXIT

# Start from current main tree
git read-tree HEAD

# Add gitignored files that belong in private
git add -f CLAUDE.md
git add -f pics_web/

# Create a tree object and commit it
TREE=$(git write-tree)
COMMIT=$(git commit-tree "$TREE" -m "sync: include CLAUDE.md and pics")

# Force push to private main
git push --no-verify private "$COMMIT":refs/heads/main --force -q

echo "Private repo synced."
