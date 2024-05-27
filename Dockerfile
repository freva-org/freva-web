ARG CONDA_ENV_DIR=/opt/condaenv
ARG FREVA_WEB_DIR=/opt/freva_web
ARG VERSION

FROM condaforge/mambaforge
LABEL org.opencontainers.image.authors="DRKZ-CLINT"
LABEL org.opencontainers.image.source="https://github.com/FREVA-CLINT/freva-web"
LABEL org.opencontainers.image.version="$VERSION"
ARG CONDA_ENV_DIR
ARG FREVA_WEB_DIR

RUN set -e && \
  mkdir -p ${CONDA_ENV_DIR}
WORKDIR ${FREVA_WEB_DIR}
COPY . .
ENV PATH=$CONDA_ENV_DIR/bin:$PATH\
    DJANGO_SUPERUSER_EMAIL=freva@dkrz.de
RUN  set -e && \
     mamba env create -y -p ${CONDA_ENV_DIR} -f conda-env.yml &&\
     mamba clean -afy &&\
     npm install && npm run build-production &&\
     rm -rf node_modules &&\
     echo "export PATH=${PATH}" >> ${FREVA_WEB_DIR}/.bashrc &&\
EXPOSE 8000
CMD ./init_django.sh
