"""
Created on 14.11.2013

@author: Sebastian Illing

urlconf for the solr application
"""

from django.urls import re_path as url
from django.urls import path
import solr.views

urlpatterns = [
    url(r"^databrowser/$", solr.views.databrowser, name="data_browser"),
    url(
        r"^api/databrowser/overview/$",
        solr.views.search_overview,
        name="databrowser_overview",
    ),
    path(
        "api/databrowser/extended-search/<str:flavour>/<str:unique_key>/",
        solr.views.extended_search,
        name="databrowser_extended_search",
    ),
    path(
        "api/databrowser/metadata-search/<str:flavour>/<str:unique_key>/",
        solr.views.metadata_search,
        name="databrowser_metadata_search",
    ),
    path(
        "api/databrowser/data-search/<str:flavour>/<str:unique_key>/",
        solr.views.data_search,
        name="databrowser_data_search",
    ),
    path(
        "api/databrowser/intake_catalogue/<str:flavour>/<str:unique_key>/",
        solr.views.intake_catalogue,
        name="databrowser_intake_catalogue",
    ),
]
