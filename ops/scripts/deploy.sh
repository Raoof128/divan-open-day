#!/usr/bin/env bash
set -Eeuo pipefail

readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

parse_common_args "$@"
validate_common_inputs

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

if compose pull divan-web cloudflared \
  && require_production_image "$COMMON_IMAGE" \
  && compose up -d --no-build --wait --wait-timeout 90 \
  && "$SCRIPT_DIR/verify.sh" \
    --image "$COMMON_IMAGE" \
    --state-dir "$COMMON_STATE_DIR" \
    --config "$COMMON_CONFIG" \
    --credentials "$COMMON_CREDENTIALS" \
    --public-origin "$COMMON_PUBLIC_ORIGIN"; then
  if [[ -n "$previous_image" && "$previous_image" != "$COMMON_IMAGE" ]]; then
    write_state_file "$previous_file" "$previous_image"
  fi
  write_state_file "$current_file" "$COMMON_IMAGE"
  notice "Activated immutable image $COMMON_IMAGE."
  exit 0
fi

if [[ -n "$previous_image" ]]; then
  notice 'Candidate verification failed; restoring the previous immutable image.' >&2
  COMMON_IMAGE=$previous_image
  require_production_image "$previous_image"
  if ! compose up -d --no-build --wait --wait-timeout 90 \
    || ! "$SCRIPT_DIR/verify.sh" \
      --image "$previous_image" \
      --state-dir "$COMMON_STATE_DIR" \
      --config "$COMMON_CONFIG" \
      --credentials "$COMMON_CREDENTIALS" \
      --public-origin "$COMMON_PUBLIC_ORIGIN"; then
    stop_unverified_stack
    die 'Candidate failed and bounded restoration of the previous release did not verify; escalate immediately.'
  fi
else
  stop_unverified_stack
fi
die 'Candidate deployment failed and was not accepted.'
