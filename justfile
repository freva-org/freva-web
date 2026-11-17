# Freva web development.
#
#   just setup      once per clone: fetch freva-nextgen, build the images
#   just dev        the whole stack in the foreground, Ctrl-C stops it
#
# Then http://localhost:8000 (log in as $USER / secret, or admin / secret
# for Django's admin). Everything runs in containers with hot reload for
# Django, webpack, freva-rest and the data-loader; see docker-compose.yaml.
# Once `just setup` has run, plain `docker compose up` works too.
#
# COMPOSE picks the tool: `docker compose` by default, or
#   COMPOSE=podman-compose just dev
#
# The recipes that run inside the containers live in
# docker/dev/container.just; the ones here drive compose from outside.

set shell := ["bash", "-euo", "pipefail", "-c"]

compose := env("COMPOSE", "docker compose")
export DEV_UID := `id -u ${USER}`
export DEV_GID := `id -g ${USER}`
nextgen := "docker/freva-nextgen"
nextgen_repo := "https://github.com/freva-org/freva-nextgen.git"

[private]
default:
    @just --list
    @echo
    @echo "  site      http://localhost:8000"
    @echo "  keycloak  http://localhost:8080  (admin: keycloak / secret)"

# --- setup ------------------------------------------------------------------

# Fetch everything the stack mounts and build the dev images
[group('setup')]
setup: fetch
    {{ compose }} build --pull

# Clone freva-nextgen into docker/ and update the submodules
[group('setup')]
fetch:
    #!/usr/bin/env bash
    set -euo pipefail
    git submodule update --init --recursive
    if [ ! -d {{ nextgen }}/.git ]; then
      git clone --recursive {{ nextgen_repo }} {{ nextgen }}
    else
      git -C {{ nextgen }} submodule update --init --recursive
    fi
    # Mount points for the named volumes. Created here so they belong to
    # you, not to whatever user the container runtime would create them as.
    mkdir -p node_modules base/migrations

# Fast-forward freva-nextgen, but only while it is on main
[group('setup')]
update-nextgen:
    #!/usr/bin/env bash
    set -euo pipefail
    branch=$(git -C {{ nextgen }} branch --show-current)
    if [ "$branch" = "main" ]; then
      git -C {{ nextgen }} pull --ff-only origin main
      git -C {{ nextgen }} submodule update --init --recursive
    else
      echo "leaving {{ nextgen }} alone: it is on '$branch', not main"
    fi

# Rebuild the dev images from scratch, pulling the latest base images
[group('setup')]
rebuild:
    {{ compose }} build --pull --no-cache

# --- the stack --------------------------------------------------------------

# Run everything in the foreground (Ctrl-C stops it)
[group('stack')]
dev: _check
    {{ compose }} up

# Same, in the background
[group('stack')]
up: _check
    {{ compose }} up -d
    @echo "http://localhost:8000   (first start takes a few minutes: just logs)"

# Stop the stack, keeping all data
[group('stack')]
down:
    {{ compose }} down

# Show what is running
[group('stack')]
ps:
    {{ compose }} ps

# Follow logs, of everything or of some services: just logs web freva-rest
[group('stack')]
logs *services:
    {{ compose }} logs -f {{ services }}

# Open a shell in a service (default: web)
[group('stack')]
shell service="web":
    {{ compose }} exec {{ service }} bash

# Restart services, e.g. after a dependency change: just restart freva-rest
[group('stack')]
restart +services:
    {{ compose }} restart {{ services }}

# --- inside the containers --------------------------------------------------

# Run a Django management command: just manage createsuperuser
[group('django')]
manage +args:
    {{ compose }} exec web python manage.py {{ args }}

# Apply migrations again (the web container does this on every start)
[group('django')]
migrate:
    {{ compose }} exec web just migrate

# Record a few more dummy plugin runs
[group('django')]
dummy-data:
    {{ compose }} exec web just dummy-data

# Rebuild the STAC Browser (the frontend container builds it once by itself)
[group('django')]
stac-browser:
    {{ compose }} run --rm --no-deps web just stac-browser

# Lint JavaScript and Python import order
[group('quality')]
lint:
    {{ compose }} run --rm --no-deps web just lint

# Build the bundles and run the tests
[group('quality')]
test:
    {{ compose }} run --rm web just test

# --- state ------------------------------------------------------------------

# Stop the stack and remove its images, KEEPING the data volumes
[group('state')]
clean:
    {{ compose }} down --rmi local
    @echo "images removed; databases and node_modules kept. 'just nuke' drops those."

# Delete everything: databases, migrations, node_modules, previews
[confirm("This deletes all dev databases and the Django migrations volume. Continue? [y/N]")]
[group('state')]
nuke:
    {{ compose }} down --volumes --rmi local
    @echo "gone. 'just dev' starts from scratch."

# --- release ----------------------------------------------------------------

# Tag a release (runs on the host, needs python3 and git)
[group('release')]
release:
    #!/usr/bin/env bash
    set -euo pipefail
    python3 -m pip install git-python requests packaging tomli
    curl -H 'Cache-Control: no-cache' -Ls -o bump.py \
      https://raw.githubusercontent.com/freva-org/freva-deployment/main/release.py
    trap 'rm -f bump.py' EXIT
    python3 bump.py tag web -v

[private]
_check:
    #!/usr/bin/env bash
    if [ ! -d {{ nextgen }}/freva-rest ] || [ ! -d docker/config/keycloak ]; then
      echo "freva-nextgen or the service config is missing: run 'just setup' first" >&2
      exit 1
    fi
