#!/bin/sh

chown -R freva:freva ${FREVA_WEB_DIR}/static
exec runuser -u freva "$@"
