import logging
from typing import Union

import requests
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from django.http import JsonResponse, QueryDict
from django.shortcuts import render


@login_required()
def chatbot(request):
    """
    New view for plugin list
    TODO: As we use react now, we should use ONE default view for all react pages
    """
    return render(request, "plugins/list.html", {"title": "Chat Bot"})


def ping(request):
    return reverse_proxy(request, f"{settings.CHAT_BOT_URL}/api/chatbot/ping")


def get_all_parameters(query_string):
    query_dict = QueryDict(query_string)
    parameters = {}

    for key in query_dict.keys():
        values = query_dict.getlist(key)
        parameters[key] = values

    return parameters

def get_auth_headers(request):
    """Collect authentication headers for chatbot backend."""
    headers = {}
    if hasattr(request, 'session'):
        user_info = request.session.get('user_info', {})
        access_token = user_info.get('access_token')
        refresh_token = user_info.get('refresh_token')
        token_type = user_info.get('token_type', 'Bearer')
        expires_at = user_info.get('expires_at')
        expires = user_info.get('expires')
        refresh_expires_at = user_info.get('refresh_expires_at')
        refresh_expires = user_info.get('refresh_expires')
        scope = user_info.get('scope', '')
        
        if access_token:
            token_type = token_type or 'Bearer'
            headers['X-Freva-Authorization'] = f'{token_type} {access_token}'
        if refresh_token:
            headers['X-Freva-Refresh-Token'] = refresh_token
        if expires_at:
            headers['X-Freva-Expires-At'] = expires_at
        if expires:
            headers['X-Freva-Expires'] = expires
        if refresh_expires_at:
            headers['X-Freva-Refresh-Expires-At'] = refresh_expires_at
        if refresh_expires:
            headers['X-Freva-Refresh-Expires'] = refresh_expires
        if scope:
            headers['X-Freva-Scope'] = scope
        if hasattr(request, 'user') and request.user.is_authenticated:
            headers['X-Freva-Username'] = request.user.username
    return headers

def reverse_proxy(request, path):
    api_url = path
    query_string = request.META["QUERY_STRING"]
    all_parameters = get_all_parameters(query_string)
    headers = get_auth_headers(request)
    try:
        response = requests.request(
            method="GET",
            url=api_url,
            params=all_parameters,
            headers=headers,
            stream=True,  # Enable streaming
            timeout=100,
        )
        return response.content
    except requests.RequestException as e:
        logging.error(e)
        return JsonResponse({"error": str(e)}, status=500)
