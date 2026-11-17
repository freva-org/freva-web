#!/usr/bin/env bash
# Build the STAC Browser into static_root/stac-browser.
#
# Clones radiantearth/stac-browser into ./stac-browser (gitignored), checks
# out the pinned commit, applies our patches and the config tweaks, builds
# it and copies the result where Django serves it from.
#
# A plain script rather than a just recipe because CI calls it directly
# (build_job.yml, stacbrowser_update.yml), in jobs that have node but no
# just. Locally it runs inside the web container: `just stac-browser`.
#
#   STAC_BROWSER_REPO   where to clone from (default: upstream)
#   STAC_BROWSER_REF    what to build (default: the pin in
#                       stac-browser-patches/stac-browser.commit)
set -euo pipefail

cd "$(dirname "$0")/.."

repo="${STAC_BROWSER_REPO:-https://github.com/radiantearth/stac-browser.git}"
pin="stac-browser-patches/stac-browser.commit"

echo "Setting up STAC Browser..."
rm -rf static_root/stac-browser
mkdir -p static_root/stac-browser

if [ ! -e stac-browser ]; then
    git clone "$repo" stac-browser
elif [ ! -d stac-browser/.git ]; then
    echo "stac-browser exists but is not a git repo - re-cloning"
    rm -rf stac-browser && git clone "$repo" stac-browser
fi

ref="${STAC_BROWSER_REF:-}"
if [ -z "$ref" ] && [ -f "$pin" ]; then
    ref=$(cat "$pin")
fi
if [ -z "$ref" ]; then
    echo "::warning::no STAC_BROWSER_REF and no pin file; falling back to origin/main"
    ref="origin/main"
fi

url=$(git -C stac-browser remote get-url origin 2>/dev/null || echo "")
if [ "$url" != "$repo" ]; then
    echo "pointing 'origin' at $repo"
    git -C stac-browser remote set-url origin "$repo" 2>/dev/null \
        || git -C stac-browser remote add origin "$repo"
fi

echo "Building STAC Browser at: $ref"
case "$ref" in
    origin/*) git -C stac-browser fetch origin "${ref#origin/}" ;;
    *)        git -C stac-browser fetch origin "$ref" 2>/dev/null \
                  || git -C stac-browser fetch origin ;;
esac
git -C stac-browser reset --hard "$ref"
git -C stac-browser clean -fd

for p in stac-browser-patches/*.patch; do
    echo "applying $p"
    ( cd stac-browser && patch -p1 --forward < "../$p" ) \
        || { echo "::error::failed to apply $p"; exit 1; }
done

python3 - <<'PY'
import pathlib

p = pathlib.Path("stac-browser/config.js")
t = p.read_text()
t = t.replace('historyMode: "history"', 'historyMode: "hash"')
t = t.replace("showThumbnailsAsAssets: false", "showThumbnailsAsAssets: true")
t = t.replace('pathPrefix: "/"', 'pathPrefix: "/static/stac-browser/"')
t = t.replace('enforcedColorMode: "auto"', 'enforcedColorMode: "light"')
p.write_text(t)
PY

( cd stac-browser && npm install && npm run build )
cp -r stac-browser/dist/. static_root/stac-browser/
mkdir -p static_root/stac-browser/.vite
cp stac-browser/dist/.vite/manifest.json static_root/stac-browser/.vite/manifest.json
