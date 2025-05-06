""" Default urlconf for django_evaluation """
from django.conf import settings
from django.conf.urls import static
from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.urls import include, path
from django.urls import re_path as url
from django.views.generic import RedirectView
from django_evaluation.auth import CustomOIDCCallbackView

from base.views_api import AuthenticatedUser
from history.views_api import ResultFacets, ResultFiles
from plugins.views_api import (
    ExportPlugin,
    PluginDetail,
    PluginsList,
    SendMailToDeveloper,
)
from solr.views_api import ncdump



from django.http import HttpResponseRedirect
from django.views.decorators.http import require_GET
import logging
import time
logger = logging.getLogger(__name__)

# @require_GET
# def oidc_token_callback(request):
#     """
#     Simple view to extract OIDC tokens from the session after authentication.
#     Should be called after OIDC authentication completes.
#     """
#     logger.info("OIDC token callback called")
    
#     if request.user.is_authenticated:
#         id_token = request.session.get('oidc_id_token')
#         access_token = request.session.get('oidc_auth_tokens', {}).get('access_token')
#         refresh_token = request.session.get('oidc_auth_tokens', {}).get('refresh_token')
        
#         if id_token:
#             # Store in our own keys
#             request.session['oidc_access_token'] = access_token
#             request.session['oidc_refresh_token'] = refresh_token
#             request.session['oidc_token_expiry'] = int(time.time()) + 3600  # 1 hour default
#             logger.info(f"Tokens extracted and stored in session")
        
#         next_url = request.session.get('oidc_login_next')
#         if next_url:
#             logger.info(f"Redirecting to: {next_url}")
#             del request.session['oidc_login_next']
#             return HttpResponseRedirect(next_url)
    
#     return HttpResponseRedirect('/')
admin.autodiscover()

urlpatterns = [
    url(r"^admin/doc/", include("django.contrib.admindocs.urls")),
    url(r"^admin/", admin.site.urls),
    url(r"^plugins/", include(("plugins.urls", "plugins"), namespace="plugins")),
    url(r"^history/", include(("history.urls", "history"), namespace="history")),
    url(r"", include(("solr.urls", "solr"), namespace="solr")),
    url(r"", include(("base.urls", "base"), namespace="base")),
    url(
        r"^favicon\.svg$",
        RedirectView.as_view(
            url=settings.STATIC_URL + "img/favicon.svg", permanent=True
        ),
    ),
    # API views
    url(r"^api/plugins/list/$", PluginsList.as_view(), name="api-plugin-list"),
    url(r"^api/plugins/export/$", ExportPlugin.as_view(), name="api-export-plugin"),
    url(
        r"^api/plugins/(?P<plugin_name>\w+)/$",
        PluginDetail.as_view(),
        name="api-plugin-detail",
    ),
    url(r"^api/users/active/$", AuthenticatedUser.as_view(), name="api-active-user"),
    url(
        r"^api/utils/mail-to-developer/$",
        SendMailToDeveloper.as_view(),
        name="api-mail-to-developer",
    ),
    url(r"^api/solr/ncdump/$", ncdump, name="api-ncdump"),
    url(
        r"^api/history/result-browser/$",
        ResultFacets.as_view(),
        name="api-history-list",
    ),
    url(
        r"^api/history/result-browser-files/$",
        ResultFiles.as_view(),
        name="api-history-files",
    ),
    path('oidc/callback/', CustomOIDCCallbackView.as_view(), name='oidc_authentication_callback'),

    path('oidc/', include('mozilla_django_oidc.urls')),
    # path('oidc-token-callback/', oidc_token_callback, name='oidc_token_callback'),

]

if settings.DEBUG:
    import debug_toolbar

    urlpatterns += [
        url(r"^__debug__/", include(debug_toolbar.urls)),
    ]

# In DEBUG mode, serve media files through Django.
if settings.DEBUG:
    urlpatterns += staticfiles_urlpatterns()
    # Remove leading and trailing slashes so the regex matches.
    urlpatterns += static.static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
