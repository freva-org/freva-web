"""
Created on 14.11.2013

@author: Sebastian Illing

views for the solr application
"""
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.conf import settings
import requests


@login_required()
def databrowser(request):
    """
    New view for plugin list
    TODO: As we use react now, we should use ONE default view for all react pages
    """
    return render(request, "plugins/list.html", {"title": "Databrowser"})


def search_overview(request):
    return reverse_proxy(
        request, f"{settings.DATA_BROWSER_HOST}/api/databrowser/overview"
    )


def extended_search(request, flavour, unique_key):
    return reverse_proxy(
        request,
        f"{settings.DATA_BROWSER_HOST}/api/databrowser/extended_search/{flavour}/{unique_key}",
    )


def data_search(request, flavour, unique_key):
    return reverse_proxy(
        request,
        f"{settings.DATA_BROWSER_HOST}/api/databrowser/data_search/{flavour}/{unique_key}",
    )


def metadata_search(request, flavour, unique_key):
    return reverse_proxy(
        request,
        f"{settings.DATA_BROWSER_HOST}/api/databrowser/metadata_search/{flavour}/{unique_key}",
    )


def intake_catalogue(request, flavour, unique_key):
    return reverse_proxy(
        request,
        f"{settings.DATA_BROWSER_HOST}/api/databrowser/intake_catalogue/{flavour}/{unique_key}",
    )


def reverse_proxy(request, path):
    api_url = path
    print(api_url)
    try:
        response = requests.request(
            method="GET",
            url=api_url,
            params=request.GET,
            timeout=100,
        )
        return JsonResponse(response.json(), status=response.status_code)
    except requests.RequestException as e:
        print(e)
        return JsonResponse({"error": str(e)}, status=500)
