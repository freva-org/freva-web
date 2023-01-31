ARG CONDA_ENV_DIR=/opt/condaenv
ARG FREVA_WEB_DIR=/opt/freva_web

FROM condaforge/mambaforge
LABEL maintainer="DRKZ-CLINT"
LABEL repository="https://gitlab.dkrz.de/freva/freva_web"

ARG CONDA_ENV_DIR
ARG FREVA_WEB_DIR

WORKDIR ${FREVA_WEB_DIR}
COPY . .

ENV PATH=$CONDA_ENV_DIR/bin:$PATH\
    DJANGO_SUPERUSER_EMAIL=freva@dkrz.de

RUN set -e \
  && mamba env create -p ${CONDA_ENV_DIR} -f conda-env.yml \
  && npm install && npm run build-production \
  && mamba clean -afy \
  && rm -rf node_modules \
  && echo "export PATH=${PATH}" >> /root/.bashrc

EXPOSE 8000

CMD ./init_django.sh
