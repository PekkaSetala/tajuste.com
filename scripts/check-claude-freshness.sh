#!/bin/sh
# Check if CLAUDE.md is stale relative to structural file changes.
# Used as a Claude Code session-start hook.

cd "$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0

last_claude_update=$(git log -1 --format=%H -- CLAUDE.md 2>/dev/null)
if [ -z "$last_claude_update" ]; then
  echo "CLAUDE.md has never been committed."
  exit 0
fi

changes=$(git diff --name-only "$last_claude_update" HEAD -- \
  'app/' 'components/' 'lib/' 'hooks/' 'scripts/' \
  'package.json' 'next.config.js' 2>/dev/null)

if [ -n "$changes" ]; then
  echo "Structural files changed since last CLAUDE.md update:"
  echo "$changes"
  echo "Consider updating CLAUDE.md if the structure section is stale."
fi
