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


@login_required()
def solr_search(request):
    args = dict(request.GET)
    try:
        facets = request.GET["facet"]
    except KeyError:
        facets = False

    # remove page_limit and the "_" argument
    # from out argument list in order to iterate through
    # it later. "_" is added by the jquery-ajax function
    # to prevent requests from caching
    args.pop("page_limit", None)
    args.pop("_", None)

    if "start" in args:
        args["start"] = int(request.GET["start"])
    if "time_select" in args:
        args["time_select"] = request.GET["time_select"]
    if "time" in args:
        args["time"] = request.GET["time"]

    metadata = None

    def remove_year(d):
        tmp = []
        for i, val in enumerate(d):
            try:
                if i % 2 == 0:
                    try:
                        int(val[-6:])
                        tmp_val = val[:-6]
                    except:
                        int(val[-4:])
                        tmp_val = val[:-4]
                    if tmp_val not in tmp:
                        tmp.append(tmp_val)
                        tmp.append(d[i + 1])
            except:
                tmp.append(val)
                tmp.append(d[i + 1])
        return tmp

    def reorder_results(
        res: dict[str, dict[str, int]]
    ) -> dict[str, list[Union[str, int]]]:
        import collections

        cmor = [
            "project",
            "product",
            "institute",
            "model",
            "experiment",
            "time_frequency",
            "realm",
            "variable",
            "ensemble",
            "data_type",
        ]
        results = collections.OrderedDict()
        for cm in cmor:
            try:
                results[cm] = [f for sub in res.pop(cm).items() for f in sub]
            except KeyError:
                pass
        for k, v in res.items():
            results[k] = [f for sub in v.items() for f in sub]

        return results

    if facets:
        args["facet.limit"] = -1
        logging.debug(args)
        args.pop("facet")
        if facets == "*":
            # means select all,
            results = reorder_results(freva.count_values(facet="*", **args))
        elif facets == "experiment_prefix":
            args["experiment"] = args.pop("experiment_prefix")
            results = reorder_results(freva.count_values(facet="experiment", **args))
            results["experiment_prefix"] = remove_year(results.pop("experiment"))
        else:
            if "experiment_prefix" in args:
                args["experiment"] = args.pop("experiment_prefix")[0] + "*"
            results = reorder_results(freva.count_values(facet=facets, **args))
        return HttpResponse(
            json.dumps(dict(data=results)),
            content_type="application/json",
        )
    else:
        rows = 0
        if "rows" in args:
            rows = int(request.GET["rows"])
            args.pop("rows")
        n_files = freva.count_values(**args)
        if rows:
            args["rows"] = rows
        results = freva.databrowser(uniq_key="file", **args)
        return HttpResponse(
            json.dumps(dict(data=sorted(results), metadata={"numFound": n_files})),
            content_type="application/json",
        )

def search(request, core, unique_key):
    return reverse_proxy(
        request, f"http://localhost:7777/metadata_search/{core}/{unique_key}"
    )


def get_search_overview(request):
    return reverse_proxy(request, "http://localhost:7777/overview")


def reverse_proxy(request, path):
    api_url = path
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
