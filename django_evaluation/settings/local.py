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

pymysql.version_info = (1, 4, 2, "final", 0)
pymysql.install_as_MySQLdb()
PROJECT_ROOT = str(Path(__file__).absolute().parents[2])
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(PROJECT_ROOT, 'static')

##################################################
##################################################
#SETTING FOR LDAP
#http://pythonhosted.org//django-auth-ldap/
##################################################
##################################################

cfg_file = Path(os.environ['EVALUATION_SYSTEM_CONFIG_FILE']).parent / 'ldap.conf'
cfg = config.get_section('ldap_setting', config_file=cfg_file)
# The server for LDAP configuration
AUTH_LDAP_SERVER_URI = cfg['AUTH_LDAP_SERVER_URI'] 
AUTH_LDAP_START_TLS = cfg['AUTH_LDAP_START_TLS']
#AUTH_LDAP_SERVER_URI = "ldap://idm.dkrz.de"
# The directory with SSL certificates
CA_CERT_DIR = cfg['CA_CERT_DIR']
# the only allowd group
ALLOWED_GROUP = cfg['ALLOWED_GROUP']
# Require a ca certificate
AUTH_LDAP_GLOBAL_OPTIONS = {
    ldap.OPT_X_TLS_REQUIRE_CERT: ldap.OPT_X_TLS_DEMAND, #TPYE OF CERTIFICATION
    ldap.OPT_X_TLS_CACERTDIR: CA_CERT_DIR, #PATH OF CERTIFICATION
}
# this is not used by django directly, but we use it for
# python-ldap access, as well.
LDAP_USER_BASE = cfg['LDAP_USER_BASE']
# Verify the user by bind to LDAP
AUTH_LDAP_USER_DN_TEMPLATE = "uid=%%(user)s, %s" % LDAP_USER_BASE
# keep the authenticated user for group search
AUTH_LDAP_BIND_AS_AUTHENTICATING_USER=cfg['AUTH_LDAP_BIND_AS_AUTHENTICATING_USER']
# ALLOWED_GROUP_MEMBER user only
AUTH_LDAP_REQUIRE_GROUP = cfg['AUTH_LDAP_REQUIRE_GROUP']  % ALLOWED_GROUP
AUTH_LDAP_USER_ATTR_MAP = {
    "email": cfg['EMAIL'],
    "last_name" : cfg['LAST_NAME'],
    "first_name" : cfg['FIRST_NAME'],
}
AUTH_LDAP_GROUP_SEARCH = LDAPSearch(cfg['AUTH_LDAP_GROUP_SEARCH'],
                                     ldap.SCOPE_SUBTREE, #USE SUB
                                     '(objectClass=groupOfNames)')
AUTH_LDAP_GROUP_TYPE = NestedGroupOfNamesType()
AUTH_LDAP_MIRROR_GROUPS = cfg['AUTH_LDAP_MIRROR_GROUPS']
# agent user for LDAP
LDAP_USER_DN = cfg['LDAP_USER_DN']
LDAP_USER_PW = cfg['LDAP_USER_PW']
LDAP_GROUP_BASE = cfg['LDAP_GROUP_BASE']
LDAP_MIKLIP_GROUP_FILTER = cfg['LDAP_MIKLIP_GROUP_FILTER']
LDAP_MODEL = ['LDAP_MODEL']
##################################################
##################################################
#END SETTING FOR LDAP
##################################################
##################################################


###################################
#Website Setting
##################################
##################################
cfg_file = Path(os.environ['EVALUATION_SYSTEM_CONFIG_FILE']).parent / 'website.conf'
cfg = config.get_section('website', config_file=cfg_file)

INSTITUTION_LOGO = STATIC_URL + cfg['INSTITUTION_LOGO']
FREVA_LOGO = STATIC_URL + cfg['FREVA_LOGO']
MAIN_COLOR = cfg['MAIN_COLOR']
BORDER_COLOR = cfg['BORDER_COLOR']
HOVER_COLOR = cfg['HOVER_COLOR']

##########
#Here you can customize the footer and texts on the startpage
##########
ABOUT_US_TEXT = cfg['ABOUT_US_TEXT']
CONTACTS = [cfg['CONTACTS']]
IMPRINT = [cfg['PROJECT'],cfg['INSTITUTE_NAME'], cfg['INSTITUTE_ADDRESS'],
           cfg['ZIP_STATE'], cfg['COUNTRY']]
HOMEPAGE_HEADING = cfg['HOMEPAGE_HEADING']
HOMEPAGE_TEXT = cfg['HOMEPAGE_TEXT"]
INSTITUTION_NAME = cfg['INSTITUTE_NAME']

# the host to start the scheduler
SCHEDULER_HOSTS=[cfg['SCHEDULER_HOSTS']  # 'mistral.dkrz.de']
# temporary directory for tailed scheduler files
TAIL_TMP_DIR = cfg['TAIL_TMP_DIR']  # '/tmp/tail_offset/'

###################################
#END  Website Setting
##################################
##################################


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

