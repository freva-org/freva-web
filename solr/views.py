"""
Created on 14.11.2013

@author: Sebastian Illing

views for the solr application
"""

import logging
import json
from typing import Union
from urllib.parse import urlparse

import requests
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, QueryDict
from django.shortcuts import render


@login_required()
def share_zarr(request):
    """Handle presigned URL generation
    with origin translation to Django host"""
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        headers = {
            'Content-Type': 'application/json',
        }

        if request.user.is_authenticated:
            access_token = request.session.get('access_token')
            if access_token:
                headers['Authorization'] = f'Bearer {access_token}'

        response = requests.post(
            f"{settings.DATA_BROWSER_HOST}/api/freva-nextgen/data-portal/share-zarr",
            json=json.loads(request.body),
            headers=headers,
            timeout=100,
        )

        data = response.json()

        if "url" in data:
            parsed = urlparse(data["url"])
            django_host = request.get_host()
            data["url"] = data["url"].replace(f"{parsed.scheme}://{parsed.netloc}", f"{request.scheme}://{django_host}")
        return JsonResponse(data, status=response.status_code)
    except requests.RequestException as e:
        logging.error(f"Presigned URL request failed: {e}")
        return JsonResponse({"error": str(e)}, status=500)


@login_required()
def databrowser(request):
    """
    New view for plugin list
    TODO: As we use react now, we should use ONE default view for all react pages
    """
    return render(request, "plugins/list.html", {"title": "Databrowser"})


def search_overview(request):
    return reverse_proxy(
        request, f"{settings.DATA_BROWSER_HOST}/api/freva-nextgen/databrowser/overview"
    )


def extended_search(request, flavour, unique_key):
    return reverse_proxy(
        request,
        f"{settings.DATA_BROWSER_HOST}/api/freva-nextgen/databrowser/extended-search/{flavour}/{unique_key}",
    )


def data_search(request, flavour, unique_key):
    return reverse_proxy(
        request,
        f"{settings.DATA_BROWSER_HOST}/api/freva-nextgen/databrowser/data-search/{flavour}/{unique_key}",
    )


def metadata_search(request, flavour, unique_key):
    return reverse_proxy(
        request,
        f"{settings.DATA_BROWSER_HOST}/api/freva-nextgen/databrowser/metadata-search/{flavour}/{unique_key}",
    )


def intake_catalogue(request, flavour, unique_key):
    return reverse_proxy(
        request,
        f"{settings.DATA_BROWSER_HOST}/api/freva-nextgen/databrowser/intake-catalogue/{flavour}/{unique_key}",
    )

def stac_catalogue(request, flavour, unique_key):
    return reverse_proxy(
        request,
        f"{settings.DATA_BROWSER_HOST}/api/freva-nextgen/databrowser/stac-catalogue/{flavour}/{unique_key}",
    )

def flavours_all_methods(request, flavour_name=None):
    """Handle ALL requests to flavours endpoint"""
    if flavour_name:
        api_url = f"{settings.DATA_BROWSER_HOST}/api/freva-nextgen/databrowser/flavours/{flavour_name}"
    else:
        api_url = f"{settings.DATA_BROWSER_HOST}/api/freva-nextgen/databrowser/flavours"
    return reverse_proxy(request, api_url)

def get_all_parameters(query_string):
    query_dict = QueryDict(query_string)
    parameters = {}

    for key in query_dict.keys():
        values = query_dict.getlist(key)
        parameters[key] = values

    return parameters


def reverse_proxy(request, path):
    """reverse proxy with auth"""
    api_url = path
    query_string = request.META.get("QUERY_STRING", "")
    
    headers = {
        'Content-Type': request.content_type or 'application/json',
    }
    
    if request.user.is_authenticated:
        access_token = request.session.get('access_token')
        if access_token:
            headers['Authorization'] = f'Bearer {access_token}'
    
    try:
        all_parameters = get_all_parameters(query_string)
        if request.method == "GET":
            response = requests.request(
                method="GET",
                url=api_url,
                params=all_parameters,
                headers=headers,
                timeout=100,
            )
        else:
            # For POST, PUT, DELETE requests
            response = requests.request(
                method=request.method,
                url=api_url,
                data=request.body,
                params=all_parameters,
                headers=headers,
                timeout=100,
            )
        
        return JsonResponse(response.json(), status=response.status_code)
        
    except requests.RequestException as e:
        logging.error(f"Proxy request failed: {e}")
        return JsonResponse({"error": str(e)}, status=500)