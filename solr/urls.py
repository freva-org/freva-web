"""
Created on 14.11.2013

@author: Sebastian Illing

urlconf for the solr application
"""
import os

from django.urls import re_path as url
from django.urls import path
from django.conf import settings
from .views import databrowser
from .proxyviews import DataBrowserProxy

urlpatterns = [
    url(r"^databrowser/$", databrowser, name="data_browser"),
]
if int(os.environ.get("DEV_MODE", "0")) == 1:
    urlpatterns.append(
        path(
            r"api/databrowser/<path:url>/",
            DataBrowserProxy.as_view(),
            name="databrowser_proxy",
        )
    )
