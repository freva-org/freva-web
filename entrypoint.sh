#!/bin/bash

chown -R freva:freva /opt/freva_web/static
if [ "$@" ];then
  runuser -u freva -- $@
else
  runuser -u freva -- /opt/freva_web/init_django.sh
fi
