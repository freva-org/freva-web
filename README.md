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

- To *setup* / *initialise* the nodejs and django servers use:
    ```console
    make setup
    ```
- To *run* node and django servers use:
    ```console
    make run
    ```
- To use both `setup` and `run` command use just use make:
    ```console
    make
    ```
- To stop the servers use:
    ```console
    make stop
    ```

The django and npm development servers will write output into `runserver.log` and
`npm.log`. You can observe the output of the processes using `tail -f` or something
similar.

> ``📝`` You need a Node version of at least 16.5 along a npm version of 8.19

# Production
The web app is meant to be applied in a docker container. A pre-build image
of the web app is available via:

```console
docker pull ghcr.io/freva-clint/freva-web:latest
```

When running in production mode you should set the following container
environment variables:

- ``EVALUATION_SYSTEM_CONFIG_FILE`` : Path to the freva config file
- ``LDAP_USER_DN``: the Distinguished Name within ldap for example
                    `uid=jdoe,ou=users,dc=example,dc=com`.
- ``LDAP_USER_PW``: password for the LDAP server connection.
- ``DJANGO_SUPERUSER_PASSWORD``: the super user password for the django app.

The web app app is running on port 8000, hence you want to publish this port
via the `-p` flag. Ideally the path to the `$EVALUATION_SYSTEM_CONFIG_FILE`
should be mounted into the container as a volume. Since static files are served
by the http web server and not the django web app you have to add the location
of the static files (e.g. `/srv/static`) as a volume into the container to the
`/opt/freva_web/static` location. On startup of the container django app will
create all static files that will then be available through `/srv/static` on
the docker host.

All together a minimal working example looks like this:

```console
docker run -it -e EVALUATION_SYSTEM_CONFIG_FILE=/work/freva/evaluation_system.conf \
        -e LDAP_USER_DN='uid=jdoe,ou=users,dc=example,dc=com' \
        -e LDAP_USER_PW='secret' \
        -e DJANGO_SUPERUSER_PASSWORD='more_secret' \
        -v /work/freva:/work/freva:z \
        -v /srv/static:/opt/freva_web/static:z \
        -p 8000:8000 \
        ghcr.io/freva-clint/freva-web:latest
```
The web app is then available via port 8000 on the host system.

## Making the web app available on a web server.
To be able to access the web app through a normal http web server you will need
to setup a reverse proxy on your http web server to port 8000. Refer to the
reverse proxy settings for your web server. Here is a minimal example for
apache httpd (using the example from above where the static files are located
in `/srv/static` on the docker host):

```
Listen 80
LoadModule proxy_html_module modules/mod_proxy_html.so
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_connect_module modules/mod_proxy_connect.so
LoadModule proxy_http_module modules/mod_proxy_http.so
<VirtualHost *:80>
     ProxyPass /static/ !
     ProxyPass /api/databrowser/ http://freva-databrowser.example.com:7777/api/databrowser/
     ProxyPassReverse /api/databrowser/ http://freva-databrowser.example.com:7777/api/databrowser/
     ProxyPass / http://freva.example.com:8000/
     ProxyPassReverse / http://freva.example.com:8000/
     Alias /static /srv/static/
     Alias /robots.txt /srv/static/robots.txt
     Alias /favicon.ico /srv/static/favicon.ico
</VirtualHost>
```
> ``📝`` This is a minimal example, in a real world scenario you should always
         configure your web server to enable web encryption via port 443.

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
