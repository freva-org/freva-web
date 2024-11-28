from urllib.parse import urljoin
from django.http import StreamingHttpResponse

from django.conf import settings
from djproxy.views import HttpProxy
from django.views import View

import requests

class ChatBotProxy(View):
    def get(self, request, *args, **kwargs):
        # Define the external API URL
        # base_url = urljoin(settings.CHAT_BOT_URL, "/api/chatbot/streamresponse?")
        django_path = request.path
        base_url = urljoin(settings.CHAT_BOT_URL, django_path)
        params = request.GET.dict()
        # Make the external API call with streaming enabled
        try:
            upstream_response = requests.get(base_url[:-1], params=params, stream=True)

            # Check if the response is successful
            upstream_response.raise_for_status()
        except requests.RequestException as e:
            return StreamingHttpResponse(
                f"Error while connecting to the external API: {str(e)}",
                status=502,
            )

        # Stream the content of the external API to the Django response
        def stream():
            for chunk in upstream_response.iter_content(chunk_size=8192):
                if chunk:  # Filter out keep-alive chunks
                    yield chunk

        # Set appropriate headers for the Django response
        response = StreamingHttpResponse(
            stream(), content_type=upstream_response.headers.get("Content-Type")
        )
        response["Content-Disposition"] = upstream_response.headers.get(
            "Content-Disposition", "inline"
        )
        # response["Content-Length"] = upstream_response.headers.get("Content-Length")

        # Add any other headers from the upstream response if necessary
        return response
