"""
Created on 14.11.2013

@author: Sebastian Illing

urlconf for the solr application
"""

import os

from django.conf import settings
from django.urls import path
from django.urls import re_path as url

from .proxyviews import DataBrowserProxy
from .views import databrowser, flavours_all_methods

urlpatterns = [
    url(r"^databrowser/$", databrowser, name="data_browser"),
]
if int(os.environ.get("DEV_MODE", "0")) == 1:
    urlpatterns.extend([
        url(
            r"^api/freva-nextgen/databrowser/flavours$",
            flavours_all_methods,
            name="flavours_no_slash",
        ),
        path(
            r"api/freva-nextgen/databrowser/<path:url>/",
            DataBrowserProxy.as_view(),
            name="databrowser_proxy",
        ),
    ])