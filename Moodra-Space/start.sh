#!/usr/bin/env bash
# Moodra Space — production startup script
# Starts the Cyrillic PDF Renderer (Python/WeasyPrint) then the Node.js server.
# Both processes share the same lifetime: when Node.js exits, Python is killed too.

set -e

RENDERER_PORT="${CYRILLIC_RENDERER_PORT:-3001}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RENDERER_APP="$SCRIPT_DIR/../cyrillic-renderer/app.py"

# ── Start Cyrillic Renderer in background ────────────────────────────
if command -v python3 &>/dev/null && [ -f "$RENDERER_APP" ]; then
  echo "[start.sh] Starting Cyrillic Renderer on port $RENDERER_PORT…"
  CYRILLIC_RENDERER_PORT="$RENDERER_PORT" python3 "$RENDERER_APP" &
  RENDERER_PID=$!
  echo "[start.sh] Cyrillic Renderer PID=$RENDERER_PID"
else
  echo "[start.sh] WARNING: python3 or cyrillic-renderer/app.py not found — Cyrillic PDF export will be unavailable."
  RENDERER_PID=""
fi

# ── Cleanup: kill Python on exit ─────────────────────────────────────
cleanup() {
  if [ -n "$RENDERER_PID" ] && kill -0 "$RENDERER_PID" 2>/dev/null; then
    echo "[start.sh] Stopping Cyrillic Renderer (PID=$RENDERER_PID)…"
    kill "$RENDERER_PID" 2>/dev/null || true
    wait "$RENDERER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT SIGTERM SIGINT

# ── Start Node.js server (foreground — receives signals from CloudRun) ─
echo "[start.sh] Starting Node.js server…"
NODE_ENV=production node dist/index.js
