from django.urls import re_path as url
import externaluser.views


urlpatterns = [
    url(r"^register/$", externaluser.views.external_register, name="external_register")
]
