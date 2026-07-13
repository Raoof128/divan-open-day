#!/usr/bin/env bash
set -Eeuo pipefail

readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

parse_common_args "$@"
validate_common_inputs
candidate_image=$COMMON_IMAGE

if ((COMMON_DRY_RUN == 1)); then
  notice "DRY-RUN: would pull and activate immutable candidate $COMMON_IMAGE without a server-side build."
  notice 'DRY-RUN: would preserve the current image, wait for health, run verification, and restore the previous digest on failure.'
  exit 0
fi

require_runtime_tools
compose config --quiet

current_file="$COMMON_STATE_DIR/current-image.txt"
previous_file="$COMMON_STATE_DIR/previous-image.txt"
previous_image=''
if [[ -f "$current_file" ]]; then
  previous_image=$(read_immutable_state_file "$current_file")
fi

if [[ -n "$previous_image" ]]; then
  COMMON_IMAGE=$previous_image
  compose pull divan-web || die 'Unable to pull the saved restore image before activation.'
  require_production_image "$previous_image"
fi

COMMON_IMAGE=$candidate_image
compose pull divan-web cloudflared || die 'Unable to pull the candidate image and reviewed tunnel before activation.'
require_production_image "$candidate_image"

arm_fail_closed
if compose up -d --no-build --wait --wait-timeout 90 \
  && "$SCRIPT_DIR/verify.sh" \
    --image "$candidate_image" \
    --state-dir "$COMMON_STATE_DIR" \
    --config "$COMMON_CONFIG" \
    --credentials "$COMMON_CREDENTIALS" \
    --public-origin "$COMMON_PUBLIC_ORIGIN"; then
  if [[ -n "$previous_image" && "$previous_image" != "$candidate_image" ]]; then
    write_state_file "$previous_file" "$previous_image"
  fi
  write_state_file "$current_file" "$candidate_image"
  disarm_fail_closed
  notice "Activated immutable image $candidate_image."
  exit 0
fi

if [[ -n "$previous_image" ]]; then
  notice 'Candidate verification failed; restoring the previous immutable image.' >&2
  COMMON_IMAGE=$previous_image
  if compose up -d --no-build --wait --wait-timeout 90 \
    && "$SCRIPT_DIR/verify.sh" \
      --image "$previous_image" \
      --state-dir "$COMMON_STATE_DIR" \
      --config "$COMMON_CONFIG" \
      --credentials "$COMMON_CREDENTIALS" \
      --public-origin "$COMMON_PUBLIC_ORIGIN"; then
    disarm_fail_closed
    die 'Candidate deployment failed; the previous verified release was restored.'
  fi
fi
die 'Candidate failed and no verified restoration is active; the fail-closed handler will stop the DIVAN stack.'
