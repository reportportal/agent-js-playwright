#!/usr/bin/env bash
# Build or update this repo's local code knowledge graph (.codegraph/codegraph.db).
#
# Idempotent — safe to run any time:
#   (no args)   first run -> init (full index); after that -> sync (fast, incremental)
#   --force     rebuild the graph from scratch
#
# The DB is gitignored and local to your machine; only .codegraph/.gitignore is
# committed. Engine: https://github.com/colbymchenry/codegraph (run via npx, no
# global or project install required).
set -u
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENGINE="@colbymchenry/codegraph@^1.1.0"
export CODEGRAPH_TELEMETRY="${CODEGRAPH_TELEMETRY:-0}"

case "${1:-}" in
  --force)
    echo "[codegraph] rebuild: $DIR"
    npx -y "$ENGINE" index "$DIR"
    ;;
  *)
    if [ -f "$DIR/.codegraph/codegraph.db" ]; then
      echo "[codegraph] update (sync): $DIR"
      npx -y "$ENGINE" sync "$DIR"
    else
      echo "[codegraph] init: $DIR"
      npx -y "$ENGINE" init "$DIR"
    fi
    ;;
esac
