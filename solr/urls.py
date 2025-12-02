"""
Created on 14.11.2013

@author: Sebastian Illing

urlconf for the solr application
"""

import os

from django.conf import settings
from django.urls import path
from django.urls import re_path as url

from .proxyviews import DataBrowserProxy, DataPortalProxy
from .views import databrowser, flavours_all_methods, share_zarr

urlpatterns = [
    url(r"^databrowser/$", databrowser, name="data_browser"),
    path("api/freva-nextgen/data-portal/share-zarr", share_zarr, name="share_zarr"),
]
if int(os.environ.get("DEV_MODE", "0")) == 1:
    urlpatterns.extend([
        url(
            r"^api/freva-nextgen/databrowser/flavours$",
            flavours_all_methods,
            name="flavours_no_slash",
        ),
        url(
            r"^api/freva-nextgen/databrowser/flavours/(?P<flavour_name>[^/]+)$",
            flavours_all_methods,
            name="flavours_with_name",
        ),
        path(
            r"api/freva-nextgen/databrowser/<path:url>/",
            DataBrowserProxy.as_view(),
            name="databrowser_proxy",
        ),
        path(
            r"api/freva-nextgen/data-portal/<path:url>",
            DataPortalProxy.as_view(),
            name="data_portal_proxy",
        ),
    ])