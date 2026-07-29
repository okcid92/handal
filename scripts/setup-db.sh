#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# ── Colors ───────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# ── Parse args ──────────────────────────────────────────────────────
RESET=false
for arg in "$@"; do
  case "$arg" in
    --reset) RESET=true ;;
  esac
done

# ── Load .env ────────────────────────────────────────────────────────
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$PROJECT_DIR/.env"
  set +a
else
  error ".env file not found at $PROJECT_DIR/.env"
  exit 1
fi

# ── Parse DATABASE_URL ──────────────────────────────────────────────
if [ -z "${DATABASE_URL:-}" ]; then
  error "DATABASE_URL is not set in .env"
  exit 1
fi

DB_USER=$(echo "$DATABASE_URL" | sed -n 's|mysql://\([^:]*\):.*|\1|p')
DB_PASS_RAW=$(echo "$DATABASE_URL" | sed -n 's|mysql://[^:]*:\([^@]*\)@.*|\1|p')
DB_PASS=$(python3 -c "import urllib.parse; print(urllib.parse.unquote('''$DB_PASS_RAW'''))" 2>/dev/null || echo "$DB_PASS_RAW")
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|mysql://[^@]*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|mysql://[^@]*@[^:]*:\([0-9]*\)/.*|\1|p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's|mysql://[^/]*/\([^?]*\).*|\1|p')

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"

info "Database: $DB_NAME | User: $DB_USER | Host: $DB_HOST:$DB_PORT"

# ── Check MySQL connectivity ────────────────────────────────────────
info "Testing MySQL connection..."
if ! mysql -u "$DB_USER" -p"$DB_PASS" -h "$DB_HOST" -P "$DB_PORT" -e "SELECT 1" &>/dev/null; then
  error "Cannot connect to MySQL with provided credentials."
  error "Make sure the user '$DB_USER' exists and has access."
  exit 1
fi
info "MySQL connection OK"

# ── Reset (optional) ───────────────────────────────────────────────
if [ "$RESET" = true ]; then
  warn "Resetting database '$DB_NAME' (DROP + CREATE)..."
  mysql -u "$DB_USER" -p"$DB_PASS" -h "$DB_HOST" -P "$DB_PORT" -e \
    "DROP DATABASE IF EXISTS \`$DB_NAME\`; CREATE DATABASE \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
  info "Database '$DB_NAME' recreated"
else
  info "Ensuring database '$DB_NAME' exists..."
  mysql -u "$DB_USER" -p"$DB_PASS" -h "$DB_HOST" -P "$DB_PORT" -e \
    "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
  info "Database '$DB_NAME' ready"
fi

# ── Install dependencies ────────────────────────────────────────────
info "Installing npm dependencies..."
cd "$PROJECT_DIR"
npm install --silent

# ── Generate Prisma client ──────────────────────────────────────────
info "Generating Prisma client..."
npx prisma generate

# ── Run migrations ──────────────────────────────────────────────────
if [ "$RESET" = true ]; then
  info "Running all migrations from scratch..."
  npx prisma migrate deploy
else
  info "Running database migrations..."
  npx prisma migrate deploy
fi

# ── Seed ────────────────────────────────────────────────────────────
info "Seeding database..."
node prisma/seed.js

echo ""
info "============================================"
info "  Setup complete!"
info "============================================"
info ""
info "  Database : $DB_NAME"
info "  URL      : $DB_HOST:$DB_PORT"
info "  Seed     : 4 users + 1 theme created"
info ""
info "  Default credentials (password: Handal@2025!):"
info "    Student : INE N01331820231"
info "    Teacher : teacher@handal.local"
info "    DA      : da@handal.local"
info "    Admin   : admin@handal.local"
info ""
