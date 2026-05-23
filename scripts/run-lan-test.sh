#!/usr/bin/env bash
# Запуск Knowledge Base для тестирования в локальной сети (LAN).
# — доступ по IP хоста (0.0.0.0)
# — CORS без ограничений
# — тестовые логины/пароли
#
# Использование:
#   ./scripts/run-lan-test.sh          # Docker (рекомендуется)
#   ./scripts/run-lan-test.sh --dev    # backend + frontend без Docker (нужен PostgreSQL)
#   ./scripts/run-lan-test.sh --stop   # остановить Docker-стек LAN
#
# Только для локального тестирования. Не запускайте так в интернете.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info() { echo -e "${CYAN}→${NC} $*"; }
ok() { echo -e "${GREEN}✓${NC} $*"; }
warn() { echo -e "${YELLOW}!${NC} $*"; }
err() { echo -e "${RED}✗${NC} $*" >&2; }

detect_lan_ip() {
  local ip=""
  if command -v ip >/dev/null 2>&1; then
    ip=$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1); exit}')
  fi
  if [[ -z "$ip" ]] && command -v hostname >/dev/null 2>&1; then
    ip=$(hostname -I 2>/dev/null | awk '{print $1}')
  fi
  if [[ -z "$ip" ]]; then
    ip="127.0.0.1"
    warn "Не удалось определить LAN IP, используется 127.0.0.1"
  fi
  echo "$ip"
}

write_lan_env() {
  local lan_ip="$1"
  local env_file="$ROOT_DIR/backend/.env.lan"

  cat >"$env_file" <<EOF
# Сгенерировано scripts/run-lan-test.sh — не коммитить секреты в git
SECRET_KEY=lan-test-insecure-key-$(date +%s)
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,backend,${lan_ip},0.0.0.0

DB_ENGINE=django.db.backends.postgresql
DB_NAME=knowledge_base
DB_USER=kb_admin
DB_PASSWORD=lan_test_db
DB_HOST=db
DB_PORT=5432

CORS_ALLOW_ALL_ORIGINS=True

POSTGRES_USER=kb_admin
POSTGRES_PASSWORD=lan_test_db
POSTGRES_DB=knowledge_base
EOF
  ok "Конфиг LAN: backend/.env.lan (ALLOWED_HOSTS включает ${lan_ip})"
}

print_accounts() {
  echo ""
  echo -e "${GREEN}Тестовые учётные записи:${NC}"
  echo "  kb_admin  / admin123   — администратор"
  echo "  kb_editor / editor123  — редактор"
  echo "  kb_reader / reader123  — читатель"
  echo ""
  warn "Пароли захардкожены только для LAN-тестов. Не используйте в production."
}

print_urls() {
  local lan_ip="$1"
  local fe_port="${LAN_FRONTEND_PORT:-5173}"
  local be_port="${LAN_BACKEND_PORT:-8000}"
  echo ""
  echo -e "${GREEN}Откройте в браузере:${NC}"
  echo "  На этом компьютере:  http://127.0.0.1:${fe_port}"
  echo "  В локальной сети:    http://${lan_ip}:${fe_port}"
  echo ""
  echo "  API (прямой доступ): http://${lan_ip}:${be_port}/api/health/"
  echo ""
}

docker_lan_up() {
  local lan_ip
  lan_ip="$(detect_lan_ip)"
  export LAN_IP="$lan_ip"
  export LAN_ALLOWED_HOSTS="localhost,127.0.0.1,backend,${lan_ip},0.0.0.0"
  export LAN_FRONTEND_PORT="${LAN_FRONTEND_PORT:-5173}"
  export LAN_BACKEND_PORT="${LAN_BACKEND_PORT:-8000}"
  export LAN_DB_PORT="${LAN_DB_PORT:-5432}"

  if ! command -v docker >/dev/null 2>&1; then
    err "Docker не найден. Установите Docker или запустите: $0 --dev"
    exit 1
  fi

  write_lan_env "$lan_ip"

  info "Сборка и запуск (docker compose + LAN overrides)..."
  docker compose \
    --env-file "$ROOT_DIR/backend/.env.lan" \
    -f docker-compose.yml \
    -f docker-compose.lan.yml \
    up --build -d

  info "Ожидание backend..."
  local i=0
  until curl -sf "http://127.0.0.1:${LAN_BACKEND_PORT}/api/health/" >/dev/null 2>&1; do
    i=$((i + 1))
    if [[ $i -gt 60 ]]; then
      err "Backend не ответил за 60 с. Логи: docker compose -f docker-compose.yml -f docker-compose.lan.yml logs backend"
      exit 1
    fi
    sleep 2
  done
  ok "Backend готов"

  print_urls "$lan_ip"
  print_accounts
  echo "Остановка: $0 --stop"
  echo "Логи:      docker compose -f docker-compose.yml -f docker-compose.lan.yml logs -f"
}

docker_lan_stop() {
  if [[ -f "$ROOT_DIR/backend/.env.lan" ]]; then
    docker compose \
      --env-file "$ROOT_DIR/backend/.env.lan" \
      -f docker-compose.yml \
      -f docker-compose.lan.yml \
      down
  else
    docker compose -f docker-compose.yml -f docker-compose.lan.yml down
  fi
  ok "LAN-стек остановлен"
}

dev_lan_up() {
  local lan_ip
  lan_ip="$(detect_lan_ip)"
  write_lan_env "$lan_ip"

  export $(grep -v '^#' "$ROOT_DIR/backend/.env.lan" | xargs)
  export DB_HOST="${DB_HOST:-localhost}"

  if [[ "$DB_HOST" == "db" ]]; then
    warn "Для --dev поднимите только БД: docker compose up -d db"
    warn "И задайте DB_HOST=localhost DB_PASSWORD=lan_test_db в backend/.env.lan"
    DB_HOST=localhost
    export DB_HOST
  fi

  info "Миграции и тестовые пользователи..."
  (
    cd "$ROOT_DIR/backend"
    python3 manage.py migrate --noinput
    python3 manage.py setup_kb_roles
    python3 manage.py create_lan_test_users --reset-passwords
  )

  info "Backend на 0.0.0.0:8000..."
  (
    cd "$ROOT_DIR/backend"
    python3 manage.py runserver "0.0.0.0:8000"
  ) &
  BACKEND_PID=$!

  info "Frontend на 0.0.0.0:3000 (VITE → http://${lan_ip}:8000)..."
  (
    cd "$ROOT_DIR/frontend"
    export VITE_API_URL="http://${lan_ip}:8000"
    export VITE_DEV_BACKEND="http://${lan_ip}:8000"
    npm run dev -- --host 0.0.0.0 --port 3000
  ) &
  FRONTEND_PID=$!

  trap 'kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT TERM

  print_urls "$lan_ip"
  echo "  Dev frontend:        http://${lan_ip}:3000"
  print_accounts
  warn "Нажмите Ctrl+C для остановки dev-серверов"
  wait
}

main() {
  echo ""
  echo -e "${CYAN}Knowledge Base — режим LAN-тестирования${NC}"
  echo ""

  case "${1:-}" in
    --stop)
      docker_lan_stop
      exit 0
      ;;
    --dev)
      dev_lan_up
      exit 0
      ;;
    -h|--help)
      sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    "")
      docker_lan_up
      ;;
    *)
      err "Неизвестный аргумент: $1 (см. $0 --help)"
      exit 1
      ;;
  esac
}

main "$@"
