#!/usr/bin/env bash
set -Eeuo pipefail

readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

parse_common_args "$@"
validate_common_inputs

if ((COMMON_DRY_RUN == 1)); then
  notice 'DRY-RUN: validated immutable image, state, tunnel configuration, and credential boundaries.'
  notice 'DRY-RUN: would validate Docker Compose without pulling, building, starting, or changing services.'
  exit 0
fi

require_runtime_tools
compose config --quiet
notice 'Preflight passed without changing running services.'
