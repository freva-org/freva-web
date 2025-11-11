#!/bin/bash
set -u -o nounset -o pipefail -o errexit
export PATH=/opt/conda/envs/freva-web/bin:$PATH

LOG_DIR=${API_LOG_DIR:-/data/logs}
LOG_LEVEL="info"
if [ "${DEBUG:-0}" = "1" ]; then
    LOG_LEVEL="debug"
fi

wait_for_migrations() {
    MAX_ATTEMPTS="${MAX_ATTEMPTS:-60}"      # 60 * 2s = 120s
    SLEEP_SECONDS="${SLEEP_SECONDS:-2}"

    i=1
    while [ "$i" -le "$MAX_ATTEMPTS" ]; do
        if python manage.py migrate --check >/dev/null 2>&1; then
            echo "Database reachable and migrations are up-to-date."
            return 0
        fi

        echo "[$i/$MAX_ATTEMPTS] Waiting for database / migrations..."
        i=$((i + 1))
        sleep "$SLEEP_SECONDS"
    done

    echo "ERROR: Timed out waiting for database / migrations to be ready." >&2
    return 1
}

if ! wait_for_migrations; then
     exit 1
fi
python manage.py makemigrations base
python manage.py migrate --fake-initial --noinput
python manage.py migrate --fake contenttypes
python manage.py collectstatic --noinput

# Create superuser if not exists
if ! python manage.py createsuperuser \
    --noinput \
    --username freva-admin \
    --email "${DJANGO_SUPERUSER_EMAIL:-freva@dkrz.de}" 2>/dev/null ; then
    echo "Superuser already exists or failed creation — continuing..."
fi

# Ensure Site exists
if ! python manage.py shell -c \
    'from django.contrib.sites.models import Site; Site.objects.update_or_create(id=1, defaults={"domain": "example.com", "name": "example.com"})' 2>/dev/null; then
    echo "Site init failed — continuing..."
fi

# Start webserver
exec gunicorn -b [::]:8000 -w 1 django_evaluation.wsgi \
    --log-level "$LOG_LEVEL" --error-logfile "$LOG_DIR/freva-web.error.log"
