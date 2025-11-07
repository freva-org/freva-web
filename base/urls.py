import os

from django.conf import settings
from django.conf.urls.static import static
from django.urls import path
from django.urls import re_path
from django.urls import re_path as url
from django.views.static import serve

import base.views

from .views_api import proxy_auth_view, stacapi_proxy

urlpatterns = [
    url(r"^$", base.views.home, name="home"),
    url(r"^login/$", base.views.OIDCLoginView.as_view(), name="oidc_login"),
    url(r"^callback$", base.views.OIDCCallbackView.as_view(), name="oidc_callback"),
    url(r"^logout$", base.views.logout_view, name="logout"),
    url(r"^get-current-token/$", base.views.collect_current_token, name="collect_current_token"),
    url(r"^request-offline-token/$", base.views.request_offline_token, name="request_offline_token"),
    url(r"^wiki$", base.views.wiki, name="wiki"),
    url(r"^contact$", base.views.contact, name="contact"),
    url(r"^restart$", base.views.restart, name="restart"),
    url(r"^freva.cs", base.views.dynamic_css, name="dynamic_css"),
    url(r"^api/token-health/$", base.views.token_health_check, name="token_health"),
    url(r"^stacbrowser/?$", base.views.stacbrowser, name="stacbrowser"),
    url(r"^api/freva-nextgen/auth/(?P<path>.*)$", proxy_auth_view, name="auth_proxy"),
    # url(r'^shell-in-a-box', 'shell_in_a_box', name='shell_in_a_box'),
    re_path(r'^js/(?P<path>.*)$', serve, {
        'document_root': os.path.join(settings.PROJECT_ROOT, 'static_root', 'stac-browser', 'js'),
    }),
    re_path(r'^css/(?P<path>.*)$', serve, {
        'document_root': os.path.join(settings.PROJECT_ROOT, 'static_root', 'stac-browser', 'css'),
    }),
]

if int(os.environ.get("DEV_MODE", "0")) == 1:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += [
        re_path(r"^api/freva-nextgen/stacapi/?(?P<path>.*)$", stacapi_proxy, name="stacapi"),
    ]