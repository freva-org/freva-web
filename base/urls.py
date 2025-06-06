from django.urls import re_path as url
from django.urls import path

import base.views

urlpatterns = [
    url(r"^$", base.views.home, name="home"),
    url(r"^logout", base.views.logout, name="logout"),
    url(r"^wiki", base.views.wiki, name="wiki"),
    url(r"^contact", base.views.contact, name="contact"),
    url(r"^restart", base.views.restart, name="restart"),
    url(r"^freva.cs", base.views.dynamic_css, name="dynamic_css"),
    url(r"^stacbrowser", base.views.stacbrowser, name="stacbrowser"),
    # url(r'^shell-in-a-box', 'shell_in_a_box', name='shell_in_a_box'),
]
