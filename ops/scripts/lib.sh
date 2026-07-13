#!/usr/bin/env bash

readonly OPS_SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
readonly OPS_ROOT="$(cd -- "$OPS_SCRIPT_DIR/.." && pwd -P)"
readonly COMPOSE_FILE="$OPS_ROOT/compose.yml"

COMMON_IMAGE=''
COMMON_STATE_DIR=''
COMMON_CONFIG=''
COMMON_CREDENTIALS=''
COMMON_PUBLIC_ORIGIN=''
COMMON_DRY_RUN=0

die() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 64
}

notice() {
  printf '%s\n' "$1"
}

parse_common_args() {
  while (($# > 0)); do
    case "$1" in
      --image)
        (($# >= 2)) || die '--image requires a value.'
        COMMON_IMAGE=$2
        shift 2
        ;;
      --state-dir)
        (($# >= 2)) || die '--state-dir requires a value.'
        COMMON_STATE_DIR=$2
        shift 2
        ;;
      --config)
        (($# >= 2)) || die '--config requires a value.'
        COMMON_CONFIG=$2
        shift 2
        ;;
      --credentials)
        (($# >= 2)) || die '--credentials requires a value.'
        COMMON_CREDENTIALS=$2
        shift 2
        ;;
      --public-origin)
        (($# >= 2)) || die '--public-origin requires a value.'
        COMMON_PUBLIC_ORIGIN=$2
        shift 2
        ;;
      --dry-run)
        COMMON_DRY_RUN=1
        shift
        ;;
      *) die 'Unknown argument.' ;;
    esac
  done
}

require_immutable_image() {
  local image=$1
  [[ "$image" =~ ^[a-z0-9][a-z0-9._:/-]*(:[a-z0-9._-]+)?@sha256:[a-f0-9]{64}$ ]] \
    || die 'Image must be a lowercase immutable registry reference ending in @sha256:<64 lowercase hex characters>.'
}

require_absolute_regular_file() {
  local path=$1
  local label=$2
  [[ "$path" == /* ]] || die "$label path must be absolute."
  [[ ! -L "$path" ]] || die "$label path must not be a symbolic link."
  [[ -f "$path" && -r "$path" ]] || die "$label file must exist and be readable."
}

require_absolute_state_dir() {
  [[ "$COMMON_STATE_DIR" == /* ]] || die 'State directory path must be absolute.'
  [[ ! -L "$COMMON_STATE_DIR" ]] || die 'State directory must not be a symbolic link.'
  [[ -d "$COMMON_STATE_DIR" ]] || die 'State directory must already exist.'
}

require_dns_hostname() {
  local hostname=$1
  local label
  local -a labels
  ((${#hostname} <= 253)) || die 'DNS hostname exceeds 253 characters.'
  [[ "$hostname" != *'..'* ]] || die 'DNS hostname contains an empty label.'
  IFS='.' read -r -a labels <<<"$hostname"
  ((${#labels[@]} >= 2)) || die 'DNS hostname must contain at least two labels.'
  for label in "${labels[@]}"; do
    [[ "$label" =~ ^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$ ]] \
      || die 'DNS hostname labels must be lowercase, 1-63 characters, and cannot start or end with a hyphen.'
  done
}

file_mode() {
  if stat -f '%Lp' -- "$1" >/dev/null 2>&1; then
    stat -f '%Lp' -- "$1"
  else
    stat -c '%a' -- "$1"
  fi
}

validate_common_inputs() {
  [[ -n "$COMMON_IMAGE" ]] || die '--image is required.'
  [[ -n "$COMMON_STATE_DIR" ]] || die '--state-dir is required.'
  [[ -n "$COMMON_CONFIG" ]] || die '--config is required.'
  [[ -n "$COMMON_CREDENTIALS" ]] || die '--credentials is required.'
  require_immutable_image "$COMMON_IMAGE"
  require_absolute_state_dir
  require_absolute_regular_file "$COMMON_CONFIG" 'Tunnel configuration'
  require_absolute_regular_file "$COMMON_CREDENTIALS" 'Tunnel credentials'

  if [[ -n "$COMMON_PUBLIC_ORIGIN" ]]; then
    [[ "$COMMON_PUBLIC_ORIGIN" =~ ^https://[a-z0-9]([a-z0-9.-]*[a-z0-9])?$ ]] \
      || die 'Public origin must be an HTTPS origin without a path, query, fragment, port, or credentials.'
    require_dns_hostname "${COMMON_PUBLIC_ORIGIN#https://}"
  elif ((COMMON_DRY_RUN == 0)); then
    die '--public-origin is required outside dry-run mode.'
  fi

  if ((COMMON_DRY_RUN == 0)); then
    local mode
    mode=$(file_mode "$COMMON_CREDENTIALS")
    [[ "$mode" =~ ^[0-4]00$ ]] || die 'Tunnel credentials must be owner-readable only (0400 or stricter).'
  fi
}

require_runtime_tools() {
  local tool
  for tool in docker curl; do
    command -v "$tool" >/dev/null 2>&1 || die "Required tool is unavailable: $tool"
  done
  docker compose version >/dev/null 2>&1 || die 'Docker Compose is unavailable.'
}

compose() {
  DIVAN_WEB_IMAGE="$COMMON_IMAGE" \
    DIVAN_TUNNEL_CONFIG_FILE="$COMMON_CONFIG" \
    DIVAN_TUNNEL_CREDENTIALS_FILE="$COMMON_CREDENTIALS" \
    docker compose -f "$COMPOSE_FILE" "$@"
}

write_state_file() {
  local destination=$1
  local value=$2
  local temporary
  temporary=$(mktemp "${destination}.tmp.XXXXXX")
  chmod 0600 "$temporary"
  printf '%s\n' "$value" >"$temporary"
  mv -f -- "$temporary" "$destination"
}

read_immutable_state_file() {
  local path=$1
  local value
  require_absolute_regular_file "$path" 'Release state'
  IFS= read -r value <"$path" || die 'Release state file is empty.'
  require_immutable_image "$value"
  printf '%s\n' "$value"
}
