"""
Created on 14.11.2013

@author: Sebastian Illing

views for the solr application
"""
from typing import Union
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.shortcuts import redirect
from django.http import JsonResponse
from django.conf import settings
from urllib.parse import urlencode
import requests
import freva
import json
import logging


@login_required()
def databrowser(request):
    """
    New view for plugin list
    TODO: As we use react now, we should use ONE default view for all react pages
    """
    return render(request, "plugins/list.html", {"title": "Databrowser"})


def search(request, flavour, unique_key):
    return reverse_proxy(
        request, f"{settings.DATA_BROWSER_HOST}/metadata_search/{flavour}/{unique_key}"
    )


def get_single_facet(request, flavour):
    query_params = request.GET.copy()
    facets = query_params.getlist("facets")
    if len(facets) != 1:
        return JsonResponse(
            {"error": "Only one queried facet at a time allowed"}, status=400
        )
    facet = facets[0]

    query_params["max-results"] = 1
    request.GET = query_params

    response = reverse_proxy(
        request, f"{settings.DATA_BROWSER_HOST}/metadata_search/{flavour}/file"
    )
    print(response.content)
    data = json.loads(response.content)["facets"]
    if facet in data:
        return JsonResponse(
            {"facets": {facet: data[facet]}}, status=response.status_code
        )
    return JsonResponse({}, status=response.status_code)


def get_search_overview(request):
    return reverse_proxy(request, f"{settings.DATA_BROWSER_HOST}/overview")


def get_intake_catalogue(request, flavour, unique_key):
    return reverse_proxy(
        request, f"{settings.DATA_BROWSER_HOST}/intake_catalouge/{flavour}/{unique_key}"
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
