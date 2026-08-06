#!/usr/bin/env sh
set -eu

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
tools_root="$repo_root/.tools"

# versions.env contains only pinned NAME=value pairs maintained by this repository.
# shellcheck disable=SC1091
. "$repo_root/versions.env"

os=$(uname -s)
case "$os" in
  Linux) platform=linux ;;
  Darwin) platform=macos ;;
  *) echo "Unsupported operating system: $os" >&2; exit 1 ;;
esac

machine=$(uname -m)
case "$machine" in
  x86_64|amd64) architecture=x64 ;;
  arm64|aarch64) architecture=arm64 ;;
  *) echo "Unsupported architecture: $machine" >&2; exit 1 ;;
esac

checksum_name="MISE_SHA256_$(printf '%s_%s' "$platform" "$architecture" | tr '[:lower:]' '[:upper:]')"
eval "expected_checksum=\${$checksum_name:-}"
if [ -z "${MISE_VERSION:-}" ] || [ -z "$expected_checksum" ]; then
  echo "versions.env does not define MISE_VERSION and $checksum_name" >&2
  exit 1
fi

mise_directory="$tools_root/mise/v$MISE_VERSION/$platform-$architecture"
mise_bin="$mise_directory/mise"

if [ ! -x "$mise_bin" ]; then
  mkdir -p "$tools_root" "$mise_directory"
  temporary_directory=$(mktemp -d "$tools_root/.tmp-XXXXXXXX")

  # Removes this invocation's temporary download directory on exit or interruption.
  # The trap below calls it so failed downloads never leave partial archives behind.
  cleanup() {
    case "$temporary_directory" in
      "$tools_root"/.tmp-*) rm -rf -- "$temporary_directory" ;;
    esac
  }
  trap cleanup EXIT HUP INT TERM

  asset="mise-v$MISE_VERSION-$platform-$architecture.tar.gz"
  archive="$temporary_directory/$asset"
  url="https://github.com/jdx/mise/releases/download/v$MISE_VERSION/$asset"
  echo "Downloading mise v$MISE_VERSION for $platform-$architecture..."

  if command -v curl >/dev/null 2>&1; then
    curl --fail --location --silent --show-error "$url" --output "$archive"
  elif command -v wget >/dev/null 2>&1; then
    wget --quiet "$url" --output-document "$archive"
  else
    echo "bootstrap.sh requires curl or wget." >&2
    exit 1
  fi

  if command -v sha256sum >/dev/null 2>&1; then
    actual_checksum=$(sha256sum "$archive" | awk '{print $1}')
  elif command -v shasum >/dev/null 2>&1; then
    actual_checksum=$(shasum -a 256 "$archive" | awk '{print $1}')
  else
    echo "bootstrap.sh requires sha256sum or shasum." >&2
    exit 1
  fi

  if [ "$actual_checksum" != "$expected_checksum" ]; then
    echo "Checksum mismatch for $asset. Expected $expected_checksum, got $actual_checksum." >&2
    exit 1
  fi

  tar -xzf "$archive" -C "$temporary_directory"
  extracted_mise=$(find "$temporary_directory" -type f -name mise -print -quit)
  if [ -z "$extracted_mise" ]; then
    echo "The mise archive did not contain mise." >&2
    exit 1
  fi
  cp "$extracted_mise" "$mise_bin"
  chmod +x "$mise_bin"
fi

export MISE_DATA_DIR="$tools_root/mise-data"
export MISE_CACHE_DIR="$tools_root/mise-cache"
export MISE_CONFIG_DIR="$tools_root/mise-config"
export MISE_STATE_DIR="$tools_root/mise-state"
export MISE_YES=1
PATH="$mise_directory:$PATH"
export PATH

mkdir -p "$MISE_DATA_DIR" "$MISE_CACHE_DIR" "$MISE_CONFIG_DIR" "$MISE_STATE_DIR"

cd "$repo_root"
"$mise_bin" trust mise.toml
export MISE_CONFIG_FILE=mise.toml
"$mise_bin" install task
"$mise_bin" install node

task_bin=$("$mise_bin" which task)
node_bin=$("$mise_bin" which node)
export MISE_BIN="$mise_bin"
export TASK_BIN="$task_bin"
export NODE_BIN="$node_bin"
export NPM_BIN="$(dirname "$node_bin")/npm"
PATH="$(dirname "$task_bin"):$(dirname "$node_bin"):$PATH"
export PATH

if [ "$#" -eq 0 ]; then
  set -- setup
fi
"$task_bin" "$@"
