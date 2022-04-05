from rest_framework import serializers
from django.contrib.auth.models import User

from django_evaluation.settings.local import HOME_DIRS_AVAILABLE


class UserSerializer(serializers.ModelSerializer):
    home = serializers.SerializerMethodField()
    scratch = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "isGuest", "home", "scratch")

    def get_home(self, instance):
        if instance.username.lower() == "guest" or not HOME_DIRS_AVAILABLE:
            return None
        ldap_user = self.context.get("user")
        if ldap_user:
            return ldap_user.getUserHome()
        return None

    def get_scratch(self, instance):
        ldap_user = self.context.get("user")
        if ldap_user:
            return ldap_user.getUserScratch()
        return None
