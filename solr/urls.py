"""
Created on 14.11.2013

@author: Sebastian Illing

urlconf for the solr application
"""
import os

from django.urls import re_path as url
import solr.views

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
