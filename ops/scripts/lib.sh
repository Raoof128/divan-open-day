#!/usr/bin/env bash

readonly OPS_SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
readonly OPS_ROOT="$(cd -- "$OPS_SCRIPT_DIR/.." && pwd -P)"
readonly COMPOSE_FILE="$OPS_ROOT/compose.yml"
readonly DIVAN_TUNNEL_IMAGE='cloudflare/cloudflared:2026.7.0@sha256:5e49861633763e8933475477c20bae6039ed47f32c1d267a34babc347f28f0df'

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

canonical_path() {
  local path=$1
  local canonical
  canonical=$(realpath -- "$path") || die 'Unable to resolve a required path.'

  # macOS exposes /var and /tmp through stable system symlinks. Permit only
  # those OS aliases so local dry-run tests retain the same stricter rule that
  # Linux production paths receive.
  if [[ "$(uname -s)" == Darwin ]]; then
    case "$path" in
      /var/*|/tmp/*) path="/private$path" ;;
    esac
  fi
  [[ "$canonical" == "$path" ]] || die 'Path must be canonical and contain no symbolic-link components.'
  printf '%s\n' "$canonical"
}

require_absolute_regular_file_metadata() {
  local path=$1
  local label=$2
  [[ "$path" == /* ]] || die "$label path must be absolute."
  [[ ! -L "$path" ]] || die "$label path must not be a symbolic link."
  [[ -f "$path" ]] || die "$label file must exist and be a regular file."
  canonical_path "$path" >/dev/null
}

require_absolute_regular_file() {
  local path=$1
  local label=$2
  require_absolute_regular_file_metadata "$path" "$label"
  [[ -r "$path" ]] || die "$label file must be readable."
}

require_absolute_state_dir() {
  [[ "$COMMON_STATE_DIR" == /* ]] || die 'State directory path must be absolute.'
  [[ ! -L "$COMMON_STATE_DIR" ]] || die 'State directory must not be a symbolic link.'
  [[ -d "$COMMON_STATE_DIR" ]] || die 'State directory must already exist.'
  canonical_path "$COMMON_STATE_DIR" >/dev/null
  [[ "$(file_mode "$COMMON_STATE_DIR")" == 700 ]] \
    || die 'State directory must have exact mode 0700.'
  [[ "$(file_uid "$COMMON_STATE_DIR")" == "$(id -u)" ]] \
    || die 'State directory must be owned by the deployment identity.'
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

file_uid() {
  if stat -f '%u' -- "$1" >/dev/null 2>&1; then
    stat -f '%u' -- "$1"
  else
    stat -c '%u' -- "$1"
  fi
}

file_gid() {
  if stat -f '%g' -- "$1" >/dev/null 2>&1; then
    stat -f '%g' -- "$1"
  else
    stat -c '%g' -- "$1"
  fi
}

require_cloudflared_file() {
  local path=$1
  local label=$2
  # The deployment identity intentionally cannot read a mode-0400 file owned
  # by the fixed cloudflared UID. Validate metadata only; Docker performs the
  # read through the reviewed read-only bind mount as UID/GID 65532:65532.
  require_absolute_regular_file_metadata "$path" "$label"
  [[ "$(file_uid "$path")" == 65532 && "$(file_gid "$path")" == 65532 ]] \
    || die "$label must be owned by the cloudflared UID/GID 65532:65532."
  [[ "$(file_mode "$path")" == 400 ]] \
    || die "$label must have exact mode 0400."
}

validate_common_inputs() {
  [[ -n "$COMMON_IMAGE" ]] || die '--image is required.'
  [[ -n "$COMMON_STATE_DIR" ]] || die '--state-dir is required.'
  [[ -n "$COMMON_CONFIG" ]] || die '--config is required.'
  [[ -n "$COMMON_CREDENTIALS" ]] || die '--credentials is required.'
  require_immutable_image "$COMMON_IMAGE"
  require_absolute_state_dir

  if ((COMMON_DRY_RUN == 0)); then
    require_cloudflared_file "$COMMON_CONFIG" 'Tunnel configuration'
    require_cloudflared_file "$COMMON_CREDENTIALS" 'Tunnel credentials'
  else
    require_absolute_regular_file "$COMMON_CONFIG" 'Tunnel configuration'
    require_absolute_regular_file "$COMMON_CREDENTIALS" 'Tunnel credentials'
  fi

  if [[ -n "$COMMON_PUBLIC_ORIGIN" ]]; then
    [[ "$COMMON_PUBLIC_ORIGIN" =~ ^https://[a-z0-9]([a-z0-9.-]*[a-z0-9])?$ ]] \
      || die 'Public origin must be an HTTPS origin without a path, query, fragment, port, or credentials.'
    require_dns_hostname "${COMMON_PUBLIC_ORIGIN#https://}"
  elif ((COMMON_DRY_RUN == 0)); then
    die '--public-origin is required outside dry-run mode.'
  fi

}

require_runtime_tools() {
  local tool
  for tool in docker curl realpath; do
    command -v "$tool" >/dev/null 2>&1 || die "Required tool is unavailable: $tool"
  done
  docker compose version >/dev/null 2>&1 || die 'Docker Compose is unavailable.'
}

require_production_image() {
  local image=$1
  local build_mode
  local expected_digest
  local repo_digests
  require_immutable_image "$image"
  build_mode=$(docker image inspect \
    --format '{{index .Config.Labels "org.opencontainers.image.divan-build-mode"}}' \
    "$image") || die 'Candidate image is not present after the immutable pull.'
  [[ "$build_mode" == production ]] \
    || die 'Refusing an image that is not labelled as a production build.'

  expected_digest=${image##*@}
  repo_digests=$(docker image inspect --format '{{range .RepoDigests}}{{println .}}{{end}}' "$image") \
    || die 'Unable to inspect candidate image repository digests.'
  grep -Eq "@${expected_digest}$" <<<"$repo_digests" \
    || die 'Pulled image repository digest does not match the approved immutable reference.'
}

require_running_image() {
  local container_id=$1
  local image=$2
  local configured_image
  local expected_image_id
  local running_image_id
  local build_mode

  require_production_image "$image"
  configured_image=$(docker inspect --format '{{.Config.Image}}' "$container_id")
  [[ "$configured_image" == "$image" ]] \
    || die 'Running container configuration does not name the approved immutable image.'
  expected_image_id=$(docker image inspect --format '{{.Id}}' "$image")
  running_image_id=$(docker inspect --format '{{.Image}}' "$container_id")
  [[ "$running_image_id" == "$expected_image_id" ]] \
    || die 'Running container bytes do not match the approved immutable image.'
  build_mode=$(docker inspect \
    --format '{{index .Config.Labels "org.opencontainers.image.divan-build-mode"}}' \
    "$container_id")
  [[ "$build_mode" == production ]] \
    || die 'Running container is not labelled as a production build.'
}

compose() {
  DIVAN_WEB_IMAGE="$COMMON_IMAGE" \
    DIVAN_TUNNEL_CONFIG_FILE="$COMMON_CONFIG" \
    DIVAN_TUNNEL_CREDENTIALS_FILE="$COMMON_CREDENTIALS" \
    docker compose -f "$COMPOSE_FILE" "$@"
}

stop_unverified_stack() {
  notice 'Failing closed: stopping the unverified DIVAN tunnel and origin.' >&2
  if ! compose stop -t 10 cloudflared divan-web >/dev/null 2>&1; then
    notice 'WARNING: automatic stop did not complete; isolate the DIVAN route and escalate immediately.' >&2
  fi
}

write_state_file() {
  local destination=$1
  local value=$2
  local temporary
  [[ "$(dirname -- "$destination")" == "$COMMON_STATE_DIR" ]] \
    || die 'Release state destination escaped the reviewed state directory.'
  [[ ! -L "$destination" ]] \
    || die 'Release state destination must not be a symbolic link.'
  temporary=$(mktemp "${destination}.tmp.XXXXXX")
  chmod 0600 "$temporary"
  printf '%s\n' "$value" >"$temporary"
  mv -f -- "$temporary" "$destination"
}

read_immutable_state_file() {
  local path=$1
  local value
  require_absolute_regular_file "$path" 'Release state'
  [[ "$(dirname -- "$path")" == "$COMMON_STATE_DIR" ]] \
    || die 'Release state file escaped the reviewed state directory.'
  [[ "$(file_uid "$path")" == "$(id -u)" ]] \
    || die 'Release state file must be owned by the deployment identity.'
  [[ "$(file_mode "$path")" == 600 ]] \
    || die 'Release state file must have exact mode 0600.'
  IFS= read -r value <"$path" || die 'Release state file is empty.'
  require_immutable_image "$value"
  printf '%s\n' "$value"
}
