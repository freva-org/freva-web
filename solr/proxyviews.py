"""Define the reverse proxy to the databrowserAPI in dev mode."""

from urllib.parse import urljoin

from django.conf import settings
from django.http import HttpResponse
from djproxy.views import HttpProxy


class CORSMixin:
    def dispatch(self, request, *args, **kwargs):
        if request.method == "OPTIONS":
            response = HttpResponse()
        else:
            response = super().dispatch(request, *args, **kwargs)

        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return response
class DataBrowserProxy(HttpProxy):
    """A reverse proxy to forward requests to the databrowserAPI."""

    base_url = urljoin(settings.DATA_BROWSER_HOST, "/api/freva-nextgen/databrowser/")
    reverse_urls = [("/api/freva-nextgen/databrowser/", settings.DATA_BROWSER_HOST)]


class DataPortalProxy(CORSMixin, HttpProxy):
    """A reverse proxy to forward requests to the data-portal API."""

    base_url = urljoin(settings.DATA_BROWSER_HOST, "/api/freva-nextgen/data-portal/")
    reverse_urls = [("/api/freva-nextgen/data-portal/", settings.DATA_BROWSER_HOST)]
    