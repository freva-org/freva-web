ARG VERSION

FROM condaforge/mambaforge
LABEL org.opencontainers.image.authors="DRKZ-CLINT"
LABEL org.opencontainers.image.source="https://github.com/FREVA-CLINT/freva-web"
LABEL org.opencontainers.image.version="$VERSION"

RUN set -e && \
  groupadd -r -g 1000 freva && \
  adduser --uid 1000 --gid 1000 --gecos "Freva user" \
  --shell /bin/bash --disabled-password freva --home /opt/freva_web &&\
  mkdir -p /opt/condaenv && chown -R freva:freva /opt/condaenv
WORKDIR /opt/freva_web
COPY . .
ENV PATH=/opt/condaenv/bin:$PATH\
    DJANGO_SUPERUSER_EMAIL=freva@dkrz.de
RUN  set -e && \
     mamba env create -y -p /opt/condaenv -f conda-env.yml &&\
     mamba clean -afy &&\
     npm install && npm run build-production &&\
     rm -rf node_modules &&\
     echo "export PATH=${PATH}" >> /opt/freva_web/.bashrc &&\
     mkdir -p /opt/freva_web/static &&\
     mv entrypoint.sh /usr/local/bin/ &&\
     chmod +x /usr/local/bin/entrypoint.sh &&\
     chown -R freva:freva /opt/freva_web
ENTRYPOINT /usr/local/bin/entrypoint.sh
VOLUME /opt/freva_web/static
EXPOSE 8000
CMD ./init_django.sh
