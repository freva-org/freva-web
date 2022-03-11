from django.apps import AppConfig
from django.contrib.auth.signals import user_logged_in


class BaseConfig(AppConfig):
    name = "base"

    def ready(self):
        from . import signals

        user_logged_in.connect(signals.create_user_workdir)
