from pathlib import Path
import os
import logging
import pymysql
import ldap
import django_auth_ldap.config as ldap_cfg
from django_auth_ldap.config import LDAPSearch, NestedGroupOfNamesType
from evaluation_system.misc import config
from django.urls import reverse_lazy
config.reloadConfiguration()
config.loadWebconfiguration("website")
pymysql.version_info = (1, 4, 2, "final", 0)
pymysql.install_as_MySQLdb()
PROJECT_ROOT = str(Path(__file__).absolute().parents[2])
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(PROJECT_ROOT, 'static')

INSTITUTION_LOGO = STATIC_URL + f'img/'+config.getWebconfig(config.INSTITUTION_LOGO)
FREVA_LOGO = STATIC_URL + 'img/'+config.getWebconfig(config.FREVA_LOGO)
MAIN_COLOR = config.getWebconfig(config.MAIN_COLOR
BORDER_COLOR =config.getWebconfig(config.BORDER_COLOR)
HOVER_COLOR = config.getWebconfig(config.HOVER_COLOR)

##########
#Here you can customize the footer and texts on the startpage
##########
ABOUT_US_TEXT =config.getWebconfig(config.ABOUT_US_TEXT)
CONTACTS = config.getWebconfig(config.CONTACTS)
IMPRINT = [config.getWebconfig(config.PROJECT),config.getWebconfig(config.INSTITUTE_NAME),config.getWebconfig(config.INSTITUTE_ADDRESS),config.getWebconfig(config.ZIP_STATE),config.getWebconfig(config.ZIP_STATE,config.getWebconfig(config.COUNTRY)]
HOMEPAGE_HEADING = config.getWebconfig(config.HOMEPAGE_HEADING)
HOMEPAGE_TEXT = config.getWebconfig(config.HOMEPAGE_TEXT)
INSTITUTION_NAME = config.getWebconfig(config.INSTITUTION_NAME)
# the host to start the scheduler
SCHEDULER_HOSTS=config.getWebconfig(config.SCHEDULER_HOSTS)  # 'mistral.dkrz.de']
# temporary directory for tailed scheduler files
TAIL_TMP_DIR = config.getWebconfig(config.TAIL_TMP_DIR) # '/tmp/tail_offset/'
##################################################
##################################################
#SETTING FOR LDAP
#http://pythonhosted.org//django-auth-ldap/
##################################################
##################################################
config.loadWebconfiguration("ldap_settings")
# The server for LDAP configuration
AUTH_LDAP_SERVER_URI = config.getWebconfig(config.AUTH_LDAP_SERVER_URI)
AUTH_LDAP_START_TLS =config.getWebconfig(config.AUTH_LDAP_START_TLS)
#AUTH_LDAP_SERVER_URI = "ldap://idm.dkrz.de"
# The directory with SSL certificates
CA_CERT_DIR = config.getWebconfig(config.CA_CERT_DIR)
# the only allowd group
ALLOWED_GROUP =  config.getWebconfig(config.ALLOWED_GROUP)
# Require a ca certificate
AUTH_LDAP_GLOBAL_OPTIONS = {
    ldap.OPT_X_TLS_REQUIRE_CERT:  ldap.OPT_X_TLS_DEMAND, #TPYE OF CERTIFICATION
    ldap.OPT_X_TLS_CACERTDIR: CA_CERT_DIR, #PATH OF CERTIFICATION
}
# this is not used by django directly, but we use it for
# python-ldap access, as well.
LDAP_USER_BASE = config.getWebconfig(config.LDAP_USER_BASE)
# Verify the user by bind to LDAP
AUTH_LDAP_USER_DN_TEMPLATE = "uid=%%(user)s, %s" % LDAP_USER_BASE
# keep the authenticated user for group search
AUTH_LDAP_BIND_AS_AUTHENTICATING_USER=config.getWebconfig(config.AUTH_LDAP_BIND_AS_AUTHENTICATING_USER)
# ALLOWED_GROUP_MEMBER user only
AUTH_LDAP_REQUIRE_GROUP = config.getWebconfig(config.AUTH_LDAP_REQUIRE_GROUP)  % ALLOWED_GROUP
AUTH_LDAP_USER_ATTR_MAP = {
    "email": config.getWebconfig(config.MAIL),
    "last_name" : config.getWebconfig(config.LAST_NAME),
    "first_name" : config.getWebconfig(config.GIVENNAME),
}
AUTH_LDAP_GROUP_SEARCH = LDAPSearch(config.getWebconfig(AUTH_LDAP_GROUP_SEARCH),
                                     ldap.SCOPE_SUBTREE, #USE SUB
                                     '(objectClass=groupOfNames)')
AUTH_LDAP_GROUP_TYPE = NestedGroupOfNamesType()
AUTH_LDAP_MIRROR_GROUPS = config.getWebconfig(config.AUTH_LDAP_MIRROR_GROUPS)
# agent user for LDAP
LDAP_USER_DN = config.getWebconfig(LDAP_USER_DN)
LDAP_USER_PW = config.getWebconfig(LDAP_USER_PW)
LDAP_GROUP_BASE = config.getWebconfig(LDAP_GROUP_BASE)
LDAP_MIKLIP_GROUP_FILTER = '(cn='+config.getWebconfig(LDAP_MIKLIP_GROUP_FILTER)+')'
LDAP_MODEL = config.getWebconfig(LDAP_MODEL)
##################################################
##################################################
#END SETTING FOR LDAP
##################################################
##################################################

# Additional locations of static files
STATICFILES_DIRS = (
    # Put strings here, like "/home/html/static" or "C:/www/django/static".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
    #('preview', '/miklip/integration/evaluation_system/database/preview'),
    #PROJECT_ROOT + 'assets',
    #os.path.join(PROJECT_ROOT, 'static'),
    os.path.join(PROJECT_ROOT, 'assets'),
    #('assests', '/home/mahesh/Freva/freva_web/assets/'),
    #('preview', '/home/mahesh/Freva/freva_web/misc4freva/db4freva/preview'),
)
# List of finder classes that know how to find static files in
# various locations.
#STATICFILES_FINDERS = (
#    'django.contrib.staticfiles.finders.FileSystemFinder',
#    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
#    'django.contrib.staticfiles.finders.DefaultStorageFinder',
#)

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': config.get(config.DB_DB),
        'USER': config.get(config.DB_USER),
        'PASSWORD': config.get(config.DB_PASSWD), #'miklip',
        'HOST': config.get(config.DB_HOST), #'wwwdev-miklip',
        'PORT': config.get(str(config.DB_PORT), '3306'),
        'OPTIONS': {
            'charset': 'utf8mb4'
            }
    },
}
# register the LDAP authentication backend 
AUTHENTICATION_BACKENDS = (
    'django.contrib.auth.backends.ModelBackend',
    'django_auth_ldap.backend.LDAPBackend',
)
# SECURITY WARNING: don't run with debug turned on in production!
# Debugging displays nice error messages, but leaks memory. Set this to False
# on all server instances and True only for development.
DEBUG = TEMPLATE_DEBUG = True
# Is this a development instance? Set this to True on development/master
# instances and False on stage/prod.
DEV = False
# Hosts/domain names that are valid for this site; required if DEBUG is False
# See https://docs.djangoproject.com/en/1.5/ref/settings/#allowed-hosts
#ALLOWED_HOSTS = ['localhost', '127.0.0.1','www.freva.dkrz.de', 'freva.dkrz.de']
ALLOWED_HOSTS = ['*']
# path to the site packages used:
VENV_PYTHON_DIR = PROJECT_ROOT + '/conda/bin/python'
# Path to miklip-logo
MIKLIP_LOGO = STATIC_URL + 'img/miklip-logo.png'
NCDUMP_BINARY = '/work/ch1187/regiklim-ces/freva/xarray/bin/ncdump_fancy'
LOAD_MODULE='source /etc/profile > /dev/null;module load /work/ch1187/regiklim-ces/misc4freva/loadscripts/loadfreva.modules > /dev/null;'
# result to show at guest tour
GUEST_TOUR_RESULT = 105
SHELL_IN_A_BOX = '/shell/'
WEBPACK_LOADER = {
    'DEFAULT': {
        'BUNDLE_DIR_NAME': 'dist/',
        'STATS_FILE': PROJECT_ROOT +  '/webpack-stats-prod.json',
    }
}
RESULT_BROWSER_FACETS = ['plugin', 'project', 'product', 'institute', 'model', 'experiment', 'time_frequency', 'variable']
MENU_ENTRIES = [
    #{'name':'Forecast','url': '/forecast-frontend/', 'html_id': 'forecast'},
    #{'name':'Hindcast','url': reverse_lazy('hindcast_frontend:hindcast_frontend'), 'html_id': 'hindcast'},
    {'name':'Plugins','url': reverse_lazy('plugins:home'), 'html_id': 'plugin_menu'},
    {'name':'History','url': reverse_lazy('history:history'), 'html_id': 'history_menu'},
    {'name':'Result-Browser', 'url': reverse_lazy('history:result_browser'), 'html_id': 'result_browser_menu'},
    {'name':'Data-Browser', 'url': reverse_lazy('solr:data_browser'), 'html_id': 'browser_menu'},
#    {'name':'Wiki','url': reverse_lazy('base:wiki'), 'html_id': 'wiki_menu'},
#    {'name':'Chat','url': reverse_lazy('base:chat'), 'html_id': 'chat_menu'},
    {'name':'Help','url': reverse_lazy('plugins:about'), 'html_id': 'doc_menu'},
]

