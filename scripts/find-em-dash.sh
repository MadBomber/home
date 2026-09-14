#!/usr/bin/env bash
#
# find-em-dash.sh — report every em-dash (—, U+2014) in Markdown files.
#
# Usage:
#   ./find-em-dash.sh [path ...]
#
# With no arguments it searches the current directory tree.
# Each match is printed as: file:line_number:line_text
# Exit status is 0 if any em-dash was found, 1 if none were found.

set -euo pipefail

# Directories/files to search default to "." when none are given.
if [ "$#" -eq 0 ]; then
  set -- .
fi

found=0

while IFS= read -r -d '' file; do
  if grep -nH -- '—' "$file"; then
    found=1
  fi
done < <(find "$@" -type f -name '*.md' -print0)

if [ "$found" -eq 0 ]; then
  echo "No em-dash characters found." >&2
  exit 1
fi
