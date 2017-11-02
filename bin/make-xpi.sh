#!/usr/bin/env bash

set -eu
set -o pipefail

BASE_DIR="$(dirname "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)")"
TMP_DIR=$(mktemp -d)
DEST="${TMP_DIR}/addon"
XPI="${XPI:-addon.xpi}"

mkdir -p "$DEST"

# deletes the temp directory
function cleanup {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

# fill templates, could be fancier
node_modules/.bin/mustache addon.json templates/install.rdf.mustache > "${DEST}/install.rdf"
node_modules/.bin/mustache addon.json templates/chrome.manifest.mustache > "${DEST}/chrome.manifest"
cp node_modules/pioneer-utils/dist/PioneerUtils.jsm "${DEST}"

cp -rp extension/* "$DEST"

pushd "$DEST"
zip -r "$DEST/${XPI}" ./*
mkdir -p "$BASE_DIR/dist"
mv "${XPI}" "$BASE_DIR/dist"
echo "XPI: ${BASE_DIR}/dist/${XPI}"
popd
