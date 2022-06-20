ARG CONDA_ENV_DIR=/opt/condaenv
ARG FREVA_WEB_DIR=/opt/freva_web

FROM condaforge/mambaforge
LABEL stage="build"

ARG CONDA_ENV_DIR
ARG FREVA_WEB_DIR

WORKDIR ${FREVA_WEB_DIR}
COPY . .

ENV PATH=${CONDA_ENV_DIR}/bin:$PATH:

RUN set -e \
  && mamba env create -p ${CONDA_ENV_DIR} -f conda-env.yml \
  && npm install && npm run build-production \
  && rm -rf node_modules

FROM ubuntu:latest
LABEL maintainer="DRKZ-CLINT"
LABEL repository="https://gitlab.dkrz.de/freva/freva_web"

ARG CONDA_ENV_DIR
ARG FREVA_WEB_DIR

WORKDIR ${FREVA_WEB_DIR}
COPY --from=0 ${FREVA_WEB_DIR} ${FREVA_WEB_DIR}
COPY --from=0 ${CONDA_ENV_DIR} ${CONDA_ENV_DIR}

ENV PATH=${CONDA_ENV_DIR}/bin:$PATH:
EXPOSE 8000

CMD ["gunicorn", "-b", "[::]:8000", "django_evaluation.wsgi"]
