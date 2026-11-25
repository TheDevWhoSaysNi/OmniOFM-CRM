#!/usr/bin/env bash
# run.sh - run OmniOFM CRM locally (api + web).
#
#   ./run.sh setup            install deps and create .env files from examples
#   ./run.sh start [app...]   restart apps (default: api web) and follow logs
#   ./run.sh restart [app...] same as start
#   ./run.sh stop [app...]    stop apps
#   ./run.sh status           show running status per app
#   ./run.sh logs [app...]    follow logs without restarting
#   ./run.sh test             run workspace tests

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_DIR="$ROOT/.run"
LOG_DIR="$RUN_DIR/logs"
APPS="api web"

log()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m!!\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31mxx\033[0m %s\n' "$*" >&2; exit 1; }

app_dir() {
  case "$1" in
    api) echo "$ROOT/apps/api" ;;
    web) echo "$ROOT/apps/web" ;;
    *) die "Unknown app '$1'. Use: $APPS" ;;
  esac
}

app_env() {
  if [[ "$1" == web ]]; then echo "$(app_dir "$1")/.env.local"; else echo "$(app_dir "$1")/.env"; fi
}

app_port() {
  local env port
  env="$(app_env "$1")"
  if [[ -f "$env" ]]; then
    port="$(grep -E '^PORT=[0-9]+$' "$env" | tail -1 | cut -d= -f2)"
    if [[ -n "$port" ]]; then echo "$port"; return 0; fi
  fi
  if [[ "$1" == web ]]; then echo 4100; else echo 4001; fi
}

app_health() {
  if [[ "$1" == web ]]; then echo "/"; else echo "/health"; fi
}

app_pid() { echo "$RUN_DIR/$1.pid"; }
app_log() { echo "$LOG_DIR/$1.log"; }

ensure_env() {
  local name="$1" env ex
  env="$(app_env "$name")"
  ex="$(app_dir "$name")/.env.example"
  if [[ ! -f "$env" && -f "$ex" ]]; then
    cp "$ex" "$env"
    log "Created ${env#"$ROOT/"} from .env.example"
  fi
}

free_port() {
  local port="$1" pids
  pids="$(lsof -ti "tcp:$port" -sTCP:LISTEN 2>/dev/null || true)"
  [[ -z "$pids" ]] && return 0
  kill $pids 2>/dev/null || true
  sleep 0.5
  pids="$(lsof -ti "tcp:$port" -sTCP:LISTEN 2>/dev/null || true)"
  [[ -n "$pids" ]] && kill -9 $pids 2>/dev/null || true
}

stop_app() {
  local name="$1" pid_file pid
  pid_file="$(app_pid "$name")"
  if [[ -f "$pid_file" ]]; then
    pid="$(cat "$pid_file" 2>/dev/null || true)"
    [[ -n "$pid" ]] && kill "$pid" 2>/dev/null || true
    rm -f "$pid_file"
  fi
  free_port "$(app_port "$name")"
}

start_app() {
  local name="$1" dir port health log_file pid_file url waited=0
  dir="$(app_dir "$name")"
  ensure_env "$name"
  port="$(app_port "$name")"
  health="$(app_health "$name")"
  log_file="$(app_log "$name")"
  pid_file="$(app_pid "$name")"
  url="http://127.0.0.1:$port"

  mkdir -p "$RUN_DIR" "$LOG_DIR"
  stop_app "$name"

  if [[ "$name" == web ]]; then
    ( cd "$dir" && exec npm run dev ) >>"$log_file" 2>&1 &
  else
    ( cd "$dir" && exec node --watch src/server.ts ) >>"$log_file" 2>&1 &
  fi
  echo $! >"$pid_file"

  while [[ "$waited" -lt 60 ]]; do
    if curl -fsS -o /dev/null "$url$health" 2>/dev/null; then
      log "$name up on $url"
      return 0
    fi
    if ! kill -0 "$(cat "$pid_file")" 2>/dev/null; then
      warn "$name exited. Last lines of $log_file:"
      tail -25 "$log_file" >&2 || true
      return 1
    fi
    sleep 1
    waited=$((waited + 1))
  done
  warn "$name did not answer on $url$health within 60s"
  return 1
}

cmd_setup() {
  command -v node >/dev/null || die "Node.js 22+ is required"
  log "Installing dependencies ..."
  ( cd "$ROOT" && npm install )
  for name in $APPS; do ensure_env "$name"; done
  log "Setup complete. Next: ./run.sh start"
}

cmd_status() {
  for name in $APPS; do
    local port pid="down"
    port="$(app_port "$name")"
    if lsof -ti "tcp:$port" -sTCP:LISTEN >/dev/null 2>&1; then pid="up"; fi
    printf '  %-6s  http://127.0.0.1:%-5s  %s\n' "$name" "$port" "$pid"
  done
}

cmd="${1:-help}"
shift || true
targets=("${@:-$APPS}")
if [[ $# -eq 0 ]]; then targets=($APPS); fi

case "$cmd" in
  setup)   cmd_setup ;;
  start|restart)
    for name in "${targets[@]}"; do start_app "$name"; done
    log "Logs in $LOG_DIR"
    ;;
  stop)
    for name in "${targets[@]}"; do stop_app "$name" && log "stopped $name"; done
    ;;
  status)  cmd_status ;;
  logs)
    files=(); for name in "${targets[@]}"; do touch "$(app_log "$name")"; files+=("$(app_log "$name")"); done
    tail -n 20 -f "${files[@]}"
    ;;
  test)    ( cd "$ROOT" && npm test ) ;;
  *)
    sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//'
    ;;
esac
