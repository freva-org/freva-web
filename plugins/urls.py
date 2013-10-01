"""urlconf for the base application"""

from django.conf.urls import url, patterns


urlpatterns = patterns('plugins.views',
    url(r'^$', 'home', name='home'),
    url(r'^browse-files/$', 'dirlist', name='dirlist'),
    url(r'^solr-search/$', 'solr_search', name='solr_search'),
    url(r'^(?P<plugin_name>\w+)/detail/$', 'detail', name='detail'),
    url(r'^(?P<plugin_name>\w+)/setup/$', 'setup', name='setup'),
    
)
