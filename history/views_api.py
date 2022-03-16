import json
import re

from operator import itemgetter

from history.models import History
from rest_framework.views import APIView
from rest_framework.response import Response
from django.conf import settings
from django.urls import reverse
from django.core.cache import cache


class FilterAbstract(object):
    @property
    def filter_field(self):
        raise NotImplementedError("filter_field must be implemented")

    @property
    def filter_method(self):
        raise NotImplementedError("filter_method must be implemented")

    def get_filter_field(self, value):
        return {
            "%s__%s"
            % (
                self.filter_field,
                self.filter_method,
            ): value
        }

    def generate_filter(self, queryset, params):
        if hasattr(self, "predefined_filter"):
            queryset = queryset.filter(**self.get_filter_field(self.predefined_filter))

        for fac in params.keys():
            if not hasattr(self, "facets") or fac in self.facets:
                queryset = queryset.filter(**self.get_filter_field(params[fac]))

        return queryset


def prepare_facet_filter(params):
    mod_request = {}
    for key, value in params.items():
        # the value we are looking for is either part of list (inside brackets and quotes)
        # or stands by itself
        value = f'\[.*"{value}".*\]|{value}'
        mod_request[key] = r'"%s([0-9]{0,1})": "%s"' % (key, value)
    return mod_request


class ResultFacets(APIView, FilterAbstract):
    facets = settings.RESULT_BROWSER_FACETS
    filter_method = "iregex"
    filter_field = "configuration"

    def prepare_dummy_output(self):
        return {facet: {} for facet in self.facets}

    def extend_facet_dict(self, facet_dict, facets, facet_name):
        for i in facets:
            facet_dict[facet_name][i] = (
                1
                if i.lower() not in facet_dict[facet_name]
                else facet_dict[facet_name][i.lower()] + 1
            )

    def prepare_facets(self, request, format=None):
        queryset = History.objects.filter(flag__lt=3, status__lt=2)
        params = request.query_params.copy()
        if "plugin" in params:
            queryset = queryset.filter(tool=params["plugin"])
            del params["plugin"]
        mod_request = prepare_facet_filter(params)
        queryset = self.generate_filter(queryset, mod_request)
        facet_structure = []
        queryset = queryset.values_list("id", "tool", "configuration")
        filtered_results = []

        for id, tool, item in queryset:
            single_result = json.loads(item)
            if len(set(single_result.keys()) & set(self.facets)) == 0:
                continue
            single_result.update({"plugin": tool})
            filtered_results.append(single_result)

        # prepare emptyFacets;
        temporary_facet_structure = self.prepare_dummy_output()
        # create a dictionary - tags: list of attributes
        # counts tags: total number of attributes
        facet_set = set(self.facets)
        for item in filtered_results:
            for facet_name, facet_value in item.items():
                if facet_name not in facet_set or not facet_value:
                    continue
                if isinstance(facet_value, list):
                    self.extend_facet_dict(
                        temporary_facet_structure,
                        facet_value,
                        facet_name,
                    )
                else:
                    self.extend_facet_dict(
                        temporary_facet_structure, [(facet_value)], facet_name
                    )

        facet_structure = {}
        for facet_name, facet_values in temporary_facet_structure.items():
            facet_structure[facet_name] = []
            for facet, count in facet_values.items():
                facet_structure[facet_name].extend([facet, count])

        return {"data": facet_structure, "metadata": None}

    def get(self, request, format=None):
        result = cache.get(request.get_full_path())
        if not result:
            result = self.prepare_facets(request)
            cache.set(request.get_full_path(), result, None)
        return Response(result)


class ResultFiles(APIView, FilterAbstract):
    filter_field = "configuration"
    filter_method = "iregex"
    facets = settings.RESULT_BROWSER_FACETS

    def get_data(self, configuration):
        data = []
        for item in configuration:
            new_item = json.loads(item["configuration"])
            if len(set(new_item.keys()) & set(self.facets)) == 0:
                continue
            data.append(
                {
                    "id": item["id"],
                    "tool": item["tool"],
                    "configuration": item["configuration"],
                    "uid": item["uid"],
                    "timestamp": item["timestamp"].isoformat(),
                    "link2results": reverse("history:results", args=[item["id"]]),
                    "caption": item["caption"],
                }
            )

        return data

    def get(self, request, format=None):
        """
        - get all History entries(configurations) and looks in configurations for a given searchText
        - due to performance reason: use regular expressions to find the given SearchText
        - cache the output - depends on the url
        - append new entries on existing cache
        - apply offset, sortName, sortOrder and searchText on cache results
        """

        queryset = History.objects.filter(flag__lt=3, status__lt=2).order_by(
            "-timestamp"
        )
        full_path = request.get_full_path()
        params = request.query_params.copy()

        # filter- caching without options
        options = ["limit", "offset", "sortName", "sortOrder", "searchText"]
        queries = {}
        for item in options:
            if item in params:
                queries[item] = params[item]
            full_path = re.sub(r"&%s=(\d+|\w+)" % item, "", full_path)

        # new entries in database?
        max_entry = queryset.filter(flag__lt=3, status__lt=2).latest("id")
        max_id = max_entry.id if max_entry else 0
        cache_max_id = cache.get("{}_{}".format(full_path, max_id), 0)

        # append new entries
        data = cache.get(full_path, list())
        if max_id > cache_max_id or not data:
            if "plugin" in params:
                queryset = queryset.filter(tool=params["plugin"])
                del params["plugin"]
            mod_request = prepare_facet_filter(params)
            cache.set("{}_{}".format(full_path, max_id), max_id, None)
            queryset = queryset.filter(flag__lt=3, status__lt=2, id__gt=cache_max_id)
            queryset = self.generate_filter(queryset, mod_request)
            configuration = queryset.values(
                "id", "tool", "configuration", "uid", "timestamp", "caption"
            )
            data.extend(self.get_data(configuration))
            cache.set(full_path, data, None)

        # looking for searchText in configurations
        if "searchText" in queries and len(queries["searchText"]) > 0:
            searchText = queries["searchText"]
            data = list(filter(lambda s: searchText in json.dumps(s), data))

        # sort entries
        reverse_order = False
        if "sortOrder" in queries and queries["sortOrder"] == "desc":
            reverse_order = True
        if "sortName" in queries:
            data = sorted(
                data, key=itemgetter(queries["sortName"]), reverse=reverse_order
            )

        if "offset" in queries:
            result = {
                "data": data[
                    int(queries["offset"]) : int(queries["offset"])
                    + int(queries["limit"])
                ],
                "metadata": {"start": 0, "numFound": len(data)},
            }
        else:
            result = {"data": data, "metadata": {"start": 0, "numFound": len(data)}}
        return Response(result)
