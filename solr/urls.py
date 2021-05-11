"""
Created on 14.11.2013

@author: Sebastian Illing

urlconf for the solr application
"""

from django.urls import re_path as url
import solr.views

urlpatterns = [
    url(r'^solr-search/$', solr.views.solr_search, name='solr_search'),
    url(r'^data-browser/$', solr.views.databrowser, name='data_browser'),
    url(r'^ncdump/$', solr.views.ncdump, name='ncdump'),

    # react views
    #url(r'^data-browser-new/$', 'databrowser', name='databrowser'),
]
