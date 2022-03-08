
run:
	python manage.py runserver

dummy-data:
	docker/dummy_plugin_runs.sh
	python3 docker/solr/ingest_dummy_data.py

lint:
	black --check .
