#!/bin/bash
set -u -o nounset -o pipefail -o errexit

LOG_DIR=${API_LOG_DIR:-/data/logs}
LOG_LEVEL="info"
if [ "${DEBUG:0}" = "1" ];then
    LOG_LEVEL="debug"
fi

python manage.py makemigrations base
python manage.py migrate --fake-initial --noinput
python manage.py migrate --fake contenttypes
python manage.py collectstatic --noinput
python manage.py createsuperuser \
    --noinput \
    --username freva-admin \
    --email ${DJANGO_SUPERUSER_EMAIL:-freva@dkrz.de} || echo 0
python manage.py shell -c \
    'from django.contrib.sites.models import Site; Site.objects.create(id=1, domain="example.com", name="example.com").save()' || echo 0
exec gunicorn -b [::]:8000 -w 1 django_evaluation.wsgi \
     --log-level $LOG_LEVEL --error-logfile $LOG_DIR/freva-web.error.log \
     --user ${USER:-$(id -u)} \
     --group ${GROUP:-$(id-g)}
