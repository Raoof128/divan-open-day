#!/usr/bin/env bash
set -Eeuo pipefail

readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

parse_common_args "$@"
validate_common_inputs

if ((COMMON_DRY_RUN == 1)); then
  notice 'DRY-RUN: would verify Compose rendering, private health, immutable release checksums, non-root/read-only/capability/network state, and zero host-published ports.'
  notice 'DRY-RUN: would require public /healthz denial plus CSP, security, cache, and release checks; neighbouring-service and provider-log baselines remain documented operator gates.'
  exit 0
fi

require_runtime_tools
compose config --quiet

web_id=$(compose ps -q divan-web)
tunnel_id=$(compose ps -q cloudflared)
[[ -n "$web_id" && -n "$tunnel_id" ]] || die 'Both deployment containers must exist.'

[[ "$(docker inspect --format '{{.State.Health.Status}}' "$web_id")" == healthy ]] \
  || die 'Private origin container is not healthy.'
[[ "$(docker inspect --format '{{.HostConfig.ReadonlyRootfs}}' "$web_id")" == true ]] \
  || die 'Private origin root filesystem is not read-only.'
[[ "$(docker inspect --format '{{.Config.User}}' "$web_id")" == 10001:10001 ]] \
  || die 'Private origin user is not the reviewed UID/GID.'
[[ "$(docker inspect --format '{{json .HostConfig.CapDrop}}' "$web_id")" == '["ALL"]' ]] \
  || die 'Private origin capabilities are not fully dropped.'
[[ "$(docker inspect --format '{{json .NetworkSettings.Ports}}' "$web_id")" != *'HostPort'* ]] \
  || die 'Private origin unexpectedly publishes a host port.'

web_networks=$(docker inspect --format '{{range $name, $_ := .NetworkSettings.Networks}}{{$name}} {{end}}' "$web_id")
tunnel_networks=$(docker inspect --format '{{range $name, $_ := .NetworkSettings.Networks}}{{$name}} {{end}}' "$tunnel_id")
[[ "$web_networks" == 'divan_origin ' ]] || die 'Private origin network membership is not isolated.'
[[ "$tunnel_networks" == *'divan_origin '* && "$tunnel_networks" == *'divan_egress '* ]] \
  || die 'Tunnel network membership is incomplete.'

compose exec -T divan-web /usr/local/bin/divan-health >/dev/null

health_status=$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' "$COMMON_PUBLIC_ORIGIN/healthz")
[[ "$health_status" == 404 ]] || die 'Public health path is not denied with 404.'

headers_file=$(mktemp)
trap 'rm -f -- "$headers_file"' EXIT
curl --fail --silent --show-error --dump-header "$headers_file" --output /dev/null "$COMMON_PUBLIC_ORIGIN/"
grep -Fqi 'content-security-policy:' "$headers_file" || die 'Public CSP header is missing.'
grep -Fqi "default-src 'none'" "$headers_file" || die 'Public CSP does not fail closed.'
grep -Fqi 'cache-control: no-cache, must-revalidate' "$headers_file" || die 'Public document cache header is incorrect.'
grep -Fqi 'x-content-type-options: nosniff' "$headers_file" || die 'Public nosniff header is missing.'

notice 'Automated private and public deployment checks passed.'
notice 'OPERATOR GATE: compare neighbouring-service baselines and review provider logging/retention evidence before launch.'
