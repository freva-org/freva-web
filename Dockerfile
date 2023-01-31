ARG CONDA_ENV_DIR=/opt/condaenv
ARG FREVA_WEB_DIR=/opt/freva_web

FROM condaforge/mambaforge
LABEL maintainer="DRKZ-CLINT"
LABEL repository="https://gitlab.dkrz.de/freva/freva_web"

ARG CONDA_ENV_DIR
ARG FREVA_WEB_DIR

WORKDIR ${FREVA_WEB_DIR}
