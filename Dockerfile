FROM docker.io/mambaorg/micromamba
USER root
ARG CONDA_ENV_DIR=/opt/condaenv
ARG FREVA_WEB_DIR=/opt/freva_web
ARG EMAIL_HOST_PASSWORD=""
ARG VERSION

LABEL org.opencontainers.image.authors="DRKZ-CLINT"
LABEL org.opencontainers.image.source="https://github.com/FREVA-CLINT/freva-web"
LABEL org.opencontainers.image.version="$VERSION"
ENV PATH=/opt/conda/bin:$PATH\
    DJANGO_SUPERUSER_EMAIL=freva@dkrz.de\
    EMAIL_HOST_PASSWORD=$EMAIL_HOST_PASSWORD\
    PYTHONUNBUFFERED=1

WORKDIR ${FREVA_WEB_DIR}

COPY . .

RUN  set -eu && \
     micromamba create -n webpack -y -q -c conda-forge --override-channels webpack-cli &&\
     micromamba run -n webpack npm install && \
     micromamba run -n webpack npm run build-production &&\
     rm -rf node_modules .eslintrc .project .babelrc .npmrc .prettierrc &&\
     micromamba env remove -n webpack -y -q &&\
     micromamba clean -qafyitl --trash


RUN  set -eu && \
     micromamba env create -y -q -n freva-web -f conda-env.yml && \
     micromamba clean -qafyitl --trash && \
     micromamba run -n freva-web python -m pip cache purge --no-input -q &&\
     micromamba clean -qafyitl --trash &&\
     rm conda-env.yml

ENV ENV_NAME=freva-web
EXPOSE 8000
CMD  ["./init_django.sh"]
