"""
Created on 14.11.2013

@author: Sebastian Illing

views for the solr application
"""
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse

from evaluation_system.model.solr import SolrFindFiles
import freva
from django.conf import settings
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

    def reorder_results(res):
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
                results[cm] = res.pop(cm)
            except KeyError:
                pass
        for k, v in res.items():
            results[k] = v
        return results

    if facets:
        args["facet.limit"] = -1
        logging.debug(args)
        args.pop("facet")
        if facets == "*":
            # means select all,
            facets = None
        if facets == "experiment_prefix":
            args["experiment"] = args.pop("experiment_prefix")
            results = SolrFindFiles.facets(facets="experiment", **args)
            results["experiment_prefix"] = remove_year(results.pop("experiment"))
        else:
            if "experiment_prefix" in args:
                args["experiment"] = args.pop("experiment_prefix")[0] + "*"
            results = SolrFindFiles.facets(facets=facets, **args)
            results = reorder_results(results)

        return HttpResponse(
            json.dumps(dict(data=results)),
            content_type="application/json",
        )
    else:
        rows = 0
        if "rows" in args:
            rows = int(request.GET["rows"])
            args.pop("rows")
        metadata = SolrFindFiles.get_metadata(**args)
        if rows:
            args["rows"] = rows
        results = freva.databrowser(uniq_key="uri", **args)
        metadata_dict = {
            "numFound": metadata.num_objects,
            "docs": metadata.docs,
            "numFoundExact": metadata.exact,
            "start": metadata.start,
        }
        return HttpResponse(
            json.dumps(dict(data=sorted(results), metadata=metadata_dict)),
            content_type="application/json",
        )
