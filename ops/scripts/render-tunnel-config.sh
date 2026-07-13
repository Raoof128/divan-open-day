#!/usr/bin/env bash
set -Eeuo pipefail

readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
readonly TEMPLATE="$SCRIPT_DIR/../cloudflared/config.yml.example"

hostname=''
tunnel_id=''
output=''

die() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 64
}

require_dns_hostname() {
  local value=$1
  local label
  local -a labels
  ((${#value} <= 253)) || die 'Hostname exceeds 253 characters.'
  [[ "$value" != *'..'* ]] || die 'Hostname contains an empty DNS label.'
  IFS='.' read -r -a labels <<<"$value"
  ((${#labels[@]} >= 2)) || die 'Hostname must contain at least two DNS labels.'
  for label in "${labels[@]}"; do
    [[ "$label" =~ ^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$ ]] \
      || die 'Hostname labels must be lowercase, 1-63 characters, and cannot start or end with a hyphen.'
  done
}

while (($# > 0)); do
  case "$1" in
    --hostname)
      (($# >= 2)) || die '--hostname requires a value.'
      hostname=$2
      shift 2
      ;;
    --tunnel-id)
      (($# >= 2)) || die '--tunnel-id requires a value.'
      tunnel_id=$2
      shift 2
      ;;
    --output)
      (($# >= 2)) || die '--output requires a value.'
      output=$2
      shift 2
      ;;
    *) die 'Unknown argument.' ;;
  esac
done

[[ "$hostname" =~ ^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$ ]] \
  || die 'Hostname must be a lowercase DNS name without a scheme, path, wildcard, or shell metacharacters.'
require_dns_hostname "$hostname"
[[ "$tunnel_id" =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$ ]] \
  || die 'Tunnel ID must be a lowercase canonical UUID.'
[[ "$output" == /* ]] || die 'Output path must be absolute.'
[[ ! -L "$output" ]] || die 'Output path must not be a symbolic link.'
[[ -d "$(dirname -- "$output")" ]] || die 'Output parent directory must exist.'

umask 077
temporary=$(mktemp "${output}.tmp.XXXXXX")
trap 'rm -f -- "$temporary"' EXIT

awk -v hostname="$hostname" -v tunnel_id="$tunnel_id" '
  { gsub(/__DIVAN_PUBLIC_HOSTNAME__/, hostname); gsub(/__DIVAN_TUNNEL_ID__/, tunnel_id); print }
' "$TEMPLATE" >"$temporary"

chmod 0400 "$temporary"
mv -f -- "$temporary" "$output"
trap - EXIT

# Production provisioning runs this renderer as root so the bind-mounted file
# is actually readable by the image's fixed non-root identity. A non-root local
# author may still inspect the deterministic output, but deployment preflight
# rejects it until this exact ownership is applied.
if [[ "$(id -u)" == 0 ]]; then
  chown 65532:65532 "$output"
else
  printf '%s\n' 'NOTICE: local output is not deployment-ready; root must chown 65532:65532.' >&2
fi
printf '%s\n' 'Rendered mode-0400 tunnel configuration without credential material.'
