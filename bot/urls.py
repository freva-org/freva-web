import os

from django.urls import path, re_path

from .views import chatbot

urlpatterns = [
    re_path(r"^chatbot/", chatbot, name="chatbot"),
]
