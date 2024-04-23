"""This is the 2nd configuration file for the web app.

Since the web app is meant to be run in a container most of its config
is passed by environment variables. Here is a list of variables that are
evaluated:

EVALUATION_SYSTEM_CONFIG_FILE : str
FREVA_WEB_CONFIG_FILE : str
DEV_MODE : 0|1
PROJECT_ROOT : str
AUTH_LDAP_SERVER_URI : str
AUTH_LDAP_START_TLS : 0|1
ALLOWED_GROUP : str
LDAP_USER_BASE : str
LDAP_GROUP_BASE : str
LDAP_FIRSTNAME_FIELD : str
LDAP_LASTNAME_FIELD : str
LDAP_EMAIL_FIELD : str
LDAP_GROUP_CLASS : str
LDAP_GROUP_TYPE : str
LDAP_USER_DN : str
LDAP_USER_PW : str
LDAP_MODEL : str
SCHEDULER_HOST : str
REDIS_HOST : str
REDIS_PORT : str
SERVER_EMAIL : str
EMAIL_HOST : str
EMAIL_PORT : str
ALLOWED_HOSTS : str
CSRF_TRUSTED_ORIGINS : str
FREVA_BIN: str
"""

import os
import shutil
import sys
from pathlib import Path

import ldap
import requests
import toml
from django.urls import reverse_lazy
from django_auth_ldap.config import LDAPSearch, NestedGroupOfNamesType, PosixGroupType
from evaluation_system.misc import config

from base.exceptions import UnknownLDAPGroupTypeError

freva_share_path = Path(os.environ["EVALUATION_SYSTEM_CONFIG_FILE"]).parent
web_config_path = Path(
    os.environ.get(
        "FREVA_WEB_CONFIG_FILE",
        freva_share_path / "web" / "freva_web_conf.toml",
    )
)


def _get_conf_key(cfg, key, alternative, is_file=True):
    """Check config of freva_web config."""
    if not is_file:
        return cfg.get(key) or alternative
    value = Path(cfg.get(key, alternative))
    if value.exists():
        return value
    return Path(alternative)


def _get_logo(logo_file, project_root):
    static_folder = Path(project_root) / "static"
    if (
        not logo_file
        or not Path(logo_file).exists()
        or not (static_folder / "img").exists()
    ):
        return "/static/img/thumb-placeholder.png"
    logo_file = Path(logo_file)
    new_file = static_folder / "img" / logo_file.name
    if new_file.exists():
        return f"/static/img/{logo_file.name}"
    shutil.copy(logo_file, new_file)
    return f"/static/img/{logo_file.name}"


def _read_secret(port: int = 5002, key: str = "email") -> dict[str, str]:
    """Read the key-value pair secrets from vault server."""
    sha = config._get_public_key(config.get("project_name"))
    uri = f"http://{config.get('db.host')}:{port}/vault/{key}/{sha}"
    try:
        req = requests.get(uri).json()
    except requests.exceptions.ConnectionError:
        req = {}
    return req


def _set_favicon(html_color: str, project_root: Path) -> None:
    img_folder = Path(project_root) / "static" / "img"
    tmpl_folder = Path(project_root) / "static_root" / "img"
    svg_tmpl = tmpl_folder / "favicon-tmpl.svg"
    if img_folder.exists():
        favicon = img_folder / "favicon.svg"
    else:
        favicon = tmpl_folder / "favicon.svg"
    with svg_tmpl.open() as f_obj:
        new_svg = f_obj.read().replace(
            'style="fill:#000000"', f'style="fill:{html_color}"'
        )
    with favicon.open("w") as f_obj:
        f_obj.write(new_svg)


try:
    web_config = toml.loads(web_config_path.read_text())
except FileNotFoundError:
    web_config = {}
# SECURITY WARNING: don't run with debug turned on in production!
# Set this to 0 on all server instances and True only for development.
DEV = DEBUG = TEMPLATE_DEBUG = bool(int(os.environ.get("DEV_MODE", 0)))
PROJECT_ROOT = os.environ.get("PROJECT_ROOT", None) or str(
    Path(__file__).absolute().parents[2]
)
STATIC_URL = "/static/"
if not DEV:
    STATIC_ROOT = str(Path(PROJECT_ROOT) / "static")

INSTITUTION_LOGO = _get_logo(
    web_config.get("institution_logo", ""), PROJECT_ROOT
)
FREVA_LOGO = f"{STATIC_URL}img/by_freva_transparent.png"
MAIN_COLOR = _get_conf_key(web_config, "main_color", "Tomato", False)
_set_favicon(MAIN_COLOR, Path(PROJECT_ROOT))
BORDER_COLOR = _get_conf_key(web_config, "border_color", "#6c2e1f", False)
HOVER_COLOR = _get_conf_key(web_config, "hover_color", "#d0513a", False)
HOMEPAGE_TEXT = web_config.get(
    "homepage_text") or (
        "Lorem ipsum dolor sit amet"
        ", consectetur adipiscing elit"
        ", sed do eiusmod tempor incididunt ut"
        "labore et dolore magna aliqua. Ut enim"
        "ad minim veniam, quis nostrud exercitation"
        "ullamco laboris nisi ut aliquip ex ea commodo"
        "consequat. Duis aute irure dolor in reprehenderit"
        "in voluptate velit esse cillum dolore eu fugiat"
        "nulla pariatur. Excepteur sint occaecat cupidatat"
        "non proident, sunt in culpa qui officia deserunt"
        "mollit anim id est laborum."
)
IMPRINT = web_config.get(
    "imprint") or [
        "ANAIS - RegIKlim",
        "German Climate Computing Center (DKRZ)",
        "Bundesstr. 45a",
        "20146 Hamburg",
        "Germany",
]
HOMEPAGE_HEADING = web_config.get("homepage_heading") or  "Lorem ipsum dolor."
ABOUT_US_TEXT = web_config.get("about_us_text") or  "Hello world, this is freva.")
CONTACTS = web_config.get("contacts") or  ["freva@dkrz.de"]
if isinstance(CONTACTS, str):
    CONTACTS = [c for c in CONTACTS.split(",") if c.strip()]
##########
# Here you can customize the footer and texts on the startpage
##########
INSTITUTION_NAME = web_config.get("insitution_name") or "Freva"
##################################################
##################################################
# SETTING FOR LDAP
# http://pythonhosted.org//django-auth-ldap/
#
# Freva is using LDAP on two different occasions:
# - As an authentication service: For this we use the built-in
#   Django-Functionalities. All LDAP-Properties below starting with
#   `AUTH_LDAP`` belong to this.
# - As a lookup for available users, e.g. for notify them about events
#   or share results. This is implemented in ldaptools.py and all
#   properties starting with `LDAP_` belong to this.
##################################################
##################################################
# The server for LDAP configuration
AUTH_LDAP_SERVER_URI = os.environ.get(
    "AUTH_LDAP_SERVER_URI", "ldap://idm-dmz.dkrz.de"
)
AUTH_LDAP_START_TLS = bool(int(os.environ.get("AUTH_LDAP_START_TLS", "0")))
# The directory with SSL certificates
CA_CERT_DIR = str(web_config_path.parent)
# the only allowd group
ALLOWED_GROUP = os.environ.get("ALLOWED_GROUP", "") or "*"
# Require a ca certificate
AUTH_LDAP_GLOBAL_OPTIONS = {
    ldap.OPT_X_TLS_REQUIRE_CERT: ldap.OPT_X_TLS_DEMAND,  # TPYE OF CERTIFICATION
    ldap.OPT_X_TLS_CACERTDIR: CA_CERT_DIR,  # PATH OF CERTIFICATION
}
# this is not used by django directly, but we use it for
# python-ldap access, as well.
LDAP_USER_BASE = os.environ.get(
    "LDAP_USER_BASE", "cn=users,cn=accounts,dc=dkrz,dc=de"
)
LDAP_GROUP_BASE = os.environ.get(
    "LDAP_GROUP_BASE", "cn=groups,cn=accounts,dc=dkrz,dc=de"
)

AUTH_LDAP_USER_SEARCH = LDAPSearch(
    LDAP_USER_BASE, ldap.SCOPE_SUBTREE, "(uid=%(user)s)"
)
# keep the authenticated user for group search
AUTH_LDAP_BIND_AS_AUTHENTICATING_USER = True
if ALLOWED_GROUP != "*":
    # ALLOWED_GROUP_MEMBER user only
    AUTH_LDAP_REQUIRE_GROUP = f"cn={ALLOWED_GROUP},{LDAP_GROUP_BASE}"

LDAP_FIRSTNAME_FIELD = os.environ.get("LDAP_FIRSTNAME_FIELD", "givenname")
LDAP_LASTNAME_FIELD = os.environ.get("LDAP_LASTNAME_FIELD", "sn")
LDAP_EMAIL_FIELD = os.environ.get("LDAP_EMAIL_FIELD", "mail")
LDAP_GROUP_CLASS = (
    f'(objectClass={os.environ.get("LDAP_GROUP_CLASS", "groupOfNames")})'
)
LDAP_GROUP_TYPE = os.environ.get(
    "LDAP_GROUP_TYPE", "nested"
)  # accepted values: nested, posix

if LDAP_GROUP_TYPE == "nested":
    AUTH_LDAP_GROUP_TYPE = NestedGroupOfNamesType()
elif LDAP_GROUP_TYPE == "posix":
    AUTH_LDAP_GROUP_TYPE = PosixGroupType()
else:
    raise UnknownLDAPGroupTypeError()

AUTH_LDAP_USER_ATTR_MAP = {
    "email": LDAP_EMAIL_FIELD,
    "last_name": LDAP_LASTNAME_FIELD,
    "first_name": LDAP_FIRSTNAME_FIELD,
}

AUTH_LDAP_GROUP_SEARCH = LDAPSearch(
    LDAP_GROUP_BASE, ldap.SCOPE_SUBTREE, LDAP_GROUP_CLASS
)

AUTH_LDAP_MIRROR_GROUPS = True
# agent user for LDAP
LDAP_USER_DN = os.environ.get("LDAP_USER_DN", "")

LDAP_USER_PW = os.environ.get("LDAP_USER_PW", "")

AUTH_LDAP_BIND_DN = LDAP_USER_DN
AUTH_LDAP_BIND_PASSWORD = LDAP_USER_PW

LDAP_GROUP_FILTER = f"(cn={ALLOWED_GROUP})"
LDAP_MODEL = f'django_evaluation.ldaptools.{os.environ.get("LDAP_MODEL", "MiklipUserInformation")}'
##################################################
##################################################
# END SETTING FOR LDAP
##################################################
##################################################
# the host to start the scheduler
SCHEDULER_HOSTS = [
    h.strip()
    for h in os.environ.get("SCHEDULER_HOST", "levante.dkrz.de").split(",")
    if h.strip()
]
# temporary directory for tailed scheduler files
TAIL_TMP_DIR = "/tmp/tail/"
# Additional locations of static files
STATICFILES_DIRS = (
    # Put strings here, like "/home/html/static" or "C:/www/django/static".
    # Always use forward slashes, even on Windows.
    os.path.join(PROJECT_ROOT, "static_root"),
    ("assets/bundles", os.path.join(PROJECT_ROOT, "assets", "bundles")),
)
# List of finder classes that know how to find static files in
# various locations.
STATICFILES_FINDERS = (
    "django.contrib.staticfiles.finders.FileSystemFinder",
    "django.contrib.staticfiles.finders.AppDirectoriesFinder",
    "django.contrib.staticfiles.finders.DefaultStorageFinder",
)
config.reloadConfiguration()
db_name = config.get("db.db")
db_user = config.get("db.user")
db_password = config.get("db.passwd")
db_host = config.get("db.host")
db_port = config.get("db.port")
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": db_name,
        "USER": db_user,
        "PASSWORD": db_password,  #'miklip',
        "HOST": db_host,  #'wwwdev-miklip',
        "PORT": db_port,
        "OPTIONS": {"charset": "utf8mb4"},
    },
}
# register the LDAP authentication backend
AUTHENTICATION_BACKENDS = (
    "django.contrib.auth.backends.ModelBackend",
    "django_auth_ldap.backend.LDAPBackend",
)

REDIS_HOST = os.environ.get("REDIS_HOST", "127.0.0.1")
REDIS_PORT = os.environ.get("REDIS_PORT", 6379)

DATA_BROWSER_HOST = config.get("databrowser.host", "http://localhost:7777")

SERVER_EMAIL = os.environ.get("SERVER_EMAIL", "freva@dkrz.de")
DEFAULT_FROM_EMAIL = SERVER_EMAIL

EMAIL_HOST = os.environ.get("EMAIL_HOST", "mailhost.dkrz.de")

email_secrets = _read_secret()
EMAIL_HOST_USER = email_secrets.get("username")
EMAIL_HOST_PASSWORD = email_secrets.get("password")

EMAIL_USE_TLS = True
EMAIL_PORT = os.environ.get("EMAIL_PORT", 25)

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": f"redis://{REDIS_HOST}:{REDIS_PORT}",
    },
}

HOME_DIRS_AVAILABLE = False

# Hosts/domain names that are valid for this site; required if DEBUG is False
# See https://docs.djangoproject.com/en/1.5/ref/settings/#allowed-hosts
ALLOWED_HOSTS = [
    h.strip()
    for h in os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1")
    if h.strip()
]

# Provide a full list of all valid hosts (including the http(s):// prefix) which are expected
CSRF_TRUSTED_ORIGINS = [
    h.strip()
    for h in os.environ.get("CSRF_TRUSTED_ORIGINS", "http://localhost").split(
        ","
    )
    if h.strip()
]

USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# path to the site packages used:
VENV_PYTHON_DIR = "/usr/bin/python3"
# Path to miklip-logo
MIKLIP_LOGO = STATIC_URL + "img/miklip-logo.png"
LOAD_MODULE = " "
FREVA_BIN = os.environ.get("FREVA_BIN", os.path.join(sys.exec_prefix, "bin"))
NCDUMP_BINARY = os.path.join(FREVA_BIN, "metadata-inspector") + " --html"
# result to show at guest tour
GUEST_TOUR_RESULT = 105
SHELL_IN_A_BOX = "/shell/"
WEBPACK_LOADER = {
    "DEFAULT": {
        "BUNDLE_DIR_NAME": "assets/bundles",
        "STATS_FILE": PROJECT_ROOT + "/webpack-stats.json",
    }
}
RESULT_BROWSER_FACETS = [
    "plugin",
    "project",
    "product",
    "institute",
    "model",
    "experiment",
    "time_frequency",
    "variable",
]
MENU_ENTRIES = []

# Sometimes it is desired to put a link into the navbar which does not correspond
# to a template inside django. If something like this is needed, put a slash as a
# prefix to your relative url (the second value in each of the lists), e.g. "/impressum"
_MENU_ENTRIES = [
    ["Data-Browser", "solr:data_browser", "browser_menu"],
    ["Plugins", "plugins:home", "plugin_menu"],
    ["History", "history:history", "history_menu"],
    ["Result-Browser", "history:result_browser", "result_browser_menu"],
]

for title, url, html_id in web_config.get("menu_entries", []) or  _MENU_ENTRIES:
    if url.startswith("/"):
        MENU_ENTRIES.append({"name": title, "url": url, "html_id": html_id})
    else:
        MENU_ENTRIES.append(
            {"name": title, "url": reverse_lazy(url), "html_id": html_id}
        )
