from pathlib import Path
import os
import logging
#import ldap
#import django_auth_ldap.config as ldap_cfg
#from django_auth_ldap.config import LDAPSearch, NestedGroupOfNamesType
import configparser
from django.urls import reverse_lazy
PROJECT_ROOT = str(Path(__file__).absolute().parents[2])
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(PROJECT_ROOT, 'static')
INSTITUTION_LOGO = STATIC_URL + 'img/RegiKlim_logo.png'
FREVA_LOGO = STATIC_URL + 'img/by_freva_transparent.png'
MAIN_COLOR = 'Tomato'
BORDER_COLOR = '#6c2e1f'
HOVER_COLOR = '#d0513a'

##########
#Here you can customize the footer and texts on the startpage
##########
ABOUT_US_TEXT = '''The Analysis Infrastructure (ANAIS) suite provides a standardized data and evaluation system for application within the RegIKlim (Regional information for action on climate change) and NUKLEUS (Usable local climate information for Germany) projects.'''
CONTACTS = ['bergemann@dkrz.de']
IMPRINT = ['ANAIS - RegIKlim', 'German Climate Computing Center (DKRZ)',
           'Bundesstr. 45a', '20146 Hamburg', 'Germany']
HOMEPAGE_HEADING = '<a href="https://www.fona.de/de/massnahmen/foerdermassnahmen/regionale-informationen-zum-klimahandeln.php" target=_blank>RegIKlim -  Regional information for action on climate change</a>'
HOMEPAGE_TEXT = '''The German research project RegIKlim, funded by  the Federal Ministry of Education and Research (BMBF),  aims at developing decision-relevant knowledge on climate change in municipalities and regions and to create a sound basis for regionally specific information and evaluation services.The project consists of two main categories:<br>

<ul>
<li><b>Regional Climate Modelling:</b> state of the art regional climate projections are beeing utilized to help informing climate change adoptation strategies in the second category.</li>
<li><b>Model Regions:</b> using climate change signals as well as spatial and landscape conditions information tools for decision making on regional climate change adoptation.</li>
<li><b>Integration:</b> the two interfaces will be supported by a dedicated integration module that will provide infrastructure to make high-resolution regional and local climate available. An additional integration aspect will be accompanying research and providing opportunities for cross projcet coorperation.
</ul>
'''
INSTITUTION_NAME = 'RegIKlim'
##################################################
##################################################
#SETTING FOR LDAP
#http://pythonhosted.org//django-auth-ldap/
##################################################
##################################################
# The server for LDAP configuration
#AUTH_LDAP_SERVER_URI = "ldap://mldap0.hpc.dkrz.de, ldap://mldap1.hpc.dkrz.de"
#AUTH_LDAP_START_TLS = True
#AUTH_LDAP_SERVER_URI = "ldap://idm.dkrz.de"
# The directory with SSL certificates
#CA_CERT_DIR = '/etc/pki/tls/certs'
# the only allowd group
#ALLOWED_GROUP = 'ch1187'
# Require a ca certificate
#AUTH_LDAP_GLOBAL_OPTIONS = {
#    ldap.OPT_X_TLS_REQUIRE_CERT: ldap.OPT_X_TLS_DEMAND, #TPYE OF CERTIFICATION
#    ldap.OPT_X_TLS_CACERTDIR: CA_CERT_DIR, #PATH OF CERTIFICATION
#}
# this is not used by django directly, but we use it for
# python-ldap access, as well.
#LDAP_USER_BASE = "cn=users,cn=accounts,dc=dkrz,dc=de"
# Verify the user by bind to LDAP
#AUTH_LDAP_USER_DN_TEMPLATE = "uid=%%(user)s, %s" % LDAP_USER_BASE
# keep the authenticated user for group search
#AUTH_LDAP_BIND_AS_AUTHENTICATING_USER=True
# ALLOWED_GROUP_MEMBER user only
#AUTH_LDAP_REQUIRE_GROUP = "cn=%s,cn=groups,cn=accounts,dc=dkrz,dc=de"  % ALLOWED_GROUP
#AUTH_LDAP_USER_ATTR_MAP = {
#    "email": "mail",
#    "last_name" : "sn",
#    "first_name" : "givenname",
#}
#AUTH_LDAP_GROUP_SEARCH = LDAPSearch('cn=groups,cn=accounts,dc=dkrz,dc=de',
 #                                    ldap.SCOPE_SUBTREE, #USE SUB
#                                     '(objectClass=groupOfNames)')
#AUTH_LDAP_GROUP_TYPE = NestedGroupOfNamesType()
#AUTH_LDAP_MIRROR_GROUPS = True
# agent user for LDAP
#LDAP_USER_DN = 'uid=dkrzagent,cn=sysaccounts,cn=etc,dc=dkrz,dc=de'
#LDAP_USER_PW = 'dkrzprox'
#LDAP_GROUP_BASE = 'cn=groups,cn=accounts,dc=dkrz,dc=de'
#LDAP_MIKLIP_GROUP_FILTER = '(cn=ch1187)'
#LDAP_MODEL = 'django_evaluation.ldaptools.MiklipUserInformation'
##################################################
##################################################
#END SETTING FOR LDAP
##################################################
##################################################
# the host to start the scheduler
SCHEDULER_HOSTS=['regiklim.dkrz.de']  # 'mistral.dkrz.de']
# temporary directory for tailed scheduler files
TAIL_TMP_DIR = '/opt/freva_web-dev/tail/'  # '/tmp/tail_offset/'
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
### DB settings through evaluation_system.conf file####
configParser = ConfigParser.RawConfigParser()   
#configFilePath = r PROJECT_ROOT+"\conda\etc\evaluation_system.conf"
configParser.read(PROJECT_ROOT+"\conda\etc\evaluation_system.conf")
db_name = configParser.get('evaluation_system', 'db.db')
db_user = configParser.get('your-config', 'db.user')
db_password = configParser.get('your-config', 'db.password')
db_host = configParser.get('your-config', 'db.host')
db_port = configParser.get('your-config', 'db.port')
## END DB settings through evaluation_system.conf file #######
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': db_name,
        'USER': db_user,
        'PASSWORD': db_password, #'miklip',
        'HOST': db_host, #'wwwdev-miklip',
        'PORT': db_port,
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
VENV_PYTHON_DIR = PROJECT_ROOT + '/venv/bin/python'
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

