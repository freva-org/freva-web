# Freva web user interface (web ui)
The deployment of a production system is done by a dedicated deployment
repository that sets up the backend, front end and all services. To deploy the
web front end in a production environment use the
[deployment procedure](https://freva-deployment.readthedocs.io/en/latest/)

# Setting up a development version:

To start development with freva clone the repository and its sub-modules:

```console
git clone --recursive git@github.com:FREVA-CLINT/freva-web.git
```


## Installation of the required packages and infrastructure

The web ui is being deployed in a dedicated anaconda environment. Hence
you need [anaconda](https://www.anaconda.com/products/distribution) to be
installed on you computer. Once anaconda is set up the installation of all
required packages is quite simple:

```console
conda env create -f conda-env.yml
source .envrc
```

The web ui will need a connection to a solr and mariadb service.
This services can be deployed using
[`docker-compose`](https://docs.docker.com/compose/install/).

```console
docker-compose up -d
```

When finished, tear down the environment with

```console
docker-compose down
```

### Running tests

There are some rudimentary tests that check the integration of `django` and the
`nodejs` building process. Assuming you have followed steps mentioned above and
created a `freva-dev` conda miniconda environment you can run the tests after
activating this environment:

```console
conda activate freva-web
python -m pytest -vv tests
```

## Using GNU `make`:
We have created a Makefile that sets up a development version of the web. You
can use:

- `make setup` to setup the node and django servers
- `make run` to run the django and npm development servers
- `make` or `make all` to do both, `make setup` and `make run`
- `make stop` to stop the django and npm development servers

The django and npm development servers will write output into runserver.log and
npm.log. You can observe the output of the processes using `tail -f` or something
similar.

```note
You need a Node version of at least 16.5 along a npm version of 8.19
```

# Create a new web release.
The production systems are deployed in a docker image hosted on the GitHub
container registry: `ghcr.io/freva-clint/freva-web`. A GitHub workflow has to
be triggered in order to build an updated version of the docker image and push
it to the registry. To do so please follow the following steps.

- Make sure the main branch is up to date
- Bump the version in the `package.json` file. Currently caldev versioning is
  used. An example would be
    ```json
    "version": "2023.07.19"
    ```
- After you have push the version changes to the main branch you can create
  a new tag with the same version:
    ```console
    git tag -a vVERSION -m "comment"
    ```
  for example:
    ```console
    git tag -a v2023.07.19 -m "Some prettifications."
    ```
- Push the tag to the remote repository:
    ```console
    git push origin vVERSION
    ```

These steps trigger the creation of a new container image.
