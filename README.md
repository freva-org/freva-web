# Freva web user interface (web ui)
The deployment of a production system is done by a dedicated deployment
repository that sets up the backend, front end and all services. To deploy the
web front end in a production environment use the
[deployment procedure](https://freva-deployment.readthedocs.io/en/latest/)

# Setting up a development version:

To start development with freva clone the repository and its sub-modules:

```console
git clone --recursive git@github.com:freva-org/freva-web.git
```

And create a pair of self-signed keys. These keys will be used by various
services.

```console
python docker/config/dev-utils.py gen-certs
```


## The development stack

The web app needs several components to run: the node.js frontend, the
Django backend, the freva-rest API with its data-loader, and the databases
behind them. The development stack runs all of them in containers, with the
code bind-mounted so every part reloads when you edit it. The only things to
install are [just](https://just.systems) and either docker or podman with
compose.

- Once per clone, fetch freva-nextgen into `docker/` and build the dev images:
    ```console
    just setup
    ```
- Start everything (Ctrl-C stops it), or the same in the background:
    ```console
    just dev
    just up
    ```
- Open <http://localhost:8000> and log in with your user name and the
  password `secret`. Django's admin is `admin` / `secret`, Keycloak's admin
  console is on <http://localhost:8080> (`keycloak` / `secret`).

After `just setup`, a plain `docker compose up` (or `podman-compose up`)
starts the same stack. With podman, `COMPOSE=podman-compose just dev` makes
the recipes use it.

Run `just` on its own to list every recipe. The ones you will use most:

```console
just logs web freva-rest   # follow some services' logs
just shell                 # a shell in the web container
just manage shell          # any Django management command
just restart freva-rest    # e.g. after changing freva-rest's dependencies
just update-nextgen        # fast-forward docker/freva-nextgen if it is on main
just lint                  # the same checks CI runs
just test
just nuke                  # delete all databases and start over
```

Everything is served same-origin through a Caddy proxy whose routes mirror
the production nginx configuration (`docker/dev/Caddyfile`). freva-nextgen is
cloned into `docker/freva-nextgen`: check out a branch there to develop the
web app against it. The recipes that run inside the containers are in
`docker/dev/container.just`.


Admin user name. `just` evaluates environment variables and will define the user
name stored in the `$USER` environment variable as standard admin user. You can
override this user name by explicitly setting the  `USER` environment variable.

```console
USER=my-user just rebuild up
```

`just` will choose the current user name by default. You will be able to login
via the dev keycloak instance with that username, password: `secret`.


### Chatbot Configuration

The chatbot requires specific environment variables to run, as its backend operates on a production system. This setup ensures it connects to an accessible Freva instance and project as a hub.

#### Required Environment Variables:
Choose one of running Freva instances and get the values from there and set via environment.

| Variable                 | Description                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------ |
| `CHAT_BOT_URL`           | URL of the chatbot backend (default example: `http://vader4-icpub.lvt.dkrz.de:8502`) |
| `CHAT_BOT_AUTH_KEY`      | Authentication key for the chatbot (set via environment variable)                    |
| `CHAT_BOT_FREVA_CONFIG`  | Path or configuration string for Freva (set via environment variable)                |
| `VAULT_URL`              | URL of the Vault system providing secrets (set via environment variable)             |
| `CHAT_BOT_FREVA_PROJECT` | Name of the Freva project the chatbot should use (set via environment variable)      |
| `FREVA_REST_URL` | URL of the freva-rest of one running freva instance (set via environment variable)      |
| `OIDC_DISCOVERY_URL` | OpenID Connect discovery URL for authentication (set via environment variable) |

#### Optional:

| Variable   | Description                                                                     |
| ---------- | ------------------------------------------------------------------------------- |
| `CHAT_BOT` | Set to `"1"` to activate the chatbot, `"0"` to disable it (default is disabled) |

> [!NOTE]
> When setting these environment variables, ensure you use the same well-known configuration (especially OIDC_DISCOVERY_URL) that the running Freva instance is using. This ensures both the chatbot and development environment use consistent authentication and configuration settings, allowing them to "speak the same auth language" and integrate seamlessly with the existing Freva infrastructure.

### Running tests

There are some rudimentary tests that check the integration of `django` and the
`nodejs` building process. Assuming you have followed steps mentioned above and
created a `freva-dev` conda miniconda environment you can run the tests after
activating this environment:

```console
conda activate freva-web
python -m pytest -vv tests
```



# The Production container
This section only briefly describes the docker image that is automatically
created (see the [next section](#create-a-new-web-release) on how to trigger a
build of the image) and is not meant for actual application. Please install and
use the [freva-deployment package](https://pypi.org/project/freva-deployment/)
to deploy the web app in production mode.

A pre-build image of the web app is available via:

```console
docker pull ghcr.io/freva-org/freva-web:latest
```

When running in production mode you should set the following container
environment variables:

- ``EVALUATION_SYSTEM_CONFIG_FILE`` : Path to the freva config file
- ``DJANGO_SUPERUSER_PASSWORD``: the super user password for the django app.

The web app app is running on port 8000, hence you want to publish this port
via the `-p` flag. Ideally the path to the `$EVALUATION_SYSTEM_CONFIG_FILE`
should be mounted into the container as a volume.

Since static files are served by the http web server and not the django web app
you have to add the location of the static files (e.g. `/srv/static`) as a
volume into the container to the `/opt/freva_web/static` location.
On startup of the container django app will create all static files that will
then be available through `/srv/static` on the docker host.

All together a minimal working example looks like this:

```console
docker run -it -e EVALUATION_SYSTEM_CONFIG_FILE=/work/freva/evaluation_system.conf \
        -e LDAP_USER_DN='uid=jdoe,ou=users,dc=example,dc=com' \
        -e LDAP_USER_PW='secret' \
        -e DJANGO_SUPERUSER_PASSWORD='more_secret' \
        -v /work/freva:/work/freva:z \
        -v /srv/static:/opt/freva_web/static:z \
        -p 8000:8000 \
        ghcr.io/freva-org/freva-web:latest
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
     ProxyPass /api/freva-nextgen/ http://freva-databrowser.example.com:7777/api/freva-nextgen/
     ProxyPassReverse /api/freva-nextgen/ http://freva-databrowser.example.com:7777/api/freva-nextgen/
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
container registry: `ghcr.io/freva-org/freva-web`. A GitHub workflow has to
be triggered in order to build an updated version of the docker image and push
it to the registry. To do so please follow the following steps.

- Make sure the main branch is up to date
- Bump the version in the `package.json` file. Currently caldev versioning is
  used. An example would be
    ```json
    "version": "2023.07.19"
    ```
- After you have pushed the version changes to the main branch you can trigger
  the release procedure:
    ```console
    just release
    ```
This will check the current version of the `main` branch and trigger
a GitHub continuous integration pipeline to create the new release. The procedure
performs a couple of checks, if theses checks fail please make sure to address
the issues.
