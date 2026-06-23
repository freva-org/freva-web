.PHONY: tests

export EVALUATION_SYSTEM_CONFIG_FILE := $(PWD)/docker/local-eval-system.conf
export EVALUATION_SYSTEM_DRS_CONFIG_FILE := $(PWD)/docker/drs_config.toml
export API_OIDC_DISCOVERY_URL ?= http://localhost:8080/realms/freva/.well-known/openid-configuration
export API_OIDC_CLIENT_ID ?= freva
export API_OIDC_CLIENT_SECRET ?=
export API_OIDC_SCOPES ?= profile
export DOCKER_DIR := $(PWD)/docker
export DJANGO_SUPERUSER_PASSWORD := secret
export DEV_MODE := 1
export CHAT_BOT := 1
export COLUMNS=250
export DOCKER_ENV_FILE ?= .env
export API_USE_TTY = 0
include $(DOCKER_ENV_FILE)
export

.PHONY: all run runserver runfrontend stopserver stopfrontend stop setup


all: setup runserver runfrontend
	@echo "All services are running in the background."

dummy-data:
	sh $(DOCKER_DIR)/dummy_plugin_runs.sh

setup-django:
	python manage.py makemigrations base
	python manage.py migrate --fake-initial
	python manage.py migrate --fake contenttypes
	python manage.py createsuperuser --noinput --username admin --email foo@bar.com.au || echo

setup-rest:
	@if [ ! -d ../freva-nextgen ]; then \
		git clone --recursive https://github.com/freva-org/freva-nextgen.git ../freva-nextgen; \
	else \
		git -C ../freva-nextgen submodule update --init --recursive; \
	fi
	python -m pip install -e ../freva-nextgen/freva-rest ../freva-nextgen/freva-data-portal-worker


setup-node:
	npm install

STAC_BROWSER_REPO ?= https://github.com/radiantearth/stac-browser.git
STAC_BROWSER_PIN := stac-browser-patches/stac-browser.commit

setup-stacbrowser:
	@echo "Setting up STAC Browser..."
	rm -rf static_root/stac-browser
	mkdir -p static_root/stac-browser
	@if [ ! -e stac-browser ]; then \
		git clone $(STAC_BROWSER_REPO) stac-browser; \
	elif [ ! -d stac-browser/.git ]; then \
		echo "stac-browser exists but is not a git repo - re-cloning"; \
		rm -rf stac-browser && git clone $(STAC_BROWSER_REPO) stac-browser; \
	fi
	@ref="$${STAC_BROWSER_REF}"; \
	if [ -z "$$ref" ] && [ -f "$(STAC_BROWSER_PIN)" ]; then \
		ref=$$(cat "$(STAC_BROWSER_PIN)"); \
	fi; \
	if [ -z "$$ref" ]; then \
		echo "::warning::no STAC_BROWSER_REF and no pin file;falling back to origin/main"; \
		ref="origin/main"; \
	fi; \
	url=$$(git -C stac-browser remote get-url origin 2>/dev/null || echo ""); \
	if [ "$$url" != "$(STAC_BROWSER_REPO)" ]; then \
		echo "pointing 'origin' at $(STAC_BROWSER_REPO)"; \
		git -C stac-browser remote set-url origin "$(STAC_BROWSER_REPO)" 2>/dev/null \
			|| git -C stac-browser remote add origin "$(STAC_BROWSER_REPO)"; \
	fi; \
	echo "Building STAC Browser at: $$ref"; \
	case "$$ref" in \
		origin/*) git -C stac-browser fetch origin "$${ref#origin/}" ;; \
		*)        git -C stac-browser fetch origin "$$ref" 2>/dev/null \
					|| git -C stac-browser fetch origin ;; \
	esac; \
	git -C stac-browser reset --hard "$$ref" && git -C stac-browser clean -fd
	@# Apply patches
	@for p in stac-browser-patches/*.patch; do \
		echo "applying $$p"; \
		( cd stac-browser && patch -p1 --forward < "../$$p" ) || \
			{ echo "::error::failed to apply $$p"; exit 1; }; \
	done
	cd stac-browser && python3 -c "\
import pathlib; \
p = pathlib.Path('config.js'); \
t = p.read_text(); \
t = t.replace('historyMode: \"history\"', 'historyMode: \"hash\"'); \
t = t.replace('showThumbnailsAsAssets: false', 'showThumbnailsAsAssets: true'); \
t = t.replace('pathPrefix: \"/\"', 'pathPrefix: \"/static/stac-browser/\"'); \
t = t.replace('enforcedColorMode: \"auto\"', 'enforcedColorMode: \"light\"'); \
p.write_text(t)"
	cd stac-browser && npm install && npm run build
	cp -r stac-browser/dist/. static_root/stac-browser/
	mkdir -p static_root/stac-browser/.vite
	cp stac-browser/dist/.vite/manifest.json static_root/stac-browser/.vite/manifest.json

runserver:
	@echo "Starting Django development server..."
	python manage.py runserver > runserver.log 2>&1 &
	@echo "Django development server is running..."
	@echo "To watch the Django server logs, run 'tail -f runserver.log'"

runrest:
	branch=$$(git -C ../freva-nextgen branch --show-current); \
	if [ "$$branch" = "main" ]; then \
		echo "Updating ../freva-nextgen from origin/main"; \
		git -C ../freva-nextgen pull --ff-only origin main; \
	else \
		echo "Not pulling ../freva-nextgen because current branch is '$$branch'"; \
	fi
	@echo "Starting up freva-rest api"
	python ../freva-nextgen/dev-env/config/dev-utils.py redis-config .data-portal-cluster-config.json \
		--user $(REDIS_USER) \
		--passwd $(REDIS_PASSWD) \
		--cert-file $(REDIS_SSL_CERTFILE) \
		--key-file $(REDIS_SSL_KEYFILE)
	python -m data_portal_worker -c .data-portal-cluster-config.json --dev > data-loader.log 2>&1 &
	python ../freva-nextgen/dev-env/config/dev-utils.py oidc $(API_OIDC_DISCOVERY_URL)
	python -m freva_rest.cli -p 7777 --services zarr-stream stacapi \
		--redis-ssl-keyfile $(REDIS_SSL_KEYFILE) \
		--redis-ssl-certfile $(REDIS_SSL_CERTFILE) \
		--debug --dev --reload >> rest.log 2>&1 &
	@echo "To watch the freva-rest logs, run 'tail -f rest.log'"

runfrontend:
	@echo "Starting npm development server..."
	npm run dev > npm.log 2>&1 &
	@echo "npm development server is running..."
	@echo "To watch the npm logs, run 'tail -f npm.log'"

stopserver:
	ps aux | grep '[m]anage.py runserver' | awk '{print $$2}' | xargs -r kill
	echo "Stopped Django development server..." > runserver.log

stoprest:
	ps aux | grep '[f]reva_rest.cli' | awk '{print $$2}' | xargs -r kill
	ps aux | grep '[d]ata_portal_worker' | awk '{print $$2}' | xargs -r kill
	ps aux | grep '[m]anage.py runserver' | awk '{print $$2}' | xargs -r kill
	pkill -9 -f 'freva_rest.cli' || true
	pkill -9 -f 'data_portal_worker' || true
	rm -fr .data-portal-cluster-config.json
	echo "Stopped freva-rest development server..." > rest.log

stopfrontend:
	- kill $$(pgrep -f 'npm.*run.*dev') 2>/dev/null || true
	echo "Stopped npm development server..." > npm.log

stop: stopserver stopfrontend stoprest
	@echo "All services have been stopped."

setup: setup-rest setup-stacbrowser setup-node setup-django dummy-data

run: runrest runfrontend runserver

lint: setup-node
	npm run lint-format
	npm run lint
	isort -c --profile black -t py312 .

tests: setup-node
	npm run build-production
	npm run build
	rm -rf node_modules
	pytest -vv $(PWD) tests/

release:
	python -m pip install git-python requests packaging tomli
	curl -H 'Cache-Control: no-cache' -Ls -o bump.py https://raw.githubusercontent.com/freva-org/freva-deployment/main/release.py
	python bump.py tag web -v
	rm bump.py
