# Recipes that run INSIDE the dev containers.
#
# Every dev image sets JUST_JUSTFILE to this file (bind-mounted, so edits
# apply without a rebuild), which makes plain `just <recipe>` work in any of
# them. Each service's compose `command` is one of the long-running recipes
# below; the rest are for `just` on the host to call via exec or run.
#
# The web recipes use paths relative to the checkout, so CI can run the same
# lint and test recipes straight on the runner:
#
#   just -f docker/dev/container.just -d . test
#
# The host-side counterpart is the justfile in the repository root.

set shell := ["bash", "-euo", "pipefail", "-c"]

nextgen := env("FREVA_NEXTGEN_SRC", "/src/freva-nextgen")

[private]
default:
    @just --list

# --- long-running services --------------------------------------------------

# Migrate, seed on first start, then serve Django with autoreload on :8000
[group('services')]
web: migrate
    python manage.py shell -c 'import sys; from history.models import History; sys.exit(0 if History.objects.exists() else 1)' \
      || just dummy-data \
      || echo "seeding plugin runs failed, the site works without them"
    exec python manage.py runserver 0.0.0.0:8000

# webpack dev server with hot reload, behind the proxy on /assets/bundles
[group('services')]
frontend: node-deps
    [ -f static_root/stac-browser/.vite/manifest.json ] \
      || bash docker/build-stac-browser.sh \
      || echo "STAC Browser build failed; everything else works. Retry: just stac-browser"
    exec npm run dev

# freva-rest from the mounted checkout, reloading on edits
[group('services')]
rest: (install nextgen / "freva-rest")
    python {{ nextgen }}/dev-env/config/dev-utils.py oidc "$API_OIDC_DISCOVERY_URL" --time-increment 3
    exec python -m freva_rest.cli --port "${API_PORT:-7777}" --dev --debug

# data-loader worker from the mounted checkout, restarting on edits
[group('services')]
loader: (install nextgen / "freva-data-portal-worker")
    echo '{}' | base64 > /tmp/cluster.json
    exec python -m data_portal_worker --dev -vvvvv -c /tmp/cluster.json

# --- setup steps ------------------------------------------------------------

# Editable install of a mounted package; fast when nothing changed
[group('setup')]
install path:
    python -m pip install --quiet --no-build-isolation --root-user-action ignore -e {{ path }}

# Apply migrations and make sure the admin user and site exist
[group('setup')]
migrate: _wait-for-db
    python manage.py makemigrations base --skip-checks
    python manage.py migrate --fake-initial --noinput --skip-checks
    python manage.py migrate --fake contenttypes
    python manage.py createsuperuser --noinput --username admin --email admin@example.com 2>/dev/null \
      || echo "superuser 'admin' already exists"
    python manage.py shell -c 'from django.contrib.sites.models import Site; Site.objects.update_or_create(id=1, defaults={"domain": "localhost", "name": "localhost"})'

# Install node packages when package-lock.json changed since the last run
[group('setup')]
node-deps:
    #!/usr/bin/env bash
    # node_modules is a volume, and `npm ci` wants to delete the directory
    # itself, which fails on a mount point. `npm install` against the lock
    # file does the same job in place; the stamp skips it when nothing moved.
    set -euo pipefail
    stamp=node_modules/.package-lock.sha256
    want=$(sha256sum package-lock.json | cut -d' ' -f1)
    if [ "$(cat "$stamp" 2>/dev/null || true)" != "$want" ]; then
      npm install --no-audit --no-fund
      echo "$want" > "$stamp"
    fi

# Build the STAC Browser into static_root/stac-browser
[group('setup')]
stac-browser:
    bash docker/build-stac-browser.sh

# Record a few dummy plugin runs so history and results have content
[group('setup')]
dummy-data:
    sh docker/dummy_plugin_runs.sh

[private]
_wait-for-db:
    #!/usr/bin/env bash
    set -euo pipefail
    for i in $(seq 1 30); do
      if python manage.py shell -c 'from django.db import connection; connection.ensure_connection()' >/dev/null 2>&1; then
        exit 0
      fi
      echo "[$i/30] waiting for the database..."
      sleep 2
    done
    echo "database never became reachable" >&2
    exit 1

# --- quality ----------------------------------------------------------------

# Lint the JavaScript and check the Python import order
[group('quality')]
lint: node-deps
    npm run lint-format
    npm run lint
    isort -c --profile black -t py312 --skip-gitignore .

# Production and dev bundle builds, then the Python tests
[group('quality')]
test: node-deps
    #!/usr/bin/env bash
    # The builds overwrite webpack-stats.json, which the running dev server
    # owns: without restoring it the page would load the one-off build
    # instead of the hot-reloading bundle until the next recompile.
    set -euo pipefail
    if [ -f webpack-stats.json ]; then
      stats=$(mktemp)
      cp webpack-stats.json "$stats"
      trap 'cp "$stats" webpack-stats.json; rm -f "$stats"' EXIT
    fi
    npm run build-production
    npm run build
    pytest -vv --ignore=docker --ignore=stac-browser --ignore=node_modules . tests/
