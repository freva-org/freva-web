"""
Created on 14.11.2013

@author: Sebastian Illing

urlconf for the solr application
"""

from django.urls import re_path as url
from django.urls import path
import solr.views

urlpatterns = [
    url(r"^solr-search/$", solr.views.solr_search, name="solr_search"),
    url(r"^data-browser/$", solr.views.databrowser, name="data_browser"),
    path(
        "search/<str:core>/<str:unique_key>/",
        solr.views.search,
        name="api_search",
    ),
    url(
        r"^overview/$",
        solr.views.get_search_overview,
        name="api_search_overview",
    ),
]
