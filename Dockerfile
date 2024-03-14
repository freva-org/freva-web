ARG CONDA_ENV_DIR=/opt/condaenv
ARG FREVA_WEB_DIR=/opt/freva_web

FROM condaforge/mambaforge
LABEL maintainer="DRKZ-CLINT"
LABEL repository="https://github.com/FREVA-CLINT/freva-web"
LABEL release="<VERSION>"
ARG CONDA_ENV_DIR
ARG FREVA_WEB_DIR

WORKDIR ${FREVA_WEB_DIR}
COPY . .

ENV PATH=$CONDA_ENV_DIR/bin:$PATH\
    DJANGO_SUPERUSER_EMAIL=freva@dkrz.de
RUN set -e && \
  groupadd -r --gid  1000 freva && \
  adduser --uid "freva" --gid 1000 --gecos "Freva user" \
  --shell /bin/bash --disabled-password "freva" --home ${FREVA_WEB_DIR} && \
  chown -R freva:freva ${FREVA_WEB_DIR}


RUN set -e \
  && mamba env create -p ${CONDA_ENV_DIR} -f conda-env.yml \
  && npm install && npm run build-production \
  && mamba clean -afy \
  && rm -rf node_modules \
  && echo "export PATH=${PATH}" >> ${FREVA_WEB_DIR}/.bashrc

EXPOSE 8000
USER freva

CMD ./init_django.sh
