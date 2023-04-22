.PHONY: tests

export EVALUATION_SYSTEM_CONFIG_FILE := $(PWD)/docker/local-eval-system.conf
export EVALUATION_SYSTEM_DRS_CONFIG_FILE := $(PWD)/docker/drs_config.toml
run:
	python manage.py runserver

dummy-data:
	docker/dummy_plugin_runs.sh
	python3 docker/solr/ingest_dummy_data.py

lint:
	black -t py310 --check .

tests:
	pytest -vv $(PWD) tests/
