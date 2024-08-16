from django.contrib.auth.models import User
from rest_framework import serializers

from django_evaluation.settings.local import HOME_DIRS_AVAILABLE


class UserSerializer(serializers.ModelSerializer):
    home = serializers.SerializerMethodField()
    scratch = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "isGuest",
            "home",
            "scratch",
        )

    def get_home(self, instance):
        if instance.username.lower() == "guest" or not HOME_DIRS_AVAILABLE:
            return None
        _user = self.context.get("user")
        if _user:
            return _user.getUserHome()
        return None

    def get_scratch(self, instance):
        _user = self.context.get("user")
        if _user:
            return _user.getUserScratch()
        return None
