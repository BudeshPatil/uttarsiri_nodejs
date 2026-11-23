#!/usr/bin/env bash
# Staging deploy for the Innoventies API. Run on the server from the repo root.
set -euo pipefail
cd "$(dirname "$0")"

[ -f .env ] || { echo "ERROR: .env is missing. Copy .env.staging.example to .env and fill it in."; exit 1; }

echo "==> git pull"
git pull --ff-only

echo "==> npm ci"
npm ci --omit=dev

echo "==> restart pm2"
if pm2 describe innoventies-api >/dev/null 2>&1; then
  pm2 reload innoventies-api --update-env
else
  pm2 start ecosystem.config.cjs --env staging
fi
pm2 save

echo "==> health check"
sleep 3
curl -fsS "http://127.0.0.1:${PORT:-5004}/api/health" && echo " OK"
