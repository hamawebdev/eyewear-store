#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Resetting database..."
bash "$ROOT_DIR/scripts/reset-payload-db.sh"

echo "==> Seeding wilayas..."
cd "$ROOT_DIR" && npm run seed:wilayas

echo "==> Seeding catalog..."
cd "$ROOT_DIR" && npm run seed:catalog

echo "==> Done."
