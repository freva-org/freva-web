.PHONY: tests

export EVALUATION_SYSTEM_CONFIG_FILE := $(PWD)/docker/local-eval-system.conf
export EVALUATION_SYSTEM_DRS_CONFIG_FILE := $(PWD)/docker/drs_config.toml
run:
	python manage.py runserver

dummy-data:
	docker/dummy_plugin_runs.sh
	python3 docker/solr/ingest_dummy_data.py

lint:
	isort -c --profile black -t py312 .

tests:
	rm -rf node_modules
	pytest -vv $(PWD) tests/

release:
	pip install git-python requests packaging tomli
	curl -H 'Cache-Control: no-cache' -Ls -o bump.py https://raw.githubusercontent.com/FREVA-CLINT/freva-deployment/versions/release.py
	python3 bump.py tag django_evaluation -b version
	rm bump.py
