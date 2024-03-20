"""Define the reverse proxy to the databrowserAPI in dev mode."""

from urllib.parse import urljoin

from django.conf import settings
from djproxy.views import HttpProxy


class DataBrowserProxy(HttpProxy):
    """A reverse proxy to forward requests to the databrowserAPI."""

    base_url = urljoin(settings.DATA_BROWSER_HOST, "/api/databrowser/")
    reverse_urls = [("/api/databrowser/", settings.DATA_BROWSER_HOST)]
