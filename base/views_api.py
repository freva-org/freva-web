from rest_framework.views import APIView
from rest_framework.response import Response

from base.LdapUser import LdapUser
from base.exceptions import UserNotFoundError
from .serializers import UserSerializer


class AuthenticatedUser(APIView):
    serializer_class = UserSerializer

    def get(self, request):
        if request.user.is_authenticated:
            try:
                user = LdapUser(request.user.username)
            except UserNotFoundError:
                user = None
            return Response(
                self.serializer_class(request.user, context={"user": user}).data
            )
        return Response({})  # False)
