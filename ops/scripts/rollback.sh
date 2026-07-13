#!/usr/bin/env bash
set -Eeuo pipefail

readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

parse_common_args "$@"
[[ -n "$COMMON_STATE_DIR" ]] || die '--state-dir is required.'
require_absolute_state_dir

previous_file="$COMMON_STATE_DIR/previous-image.txt"
current_file="$COMMON_STATE_DIR/current-image.txt"
previous_image=$(read_immutable_state_file "$previous_file")
current_image=$(read_immutable_state_file "$current_file")
COMMON_IMAGE=$previous_image
validate_common_inputs

if ((COMMON_DRY_RUN == 1)); then
  notice "DRY-RUN: would reactivate previous immutable image $previous_image without rebuilding."
  notice 'DRY-RUN: would retain the current digest as the next rollback target only after health verification passes.'
  exit 0
fi

require_runtime_tools
COMMON_IMAGE=$current_image
compose config --quiet
compose pull divan-web || die 'Unable to pull the current restore image before rollback activation.'
require_production_image "$current_image"

COMMON_IMAGE=$previous_image
compose pull divan-web cloudflared || die 'Unable to pull the rollback target and reviewed tunnel before activation.'
require_production_image "$previous_image"

arm_fail_closed
if compose up -d --no-build --wait --wait-timeout 90 \
  && "$SCRIPT_DIR/verify.sh" \
    --image "$previous_image" \
    --state-dir "$COMMON_STATE_DIR" \
    --config "$COMMON_CONFIG" \
    --credentials "$COMMON_CREDENTIALS" \
    --public-origin "$COMMON_PUBLIC_ORIGIN"; then
  write_state_file "$current_file" "$previous_image"
  write_state_file "$previous_file" "$current_image"
  disarm_fail_closed
  notice "Rollback activated immutable image $previous_image."
  exit 0
fi

notice 'Rollback verification failed; restoring the current immutable image.' >&2
COMMON_IMAGE=$current_image
if compose up -d --no-build --wait --wait-timeout 90 \
  && "$SCRIPT_DIR/verify.sh" \
    --image "$current_image" \
    --state-dir "$COMMON_STATE_DIR" \
    --config "$COMMON_CONFIG" \
    --credentials "$COMMON_CREDENTIALS" \
    --public-origin "$COMMON_PUBLIC_ORIGIN"; then
  disarm_fail_closed
  die 'Rollback target failed verification; current image was restored and release state was not changed.'
fi
die 'Rollback and current-release restoration both failed verification; the fail-closed handler will stop the DIVAN stack.'
