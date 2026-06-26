#!/usr/bin/env bash
set -euo pipefail

# ─── Colours ────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

info()    { echo -e "${CYAN}→${NC} $*"; }
success() { echo -e "${GREEN}✓${NC} $*"; }
warn()    { echo -e "${YELLOW}!${NC} $*"; }
die()     { echo -e "${RED}✗ ERROR:${NC} $*" >&2; exit 1; }
header()  { echo -e "\n${BOLD}$*${NC}"; }

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ─── Mode + arg parsing ────────────────────────────────────────────────────
MODE="prod"

print_help() {
  cat <<EOF
Carbon CMS installer

Usage:
  ./scripts/install.sh             # production install (requires domain + DNS)
  ./scripts/install.sh --local     # local dev install (localhost, no domain, no TLS)
  ./scripts/install.sh --help

Modes:
  prod  (default) Brings up the full stack with Caddy + Let's Encrypt TLS at
                  your domain. Asks for CARBON_DOMAIN and CADDY_EMAIL,
                  generates secrets, applies the database schema, starts
                  every service. Linux only (systemd + Docker assumptions).

  local           Brings up docker-compose.dev.yml on localhost. No Caddy,
                  no TLS, no domain needed. Hardcoded dev-only credentials;
                  NOT for production. Works on Linux and macOS with Docker
                  Desktop or equivalent.
EOF
}

for arg in "$@"; do
  case "$arg" in
    --local|--dev) MODE="local" ;;
    -h|--help)     print_help; exit 0 ;;
    *)             die "Unknown argument: $arg (use --help to see options)" ;;
  esac
done

# ─── OS check ───────────────────────────────────────────────────────────────
check_os_prod() {
  header "Checking environment"
  if [[ "$(uname -s)" != "Linux" ]]; then
    die "Production install supports Linux only (systemd / Docker assumptions). For local development on macOS, rerun with --local."
  fi
  success "Linux detected"
}

check_os_local() {
  header "Checking environment"
  local os
  os="$(uname -s)"
  case "$os" in
    Linux|Darwin) success "$os detected" ;;
    *)            warn "$os is not officially supported but Docker may still work — continuing." ;;
  esac
}

# ─── Docker ─────────────────────────────────────────────────────────────────
install_docker() {
  info "Installing Docker…"
  curl -fsSL https://get.docker.com | sh
  # Add the current user to the docker group so we don't need sudo for compose
  if id -nG "$USER" | grep -qw docker; then
    :
  else
    usermod -aG docker "$USER" 2>/dev/null || true
    warn "Added $USER to the docker group. You may need to log out and back in."
  fi
}

check_docker() {
  header "Checking Docker"
  if ! command -v docker &>/dev/null; then
    if [[ "$MODE" == "local" ]]; then
      die "Docker not found. Install Docker Desktop (https://docker.com/products/docker-desktop) and rerun."
    fi
    warn "Docker not found — installing automatically…"
    install_docker
  fi

  if ! docker compose version &>/dev/null; then
    die "Docker Compose plugin not found. Please update Docker to a recent version."
  fi

  if ! docker info &>/dev/null; then
    if [[ "$MODE" == "local" ]]; then
      die "Docker daemon is not running. Start Docker Desktop (or the docker service) and rerun."
    fi
    die "Docker daemon is not running. Start it with: sudo systemctl start docker"
  fi

  success "Docker $(docker --version | awk '{print $3}' | tr -d ',')"
  success "Docker Compose $(docker compose version --short)"
}

# ─── Helpers ────────────────────────────────────────────────────────────────
gen_secret() { openssl rand -hex 32; }

gen_password() {
  # URL-safe, 32 chars
  openssl rand -base64 32 | tr -d '/+=' | head -c 32
}

random_port() {
  # Avoid well-known ports; stay in 10000–59999
  awk -v seed="$RANDOM$RANDOM" 'BEGIN{srand(seed); print int(rand()*50000)+10000}'
}

server_ip() {
  curl -fsSL --max-time 3 https://api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}'
}

# Returns the compose file flag (or empty for the default file). Used to
# parameterize every `docker compose` invocation by mode.
compose_args() {
  if [[ "$MODE" == "local" ]]; then
    echo "-f docker-compose.dev.yml"
  fi
}

# ─── Input collection (prod only) ──────────────────────────────────────────
collect_input() {
  header "Configuration"
  echo ""
  echo "  Carbon needs two pieces of information to configure HTTPS."
  echo ""

  read -rp "  Domain name (e.g. myblog.com): " CARBON_DOMAIN
  [[ -z "$CARBON_DOMAIN" ]] && die "Domain name is required."
  CARBON_DOMAIN="${CARBON_DOMAIN#https://}"  # strip accidental https:// prefix
  CARBON_DOMAIN="${CARBON_DOMAIN%/}"         # strip trailing slash

  read -rp "  Email for Let's Encrypt notifications: " CADDY_EMAIL
  [[ -z "$CADDY_EMAIL" ]] && die "Email address is required."

  echo ""
}

# ─── .env generation (prod only) ───────────────────────────────────────────
generate_env() {
  header "Generating configuration"

  local env_file="$REPO_DIR/.env"

  if [[ -f "$env_file" ]]; then
    warn ".env already exists — backing up to .env.bak"
    cp "$env_file" "$env_file.bak"
  fi

  local auth_secret postgres_password api_port admin_port frontend_port
  auth_secret=$(gen_secret)
  postgres_password=$(gen_password)
  api_port=$(random_port)
  admin_port=$(random_port)
  frontend_port=$(random_port)

  # Ensure ports are unique
  while [[ "$admin_port" == "$api_port" ]]; do admin_port=$(random_port); done
  while [[ "$frontend_port" == "$api_port" || "$frontend_port" == "$admin_port" ]]; do
    frontend_port=$(random_port)
  done

  cat > "$env_file" <<EOF
# Carbon CMS — generated by install.sh on $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Do not share this file. It contains secrets.

CARBON_DOMAIN=${CARBON_DOMAIN}
CADDY_EMAIL=${CADDY_EMAIL}
CARBON_PUBLIC_URL=https://${CARBON_DOMAIN}
CARBON_VERSION=latest

AUTH_SECRET=${auth_secret}
POSTGRES_PASSWORD=${postgres_password}

API_PORT=${api_port}
ADMIN_PORT=${admin_port}
FRONTEND_PORT=${frontend_port}

STORAGE_DRIVER=local

# Optional — set to enable cross-origin API access (Enterprise mode)
# CARBON_ALLOWED_ORIGINS=https://${CARBON_DOMAIN},https://admin.${CARBON_DOMAIN}

# Optional — set to expose the API publicly via Caddy (uncomment and regenerate Caddyfile)
# EXPOSE_API=true
EOF

  success ".env written"
  # shellcheck source=/dev/null
  source "$env_file"
}

# ─── Caddyfile generation (prod only) ──────────────────────────────────────
generate_caddyfile() {
  local caddyfile="$REPO_DIR/Caddyfile"
  local template="$REPO_DIR/Caddyfile.template"

  [[ ! -f "$template" ]] && die "Caddyfile.template not found at $template"

  # shellcheck disable=SC2016
  CADDY_EMAIL="$CADDY_EMAIL" \
  CARBON_DOMAIN="$CARBON_DOMAIN" \
  API_PORT="$API_PORT" \
  ADMIN_PORT="$ADMIN_PORT" \
  FRONTEND_PORT="$FRONTEND_PORT" \
    envsubst '$CADDY_EMAIL $CARBON_DOMAIN $API_PORT $ADMIN_PORT $FRONTEND_PORT' \
    < "$template" > "$caddyfile"

  success "Caddyfile written"
}

# ─── Start services ────────────────────────────────────────────────────────
start_services() {
  header "Starting Carbon CMS"
  cd "$REPO_DIR"

  local compose
  read -r -a compose <<<"$(compose_args)"

  info "Bringing up the database first…"
  docker compose "${compose[@]}" up -d db

  info "Pulling app images (this may take a few minutes on first run)…"
  # Pull pre-built images; fall back to building locally if they don't exist yet.
  if ! docker compose "${compose[@]}" pull --quiet api admin frontend 2>/dev/null; then
    warn "Pre-built images not found — building locally (this takes 10–15 minutes)…"
    docker compose "${compose[@]}" build --quiet api admin frontend
  fi
}

# ─── Apply schema (both modes) ─────────────────────────────────────────────
apply_schema() {
  header "Applying database schema"
  cd "$REPO_DIR"

  local compose
  read -r -a compose <<<"$(compose_args)"

  # Wait for the db service to be healthy before running the migration.
  info "Waiting for the database to be ready…"
  local max_attempts=24 attempt=0
  while [[ $attempt -lt $max_attempts ]]; do
    local db_container db_health
    db_container=$(docker compose "${compose[@]}" ps -q db 2>/dev/null | head -1)
    [[ -n "$db_container" ]] || { sleep 2; attempt=$((attempt+1)); continue; }
    db_health=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' \
      "$db_container" 2>/dev/null || echo "unknown")
    if [[ "$db_health" == "healthy" ]]; then break; fi
    sleep 2
    attempt=$((attempt+1))
  done

  info "Running drizzle-kit push…"
  docker compose "${compose[@]}" run --rm api node packages/api/scripts/migrate.mjs
  success "Schema applied"
}

# ─── Bring up app services ─────────────────────────────────────────────────
start_app_services() {
  header "Starting application services"
  cd "$REPO_DIR"

  local compose
  read -r -a compose <<<"$(compose_args)"

  docker compose "${compose[@]}" up -d
  success "Services started"
}

# ─── Health check (prod only — local skips since ports are published) ──────
wait_for_health() {
  header "Waiting for services to be ready"
  info "Polling API health (up to 2 minutes)…"

  local compose
  read -r -a compose <<<"$(compose_args)"

  local api_container
  api_container=$(docker compose "${compose[@]}" ps -q api 2>/dev/null | head -1)
  [[ -z "$api_container" ]] && die "Could not find the API container."

  local max_attempts=24 attempt=0
  while [[ $attempt -lt $max_attempts ]]; do
    local health
    health=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' \
      "$api_container" 2>/dev/null || echo "unknown")

    if [[ "$health" == "healthy" ]]; then
      success "API is healthy"
      return 0
    fi

    sleep 5
    attempt=$((attempt + 1))
  done

  warn "API did not report healthy within 2 minutes."
  warn "Check logs with: docker compose logs api"
  return 1
}

# ─── Success message (prod) ────────────────────────────────────────────────
print_success_prod() {
  local ip
  ip=$(server_ip)

  echo ""
  echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}${BOLD}  Carbon CMS is running!${NC}"
  echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "  Your site:   ${CYAN}https://${CARBON_DOMAIN}${NC}"
  echo -e "  Admin panel: ${CYAN}https://admin.${CARBON_DOMAIN}${NC}"
  echo ""
  echo -e "  ${BOLD}Next step:${NC} Go to ${CYAN}https://admin.${CARBON_DOMAIN}/setup${NC} to create your admin account."
  echo ""
  echo -e "${YELLOW}${BOLD}  DNS records required${NC} (point both to this server):"
  echo ""
  echo -e "    A  ${CARBON_DOMAIN}        →  ${ip}"
  echo -e "    A  admin.${CARBON_DOMAIN}  →  ${ip}"
  echo ""
  echo -e "  HTTPS certificates are issued automatically once DNS propagates."
  echo ""
  echo -e "  Useful commands:"
  echo -e "    View logs:    ${CYAN}docker compose logs -f${NC}"
  echo -e "    Stop:         ${CYAN}docker compose down${NC}"
  echo -e "    Update:       ${CYAN}docker compose pull && docker compose up -d${NC}"
  echo ""
}

# ─── Success message (local) ───────────────────────────────────────────────
print_success_local() {
  echo ""
  echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}${BOLD}  Carbon CMS is running (local mode)${NC}"
  echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "  API:      ${CYAN}http://localhost:3001${NC}"
  echo -e "  Admin:    ${CYAN}http://localhost:3002${NC}"
  echo -e "  Frontend: ${CYAN}http://localhost:3003${NC}"
  echo ""
  echo -e "  ${BOLD}Next step:${NC} Open ${CYAN}http://localhost:3002/admin/setup${NC} to create your admin account."
  echo ""
  echo -e "${YELLOW}${BOLD}  Local-mode credentials are hardcoded${NC} in docker-compose.dev.yml."
  echo -e "  Do not expose this stack to the public internet."
  echo ""
  echo -e "  Useful commands:"
  echo -e "    View logs:    ${CYAN}docker compose -f docker-compose.dev.yml logs -f${NC}"
  echo -e "    Stop:         ${CYAN}docker compose -f docker-compose.dev.yml down${NC}"
  echo -e "    Wipe data:    ${CYAN}docker compose -f docker-compose.dev.yml down -v${NC}"
  echo ""
}

# ─── Main ──────────────────────────────────────────────────────────────────
main() {
  echo ""
  echo -e "${BOLD}Carbon CMS Installer${NC} ${CYAN}[mode: ${MODE}]${NC}"
  echo -e "────────────────────"

  if [[ "$MODE" == "local" ]]; then
    check_os_local
    check_docker
    start_services
    apply_schema
    start_app_services
    print_success_local
  else
    check_os_prod
    check_docker
    collect_input
    generate_env
    generate_caddyfile
    start_services
    apply_schema
    start_app_services
    wait_for_health
    print_success_prod
  fi
}

main
