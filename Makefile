.PHONY: tests

export EVALUATION_SYSTEM_CONFIG_FILE := $(PWD)/docker/local-eval-system.conf
export EVALUATION_SYSTEM_DRS_CONFIG_FILE := $(PWD)/docker/drs_config.toml
export DJANGO_SUPERUSER_PASSWORD := secret
export DEV_MODE := 1

.PHONY: all run runserver runfrontend stopserver stopfrontend stop setup

all: setup runserver runfrontend
	@echo "All services are running in the background."

dummy-data:
	docker/dummy_plugin_runs.sh


setup-django:
	python manage.py makemigrations base
	python manage.py migrate --fake-initial
	python manage.py migrate --fake contenttypes
	python manage.py createsuperuser --noinput --username admin --email foo@bar.com.au || echo

setup-node:
	npm install

runserver:
	@echo "Starting Django development server..."
	python manage.py runserver > runserver.log 2>&1 &
	@echo "Django development server is running..."
	@echo "To watch the Django server logs, run 'tail -f runserver.log'"

runfrontend:
	@echo "Starting npm development server..."
	npm run dev > npm.log 2>&1 &
	@echo "npm development server is running..."
	@echo "To watch the npm logs, run 'tail -f npm.log'"

stopserver:
	ps aux | grep '[m]anage.py runserver' | awk '{print $$2}' | xargs -r kill
	echo "Stopped Django development server..." > runserver.log

stopfrontend:
	pkill -f "npm run dev"
	echo "Stopped npm development server..." > npm.log

stop: stopserver stopfrontend
	@echo "All services have been stopped."

setup: setup-node setup-django dummy-data

run: runfrontend runserver

lint: setup-node
	npm run lint-format
	npm run lint
	black -t py310 --check .

tests: setup-node
	npm run build-production
	npm run build
	rm -rf node_modules
	pytest -vv $(PWD) tests/
