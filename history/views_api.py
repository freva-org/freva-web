import json
import re
from django.db.models import Q
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.conf import settings
from django.urls import reverse
from django.core.cache import cache

from rest_framework.views import APIView
from rest_framework.response import Response

from history.models import History


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
                for facet_value in params[fac]:
                    queryset = queryset.filter(**self.get_filter_field(facet_value))

        return queryset

    def pre_filter(self, queryset, params):
        """pre_filter reduces the size of the queryset by performing a simple string search
        for the selected facets before generate_filter is doing regex-matching.
        This is not a necessary step but it reduced the amount of strings for
        the heavy regex operations which come afterwards

        Args:
            queryset (QuerySet): The current state of the database query
            params (dict): mapping of facets to actual values

        Returns:
            _type_: _description_
        """
        for facet_values in params.values():
            for value in facet_values:
                # the value we are looking for is either part of list (inside brackets and quotes)
                # or stands by itself
                queryset = queryset.filter(configuration__icontains=value)
        return queryset


def prepare_facet_filter(params):
    """The result-browser offers a facet-like functionality
    on the frontend by filtering JSON-configurations inside the
    SQL-Database.
    The facetting is based on RegEx-Filtering. prepare_facet_filter
    creates and returns all needed RegExes per facet.

    Args:
        params (dict): search parameters which were supplied via URL.
                       Mapping string -> list of strings

    Returns:
        dict: Mapping string -> list of strings
    """
    mod_request = {}
    for key, facet_values in params.items():
        mod_request[key] = []
        for value in facet_values:
            # the value we are looking for is either part of list (inside brackets and quotes)
            # or stands by itself
            value = f'((\[.*"{re.escape(value)}".*\])|("{re.escape(value)}"))'
            mod_request[key].append(r'"%s([0-9]{0,1})": %s' % (key, value))
    return mod_request


class ResultFacets(APIView, FilterAbstract):
    facets = settings.RESULT_BROWSER_FACETS
    filter_method = "iregex"
    filter_field = "configuration"

    def prepare_dummy_output(self):
        return {facet: {} for facet in self.facets}

    def extend_facet_dict(self, facet_dict, facets, facet_name):
        for i in facets:
            value = (
                1
                if i.lower() not in facet_dict[facet_name]
                else facet_dict[facet_name][i.lower()] + 1
            )
            facet_dict[facet_name][i.lower()] = value

    def prepare_facets(self, request, format=None):
        queryset = History.objects.filter(flag__lt=3, status__lt=2)

        query_params = request.query_params
        # query_params is not a normal dict and if you try
        # to select a key which was defined multiple times
        # inside the url (e.g. &variable=tas&variable=pr)
        # it will only provide us with the last value.
        # therefore a different approach to get all values..
        params = {key: query_params.getlist(key) for key in query_params}
        if "plugin" in params:
            queryset = queryset.filter(tool=params["plugin"].pop())
        queryset = self.pre_filter(queryset, params)
        mod_request = prepare_facet_filter(params)
        queryset = self.generate_filter(queryset, mod_request)
        facet_structure = []
        queryset = queryset.values_list("id", "tool", "configuration")
        filtered_results = []
        for id, tool, item in queryset:
            single_result = json.loads(item)
            single_result.update({"plugin": tool})
            filtered_results.append(single_result)

        # prepare emptyFacets;
        temporary_facet_structure = self.prepare_dummy_output()
        # create a dictionary - tags: list of attributes
        # counts tags: total number of attributes
        facet_set = set(self.facets)
        for item in filtered_results:
            facet_dedup = {}
            for facet_name, facet_value in item.items():
                facet_name = facet_name.lower()
                # Configuration is not a clean structure and
                # uses things like 'project1' and project2 to store
                # facetted values. We have to eliminate those
                # suffix numbers in order to recognize them properly
                facet_name = re.sub(r"\d+$", "", facet_name)
                if (
                    facet_name in facet_dedup
                    and str(facet_value) in facet_dedup[facet_name]
                ):
                    continue
                elif facet_name in facet_dedup:
                    facet_dedup[facet_name].add(str(facet_value))
                else:
                    facet_dedup[facet_name] = {str(facet_value)}
                if facet_name in facet_set and facet_value:
                    if isinstance(facet_value, list):
                        self.extend_facet_dict(
                            temporary_facet_structure,
                            facet_value,
                            facet_name,
                        )
                    else:
                        self.extend_facet_dict(
                            temporary_facet_structure, [str(facet_value)], facet_name
                        )
        facet_structure = {}
        for facet_name, facet_values in temporary_facet_structure.items():
            facet_structure[facet_name] = []
            for facet, count in sorted(facet_values.items()):
                facet_structure[facet_name].extend([facet, count])

        return {"data": facet_structure, "metadata": None}

    @method_decorator(cache_page(60 * 5))
    def get(self, request, format=None):
        result = self.prepare_facets(request)
        return Response(result)


class ResultFiles(APIView, FilterAbstract):
    filter_field = "configuration"
    filter_method = "iregex"
    facets = settings.RESULT_BROWSER_FACETS

    def _get_selected_facets(self, params):
        facets = set(self.facets)
        return {key: value for key, value in params.items() if key in facets}

    def get_data(self, configuration):
        data = []
        for item in configuration:
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

    def _prepare_queries(self, params):
        predefined_options = ["limit", "offset", "sortName", "sortOrder", "searchText"]
        queries = {}
        for item in predefined_options:
            if item in params:
                queries[item] = params[item][0]
        if "offset" not in queries:
            queries["offset"] = 0
        # In order to keep the get-request stable
        # we limit the amount of returned values if
        # a limit has not been proviced
        if "limit" not in queries:
            queries["limit"] = 25
        return queries

    def _get_order_by_key(self, queries):
        order_by_key = "-timestamp"
        if "sortName" in queries:
            if "sortOrder" in queries and queries["sortOrder"] == "desc":
                order_by_key = "-" + queries["sortName"]
            else:
                order_by_key = queries["sortName"]
        return order_by_key

    def get(self, request, format=None):
        """
        - get all History entries(configurations) and looks in configurations for a given searchText
        - due to performance reason: use regular expressions to find the given SearchText
        - cache the output - depends on the url
        - append new entries on existing cache
        - apply offset, sortName, sortOrder and searchText on cache results
        """
        full_path = request.get_full_path()
        max_entry = History.objects.filter(flag__lt=3, status__lt=2).latest("id")
        max_id = max_entry.id if max_entry else 0

        cache_max_id = cache.get(f"{full_path}_{max_id}", 0)
        # check if the most recent history_id is part of the cache.
        # If so, the cache does not need to be invalidated.
        # Getting the newest history_id is a quite fast operation
        # so in can be performed on each call.
        if max_id == cache_max_id:
            data = cache.get(full_path, list())
            if data:
                return Response(data)

        query_params = request.query_params
        params = {key: query_params.getlist(key) for key in query_params}

        queries = self._prepare_queries(params)
        order_by_key = self._get_order_by_key(queries)
        selected_facets = self._get_selected_facets(params)

        queryset = History.objects.filter(flag__lt=3, status__lt=2).order_by(
            order_by_key
        )

        if selected_facets or "searchText" in queries:
            if "plugin" in selected_facets:
                queryset = queryset.filter(tool=selected_facets["plugin"].pop())

            queryset = self.pre_filter(queryset, selected_facets)
            if "searchText" in queries and len(queries["searchText"]) > 0:
                # reduce the amount of search results by searching for the searchText
                searchText = queries["searchText"]
                queryset = queryset.filter(
                    Q(configuration__icontains=searchText)
                    | Q(caption__icontains=searchText)
                    | Q(uid__username__icontains=searchText)
                    | Q(tool__icontains=searchText)
                )

            mod_request = prepare_facet_filter(selected_facets)
            queryset = self.generate_filter(queryset, mod_request)

        results_found = queryset.count()
        queryset = queryset[
            int(queries["offset"]) : int(queries["offset"]) + int(queries["limit"])
        ]

        configuration = queryset.values(
            "id", "tool", "configuration", "uid", "timestamp", "caption"
        )

        data = self.get_data(configuration)
        result = {"data": data, "metadata": {"start": 0, "numFound": results_found}}
        # save the max_id and our output into cache
        cache.set(full_path, result, 5 * 60)
        cache.set(f"{full_path}_{max_id}", max_id, 5 * 60)

        return Response(result)
