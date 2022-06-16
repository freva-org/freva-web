FROM condaforge/mambaforge

LABEL maintainer="DRKZ-CLINT"
LABEL repository="https://gitlab.dkrz.de/freva/freva_web"

WORKDIR /opt/freva_web
COPY . .

ENV PATH=/opt/condaenvs/bin:$PATH:

RUN set -e \
  && mamba env create -p /opt/condaenvs -f conda-env.yml \
  && npm install && npm run build-production \
  && mamba clean -afy \
  && rm -rf node_modules

EXPOSE 8000

CMD ["gunicorn", "-b", "[::]:8000", "django_evaluation.wsgi"]
