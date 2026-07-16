#!/usr/bin/env bash
set -Eeuo pipefail

readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

readonly TARGET_CSP="default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data: blob:; media-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none';"
readonly TARGET_PERMISSIONS='camera=(), microphone=(), geolocation=(), accelerometer=(), gyroscope=(), magnetometer=(), payment=(), usb=()'
readonly -a CURL_HTTPS_ARGS=(
  --proto '=https'
  --tlsv1.2
  --connect-timeout 5
  --max-time 20
  --max-filesize 110000000
  --silent
  --show-error
)

parse_common_args "$@"
validate_common_inputs

if ((COMMON_DRY_RUN == 1)); then
  notice 'DRY-RUN: would verify both exact running image digests, production labels/release flags, private health, checksums, hardening, mounts, exact networks, and zero host-published ports.'
  notice 'DRY-RUN: would enforce bounded HTTPS-only public checks for /healthz denial, every locked browser header, cache matrix, release/content/asset-manifest hashes, production flags, and item counts.'
  notice 'DRY-RUN: image labels and release bytes are verified only after the immutable pull; dry-run never claims that evidence.'
  exit 0
fi

require_runtime_tools
compose config --quiet

inspect_exact() {
  local container_id=$1
  local format=$2
  local expected=$3
  local label=$4
  local actual
  actual=$(docker inspect --format "$format" "$container_id")
  [[ "$actual" == "$expected" ]] || die "$label does not match the reviewed runtime contract."
}

sorted_networks() {
  docker inspect \
    --format '{{range $name, $_ := .NetworkSettings.Networks}}{{$name}}{{"\n"}}{{end}}' \
    "$1" | LC_ALL=C sort | paste -sd' ' -
}

require_hardened_container() {
  local container_id=$1
  local expected_user=$2
  local expected_networks=$3
  local expected_ports=$4
  local expected_memory=$5
  local expected_nano_cpus=$6
  local expected_pids=$7

  inspect_exact "$container_id" '{{.State.Status}}' running 'Container state'
  inspect_exact "$container_id" '{{.HostConfig.ReadonlyRootfs}}' true 'Read-only root filesystem'
  inspect_exact "$container_id" '{{.Config.User}}' "$expected_user" 'Container UID/GID'
  inspect_exact "$container_id" '{{json .HostConfig.CapDrop}}' '["ALL"]' 'Dropped capabilities'
  inspect_exact "$container_id" '{{json .HostConfig.SecurityOpt}}' '["no-new-privileges:true"]' 'no-new-privileges setting'
  inspect_exact "$container_id" '{{.HostConfig.RestartPolicy.Name}}' unless-stopped 'Restart policy'
  inspect_exact "$container_id" '{{.HostConfig.Memory}}' "$expected_memory" 'Memory limit'
  inspect_exact "$container_id" '{{.HostConfig.NanoCpus}}' "$expected_nano_cpus" 'CPU limit'
  inspect_exact "$container_id" '{{.HostConfig.PidsLimit}}' "$expected_pids" 'PID limit'
  inspect_exact "$container_id" '{{json .HostConfig.PortBindings}}' '{}' 'Host port bindings'
  inspect_exact "$container_id" '{{json .NetworkSettings.Ports}}' "$expected_ports" 'Runtime port map'
  [[ "$(sorted_networks "$container_id")" == "$expected_networks" ]] \
    || die 'Container network membership is not exact.'
}

require_running_immutable_tunnel() {
  local container_id=$1
  local image
  local expected_digest
  local expected_id
  local running_id
  local repo_digests

  image=$(docker inspect --format '{{.Config.Image}}' "$container_id")
  [[ "$image" == "$DIVAN_TUNNEL_IMAGE" ]] \
    || die 'Running tunnel configuration does not name the reviewed immutable image.'
  require_immutable_image "$image"
  expected_digest=${image##*@}
  expected_id=$(docker image inspect --format '{{.Id}}' "$image")
  running_id=$(docker inspect --format '{{.Image}}' "$container_id")
  [[ "$running_id" == "$expected_id" ]] || die 'Running tunnel bytes do not match its immutable image reference.'
  repo_digests=$(docker image inspect --format '{{range .RepoDigests}}{{println .}}{{end}}' "$image")
  grep -Eq "@${expected_digest}$" <<<"$repo_digests" \
    || die 'Running tunnel repository digest does not match its immutable reference.'
}

header_value() {
  local file=$1
  local name=$2
  awk -v wanted="$name" '
    BEGIN { wanted = tolower(wanted) }
    {
      line = $0
      sub(/\r$/, "", line)
      separator = index(line, ":")
      if (separator > 0 && tolower(substr(line, 1, separator - 1)) == wanted) {
        value = substr(line, separator + 1)
        sub(/^[[:space:]]+/, "", value)
        found = value
      }
    }
    END { if (found != "") print found }
  ' "$file"
}

require_header_exact() {
  local file=$1
  local name=$2
  local expected=$3
  [[ "$(header_value "$file" "$name")" == "$expected" ]] \
    || die "$name header does not match the exact release contract."
}

require_global_headers() {
  local file=$1
  local server
  require_header_exact "$file" 'Content-Security-Policy' "$TARGET_CSP"
  require_header_exact "$file" 'X-Content-Type-Options' 'nosniff'
  require_header_exact "$file" 'Referrer-Policy' 'no-referrer'
  require_header_exact "$file" 'Cross-Origin-Opener-Policy' 'same-origin'
  require_header_exact "$file" 'Cross-Origin-Resource-Policy' 'same-origin'
  require_header_exact "$file" 'Permissions-Policy' "$TARGET_PERMISSIONS"
  server=$(header_value "$file" 'Server')
  [[ "${server,,}" != *caddy* ]] || die 'Public Server header exposes the origin implementation.'
}

fetch_public() {
  local path=$1
  local headers=$2
  local body=$3
  curl "${CURL_HTTPS_ARGS[@]}" --fail --dump-header "$headers" --output "$body" \
    "$COMMON_PUBLIC_ORIGIN$path"
}

web_id=$(compose ps -q divan-web)
tunnel_id=$(compose ps -q cloudflared)
[[ -n "$web_id" && -n "$tunnel_id" ]] || die 'Both deployment containers must exist.'

require_running_image "$web_id" "$COMMON_IMAGE"
require_running_immutable_tunnel "$tunnel_id"
# The upstream Caddy image retains EXPOSE metadata for its stock ports even
# though this config disables those listeners. Exact empty PortBindings proves
# none are host-published; the full metadata map prevents an unreviewed change.
require_hardened_container "$web_id" '10001:10001' 'divan_origin' '{"2019/tcp":null,"443/tcp":null,"443/udp":null,"80/tcp":null,"8080/tcp":null}' '268435456' '500000000' '128'
require_hardened_container "$tunnel_id" '65532:65532' 'divan_egress divan_origin' '{}' '134217728' '250000000' '64'
inspect_exact "$web_id" '{{.State.Health.Status}}' healthy 'Private origin health'
inspect_exact "$web_id" '{{json .HostConfig.Tmpfs}}' '{"/config":"rw,noexec,nosuid,nodev,size=8m,uid=10001,gid=10001,mode=0700","/data":"rw,noexec,nosuid,nodev,size=8m,uid=10001,gid=10001,mode=0700","/tmp":"rw,noexec,nosuid,nodev,size=16m,mode=1777"}' 'Private origin tmpfs'
inspect_exact "$tunnel_id" '{{json .HostConfig.Tmpfs}}' '{"/tmp":"rw,noexec,nosuid,nodev,size=8m,mode=1777"}' 'Tunnel tmpfs'

inspect_exact_network() {
  local network=$1
  local expected_internal=$2
  local expected_role=$3
  [[ "$(docker network inspect --format '{{.Driver}}' "$network")" == bridge ]] \
    || die "$network does not use the reviewed bridge driver."
  [[ "$(docker network inspect --format '{{.Internal}}' "$network")" == "$expected_internal" ]] \
    || die "$network internal setting does not match the reviewed isolation contract."
  [[ "$(docker network inspect --format '{{index .Labels "org.persiansocietyeoi.divan.network-role"}}' "$network")" == "$expected_role" ]] \
    || die "$network role label does not match the reviewed isolation contract."
  [[ "$(docker network inspect --format '{{index .Labels "org.persiansocietyeoi.divan.scope"}}' "$network")" == dedicated ]] \
    || die "$network is not labelled as dedicated to DIVAN."
  [[ "$(docker network inspect --format '{{index .Labels "com.docker.compose.project"}}' "$network")" == divan ]] \
    || die "$network is not owned by the reviewed Compose project."
}

inspect_exact_network divan_origin true origin
inspect_exact_network divan_egress false egress

origin_members=$(docker network inspect \
  --format '{{range $id, $_ := .Containers}}{{$id}}{{"\n"}}{{end}}' \
  divan_origin | LC_ALL=C sort)
expected_origin_members=$(printf '%s\n%s\n' "$tunnel_id" "$web_id" | LC_ALL=C sort)
require_exact_network_members "$origin_members" "$expected_origin_members" 'Origin'

egress_members=$(docker network inspect \
  --format '{{range $id, $_ := .Containers}}{{$id}}{{"\n"}}{{end}}' \
  divan_egress | LC_ALL=C sort)
require_exact_network_members "$egress_members" "$tunnel_id" 'Egress'

web_mounts=$(docker inspect \
  --format '{{range .Mounts}}{{.Source}}|{{.Destination}}|{{.RW}}|{{.Type}}{{"\n"}}{{end}}' \
  "$web_id" | LC_ALL=C sort)
require_no_web_mounts "$web_mounts"

tunnel_mounts=$(docker inspect \
  --format '{{range .Mounts}}{{.Source}}|{{.Destination}}|{{.RW}}|{{.Type}}{{"\n"}}{{end}}' \
  "$tunnel_id" | LC_ALL=C sort)
config_source=$(canonical_path "$COMMON_CONFIG")
credentials_source=$(canonical_path "$COMMON_CREDENTIALS")
require_exact_tunnel_mounts "$tunnel_mounts" "$config_source" "$credentials_source"

# This proves both production release flags, content/asset paths, minimum counts,
# and both hashes from the same read-only filesystem before any public checks.
compose exec -T divan-web /usr/local/bin/divan-health >/dev/null

work_dir=$(mktemp -d)
trap 'rm -rf -- "$work_dir"' EXIT

compose exec -T divan-web cat /srv/release.json >"$work_dir/running-release.json" \
  || die 'Unable to read the release pointer from the running image.'
running_release_bytes=$(wc -c <"$work_dir/running-release.json" | tr -d ' ')
((running_release_bytes > 0 && running_release_bytes <= 65536)) \
  || die 'Running image release pointer has an invalid size.'

health_status=$(curl "${CURL_HTTPS_ARGS[@]}" --output /dev/null --write-out '%{http_code}' \
  "$COMMON_PUBLIC_ORIGIN/healthz")
[[ "$health_status" == 404 ]] || die 'Public health path is not denied with exact status 404.'

fetch_public '/' "$work_dir/document.headers" "$work_dir/index.html"
require_global_headers "$work_dir/document.headers"
require_header_exact "$work_dir/document.headers" 'Cache-Control' 'no-cache, must-revalidate'

fetch_public '/release.json' "$work_dir/release.headers" "$work_dir/release.json"
require_global_headers "$work_dir/release.headers"
require_header_exact "$work_dir/release.headers" 'Cache-Control' 'no-cache, must-revalidate'
require_matching_release_files "$work_dir/running-release.json" "$work_dir/release.json"

release_id=$(extract_json_string "$work_dir/release.json" releaseId)
schema_version=$(extract_json_integer "$work_dir/release.json" schemaVersion)
build_profile=$(extract_json_string "$work_dir/release.json" buildProfile)
production_eligible=$(extract_json_boolean "$work_dir/release.json" productionEligible)
content_path=$(extract_json_string "$work_dir/release.json" contentPath)
content_sha=$(extract_json_string "$work_dir/release.json" contentSha256)
asset_manifest_path=$(extract_json_string "$work_dir/release.json" assetManifestPath)
asset_manifest_sha=$(extract_json_string "$work_dir/release.json" assetManifestSha256)
hafez_count=$(extract_json_integer "$work_dir/release.json" hafezCount)
rumi_count=$(extract_json_integer "$work_dir/release.json" rumiCount)
item_count=$(extract_json_integer "$work_dir/release.json" itemCount)

[[ "$release_id" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ && "$schema_version" == 2 && "$build_profile" == production && "$production_eligible" == true ]] \
  || die 'Public release pointer is not explicitly production eligible.'
[[ "$content_path" =~ ^/content/[a-f0-9]{64}\.json$ && "$content_sha" =~ ^[a-f0-9]{64}$ ]] \
  || die 'Public content pointer is not content addressed.'
[[ "$content_path" == "/content/${content_sha}.json" ]] \
  || die 'Public content path does not match release.json contentSha256.'
[[ "$asset_manifest_path" =~ ^/assets/[a-f0-9]{64}\.json$ && "$asset_manifest_sha" =~ ^[a-f0-9]{64}$ ]] \
  || die 'Public asset manifest pointer is not content addressed.'
[[ "$asset_manifest_path" == "/assets/${asset_manifest_sha}.json" ]] \
  || die 'Public asset manifest path does not match release.json assetManifestSha256.'
[[ "$hafez_count" =~ ^[0-9]+$ && "$rumi_count" =~ ^[0-9]+$ && "$item_count" =~ ^[0-9]+$ ]] \
  || die 'Public release counts are missing or malformed.'
((hafez_count == 60 && rumi_count == 60 && item_count == 120 && item_count == hafez_count + rumi_count)) \
  || die 'Public release counts do not match the exact 60 Hafez / 60 Rumi / 120-item contract.'

fetch_public "$content_path" "$work_dir/content.headers" "$work_dir/content.json"
require_global_headers "$work_dir/content.headers"
require_header_exact "$work_dir/content.headers" 'Cache-Control' 'public, max-age=31536000, immutable'
[[ "$(sha256_file "$work_dir/content.json")" == "$content_sha" ]] \
  || die 'Public content bytes do not match release.json contentSha256.'
corpus_release_id=$(extract_json_string "$work_dir/content.json" releaseId)
[[ "$corpus_release_id" == "$release_id" ]] \
  || die 'Public corpus belongs to another release.'

actual_hafez=$(awk '{ count += gsub(/"poet":"hafez"/, "&") } END { print count + 0 }' "$work_dir/content.json")
actual_rumi=$(awk '{ count += gsub(/"poet":"rumi"/, "&") } END { print count + 0 }' "$work_dir/content.json")
actual_items=$(awk '{ count += gsub(/"contentHash":/, "&") } END { print count + 0 }' "$work_dir/content.json")
[[ "$actual_hafez" == "$hafez_count" && "$actual_rumi" == "$rumi_count" && "$actual_items" == "$item_count" ]] \
  || die 'Public corpus item and poet counts do not match release.json.'

fetch_public "$asset_manifest_path" "$work_dir/assets.headers" "$work_dir/assets.json"
require_global_headers "$work_dir/assets.headers"
require_header_exact "$work_dir/assets.headers" 'Cache-Control' 'public, max-age=31536000, immutable'
[[ "$(sha256_file "$work_dir/assets.json")" == "$asset_manifest_sha" ]] \
  || die 'Public asset manifest bytes do not match release.json assetManifestSha256.'
[[ "$(extract_json_string "$work_dir/assets.json" releaseId)" == "$release_id" ]] \
  || die 'Public asset manifest belongs to another release.'

fetch_public '/service-worker.js' "$work_dir/worker.headers" "$work_dir/service-worker.js"
require_global_headers "$work_dir/worker.headers"
require_header_exact "$work_dir/worker.headers" 'Cache-Control' 'no-cache, must-revalidate'
fetch_public '/manifest.webmanifest' "$work_dir/manifest.headers" "$work_dir/manifest.webmanifest"
require_global_headers "$work_dir/manifest.headers"
require_header_exact "$work_dir/manifest.headers" 'Cache-Control' 'public, max-age=3600'

missing_status=$(curl "${CURL_HTTPS_ARGS[@]}" --dump-header "$work_dir/missing.headers" \
  --output /dev/null --write-out '%{http_code}' "$COMMON_PUBLIC_ORIGIN/assets/not-content-addressed.js")
[[ "$missing_status" == 404 ]] || die 'Missing unhashed static path did not remain an exact 404.'
require_global_headers "$work_dir/missing.headers"
require_header_exact "$work_dir/missing.headers" 'Cache-Control' 'no-store'

missing_hashed_status=$(curl "${CURL_HTTPS_ARGS[@]}" --dump-header "$work_dir/missing-hashed.headers" \
  --output /dev/null --write-out '%{http_code}' "$COMMON_PUBLIC_ORIGIN/assets/missing-deadbeef.js")
[[ "$missing_hashed_status" == 404 ]] || die 'Missing hashed static path did not remain an exact 404.'
require_global_headers "$work_dir/missing-hashed.headers"
require_header_exact "$work_dir/missing-hashed.headers" 'Cache-Control' 'no-store'

notice 'Automated private and public deployment checks passed.'
notice 'OPERATOR GATE: compare neighbouring-service baselines and review provider logging/retention evidence before launch.'
