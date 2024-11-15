"""Define the reverse proxy to the databrowserAPI in dev mode."""

from urllib.parse import urljoin

from django.conf import settings
from djproxy.views import HttpProxy


class DataBrowserProxy(HttpProxy):
    """A reverse proxy to forward requests to the databrowserAPI."""

    base_url = urljoin(settings.DATA_BROWSER_HOST, "/api/freva-nextgen/databrowser/")
    reverse_urls = [("/api/freva-nextgen/databrowser/", settings.DATA_BROWSER_HOST)]
