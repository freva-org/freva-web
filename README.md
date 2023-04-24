# Freva web user interface (web ui)
The deployment of a production system is done by a dedicated deployment
repository that sets up the backend, front end and all services. To deploy the
web front end in a production environment use the
[deployment repository](https://gitlab.dkrz.de/freva/deployment)

# Setting up a development version:

To start development with freva clone the repository and its sub-modules:

```
git clone --recursive https://gitlab.dkrz.de/freva/freva_web.git
```


## Installation of the required packages and infrastructure

The web ui is being deployed in a dedicated anaconda environment. Hence
you need [anaconda](https://www.anaconda.com/products/distribution) to be
installed on you computer. Once anaconda is set up the installation of all
required packages is quite simple:

```bash
conda env create -f conda-env.yml
source .envrc
```

The web ui will need a connection to a solr and mariadb service.
This services can be deployed using
[`docker-compose`](https://docs.docker.com/compose/install/).

```bash
docker-compose up -d
```

When finished, tear down the environment with

```bash
docker-compose down
```

### Running tests

There are some rudimentary tests that check the integration of `django` and the
`nodejs` building process. Assuming you have followed steps mentioned above and
created a `freva-dev` cona miniconda environment you can run the tests after
activating this environment:

```bash
conda activate freva-web
python -m pytest -vv tests
```

## Django deployment

you can check if django is working and correctly configured by:

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

**Please note:** You need a Node version of at least 16.5 along a npm version of 8.19

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
