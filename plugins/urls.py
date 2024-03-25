from django.urls import include
from django.urls import re_path as url

import plugins.views

urlpatterns = [
    # url(r'^$', 'home', name='home'),
    # react views
    url(r"^$", plugins.views.plugin_list, name="home"),
    url(r"^(?P<plugin_name>\w+)/detail/$", plugins.views.detail, name="detail"),
    url(r"^about/$", plugins.views.list_docu, name="about"),
    url(r"^browse-files/$", plugins.views.dirlist, name="dirlist"),
    url(r"^browse-files-new/$", plugins.views.list_dir, name="list_dir"),
    url(r"^(?P<plugin_name>\w+)/setup/$", plugins.views.setup, name="setup"),
    url(
        r"^(?P<plugin_name>\w+)/(?P<row_id>\d+)/setup/$",
        plugins.views.setup,
        name="setup",
    ),
    url(
        r"^(?P<plugin_name>\w+)/similar-results/$",
        plugins.views.search_similar_results,
        name="similar",
    ),
    url(
        r"^(?P<history_id>\d+)/similar-results-by-id/$",
        plugins.views.search_similar_results,
        name="similar",
    ),
]
