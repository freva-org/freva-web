# Production system deployment
The deployment of a production system is done by a dedicated deployment
repository that sets up the backend, frontend and all services. To deploy the
web frontend in a production environment use the [deployment repository](https://gitlab.dkrz.de/freva/deployment)

# Setting up a development version:
## Installation of the required packages
The frontend will build upon an installed [backend version](https://gitlab.dkrz.de/freva/evaluation_system).
Hence you will need to install the backend first. We recommend creating a dedicated
anaconda environment where both frontend and backend are installed. In case
you haven't already done so you have to check out the backend and install the
anaconda environment first:

```bash
git clone https://gitlab.dkrz.de/freva/evaluation_system
cd evaluation_system
conda env create -f dev-environment.yml
conda activate freva-dev
source .envrc
conda env config vars set EVALUATION_SYSTEM_CONFIG_FILE=$EVALUATION_SYSTEM_CONFIG_FILE
conda env config vars set PUBKEY=$EVALUATION_SYSTEM_CONFIG_FILE
conda deactivate
conda activate freva-dev
pip install (-e) .
```

The back- and frontend will need a connection to a solr and maraidb service.
This services can be deployed using [`docker-compose`](https://docs.docker.com/compose/install/) (Linux users need to install it separately):

```bash
docker-compose up -d
```
_Note_: MariaDB and Solr will listen on ports 10000 and 10001 respectively to avoid collisions if these are already
running on the machine.

When finished, tear down the environment with

```bash
docker-compose down
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

