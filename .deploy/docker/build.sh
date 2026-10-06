#!/usr/bin/env bash
set -euo pipefail

# Builds the real (non-hot-reload) staging images - see ../../Api/.deploy/docker/Dockerfile.staging
# and ../../Front/.deploy/docker/Dockerfile.staging. Used to produce the images that
# docker-compose.staging.yml runs.
#
# API_HOST is baked into the front JS bundle at build time, so it must be known here, not just at
# container-run time. Defaults to empty (same-origin) since caddy now fronts both api/front on one
# domain, path-based (see docker-compose.staging.yml/Caddyfile.staging) - only override it if front
# is ever served from a different origin than the API sits behind.
#
# Usage:
#   ./build.sh                    # builds api + front, tag = git short SHA (fallback: latest)
#   ./build.sh api                # builds only the api image
#   ./build.sh front               # builds only the front image
#   ./build.sh front v1.2.3        # explicit tag
#   API_HOST=https://api.staging.vantacore.example ./build.sh front   # only if front/api are split origins

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

build_api() {
  local tag="${1:-$(git -C "$REPO_ROOT/Api" rev-parse --short HEAD 2>/dev/null || echo latest)}"
  local image_name="${API_IMAGE_NAME:-vantacore-api}"

  echo "Building ${image_name}:${tag} (context: ${REPO_ROOT}/Api)"
  docker build \
    -f "$REPO_ROOT/Api/.deploy/docker/Dockerfile.staging" \
    -t "${image_name}:${tag}" \
    -t "${image_name}:latest" \
    "$REPO_ROOT/Api"
  echo "Built ${image_name}:${tag} (also tagged ${image_name}:latest)"
}

build_front() {
  local tag="${1:-$(git -C "$REPO_ROOT/Front" rev-parse --short HEAD 2>/dev/null || echo latest)}"
  local image_name="${FRONT_IMAGE_NAME:-vantacore-front}"
  local api_host="${API_HOST:-}"
  local app_env="${APP_ENV:-staging}"

  echo "Building ${image_name}:${tag} (context: ${REPO_ROOT}/Front, API_HOST=${api_host})"
  docker build \
    -f "$REPO_ROOT/Front/.deploy/docker/Dockerfile.staging" \
    --build-arg "API_HOST=${api_host}" \
    --build-arg "APP_ENV=${app_env}" \
    -t "${image_name}:${tag}" \
    -t "${image_name}:latest" \
    "$REPO_ROOT/Front"
  echo "Built ${image_name}:${tag} (also tagged ${image_name}:latest)"
}

TARGET="${1:-all}"
TAG="${2:-}"

case "$TARGET" in
  api)
    build_api "$TAG"
    ;;
  front)
    build_front "$TAG"
    ;;
  all)
    build_api "$TAG"
    build_front "$TAG"
    ;;
  *)
    echo "Unknown target: ${TARGET} (expected api|front|all)" >&2
    exit 1
    ;;
esac
