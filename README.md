# Production system deployment

The deployment of a production system is done by a dedicated deployment
repository that sets up the backend, frontend and all services. To deploy the
web frontend in a production environment use the [deployment repository](https://gitlab.dkrz.de/freva/deployment)

# Setting up a development version:

## Installation of the required packages

The frontend will build upon an installed [backend version](https://gitlab.dkrz.de/freva/evaluation_system).
Hence you will need to install the backend first. We recommend creating a dedicated
anaconda environment where both frontend and backend are installed.

```bash
conda env create -f conda-env.yml
conda activate freva-web
source .envrc
conda env config vars set EVALUATION_SYSTEM_CONFIG_FILE=$EVALUATION_SYSTEM_CONFIG_FILE
conda env config vars set PUBKEY=$EVALUATION_SYSTEM_CONFIG_FILE
conda env config vars set DEV_MODE=1
conda deactivate
conda activate freva-web
```

You will also need to clone the [evaluation system](https://gitlab.dkrz.de/freva/evaluation_system) repo and install
it into the `freva-web` environment.

```bash
pip install -e <path to eval system repo>
```

The back- and frontend will need a connection to a solr and mariadb service. This services can be deployed using
[`docker-compose`](https://docs.docker.com/compose/install/).

```bash
docker-compose up -d
```

When finished, tear down the environment with

```bash
docker-compose down
```

### Running tests

There are some rudimentaray tests that check the integration of `django` and the
`nodejs` building process. Assuming you have followed steps mentioned above and
created a `freva-dev` cona miniconda environment you can run the tests after
activating this environment:

```bash
conda activate freva-dev
python -m pytest -vv tests
```

## Django deployment

you can check if django is working and corretly configured by:

```bash
python manage.py check
```

If checks are passing issue the following command

```bash
python manage.py migrate --fake-initial
python manage.py createsuperuser
```

The `--fake-inital` flag tells `django` not to create the already existing
database tables.

## Running the server in dev mode

A development server can be set using the following command:

```bash
python manage.py runserver [port_number]
```

Default port is 8000. If an application is already running on that port you
can change the port number with help of a command line argument

## Building the JS application :

Install dependencies:

```bash

npm install

```

Build project:

```bash
npm run build
npm run build-production   # optimized production build

```

Development:

```bash
npm run dev   # starts webpack-dev-server including hot-reloading
```

# Deploy a new version:

```bash
python manage.py collectstatic  # get new js files
```

# Production

The production environment is based on gunicorn inside a docker and an Apache HTTPD as a reverse proxy in front of it

```
docker build -t gunicorn -f Dockerfile .

# set env for config and mount lustre. It should have the same pathnames as on the host system
docker run -e EVALUATION_SYSTEM_CONFIG_FILE=/path/to/evaluation_system.conf -v /work/ch1187:/work/ch1187 -p 8000:8000 gunicorn

docker run -v "/path/to/freva-web/docker/production/apache/apache-conf":"/usr/local/apache2/conf/httpd.conf" -v "/path/to//server-cert.crt":"/etc/ssl/certs/server-cert.crt" -v "/path/to/server-key.key":"/etc/ssl/private/server-key.key" -e FREVA_HOST=www-regiklim.dkrz.de -p 80:80 -p 443:443 httpd:2.4
```
