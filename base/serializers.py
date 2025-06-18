from django.contrib.auth.models import User
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    isGuest = serializers.SerializerMethodField()
    scratch = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "scratch",
            "isGuest",
        )

    def get_isGuest(self, instance):
        """Check if the user is a guest."""
        request = self.context.get("request")
        if request.session.get("system_user_valid", False):
            return False
        return True

    def get_scratch(self, instance):
        """Get user scratch directory."""
        _user = self.context.get("user")
        if _user:
            return _user.getUserScratch()
        return None
