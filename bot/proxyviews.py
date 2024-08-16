from urllib.parse import urljoin

from django.conf import settings
from djproxy.views import HttpProxy


class ChatBotProxy(HttpProxy):
    """A reverse proxy to forward requests to the databrowserAPI."""

    base_url = urljoin(settings.CHAT_BOT_URL, "/api/chatbot/")
    reverse_urls = [("/api/chatbot/", settings.CHAT_BOT_URL)]
